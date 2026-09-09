import type { Metadata, Viewport } from "next";
import { getLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import CloudView, { type CloudData } from "@/components/CloudView";

const SITE_URL = "https://wolffi.sh";
const PAGE_URL = `${SITE_URL}/cloud`;
const OG_IMAGE = "https://cdn.wolffi.sh/generic/banner.jpg";

interface CloudMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string[];
}

type CloudMessages = CloudData & { meta: CloudMeta };

async function getCloudMessages(): Promise<CloudMessages | undefined> {
  const messages = await getMessages();
  return (messages as Record<string, unknown>).cloud as
    | CloudMessages
    | undefined;
}

// Light page, like /start and /blog.
export const viewport: Viewport = {
  themeColor: "#f7f8fa",
};

export async function generateMetadata(): Promise<Metadata> {
  const cloud = await getCloudMessages();
  const locale = await getLocale();
  if (!cloud?.meta) return {};

  const { title, description, ogTitle, ogDescription, keywords } = cloud.meta;
  return {
    title,
    description,
    keywords,
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

export default async function CloudPage() {
  const locale = await getLocale();
  const cloud = await getCloudMessages();
  if (!cloud) notFound();

  const { meta, ...data } = cloud;

  // Structured data: the offering as a Service, plus the FAQ so search
  // engines and AI assistants can answer the objections directly.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${PAGE_URL}#service`,
        name: "Wolffish Cloud",
        serviceType: "In-perimeter agentic workforce platform",
        description: meta.description,
        url: PAGE_URL,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: { "@type": "Country", name: "Saudi Arabia" },
        audience: {
          "@type": "BusinessAudience",
          name: "Saudi-owned regulated enterprises of 200 to 600 knowledge workers",
        },
        offers: [
          {
            "@type": "Offer",
            name: "Deployment, one time",
            price: "60000",
            priceCurrency: "SAR",
            description: "Half at signature and half at go-live. Excludes 15 percent VAT.",
          },
          {
            "@type": "Offer",
            name: "Platform seat",
            price: "79",
            priceCurrency: "SAR",
            description: "Per employee per month, quarterly in advance, twelve-month term, minimum 200 seats. Excludes 15 percent VAT. Inference and infrastructure of SAR 45 to 55 per seat per month are billed by the customer's own providers at zero Wolffish margin.",
          },
        ],
        inLanguage: locale === "ar" ? "ar" : "en",
      },
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}#faq`,
        mainEntity: data.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <main className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <CloudView data={data} locale={locale} />
    </main>
  );
}
