// Email templates for the /cloud "schedule the security call" form.
// Plain HTML strings with inline styles so they read the same in every
// client, and a text alternative for each. Sent through Resend from
// src/app/api/schedule/route.ts.

export const FOUNDER_NAME = "Younes Alturkey";
export const FOUNDER_EMAIL = "younes@wolffi.sh";
export const FOUNDER_PHONE_DISPLAY = "+966 53 865 4514";
export const FOUNDER_PHONE = "+966538654514";
export const FOUNDER_IMAGE = "https://cdn.wolffi.sh/generic/younes-official.jpeg";
export const CLOUD_URL = "https://wolffi.sh/cloud";

export type ScheduleLocale = "en" | "ar";

export interface ScheduleRequest {
  name: string;
  email: string;
  company: string;
  role: string;
  seats: string;
  when: string;
  message: string;
  locale: ScheduleLocale;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim();
}

function riyadhNow() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
}

/* ---------- shared frame ---------- */

const FONT =
  "'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function frame(locale: ScheduleLocale, inner: string) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:${FONT};color:#171717;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;">
<tr><td style="padding:32px 32px 28px;text-align:${align};direction:${dir};">
${inner}
</td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#a3a3a3;font-family:${FONT};">Wolffish Cloud · <a href="${CLOUD_URL}" style="color:#a3a3a3;">wolffi.sh/cloud</a></p>
</td></tr>
</table>
</body></html>`;
}

function avatarBlock(locale: ScheduleLocale) {
  const role = locale === "ar" ? "المؤسس والمهندس، Wolffish" : "Founder & Engineer, Wolffish";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr>
<td style="padding-inline-end:12px;vertical-align:middle;">
<img src="${FOUNDER_IMAGE}" width="56" height="56" alt="${FOUNDER_NAME}" style="display:block;width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid #e5e5e5;">
</td>
<td style="vertical-align:middle;">
<div style="font-size:15px;font-weight:600;color:#171717;">${FOUNDER_NAME}</div>
<div style="font-size:13px;color:#737373;margin-top:2px;">${role}</div>
</td>
</tr>
</table>`;
}

function p(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#404040;">${text}</p>`;
}

function summaryTable(req: ScheduleRequest, labels: Record<keyof Omit<ScheduleRequest, "locale">, string>) {
  const rows: [string, string][] = [
    [labels.name, req.name],
    [labels.email, req.email],
    [labels.company, req.company],
    [labels.role, req.role],
    [labels.seats, req.seats],
    [labels.when, req.when],
    [labels.message, req.message],
  ];
  const dir = req.locale === "ar" ? "rtl" : "ltr";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;background:#f7f8fa;border:1px solid #e5e5e5;border-radius:12px;direction:${dir};">
${rows
  .filter(([, v]) => v && v.trim())
  .map(
    ([k, v]) => `<tr>
<td style="padding:9px 14px;font-size:12px;color:#737373;white-space:nowrap;vertical-align:top;border-bottom:1px solid #ececec;">${escapeHtml(k)}</td>
<td dir="auto" style="padding:9px 14px;font-size:14px;color:#171717;vertical-align:top;border-bottom:1px solid #ececec;white-space:pre-wrap;">${escapeHtml(v)}</td>
</tr>`
  )
  .join("\n")}
</table>`;
}

function signature(locale: ScheduleLocale) {
  const line = locale === "ar" ? "مع خالص التقدير،" : "Warm regards,";
  return `<p style="margin:18px 0 0;font-size:15px;line-height:1.65;color:#404040;">${line}<br>
<strong style="color:#171717;">${FOUNDER_NAME}</strong><br>
<span style="color:#737373;font-size:13px;">${locale === "ar" ? "المؤسس والمهندس، Wolffish" : "Founder & Engineer, Wolffish"}</span><br>
<a href="mailto:${FOUNDER_EMAIL}" style="color:#059669;text-decoration:none;font-size:13px;">${FOUNDER_EMAIL}</a>
<span style="color:#d4d4d4;">·</span>
<a href="https://wa.me/${FOUNDER_PHONE.replace("+", "")}" style="color:#059669;text-decoration:none;font-size:13px;" dir="ltr">${FOUNDER_PHONE_DISPLAY}</a></p>`;
}

const LABELS = {
  en: {
    name: "Name",
    email: "Email",
    company: "Company",
    role: "Role",
    seats: "Knowledge workers",
    when: "Preferred time",
    message: "Notes",
  },
  ar: {
    name: "الاسم",
    email: "البريد",
    company: "الشركة",
    role: "المنصب",
    seats: "العاملون المعرفيون",
    when: "الوقت المفضل",
    message: "ملاحظات",
  },
} as const;

/* ---------- 1. confirmation to the person who asked for the call ---------- */

export function buildConfirmationEmail(req: ScheduleRequest) {
  const first = escapeHtml(firstName(req.name));
  const labels = LABELS[req.locale];

  if (req.locale === "ar") {
    const subject = `مكالمتكم الأمنية مع Wolffish Cloud، ${firstName(req.name)}`;
    const html = frame(
      "ar",
      avatarBlock("ar") +
        p(`أهلاً ${first}،`) +
        p("شكراً لطلبكم المكالمة الأمنية. وصلني طلبكم بنفسي، وسأردّ عليكم قريباً لتأكيد موعد يناسبكم.") +
        p("قبل المكالمة بيومي عمل سأرسل لكم مخطط البنية، حتى نصرف الثلاثين دقيقة في أسئلة فريقكم لا في القراءة. أحضروا فريق الأمن معكم، فالمكالمة لهم.") +
        p("وهذا ما أرسلتموه، للرجوع إليه:") +
        summaryTable(req, labels) +
        p("إن كان هناك ما تودّون إضافته قبل المكالمة، فردّوا على هذه الرسالة مباشرة أو راسلوني على واتساب. أعمل من الأحد إلى الخميس بتوقيت الرياض.") +
        p("وإن تبيّن في المكالمة أننا لسنا الخيار المناسب لكم، سأقولها لكم بصراحة. هذا وعد.") +
        signature("ar")
    );
    const text = [
      `أهلاً ${firstName(req.name)}،`,
      "",
      "شكراً لطلبكم المكالمة الأمنية. وصلني طلبكم بنفسي، وسأردّ عليكم قريباً لتأكيد موعد يناسبكم.",
      "",
      "قبل المكالمة بيومي عمل سأرسل لكم مخطط البنية. أحضروا فريق الأمن معكم، فالمكالمة لهم.",
      "",
      `${labels.company}: ${req.company}`,
      `${labels.role}: ${req.role}`,
      `${labels.seats}: ${req.seats}`,
      req.when ? `${labels.when}: ${req.when}` : "",
      req.message ? `${labels.message}: ${req.message}` : "",
      "",
      "وإن تبيّن في المكالمة أننا لسنا الخيار المناسب لكم، سأقولها لكم بصراحة.",
      "",
      "مع خالص التقدير،",
      FOUNDER_NAME,
      "المؤسس والمهندس، Wolffish",
      `${FOUNDER_EMAIL} · ${FOUNDER_PHONE_DISPLAY}`,
    ]
      .filter((l) => l !== "")
      .join("\n");
    return { subject, html, text };
  }

  const subject = `Your Wolffish Cloud security call, ${firstName(req.name)}`;
  const html = frame(
    "en",
    avatarBlock("en") +
      p(`Hi ${first},`) +
      p("Thank you for asking for the security call. Your request landed with me personally, and I will reply shortly to confirm a time that works for you.") +
      p("Two working days before the call I will send you the architecture diagram, so the thirty minutes go to your team's questions rather than to reading. Bring your security team. The call is for them.") +
      p("Here is what you sent, for your records:") +
      summaryTable(req, labels) +
      p("If there is anything you would like to add before we speak, reply to this email or message me on WhatsApp. I work Sunday to Thursday, Riyadh time.") +
      p("And if it turns out on the call that we are not the right fit for you, I will say so plainly. That is a promise.") +
      signature("en")
  );
  const text = [
    `Hi ${firstName(req.name)},`,
    "",
    "Thank you for asking for the security call. Your request landed with me personally, and I will reply shortly to confirm a time that works for you.",
    "",
    "Two working days before the call I will send you the architecture diagram. Bring your security team. The call is for them.",
    "",
    `${labels.company}: ${req.company}`,
    `${labels.role}: ${req.role}`,
    `${labels.seats}: ${req.seats}`,
    req.when ? `${labels.when}: ${req.when}` : "",
    req.message ? `${labels.message}: ${req.message}` : "",
    "",
    "If it turns out on the call that we are not the right fit for you, I will say so plainly.",
    "",
    "Warm regards,",
    FOUNDER_NAME,
    "Founder & Engineer, Wolffish",
    `${FOUNDER_EMAIL} · ${FOUNDER_PHONE_DISPLAY}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
  return { subject, html, text };
}

/* ---------- 2. notification to the founder ---------- */

export function buildNotificationEmail(req: ScheduleRequest) {
  const labels = LABELS.en;
  const subject = `New scheduled call · ${req.name} at ${req.company} · ${req.seats}`;
  const stamp = riyadhNow();
  const html = frame(
    "en",
    `<div style="display:inline-block;padding:4px 10px;border-radius:999px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin-bottom:14px;">New scheduled call</div>` +
      `<h1 style="margin:0 0 6px;font-size:20px;line-height:1.3;color:#171717;">${escapeHtml(req.name)} at ${escapeHtml(req.company)}</h1>` +
      `<p style="margin:0 0 16px;font-size:13px;color:#737373;">${escapeHtml(stamp)} Riyadh · form language: ${req.locale === "ar" ? "Arabic" : "English"} · wolffi.sh/cloud</p>` +
      summaryTable({ ...req, locale: "en" }, labels) +
      p(`Reply to this email to reach ${escapeHtml(firstName(req.name))} directly. A confirmation from you has already gone to <a href="mailto:${escapeHtml(req.email)}" style="color:#059669;">${escapeHtml(req.email)}</a>.`)
  );
  const text = [
    `New scheduled call: ${req.name} at ${req.company} (${req.seats})`,
    `${stamp} Riyadh · form language: ${req.locale}`,
    "",
    `${labels.name}: ${req.name}`,
    `${labels.email}: ${req.email}`,
    `${labels.company}: ${req.company}`,
    `${labels.role}: ${req.role}`,
    `${labels.seats}: ${req.seats}`,
    req.when ? `${labels.when}: ${req.when}` : "",
    req.message ? `${labels.message}: ${req.message}` : "",
    "",
    `Reply to this email to reach ${firstName(req.name)} directly. A confirmation has already gone to ${req.email}.`,
  ]
    .filter((l) => l !== "")
    .join("\n");
  return { subject, html, text };
}
