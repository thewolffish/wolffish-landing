import fs from "fs";
import path from "path";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "lib", "blog");

function parseFrontmatter(raw: string): {
  meta: Omit<BlogPost, "slug" | "content">;
  content: string;
} {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { meta: { title: "", description: "", date: "" }, content: raw };

  const block = match[1];
  const content = match[2];

  const get = (key: string) =>
    block.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, "m"))?.[1] ?? "";

  return {
    meta: { title: get("title"), description: get("description"), date: get("date") },
    content,
  };
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((entry) => {
      const full = path.join(BLOG_DIR, entry);
      return fs.statSync(full).isDirectory();
    });
}

export function getAllBlogPosts(locale: string): BlogPost[] {
  return getAllSlugs()
    .map((slug) => {
      const file = path.join(BLOG_DIR, slug, `${locale}.md`);
      if (!fs.existsSync(file)) return null;
      const { meta, content } = parseFrontmatter(fs.readFileSync(file, "utf-8"));
      return { slug, ...meta, content };
    })
    .filter((p): p is BlogPost => p !== null && p.title !== "")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPost(slug: string, locale: string): BlogPost | null {
  const file = path.join(BLOG_DIR, slug, `${locale}.md`);
  if (!fs.existsSync(file)) return null;
  const { meta, content } = parseFrontmatter(fs.readFileSync(file, "utf-8"));
  if (!meta.title) return null;
  return { slug, ...meta, content };
}
