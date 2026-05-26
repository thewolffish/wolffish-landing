import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getAllSlugs, getBlogPost } from "../../../../lib/blog";
import BlogArticle from "@/components/BlogArticle";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
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
