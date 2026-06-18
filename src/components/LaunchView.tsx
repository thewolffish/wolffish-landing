"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  FaApple,
  FaCheck,
  FaCirclePlay,
  FaLinux,
  FaWindows,
} from "react-icons/fa6";

const YT_EMBED =
  "https://www.youtube.com/embed/PqmrJoaNs6I?autoplay=1&rel=0";

const POINTS = [
  "local",
  "act",
  "brain",
  "markdown",
  "extensible",
  "nocloud",
] as const;

const PLATFORMS = [
  { key: "macos", Icon: FaApple },
  { key: "windows", Icon: FaWindows },
  { key: "linux", Icon: FaLinux },
] as const;

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

export default function LaunchView({ version }: { version: string | null }) {
  const t = useTranslations("launch");
  const td = useTranslations("download");
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Holds the title of the video being shown, or null when the dialog is closed.
  const [video, setVideo] = useState<string | null>(null);

  const switchLocale = (next: string) => {
    setLocaleCookie(next);
    startTransition(() => {
      router.refresh();
    });
  };

  const closeVideo = useCallback(() => setVideo(null), []);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVideo();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [video, closeVideo]);

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      {/* Language toggle — top end */}
      <div className="fixed top-5 inset-e-6 z-20">
        <button
          onClick={() => switchLocale(locale === "en" ? "ar" : "en")}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
        >
          {locale === "en" ? "عربي" : "EN"}
        </button>
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-white/70 font-medium">{t("badge")}</span>
        {version && (
          <>
            <span className="w-px h-3 bg-white/15" />
            <span dir="ltr" className="text-xs text-white/45 font-medium">
              v{version}
            </span>
          </>
        )}
      </div>

      {/* Logo */}
      <Image
        src="/icon_transparent.png"
        alt="Wolffish logo"
        width={96}
        height={96}
        className="mt-8 w-16 h-16 md:w-20 md:h-20 drop-shadow-[0_0_40px_rgba(40,80,180,0.4)]"
        priority
      />

      {/* Title */}
      <h1
        className="mt-5 text-5xl md:text-7xl font-bold text-white tracking-tight"
        style={{
          textShadow: "0 0 80px rgba(40,80,180,0.3), 0 2px 30px rgba(0,0,0,0.5)",
        }}
      >
        {t("title")}
      </h1>

      {/* Subtitle */}
      <p className="mt-5 max-w-xl text-base md:text-lg text-white/60 font-light leading-relaxed">
        {t("subtitle")}
      </p>

      {/* Video links */}
      <div className="mt-6 flex items-center gap-5">
        {(["cinematic", "demo"] as const).map((key, i) => (
          <div key={key} className="flex items-center gap-5">
            {i > 0 && <span className="w-px h-4 bg-white/15" />}
            <button
              onClick={() => setVideo(t(key))}
              className="group flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <FaCirclePlay className="w-4 h-4 text-white/50 group-hover:text-emerald-400 transition-colors" />
              {t(key)}
            </button>
          </div>
        ))}
      </div>

      {/* Supported platforms */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {PLATFORMS.map(({ key, Icon }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/8"
          >
            <Icon className="w-5 h-5 text-white/55" />
            <span className="text-sm text-white/70 font-medium">{td(key)}</span>
          </div>
        ))}
      </div>

      {/* Why Wolffish — 6 points */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 w-full max-w-2xl text-start">
        {POINTS.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <FaCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-base text-white/75">{t(`points.${key}`)}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/"
        className="mt-12 group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-[#040a18] font-semibold text-sm hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
      >
        {t("cta")}
        <span
          dir="ltr"
          className="px-2.5 py-1 rounded-full bg-[#040a18]/8 border border-[#040a18]/10 font-mono text-xs font-semibold group-hover:bg-[#040a18]/12 transition-colors"
        >
          wolffi.sh
        </span>
      </Link>

      {/* Video dialog */}
      {video && (
        <div
          onClick={closeVideo}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
          role="dialog"
          aria-modal="true"
          aria-label={video}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative"
            style={{
              width: "min(80vw, calc(80vh * 16 / 9))",
              aspectRatio: "16 / 9",
            }}
          >
            <iframe
              src={YT_EMBED}
              title={video}
              className="w-full h-full rounded-2xl border border-white/10 shadow-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
