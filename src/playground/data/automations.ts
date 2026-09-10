import type { HeartbeatJobView, HeartbeatRunsSnapshot } from './types'
import { at, NOW } from './clock'
import { PROJECT_INFRA, PROJECT_PLATFORM } from './projects'
import { nextCronMs, parseHeartbeatBlocks, parseSchedule } from '../lib/cron'

export const HEARTBEAT_PATH = 'brain/brainstem/heartbeat.md'

/** brain/brainstem/heartbeat.md — the schedule IS the heading, the body the prompt. */
export const HEARTBEAT_MD = `# Heartbeat

Automations live here. A heading is the schedule, the text under it is the
prompt, and commenting a block out switches it off.

## Weekday (08:45)

mode: single
icon: ☀️
name: Standup digest

Before standup: every PR of mine waiting on review, every review waiting on me,
and any CI run on main that failed overnight. Then the three Jira tickets I
touched last, with their status.

Under 120 words, as a checklist. If everything is green and nothing is waiting,
say that in one line.

## Hourly (:20)

mode: single
icon: 📉
name: Deploy and error watch

Check the last hour of the deploy pipeline and the API error rate on staging and
production.

Notify the phone ONLY when something is actually wrong: a failed build, a p95
above 800 ms, an error rate above the 7-day baseline, or a job queued longer
than fifteen minutes. A quiet hour is not news — send nothing.

## Every (6h)

mode: single
icon: 📥
name: Workspace sweep

Sweep the workspace for anything that landed since the last run: new files under
uploads/, anything a procedure wrote, anything left half-finished. Post one
summary in the app — what arrived, what it belongs to, and whether it needs me.

If nothing arrived that a person put there, say nothing.

## Weekly (Thursday 17:00)

mode: workflow
icon: 🗓️
name: Engineering digest

Write the week's engineering digest.

What shipped, what slipped, what is now blocking something else — from the
week's conversations, the merged PRs and the Jira board, not from memory. One
chart of merged PRs per day. Close with the three things worth doing next week,
ordered by what unblocks the most, and say how long any carried-over item has
been carried.

Deliver a PDF in the app and a five-line summary under it.

## Monthly (1 08:00)

mode: workflow
icon: 💳
name: Cloud bill reconcile
project: ${PROJECT_INFRA}

Reconcile last month's Cloudflare and DeepInfra invoices against the usage
rollup in the org API.

List every line item that moved more than 15% month over month, with the
metric that explains it. Do not guess a cause — name the invoice line and the
usage row it maps to, and flag anything you cannot map.

## Daily (18:30)

mode: single
icon: 🐘
name: Staging query watch
project: ${PROJECT_PLATFORM}

Read pg_stat_statements on the staging replica. If any statement's mean time
crossed 50 ms today, post the query, its EXPLAIN ANALYZE and the index that
would fix it. Reset the stats afterwards so tomorrow compares cleanly.

Nothing over 50 ms means nothing to post.

## Startup

mode: single
icon: 🔄
name: Missed jobs

When the desktop app starts, check whether anything scheduled was missed while
it was off. If a daily or weekly job did not run, say which and when it should
have. Do not run them retroactively.

<!-- ## Daily (07:30)

mode: workflow
icon: 📰
name: Morning AI brief

Sweep the last 24 hours of AI infrastructure news, keep what ships or changes
a decision, and post a five-line brief.

Switched off during the 2.14 release crunch.
-->
`

/** The jobs the brainstem registers from the file above, with live next-run times. */
export const HEARTBEAT_JOBS: HeartbeatJobView[] = parseHeartbeatBlocks(HEARTBEAT_MD).map(
  (block, i) => {
    const schedule = parseSchedule(block.label)
    const cron = schedule?.cron ?? null
    return {
      id: `job_${i + 1}`,
      type: schedule?.type ?? 'cron',
      cron,
      label: block.label,
      name: block.name,
      body: block.body,
      mode: block.mode,
      nextRunMs: cron ? nextCronMs(cron, NOW) : schedule?.atMs ?? null
    }
  }
)

/** "Edited …" stamps per heading label. */
export const HEARTBEAT_META: Record<string, number> = {
  'Weekday (08:45)': at(12, 8, 51),
  'Hourly (:20)': at(33, 14, 10),
  'Every (6h)': at(61, 9, 22),
  'Weekly (Thursday 17:00)': at(7, 17, 2),
  'Monthly (1 08:00)': at(19, 10, 40),
  'Daily (18:30)': at(2, 11, 44),
  Startup: at(140, 9, 0)
}

/** Nothing runs in the playground — the pool is idle. */
export const HEARTBEAT_RUNS: HeartbeatRunsSnapshot = { running: [], queued: [] }
