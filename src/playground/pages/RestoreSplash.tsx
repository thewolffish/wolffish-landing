import Image from 'next/image'
import { DEMO_STRINGS } from '@/playground/i18n/demo'

/**
 * The restore screen's FIRST frame, with no hooks and no client state — so it
 * can be server-rendered as the playground route's initial HTML and drawn by
 * the hero frame while the document loads. RestoreSkeleton continues from
 * exactly this picture once the app's JavaScript is up, so a cold first load
 * shows one restore from the first byte to the chat, never a blank window.
 */
export function RestoreSplash({ locale }: { locale: 'en' | 'ar' }): React.JSX.Element {
  const restore = DEMO_STRINGS[locale].restore
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label={restore.title}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="bg-bg text-fg flex h-full w-full flex-col items-center justify-center px-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Image
          src="/icon_transparent.png"
          alt=""
          aria-hidden
          width={80}
          height={80}
          priority
          className="h-20 w-20 animate-pulse object-contain"
        />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{restore.title}</h1>
          <p className="text-muted text-sm leading-relaxed">{restore.subtitle}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            className="bg-border/60 h-1.5 w-full overflow-hidden rounded-full"
          >
            <div className="bg-primary h-full w-[4%] rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted min-w-0 truncate">{restore.steps[0]}…</span>
            <span className="text-muted shrink-0 tabular-nums" dir="ltr">
              0%
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
