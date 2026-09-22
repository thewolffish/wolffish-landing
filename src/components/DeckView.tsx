"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { IconType } from "react-icons";
import {
  FaAndroid,
  FaApple,
  FaArrowDown,
  FaArrowRight,
  FaBuilding,
  FaCheck,
  FaChevronDown,
  FaCloud,
  FaCoins,
  FaEnvelope,
  FaEyeSlash,
  FaGithub,
  FaGraduationCap,
  FaHammer,
  FaKey,
  FaLaptop,
  FaLinux,
  FaLock,
  FaMobileScreen,
  FaNetworkWired,
  FaPhone,
  FaPlug,
  FaPowerOff,
  FaRocket,
  FaServer,
  FaShieldHalved,
  FaSliders,
  FaTerminal,
  FaUsers,
  FaWallet,
  FaWhatsapp,
  FaWindows,
} from "react-icons/fa6";
import { SiOpensourceinitiative } from "react-icons/si";
import {
  FOUNDER_EMAIL,
  FOUNDER_IMAGE,
  FOUNDER_PHONE,
  FOUNDER_PHONE_DISPLAY,
  whatsappUrl,
} from "./ContactCard";
import type { DeckSceneState } from "./DeckScene";
import ScheduleCallForm, { type ScheduleFormUi } from "./ScheduleCallForm";
import { PitchVideoButton, type PitchVideoUi } from "./PitchVideo";
import TeamCards, { type TeamData } from "./TeamCards";

// The particle field is WebGL and client only.
const DeckScene = dynamic(() => import("./DeckScene"), { ssr: false });

/* ---------- data shapes (messages/*.json "deck", read in app/deck/page.tsx) ---------- */

export interface DeckTitled {
  title: string;
  desc: string;
}

export type DeckLogKind = "read" | "run" | "draft" | "budget" | "tokens" | "approve";

export interface DeckLogEntry {
  who: string;
  action: string;
  what: string;
  kind: DeckLogKind;
}

export interface DeckData {
  ui: {
    home: string;
    wordmark: string;
    tag: string;
    fullPage: string;
    bookCall: string;
    begin: string;
    scrollHint: string;
    progressLabel: string;
    whatsappText: string;
    footerLine: string;
    badges: { saudiMade: string; deepinfra: string; openSource: string };
    links: { cloud: string; home: string; github: string };
    video: PitchVideoUi;
  };
  cover: { eyebrow: string; title: string; subtitle: string; lead: string };
  now: {
    label: string;
    title: string;
    body: string;
    stats: { value: number; suffix: string; text: string }[];
    source: string;
  };
  options: {
    label: string;
    title: string;
    vendors: string[];
    flow: { from: string; to: string };
    points: DeckTitled[];
  };
  shadow: { label: string; title: string; body: string; tags: string[] };
  problem: { label: string; title: string; items: DeckTitled[] };
  answer: { label: string; title: string; lead: string; chips: string[] };
  get: {
    label: string;
    title: string;
    items: DeckTitled[];
    platforms: { title: string; desktop: string; mobile: string };
  };
  yours: { label: string; title: string; items: DeckTitled[] };
  control: {
    label: string;
    title: string;
    body: string;
    panel: { title: string; live: string; stopped: string };
    log: DeckLogEntry[];
    budget: {
      label: string;
      rows: { name: string; value: string; fill: number }[];
      kill: string;
      resume: string;
      stoppedToast: string;
      resumedToast: string;
    };
  };
  wolffish: { label: string; title: string; items: DeckTitled[]; outro: string };
  start: {
    label: string;
    title: string;
    steps: { title: string; time: string; desc: string; note?: string }[];
    outro: string;
    pricing: string;
  };
  contact: {
    label: string;
    title: string;
    body: string;
    whatsapp: string;
    emailLabel: string;
    phoneLabel: string;
  };
}

/* ---------- constants ---------- */

const GITHUB_URL = "https://github.com/thewolffish/wolffish-cloud";

/**
 * Scene order, and the arrangement each scene asks the particle field to
 * take: 0 calm shell, 1 scattered (leaking), 2 assembled knot (the
 * platform), 3 lattice in a cube (your perimeter). Fractions blend, and the
 * field interpolates between neighbouring scenes as the reader scrolls.
 */
const SCENES = [
  { id: "cover", morph: 0 },
  { id: "now", morph: 0.45 },
  { id: "options", morph: 1 },
  { id: "shadow", morph: 1 },
  { id: "problem", morph: 1 },
  { id: "answer", morph: 2 },
  { id: "get", morph: 2 },
  { id: "yours", morph: 3 },
  { id: "control", morph: 3 },
  { id: "wolffish", morph: 2 },
  { id: "start", morph: 2 },
  { id: "team", morph: 2 },
  { id: "contact", morph: 2 },
] as const;
const LAST = SCENES.length - 1;

const LOG_TONE: Record<DeckLogKind, string> = {
  read: "bg-sky-400",
  run: "bg-violet-400",
  draft: "bg-white/70",
  budget: "bg-amber-400",
  tokens: "bg-emerald-400",
  approve: "bg-rose-400",
};

// Where each leaking label drifts to, in design pixels around the phone.
const TAG_VECTORS: [number, number][] = [
  [-118, -64],
  [112, -58],
  [-136, 18],
  [132, 26],
  [-72, 84],
  [84, 92],
];

const ICONS = {
  options: [FaCloud, FaCoins, FaPlug] as IconType[],
  problem: [FaEyeSlash, FaLock, FaUsers] as IconType[],
  get: [FaLaptop, FaNetworkWired, FaShieldHalved] as IconType[],
  yours: [FaServer, FaWallet, FaSliders, FaKey] as IconType[],
  wolffish: [FaHammer, FaRocket, FaPlug, FaGraduationCap] as IconType[],
};

/* ---------- helpers ---------- */

const delay = (i: number) => ({ "--i": i }) as CSSProperties;

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** A fake wall-clock stamp for the audit feed, 23 seconds apart. */
function stamp(i: number) {
  const s = 9 * 3600 + 41 * 60 + 7 + i * 23;
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}

/** Counts from 0 to `target` once `run` turns true; jumps straight there under reduced motion. */
function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = reduced ? 1 : Math.min(1, (t - t0) / 1400);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return value;
}

/* ---------- small pieces ---------- */

function Scene({
  id,
  seen,
  children,
  className = "",
}: {
  id: string;
  seen: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`deck-scene relative min-h-svh flex items-center px-5 sm:px-8 pt-24 pb-24 ${
        seen ? "is-in" : ""
      } ${className}`}
    >
      <div className="deck-copy w-full max-w-3xl mx-auto">{children}</div>
    </section>
  );
}

function Label({ children, ar }: { children: ReactNode; ar: boolean }) {
  return (
    <p
      data-reveal
      className={`text-[11px] sm:text-xs font-semibold text-emerald-400 ${
        ar ? "" : "uppercase tracking-[0.22em]"
      }`}
    >
      {children}
    </p>
  );
}

function Title({
  id,
  children,
  ar,
  size = "md",
}: {
  id: string;
  children: ReactNode;
  ar: boolean;
  size?: "md" | "lg";
}) {
  const sizes = size === "lg" ? "text-4xl sm:text-6xl" : "text-[28px] sm:text-5xl";
  return (
    <h2
      id={id}
      data-reveal
      style={delay(1)}
      className={`mt-3 font-bold text-balance ${
        ar ? "leading-[1.3]" : "tracking-tight leading-[1.12]"
      } ${sizes}`}
    >
      {children}
    </h2>
  );
}

function Body({
  children,
  i = 2,
  className = "",
}: {
  children: ReactNode;
  i?: number;
  className?: string;
}) {
  return (
    <p
      data-reveal
      style={delay(i)}
      className={`mt-4 text-[15px] sm:text-lg leading-relaxed text-pretty text-white/65 ${className}`}
    >
      {children}
    </p>
  );
}

function Tile({
  icon: Icon,
  title,
  desc,
  i,
  stack = false,
  tone = "accent",
}: {
  icon: IconType;
  title: string;
  desc: string;
  i: number;
  stack?: boolean;
  tone?: "accent" | "warn";
}) {
  const ring =
    tone === "warn"
      ? "bg-rose-400/10 border-rose-300/25 text-rose-200"
      : "bg-emerald-400/10 border-emerald-400/20 text-emerald-300";
  return (
    <div
      data-reveal
      style={delay(i)}
      className={`rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 backdrop-blur-sm flex ${
        stack ? "flex-col gap-3" : "gap-4"
      }`}
    >
      <span
        className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${ring}`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[15px] sm:text-base font-semibold leading-snug">{title}</div>
        <p className="mt-1 text-[13px] sm:text-sm leading-relaxed text-pretty text-white/55">
          {desc}
        </p>
      </div>
    </div>
  );
}

function Stat({
  value,
  suffix,
  text,
  run,
  i,
  ar,
}: {
  value: number;
  suffix: string;
  text: string;
  run: boolean;
  i: number;
  ar: boolean;
}) {
  const shown = useCountUp(value, run);
  return (
    <div data-reveal style={delay(i)} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <div className={`text-4xl sm:text-6xl font-bold tabular-nums ${ar ? "" : "tracking-tight"}`}>
        <span dir="ltr">
          {shown}
          {suffix}
        </span>
      </div>
      <p className="mt-2 text-[13px] sm:text-sm leading-snug text-pretty text-white/60">{text}</p>
    </div>
  );
}

interface FlowNode {
  icon: IconType;
  title: string;
  desc?: string;
  tone?: "warn" | "accent";
}

function FlowNodeView({ node }: { node: FlowNode }) {
  const Icon = node.icon;
  const box =
    node.tone === "warn"
      ? "border-rose-300/30 bg-rose-400/10"
      : node.tone === "accent"
        ? "border-emerald-400/25 bg-emerald-400/8"
        : "border-white/10 bg-white/5";
  return (
    <div className={`w-full sm:w-auto sm:flex-1 max-w-xs rounded-2xl border px-4 py-3.5 text-center ${box}`}>
      <Icon className={`mx-auto w-5 h-5 ${node.tone === "warn" ? "text-rose-200" : "text-emerald-300"}`} />
      <div className="mt-2 text-sm font-semibold leading-snug">{node.title}</div>
      {node.desc && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-pretty text-white/55">{node.desc}</p>
      )}
    </div>
  );
}

/** Nodes joined by a moving dashed line: a row from sm up, a column on phones. */
function Flow({ nodes, warn = false }: { nodes: FlowNode[]; warn?: boolean }) {
  const tone = warn ? "is-warn" : "";
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-center">
      {nodes.map((node, i) => (
        <Fragment key={node.title}>
          {i > 0 && (
            <>
              <span aria-hidden className={`deck-link-v sm:hidden ${tone}`} />
              <span aria-hidden className={`deck-link-h hidden sm:block self-center ${tone}`} />
            </>
          )}
          <FlowNodeView node={node} />
        </Fragment>
      ))}
    </div>
  );
}

/* ---------- the deck ---------- */

export default function DeckView({
  data,
  form,
  founder,
  team,
  locale,
}: {
  data: DeckData;
  form: ScheduleFormUi;
  founder: { name: string; role: string };
  team: TeamData;
  locale: string;
}) {
  const { ui, cover, now, options, shadow, problem, answer, get, yours, control, wolffish, start, contact } =
    data;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const sceneState = useRef<DeckSceneState>({ morph: 0, scroll: 0, px: 0, py: 0 });
  const [current, setCurrent] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [seen, setSeen] = useState<boolean[]>(() => SCENES.map((_, i) => i === 0));
  // The demo kill switch: pauses the audit feed and confirms with a toast.
  const [stopped, setStopped] = useState(false);
  const [toast, setToast] = useState({ text: "", on: false });
  const toastTimer = useRef(0);

  const isAr = locale === "ar";
  const onSheet = current === LAST;
  const showPill = current > 0 && current < LAST;
  const whatsappHref = whatsappUrl(ui.whatsappText);
  const labels = [
    cover.eyebrow,
    now.label,
    options.label,
    shadow.label,
    problem.label,
    answer.label,
    get.label,
    yours.label,
    control.label,
    wolffish.label,
    start.label,
    team.label,
    contact.label,
  ];

  const switchLocale = (next: string) => {
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const toggleAgents = () => {
    const next = !stopped;
    setStopped(next);
    setToast({
      text: next ? control.budget.stoppedToast : control.budget.resumedToast,
      on: true,
    });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setToast((t) => ({ ...t, on: false })),
      2800
    );
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.js = "1";

    const sections = SCENES.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );

    // On scroll: which scene holds the middle of the viewport (for the
    // counter and dots), how far between scene centres we are (for the
    // particle morph), and the overall progress (for the bar).
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const mid = vh / 2;
      const centers: number[] = [];
      let idx = 0;
      sections.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        centers.push(r.top + Math.min(r.height, vh) / 2);
        if (r.top <= mid) idx = i;
      });
      let from = 0;
      for (let i = 0; i < centers.length; i++) if (centers[i] <= mid) from = i;
      const to = Math.min(from + 1, centers.length - 1);
      const span = centers[to] - centers[from];
      const p = span > 0 ? Math.min(1, Math.max(0, (mid - centers[from]) / span)) : 0;
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      const st = sceneState.current;
      st.morph = SCENES[from].morph + (SCENES[to].morph - SCENES[from].morph) * eased;
      const max = document.documentElement.scrollHeight - vh;
      st.scroll = max > 0 ? window.scrollY / max : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${st.scroll})`;

      setCurrent((c) => (c === idx ? c : idx));
      const past = window.scrollY > 40;
      setScrolled((s) => (s === past ? s : past));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Once a scene has been on screen it stays revealed.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = sections.indexOf(entry.target as HTMLElement);
          if (i < 0) return;
          setSeen((prev) => (prev[i] ? prev : prev.map((v, j) => (j === i ? true : v))));
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    sections.forEach((el) => io.observe(el));

    // A little parallax from the pointer, mice only.
    const fine = window.matchMedia("(pointer: fine)").matches;
    const onPointer = (ev: PointerEvent) => {
      sceneState.current.px = (ev.clientX / window.innerWidth) * 2 - 1;
      sceneState.current.py = (ev.clientY / window.innerHeight) * 2 - 1;
    };
    if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      window.clearTimeout(toastTimer.current);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      io.disconnect();
    };
  }, []);

  const localeButton = (dark: boolean) => (
    <button
      type="button"
      onClick={() => switchLocale(isAr ? "en" : "ar")}
      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
        dark
          ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
          : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
      }`}
    >
      {isAr ? "EN" : "عربي"}
    </button>
  );

  return (
    <div ref={rootRef} className="deck-root relative min-h-screen text-white">
      <DeckScene state={sceneState} />

      {/* Progress bar */}
      <div className="fixed top-0 inset-x-0 z-40 h-[2px] bg-white/5 pointer-events-none" aria-hidden>
        <div
          ref={barRef}
          className="h-full w-full bg-emerald-400 origin-left rtl:origin-right"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Top bar: hidden once the reader reaches the light contact sheet */}
      <header
        className={`fixed top-0 inset-x-0 z-30 transition-all duration-300 border-b ${
          scrolled ? "bg-[#040a18]/70 backdrop-blur-md border-white/5" : "border-transparent"
        } ${onSheet ? "-translate-y-full opacity-0 pointer-events-none" : ""}`}
      >
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label={ui.home} className="flex items-center gap-2 min-w-0">
            <Image src="/icon_transparent.png" alt="" width={56} height={56} className="w-7 h-7" priority />
            <span className="text-sm font-semibold whitespace-nowrap">
              {ui.wordmark} <span className="text-emerald-400">{ui.tag}</span>
            </span>
          </Link>
          <span className="text-[11px] font-medium text-white/40 tabular-nums" dir="ltr">
            {pad2(current + 1)} / {SCENES.length}
          </span>
          <div className="flex items-center gap-2">
            <PitchVideoButton ui={ui.video} />
            <a
              href="#contact"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#04121a] text-xs font-semibold transition-colors"
            >
              {ui.bookCall}
            </a>
            {localeButton(true)}
          </div>
        </div>
      </header>

      {/* Dot rail, laptops and up */}
      <nav
        aria-label={ui.progressLabel}
        className={`hidden md:flex fixed end-5 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2.5 transition-opacity duration-300 ${
          onSheet ? "opacity-0 pointer-events-none" : ""
        }`}
      >
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(s.id)}
            aria-label={labels[i]}
            aria-current={i === current ? "step" : undefined}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              i === current ? "bg-emerald-400 scale-125" : "bg-white/25 hover:bg-white/60"
            }`}
          />
        ))}
      </nav>

      {/* Phone: the call to action rides along, out of the way on the cover and the sheet */}
      <a
        href="#contact"
        className={`sm:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 text-[#04121a] text-sm font-semibold shadow-[0_8px_30px_rgba(16,185,129,0.35)] transition-all duration-300 ${
          showPill ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        {ui.bookCall}
        <FaArrowDown className="w-3 h-3" />
      </a>

      {/* Toast for the demo kill switch */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
          toast.on ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {toast.text && (
          <div
            className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-full bg-[#070f22]/90 backdrop-blur-md border text-white text-sm font-medium shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${
              stopped ? "border-rose-400/40" : "border-emerald-400/40"
            }`}
          >
            <FaPowerOff className={`w-3 h-3 ${stopped ? "text-rose-300" : "text-emerald-300"}`} />
            {toast.text}
          </div>
        )}
      </div>

      <div className="relative z-10">
        {/* 01 Cover */}
        <section
          id="cover"
          className={`deck-scene relative min-h-svh flex items-center px-5 sm:px-8 pt-24 pb-24 ${
            seen[0] ? "is-in" : ""
          }`}
        >
          <div className="deck-copy w-full max-w-3xl mx-auto text-center">
            <div data-reveal className="flex items-center justify-center gap-3">
              <Image
                src="/icon_transparent.png"
                alt="Wolffish"
                width={96}
                height={96}
                className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-[0_0_40px_rgba(56,189,248,0.35)]"
                priority
              />
              <span className="text-lg sm:text-xl font-bold">{cover.eyebrow}</span>
            </div>
            <h1
              data-reveal
              style={delay(1)}
              className={`mt-8 font-bold text-balance text-[38px] sm:text-6xl md:text-7xl ${
                isAr ? "leading-[1.25]" : "tracking-tight leading-[1.05]"
              }`}
            >
              {cover.title}
            </h1>
            <p data-reveal style={delay(2)} className="mt-5 text-lg sm:text-2xl font-light text-white/85 text-balance">
              {cover.subtitle}
            </p>
            <p data-reveal style={delay(3)} className="mt-4 text-sm sm:text-base text-white/50">
              {cover.lead}
            </p>
            <div data-reveal style={delay(4)} className="mt-9">
              <button
                type="button"
                onClick={() => go("now")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#040a18] text-sm font-semibold hover:bg-emerald-300 transition-colors cursor-pointer"
              >
                {ui.begin}
                <FaArrowDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-1 text-[11px] text-white/40 pointer-events-none">
            <span>{ui.scrollHint}</span>
            <FaChevronDown className="deck-nudge w-3 h-3" />
          </div>
        </section>

        {/* 02 Right now */}
        <Scene id="now" seen={seen[1]}>
          <Label ar={isAr}>{now.label}</Label>
          <Title id="now-title" ar={isAr}>
            {now.title}
          </Title>
          <Body>{now.body}</Body>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
            {now.stats.map((s, i) => (
              <Stat key={s.text} {...s} run={seen[1]} i={3 + i} ar={isAr} />
            ))}
          </div>
          <p data-reveal style={delay(5)} className="mt-3 text-[11px] text-white/35">
            {now.source}
          </p>
        </Scene>

        {/* 03 The obvious options */}
        <Scene id="options" seen={seen[2]}>
          <Label ar={isAr}>{options.label}</Label>
          <div data-reveal style={delay(1)} className="mt-4 flex flex-wrap gap-2">
            {options.vendors.map((v) => (
              <span
                key={v}
                dir="ltr"
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-[13px] font-medium text-white/75"
              >
                {v}
              </span>
            ))}
          </div>
          <Title id="options-title" ar={isAr}>
            {options.title}
          </Title>
          <div data-reveal style={delay(2)} className="mt-6">
            <Flow
              warn
              nodes={[
                { icon: FaBuilding, title: options.flow.from },
                { icon: FaCloud, title: options.flow.to, tone: "warn" },
              ]}
            />
          </div>
          <div className="mt-6 grid gap-3">
            {options.points.map((p, i) => (
              <Tile key={p.title} icon={ICONS.options[i]} title={p.title} desc={p.desc} i={3 + i} tone="warn" />
            ))}
          </div>
        </Scene>

        {/* 04 Shadow AI */}
        <Scene id="shadow" seen={seen[3]}>
          <Label ar={isAr}>{shadow.label}</Label>
          <Title id="shadow-title" ar={isAr}>
            {shadow.title}
          </Title>
          <Body>{shadow.body}</Body>
          <div data-reveal style={delay(3)} className="relative mt-6 h-52 sm:h-64" aria-hidden>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <FaLaptop className="w-6 h-6 text-white/80" />
            </div>
            {shadow.tags.map((tag, i) => {
              const [dx, dy] = TAG_VECTORS[i % TAG_VECTORS.length];
              return (
                <span
                  key={tag}
                  className="deck-drift absolute left-1/2 top-1/2 px-3 py-1.5 rounded-full bg-rose-400/10 border border-rose-300/30 text-rose-100 text-xs whitespace-nowrap"
                  style={{ "--dx": dx, "--dy": dy, "--delay": `${i * 0.85}s` } as CSSProperties}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </Scene>

        {/* 05 The core problem */}
        <Scene id="problem" seen={seen[4]}>
          <Label ar={isAr}>{problem.label}</Label>
          <Title id="problem-title" ar={isAr}>
            {problem.title}
          </Title>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {problem.items.map((it, i) => (
              <Tile key={it.title} icon={ICONS.problem[i]} title={it.title} desc={it.desc} i={2 + i} stack tone="warn" />
            ))}
          </div>
        </Scene>

        {/* 06 The answer */}
        <Scene id="answer" seen={seen[5]} className="text-center">
          <Label ar={isAr}>{answer.label}</Label>
          <div data-reveal style={delay(1)} className="mt-6 flex justify-center">
            <Image
              src="/icon_transparent.png"
              alt=""
              width={112}
              height={112}
              className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_50px_rgba(52,211,153,0.45)]"
            />
          </div>
          <Title id="answer-title" ar={isAr} size="lg">
            {answer.title}
          </Title>
          <Body className="mx-auto max-w-2xl">{answer.lead}</Body>
          <div data-reveal style={delay(3)} className="mt-6 flex flex-wrap justify-center gap-2">
            {answer.chips.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-xs font-medium"
              >
                <FaCheck className="w-2.5 h-2.5" />
                {c}
              </span>
            ))}
          </div>
        </Scene>

        {/* 07 What you get */}
        <Scene id="get" seen={seen[6]}>
          <Label ar={isAr}>{get.label}</Label>
          <Title id="get-title" ar={isAr}>
            {get.title}
          </Title>
          <div className="mt-8 grid gap-3">
            {get.items.map((it, i) => (
              <Tile key={it.title} icon={ICONS.get[i]} title={it.title} desc={it.desc} i={2 + i} />
            ))}
          </div>
          <div data-reveal style={delay(5)} className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:px-5">
            <div className={`text-[11px] font-semibold text-white/40 ${isAr ? "" : "uppercase tracking-[0.18em]"}`}>
              {get.platforms.title}
            </div>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-white/80">
                  <FaApple className="w-4 h-4" />
                  <FaWindows className="w-4 h-4" />
                  <FaLinux className="w-4 h-4" />
                </span>
                <span className="text-sm text-white/80">{get.platforms.desktop}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-white/80">
                  <FaMobileScreen className="w-4 h-4" />
                  <FaAndroid className="w-4 h-4" />
                </span>
                <span className="text-sm text-white/80">{get.platforms.mobile}</span>
              </div>
            </div>
          </div>
        </Scene>

        {/* 08 Not SaaS */}
        <Scene id="yours" seen={seen[7]}>
          <Label ar={isAr}>{yours.label}</Label>
          <Title id="yours-title" ar={isAr}>
            {yours.title}
          </Title>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {yours.items.map((it, i) => (
              <Tile key={it.title} icon={ICONS.yours[i]} title={it.title} desc={it.desc} i={2 + i} />
            ))}
          </div>
        </Scene>

        {/* 09 Full control */}
        <Scene id="control" seen={seen[8]}>
          <Label ar={isAr}>{control.label}</Label>
          <Title id="control-title" ar={isAr}>
            {control.title}
          </Title>
          <Body>{control.body}</Body>
          <div
            data-reveal
            style={delay(3)}
            className="mt-6 rounded-3xl border border-white/10 bg-[#070f22]/80 backdrop-blur-md overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 text-[11px] text-white/45">
              <FaTerminal className="w-3 h-3" />
              <span className="font-medium">{control.panel.title}</span>
              <span
                className={`ms-auto inline-flex items-center gap-1.5 ${stopped ? "text-rose-300" : ""}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    stopped ? "bg-rose-400" : "bg-emerald-400 animate-pulse"
                  }`}
                />
                {stopped ? control.panel.stopped : control.panel.live}
              </span>
            </div>
            <div className="grid md:grid-cols-[1.6fr_1fr]">
              <div className="relative h-48 sm:h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]">
                <ul className={`deck-ticker px-4 py-3 ${stopped ? "is-stopped" : ""}`}>
                  {[...control.log, ...control.log].map((e, i) => (
                    <li key={`${e.who}-${i}`} className="flex items-center gap-3 py-1.5 text-[12.5px] sm:text-[13px]">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${LOG_TONE[e.kind]}`} />
                      <span className="font-mono text-[11px] text-white/35 tabular-nums shrink-0" dir="ltr">
                        {stamp(i)}
                      </span>
                      <span className="font-semibold text-white/85 shrink-0">{e.who}</span>
                      <span className="text-white/45 shrink-0">{e.action}</span>
                      <span className="text-white/75 min-w-0 truncate">{e.what}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t md:border-t-0 md:border-s border-white/10 p-4 flex flex-col gap-3">
                <div className={`text-[11px] font-semibold text-white/40 ${isAr ? "" : "uppercase tracking-[0.18em]"}`}>
                  {control.budget.label}
                </div>
                {control.budget.rows.map((r) => (
                  <div key={r.name}>
                    <div className="flex items-center justify-between gap-3 text-[12.5px]">
                      <span className="text-white/80">{r.name}</span>
                      <span className="text-white/50 tabular-nums">{r.value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${r.fill >= 1 ? "bg-emerald-400/50" : "bg-emerald-400"}`}
                        style={{ width: `${Math.round(r.fill * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={toggleAgents}
                  aria-pressed={stopped}
                  className={`mt-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    stopped
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                      : "border-rose-400/40 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                  }`}
                >
                  <FaPowerOff className="w-3 h-3" />
                  {stopped ? control.budget.resume : control.budget.kill}
                </button>
              </div>
            </div>
          </div>
        </Scene>

        {/* 10 What Wolffish does */}
        <Scene id="wolffish" seen={seen[9]}>
          <Label ar={isAr}>{wolffish.label}</Label>
          <Title id="wolffish-title" ar={isAr}>
            {wolffish.title}
          </Title>
          <div data-reveal style={delay(2)} className="mt-8">
            <Flow
              nodes={wolffish.items.map((it, i) => ({
                icon: ICONS.wolffish[i],
                title: it.title,
                desc: it.desc,
                tone: "accent" as const,
              }))}
            />
          </div>
          <Body i={3}>{wolffish.outro}</Body>
        </Scene>

        {/* 11 How it starts */}
        <Scene id="start" seen={seen[10]}>
          <Label ar={isAr}>{start.label}</Label>
          <Title id="start-title" ar={isAr}>
            {start.title}
          </Title>
          <ol className="mt-8 relative border-s border-white/10 ms-3 sm:ms-4">
            {start.steps.map((s, i) => (
              <li key={s.title} data-reveal style={delay(2 + i)} className="relative ps-7 sm:ps-9 pb-7 last:pb-0">
                <span className="absolute -start-[13px] top-0.5 w-6 h-6 rounded-full bg-[#040a18] border border-emerald-400/60 text-emerald-300 text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-base sm:text-lg font-semibold leading-snug">{s.title}</span>
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                    {s.time}
                  </span>
                </div>
                <p className="mt-1.5 text-[13.5px] sm:text-[15px] leading-relaxed text-pretty text-white/60">
                  {s.desc}
                </p>
                {s.note && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-white/80 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                    {s.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <Body i={6}>{start.outro}</Body>
          <Link
            data-reveal
            style={delay(7)}
            href="/cloud#pricing"
            className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            {start.pricing}
            <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
          </Link>
        </Scene>

        {/* 12 The team */}
        <Scene id="team" seen={seen[11]}>
          <Label ar={isAr}>{team.label}</Label>
          <Title id="team-title" ar={isAr}>
            {team.title}
          </Title>
          <Body>{team.lead}</Body>
          <div className="mt-8">
            <TeamCards team={team} theme="dark" reveal firstIndex={3} />
          </div>
        </Scene>

        {/* 13 Contact: the deck lands on paper */}
        <section
          id="contact"
          aria-labelledby="contact-title"
          className={`deck-scene relative min-h-svh bg-[#f7f8fa] text-neutral-900 rounded-t-[28px] sm:rounded-t-[40px] px-5 sm:px-8 pt-12 sm:pt-16 pb-16 ${
            seen[LAST] ? "is-in" : ""
          }`}
        >
          <div className="w-full max-w-3xl mx-auto">
            <p className={`text-[11px] sm:text-xs font-semibold text-emerald-600 ${isAr ? "" : "uppercase tracking-[0.22em]"}`}>
              {contact.label}
            </p>
            <h2
              id="contact-title"
              className={`mt-3 font-bold text-balance text-[28px] sm:text-5xl ${
                isAr ? "leading-[1.3]" : "tracking-tight leading-[1.12]"
              }`}
            >
              {contact.title}
            </h2>
            <p className="mt-4 text-[15px] sm:text-lg leading-relaxed text-pretty text-neutral-600">{contact.body}</p>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src={FOUNDER_IMAGE}
                  alt={founder.name}
                  width={144}
                  height={144}
                  className="w-14 h-14 rounded-full object-cover border border-neutral-200"
                />
                <div className="leading-snug">
                  <div className="text-[15px] font-semibold">{founder.name}</div>
                  <div className="text-[13px] text-neutral-500">{founder.role}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  <FaWhatsapp className="w-3.5 h-3.5" />
                  {contact.whatsapp}
                </a>
                <a
                  href={`mailto:${FOUNDER_EMAIL}`}
                  aria-label={contact.emailLabel}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-neutral-200 text-xs font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 transition-colors"
                >
                  <FaEnvelope className="w-3 h-3 text-neutral-400" />
                  <span dir="ltr">{FOUNDER_EMAIL}</span>
                </a>
                <a
                  href={`tel:${FOUNDER_PHONE}`}
                  aria-label={contact.phoneLabel}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-neutral-200 text-xs font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 transition-colors"
                >
                  <FaPhone className="w-3 h-3 text-neutral-400" />
                  <span dir="ltr">{FOUNDER_PHONE_DISPLAY}</span>
                </a>
              </div>
            </div>

            <div className="mt-8">
              <ScheduleCallForm ui={form} locale={locale} founderName={founder.name} founderRole={founder.role} />
            </div>

            <footer className="mt-14 pt-8 border-t border-neutral-200 flex flex-col items-center gap-5 text-xs text-neutral-400">
              <div className="flex flex-wrap items-stretch justify-center gap-3">
                <div className="rounded-2xl bg-white border border-neutral-200 px-5 py-3 flex flex-col items-center justify-center gap-1.5 min-w-[140px]">
                  <Image src="/saudi-made.svg" alt={ui.badges.saudiMade} width={3000} height={1000} unoptimized className="h-6 w-auto" />
                  <span className="text-[11px] text-neutral-500">{ui.badges.saudiMade}</span>
                </div>
                <div className="rounded-2xl bg-white border border-neutral-200 px-5 py-3 flex flex-col items-center justify-center gap-1.5 min-w-[140px]">
                  <Image src="/deepinfra.svg" alt="DeepInfra" width={118} height={24} unoptimized className="h-[18px] w-auto my-[3px] opacity-80" />
                  <span className="text-[11px] text-neutral-500">{ui.badges.deepinfra}</span>
                </div>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 transition-colors px-5 py-3 flex flex-col items-center justify-center gap-1.5 min-w-[140px]"
                >
                  <SiOpensourceinitiative className="w-5 h-5 my-0.5 text-neutral-700" />
                  <span className="text-[11px] text-neutral-500">{ui.badges.openSource}</span>
                </a>
              </div>
              <p className="text-neutral-500 text-center">{ui.footerLine}</p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
                <Link href="/cloud" className="inline-flex items-center gap-1.5 hover:text-neutral-700 transition-colors">
                  {ui.links.cloud}
                  <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
                <Link href="/" className="hover:text-neutral-700 transition-colors">
                  {ui.links.home}
                </Link>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
                >
                  <FaGithub className="w-3.5 h-3.5" />
                  {ui.links.github}
                </a>
                {localeButton(false)}
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
