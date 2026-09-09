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
  FaBook,
  FaCheck,
  FaChevronDown,
  FaCode,
  FaCoins,
  FaComment,
  FaEnvelope,
  FaFileShield,
  FaGaugeHigh,
  FaGithub,
  FaIdBadge,
  FaLaptopCode,
  FaListCheck,
  FaLocationDot,
  FaMicrochip,
  FaPenNib,
  FaPhone,
  FaScrewdriverWrench,
  FaServer,
  FaShieldHalved,
  FaUserSecret,
  FaUserShield,
  FaWandMagicSparkles,
  FaWhatsapp,
  FaXmark,
} from "react-icons/fa6";
import {
  FloatingContactCard,
  FounderCard,
  FOUNDER_EMAIL,
  FOUNDER_IMAGE,
  FOUNDER_PHONE,
  FOUNDER_PHONE_DISPLAY,
  whatsappUrl,
  type FloatingContactUi,
  type FounderUi,
} from "./ContactCard";
import ScheduleCallForm, { type ScheduleFormUi } from "./ScheduleCallForm";

/* ---------- data shapes (read from messages/*.json "cloud" in app/cloud/page.tsx) ---------- */

export type CloudStatus = "shipped" | "partial" | "inBuild" | "notHeld";

export interface CloudIconItem {
  icon: string;
  title: string;
  desc: string;
}

export interface CloudStatusItem extends CloudIconItem {
  status: CloudStatus;
}

export interface CloudTitled {
  title: string;
  desc: string;
}

export interface CloudUi {
  home: string;
  tag: string;
  eyebrow: string;
  primaryCta: string;
  secondaryCta: string;
  micro: string;
  whatsappText: string;
  docs: string;
  blog: string;
  github: string;
  email: string;
  saudiMade: string;
  footerLine: string;
  status: Record<CloudStatus, string>;
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
    layers: CloudStatusItem[];
    cautionTitle: string;
    cautions: { title: string; desc: string; status: CloudStatus }[];
  };
  how: {
    label: string;
    title: string;
    lead: string;
    steps: { title: string; time: string; desc: string }[];
    note: string;
  };
  security: {
    label: string;
    title: string;
    lead: string;
    pull: string;
    points: CloudStatusItem[];
  };
  work: { label: string; title: string; lead: string; groups: CloudTitled[]; closing: string };
  pricing: {
    label: string;
    title: string;
    body: string[];
    columns: string[];
    rows: { label: string; amount: string; billedBy: string; margin: string }[];
    landed: { label: string; value: string };
    note: string;
    cards: CloudIconItem[];
  };
  roi: { label: string; title: string; body: string[] };
  compare: {
    label: string;
    title: string;
    lead: string;
    columns: string[];
    rows: { label: string; values: string[] }[];
    national: { title: string; body: string };
  };
  integrator: {
    label: string;
    title: string;
    body: string[];
    questionsLabel: string;
    questions: string[];
  };
  fit: {
    label: string;
    title: string;
    yesTitle: string;
    yes: string[];
    noTitle: string;
    no: string[];
    closing: string;
  };
  provide: { label: string; title: string; items: CloudTitled[] };
  faq: { label: string; title: string; items: { q: string; a: string }[] };
  founder: FounderUi & { label: string; title: string };
  schedule: {
    label: string;
    title: string;
    body: string;
    asideTitle: string;
    aside: string[];
    form: ScheduleFormUi;
  };
  floating: FloatingContactUi;
}

/* ---------- constants ---------- */

const DOCS_URL = "https://docs.wolffi.sh";
const GITHUB_URL = "https://github.com/thewolffish/wolffish-cloud";

const ICONS: Record<string, IconType> = {
  ban: FaBan,
  code: FaCode,
  coins: FaCoins,
  comment: FaComment,
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
  wrench: FaScrewdriverWrench,
};

const STATUS_STYLE: Record<CloudStatus, string> = {
  shipped: "bg-emerald-50 border-emerald-200 text-emerald-700",
  partial: "bg-amber-50 border-amber-200 text-amber-700",
  inBuild: "bg-sky-50 border-sky-200 text-sky-700",
  notHeld: "bg-neutral-100 border-neutral-200 text-neutral-600",
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

function StatusChip({
  status,
  labels,
}: {
  status: CloudStatus;
  labels: Record<CloudStatus, string>;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10.5px] font-semibold tracking-wide uppercase ${STATUS_STYLE[status]}`}
    >
      {labels[status]}
    </span>
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

function StatusCard({
  item,
  labels,
}: {
  item: CloudStatusItem;
  labels: Record<CloudStatus, string>;
}) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-5 flex gap-4">
      <IconTile icon={item.icon} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
            {item.title}
          </div>
          <StatusChip status={item.status} labels={labels} />
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
          {item.desc}
        </p>
      </div>
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
    pricing,
    roi,
    compare,
    integrator,
    fit,
    provide,
    faq,
    founder,
    schedule,
    floating,
  } = data;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const switchLocale = (next: string) => {
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  const whatsappHref = whatsappUrl(ui.whatsappText);
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
        <p className="mt-4 text-[11px] md:text-xs font-medium uppercase tracking-widest text-neutral-400">
          {ui.eyebrow}
        </p>
        <h1 className="mt-3 max-w-4xl mx-auto text-3xl md:text-5xl font-bold text-neutral-900 tracking-tight leading-tight">
          {hero.title}
        </h1>
        <p className="mt-5 max-w-3xl mx-auto text-sm md:text-base text-neutral-600 leading-relaxed">
          {hero.lead}
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#schedule" className={PRIMARY_BTN}>
            {ui.primaryCta}
            <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
          </a>
          <a href="#how" className={SECONDARY_BTN}>
            {ui.secondaryCta}
            <FaChevronDown className="w-3 h-3 text-neutral-400" />
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

      {/* The three pillars */}
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

      {/* Why now */}
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

      {/* The distinction */}
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
          {platform.layers.map((layer) => (
            <div
              key={layer.title}
              className="rounded-2xl bg-white border border-neutral-200 p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <IconTile icon={layer.icon} />
                <StatusChip status={layer.status} labels={ui.status} />
              </div>
              <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
                {layer.title}
              </div>
              <p className="text-[13px] leading-relaxed text-neutral-500">
                {layer.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-white border border-neutral-200 divide-y divide-neutral-100">
          <div className="px-5 py-3.5 text-[13px] font-semibold text-neutral-900">
            {platform.cautionTitle}
          </div>
          {platform.cautions.map((caution) => (
            <div
              key={caution.title}
              className="grid gap-x-6 gap-y-1.5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-[14px] font-semibold text-neutral-900 leading-snug">
                  {caution.title}
                </span>
                <StatusChip status={caution.status} labels={ui.status} />
              </div>
              <p className="text-[13px] leading-relaxed text-neutral-600">
                {caution.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* The process */}
      <Section id="how" label={how.label} title={how.title}>
        <p className="mt-4 max-w-3xl text-sm md:text-[15px] leading-relaxed text-neutral-600">
          {how.lead}
        </p>
        <div className="mt-8 grid gap-3 max-w-4xl">
          {how.steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl bg-white border border-neutral-200 p-5 flex gap-4"
            >
              <NumberBadge n={i + 1} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
                    {step.title}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                    {step.time}
                  </span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-600">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-neutral-500 max-w-3xl">
          {how.note}
        </p>
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
            <StatusCard key={point.title} item={point} labels={ui.status} />
          ))}
        </div>
      </Section>

      {/* What your people do with it */}
      <Section label={work.label} title={work.title}>
        <p className="mt-4 max-w-3xl text-sm md:text-[15px] leading-relaxed text-neutral-600">
          {work.lead}
        </p>
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

      {/* What it costs */}
      <Section id="pricing" label={pricing.label} title={pricing.title}>
        <div className="mt-6 max-w-3xl">
          <Prose paragraphs={pricing.body} />
        </div>
        <div className="mt-8 rounded-2xl bg-white border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  {pricing.columns.map((column) => (
                    <th
                      key={column}
                      className="text-start px-5 py-3.5 font-semibold text-neutral-700"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pricing.rows.map((row) => (
                  <tr key={row.label}>
                    <th
                      scope="row"
                      className="text-start px-5 py-3.5 font-semibold text-neutral-900 align-top"
                    >
                      {row.label}
                    </th>
                    <td className="px-5 py-3.5 align-top leading-relaxed text-neutral-700">
                      {row.amount}
                    </td>
                    <td className="px-5 py-3.5 align-top leading-relaxed text-neutral-600">
                      {row.billedBy}
                    </td>
                    <td className="px-5 py-3.5 align-top leading-relaxed text-neutral-600">
                      {row.margin}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50">
                  <th
                    scope="row"
                    className="text-start px-5 py-3.5 font-bold text-emerald-900 align-top"
                  >
                    {pricing.landed.label}
                  </th>
                  <td
                    colSpan={3}
                    className="px-5 py-3.5 align-top font-semibold text-emerald-900"
                  >
                    {pricing.landed.value}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-neutral-500 max-w-3xl">
          {pricing.note}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pricing.cards.map((card) => (
            <FeatureCard key={card.title} item={card} />
          ))}
        </div>
      </Section>

      {/* The return */}
      <Section label={roi.label} title={roi.title}>
        <div className="mt-6 max-w-3xl">
          <Prose paragraphs={roi.body} />
        </div>
      </Section>

      {/* Against the cloud assistants */}
      <Section id="compare" label={compare.label} title={compare.title}>
        <p className="mt-4 max-w-3xl text-sm md:text-[15px] leading-relaxed text-neutral-600">
          {compare.lead}
        </p>
        <div className="mt-8 rounded-2xl bg-white border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="w-[18%] px-5 py-3.5" />
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
        <div className="mt-4 rounded-2xl bg-white border border-neutral-200 p-5 md:p-6 flex gap-4">
          <IconTile icon="microchip" />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-neutral-900 leading-snug">
              {compare.national.title}
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-600">
              {compare.national.body}
            </p>
          </div>
        </div>
      </Section>

      {/* The integrator question */}
      <Section label={integrator.label} title={integrator.title}>
        <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr] md:gap-10">
          <Prose paragraphs={integrator.body} />
          <div className="rounded-2xl bg-neutral-900 text-white p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
              {integrator.questionsLabel}
            </p>
            <ol className="mt-4 space-y-3">
              {integrator.questions.map((question, i) => (
                <li key={question} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-[15px] font-semibold leading-snug">
                    {question}
                  </span>
                </li>
              ))}
            </ol>
          </div>
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
        <p className="mt-4 text-[13px] leading-relaxed text-neutral-500 max-w-3xl">
          {fit.closing}
        </p>
      </Section>

      {/* What we need from you */}
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
          <FounderCard ui={founder} whatsappHref={whatsappHref} />
        </div>
      </Section>

      {/* Book a call */}
      <Section id="schedule" label={schedule.label} title={schedule.title}>
        <p className="mt-4 max-w-3xl text-sm md:text-[15px] leading-relaxed text-neutral-600">
          {schedule.body}
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <ScheduleCallForm
            ui={schedule.form}
            locale={locale}
            founderName={founder.name}
            founderRole={founder.role}
          />
          <aside className="rounded-2xl bg-white border border-neutral-200 p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Image
                src={FOUNDER_IMAGE}
                alt={founder.name}
                width={144}
                height={144}
                className="w-14 h-14 rounded-full object-cover border border-neutral-200"
              />
              <div className="text-[13px] leading-snug">
                <div className="font-semibold text-neutral-900">{founder.name}</div>
                <div className="text-neutral-500">{founder.role}</div>
              </div>
            </div>
            <div>
              <div className="text-[12px] font-medium uppercase tracking-widest text-neutral-400">
                {schedule.asideTitle}
              </div>
              <ul className="mt-3 space-y-2.5">
                {schedule.aside.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <FaCheck className="w-3.5 h-3.5 mt-1 text-emerald-600 shrink-0" />
                    <span className="text-[13.5px] leading-relaxed text-neutral-600">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 pt-1 border-t border-neutral-100">
              <a
                href={`mailto:${FOUNDER_EMAIL}`}
                className="inline-flex items-center gap-2 pt-3 text-[13px] text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <FaEnvelope className="w-3 h-3 text-neutral-400" />
                <span dir="ltr">{FOUNDER_EMAIL}</span>
              </a>
              <a
                href={`tel:${FOUNDER_PHONE}`}
                className="inline-flex items-center gap-2 text-[13px] text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <FaPhone className="w-3 h-3 text-neutral-400" />
                <span dir="ltr">{FOUNDER_PHONE_DISPLAY}</span>
              </a>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold transition-colors"
            >
              <FaWhatsapp className="w-4 h-4" />
              {founder.whatsapp}
            </a>
          </aside>
        </div>
        <p className="mt-4 text-xs text-neutral-400">{ui.micro}</p>
      </Section>

      {/* Footer, with extra bottom padding below xl to keep the links clear of the floating card */}
      <footer className="w-full max-w-6xl mx-auto px-6 pb-24 xl:pb-10 pt-14 flex flex-col items-center gap-4 text-xs text-neutral-400">
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

      {/* Floating contact card: the founder, one tap away on every scroll position */}
      <FloatingContactCard ui={floating} name={founder.name} href="#schedule" />
    </div>
  );
}
