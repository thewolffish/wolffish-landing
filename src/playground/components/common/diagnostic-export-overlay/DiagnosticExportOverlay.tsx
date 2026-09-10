'use client'

/**
 * Full-screen BLOCKING overlay for the per-conversation diagnostic export.
 *
 * Visual language is the reindex overlay's (pulsing ringed icon, started-at +
 * live elapsed, explanatory body, progress bar) because that's the app's
 * established "a job owns the screen right now" look. It cannot be dismissed
 * while collecting — no Escape handler, no backdrop click; the only exit is
 * the Done button, which only exists once the run has finished.
 *
 * In the replica the collection is a walk through the same named steps on a
 * timer — nothing is read off a machine — and the archive it ends on cannot be
 * revealed or saved, so those two buttons answer with the demo toast.
 */
import { Button } from '@/playground/components/core/Button'
import { cn } from '@/playground/lib/cn'
import { useTranslation, useLocale } from '@/playground/i18n'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import {
  Bug01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  FolderOpenIcon
} from 'hugeicons-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const STEPS = [
  'conversation',
  'logs',
  'tasks',
  'memory',
  'context',
  'settings',
  'attachments',
  'opinion',
  'archive'
] as const

/** What the finished bundle reports — the demo's fixed roll-up. */
const GROUPS: Array<{ key: string; count: number }> = [
  { key: 'summary', count: 2 },
  { key: 'conversation', count: 1 },
  { key: 'logs', count: 6 },
  { key: 'tasks', count: 3 },
  { key: 'memory', count: 4 },
  { key: 'context', count: 5 },
  { key: 'settings', count: 2 },
  { key: 'attachments', count: 3 }
]

const STEP_MS = 420

export type DiagnosticExportOverlayProps = {
  conversationId: string
  onClose: () => void
}

export function DiagnosticExportOverlay({
  conversationId,
  onClose
}: DiagnosticExportOverlayProps): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const demoAction = useDemoAction()
  const [stepIndex, setStepIndex] = useState(0)
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  // The walk through the steps, and the 1 Hz clock beside it. Both stop when
  // the last step lands — a finished bundle shows its own duration.
  useEffect(() => {
    const id = setInterval(() => setStepIndex((i) => Math.min(i + 1, STEPS.length)), STEP_MS)
    return () => clearInterval(id)
  }, [])
  const running = stepIndex < STEPS.length
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000))
  const elapsedStr = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`
  const startedStr = new Date(startedAt).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  })
  const pct = running ? Math.min(95, Math.round((stepIndex / (STEPS.length + 1)) * 100)) : 100
  const fileCount = GROUPS.reduce((n, g) => n + g.count, 0)
  const fileName = `wolffish-diagnostics-${conversationId}.zip`

  return createPortal(
    <div
      // No onClick / onKeyDown dismissal: the export owns the screen until it
      // finishes. `bg-bg` (opaque, not a translucent scrim) makes the blocking
      // intent unambiguous.
      className="bg-bg fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-6 py-12"
      role="dialog"
      aria-modal="true"
      aria-busy={running}
      aria-label={t('diagnostics.overlay.title')}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="relative">
          {running && <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />}
          <div
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full',
              running ? 'bg-amber-500/15' : 'bg-emerald-500/15'
            )}
          >
            {running ? (
              <Bug01Icon size={20} className="animate-pulse text-amber-500" />
            ) : (
              <CheckmarkCircle02Icon size={20} className="text-emerald-500" />
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-fg text-sm font-medium">
            {running ? t('diagnostics.overlay.title') : t('diagnostics.overlay.doneTitle')}
          </h2>
          <div className="text-muted flex items-center gap-2 text-xs">
            <span>{t('diagnostics.overlay.startedAt', { time: startedStr })}</span>
            <span className="text-border">·</span>
            {/* duration is conventionally LTR even in RTL UIs */}
            <span dir="ltr" className="font-mono tabular-nums">
              {elapsedStr}
            </span>
          </div>
        </div>

        {running ? (
          <>
            <pre className="text-muted bg-surface border-border w-full rounded-lg border px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap">
              {t('diagnostics.overlay.body')}
            </pre>

            <div className="border-border bg-surface/50 w-full rounded-lg border px-3 py-2.5">
              <div className="text-muted mb-1.5 flex items-center justify-between text-[10px] font-medium tracking-wide uppercase">
                <span>
                  {stepIndex > 0
                    ? t(`diagnostics.steps.${STEPS[stepIndex - 1]}`)
                    : t('diagnostics.overlay.progress')}
                </span>
                {/* "n / total" pinned LTR so the count reads correctly in RTL */}
                <span dir="ltr" className="tabular-nums">
                  {stepIndex} / {STEPS.length}
                </span>
              </div>
              <div className="bg-border/60 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-amber-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <p className="text-muted/50 text-center text-[11px]">
              {t('diagnostics.overlay.blocked')}
            </p>
          </>
        ) : (
          <>
            {/* The archive card sits ABOVE the save prompt: the file already
                exists in the workspace, and saving a copy elsewhere is the
                optional second step. */}
            <div className="border-border bg-surface w-full rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Download01Icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-fg truncate text-xs font-medium" title={fileName}>
                    {fileName}
                  </p>
                  <p className="text-muted mt-0.5 text-[11px]" dir="ltr">
                    {t('diagnostics.overlay.fileCount', { count: fileCount })}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={demoAction} className="flex-1">
                  <FolderOpenIcon size={14} />
                  {t('diagnostics.overlay.reveal')}
                </Button>
                <Button variant="primary" size="sm" onClick={demoAction} className="flex-1">
                  <Download01Icon size={14} />
                  {t('diagnostics.overlay.saveCopy')}
                </Button>
              </div>
            </div>

            <div className="border-border bg-surface/50 w-full rounded-lg border px-3 py-2.5">
              <p className="text-muted mb-1.5 text-[10px] font-medium tracking-wide uppercase">
                {t('diagnostics.overlay.summary')}
              </p>
              <ul className="text-muted flex flex-col gap-1 text-[11px]">
                {GROUPS.map((group) => (
                  <li key={group.key} className="flex items-center justify-between gap-2">
                    <span className="truncate">{t(`diagnostics.groups.${group.key}`)}</span>
                    <span dir="ltr" className="tabular-nums">
                      {group.count}
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-2">
                  <span className="truncate">{t('diagnostics.groups.opinion')}</span>
                  <span className="truncate text-right">
                    {t('diagnostics.overlay.opinionIncluded')}
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-muted text-center text-[11px] leading-relaxed">
              {t('diagnostics.overlay.forward')}
            </p>
          </>
        )}

        {/* The ONLY way out, and it only exists once the run has finished. */}
        {!running && (
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className={cn(
              'bg-primary text-primary-fg w-full cursor-pointer rounded-lg px-4 py-2 text-xs font-medium',
              'hover:brightness-110',
              'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2'
            )}
          >
            {t('diagnostics.overlay.done')}
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
