import type { UsageDailyEntry, UsageStats, UsageSummary, UsageTimeRange } from './types'
import { daysAgo, drawer, isoDay, NOW } from './clock'
import { costUsd, FLASH, PRO } from './catalog'

/**
 * Younes's usage ledger — 210 days of per-model token rows, read back from the
 * org's metering table. Deterministic (seeded), weekday-heavy, with the
 * occasional heavy day when a workflow run fanned out.
 */
export type UsageDay = {
  date: string
  ms: number
  models: Array<{ model: string; inputTokens: number; outputTokens: number; cost: number; entries: number }>
  braveQueries: number
  conversations: number
  messages: number
}

const HISTORY_DAYS = 210

function buildDays(): UsageDay[] {
  const rnd = drawer('younes-usage-ledger')
  const out: UsageDay[] = []
  for (let back = HISTORY_DAYS - 1; back >= 0; back--) {
    const ms = daysAgo(back)
    const d = new Date(ms)
    const dow = d.getDay()
    const weekend = dow === 5 || dow === 6
    const active = weekend ? rnd() < 0.18 : rnd() < 0.93
    if (!active) {
      out.push({ date: isoDay(ms), ms, models: [], braveQueries: 0, conversations: 0, messages: 0 })
      continue
    }
    const heavy = rnd() < 0.14
    const scale = (weekend ? 0.3 : 1) * (heavy ? 2.6 : 0.7 + rnd() * 0.8)
    const flashIn = Math.round((1_100_000 + rnd() * 900_000) * scale)
    const flashOut = Math.round((140_000 + rnd() * 120_000) * scale)
    const flashCached = Math.round(flashIn * (0.3 + rnd() * 0.2))
    const models: UsageDay['models'] = [
      {
        model: FLASH,
        inputTokens: flashIn,
        outputTokens: flashOut,
        cost: costUsd(FLASH, flashIn, flashOut, flashCached),
        entries: Math.round((9 + rnd() * 18) * scale)
      }
    ]
    if (rnd() < 0.55) {
      const proIn = Math.round((90_000 + rnd() * 160_000) * scale)
      const proOut = Math.round((18_000 + rnd() * 30_000) * scale)
      models.push({
        model: PRO,
        inputTokens: proIn,
        outputTokens: proOut,
        cost: costUsd(PRO, proIn, proOut, Math.round(proIn * 0.25)),
        entries: Math.round((2 + rnd() * 5) * scale)
      })
    }
    out.push({
      date: isoDay(ms),
      ms,
      models,
      braveQueries: Math.round((4 + rnd() * 30) * scale),
      conversations: Math.max(1, Math.round((2 + rnd() * 5) * scale)),
      messages: Math.max(2, Math.round((14 + rnd() * 40) * scale))
    })
  }
  return out
}

export const USAGE_DAYS: UsageDay[] = buildDays()

function rangeStart(range: UsageTimeRange): number {
  const d = new Date(NOW)
  switch (range) {
    case 'today':
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    case 'this_month':
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    case '3_months':
      d.setMonth(d.getMonth() - 3)
      return d.getTime()
    case '6_months':
      d.setMonth(d.getMonth() - 6)
      return d.getTime()
    case 'ytd':
      return new Date(d.getFullYear(), 0, 1).getTime()
    case 'all_time':
      return 0
  }
}

export function usageDaysIn(range: UsageTimeRange): UsageDay[] {
  const start = rangeStart(range)
  return USAGE_DAYS.filter((day) => day.ms >= start)
}

export function usageSummary(range: UsageTimeRange): UsageSummary {
  const days = usageDaysIn(range)
  const byModel = new Map<string, { inputTokens: number; outputTokens: number; cost: number }>()
  let queries = 0
  for (const day of days) {
    queries += day.braveQueries
    for (const m of day.models) {
      const cur = byModel.get(m.model) ?? { inputTokens: 0, outputTokens: 0, cost: 0 }
      cur.inputTokens += m.inputTokens
      cur.outputTokens += m.outputTokens
      cur.cost += m.cost
      byModel.set(m.model, cur)
    }
  }
  const models = [...byModel.entries()]
    .map(([model, v]) => ({ model, ...v }))
    .sort((a, b) => b.cost - a.cost)
  return {
    providers: [
      {
        provider: 'cloud',
        totalInputTokens: models.reduce((s, m) => s + m.inputTokens, 0),
        totalOutputTokens: models.reduce((s, m) => s + m.outputTokens, 0),
        totalCost: models.reduce((s, m) => s + m.cost, 0),
        models
      }
    ],
    brave: { totalQueries: queries, totalCost: queries * 0.005 }
  }
}

export function usageStats(range: UsageTimeRange): UsageStats {
  const days = usageDaysIn(range)
  const active = days.filter((d) => d.models.length > 0)
  let streak = 0
  let longest = 0
  for (const d of days) {
    if (d.models.length > 0) {
      streak += 1
      longest = Math.max(longest, streak)
    } else streak = 0
  }
  const modelTotals = new Map<string, number>()
  let totalTokens = 0
  let totalCost = 0
  let top: { date: string; cost: number } | null = null
  for (const d of active) {
    let dayCost = 0
    for (const m of d.models) {
      modelTotals.set(m.model, (modelTotals.get(m.model) ?? 0) + m.inputTokens + m.outputTokens)
      totalTokens += m.inputTokens + m.outputTokens
      totalCost += m.cost
      dayCost += m.cost
    }
    if (!top || dayCost > top.cost) top = { date: d.date, cost: dayCost }
  }
  const favourite = [...modelTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  return {
    messages: active.reduce((s, d) => s + d.messages, 0),
    conversations: active.reduce((s, d) => s + d.conversations, 0),
    activeDays: active.length,
    longestStreak: longest,
    totalTokens,
    favouriteModel: favourite,
    totalCost,
    topSpendDay: top
  }
}

export function usageDaily(year: number): UsageDailyEntry[] {
  return USAGE_DAYS.filter((d) => new Date(d.ms).getFullYear() === year).map((d) => ({
    date: d.date,
    totalTokens: d.models.reduce((s, m) => s + m.inputTokens + m.outputTokens, 0)
  }))
}
