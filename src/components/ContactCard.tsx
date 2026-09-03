"use client";

import Image from "next/image";
import { FaEnvelope, FaPhone, FaWhatsapp } from "react-icons/fa6";

// The founder's contact details, shared with the Wolffish Cloud API page
// (apps/api/src/page.ts in wolffish-cloud) so both surfaces stay in step.
export const FOUNDER_IMAGE = "https://cdn.wolffi.sh/generic/younes-official.jpeg";
export const FOUNDER_EMAIL = "younes@wolffi.sh";
export const FOUNDER_PHONE = "+966538654514";
export const FOUNDER_PHONE_DISPLAY = "+966 53 865 4514";

/** WhatsApp deep link — opens the app on phones, WhatsApp Web on desktops. */
export function whatsappUrl(text: string) {
  return `https://wa.me/966538654514?text=${encodeURIComponent(text)}`;
}

export interface FloatingContactUi {
  title: string;
  desc: string;
}

/**
 * Persistent contact card — the same shape as the floating "get started"
 * card on the home page: a slim bar on phones, a bottom-end widget from sm
 * up (bottom-right in LTR, bottom-left in RTL), but light-themed and with
 * the founder's photo where the wand icon sits.
 */
export function FloatingContactCard({
  ui,
  name,
  href,
}: {
  ui: FloatingContactUi;
  name: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-5 sm:end-5 sm:max-w-[300px] z-30 flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur-md border border-neutral-200 hover:border-emerald-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.16)] transition-all px-4 py-3"
    >
      <span className="relative shrink-0">
        <Image
          src={FOUNDER_IMAGE}
          alt={name}
          width={144}
          height={144}
          className="w-10 h-10 rounded-full object-cover border border-neutral-200"
        />
        <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-neutral-900 leading-snug">
          {ui.title}
        </span>
        <span className="block text-[11px] text-neutral-500 leading-snug mt-0.5">
          {ui.desc}
        </span>
      </span>
      <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 group-hover:bg-emerald-600 group-hover:border-emerald-600 flex items-center justify-center shrink-0 transition-colors">
        <FaWhatsapp className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
      </span>
    </a>
  );
}

export interface FounderUi {
  name: string;
  role: string;
  body: string[];
  emailLabel: string;
  phoneLabel: string;
  whatsapp: string;
}

/** The full contact card: photo, name, role, bio, and every way to reach out. */
export function FounderCard({
  ui,
  whatsappHref,
}: {
  ui: FounderUi;
  whatsappHref: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8">
      <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 shrink-0 md:w-44">
        <Image
          src={FOUNDER_IMAGE}
          alt={ui.name}
          width={288}
          height={288}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border border-neutral-200 shadow-sm"
        />
        <div>
          <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
            {ui.name}
          </div>
          <div className="mt-0.5 text-[13px] text-neutral-500">{ui.role}</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="space-y-3">
          {ui.body.map((paragraph) => (
            <p
              key={paragraph}
              className="text-sm leading-relaxed text-neutral-600"
            >
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            <FaWhatsapp className="w-3.5 h-3.5" />
            {ui.whatsapp}
          </a>
          <a
            href={`mailto:${FOUNDER_EMAIL}`}
            aria-label={ui.emailLabel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-neutral-200 text-xs font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 transition-colors"
          >
            <FaEnvelope className="w-3 h-3 text-neutral-400" />
            <span dir="ltr">{FOUNDER_EMAIL}</span>
          </a>
          <a
            href={`tel:${FOUNDER_PHONE}`}
            aria-label={ui.phoneLabel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-neutral-200 text-xs font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 transition-colors"
          >
            <FaPhone className="w-3 h-3 text-neutral-400" />
            <span dir="ltr">{FOUNDER_PHONE_DISPLAY}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
