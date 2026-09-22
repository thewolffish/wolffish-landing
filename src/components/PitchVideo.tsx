"use client";

import { useCallback, useEffect, useState } from "react";
import { FaPlay, FaXmark, FaYoutube } from "react-icons/fa6";

// The recorded pitch, the same story the deck tells. One video, two entry
// points: a floating banner on /cloud and a button in the deck's top bar.
export const PITCH_VIDEO_ID = "PDwPrBb_p7Q";
export const PITCH_VIDEO_URL = `https://youtu.be/${PITCH_VIDEO_ID}`;
const EMBED = `https://www.youtube.com/embed/${PITCH_VIDEO_ID}?autoplay=1&rel=0`;
const YOUTUBE_RED = "#FF0000";

export interface PitchVideoUi {
  title: string;
  /** Only the floating card shows a second line. */
  desc?: string;
  close: string;
}

/**
 * The player itself, in the same shape the home page uses: a dimmed overlay,
 * a sixteen by nine frame, escape and click-outside to close, and the page
 * behind it locked while it plays.
 */
function VideoDialog({
  title,
  closeLabel,
  onClose,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // The deck scrolls on the root element, /cloud on the body: lock both.
    const root = document.documentElement.style.overflow;
    const body = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = root;
      document.body.style.overflow = body;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative"
        style={{ width: "min(92vw, calc(80vh * 16 / 9))", aspectRatio: "16 / 9" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute -top-10 end-0 inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          {closeLabel}
          <FaXmark className="w-3.5 h-3.5" />
        </button>
        <iframe
          src={EMBED}
          title={title}
          className="w-full h-full rounded-2xl border border-white/10 shadow-2xl bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

/**
 * The floating banner on /cloud, at the bottom start and the only floating
 * card on that page. Light themed like the rest of it, with the play tile in
 * YouTube's own red.
 */
export function PitchVideoCard({ ui }: { ui: PitchVideoUi }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed z-30 bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-5 sm:start-5 sm:max-w-[300px] flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur-md border border-neutral-200 hover:border-red-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.16)] transition-all px-4 py-3 text-start cursor-pointer"
      >
        <span
          className="w-10 h-10 shrink-0 rounded-xl text-white flex items-center justify-center"
          style={{ backgroundColor: YOUTUBE_RED }}
        >
          <FaYoutube className="w-5 h-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-neutral-900 leading-snug">
            {ui.title}
          </span>
          {ui.desc && (
            <span className="block text-[11px] text-neutral-500 leading-snug mt-0.5">
              {ui.desc}
            </span>
          )}
        </span>
        <span className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 transition-colors group-hover:border-transparent group-hover:bg-[#FF0000]">
          <FaPlay className="w-2.5 h-2.5 text-[#FF0000] transition-colors group-hover:text-white rtl:rotate-180" />
        </span>
      </button>
      {open && <VideoDialog title={ui.title} closeLabel={ui.close} onClose={close} />}
    </>
  );
}

/** The deck's top-bar button, beside "Book a call". Icon only on phones. */
export function PitchVideoButton({ ui }: { ui: PitchVideoUi }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ui.title}
        className="inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-white text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: YOUTUBE_RED }}
      >
        <FaYoutube className="w-4 h-4" />
        <span className="hidden sm:inline">{ui.title}</span>
      </button>
      {open && <VideoDialog title={ui.title} closeLabel={ui.close} onClose={close} />}
    </>
  );
}
