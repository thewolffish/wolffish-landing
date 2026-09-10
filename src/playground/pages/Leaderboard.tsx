'use client'

import { Avatar } from '@/playground/components/common/Avatar'
import { Button } from '@/playground/components/core/Button'
import { Input } from '@/playground/components/core/Input'
import { Num } from '@/playground/components/core/Num'
import { RTL_LOCALES, useLocale, useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { formatCompact } from '@/playground/lib/format'
import { pageTopPadding } from '@/playground/lib/platform'
import { leaderboardPage } from '@/playground/data/leaderboard'
import type { LeaderboardPage, LeaderboardRow } from '@/playground/data/types'
import { useDemo } from '@/playground/providers/PlaygroundProvider'
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  BubbleChatIcon,
  ChampionIcon,
  Database02Icon,
  Robot01Icon
} from 'hugeicons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Page 1 is the top ten, and every later page is ten more. */
const PAGE_SIZE = 10

/**
 * Row height, in px, reserved whether a row is a skeleton, a real row, or
 * nothing at all. The list keeps PAGE_SIZE of these as a floor, so a short
 * last page and an empty search leave the pager exactly where it was — the
 * only way a paginated list never moves under the pointer that is paging it.
 */
const ROW_H = 48

/**
 * The row frame — shared by the column headings, the cold skeleton and the
 * real rows, so the three figures can never line up under anything but their
 * own labels. Below the desktop breakpoint the padding and the gaps tighten:
 * a rank, an avatar, a name and three fixed metric columns do not fit a
 * 360px phone at the desktop's spacing, and the name is the part that would
 * have been squeezed to nothing.
 */
const ROW_FRAME = 'flex items-center gap-3 px-4 max-sm:gap-2 max-sm:px-2.5'
/** One metric column, narrower on a phone — the figures are already compact. */
const METRIC_COL = 'w-16 shrink-0 text-end max-sm:w-11'

// Varied bar widths, so the cold-load skeleton reads as names rather than as
// one repeated block. Same trick History.tsx uses on its title bars.
const skeletonNameWidths = [58, 44, 71, 39, 63, 50, 76, 42, 67, 55]

/**
 * Last page fetched, kept across remounts (this page remounts on every visit)
 * so a return visit paints instantly and refreshes silently behind the
 * numbers already on screen. The skeleton is therefore a COLD-load state
 * only — the same rule History and the Usage panel follow.
 */
let cached: LeaderboardPage | null = null

type Metric = { key: string; icon: typeof ChampionIcon; labelKey: string }

/** The three figures, in the order the request named them. */
const METRICS: Metric[] = [
  { key: 'tokens', icon: Database02Icon, labelKey: 'leaderboard.tokens' },
  { key: 'conversations', icon: BubbleChatIcon, labelKey: 'leaderboard.conversations' },
  { key: 'agentic', icon: Robot01Icon, labelKey: 'leaderboard.agentic' }
]

const metricValues = (row: LeaderboardRow): number[] => [
  row.tokens,
  row.conversations,
  row.agentic_tasks
]

/**
 * The org leaderboard — token spend, conversations and agentic tasks for
 * everyone, readable by everyone (it is not an admin screen).
 *
 * Ranking, paging and search all belong to the board itself, which is one
 * cached table for the whole org: this page never sorts, never renumbers and
 * never filters, so page 2 can't disagree with page 1 and a searched row
 * keeps the rank it holds in the WHOLE org rather than its position among
 * the matches.
 */
export function Leaderboard(): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isRtl = RTL_LOCALES.has(locale)
  const BackIcon = isRtl ? ArrowRight02Icon : ArrowLeft02Icon
  const { goTo } = useDemo()

  const [page, setPage] = useState<LeaderboardPage | null>(() => cached)
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  // Cold load only: with a cached page there are numbers to show, and
  // swapping them for a skeleton on a background refresh is the layout shift
  // this screen exists without.
  const [loading, setLoading] = useState(() => cached === null)
  // A refetch behind numbers that are already on screen (a page turn, a
  // search). The rows stay put and the controls go inert — nothing resizes.
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  // Only the newest request may write state: typing fires one per keystroke
  // (debounced, but still overlapping), and an early response landing last
  // would otherwise show results for a query the user has moved past.
  const seq = useRef(0)

  const load = useCallback((nextOffset: number, nextQuery: string, cold: boolean) => {
    const ticket = ++seq.current
    if (cold) setLoading(true)
    else setBusy(true)
    // The board is in memory here, so the "request" answers immediately —
    // the ticket check stays anyway: it is what makes the debounced search
    // and a page turn that overlap it resolve in the order they were asked.
    try {
      const result = leaderboardPage({
        limit: PAGE_SIZE,
        offset: nextOffset,
        q: nextQuery || undefined
      })
      if (ticket !== seq.current) return
      cached = result
      setPage(result)
      setFailed(false)
    } catch {
      if (ticket !== seq.current) return
      setFailed(true)
    } finally {
      if (ticket === seq.current) {
        setLoading(false)
        setBusy(false)
      }
    }
  }, [])

  // One effect owns every load — mount, page turn and search alike — so
  // there is never a double read. The search is debounced; a page turn is
  // not (it is a deliberate click, and waiting on it would feel broken), so
  // the delay is chosen per cause rather than applied to both.
  const trimmed = query.trim()
  useEffect(() => {
    const cold = cached === null
    const delay = trimmed ? 250 : 0
    const timer = setTimeout(() => load(offset, trimmed, cold), delay)
    return () => clearTimeout(timer)
  }, [load, offset, trimmed])

  // A new search starts at the top of its own results; without this, typing
  // while on page 3 asks for matches 21–30 of a set that may hold two.
  const onSearch = useCallback((value: string) => {
    setQuery(value)
    setOffset(0)
  }, [])

  const rows = page?.rows ?? []
  const total = page?.total ?? 0
  const showSkeleton = loading && rows.length === 0
  const hasPrev = offset > 0
  const hasNext = offset + PAGE_SIZE < total
  const me = page?.me ?? null
  // The caller's own row is pinned below the list — unless this page is
  // already showing it, in which case pinning a duplicate is just noise.
  const mePinned = me && !rows.some((r) => r.user_id === me.user_id) ? me : null

  const rangeLabel = useMemo(() => {
    if (total === 0) return ''
    const from = offset + 1
    const to = Math.min(offset + rows.length, total)
    return t('leaderboard.range', { from, to, total })
  }, [offset, rows.length, total, t])

  return (
    <main className={cn('bg-bg flex h-full w-full flex-col', pageTopPadding)}>
      <div className="flex items-center gap-3 px-6 pt-3 pb-4 max-sm:px-3">
        <button
          type="button"
          onClick={() => goTo('chat')}
          aria-label={t('common.back')}
          className={cn(
            'text-muted hover:text-fg flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-sm',
            'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:ring-2 focus-visible:ring-offset-2'
          )}
        >
          <BackIcon size={16} />
          <span>{t('common.back')}</span>
        </button>
        <div className="flex-1" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 max-sm:px-3">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className="text-fg flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <ChampionIcon size={20} />
              {t('leaderboard.title')}
            </h1>
            <p className="text-muted text-sm">{t('leaderboard.subtitle')}</p>
          </header>

          <Input
            type="search"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t('leaderboard.search')}
            aria-label={t('leaderboard.search')}
          />

          <section
            aria-busy={loading || busy}
            className="border-border bg-surface flex flex-col rounded-2xl border"
          >
            {/* Column headings, on the same grid as the rows below, so the
                three figures line up under their own labels. Hidden from
                assistive tech: every row repeats these as aria-labels. */}
            <div
              aria-hidden
              className={cn(
                ROW_FRAME,
                'text-muted border-border/60 border-b py-2 text-[10px] font-medium tracking-wide uppercase'
              )}
            >
              <span className="w-6 shrink-0" />
              <span className="min-w-0 flex-1">{t('leaderboard.person')}</span>
              {METRICS.map((m) => (
                <span key={m.key} className={METRIC_COL}>
                  {t(m.labelKey)}
                </span>
              ))}
            </div>

            {/* The floor is PAGE_SIZE rows tall whatever is inside it: a
                short last page, an empty search and a cold skeleton all
                occupy the same box, so the pager under it never moves. */}
            <div style={{ minHeight: ROW_H * PAGE_SIZE }} className="flex flex-col">
              {showSkeleton &&
                skeletonNameWidths.map((width, i) => (
                  <div
                    key={i}
                    aria-hidden
                    style={{ height: ROW_H }}
                    className={cn(ROW_FRAME, 'border-border/40 border-b last:border-b-0')}
                  >
                    {/* Only the value areas pulse — the row's own geometry
                        is already final, so nothing moves when they fill. */}
                    <span className="bg-border/60 h-6 w-6 shrink-0 animate-pulse rounded-full" />
                    <span className="min-w-0 flex-1">
                      <span
                        className="bg-border/60 block h-3.5 animate-pulse rounded"
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    {METRICS.map((m) => (
                      <span key={m.key} className={cn(METRIC_COL, 'flex justify-end')}>
                        <span className="bg-border/60 h-3.5 w-10 max-w-full animate-pulse rounded" />
                      </span>
                    ))}
                  </div>
                ))}

              {!showSkeleton && rows.length === 0 && (
                <div className="text-muted flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
                  <ChampionIcon size={32} className="opacity-40" />
                  <p className="text-sm">
                    {failed
                      ? t('leaderboard.error')
                      : trimmed
                        ? t('leaderboard.noMatches')
                        : t('leaderboard.empty')}
                  </p>
                </div>
              )}

              {!showSkeleton &&
                rows.map((row) => (
                  <Row key={row.user_id} row={row} isMe={row.user_id === me?.user_id} />
                ))}
            </div>
          </section>

          {/* Where the reader stands, whatever the page or the search shows.
              Rendered only when the list isn't already showing them — but the
              slot is reserved either way, so it never pushes the pager. */}
          <div style={{ minHeight: ROW_H }} className="flex flex-col">
            {mePinned && (
              <div className="border-primary/40 bg-surface overflow-hidden rounded-2xl border">
                <Row row={mePinned} isMe />
              </div>
            )}
          </div>

          {/* On a phone the range line takes a row of its own rather than
              truncating to nothing between the two pager buttons. */}
          <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:justify-end max-sm:gap-2">
            <span className="text-muted min-w-0 flex-1 truncate text-xs max-sm:w-full max-sm:flex-none">
              {rangeLabel}
            </span>
            {/* Labels never change under load — a button that renames itself
                mid-click is a moving target. Disabled is the whole signal. */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              disabled={!hasPrev || loading || busy}
            >
              {t('leaderboard.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={!hasNext || loading || busy}
            >
              {t('leaderboard.next')}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

/**
 * One standing. The rank rides the same fixed-size circle the conversation
 * chips use, so a `1` and a `400` render in identical geometry; the three
 * figures are tabular and right-aligned in fixed columns, so nothing shifts
 * when a row of 12 sits above a row of 1,200,000.
 */
function Row({ row, isMe }: { row: LeaderboardRow; isMe: boolean }): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  return (
    <div
      style={{ height: ROW_H }}
      className={cn(ROW_FRAME, 'border-border/40 border-b last:border-b-0', isMe && 'bg-primary/5')}
    >
      <span
        aria-hidden
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold tabular-nums',
          row.rank <= 3
            ? 'border-primary/40 bg-primary/15 text-primary'
            : 'border-border text-muted'
        )}
      >
        {row.rank}
      </span>
      <Avatar name={row.name} size={24} />
      <span className="text-fg min-w-0 flex-1 truncate text-sm">
        {row.name}
        {isMe && <span className="text-muted ms-1.5 text-xs">{t('leaderboard.you')}</span>}
      </span>
      {metricValues(row).map((value, i) => (
        <span
          key={METRICS[i]!.key}
          title={String(value)}
          aria-label={`${t(METRICS[i]!.labelKey)}: ${value}`}
          className={cn(METRIC_COL, 'text-fg truncate text-sm max-sm:text-xs')}
        >
          <Num>{formatCompact(value, locale)}</Num>
        </span>
      ))}
    </div>
  )
}
