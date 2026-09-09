import { Resend } from "resend";
import {
  buildConfirmationEmail,
  buildNotificationEmail,
  FOUNDER_EMAIL,
  FOUNDER_NAME,
  type ScheduleLocale,
  type ScheduleRequest,
} from "@/lib/schedule-email";

// POST /api/schedule
// Receives the "schedule the security call" form from /cloud and sends two
// emails through Resend: a confirmation to the requester, and a notification
// to the founder. Nothing is stored anywhere else.

const FROM = `${FOUNDER_NAME} <${FOUNDER_EMAIL}>`;
const SEATS = new Set([
  "Under 200",
  "200 to 600",
  "600 to 2,500",
  "Over 2,500",
  "أقل من 200",
  "من 200 إلى 600",
  "من 600 إلى 2,500",
  "أكثر من 2,500",
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(body: Record<string, unknown>, key: string, max: number) {
  const value = body[key];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function parse(body: unknown): ScheduleRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid body." };
  const b = body as Record<string, unknown>;

  // Honeypot: real visitors never fill this hidden field.
  if (typeof b.website === "string" && b.website.trim()) return { error: "" };

  const name = field(b, "name", 120);
  const email = field(b, "email", 200);
  const company = field(b, "company", 160);
  const role = field(b, "role", 120);
  const seats = field(b, "seats", 40);
  const when = field(b, "when", 300);
  const message = field(b, "message", 3000);
  const locale: ScheduleLocale = b.locale === "ar" ? "ar" : "en";

  if (!name || !email || !company || !role || !seats) {
    return { error: "Missing required fields." };
  }
  if (!EMAIL_RE.test(email)) return { error: "Invalid email address." };
  if (!SEATS.has(seats)) return { error: "Invalid seat band." };

  return { name, email, company, role, seats, when, message, locale };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parse(body);

  if ("error" in parsed) {
    // An empty error means the honeypot tripped: answer as if it worked.
    if (!parsed.error) return Response.json({ ok: true });
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[schedule] RESEND_API_KEY is not configured");
    return Response.json(
      { ok: false, error: "Email is not configured." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const confirmation = buildConfirmationEmail(parsed);
  const notification = buildNotificationEmail(parsed);

  const [toRequester, toFounder] = await Promise.all([
    resend.emails.send({
      from: FROM,
      to: parsed.email,
      replyTo: FOUNDER_EMAIL,
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
      tags: [{ name: "surface", value: "cloud-schedule-confirmation" }],
    }),
    resend.emails.send({
      from: FROM,
      to: FOUNDER_EMAIL,
      replyTo: parsed.email,
      subject: notification.subject,
      html: notification.html,
      text: notification.text,
      tags: [{ name: "surface", value: "cloud-schedule-notification" }],
    }),
  ]);

  if (toRequester.error || toFounder.error) {
    console.error("[schedule] send failed", {
      requester: toRequester.error,
      founder: toFounder.error,
    });
    return Response.json(
      { ok: false, error: "Sending failed." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
