"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { FOUNDER_IMAGE } from "./ContactCard";

export interface CloudCardUi {
  name: string;
  title: string;
  body: string;
  cta: string;
}

/**
 * Invitation to /cloud for companies, shown next to the start card at the foot
 * of the blog index and every post. Same shape as the start card, with the
 * founder's photo where the wand icon sits, so the "book a call" promise has a
 * face on it.
 */
export default function CloudCard({ ui }: { ui: CloudCardUi }) {
  return (
    <Link
      href="/cloud"
      className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 rounded-2xl bg-white border border-neutral-200 hover:border-emerald-300 hover:shadow-md transition-all p-6"
    >
      <span className="relative shrink-0 self-start sm:self-auto">
        <Image
          src={FOUNDER_IMAGE}
          alt={ui.name}
          width={144}
          height={144}
          className="w-12 h-12 rounded-full object-cover border border-neutral-200"
        />
        <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-neutral-900 leading-snug">
            {ui.title}
          </span>
          <span
            dir="ltr"
            className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10.5px] font-semibold tracking-wide text-emerald-700"
          >
            Cloud
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
          {ui.body}
        </p>
      </div>
      <span className="shrink-0 inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
        {ui.cta}
        <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
      </span>
    </Link>
  );
}
