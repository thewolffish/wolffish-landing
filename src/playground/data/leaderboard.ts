import type { LeaderboardPage, LeaderboardRow } from './types'
import { drawer, iso, NOW } from './clock'
import { USER_ID } from './identity'
import { ROSTER } from './roster'

/**
 * The org leaderboard — one cached board for the whole org, ranked by token
 * spend. Rank is the rank in the WHOLE org so a filtered page keeps it.
 */
function buildRows(): LeaderboardRow[] {
  const rnd = drawer('wolffish-inc-leaderboard')
  const rows = ROSTER.filter((p) => p.status === 'active' || p.status === 'suspended').map((p) => {
    const engineer = /engineer|devops|reliability|data|qa/i.test(p.position)
    const base = engineer ? 1.0 : 0.45
    const tokens = Math.round((18_000_000 + rnd() * 90_000_000) * base)
    return {
      rank: 0,
      user_id: p.id,
      name: p.name,
      role: p.role,
      tokens,
      conversations: Math.round((90 + rnd() * 420) * base),
      agentic_tasks: Math.round((40 + rnd() * 380) * base)
    }
  })
  // Younes sits high but not first — the DevOps lead's cost reconciliations run all night.
  const me = rows.find((r) => r.user_id === USER_ID)
  if (me) {
    me.tokens = 163_482_190
    me.conversations = 412
    me.agentic_tasks = 318
  }
  const bandar = rows.find((r) => r.name === 'Bandar Alanazi')
  if (bandar) {
    bandar.tokens = 171_920_004
    bandar.conversations = 388
    bandar.agentic_tasks = 401
  }
  rows.sort((a, b) => b.tokens - a.tokens)
  rows.forEach((r, i) => {
    r.rank = i + 1
  })
  return rows
}

export const LEADERBOARD_ROWS: LeaderboardRow[] = buildRows()

export function leaderboardPage(params?: {
  limit?: number
  offset?: number
  q?: string
}): LeaderboardPage {
  const limit = params?.limit ?? 10
  const offset = params?.offset ?? 0
  const q = (params?.q ?? '').trim().toLowerCase()
  const matching = q
    ? LEADERBOARD_ROWS.filter((r) => r.name.toLowerCase().includes(q))
    : LEADERBOARD_ROWS
  return {
    generated_at: iso(NOW - 4 * 60_000),
    total: matching.length,
    board_size: LEADERBOARD_ROWS.length,
    truncated: false,
    limit,
    offset,
    rows: matching.slice(offset, offset + limit),
    me: LEADERBOARD_ROWS.find((r) => r.user_id === USER_ID) ?? null
  }
}
