import type { Metadata, Viewport } from "next";
import { getLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import DeckView, { type DeckData } from "@/components/DeckView";
import type { ScheduleFormUi } from "@/components/ScheduleCallForm";
import type { TeamData } from "@/components/TeamCards";
import "./deck.css";

const SITE_URL = "https://wolffi.sh";
const PAGE_URL = `${SITE_URL}/deck`;
const OG_IMAGE = "https://cdn.wolffi.sh/generic/banner.jpg";

interface DeckMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

type DeckMessages = DeckData & { meta: DeckMeta };

interface CloudSlice {
  schedule?: { form: ScheduleFormUi };
  founder?: { name: string; role: string };
  team?: TeamData;
}

/**
 * /deck reads its own namespace plus the pieces it shares with /cloud (the
 * booking form strings and the founder's name and role), so the same
 * offering is described from one source and the seat bands the API
 * validates stay in step.
 */
async function getDeckMessages() {
  const messages = (await getMessages()) as Record<string, unknown>;
  const deck = messages.deck as DeckMessages | undefined;
  const cloud = messages.cloud as CloudSlice | undefined;
  return { deck, form: cloud?.schedule?.form, founder: cloud?.founder, team: cloud?.team };
}

// Dark page, like the home page.
export const viewport: Viewport = {
  themeColor: "#040a18",
};

export async function generateMetadata(): Promise<Metadata> {
  const { deck } = await getDeckMessages();
  const locale = await getLocale();
  if (!deck?.meta) return {};

  const { title, description, ogTitle, ogDescription } = deck.meta;
  return {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: PAGE_URL,
      siteName: "Wolffish",
      type: "website",
      images: [{ url: OG_IMAGE, width: 2540, height: 1520, alt: "Wolffish Cloud" }],
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE],
    },
  };
}

export default async function DeckPage() {
  const locale = await getLocale();
  const { deck, form, founder, team } = await getDeckMessages();
  if (!deck || !form || !founder || !team) notFound();

  const { meta, ...data } = deck;

  // The deck is a short telling of the service described on /cloud, so it
  // points at that page's Service node rather than declaring a second one.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": PAGE_URL,
    name: meta.title,
    description: meta.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/cloud#service` },
    inLanguage: locale === "ar" ? "ar" : "en",
  };

  return (
    <main className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <DeckView
        data={data}
        form={form}
        founder={{ name: founder.name, role: founder.role }}
        team={team}
        locale={locale}
      />
    </main>
  );
}
