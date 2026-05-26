import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getAllSlugs, getBlogPost } from "../../../../lib/blog";
import BlogArticle from "@/components/BlogArticle";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getBlogPost(slug, locale);

  if (!post) return {};

  const title = `${post.title} — Wolffish`;
  return {
    title,
    description: post.description,
    openGraph: {
      title,
      description: post.description,
      url: `https://wolffi.sh/blog/${slug}`,
      siteName: "Wolffish",
      type: "article",
      publishedTime: post.date,
      images: [{ url: "https://cdn.wolffi.sh/branding/og_image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
      images: ["https://cdn.wolffi.sh/branding/og_image.jpg"],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getBlogPost(slug, locale);

  if (!post) notFound();

  return (
    <main className="relative">
      <BlogArticle post={post} />
    </main>
  );
}
