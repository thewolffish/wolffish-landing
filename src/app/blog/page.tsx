import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getAllBlogPosts } from "../../../lib/blog";
import BlogList from "@/components/BlogList";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title =
    locale === "ar" ? "المدونة — وولف فيش" : "Blog — Wolffish";
  const description =
    locale === "ar"
      ? "مقالات عن الذكاء الاصطناعي الوكيل، البنية المستوحاة من الدماغ، والأنظمة مفتوحة المصدر."
      : "Articles on agentic AI, brain-inspired architecture, and open-source systems.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://wolffi.sh/blog",
      siteName: "Wolffish",
      type: "website",
      images: [{ url: "https://cdn.wolffi.sh/general/ogimage.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://cdn.wolffi.sh/general/ogimage.jpg"],
    },
  };
}

export default async function BlogPage() {
  const locale = await getLocale();
  const posts = getAllBlogPosts(locale);

  return (
    <main className="relative">
      <BlogList posts={posts} />
    </main>
  );
}
