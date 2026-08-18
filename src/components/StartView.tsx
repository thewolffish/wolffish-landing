"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { IconType } from "react-icons";
import {
  FaApple,
  FaArrowLeft,
  FaArrowUpRightFromSquare,
  FaBell,
  FaBook,
  FaBoxArchive,
  FaBriefcase,
  FaCalendarCheck,
  FaChartLine,
  FaCheck,
  FaCircleCheck,
  FaCircleInfo,
  FaClock,
  FaCoins,
  FaCopy,
  FaDiscord,
  FaDumbbell,
  FaEnvelopeOpenText,
  FaFaceLaughSquint,
  FaFilePdf,
  FaGlobe,
  FaGooglePlay,
  FaGraduationCap,
  FaHashtag,
  FaLanguage,
  FaListCheck,
  FaMagnifyingGlass,
  FaMobileScreen,
  FaMugHot,
  FaNewspaper,
  FaPaperPlane,
  FaPlane,
  FaPlug,
  FaServer,
  FaTag,
  FaTerminal,
  FaUsers,
  FaUtensils,
  FaWandMagicSparkles,
  FaXmark,
} from "react-icons/fa6";

/* ---------- data shapes (assembled server-side in app/start/page.tsx) ---------- */

export interface StartCommand {
  note?: string;
  code: string;
}

export interface StartStep {
  title: string;
  body?: string;
  cmd?: StartCommand[];
  prompt?: string[];
  links?: { label: string; url: string }[];
  stores?: boolean;
  note?: string;
}

export interface StartCaseData {
  id: string;
  icon: string;
  title: string;
  desc: string;
  time: string;
  cost: string;
  channel?: string;
  intro: string;
  steps: StartStep[];
  outro?: string;
  docs: string;
}

export interface StartUi {
  home: string;
  hint: string;
  timeLabel: string;
  costLabel: string;
  close: string;
  sendThis: string;
  moreTitle: string;
  moreBody: string;
  docs: string;
  discord: string;
  stepsLabel: string;
}

export interface StartHero {
  title: string;
  lead: string;
  sub: string;
  points: string[];
}

export interface StartData {
  ui: StartUi;
  hero: StartHero;
  cases: StartCaseData[];
}

/* ---------- constants ---------- */

const APP_STORE_URL = "https://apps.apple.com/us/app/wolffish/id6792797989";
const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=sh.wolffi.mobile";
const DISCORD_URL = "https://discord.gg/zWJpD3SgTt";

const ICONS: Record<string, IconType> = {
  archive: FaBoxArchive,
  bell: FaBell,
  briefcase: FaBriefcase,
  calendar: FaCalendarCheck,
  chart: FaChartLine,
  dumbbell: FaDumbbell,
  envelope: FaEnvelopeOpenText,
  globe: FaGlobe,
  graduation: FaGraduationCap,
  hashtag: FaHashtag,
  language: FaLanguage,
  laugh: FaFaceLaughSquint,
  list: FaListCheck,
  meal: FaUtensils,
  mobile: FaMobileScreen,
  mug: FaMugHot,
  newspaper: FaNewspaper,
  pdf: FaFilePdf,
  plane: FaPlane,
  plug: FaPlug,
  search: FaMagnifyingGlass,
  server: FaServer,
  tag: FaTag,
  terminal: FaTerminal,
  users: FaUsers,
};

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

/* ---------- small pieces ---------- */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={copy}
      className="shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <FaCheck className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <FaCopy className="w-3.5 h-3.5 text-white/40 hover:text-white/70" />
      )}
    </button>
  );
}

function Chip({
  icon: Icon,
  children,
}: {
  icon?: IconType;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/6 border border-white/10 text-[11px] font-medium text-white/65">
      {Icon && <Icon className="w-3 h-3 text-white/40" />}
      {children}
    </span>
  );
}

function LinkChips({ links }: { links: { label: string; url: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.url + link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-xs font-medium text-white/75 hover:bg-white/12 hover:text-white hover:border-white/20 transition-colors"
        >
          <FaArrowUpRightFromSquare className="w-2.5 h-2.5 text-white/40" />
          {link.label}
        </a>
      ))}
    </div>
  );
}

function StoreButtons() {
  return (
    <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
      {[
        { name: "App Store", url: APP_STORE_URL, Icon: FaApple },
        { name: "Google Play", url: GOOGLE_PLAY_URL, Icon: FaGooglePlay },
      ].map(({ name, url, Icon }) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center gap-3 rounded-xl bg-white/7 border border-white/12 hover:bg-white/12 hover:border-white/20 px-4 py-3 transition-colors"
        >
          <Icon className="w-4.5 h-4.5 text-white/70" />
          <span className="text-sm font-medium text-white">{name}</span>
          <FaArrowUpRightFromSquare className="w-2.5 h-2.5 text-white/30 ms-auto" />
        </a>
      ))}
    </div>
  );
}

function CommandBlock({ cmd }: { cmd: StartCommand }) {
  return (
    <div
      dir="ltr"
      className="mt-3 rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 font-mono flex items-center gap-3 text-left"
    >
      <div className="min-w-0 flex-1">
        {cmd.note && (
          <div className="text-[10px] text-emerald-400/70 mb-1"># {cmd.note}</div>
        )}
        <code className="text-xs leading-relaxed text-white/85 block whitespace-pre-wrap break-all">
          {cmd.code}
        </code>
      </div>
      <CopyButton text={cmd.code} />
    </div>
  );
}

function PromptBlock({ text, label }: { text: string; label: string }) {
  return (
    <div className="mt-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-400/20 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300/80 mb-1.5">
        <FaPaperPlane className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className="flex items-start gap-2">
        <p className="flex-1 text-[13px] leading-relaxed text-white/85 whitespace-pre-wrap">
          {text}
        </p>
        <CopyButton text={text} />
      </div>
    </div>
  );
}

/* ---------- the page ---------- */

export default function StartView({
  data,
  locale,
}: {
  data: StartData;
  locale: string;
}) {
  const { ui, hero, cases } = data;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const active = cases.find((c) => c.id === activeId) ?? null;

  const switchLocale = (next: string) => {
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  const openCase = useCallback((id: string) => {
    setActiveId(id);
    setOpen(true);
    history.replaceState(null, "", `#${id}`);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  }, []);

  // Deep link: /start#case-id opens that guide (on load and on hash edits).
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.slice(1);
      if (id && cases.some((c) => c.id === id)) {
        setActiveId(id);
        setOpen(true);
      }
    };
    const initial = setTimeout(openFromHash, 0);
    window.addEventListener("hashchange", openFromHash);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [cases]);

  // While the sheet is open: lock page scroll, close on Escape, focus panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <FaArrowLeft className="w-3 h-3 rtl:rotate-180" />
          <span className="font-medium">{ui.home}</span>
        </Link>
        <button
          onClick={() => switchLocale(locale === "en" ? "ar" : "en")}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          {locale === "en" ? "عربي" : "EN"}
        </button>
      </header>

      {/* Intro */}
      <section className="w-full max-w-3xl mx-auto px-6 pt-8 md:pt-14 text-center">
        <Image
          src="/icon_transparent.png"
          alt="Wolffish logo"
          width={96}
          height={96}
          className="w-14 h-14 md:w-16 md:h-16 mx-auto drop-shadow-[0_0_40px_rgba(40,80,180,0.4)]"
          priority
        />
        <h1 className="mt-5 text-3xl md:text-5xl font-bold text-white tracking-tight">
          {hero.title}
        </h1>
        <p className="mt-4 text-sm md:text-base text-white/75 leading-relaxed">
          {hero.lead}
        </p>
        <p className="mt-3 text-[13px] md:text-sm text-white/50 leading-relaxed">
          {hero.sub}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {hero.points.map((point) => (
            <Chip key={point}>{point}</Chip>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-10 md:pt-14 pb-8 flex-1">
        <p className="text-xs font-medium uppercase tracking-widest text-white/35 mb-4">
          {ui.hint}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cases.map((c) => {
            const Icon = ICONS[c.icon] ?? FaWandMagicSparkles;
            return (
              <button
                key={c.id}
                onClick={() => openCase(c.id)}
                className="group text-start rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] hover:border-white/20 transition-all p-5 flex flex-col gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center group-hover:border-emerald-400/30 transition-colors">
                  <Icon className="w-4 h-4 text-emerald-300/80" />
                </div>
                <div className="text-[15px] font-semibold text-white leading-snug">
                  {c.title}
                </div>
                <p className="text-[13px] leading-relaxed text-white/55">
                  {c.desc}
                </p>
                <div className="mt-auto pt-1 flex flex-wrap gap-1.5">
                  <Chip icon={FaClock}>{c.time}</Chip>
                  {c.channel && <Chip>{c.channel}</Chip>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 pb-10 pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/40">
        <a
          href="https://docs.wolffi.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
        >
          <FaBook className="w-3.5 h-3.5" />
          {ui.docs}
        </a>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
        >
          <FaDiscord className="w-3.5 h-3.5" />
          {ui.discord}
        </a>
        <Link
          href="/"
          className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
        >
          wolffi.sh
        </Link>
      </footer>

      {/* Guide sheet */}
      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div
          onClick={close}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Panel */}
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={active?.title}
          className={`absolute inset-y-0 end-0 w-full sm:max-w-xl bg-[#081022] sm:border-s border-white/10 shadow-2xl overflow-y-auto outline-none transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
          }`}
        >
          {active && (
            <div className="px-6 sm:px-8 py-6 pb-14">
              {/* Sheet header */}
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                  {(() => {
                    const Icon = ICONS[active.icon] ?? FaWandMagicSparkles;
                    return <Icon className="w-5 h-5 text-emerald-300/80" />;
                  })()}
                </div>
                <button
                  onClick={close}
                  aria-label={ui.close}
                  className="shrink-0 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <FaXmark className="w-4 h-4" />
                </button>
              </div>

              <h2 className="mt-4 text-xl md:text-2xl font-bold text-white leading-snug">
                {active.title}
              </h2>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip icon={FaClock}>
                  {ui.timeLabel} {active.time}
                </Chip>
                <Chip icon={FaCoins}>
                  {ui.costLabel} {active.cost}
                </Chip>
                {active.channel && <Chip>{active.channel}</Chip>}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/65">
                {active.intro}
              </p>

              {/* Steps */}
              <p className="mt-8 text-xs font-medium uppercase tracking-widest text-white/35">
                {ui.stepsLabel}
              </p>
              <ol className="mt-4 space-y-8">
                {active.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-white/8 border border-white/15 text-white/80 text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="text-[15px] font-semibold text-white leading-snug">
                        {step.title}
                      </div>
                      {step.body && (
                        <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                          {step.body}
                        </p>
                      )}
                      {step.cmd?.map((cmd, j) => (
                        <CommandBlock key={j} cmd={cmd} />
                      ))}
                      {step.prompt?.map((p, j) => (
                        <PromptBlock key={j} text={p} label={ui.sendThis} />
                      ))}
                      {step.links && step.links.length > 0 && (
                        <LinkChips links={step.links} />
                      )}
                      {step.stores && <StoreButtons />}
                      {step.note && (
                        <div className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-white/45">
                          <FaCircleInfo className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/30" />
                          <span>{step.note}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {/* Done */}
              {active.outro && (
                <div className="mt-9 flex items-start gap-2.5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-400/25 p-4">
                  <FaCircleCheck className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                  <p className="text-[13.5px] leading-relaxed text-emerald-50/90">
                    {active.outro}
                  </p>
                </div>
              )}

              {/* More help */}
              <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                <div className="text-sm font-semibold text-white">
                  {ui.moreTitle}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                  {ui.moreBody}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={active.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-xs font-medium text-white/75 hover:bg-white/12 hover:text-white hover:border-white/20 transition-colors"
                  >
                    <FaBook className="w-3 h-3 text-white/40" />
                    {ui.docs}
                  </a>
                  <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-xs font-medium text-white/75 hover:bg-white/12 hover:text-white hover:border-white/20 transition-colors"
                  >
                    <FaDiscord className="w-3 h-3 text-white/40" />
                    {ui.discord}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
