'use client'

import {
  ActivityHeatmap,
  type ActivityHeatmapEntry
} from '@/playground/components/charts/activity-heatmap/ActivityHeatmap'
import { BraveLogo } from '@/playground/components/core/ProviderLogos'
import { cn } from '@/playground/lib/cn'
import { formatCompact } from '@/playground/lib/format'
import { useLocale, useTranslation } from '@/playground/i18n'
import { useDemo, useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { usageDaily, usageStats, usageSummary } from '@/playground/data/usage'
import type {
  UsageDailyEntry,
  UsageProviderSummary,
  UsageStats,
  UsageSummary,
  UsageTimeRange,
  WeekStartsOn
} from '@/playground/data/types'
import {
  BubbleChatIcon,
  CalendarCheckOut02Icon,
  ChartAverageIcon,
  ChartUpIcon,
  CloudIcon,
  Database02Icon,
  Fire03Icon,
  MessageMultiple01Icon,
  Refresh01Icon,
  StarIcon,
  Wallet01Icon
} from 'hugeicons-react'
import { useMemo, useState } from 'react'

type IconComp = React.ComponentType<{ size?: number; className?: string }>
type BraveUsageSummary = UsageSummary['brave']

const TIME_RANGES: UsageTimeRange[] = [
  'today',
  'this_month',
  '3_months',
  '6_months',
  'ytd',
  'all_time'
]

// One lane: every model call flows through the org API. The same glyph the
// Models panel puts on the lane, so the two screens read as one thing.
const PROVIDER_ICONS: Record<UsageProviderSummary['provider'], IconComp> = {
  cloud: CloudIcon
}

type RangeData = { summary: UsageSummary; stats: UsageStats }

export function UsagePanel(): React.JSX.Element {
  const { t } = useTranslation()
  const { config } = useDemo()
  const demoAction = useDemoAction()
  const weekStartsOn: WeekStartsOn = config.weekStartsOn
  const [range, setRange] = useState<UsageTimeRange>('all_time')
  const year = new Date().getFullYear()
  const syncing = false

  // The ledger is in memory, so the figures for a range are derived on the
  // spot — the desktop's keyed caches existed to keep the panel off a
  // skeleton between IPC round-trips.
  const data: RangeData | null = useMemo(
    () => ({ summary: usageSummary(range), stats: usageStats(range) }),
    [range]
  )
  const daily: UsageDailyEntry[] | undefined = useMemo(() => usageDaily(year), [year])

  return (
    <div className="flex min-h-full w-full items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-fg text-2xl font-semibold tracking-tight">
              {t('settings.usage.title')}
            </h1>
            <p className="text-muted text-sm leading-relaxed">{t('settings.usage.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={demoAction}
            disabled={syncing}
            aria-label={t('settings.usage.sync')}
            className={cn(
              'inline-flex items-center gap-1 rounded-md text-xs cursor-pointer',
              'text-muted hover:text-fg px-1.5 py-0.5',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <Refresh01Icon size={14} />
            <span>{t('settings.usage.sync')}</span>
          </button>
        </header>

        <RangeSelector range={range} onChange={setRange} />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-fg text-sm font-semibold">{t('settings.usage.activity')}</h2>
            <span className="text-muted text-xs font-medium tabular-nums">{year}</span>
          </div>
          {/* 53 columns squeezed into a phone's width leave sub-pixel cells,
              so below sm the year keeps a readable cell size and scrolls
              sideways inside its own box instead. */}
          <div className="max-sm:overflow-x-auto">
            <div className="max-sm:min-w-[520px]">
              {daily === undefined ? (
                <ActivityMapSkeleton year={year} weekStartsOn={weekStartsOn} />
              ) : (
                <ActivityHeatmap
                  entries={toEntries(daily)}
                  year={year}
                  weekStartsOn={weekStartsOn}
                  showMonthLabels={false}
                  showWeekdayLabels={false}
                  formatTooltip={(e) =>
                    t('settings.usage.activityTooltip', {
                      date: e.date,
                      tokens: formatCompact(e.value)
                    })
                  }
                />
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-fg text-sm font-semibold">{t('settings.usage.overview')}</h2>
          {data === null ? <StatsGridSkeleton /> : <StatsGrid stats={data.stats} />}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-fg text-sm font-semibold">{t('settings.usage.costs.title')}</h2>
          {data === null ? <CostCardsSkeleton /> : <CostCards stats={data.stats} />}
        </section>

        {data === null ? (
          <ProviderCardsSkeleton />
        ) : (
          <div className="flex flex-col gap-3">
            {data.summary.providers.map((p) => (
              <ProviderCard key={p.provider} provider={p} />
            ))}
            <BraveSearchCard brave={data.summary.brave} />
          </div>
        )}
      </div>
    </div>
  )
}

function CostCards({ stats }: { stats: UsageStats }): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const topDay = stats.topSpendDay
  const dailyAverage = stats.activeDays > 0 ? stats.totalCost / stats.activeDays : 0
  const items: Array<{ label: string; value: string; icon: IconComp; hint?: string }> = [
    {
      label: t('settings.usage.costs.totalSpend'),
      value: formatCost(stats.totalCost),
      icon: Wallet01Icon
    },
    {
      label: t('settings.usage.costs.topDaySpend'),
      value: formatCost(topDay?.cost ?? 0),
      hint: topDay ? formatDay(topDay.date, locale) : undefined,
      icon: ChartUpIcon
    },
    {
      label: t('settings.usage.costs.dailyAverage'),
      value: formatCost(dailyAverage),
      icon: ChartAverageIcon
    }
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <StatCard key={it.label} label={it.label} value={it.value} Icon={it.icon} hint={it.hint} />
      ))}
    </div>
  )
}

function toEntries(daily: UsageDailyEntry[]): Array<{ date: string; value: number }> {
  return daily.map((d) => ({ date: d.date, value: d.totalTokens }))
}

function RangeSelector({
  range,
  onChange
}: {
  range: UsageTimeRange
  onChange: (r: UsageTimeRange) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="bg-surface border-border flex rounded-lg border p-0.5 max-sm:overflow-x-auto">
      {TIME_RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            'flex-1 cursor-pointer rounded-md px-2 py-1.5 text-[11px] font-medium whitespace-nowrap',
            'max-sm:shrink-0 max-sm:flex-none',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            range === r ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-fg'
          )}
        >
          {t(`settings.usage.range.${r}`)}
        </button>
      ))}
    </div>
  )
}

function ProviderCard({ provider }: { provider: UsageProviderSummary }): React.JSX.Element {
  const { t } = useTranslation()
  const Logo = PROVIDER_ICONS[provider.provider]
  const totalTokens = provider.totalInputTokens + provider.totalOutputTokens
  const hasUsage = totalTokens > 0

  return (
    <div
      className={cn('bg-surface border-border rounded-xl border p-4', !hasUsage && 'opacity-50')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Logo size={16} />
          <span className="text-fg truncate text-sm font-medium">
            {t(`settings.usage.providers.${provider.provider}`)}
          </span>
        </div>
        {hasUsage ? (
          <div className="flex shrink-0 items-center gap-4 max-sm:gap-2">
            <span className="text-muted text-xs">
              {formatCompact(totalTokens)} {t('settings.usage.tokens')}
            </span>
            <span className="text-fg text-xs font-medium">${provider.totalCost.toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-muted text-xs">{t('settings.usage.noUsage')}</span>
        )}
      </div>

      {hasUsage && provider.models.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {provider.models.map((m) => (
            <div key={m.model} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted min-w-0 flex-1 truncate max-w-[200px]">{m.model}</span>
              <div className="flex shrink-0 items-center gap-3 max-sm:gap-2">
                <span className="text-muted">
                  {formatCompact(m.inputTokens + m.outputTokens)} {t('settings.usage.tokens')}
                </span>
                <span className="text-muted">${m.cost.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BraveSearchCard({ brave }: { brave: BraveUsageSummary }): React.JSX.Element {
  const { t } = useTranslation()
  const hasUsage = brave.totalQueries > 0

  return (
    <div
      className={cn('bg-surface border-border rounded-xl border p-4', !hasUsage && 'opacity-50')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <BraveLogo size={16} />
          <span className="text-fg truncate text-sm font-medium">
            {t('settings.usage.providers.brave')}
          </span>
        </div>
        {hasUsage ? (
          <div className="flex shrink-0 items-center gap-4 max-sm:gap-2">
            <span className="text-muted text-xs">
              {formatCompact(brave.totalQueries)} {t('settings.usage.queries')}
            </span>
            <span className="text-fg text-xs font-medium">${brave.totalCost.toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-muted text-xs">{t('settings.usage.noUsage')}</span>
        )}
      </div>
    </div>
  )
}

function StatsGrid({ stats }: { stats: UsageStats }): React.JSX.Element {
  const { t } = useTranslation()
  const items: Array<{ label: string; value: string; icon: IconComp }> = [
    {
      label: t('settings.usage.stats.conversations'),
      value: formatCompact(stats.conversations),
      icon: MessageMultiple01Icon
    },
    {
      label: t('settings.usage.stats.messages'),
      value: formatCompact(stats.messages),
      icon: BubbleChatIcon
    },
    {
      label: t('settings.usage.stats.totalTokens'),
      value: formatCompact(stats.totalTokens),
      icon: Database02Icon
    },
    {
      label: t('settings.usage.stats.activeDays'),
      value: formatCompact(stats.activeDays),
      icon: CalendarCheckOut02Icon
    },
    {
      label: t('settings.usage.stats.longestStreak'),
      value: t(
        stats.longestStreak === 1
          ? 'settings.usage.stats.streakDay'
          : 'settings.usage.stats.streakDays',
        {
          count: stats.longestStreak
        }
      ),
      icon: Fire03Icon
    },
    {
      label: t('settings.usage.stats.favouriteModel'),
      value: stats.favouriteModel ?? t('settings.usage.stats.noModel'),
      icon: StarIcon
    }
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <StatCard key={it.label} label={it.label} value={it.value} Icon={it.icon} />
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  Icon,
  hint
}: {
  label: string
  value: string
  Icon: IconComp
  hint?: string
}): React.JSX.Element {
  return (
    <div className="bg-surface border-border flex flex-col gap-1 rounded-xl border p-3">
      <div className="text-muted flex items-center gap-1.5 text-[11px]">
        <Icon size={12} />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-fg truncate text-sm font-semibold tabular-nums">{value}</span>
        {hint !== undefined && (
          <span className="text-muted shrink-0 text-[11px] tabular-nums">{hint}</span>
        )}
      </div>
    </div>
  )
}

/**
 * A pulse bar that is a real — if transparent — text node, so its height is
 * the exact line box of the text it stands in for and tracks it for free if
 * that text is ever restyled. Hand-picked bar heights are what left the old
 * skeleton short of every row it replaced: `text-[11px]` sets no line-height
 * of its own and resolves to 16.5px, not the 12px a `h-3` bar guessed.
 */
function SkeletonBar({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      className={cn('bg-border/60 animate-pulse rounded text-transparent select-none', className)}
    >
      &nbsp;
    </span>
  )
}

// Every skeleton below mirrors the element structure, classes and font sizes of
// the component it stands in for, so the two are the same height by
// construction and the panel doesn't jump when the numbers land.

function StatCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-surface border-border flex flex-col gap-1 rounded-xl border p-3">
      <div className="text-muted flex items-center gap-1.5 text-[11px]">
        <span className="bg-border/60 size-3 shrink-0 animate-pulse rounded-sm" />
        <SkeletonBar className="w-16" />
      </div>
      <SkeletonBar className="w-12 text-sm" />
    </div>
  )
}

function StatsGridSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

function CostCardsSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

function ProviderCardsSkeleton(): React.JSX.Element {
  // The summary zero-fills every lane it knows about, so the real list is
  // always the full roster plus the Brave card — never a short list. Counting
  // the icon map keeps this honest if a lane is ever added.
  const count = Object.keys(PROVIDER_ICONS).length + 1
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-surface border-border rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-border/60 size-4 shrink-0 animate-pulse rounded-sm" />
              <SkeletonBar className="w-24 text-sm" />
            </div>
            <SkeletonBar className="w-16 text-xs" />
          </div>
        </div>
      ))}
    </div>
  )
}

// The heatmap derives its cell size from its own measured width, so the
// skeleton is the real component fed an empty year: identical geometry at every
// window width, which a fixed height could only match at the panel's max-width.
const NO_ENTRIES: ActivityHeatmapEntry[] = []

function ActivityMapSkeleton({
  year,
  weekStartsOn
}: {
  year: number
  weekStartsOn: WeekStartsOn
}): React.JSX.Element {
  return (
    <div className="pointer-events-none animate-pulse">
      <ActivityHeatmap
        entries={NO_ENTRIES}
        year={year}
        weekStartsOn={weekStartsOn}
        showMonthLabels={false}
        showWeekdayLabels={false}
      />
    </div>
  )
}

function formatCost(v: number): string {
  return `$${v.toFixed(2)}`
}

/**
 * Ledger dates are local-naive `YYYY-MM-DD`; the local-midnight suffix keeps
 * the displayed calendar day from shifting for timezones west of UTC, which
 * a bare `new Date(date)` (parsed as UTC midnight) would do.
 */
function formatDay(date: string, locale: string): string {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
}
