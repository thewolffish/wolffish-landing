"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import type { BlogPost } from "../../lib/blog";
import { timeAgo } from "../../lib/relativeTime";
import BlogMarkdown from "./BlogMarkdown";

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

export default function BlogArticle({ post }: { post: BlogPost }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const switchLocale = (next: string) => {
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Header */}
      <div className="fixed top-5 inset-x-0 z-20 flex items-center justify-between px-6">
        <Link
          href="/blog"
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <FaArrowLeft className="w-3 h-3 rtl:rotate-180" />
          <span className="font-medium">{t("blog.back")}</span>
        </Link>
        <button
          onClick={() => switchLocale(locale === "en" ? "ar" : "en")}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
        >
          {locale === "en" ? "عربي" : "EN"}
        </button>
      </div>

      {/* Article */}
      <div className="flex-1 flex flex-col items-center px-6 pt-24 pb-16">
        <article className="w-full max-w-2xl">
          <div className="flex items-center gap-3 text-sm text-white/40">
            <time>{post.date}</time>
            <span>·</span>
            <span>{timeAgo(post.date, locale)}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-8">
            {post.title}
          </h1>
          <BlogMarkdown content={post.content} />
        </article>
      </div>
    </div>
  );
}
