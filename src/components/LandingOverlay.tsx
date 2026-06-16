"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore, useTransition } from "react";
import {
  FaApple,
  FaBook,
  FaCheck,
  FaCopy,
  FaDiscord,
  FaFeather,
  FaGithub,
  FaLinux,
  FaTerminal,
  FaWindows,
  FaXTwitter,
} from "react-icons/fa6";

interface ReleaseFile {
  url: string;
  filename: string;
}

interface ReleaseInfo {
  version: string;
  files: {
    macos: ReleaseFile;
    windows: ReleaseFile;
    linux: { deb?: ReleaseFile; rpm?: ReleaseFile; appimage?: ReleaseFile };
  };
}

function getClientOS(): string | null {
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS X/.test(ua)) return "macos";
  if (/Windows/.test(ua)) return "windows";
  if (/Linux/.test(ua) && !/Android/.test(ua)) return "linux";
  return null;
}
const noopSubscribe = () => () => {};
const serverOS = () => null;

const LINUX_TAGS = [
  { key: "deb", label: ".deb" },
  { key: "rpm", label: ".rpm" },
  { key: "appimage", label: ".AppImage" },
] as const;

const stripExt = (filename: string) =>
  filename.replace(/\.(AppImage|deb|rpm)$/, "");

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
}

export default function LandingOverlay({ release }: { release: ReleaseInfo | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const userOS = useSyncExternalStore(noopSubscribe, getClientOS, serverOS);

  const switchLocale = (locale: string) => {
    setLocaleCookie(locale);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col pointer-events-none">
      {/* Language toggle — top right */}
      <div className="fixed top-5 inset-e-6 pointer-events-auto z-20">
        <button
          onClick={() => switchLocale(locale === "en" ? "ar" : "en")}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
        >
          {locale === "en" ? "عربي" : "EN"}
        </button>
      </div>

      {/* ── Center column ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 md:py-0">
        {/* Title + Version */}
        <div className="flex items-center gap-4 md:gap-6">
          <Image
            src="/icon_transparent.png"
            alt="Wolffish logo"
            width={96}
            height={96}
            className="w-16 h-16 md:w-24 md:h-24 drop-shadow-[0_0_40px_rgba(40,80,180,0.4)]"
            priority
          />
          <h1
            className="text-6xl md:text-9xl font-bold text-white tracking-tight"
            style={{
              textShadow:
                "0 0 80px rgba(40,80,180,0.3), 0 2px 30px rgba(0,0,0,0.5)",
            }}
          >
            {t("hero.name")}
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/4 border border-white/6 self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/60 font-medium">
              {release ? `v${release.version}` : t("hero.version")}
            </span>
          </div>
        </div>

        <p className="mt-6 text-lg md:text-2xl text-white/80 font-light tracking-wide">
          {t("hero.tagline")}
        </p>

        <p className="mt-3 text-sm md:text-base text-white/50 max-w-md text-center leading-relaxed">
          {t("hero.subtitle")}
        </p>

        {/* Features */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {(["local", "brain", "extensible"] as const).map((key) => (
            <div
              key={key}
              className="backdrop-blur-md bg-white/5 border border-white/8 rounded-2xl px-8 py-7 text-center"
            >
              <div className="text-[13px] font-semibold text-white/90 mb-2.5">
                {t(`features.${key}`)}
              </div>
              <div className="text-xs text-white/50 leading-relaxed">
                {t(`features.${key}Desc`)}
              </div>
            </div>
          ))}
        </div>

        {/* Install commands */}
        <InstallCommands />

        {/* Downloads — same max-w-5xl grid as features */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl pointer-events-auto">
          {(
            [
              { os: "macos", Icon: FaApple },
              { os: "windows", Icon: FaWindows },
              { os: "linux", Icon: FaLinux },
            ] as const
          ).map(({ os, Icon }) => {
            const match = userOS === os;
            const dimmed = userOS !== null && !match;

            const badge = match && (
              <span className="absolute top-2.5 inset-e-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span className="text-[8px] text-emerald-300 font-medium">
                  {t("download.compatible")}
                </span>
              </span>
            );
            const label = (
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                {t(`download.${os}`)}
              </div>
            );

            // Linux ships three installers — the card itself isn't clickable;
            // each format is a small tag that downloads its specific installer.
            if (os === "linux") {
              const linuxFiles = release?.files.linux;
              const name = stripExt(
                (linuxFiles?.appimage ?? linuxFiles?.deb ?? linuxFiles?.rpm)
                  ?.filename ?? t("download.linuxFile")
              );
              return (
                <div
                  key={os}
                  className={`relative flex items-center gap-4 px-7 py-5 rounded-2xl backdrop-blur-md transition-all ${
                    dimmed
                      ? "bg-white/3 border border-white/5 opacity-50"
                      : "bg-white/6 border border-white/8"
                  }`}
                >
                  {badge}
                  <Icon
                    className={`w-5 h-5 ${dimmed ? "text-white/30" : "text-white/50"}`}
                  />
                  <div className="text-start min-w-0">
                    {label}
                    <div className="text-xs text-white font-medium mt-0.5">
                      {name}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {LINUX_TAGS.map(({ key, label }) => {
                        const file = release?.files.linux[key];
                        return file ? (
                          <a
                            key={key}
                            href={file.url}
                            dir="ltr"
                            className="px-2 py-0.5 rounded-md text-[10px] leading-none font-medium bg-white/8 border border-white/10 text-white/70 hover:bg-white/16 hover:text-white hover:border-white/20 transition-colors"
                          >
                            {label}
                          </a>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const file = release?.files[os];
            return (
              <a
                key={os}
                href={file?.url ?? "#"}
                className={`group relative flex items-center gap-4 px-7 py-5 rounded-2xl backdrop-blur-md transition-all ${
                  dimmed
                    ? "bg-white/3 border border-white/5 opacity-50 hover:opacity-80 hover:bg-white/6"
                    : "bg-white/6 border border-white/8 hover:bg-white/12 hover:border-white/18"
                }`}
              >
                {badge}
                <Icon
                  className={`w-5 h-5 transition-colors ${dimmed ? "text-white/30" : "text-white/50 group-hover:text-white"}`}
                />
                <div className="text-start">
                  {label}
                  <div className="text-xs text-white font-medium mt-0.5">
                    {file?.filename ?? t(`download.${os}File`)}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 pt-6 flex justify-center">
        <div className="flex items-center gap-8 text-xs text-white/40 pointer-events-auto">
          <a
            href="https://docs.wolffi.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
          >
            <FaBook className="w-3.5 h-3.5" />
            {t("footer.docs")}
          </a>
          <Link
            href="/blog"
            className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
          >
            <FaFeather className="w-3.5 h-3.5" />
            {t("footer.blog")}
          </Link>
          <a
            href="https://github.com/thewolffish/wolffish-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
          >
            <FaGithub className="w-3.5 h-3.5" />
            {t("footer.github")}
          </a>
          <a
            href="https://discord.com/invite/F5Ue36PzQ"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
          >
            <FaDiscord className="w-3.5 h-3.5" />
            {t("footer.discord")}
          </a>
          <a
            href="https://x.com/the_wolffish"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
          >
            <FaXTwitter className="w-3.5 h-3.5" />
            {t("footer.x")}
          </a>
        </div>
      </div>
    </div>
  );
}

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

function InstallCommands() {
  const t = useTranslations();

  const commands = [
    {
      labelKey: "install.shell" as const,
      command: "curl -fsSL https://releases.wolffi.sh/install.sh | sh",
      Icon: FaTerminal,
    },
    {
      labelKey: "install.powershell" as const,
      command: "irm https://releases.wolffi.sh/install.ps1 | iex",
      Icon: FaWindows,
    },
  ];

  return (
    <div className="mt-10 w-full max-w-5xl pointer-events-auto space-y-3">
      {commands.map(({ labelKey, command, Icon }) => (
        <div
          key={labelKey}
          dir="ltr"
          className="flex items-center gap-4 px-5 py-3.5 rounded-2xl backdrop-blur-md bg-white/4 border border-white/8"
        >
          <Icon className="w-4 h-4 text-white/30 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-1">
              {t(labelKey, {
                macos: t("download.macos"),
                windows: t("download.windows"),
                linux: t("download.linux"),
              })}
            </div>
            <code className="text-xs text-white/80 font-mono block truncate">
              {command}
            </code>
          </div>
          <CopyButton text={command} />
        </div>
      ))}
    </div>
  );
}
