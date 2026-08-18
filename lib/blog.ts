import fs from "fs";
import path from "path";

// Category buckets — generic groupings, not per-topic tags. Card chips and the
// filter row derive their labels from messages `blog.ui.categories.<key>`.
export const BLOG_CATEGORIES = [
  "news",
  "product",
  "guides",
  "market",
  "community",
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD) from frontmatter. */
  date: string;
  categories: BlogCategory[];
  image?: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const DEFAULT_LOCALE = "en";

function parseFrontmatter(raw: string): {
  fields: Record<string, string>;
  content: string;
} {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { fields: {}, content: raw };

  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)\s*$/);
    if (kv) fields[kv[1]] = kv[2].replace(/^['"]|['"]$/g, "");
  }
  return { fields, content: match[2] };
}

function parseCategories(value: string | undefined): BlogCategory[] {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((c) => c.trim().replace(/^['"]|['"]$/g, "").toLowerCase())
    .filter((c): c is BlogCategory =>
      (BLOG_CATEGORIES as readonly string[]).includes(c)
    );
}

function readPost(slug: string, locale: string): BlogPost | null {
  const file = path.join(BLOG_DIR, locale, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const { fields, content } = parseFrontmatter(fs.readFileSync(file, "utf-8"));
  if (!fields.title || !fields.date) return null;

  return {
    slug,
    title: fields.title,
    description: fields.description ?? "",
    date: fields.date,
    categories: parseCategories(fields.categories),
    image: fields.image || undefined,
    content,
  };
}

/** Union of slugs across locales, so a post missing one translation still lists. */
export function getBlogSlugs(): string[] {
  const slugs = new Set<string>();
  for (const locale of ["en", "ar"]) {
    const dir = path.join(BLOG_DIR, locale);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".md")) slugs.add(file.replace(/\.md$/, ""));
    }
  }
  return [...slugs];
}

/** Post in the requested locale, falling back to English when untranslated. */
export function getBlogPost(slug: string, locale: string): BlogPost | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return readPost(slug, locale) ?? readPost(slug, DEFAULT_LOCALE);
}

/** Whole days from today to the given date (negative = in the past). */
export function daysFromToday(date: string): number {
  return Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
}

/** All posts for a locale, newest first. */
export function getBlogPosts(locale: string): BlogPost[] {
  return getBlogSlugs()
    .map((slug) => getBlogPost(slug, locale))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
}
