import type {
  ConversationChannel,
  ConversationMeta,
  ConversationRunPhase,
  ConversationRunStatus,
  Project
} from '@/playground/data/types'

/** ONE definition of "which conversations to list, and what state each is in". */
export type ConversationRow = {
  conversationId: string
  title: string
  phase: ConversationRunPhase | null
  channel: ConversationChannel | string | null
  icon: string | null
  projectId: string | null
  at: number
  updatedAt: number
  indexed: boolean
}

export const TERMINAL_FRESH_WINDOW_MS = 30 * 60 * 1000

function effectivePhase(
  live: ConversationRunStatus | undefined,
  now: number
): ConversationRunPhase | null {
  if (!live) return null
  if (live.phase !== 'processing' && now - live.at > TERMINAL_FRESH_WINDOW_MS) return null
  return live.phase
}

export function buildConversationRows({
  metas,
  runStatuses,
  projects,
  untitled,
  now = Date.now()
}: {
  metas: readonly ConversationMeta[]
  runStatuses: Record<string, ConversationRunStatus>
  projects?: readonly Project[]
  untitled: string
  now?: number
}): ConversationRow[] {
  const projectIcons = new Map((projects ?? []).map((p) => [p.id, p.icon]))
  const byId = new Map<string, ConversationRow>()

  for (const meta of metas) {
    const live = runStatuses[meta.id]
    const indexedTitle = meta.title && meta.title !== 'Untitled' ? meta.title : null
    byId.set(meta.id, {
      conversationId: meta.id,
      title: indexedTitle ?? live?.title ?? untitled,
      phase: effectivePhase(live, now),
      channel: meta.channel ?? live?.channel ?? null,
      icon: (meta.projectId ? projectIcons.get(meta.projectId) : undefined) ?? meta.icon ?? null,
      projectId: meta.projectId ?? null,
      at: Math.max(meta.updatedAt, live?.at ?? 0),
      updatedAt: meta.updatedAt,
      indexed: true
    })
  }

  for (const [id, s] of Object.entries(runStatuses)) {
    if (byId.has(id)) continue
    byId.set(id, {
      conversationId: id,
      title: s.title ?? untitled,
      phase: effectivePhase(s, now),
      channel: s.channel ?? null,
      icon: null,
      projectId: null,
      at: s.at,
      updatedAt: s.at,
      indexed: false
    })
  }

  return [...byId.values()].sort((a, b) => b.at - a.at)
}

export type ConversationGroupKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'last3m'
  | 'last6m'
  | 'lastYear'
  | 'older'

export type ConversationGroup = {
  key: ConversationGroupKey
  labelKey: string
  rows: ConversationRow[]
  startIndex: number
}

export function groupConversationRows(
  rows: readonly ConversationRow[],
  now: number = Date.now()
): ConversationGroup[] {
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)

  const daysBack = (n: number): number => {
    const d = new Date(midnight)
    d.setDate(d.getDate() - n)
    return d.getTime()
  }
  const monthsBack = (n: number): number => {
    const d = new Date(midnight)
    const day = d.getDate()
    d.setDate(1)
    d.setMonth(d.getMonth() - n)
    const lastOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    d.setDate(Math.min(day, lastOfMonth))
    return d.getTime()
  }

  const ladder = [
    ['today', daysBack(0)],
    ['yesterday', daysBack(1)],
    ['last7', daysBack(7)],
    ['last30', daysBack(30)],
    ['last3m', monthsBack(3)],
    ['last6m', monthsBack(6)],
    ['lastYear', monthsBack(12)]
  ] as const satisfies ReadonlyArray<readonly [ConversationGroupKey, number]>

  const buckets = new Map<ConversationGroupKey, ConversationRow[]>()
  for (const row of rows) {
    const key: ConversationGroupKey = ladder.find(([, from]) => row.at >= from)?.[0] ?? 'older'
    const bucket = buckets.get(key)
    if (bucket) bucket.push(row)
    else buckets.set(key, [row])
  }

  const groups: ConversationGroup[] = []
  let startIndex = 1
  for (const key of [...ladder.map(([k]) => k), 'older' as const]) {
    const bucketRows = buckets.get(key)
    if (!bucketRows?.length) continue
    groups.push({ key, labelKey: `history.groups.${key}`, rows: bucketRows, startIndex })
    startIndex += bucketRows.length
  }
  return groups
}

export function runPhaseKey(runStatuses: Record<string, ConversationRunStatus>): string {
  return Object.entries(runStatuses)
    .map(([id, s]) => `${id}:${s.phase}`)
    .join('|')
}
