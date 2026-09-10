'use client'

import { useEffect, useRef, useState } from 'react'
import { RestoreSplash } from '@/playground/pages/RestoreSplash'
import { FaArrowUpRightFromSquare } from 'react-icons/fa6'

export interface CloudPlaygroundUi {
  cardTitle: string
  cardDesc: string
  title: string
  badge: string
  open: string
  hint: string
}

/**
 * The hero's embedded desktop — a macOS window frame around the playground
 * route in an iframe. The iframe is what keeps the replica exact: the app's
 * fixed chrome, sheets and `h-full` layout resolve against its own viewport,
 * and its light/dark theme and RTL direction stay isolated from the landing
 * page. The frame is keyed by locale, so the site's language toggle reloads
 * the app in the new language; the locale also rides the URL so the reload
 * never depends on cookie timing.
 */
export default function CloudPlayground({
  ui,
  locale
}: {
  ui: CloudPlaygroundUi
  locale: string
}): React.JSX.Element {
  const href = `/cloud/playground?locale=${locale === 'ar' ? 'ar' : 'en'}`
  return (
    <div className="w-full">
      {/* The explainer: what this is and how to use it, with the chip and the
          full-screen link out of the window chrome so the app's own corners stay
          clear. */}
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-white p-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight text-neutral-900">{ui.cardTitle}</h2>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-emerald-700 uppercase">
              {ui.badge}
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-neutral-600">{ui.cardDesc}</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          {ui.open}
          <FaArrowUpRightFromSquare className="h-3 w-3" />
        </a>
      </div>
      <PlaygroundFrame key={locale} ui={ui} href={href} locale={locale === 'ar' ? 'ar' : 'en'} />
    </div>
  )
}

/** The window itself; remounted per locale so the loading state resets with the reload. */
function PlaygroundFrame({
  ui,
  href,
  locale
}: {
  ui: CloudPlaygroundUi
  href: string
  locale: 'en' | 'ar'
}): React.JSX.Element {
  const [loaded, setLoaded] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)

  // The server-rendered iframe can finish loading before React hydrates, in
  // which case its load event fired before onLoad was attached. Same origin,
  // so read the document's state on mount; a generous timer is the backstop
  // (the app draws its own restore screen anyway).
  useEffect(() => {
    const frame = frameRef.current
    let cancelled = false
    const check = (): boolean => {
      try {
        const doc = frame?.contentDocument
        if (doc && doc.readyState === 'complete' && doc.location.pathname.startsWith('/cloud/playground')) {
          setLoaded(true)
          return true
        }
      } catch {
        // Cross-origin would throw; the onLoad path covers it.
      }
      return false
    }
    const poll = window.setInterval(() => {
      if (cancelled || check()) window.clearInterval(poll)
    }, 250)
    const fallback = window.setTimeout(() => {
      if (!cancelled) setLoaded(true)
    }, 8000)
    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.clearTimeout(fallback)
    }
  }, [])

  return (
    <div
      dir="ltr"
      className="relative mx-auto w-full overflow-hidden rounded-2xl border border-neutral-200 bg-[#f0f4f8] shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)]"
    >
      {/* The window's title bar: traffic lights and the title. Clicks pass
          through to the app underneath. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-10 items-center gap-2 px-3">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e] ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/10" />
        </span>
        <span className="pointer-events-none absolute inset-x-0 text-center text-[12px] font-medium text-neutral-500">
          {ui.title}
        </span>
      </div>
      <div className="relative w-full h-[78svh] min-h-[560px] max-h-[820px] md:h-auto md:aspect-[16/10] md:min-h-[680px] md:max-h-none">
        {!loaded && (
          <div className="absolute inset-0 z-10 bg-[#f0f4f8]">
            <RestoreSplash locale={locale} />
          </div>
        )}
        <iframe
          ref={frameRef}
          src={href}
          title={ui.title}
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full border-0"
          allow="clipboard-write; fullscreen"
        />
      </div>
    </div>
  )
}
