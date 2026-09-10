import { useTranslation } from '@/playground/i18n'
import { useEffect, useState } from 'react'

/**
 * The first paint — the desktop's bootstrap restore, drawn as one calm
 * full-screen moment: the logo, what is happening, and a progress bar that
 * walks the restore steps (sign-in, config, conversations, files,
 * capabilities). Deliberately paced: a demo that flashes straight into a chat
 * reads as a mock-up; one that visibly restores reads as the app.
 */
export const RESTORE_MS = 2_200

export function RestoreSkeleton(): React.JSX.Element {
  const { t } = useTranslation()
  const steps = t('demo.restore.steps', { returnObjects: true }) as unknown as string[]
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const started = performance.now()
    let frame = 0
    const tick = (): void => {
      setElapsed(Math.min(RESTORE_MS, performance.now() - started))
      if (performance.now() - started < RESTORE_MS) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Eased progress so the bar starts quickly and settles into the last step.
  const raw = elapsed / RESTORE_MS
  const progress = 1 - Math.pow(1 - raw, 2.2)
  const stepIndex = Math.min(steps.length - 1, Math.floor(progress * steps.length))

  return (
    <main
      role="status"
      aria-live="polite"
      aria-label={t('demo.restore.title')}
      className="bg-bg text-fg flex h-full w-full flex-col items-center justify-center px-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- the app's own logo, a site asset */}
        <img
          src="/icon_transparent.png"
          alt=""
          aria-hidden
          draggable={false}
          className="h-20 w-20 animate-pulse object-contain"
        />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{t('demo.restore.title')}</h1>
          <p className="text-muted text-sm leading-relaxed">{t('demo.restore.subtitle')}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="bg-border/60 h-1.5 w-full overflow-hidden rounded-full"
          >
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-150 ease-out"
              style={{ width: `${Math.max(4, progress * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted min-w-0 truncate">{steps[stepIndex]}…</span>
            <span className="text-muted shrink-0 tabular-nums" dir="ltr">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
