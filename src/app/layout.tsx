import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import OceanSceneClient from "@/components/OceanSceneClient";
import "./globals.css";

const ibmPlexSansArabic = localFont({
  src: [
    {
      path: "../../public/fonts/IBMPlexSansArabic-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/IBMPlexSansArabic-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/IBMPlexSansArabic-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/IBMPlexSansArabic-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/IBMPlexSansArabic-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  const title =
    locale === "ar"
      ? "وولف فيش — ذكاء لا يكتفي بالتفكير بل يُنفّذ"
      : "Wolffish — AI that doesn't just think, it acts";
  const description =
    locale === "ar"
      ? "وكيل ذكي يعمل على جهازك مباشرة. يفكّر، يُنفّذ، ويتفاعل مع ملفاتك وأدواتك. بلا سحابة. بلا حدود."
      : "A desktop agent with full access to your machine. Automate, create, and execute — entirely local. No cloud required.";

  return {
    title,
    description,
    icons: {
      icon: "https://cdn.wolffi.sh/branding/icon.png",
      apple: "https://cdn.wolffi.sh/branding/icon.png",
    },
    openGraph: {
      title,
      description,
      url: "https://wolffi.sh",
      siteName: "Wolffish",
      images: [
        {
          url: "https://cdn.wolffi.sh/branding/og_image.jpg",
          width: 1200,
          height: 630,
          alt: "Wolffish",
        },
      ],
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://cdn.wolffi.sh/branding/og_image.jpg"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#040a18",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={ibmPlexSansArabic.className}>
      <body className="bg-[#040a18]">
        <NextIntlClientProvider messages={messages}>
          <OceanSceneClient />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
