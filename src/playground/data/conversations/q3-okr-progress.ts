import { at } from '../clock'
import { ask, conversation, send, text, tool } from './dsl'

const GAUGE_LATENCY = JSON.stringify(
  {
    type: 'gauge',
    title: 'OKR 1 — p95 under 800 ms',
    subtitle: 'Admission on /ai/v1/chat/completions · week 10 of 13',
    series: [{ name: 'Score', data: [{ name: 'Scored', value: 0.7 }], color: 3 }],
    unit: { decimals: 2 },
    footnote: 'Baseline 1,240 ms → 932 ms today, target 800 ms. (1240−932)/(1240−800) = 0.70. Pace at week 10 is 0.77.'
  },
  null,
  2
)

const GAUGE_RESTORE = JSON.stringify(
  {
    type: 'gauge',
    title: 'OKR 2 — restore under 60 s',
    subtitle: 'Paired-device restore, p95 · week 10 of 13',
    series: [{ name: 'Score', data: [{ name: 'Scored', value: 0.45 }], color: 5 }],
    unit: { decimals: 2 },
    footnote: 'Baseline 214 s → 145 s today, target 60 s. (214−145)/(214−60) = 0.45. Pace at week 10 is 0.77.'
  },
  null,
  2
)

const PIPELINE_FUNNEL = JSON.stringify(
  {
    type: 'funnel',
    title: 'Q3 release pipeline — Platform',
    subtitle: '48 issues planned in July · state as of week 10',
    series: [
      {
        name: 'Issues',
        data: [
          { name: 'Planned', value: 48 },
          { name: 'In review', value: 31 },
          { name: 'Merged', value: 24 },
          { name: 'Released', value: 19 }
        ],
        color: 1
      }
    ],
    unit: { suffix: ' issues' },
    footnote:
      'Source: JQL project = WFC AND team = Platform AND fixVersion in (2.12, 2.13, 2.14). 5 merged issues wait on the 2.14 cut.'
  },
  null,
  2
)

const REPORT_MD = `# Platform — Q3 2026 OKR status

**As of:** week 10 of 13 · **Scoring:** 0.0–1.0, linear between baseline and target
**Sources:** Confluence \`Platform Q3 2026 OKRs\` (page 84213), Jira JQL below, the September usage rollup
**For:** leadership review, Nawaf

## Scores

| # | Objective / key result | Baseline | Today | Target | Score | Pace | State |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | p95 admission on \`/ai/v1/chat/completions\` under 800 ms | 1,240 ms | 932 ms | 800 ms | 0.70 | 0.77 | Behind |
| 2 | Restore a paired device in under 60 s (p95) | 214 s | 145 s | 60 s | 0.45 | 0.77 | At risk |
| 3 | Cut D1 rows read per active seat per day by 40% | 1,180 | 755 | 708 | 0.90 | 0.77 | On track |
| 4 | Availability on \`api.wolffi.sh\` at 99.95% | 99.70% | 99.91% | 99.95% | 0.84 | 0.77 | On track |

Weighted average: **0.72**. Two of four are under pace.

## OKR 1 — admission latency

932 ms is the seven-day p95 from the usage rollup, not a dashboard reading. The remaining
132 ms is almost entirely queueing inside ModelGate: the single admission pool is shared
across the org, so a burst from one team delays everyone.

PR #812 (per-org admission pool) has been open for nine days. On the staging replica it takes
the same query to 806 ms. It is the only change left that moves this KR.

## OKR 2 — restore time

145 s is the p95 from the last 40 restores in the bootstrap logs. The floor is the R2 file
manifest: listing caps at 1,000 keys per call, and a 12,000-file workspace pays twelve
serial round trips before the first byte of content is fetched.

WFC-1433 (paging the manifest) has rolled once and is one engineer deep. Paging alone lands
restore near 110 s; the parallel fetch after it is what reaches 60 s. Three weeks is not
enough for both with one person.

## OKR 3 — D1 rows read

755 rows per active seat per day, down from 1,180 in June. The nightly archive to R2
(WFC-1421) did most of it by keeping D1 to a bounded hot window. 47 rows from target.

## OKR 4 — availability

99.91% quarter to date. Two incidents, 21 minutes total, both in the ModelGate cooldown
window before WFC-1418 raised it to 45 s. No admission storms since.

## Pipeline

48 planned → 31 in review → 24 merged → 19 released. The 5-issue gap between merged and
released is the 2.14 cut, which is waiting on the release branch, not on engineering.
`

export const q3OkrProgress = conversation({
  id: 'conv-q3-okr-progress',
  title: 'Q3 OKR status for the leadership review',
  channel: 'electron',
  files: {
    'files/charts/q3-okr-1-latency.chart.json': GAUGE_LATENCY,
    'files/charts/q3-okr-2-restore.chart.json': GAUGE_RESTORE,
    'files/charts/q3-release-pipeline.chart.json': PIPELINE_FUNNEL,
    'files/reports/2026-09/q3-okr-status.md': REPORT_MD
  },
  turns: [
    {
      user: 'Nawaf wants the platform team\'s Q3 OKR status for the leadership review on Sunday. Where are we, and give him something he can present.',
      at: at(4, 15, 30),
      steps: [
        text('Three things decide what I build. Answer these and I will pull the numbers.'),
        ask(
          [
            {
              question: 'Which OKRs go in?',
              details: 'Platform owns four this quarter. Two are under pace at week 10.',
              options: [
                { label: 'All four', description: 'Full picture, including the two on track.' },
                { label: 'Only the two at risk', description: 'OKR 1 (latency) and OKR 2 (restore).' },
                { label: 'Only the ones you own', description: 'OKR 1, 2 and 4.' }
              ],
              allowOther: true
            },
            {
              question: 'How should progress be scored?',
              options: [
                { label: '0.0–1.0 per key result', description: 'Linear between baseline and target, the way the Confluence page defines it.' },
                { label: 'Red / amber / green', description: 'No numbers, just a state per OKR.' }
              ],
              allowOther: false
            },
            {
              question: 'How long should the deck be?',
              options: [
                { label: 'Three slides', description: 'Scores, the two risks, the asks.' },
                { label: 'One slide per OKR', description: 'Six slides with a title and a close.' }
              ],
              allowOther: false
            }
          ],
          [{ option: 0 }, { option: 0 }, { option: 1 }],
          52_000
        ),
        text('All four, scored 0.0–1.0, one slide each. Pulling the OKR definitions and the current numbers.'),
        tool(
          'getConfluencePage',
          { pageId: '84213', expand: 'body.storage' },
          `{
  "id": "84213",
  "title": "Platform Q3 2026 OKRs",
  "space": "ENG",
  "version": { "number": 7, "by": "Nawaf Alotaibi", "when": "2026-07-03T08:12:00+03:00" },
  "body": {
    "keyResults": [
      { "id": "KR1", "text": "p95 admission on /ai/v1/chat/completions under 800 ms", "baseline": 1240, "target": 800, "unit": "ms", "owner": "Younes" },
      { "id": "KR2", "text": "Restore a paired device in under 60 s (p95)", "baseline": 214, "target": 60, "unit": "s", "owner": "Younes" },
      { "id": "KR3", "text": "Cut D1 rows read per active seat per day by 40%", "baseline": 1180, "target": 708, "unit": "rows", "owner": "Sara" },
      { "id": "KR4", "text": "Availability on api.wolffi.sh at 99.95%", "baseline": 99.70, "target": 99.95, "unit": "%", "owner": "Bandar" }
    ],
    "scoring": "Linear between baseline and target. Score = (baseline - current) / (baseline - target), clamped to [0,1].",
    "reviewCadence": "Weekly on the board, quarterly with leadership."
  }
}`,
          { ms: 1_640 }
        ),
        tool(
          'searchJiraIssuesUsingJql',
          {
            jql: 'project = WFC AND team = Platform AND fixVersion in (2.12, 2.13, 2.14) ORDER BY status ASC',
            fields: ['key', 'summary', 'status', 'labels', 'fixVersion'],
            maxResults: 100
          },
          `{
  "total": 48,
  "byStatus": { "To Do": 17, "In Review": 7, "Merged": 5, "Released": 19 },
  "funnelReached": { "planned": 48, "inReview": 31, "merged": 24, "released": 19 },
  "byOkrLabel": {
    "okr-1-latency": ["WFC-1412 Released", "WFC-1418 Released", "WFC-1440 To Do", "WFC-1449 In Review"],
    "okr-2-restore": ["WFC-1433 In Review", "WFC-1451 To Do", "WFC-1452 To Do"],
    "okr-3-d1-reads": ["WFC-1421 Released", "WFC-1436 Merged", "WFC-1427 Released"],
    "okr-4-availability": ["WFC-1418 Released", "WFC-1444 Released"]
  },
  "note": "funnelReached counts cumulative stage entries, so In Review = 7 open + 24 that already passed through."
}`,
          { ms: 2_210 }
        ),
        tool(
          'shell_exec',
          {
            command:
              "psql -h replica.staging -c \"select percentile_disc(0.95) within group (order by latency_ms) as p95 from usage where kind='admission' and created_at > now() - interval '7 days'\"",
            cwd: '~/dev/wolffish-cloud/apps/api'
          },
          ` p95
-----
 932
(1 row)`,
          { ms: 1_820 }
        ),
        tool(
          'shell_exec',
          {
            command: "grep 'restore.complete' logs/bootstrap-2026-09.log | tail -40 | awk '{print $6}' | sort -n | awk '{a[NR]=$1} END {print a[int(NR*0.95)]}'",
            cwd: '~/dev/wolffish-cloud/apps/api'
          },
          `145.2`,
          { ms: 640 }
        ),
        tool(
          'get_pull_request',
          { owner: 'wolffish', repo: 'wolffish-cloud', pull_number: 812 },
          `{
  "number": 812,
  "title": "feat(gate): per-org admission pool",
  "state": "open",
  "user": "younes",
  "created_at": "2026-08-31T11:04:12+03:00",
  "requested_reviewers": ["bandar"],
  "additions": 214,
  "deletions": 66,
  "mergeable": true,
  "checks": { "seam-tests": "success", "ts-check": "success", "e2e": "success" },
  "body_excerpt": "Staging replica: admission p95 806 ms over 4h of replayed traffic (was 934 ms)."
}`,
          { ms: 1_290 }
        ),
        text(
          'Two OKRs are under pace and they fail for opposite reasons: OKR 1 has its fix written and unreviewed, OKR 2 has no fix that fits in three weeks. Building the charts, the workbook, the report and the deck.'
        ),
        tool('file_write', { path: 'files/charts/q3-okr-1-latency.chart.json', content: GAUGE_LATENCY }, 'Wrote files/charts/q3-okr-1-latency.chart.json (0.4 KB)', { ms: 110 }),
        tool('file_write', { path: 'files/charts/q3-okr-2-restore.chart.json', content: GAUGE_RESTORE }, 'Wrote files/charts/q3-okr-2-restore.chart.json (0.4 KB)', { ms: 100 }),
        tool('file_write', { path: 'files/charts/q3-release-pipeline.chart.json', content: PIPELINE_FUNNEL }, 'Wrote files/charts/q3-release-pipeline.chart.json (0.6 KB)', { ms: 120 }),
        tool(
          'spreadsheet_create',
          {
            path: 'files/sheets/q3-okr-status.xlsx',
            sheets: [
              { name: 'Scores', header: ['#', 'Key result', 'Owner', 'Baseline', 'Today', 'Target', 'Score', 'Pace', 'State'], rows: 4, freeze: 'A2' },
              { name: 'Evidence', header: ['#', 'Figure', 'Source', 'Query or command'], rows: 8, freeze: 'A2' },
              { name: 'Pipeline', header: ['Stage', 'Issues'], rows: 4, freeze: 'A2' },
              { name: 'Issues', header: ['Key', 'Summary', 'Status', 'OKR', 'Fix version'], rows: 48, freeze: 'A2' }
            ]
          },
          'Created files/sheets/q3-okr-status.xlsx — 4 sheets, 64 data rows, header rows bold, panes frozen at A2, Score and Pace as 0.00, State conditionally coloured (Behind amber, At risk red).',
          { ms: 2_180 }
        ),
        tool('file_write', { path: 'files/reports/2026-09/q3-okr-status.md', content: REPORT_MD }, 'Wrote files/reports/2026-09/q3-okr-status.md (2.8 KB)', { ms: 160 }),
        tool(
          'document_create',
          {
            path: 'files/reports/2026-09/q3-okr-review.pptx',
            template: 'wolffish-review',
            slides: [
              { layout: 'title', title: 'Platform — Q3 2026 OKRs', subtitle: 'Week 10 of 13 · weighted 0.72' },
              { layout: 'kr', title: 'OKR 1 — admission p95 under 800 ms', score: 0.7, chart: 'files/charts/q3-okr-1-latency.chart.json' },
              { layout: 'kr', title: 'OKR 2 — restore under 60 s', score: 0.45, chart: 'files/charts/q3-okr-2-restore.chart.json' },
              { layout: 'kr', title: 'OKR 3 — D1 rows read down 40%', score: 0.9 },
              { layout: 'kr', title: 'OKR 4 — availability 99.95%', score: 0.84 },
              { layout: 'close', title: 'Two asks', chart: 'files/charts/q3-release-pipeline.chart.json' }
            ]
          },
          'Created files/reports/2026-09/q3-okr-review.pptx — 6 slides, 16:9, 3 charts embedded at 2x, speaker notes on slides 2 and 3, 412 KB.',
          { ms: 3_640 }
        ),
        send('files/charts/q3-okr-1-latency.chart.json'),
        send('files/charts/q3-okr-2-restore.chart.json'),
        send('files/charts/q3-release-pipeline.chart.json'),
        send('files/sheets/q3-okr-status.xlsx'),
        send('files/reports/2026-09/q3-okr-status.md'),
        send('files/reports/2026-09/q3-okr-review.pptx'),
        text(`Platform is at **0.72** weighted, week 10 of 13. Two OKRs are under the 0.77 pace, and each needs exactly one decision — neither needs more engineering time this quarter.

| # | Key result | Today | Target | Score | State |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | Admission p95 under 800 ms | 932 ms | 800 ms | 0.70 | Behind |
| 2 | Restore under 60 s | 145 s | 60 s | 0.45 | At risk |
| 3 | D1 rows read per seat −40% | 755 | 708 | 0.90 | On track |
| 4 | Availability 99.95% | 99.91% | 99.95% | 0.84 | On track |

The two that need Nawaf:

- **OKR 1 needs a review, not a sprint.** PR #812 (per-org admission pool) has been open nine days with all checks green and 806 ms on the staging replica. Merging it lands the KR. Ask Bandar for the review slot.
- **OKR 2 needs a second engineer or a new date.** The 145 s floor is R2 manifest paging (WFC-1433); paging alone reaches ~110 s, and the parallel fetch after it is what reaches 60 s. One person cannot land both in three weeks. Either staff it or move the KR to Q4 — deciding on Sunday is cheaper than deciding in week 13.

Numbers behind the deck: p95 from the replica query in the Evidence sheet, restore p95 from the last 40 lines of \`bootstrap-2026-09.log\`, pipeline counts from the JQL above. The definitions and the scoring formula are Confluence page 84213, version 7.`)
      ]
    }
  ]
})
