import type { CompactionRuns } from './types'
import { at } from './clock'
import { FLASH } from './catalog'

export const COMPACTION_RUNS: CompactionRuns = {
  daily: {
    at: at(1, 16, 0, 12),
    durationMs: 11_842,
    provider: 'cloud',
    model: FLASH,
    inputTokens: 4_118,
    outputTokens: 702,
    output: `Long-term facts worth promoting from today's log:

---

## projects.md
\`\`\`markdown
## Platform API
- Release 2.14 is cut from \`release/2.14\`; the notes are drafted and waiting on Sara's review of the UI section.
- The slow-query audit found three missing indexes on staging; the migration is drafted, not applied.
\`\`\`

## technical.md
\`\`\`markdown
- \`pg_stat_statements\` is enabled on the staging replica; reset it after each audit so week-over-week numbers compare.
- The Cloudflare bill anomaly was R2 Class A operations from the sync engine's manifest rewrites, not egress.
\`\`\`

## decisions.md
\`\`\`markdown
- Flaky tests get quarantined behind \`@flaky\` for one sprint, then deleted if nobody fixes them (Reem, sprint 42 retro).
\`\`\`
`
  },
  weekly: {
    at: at(5, 17, 0, 3),
    durationMs: 3_214,
    provider: null,
    model: null,
    inputTokens: null,
    outputTokens: null,
    output: `Weekly digest — 31 episodes folded into 6 consolidated entries.

- Promoted 14 facts to long-term knowledge (projects: 5, technical: 6, decisions: 3).
- Retired 9 superseded entries (the 2.13 release notes, two stale cost estimates).
- No conflicts found.`
  },
  reflection: {
    at: at(1, 3, 0, 41),
    durationMs: 24_915,
    provider: 'cloud',
    model: FLASH,
    inputTokens: 18_260,
    outputTokens: 1_388,
    output: `Reflection over 9 scored turns.

Kept doing:
- Leading with the table, then the reasoning — every 5/5 turn this week did it.
- Naming the query beside a latency figure.

Do differently:
- The Cloudflare bill reply guessed at egress first; the receipt-level breakdown should have come before any hypothesis. Rule added to agents.md draft: "cost anomalies start from the invoice line items".
- Two release-note drafts were longer than Younes reads. Capped at 12 bullets.

Skipped: 3 turns under 30 seconds (greetings, a one-line lookup).`
  },
  deepClean: {
    at: at(8, 3, 30, 0),
    durationMs: 61_002,
    provider: 'cloud',
    model: FLASH,
    inputTokens: 52_910,
    outputTokens: 2_215,
    output: `Monthly adversarial pass over 118 knowledge entries.

- 7 contradictions resolved (older cost figures superseded by the August invoice).
- 4 duplicate people entries merged.
- 2 entries flagged as unverifiable and moved to the review list.`
  }
}
