"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import {
  FaArrowLeft,
  FaBook,
  FaCalendar,
  FaDiscord,
  FaGithub,
} from "react-icons/fa6";
import StartCard, { type StartCardUi } from "./StartCard";

export interface BlogArticleData {
  title: string;
  description: string;
  dateFormatted: string;
  categories: { key: string; label: string }[];
  image?: string;
  content: string;
}

export interface BlogArticleUi {
  backToBlog: string;
  docs: string;
  github: string;
  discord: string;
  start: StartCardUi;
}

const DOCS_URL = "https://docs.wolffi.sh";
const GITHUB_URL = "https://github.com/thewolffish/wolffish-app";
const DISCORD_URL = "https://discord.gg/zWJpD3SgTt";

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

// Light-theme markdown typography, matching the /start page's look.
const markdownComponents: Components = {
  h1: (props) => (
    <h2 className="text-2xl font-bold text-neutral-900 mt-10 mb-3" {...props} />
  ),
  h2: (props) => (
    <h2 className="text-2xl font-bold text-neutral-900 mt-10 mb-3" {...props} />
  ),
  h3: (props) => (
    <h3 className="text-lg font-semibold text-neutral-900 mt-7 mb-2" {...props} />
  ),
  p: (props) => (
    <p className="text-[15px] leading-relaxed text-neutral-700 mb-4" {...props} />
  ),
  ul: (props) => (
    <ul
      className="list-disc ps-5 text-[15px] leading-relaxed text-neutral-700 mb-4 space-y-1.5"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="list-decimal ps-5 text-[15px] leading-relaxed text-neutral-700 mb-4 space-y-1.5"
      {...props}
    />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => (
    <strong className="text-neutral-900 font-semibold" {...props} />
  ),
  a: (props) => (
    <a
      className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800 hover:decoration-emerald-500 transition-colors"
      {...props}
    />
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="text-[13px] font-mono text-neutral-100" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-[13px] font-mono text-neutral-800"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: (props) => (
    <pre
      dir="ltr"
      className="bg-neutral-900 rounded-xl p-4 overflow-x-auto mb-5 text-left"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-s-4 border-emerald-300 ps-4 text-neutral-600 italic my-5"
      {...props}
    />
  ),
  hr: () => <hr className="border-neutral-200 my-8" />,
};

export default function BlogArticle({
  post,
  ui,
  locale,
}: {
  post: BlogArticleData;
  ui: BlogArticleUi;
  locale: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const switchLocale = (next: string) => {
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col bg-[#f7f8fa] text-neutral-900">
      {/* Top bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <Link
          href="/blog"
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <FaArrowLeft className="w-3 h-3 rtl:rotate-180" />
          <span className="font-medium">{ui.backToBlog}</span>
        </Link>
        <button
          onClick={() => switchLocale(locale === "en" ? "ar" : "en")}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 transition-all cursor-pointer"
        >
          {locale === "en" ? "عربي" : "EN"}
        </button>
      </header>

      {/* Article */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-6 pt-6 md:pt-10 pb-16">
        <article>
          <div className="flex flex-wrap items-center gap-2">
            {post.categories.map((cat) => (
              <span
                key={cat.key}
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-medium text-emerald-700"
              >
                {cat.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-neutral-400">
              <FaCalendar className="w-3 h-3" />
              {post.dateFormatted}
            </span>
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-500">
            {post.description}
          </p>

          {post.image && (
            <div className="relative aspect-[2/1] mt-7 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="mt-8">
            <ReactMarkdown components={markdownComponents}>
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* Start here */}
        <div className="mt-12">
          <StartCard ui={ui.start} />
        </div>

        {/* Bottom nav */}
        <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <FaArrowLeft className="w-3 h-3 rtl:rotate-180" />
            {ui.backToBlog}
          </Link>
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
            >
              <FaBook className="w-3.5 h-3.5" />
              {ui.docs}
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
            >
              <FaGithub className="w-3.5 h-3.5" />
              {ui.github}
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
            >
              <FaDiscord className="w-3.5 h-3.5" />
              {ui.discord}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
