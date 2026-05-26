import { getLocale } from "next-intl/server";
import { getAllBlogPosts } from "../../../lib/blog";
import BlogList from "@/components/BlogList";

export default async function BlogPage() {
  const locale = await getLocale();
  const posts = getAllBlogPosts(locale);

  return (
    <main className="relative">
      <BlogList posts={posts} />
    </main>
  );
}
