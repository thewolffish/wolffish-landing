"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { BlogPost } from "../../lib/blog";
import { timeAgo } from "../../lib/relativeTime";
import { FaArrowLeft } from "react-icons/fa6";

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

export default function BlogList({ posts }: { posts: BlogPost[] }) {
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
          href="/"
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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-24 pb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">
          {t("blog.title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col backdrop-blur-md bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/10 hover:border-white/15 transition-all"
            >
              <div className="flex items-center justify-between text-xs text-white/40">
                <time>{post.date}</time>
                <span>{timeAgo(post.date, locale)}</span>
              </div>
              <h2 className="text-lg font-semibold text-white mt-2 mb-2 group-hover:text-white/90 truncate">
                {post.title}
              </h2>
              <p className="text-sm text-white/50 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                {post.description}
              </p>
              <span className="inline-block mt-auto pt-4 text-xs text-blue-400/80 group-hover:text-blue-400 transition-colors">
                {t("blog.readMore")} <span className="inline-block rtl:rotate-180">→</span>
              </span>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <p className="text-white/40 text-sm">{t("blog.empty")}</p>
        )}
      </div>
    </div>
  );
}
