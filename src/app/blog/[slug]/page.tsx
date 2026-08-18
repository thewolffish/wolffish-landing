import type { Metadata, Viewport } from "next";
import { getLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import BlogArticle, {
  type BlogArticleData,
  type BlogArticleUi,
} from "@/components/BlogArticle";
import { getBlogPost } from "../../../../lib/blog";

const SITE_URL = "https://wolffi.sh";

// Used only if the locale messages are missing the blog block entirely.
const START_CARD_FALLBACK = {
  title: "Get started in minutes",
  body: "Every guide on the start page is a complete recipe — from installing Wolffish to your first real result.",
  cta: "Start here",
};

interface BlogMessages {
  meta: { title: string; description: string };
  ui: BlogArticleUi & { categories: Record<string, string> };
}

type Params = { params: Promise<{ slug: string }> };

async function getBlogMessages(): Promise<BlogMessages | undefined> {
  const messages = await getMessages();
  return (messages as Record<string, unknown>).blog as BlogMessages | undefined;
}

export const viewport: Viewport = {
  themeColor: "#f7f8fa",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getBlogPost(slug, locale);
  if (!post) return {};

  const title = `${post.title} — Wolffish`;
  const image = post.image ?? "https://cdn.wolffi.sh/generic/banner.jpg";
  return {
    title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title,
      description: post.description,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: "Wolffish",
      type: "article",
      publishedTime: post.date,
      images: [{ url: image }],
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getBlogPost(slug, locale);
  if (!post) notFound();

  const blog = await getBlogMessages();
  const labels = blog?.ui.categories ?? {};

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    dateStyle: "long",
  });

  const data: BlogArticleData = {
    title: post.title,
    description: post.description,
    dateFormatted: dateFormat.format(new Date(post.date)),
    categories: post.categories.map((key) => ({ key, label: labels[key] ?? key })),
    image: post.image,
    content: post.content,
  };

  const ui: BlogArticleUi = blog?.ui ?? {
    backToBlog: "All posts",
    docs: "Docs",
    github: "GitHub",
    discord: "Discord",
    start: START_CARD_FALLBACK,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: locale === "ar" ? "ar" : "en",
    url: `${SITE_URL}/blog/${post.slug}`,
    image: post.image ?? "https://cdn.wolffi.sh/generic/banner.jpg",
    author: {
      "@type": "Organization",
      name: "Wolffish",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Wolffish",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: "https://cdn.wolffi.sh/generic/icon.png",
      },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <main className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogArticle post={data} ui={ui} locale={locale} />
    </main>
  );
}
