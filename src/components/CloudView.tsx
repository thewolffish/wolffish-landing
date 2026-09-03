"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBan,
  FaBolt,
  FaBook,
  FaCalendarCheck,
  FaCheck,
  FaChevronDown,
  FaCode,
  FaCoins,
  FaComment,
  FaEnvelope,
  FaEyeSlash,
  FaFileShield,
  FaGaugeHigh,
  FaGithub,
  FaIdBadge,
  FaLaptopCode,
  FaListCheck,
  FaLocationDot,
  FaMicrochip,
  FaPenNib,
  FaScrewdriverWrench,
  FaServer,
  FaShieldHalved,
  FaUserSecret,
  FaUserShield,
  FaUsers,
  FaWandMagicSparkles,
  FaWhatsapp,
  FaXmark,
} from "react-icons/fa6";
import {
  FloatingContactCard,
  FounderCard,
  FOUNDER_EMAIL,
  whatsappUrl,
  type FloatingContactUi,
  type FounderUi,
} from "./ContactCard";

/* ---------- data shapes (read from messages/*.json "cloud" in app/cloud/page.tsx) ---------- */

export interface CloudIconItem {
  icon: string;
  title: string;
  desc: string;
}

export interface CloudTitled {
  title: string;
  desc: string;
}

export interface CloudUi {
  home: string;
  tag: string;
  primaryCta: string;
  secondaryCta: string;
  pricingCta: string;
  securityCta: string;
  micro: string;
  whatsappText: string;
  whatsappPricingText: string;
  emailSubject: string;
  docs: string;
  blog: string;
  github: string;
  email: string;
  saudiMade: string;
  footerLine: string;
}

export interface CloudData {
  ui: CloudUi;
  hero: { title: string; lead: string; trust: string[] };
  pillars: { label: string; items: CloudIconItem[] };
  problem: { label: string; title: string; body: string[]; cards: CloudIconItem[] };
  insight: {
    label: string;
    title: string;
    lead: string;
    points: CloudTitled[];
    outro: string;
  };
  platform: {
    label: string;
    title: string;
    body: string[];
    features: CloudIconItem[];
  };
  how: {
    label: string;
    title: string;
    steps: CloudTitled[];
    timeline: { label: string; value: string }[];
  };
  security: {
    label: string;
    title: string;
    lead: string;
    pull: string;
    points: CloudIconItem[];
  };
  work: { label: string; title: string; groups: CloudTitled[]; closing: string };
  commercials: {
    label: string;
    title: string;
    body: string[];
    cards: CloudIconItem[];
  };
  compare: {
    label: string;
    title: string;
    columns: string[];
    rows: { label: string; values: string[] }[];
  };
  roi: { label: string; title: string; body: string[] };
  fit: {
    label: string;
    title: string;
    yesTitle: string;
    yes: string[];
    noTitle: string;
    no: string[];
  };
  provide: { label: string; title: string; items: CloudTitled[] };
  faq: { label: string; title: string; items: { q: string; a: string }[] };
  founder: FounderUi & { label: string; title: string };
  final: { title: string; body: string };
  floating: FloatingContactUi;
}

/* ---------- constants ---------- */

const DOCS_URL = "https://docs.wolffi.sh";
const GITHUB_URL = "https://github.com/thewolffish/wolffish-cloud";

const ICONS: Record<string, IconType> = {
  ban: FaBan,
  bolt: FaBolt,
  calendar: FaCalendarCheck,
  code: FaCode,
  coins: FaCoins,
  comment: FaComment,
  eyeSlash: FaEyeSlash,
  fileShield: FaFileShield,
  gauge: FaGaugeHigh,
  idBadge: FaIdBadge,
  laptop: FaLaptopCode,
  listCheck: FaListCheck,
  locationDot: FaLocationDot,
  microchip: FaMicrochip,
  server: FaServer,
  shield: FaShieldHalved,
  userSecret: FaUserSecret,
  userShield: FaUserShield,
  users: FaUsers,
  wrench: FaScrewdriverWrench,
};

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:text-neutral-900 text-sm font-medium transition-colors";

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

/* ---------- small pieces ---------- */

function IconTile({ icon, size = "md" }: { icon: string; size?: "md" | "lg" }) {
  const Icon = ICONS[icon] ?? FaWandMagicSparkles;
  const box = size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const glyph = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div
      className={`${box} shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center`}
    >
      <Icon className={`${glyph} text-emerald-600`} />
    </div>
  );
}

function Section({
  id,
  label,
  title,
  children,
}: {
  id?: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="w-full max-w-6xl mx-auto px-6 pt-16 md:pt-20 scroll-mt-6"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
        {label}
      </p>
      <h2 className="mt-2 max-w-3xl text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight leading-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="text-sm md:text-[15px] leading-relaxed text-neutral-600"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function FeatureCard({ item }: { item: CloudIconItem }) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-5 flex flex-col gap-3">
      <IconTile icon={item.icon} />
      <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
        {item.title}
      </div>
      <p className="text-[13px] leading-relaxed text-neutral-500">{item.desc}</p>
    </div>
  );
}

function NumberBadge({ n }: { n: number }) {
  return (
    <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">
      {n}
    </div>
  );
}

/* ---------- the page ---------- */

export default function CloudView({
  data,
  locale,
}: {
  data: CloudData;
  locale: string;
}) {
  const {
    ui,
    hero,
    pillars,
    problem,
    insight,
    platform,
    how,
    security,
    work,
    commercials,
    compare,
    roi,
    fit,
    provide,
    faq,
    founder,
    final,
    floating,
  } = data;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const switchLocale = (next: string) => {
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  const callHref = whatsappUrl(ui.whatsappText);
  const pricingHref = whatsappUrl(ui.whatsappPricingText);
  const securityHref = `mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent(ui.emailSubject)}`;
  const lastColumn = compare.columns.length - 1;

  return (
    <div className="relative z-10 min-h-screen flex flex-col bg-[#f7f8fa] text-neutral-900">
      {/* Top bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <FaArrowLeft className="w-3 h-3 rtl:rotate-180" />
          <span className="font-medium">{ui.home}</span>
        </Link>
        <button
          onClick={() => switchLocale(locale === "en" ? "ar" : "en")}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 transition-all cursor-pointer"
        >
          {locale === "en" ? "عربي" : "EN"}
        </button>
      </header>

      {/* Hero */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-8 md:pt-14 text-center">
        <Image
          src="/icon_transparent.png"
          alt="Wolffish logo"
          width={96}
          height={96}
          className="w-14 h-14 md:w-16 md:h-16 mx-auto"
          priority
        />
        <div
          dir="ltr"
          className="mt-5 inline-flex items-center gap-2 text-lg md:text-xl font-bold text-neutral-900 tracking-tight"
        >
          Wolffish
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold tracking-wide text-emerald-700 translate-y-px">
            {ui.tag}
          </span>
        </div>
        <h1 className="mt-4 max-w-4xl mx-auto text-3xl md:text-5xl font-bold text-neutral-900 tracking-tight leading-tight">
          {hero.title}
        </h1>
        <p className="mt-5 max-w-3xl mx-auto text-sm md:text-base text-neutral-600 leading-relaxed">
          {hero.lead}
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={callHref}
            target="_blank"
            rel="noopener noreferrer"
            className={PRIMARY_BTN}
          >
            <FaWhatsapp className="w-4 h-4" />
            {ui.primaryCta}
          </a>
          <a href="#how" className={SECONDARY_BTN}>
            {ui.secondaryCta}
            <FaArrowRight className="w-3 h-3 text-neutral-400 rtl:rotate-180" />
          </a>
        </div>
        <p className="mt-3 text-xs text-neutral-400">{ui.micro}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {hero.trust.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-medium text-neutral-600"
            >
              <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* The three things to know */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-12 md:pt-16">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-neutral-400 mb-4">
          {pillars.label}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white border border-emerald-200 shadow-[0_1px_0_rgba(16,185,129,0.08)] p-6 flex flex-col gap-3"
            >
              <IconTile icon={item.icon} size="lg" />
              <div className="text-lg font-bold text-neutral-900 leading-snug tracking-tight">
                {item.title}
              </div>
              <p className="text-[13.5px] leading-relaxed text-neutral-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <Section label={problem.label} title={problem.title}>
        <div className="mt-6 grid gap-6 md:grid-cols-[1.15fr_1fr] md:gap-10">
          <Prose paragraphs={problem.body} />
          <div className="flex flex-col gap-3">
            {problem.cards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-white border border-neutral-200 p-5 flex gap-4"
              >
                <IconTile icon={card.icon} />
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
                    {card.title}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Insight */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-16 md:pt-20">
        <div className="rounded-3xl bg-neutral-900 text-white p-7 md:p-10">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
            {insight.label}
          </p>
          <h2 className="mt-2 max-w-3xl text-2xl md:text-3xl font-bold tracking-tight leading-tight">
            {insight.title}
          </h2>
          <p className="mt-4 max-w-3xl text-sm md:text-[15px] leading-relaxed text-white/70">
            {insight.lead}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {insight.points.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl bg-white/5 border border-white/10 p-5"
              >
                <div className="flex items-start gap-2.5">
                  <FaCheck className="w-3.5 h-3.5 mt-1 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[15px] font-semibold leading-snug">
                      {point.title}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                      {point.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-7 max-w-3xl text-sm md:text-[15px] leading-relaxed text-white/70">
            {insight.outro}
          </p>
        </div>
      </section>

      {/* What it is */}
      <Section id="platform" label={platform.label} title={platform.title}>
        <div className="mt-6 max-w-3xl">
          <Prose paragraphs={platform.body} />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platform.features.map((feature) => (
            <FeatureCard key={feature.title} item={feature} />
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" label={how.label} title={how.title}>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {how.steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl bg-white border border-neutral-200 p-5 flex flex-col gap-3"
            >
              <NumberBadge n={i + 1} />
              <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
                {step.title}
              </div>
              <p className="text-[13px] leading-relaxed text-neutral-500">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
          {how.timeline.map((slot) => (
            <div
              key={slot.label}
              className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4"
            >
              <div className="text-[11px] font-medium uppercase tracking-widest text-emerald-700/70">
                {slot.label}
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-900">
                {slot.value}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Security and control */}
      <Section id="security" label={security.label} title={security.title}>
        <p className="mt-4 max-w-3xl text-sm md:text-[15px] leading-relaxed text-neutral-600">
          {security.lead}
        </p>
        <div className="mt-6 rounded-2xl bg-emerald-600 text-white px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
            <FaShieldHalved className="w-5 h-5" />
          </div>
          <p className="text-lg md:text-xl font-semibold tracking-tight leading-snug">
            {security.pull}
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {security.points.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl bg-white border border-neutral-200 p-5 flex gap-4"
            >
              <IconTile icon={point.icon} />
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
                  {point.title}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                  {point.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Real work */}
      <Section label={work.label} title={work.title}>
        <div className="mt-8 rounded-2xl bg-white border border-neutral-200 divide-y divide-neutral-100">
          {work.groups.map((group) => (
            <div
              key={group.title}
              className="grid gap-x-6 gap-y-1 sm:grid-cols-[200px_1fr] px-5 py-4"
            >
              <div className="text-[14px] font-semibold text-neutral-900 leading-snug">
                {group.title}
              </div>
              <p className="text-[13px] leading-relaxed text-neutral-600">
                {group.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <FaCheck className="w-3.5 h-3.5 mt-1 text-emerald-600 shrink-0" />
          <p className="text-[13.5px] leading-relaxed text-emerald-900">
            {work.closing}
          </p>
        </div>
      </Section>

      {/* Commercials */}
      <Section id="pricing" label={commercials.label} title={commercials.title}>
        <div className="mt-6 max-w-3xl">
          <Prose paragraphs={commercials.body} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {commercials.cards.map((card) => (
            <FeatureCard key={card.title} item={card} />
          ))}
        </div>
        <div className="mt-6">
          <a
            href={pricingHref}
            target="_blank"
            rel="noopener noreferrer"
            className={PRIMARY_BTN}
          >
            <FaWhatsapp className="w-4 h-4" />
            {ui.pricingCta}
          </a>
        </div>
      </Section>

      {/* Comparison */}
      <Section label={compare.label} title={compare.title}>
        <div className="mt-8 rounded-2xl bg-white border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="w-[22%] px-5 py-3.5" />
                  {compare.columns.map((column, i) => (
                    <th
                      key={column}
                      className={`text-start px-5 py-3.5 font-semibold ${
                        i === lastColumn
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-neutral-700"
                      }`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {compare.rows.map((row) => (
                  <tr key={row.label}>
                    <th
                      scope="row"
                      className="text-start px-5 py-3.5 font-semibold text-neutral-900 align-top"
                    >
                      {row.label}
                    </th>
                    {row.values.map((value, i) => (
                      <td
                        key={i}
                        className={`px-5 py-3.5 align-top leading-relaxed ${
                          i === lastColumn
                            ? "bg-emerald-50 text-emerald-900 font-medium"
                            : "text-neutral-600"
                        }`}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ROI */}
      <Section label={roi.label} title={roi.title}>
        <div className="mt-6 max-w-3xl">
          <Prose paragraphs={roi.body} />
        </div>
      </Section>

      {/* Who this is for */}
      <Section label={fit.label} title={fit.title}>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white border border-neutral-200 p-6">
            <div className="text-[15px] font-semibold text-neutral-900">
              {fit.yesTitle}
            </div>
            <ul className="mt-4 space-y-3">
              {fit.yes.map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <FaCheck className="w-3.5 h-3.5 mt-1 text-emerald-600 shrink-0" />
                  <span className="text-[13.5px] leading-relaxed text-neutral-600">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white border border-neutral-200 p-6">
            <div className="text-[15px] font-semibold text-neutral-900">
              {fit.noTitle}
            </div>
            <ul className="mt-4 space-y-3">
              {fit.no.map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <FaXmark className="w-3.5 h-3.5 mt-1 text-neutral-400 shrink-0" />
                  <span className="text-[13.5px] leading-relaxed text-neutral-600">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* What you provide */}
      <Section label={provide.label} title={provide.title}>
        <div className="mt-8 rounded-2xl bg-white border border-neutral-200 divide-y divide-neutral-100">
          {provide.items.map((item, i) => (
            <div key={item.title} className="flex gap-4 px-5 py-4">
              <NumberBadge n={i + 1} />
              <div className="min-w-0 pt-0.5">
                <span className="text-[15px] font-semibold text-neutral-900">
                  {item.title}
                </span>{" "}
                <span className="text-[13.5px] leading-relaxed text-neutral-600">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" label={faq.label} title={faq.title}>
        <div className="mt-8 rounded-2xl bg-white border border-neutral-200 px-5 divide-y divide-neutral-100">
          {faq.items.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none text-[15px] font-semibold text-neutral-900 leading-snug [&::-webkit-details-marker]:hidden">
                {item.q}
                <FaChevronDown className="w-3 h-3 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-[13.5px] leading-relaxed text-neutral-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Founder */}
      <Section id="contact" label={founder.label} title={founder.title}>
        <div className="mt-8">
          <FounderCard ui={founder} whatsappHref={callHref} />
        </div>
      </Section>

      {/* Final CTA */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-16 md:pt-20 pb-8 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
          {final.title}
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-sm md:text-base text-neutral-600 leading-relaxed">
          {final.body}
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={callHref}
            target="_blank"
            rel="noopener noreferrer"
            className={PRIMARY_BTN}
          >
            <FaWhatsapp className="w-4 h-4" />
            {ui.primaryCta}
          </a>
          <a href={securityHref} className={SECONDARY_BTN}>
            <FaEnvelope className="w-3.5 h-3.5 text-neutral-400" />
            {ui.securityCta}
          </a>
        </div>
        <p className="mt-3 text-xs text-neutral-400">{ui.micro}</p>
      </section>

      {/* Footer — extra bottom padding below xl keeps the links clear of the floating card */}
      <footer className="w-full max-w-6xl mx-auto px-6 pb-24 xl:pb-10 pt-6 flex flex-col items-center gap-4 text-xs text-neutral-400">
        {/* Saudi Made mark — on a true white surface, since the page ground is off-white */}
        <div className="rounded-2xl bg-white border border-neutral-200 px-5 py-3">
          <Image
            src="/saudi-made.svg"
            alt={ui.saudiMade}
            width={3000}
            height={1000}
            unoptimized
            className="h-10 md:h-12 w-auto"
          />
        </div>
        <p className="text-neutral-500">{ui.footerLine}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
          >
            <FaBook className="w-3.5 h-3.5" />
            {ui.docs}
          </a>
          <Link
            href="/blog"
            className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
          >
            <FaPenNib className="w-3.5 h-3.5" />
            {ui.blog}
          </Link>
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
            href={`mailto:${FOUNDER_EMAIL}`}
            className="flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
          >
            <FaEnvelope className="w-3.5 h-3.5" />
            {ui.email}
          </a>
        </div>
      </footer>

      {/* Floating contact card — the founder, one tap away on every scroll position */}
      <FloatingContactCard ui={floating} name={founder.name} href={callHref} />
    </div>
  );
}
