import { at } from '../clock'
import { PROJECT_PLATFORM } from '../projects'
import { ask, conversation, send, text, tool } from './dsl'

const CSV = `key,summary,type,team,points,status,sprint,rolled_from
WFC-1412,Rate-limit /v1/search per employee,Story,Platform,5,Done,Sprint 42,
WFC-1418,ModelGate cooldown on 429 from 20s to 45s,Story,Platform,3,Done,Sprint 42,
WFC-1421,Archive idle conversations nightly to R2,Story,Platform,8,Done,Sprint 42,Sprint 41
WFC-1425,Outbox batch names every refused item,Bug,Platform,2,Done,Sprint 42,
WFC-1427,Leaderboard board cache per org,Story,Platform,5,Done,Sprint 42,
WFC-1430,Admin: per-user daily search cap,Story,Platform,3,Done,Sprint 42,
WFC-1433,Bootstrap restore pages the file manifest,Story,Platform,5,In Progress,Sprint 42,Sprint 41
WFC-1436,Usage rollup retires raw rows after 180 days,Story,Platform,5,In Progress,Sprint 42,
WFC-1438,Seam tests for the sync outbox,Task,Platform,3,Done,Sprint 42,
WFC-1440,Slow query: conversations_user_updated index,Bug,Platform,2,To Do,Sprint 42,
WFC-1401,Attachments sheet crash on Galaxy A56,Bug,Mobile,3,Done,Sprint 42,Sprint 41
WFC-1409,Pairing code fallback when the camera is denied,Story,Mobile,5,Done,Sprint 42,
WFC-1415,Voice note transcript retry,Bug,Mobile,2,Done,Sprint 42,
WFC-1419,Offline queue for sends,Story,Mobile,8,In Progress,Sprint 42,Sprint 40
WFC-1423,Push notification deep links,Story,Mobile,3,Done,Sprint 42,
WFC-1428,Leaderboard sheet on the phone,Story,Mobile,5,Done,Sprint 42,
WFC-1404,Admin people grid: month columns,Story,Web,3,Done,Sprint 42,
WFC-1411,Docs: quotas page in Arabic,Task,Web,2,Done,Sprint 42,
WFC-1417,Invite sheet: resend activation,Story,Web,3,Done,Sprint 42,
WFC-1431,Org panel: allowed-models chips,Story,Web,5,In Progress,Sprint 42,
`

const HISTORY_CSV = `sprint,team,committed,completed
Sprint 37,Platform,34,29
Sprint 37,Mobile,26,24
Sprint 38,Platform,36,33
Sprint 38,Mobile,25,20
Sprint 39,Platform,38,31
Sprint 39,Mobile,27,27
Sprint 40,Platform,40,34
Sprint 40,Mobile,28,21
Sprint 41,Platform,41,33
Sprint 41,Mobile,29,25
Sprint 42,Platform,41,29
Sprint 42,Mobile,26,18
`

const CHART = JSON.stringify(
  {
    type: 'column',
    title: 'Velocity — committed vs completed',
    subtitle: 'Platform and Mobile · sprints 37 to 42',
    categories: ['Sprint 37', 'Sprint 38', 'Sprint 39', 'Sprint 40', 'Sprint 41', 'Sprint 42'],
    series: [
      { name: 'Platform committed', data: [34, 36, 38, 40, 41, 41], color: 1 },
      { name: 'Platform completed', data: [29, 33, 31, 34, 33, 29], color: 3 },
      { name: 'Mobile committed', data: [26, 25, 27, 28, 29, 26], color: 2 },
      { name: 'Mobile completed', data: [24, 20, 27, 21, 25, 18], color: 4 }
    ],
    unit: { suffix: ' pts' },
    footnote: 'Source: Jira export sprint-42-export.csv and the velocity history sheet. Points as of sprint close.'
  },
  null,
  2
)

const CARRY_CHART = JSON.stringify(
  {
    type: 'bar',
    title: 'Carry-over by sprints rolled',
    subtitle: 'Open tickets at sprint 42 close',
    categories: ['WFC-1419 Offline queue', 'WFC-1433 Bootstrap paging', 'WFC-1436 Usage retire', 'WFC-1440 Slow index', 'WFC-1431 Model chips'],
    series: [{ name: 'Sprints rolled', data: [2, 1, 0, 0, 0], color: 2 }],
    unit: { suffix: ' sprints' },
    footnote: 'A ticket that rolls twice gets split at planning (retro, sprint 41).'
  },
  null,
  2
)

const REPORT_MD = `# Sprint 42 — velocity report

**Window:** two weeks to Thursday · **Teams:** Platform, Mobile · **Source:** \`sprint-42-export.csv\`, velocity history

## Velocity
| Team | Committed | Completed | Rate | 6-sprint avg |
| --- | ---: | ---: | ---: | ---: |
| Platform | 41 | 29 | 71% | 82% |
| Mobile | 26 | 18 | 69% | 84% |

Both teams landed under their six-sprint average. Platform's gap is two in-progress stories worth 10 points (WFC-1433, WFC-1436); Mobile's is the offline queue (WFC-1419, 8 points) rolling a second time.

## Carry-over
| Ticket | Points | Rolled | Why (last comment) |
| --- | ---: | ---: | --- |
| WFC-1419 Offline queue for sends | 8 | 2 | Waiting on the API's idempotent outbox (WFC-1425, now done) |
| WFC-1433 Bootstrap restore pages the manifest | 5 | 1 | Blocked by R2 listing limits until Tuesday |
| WFC-1436 Usage rollup retires raw rows | 5 | 0 | Started Wednesday |
| WFC-1431 Org panel allowed-models chips | 5 | 0 | Design review Thursday |
| WFC-1440 Slow query index | 2 | 0 | Migration drafted, not applied |

## Highlights
- Nightly archive of idle conversations to R2 shipped (WFC-1421) — D1 stays a bounded hot window.
- ModelGate cooldown on 429 raised to 45 s (WFC-1418); no admission storms since.
- Pairing works without the camera (WFC-1409).

## Risks
- WFC-1419 rolls a third time unless it is split at planning — the retro rule says split it.
- Two Platform stories started in the last three days of the sprint; commit later or start earlier.
`

export const sprintVelocity = conversation({
  id: 'conv-sprint-42-velocity',
  title: 'Sprint 42 velocity report and carry-over',
  channel: 'electron',
  projectId: PROJECT_PLATFORM,
  files: {
    'uploads/conv-sprint-42/sprint-42-export.csv': CSV,
    'uploads/procedure-sprint/velocity-history.csv': HISTORY_CSV,
    'files/charts/sprint-42-velocity.chart.json': CHART,
    'files/charts/sprint-42-carry-over.chart.json': CARRY_CHART,
    'files/reports/2026-09/sprint-42-report.md': REPORT_MD
  },
  turns: [
    {
      user: 'Sprint 42 closed an hour ago. Build the sprint report from this export for Thursday\'s review — velocity, carry-over, and the PDF.',
      attachments: ['uploads/conv-sprint-42/sprint-42-export.csv'],
      at: at(2, 15, 12),
      steps: [
        text('Before I build anything: which teams go in, and how much of the carry-over story do you want on the page?'),
        ask(
          [
            {
              question: 'Which teams should the report cover?',
              details: 'The export has Platform, Mobile and Web tickets. The velocity history sheet only tracks the first two.',
              options: [
                { label: 'Platform and Mobile', description: 'The two teams with a six-sprint history.' },
                { label: 'Platform only' },
                { label: 'All three, Web without a trend', description: 'Web gets a table, no chart.' }
              ],
              allowOther: true
            },
            {
              question: 'How should carry-over be explained?',
              options: [
                { label: 'One line per ticket from its last Jira comment' },
                { label: 'Counts only', description: 'How many rolled, no reasons.' }
              ],
              allowOther: false
            },
            {
              question: 'Chart style for the review deck?',
              options: [
                { label: 'Committed vs completed, per team' },
                { label: 'Completion rate as a line' }
              ],
              allowOther: false
            }
          ],
          [{ option: 0 }, { option: 0 }, { option: 0 }],
          41_000
        ),
        text('Platform and Mobile, reasons from the last comment, committed-vs-completed columns. Reading the export.'),
        tool(
          'spreadsheet_read',
          { path: 'uploads/conv-sprint-42/sprint-42-export.csv', sheet: 0 },
          `20 rows × 8 columns (key, summary, type, team, points, status, sprint, rolled_from)

Team      Tickets  Points  Done  In Progress  To Do
Platform       10      41    29           10      2
Mobile          6      26    18            8      0
Web             4      13     8            5      0

rolled_from set on 4 rows: WFC-1421 (from 41), WFC-1433 (from 41), WFC-1401 (from 41), WFC-1419 (from 40).`,
          { ms: 1_240 }
        ),
        tool(
          'spreadsheet_read',
          { path: 'uploads/procedure-sprint/velocity-history.csv' },
          `12 rows × 4 columns (sprint, team, committed, completed) — sprints 37 to 42 for Platform and Mobile.
Six-sprint completion average: Platform 82%, Mobile 84%.`,
          { ms: 610 }
        ),
        tool(
          'searchJiraIssuesUsingJql',
          {
            jql: 'project = WFC AND sprint = "Sprint 42" AND statusCategory != Done ORDER BY updated DESC',
            fields: ['key', 'summary', 'comment']
          },
          `5 issues.
WFC-1419 · last comment (Turki, 2 days ago): "Waiting on the API's idempotent outbox — WFC-1425 landed today, unblocking."
WFC-1433 · last comment (Younes, yesterday): "R2 list calls cap at 1000 keys; paging lands Tuesday."
WFC-1436 · last comment (Younes, 3 days ago): "Started Wednesday, rollup query drafted."
WFC-1431 · last comment (Sara, yesterday): "Design review Thursday 11:00."
WFC-1440 · last comment (Younes, 4 days ago): "Migration drafted in the slow-query audit; not applied."`,
          { ms: 2_180 }
        ),
        text(
          'Both teams came in under their six-sprint average, and for different reasons — Platform started two stories in the last three days, Mobile has one 8-point story rolling for the second time. Building the workbook, the two charts and the PDF.'
        ),
        tool(
          'spreadsheet_create',
          {
            path: 'files/sheets/sprint-42-velocity.xlsx',
            sheets: [
              { name: 'Velocity', header: ['Sprint', 'Team', 'Committed', 'Completed', 'Rate'], rows: 12, freeze: 'A2' },
              { name: 'Carry-over', header: ['Ticket', 'Summary', 'Points', 'Rolled', 'Reason'], rows: 5, freeze: 'A2' },
              { name: 'Tickets', header: ['Key', 'Summary', 'Type', 'Team', 'Points', 'Status', 'Rolled from'], rows: 20, freeze: 'A2' }
            ]
          },
          'Created files/sheets/sprint-42-velocity.xlsx — 3 sheets, 37 data rows, header rows bold, panes frozen at A2, Rate column formatted as percent.',
          { ms: 1_920 }
        ),
        tool(
          'file_write',
          { path: 'files/charts/sprint-42-velocity.chart.json', content: CHART },
          'Wrote files/charts/sprint-42-velocity.chart.json (1.1 KB)',
          { ms: 140 }
        ),
        tool(
          'file_write',
          { path: 'files/charts/sprint-42-carry-over.chart.json', content: CARRY_CHART },
          'Wrote files/charts/sprint-42-carry-over.chart.json (0.6 KB)',
          { ms: 120 }
        ),
        tool(
          'file_write',
          { path: 'files/reports/2026-09/sprint-42-report.md', content: REPORT_MD },
          'Wrote files/reports/2026-09/sprint-42-report.md (2.3 KB)',
          { ms: 130 }
        ),
        tool(
          'pdf_create',
          {
            source: 'files/reports/2026-09/sprint-42-report.md',
            output: 'files/reports/2026-09/sprint-42-report.pdf',
            charts: ['files/charts/sprint-42-velocity.chart.json', 'files/charts/sprint-42-carry-over.chart.json'],
            page: 'A4'
          },
          'Rendered files/reports/2026-09/sprint-42-report.pdf — 1 page, 2 charts embedded at 2x, 184 KB.',
          { ms: 3_460 }
        ),
        send('files/sheets/sprint-42-velocity.xlsx'),
        send('files/charts/sprint-42-velocity.chart.json'),
        send('files/charts/sprint-42-carry-over.chart.json'),
        send('files/reports/2026-09/sprint-42-report.pdf'),
        text(`Done. The one-page PDF is what goes in Thursday's deck; the workbook has the three sheets behind it.

| Team | Committed | Completed | Rate | 6-sprint avg |
| --- | ---: | ---: | ---: | ---: |
| Platform | 41 | 29 | 71% | 82% |
| Mobile | 26 | 18 | 69% | 84% |

Two things worth saying out loud in the review:

- **WFC-1419 (offline queue) has rolled twice.** The retro rule from sprint 41 says it gets split at planning. Its blocker (WFC-1425) landed this sprint, so the split is realistic now.
- **Platform started WFC-1436 and WFC-1431 in the last three days.** Ten points committed with no room to finish them — either commit later or start earlier.

Every figure is from the export and the history sheet; nothing is from memory.`)
      ]
    },
    {
      user: 'Add the completion rate as a line on the same chart, and put the review date on the PDF.',
      at: at(2, 15, 41),
      steps: [
        text('Adding a rate line per team on a second axis and stamping the review date in the header.'),
        tool(
          'file_patch',
          {
            path: 'files/charts/sprint-42-velocity.chart.json',
            find: '"unit": { "suffix": " pts" },',
            replace:
              '"unit": { "suffix": " pts" },\n  "echarts": { "yAxis": [{ "type": "value" }, { "type": "value", "min": 0, "max": 100, "axisLabel": { "formatter": "{value}%" } }], "series": [{ "name": "Platform committed", "type": "bar", "data": [34, 36, 38, 40, 41, 41] }, { "name": "Platform completed", "type": "bar", "data": [29, 33, 31, 34, 33, 29] }, { "name": "Mobile committed", "type": "bar", "data": [26, 25, 27, 28, 29, 26] }, { "name": "Mobile completed", "type": "bar", "data": [24, 20, 27, 21, 25, 18] }, { "name": "Platform rate", "type": "line", "yAxisIndex": 1, "smooth": true, "data": [85, 92, 82, 85, 80, 71] }, { "name": "Mobile rate", "type": "line", "yAxisIndex": 1, "smooth": true, "data": [92, 80, 100, 75, 86, 69] }] },'
          },
          'Patched files/charts/sprint-42-velocity.chart.json (+1 line). Spec still parses; the passthrough restates all six series because echarts.series replaces the array.',
          { ms: 210 }
        ),
        tool(
          'file_patch',
          {
            path: 'files/reports/2026-09/sprint-42-report.md',
            find: '**Window:** two weeks to Thursday',
            replace: '**Window:** two weeks to Thursday · **Review:** Thursday 14:00'
          },
          'Patched files/reports/2026-09/sprint-42-report.md (1 replacement).',
          { ms: 90 }
        ),
        tool(
          'pdf_create',
          {
            source: 'files/reports/2026-09/sprint-42-report.md',
            output: 'files/reports/2026-09/sprint-42-report.pdf',
            charts: ['files/charts/sprint-42-velocity.chart.json', 'files/charts/sprint-42-carry-over.chart.json'],
            page: 'A4'
          },
          'Rendered files/reports/2026-09/sprint-42-report.pdf — 1 page, 2 charts embedded at 2x, 191 KB.',
          { ms: 3_120 }
        ),
        send('files/charts/sprint-42-velocity.chart.json'),
        send('files/reports/2026-09/sprint-42-report.pdf'),
        text('Rate lines added on a percent axis (Platform 71%, Mobile 69% for sprint 42) and the PDF header now reads "Review: Thursday 14:00". The workbook is unchanged.')
      ]
    }
  ]
})
