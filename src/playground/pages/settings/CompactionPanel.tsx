'use client'

import { Select, type SelectOption } from '@/playground/components/core/Select'
import { cn } from '@/playground/lib/cn'
import { formatCompact } from '@/playground/lib/format'
import { useLocale, useTranslation } from '@/playground/i18n'
import { useDemo, useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { COMPACTION_RUNS } from '@/playground/data/compaction'
import type { CompactionConfig, CompactionRunRecord, CompactionRuns } from '@/playground/data/types'
import { Activity04Icon, Refresh01Icon } from 'hugeicons-react'
import { useEffect, useMemo, useState } from 'react'

const HOUR_OPTIONS: SelectOption<string>[] = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, '0')}:00`
}))

export function CompactionPanel(): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { config: workspace, patchConfig } = useDemo()
  const demoAction = useDemoAction()

  const config: CompactionConfig | null = workspace.compaction
  const runs: CompactionRuns | null = COMPACTION_RUNS
  const saving: 'daily' | 'weekly' | 'cards' | null = null
  const resyncing = false
  const [now, setNow] = useState(() => Date.now())

  // Tick every 60s so the "runs in …" label stays fresh
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const persist = (patch: Partial<CompactionConfig>): void => {
    patchConfig((c) => ({ ...c, compaction: { ...c.compaction, ...patch } }))
  }

  const dayOptions = useMemo<SelectOption<string>[]>(
    () =>
      [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        value: String(d),
        label: t(`settings.knowledge.compaction.days.${d}`)
      })),
    [t]
  )

  if (!config) return <div />

  return (
    <div className="flex min-h-full w-full items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-fg text-2xl font-semibold tracking-tight">
              {t('settings.knowledge.compaction.title')}
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              {t('settings.knowledge.compaction.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={demoAction}
            disabled={resyncing}
            aria-label={t('settings.knowledge.compaction.resync')}
            className={cn(
              'inline-flex items-center gap-1 rounded-md text-xs cursor-pointer',
              'text-muted hover:text-fg px-1.5 py-0.5',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <Refresh01Icon size={14} />
            <span>{t('settings.knowledge.compaction.resync')}</span>
          </button>
        </header>

        <section className="bg-surface border-border flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-6 py-4 max-sm:px-4">
          <span className="text-fg text-sm font-medium">
            {new Date(now).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
          </span>
          <code className="text-muted bg-bg/60 border-border/40 rounded border px-2 py-1 text-[11px]">
            {new Intl.DateTimeFormat(locale, { timeZoneName: 'long' })
              .formatToParts(now)
              .find((p) => p.type === 'timeZoneName')?.value ??
              Intl.DateTimeFormat().resolvedOptions().timeZone}
          </code>
        </section>

        <section className="bg-surface border-border flex flex-col gap-6 rounded-2xl border p-6 max-sm:p-4">
          {/* Daily compaction */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <span className="text-fg text-sm font-medium">
                {t('settings.knowledge.compaction.daily.label')}
              </span>
              <Select<string>
                className="min-w-28"
                value={String(config.dailyHour)}
                options={HOUR_OPTIONS}
                onChange={(v) => persist({ dailyHour: Number(v) })}
                disabled={saving === 'daily'}
              />
            </div>
            <p className="text-muted text-xs leading-relaxed">
              {t('settings.knowledge.compaction.daily.description')}
            </p>
            <NextRun ms={nextDailyMs(config.dailyHour, now)} locale={locale} />
          </div>

          <div className="border-border/60 border-t" />

          {/* Weekly consolidation */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <span className="text-fg text-sm font-medium">
                {t('settings.knowledge.compaction.weekly.label')}
              </span>
              <div className="flex items-center gap-2 max-sm:w-full">
                <Select<string>
                  className="min-w-32"
                  value={String(config.weeklyDay)}
                  options={dayOptions}
                  onChange={(v) => persist({ weeklyDay: Number(v) })}
                  disabled={saving === 'weekly'}
                />
                <Select<string>
                  className="min-w-28"
                  value={String(config.weeklyHour)}
                  options={HOUR_OPTIONS}
                  onChange={(v) => persist({ weeklyHour: Number(v) })}
                  disabled={saving === 'weekly'}
                />
              </div>
            </div>
            <p className="text-muted text-xs leading-relaxed">
              {t('settings.knowledge.compaction.weekly.description')}
            </p>
            <NextRun ms={nextWeeklyMs(config.weeklyDay, config.weeklyHour, now)} locale={locale} />
          </div>

          <div className="border-border/60 border-t" />

          {/* The floating card a running compaction pass draws over the chat —
              here and on the paired phone, one switch for both. Off (default)
              hides the card only: the passes still run on the schedule above,
              and the last-run cards below still report them. */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-fg text-sm font-medium">
                {t('settings.knowledge.compaction.cards.label')}
              </span>
              <p className="text-muted text-xs leading-relaxed">
                {t('settings.knowledge.compaction.cards.description')}
              </p>
            </div>
            <OnOffToggle
              value={config.cards === true}
              disabled={saving === 'cards'}
              onChange={(value) => persist({ cards: value })}
            />
          </div>
        </section>

        {/* Last-run cards — absent entirely until a job has actually run. */}
        {runs?.daily && <LastRunCard kind="daily" record={runs.daily} locale={locale} />}
        {runs?.weekly && <LastRunCard kind="weekly" record={runs.weekly} locale={locale} />}
      </div>
    </div>
  )
}

// ── Small controls ───────────────────────────────────────────────────

/** The segmented on/off control, worded exactly as the reflection panel's. */
function OnOffToggle({
  value,
  disabled,
  onChange
}: {
  value: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const options: Array<{ value: boolean; label: string }> = [
    { value: true, label: t('settings.knowledge.compaction.on') },
    { value: false, label: t('settings.knowledge.compaction.off') }
  ]
  return (
    <div
      role="tablist"
      className="border-border bg-bg/40 inline-flex shrink-0 items-center self-start rounded-lg border p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              disabled
                ? 'text-muted/50 cursor-not-allowed'
                : active
                  ? 'bg-primary text-primary-fg shadow-sm'
                  : 'text-muted hover:text-fg cursor-pointer'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Last-run cards ───────────────────────────────────────────────────

const CHIP_CLASS = 'text-muted bg-bg/60 border-border/40 rounded border px-2 py-1 text-[11px]'

function formatDuration(ms: number, locale: string): string {
  const seconds = ms / 1000
  try {
    if (seconds < 90) {
      return new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'second',
        maximumFractionDigits: seconds < 10 ? 1 : 0
      }).format(seconds)
    }
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'minute',
      maximumFractionDigits: 1
    }).format(seconds / 60)
  } catch {
    return `${Math.round(seconds)}s`
  }
}

function LastRunCard({
  kind,
  record,
  locale
}: {
  kind: 'daily' | 'weekly'
  record: CompactionRunRecord
  locale: string
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <section className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-6 max-sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Activity04Icon size={16} className="text-muted" />
          <span className="text-fg text-sm font-medium">
            {t(`settings.knowledge.compaction.lastRun.${kind}Title`)}
          </span>
        </div>
        <code className={CHIP_CLASS}>
          {t('settings.knowledge.compaction.lastRun.ranAt', {
            time: new Date(record.at).toLocaleString(locale, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          })}
        </code>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {record.model && <code className={CHIP_CLASS}>{record.model}</code>}
        <code className={CHIP_CLASS}>
          {t('settings.knowledge.compaction.lastRun.took', {
            duration: formatDuration(record.durationMs, locale)
          })}
        </code>
        {record.inputTokens !== null && record.outputTokens !== null && (
          <code className={CHIP_CLASS}>
            {t('settings.knowledge.compaction.lastRun.tokens', {
              input: formatCompact(record.inputTokens, locale),
              output: formatCompact(record.outputTokens, locale)
            })}
          </code>
        )}
      </div>
      <pre
        dir="auto"
        className="text-fg/80 bg-bg/60 border-border/40 max-h-64 overflow-auto rounded-lg border p-3 text-[11px] leading-relaxed whitespace-pre-wrap"
      >
        {record.output}
      </pre>
    </section>
  )
}

// ── "runs in …" helpers ──────────────────────────────────────────────

function nextDailyMs(hour: number, nowMs: number): number {
  const d = new Date(nowMs)
  d.setHours(hour, 0, 0, 0)
  if (d.getTime() <= nowMs) d.setDate(d.getDate() + 1)
  return d.getTime() - nowMs
}

function nextWeeklyMs(day: number, hour: number, nowMs: number): number {
  const d = new Date(nowMs)
  d.setHours(hour, 0, 0, 0)
  const diff = (day - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 && d.getTime() <= nowMs ? 7 : diff))
  return d.getTime() - nowMs
}

function formatFromNow(ms: number, locale: string): string {
  const totalMinutes = Math.round(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const days = Math.floor(hours / 24)

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (days > 0) return rtf.format(days, 'day')
    if (hours > 0) return rtf.format(hours, 'hour')
    return rtf.format(totalMinutes, 'minute')
  } catch {
    if (days > 0) return `in ${days}d`
    if (hours > 0) return `in ${hours}h`
    return `in ${totalMinutes}m`
  }
}

function NextRun({ ms, locale }: { ms: number; locale: string }): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <code className="text-muted bg-bg/60 border-border/40 inline-block self-start rounded border px-2 py-1 text-[11px]">
      {t('settings.knowledge.compaction.nextRun', { time: formatFromNow(ms, locale) })}
    </code>
  )
}
