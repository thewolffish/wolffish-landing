import { PRO } from '../catalog'
import { at } from '../clock'
import { conversation, send, text, tool, workflow, workflowRun } from './dsl'

const CHART = JSON.stringify(
  {
    type: 'column',
    title: 'Merged PRs per day — week 37',
    subtitle: 'wolffish-inc/wolffish-cloud · Sunday to Thursday',
    categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    series: [{ name: 'Merged', data: [4, 6, 3, 7, 2], color: 1 }],
    unit: { suffix: ' PRs' },
    footnote: 'Source: list_pull_requests state=closed, merged_at within the week. 22 merged, 5 still open at Thursday 17:00.'
  },
  null,
  2
)

const DIGEST_MD = `# Engineering digest — week 37

**Window:** Sunday to Thursday 17:00 · **Repo:** \`wolffish-inc/wolffish-cloud\` · **Board:** WFC
**Sources:** 22 merged PRs, 61 commits, 14 Jira transitions, 9 conversations in this workspace

## Shipped
| What | PR | Where | Why it matters |
| --- | --- | --- | --- |
| Nightly archive of idle conversations to R2 | #1841 | apps/api | D1 stays a bounded hot window instead of growing with every conversation. First run moved 41,208 rows. |
| ModelGate cooldown on 429 raised to 45 s | #1836 | apps/api | No admission storms since Monday. Previously 20 s, which re-fired into the same rate limit. |
| Outbox batch names every refused item | #1844 | apps/api | A rejected sync now tells the client which item failed, so the phone stops retrying the whole batch. |
| Pairing code fallback when the camera is denied | #1839 | apps/mobile | Unblocks the Android 16 devices where camera permission is org-managed. |
| Push notification deep links | #1847 | apps/mobile | A push opens the conversation, not the home screen. |
| Per-user daily search cap in admin | #1849 | apps/api, apps/desktop | Admins can cap \`/v1/search\` per employee without a deploy. |
| Invite sheet resends activation | #1852 | apps/desktop | Support stops asking an engineer to re-send invites by hand. |

Fifteen more PRs were refactors, test-only or docs; they are in the workbook, not here.

## Slipped
| What | Ticket | Carried | Where it stopped |
| --- | --- | --- | ---: |
| Offline queue for sends | WFC-1419 | 21 days | Was waiting on the idempotent outbox. That landed Wednesday (#1844), so the block is gone and the work is not. |
| Bootstrap restore pages the file manifest | WFC-1433 | 14 days | R2 list calls cap at 1,000 keys; the paging change is drafted, not merged. |
| Usage rollup retires raw rows after 180 days | WFC-1436 | 3 days | Started Wednesday. On track, listed for completeness. |

## Blocking something else
- **WFC-1433 blocks the 2.14 release note.** Restore is in the release checklist and cannot be demonstrated until the manifest pages.
- **WFC-1440 (\`conversations_user_updated\` index) blocks the query watch.** The nightly job flags the same statement every evening; the migration is drafted and unapplied, so the alert repeats without new information.
- **Nothing blocks mobile.** The offline queue is the last open item and it now has a clear path.

## Three things next week, by what they unblock
1. **Split WFC-1419 into queue and replay.** Carried 21 days across two sprints. Its blocker is gone; the size is the remaining problem. Splitting it unblocks the mobile release checklist.
2. **Apply the WFC-1440 migration on staging.** Ten minutes of work that silences a daily alert and takes \`/v1/sync/bootstrap\` off the slow list.
3. **Finish WFC-1433 paging.** Carried 14 days. It is the only thing between us and a demonstrable restore for 2.14.

## Numbers
| Metric | Week 37 | Week 36 |
| --- | ---: | ---: |
| PRs merged | 22 | 19 |
| Commits | 61 | 54 |
| Median time to first review | 3h 40m | 6h 10m |
| Median time open to merge | 19h | 27h |
| PRs open at week end | 5 | 8 |

Review latency halved after Sara's Sunday triage rota started. That is the one process change of the week and it is worth keeping.
`

export const weeklyEngineeringDigest = conversation({
  id: 'conv-weekly-engineering-digest',
  title: 'Weekly engineering digest for week 37',
  channel: 'heartbeat',
  sealed: true,
  icon: '🗓️',
  model: PRO,
  files: {
    'files/charts/prs-merged-w37.chart.json': CHART,
    'files/reports/2026-09/engineering-digest-w37.md': DIGEST_MD
  },
  turns: [
    {
      user: `Write the week's engineering digest.

What shipped, what slipped, what is now blocking something else — from the week's conversations, the merged PRs and the Jira board, not from memory. One chart of merged PRs per day. Close with the three things worth doing next week, ordered by what unblocks the most, and say how long any carried-over item has been carried.

Deliver a PDF in the app and a five-line summary under it.`,
      at: at(5, 17, 0),
      steps: [
        workflow(
          workflowRun({
            startedAt: at(5, 17, 0) + 4_000,
            seconds: 118,
            note: 'Three collectors ran in parallel against GitHub, Jira and this workspace. The master merged their outputs into one timeline before the writer saw anything, so every claim in the digest carries the PR, ticket or conversation it came from.',
            phases: ['Collect', 'Analyse', 'Write'],
            model: PRO,
            agents: [
              {
                name: 'PR collector',
                task: 'Every PR merged into main this week with its files, reviewers and merge time, plus the commit list behind each one.',
                phase: 'Collect',
                seconds: 63,
                startOffset: 3,
                llmCalls: 7,
                toolCalls: 11,
                inputTokens: 142_800,
                outputTokens: 4_310,
                resultChars: 9_640
              },
              {
                name: 'Jira reader',
                task: 'Every WFC transition this week, plus the open tickets with their first-seen date so carried-over age is measured, not guessed.',
                phase: 'Collect',
                seconds: 48,
                startOffset: 3,
                llmCalls: 5,
                toolCalls: 7,
                inputTokens: 71_200,
                outputTokens: 2_940,
                resultChars: 5_180
              },
              {
                name: 'Conversation reader',
                task: 'This workspace\'s conversations since Sunday — what was decided, what was handed back, what a person is still waiting on.',
                phase: 'Collect',
                seconds: 71,
                startOffset: 3,
                llmCalls: 6,
                toolCalls: 9,
                inputTokens: 98_500,
                outputTokens: 3_120,
                resultChars: 6_020
              },
              {
                name: 'Writer',
                task: 'Turn the merged timeline into the digest: shipped, slipped, blocking, and next week ordered by what it unblocks.',
                phase: 'Write',
                seconds: 39,
                startOffset: 76,
                llmCalls: 4,
                toolCalls: 3,
                inputTokens: 46_900,
                outputTokens: 6_480,
                resultChars: 4_910
              }
            ],
            master: { llmCalls: 6, inputTokens: 61_400, outputTokens: 3_180 }
          })
        ),
        tool(
          'list_pull_requests',
          {
            owner: 'wolffish-inc',
            repo: 'wolffish-cloud',
            state: 'closed',
            base: 'main',
            sort: 'updated',
            direction: 'desc',
            per_page: 50
          },
          `27 closed PRs, 22 with merged_at inside the window.

merged_at   #      title                                                    files  reviewer
Sun 11:20   1836   fix(api): ModelGate cooldown 20s -> 45s on 429              4    nawaf
Sun 13:05   1837   test(api): seam coverage for admission retries              6    nawaf
Sun 15:41   1838   chore(desktop): drop the unused tray animation             11    sara
Sun 17:52   1839   feat(mobile): pairing code fallback when camera denied      9    sara
Mon 09:33   1840   refactor(api): one router registration path                14    nawaf
Mon 10:48   1841   feat(api): nightly archive of idle conversations to R2     17    nawaf
Mon 12:15   1842   docs: quotas page in Arabic                                 3    sara
Mon 14:02   1843   test(mobile): device matrix smoke for A56                   5    reem
Mon 16:20   1845   chore(api): pin wrangler to 4.28.1                          2    younes
Mon 17:44   1846   fix(desktop): live socket reconnect backoff                 6    sara
Tue 10:11   1844   feat(api): outbox batch names every refused item           12    nawaf
Tue 13:36   1848   refactor(desktop): extract the updater into main/           19    sara
Tue 16:50   1850   test(api): outbox replay fixtures                           7    reem
Wed 09:14   1847   feat(mobile): push notification deep links                 10    sara
Wed 10:02   1849   feat(api,desktop): per-user daily search cap               21    nawaf
Wed 11:38   1851   fix(api): leaderboard cache key includes org               3    nawaf
Wed 13:20   1852   feat(desktop): invite sheet resends activation              8    sara
Wed 14:55   1853   docs: onboarding guide, storage section                     4    sara
Wed 16:30   1854   chore(mobile): expo sdk patch bump                          2    reem
Wed 17:41   1855   test(desktop): updater unit tests                           9    sara
Thu 10:26   1856   fix(api): usage rollup handles a null model id              3    nawaf
Thu 15:09   1857   chore: bump vitest to 3.2.4 across workspaces               6    younes

Per day: Sun 4, Mon 6, Tue 3, Wed 7, Thu 2. Still open at the cut: 5.`,
          { ms: 3_640 }
        ),
        tool(
          'searchJiraIssuesUsingJql',
          {
            jql: 'project = WFC AND updated >= -7d ORDER BY updated DESC',
            fields: ['key', 'summary', 'status', 'created', 'customfield_sprint']
          },
          `14 transitions, 5 issues still open.

key       summary                                      status        first seen in sprint  age open
WFC-1419  Offline queue for sends                      In Progress   Sprint 40             21 days
WFC-1433  Bootstrap restore pages the file manifest    In Progress   Sprint 41             14 days
WFC-1436  Usage rollup retires raw rows after 180 days In Progress   Sprint 42              3 days
WFC-1440  Slow query: conversations_user_updated       To Do         Sprint 42              9 days
WFC-1431  Org panel: allowed-models chips              In Progress   Sprint 42              6 days

Closed this week: WFC-1421, WFC-1418, WFC-1425, WFC-1409, WFC-1423, WFC-1430, WFC-1417, WFC-1404, WFC-1411.`,
          { ms: 2_310 }
        ),
        tool(
          'memory_search',
          { query: 'decisions and hand-backs this week', since: '7d' },
          `9 conversations, 3 with an unresolved hand-back.

- Slow query audit (Tue 11:40): migration for conversations_user_updated drafted at files/drafts/2026-09-idx-conversations.sql, handed back, not applied.
- Release 2.14 checklist (Wed 09:50): restore step marked "cannot demo" pending WFC-1433.
- Mobile crash triage (Mon 16:22): A56 attachment sheet fixed and verified; nothing outstanding.

No conversation this week contradicts last week's digest.`,
          { ms: 1_480 }
        ),
        tool(
          'file_write',
          { path: 'files/charts/prs-merged-w37.chart.json', content: CHART },
          'Wrote files/charts/prs-merged-w37.chart.json (0.4 KB)',
          { ms: 120 }
        ),
        tool(
          'file_write',
          { path: 'files/reports/2026-09/engineering-digest-w37.md', content: DIGEST_MD },
          'Wrote files/reports/2026-09/engineering-digest-w37.md (3.9 KB)',
          { ms: 170 }
        ),
        tool(
          'pdf_create',
          {
            source: 'files/reports/2026-09/engineering-digest-w37.md',
            output: 'files/reports/2026-09/engineering-digest-w37.pdf',
            charts: ['files/charts/prs-merged-w37.chart.json'],
            page: 'A4'
          },
          'Rendered files/reports/2026-09/engineering-digest-w37.pdf — 2 pages, 1 chart embedded at 2x, 212 KB.',
          { ms: 4_120 }
        ),
        send('files/reports/2026-09/engineering-digest-w37.pdf'),
        send('files/reports/2026-09/engineering-digest-w37.md'),
        send('files/charts/prs-merged-w37.chart.json'),
        text(`22 PRs merged, up from 19, and review latency halved after Sara's Sunday triage rota.
Seven user-facing changes shipped; the nightly R2 archive is the one that changes the shape of the database.
Three items slipped: WFC-1419 carried 21 days, WFC-1433 carried 14, WFC-1436 started Wednesday and is fine.
Two things are blocking others — WFC-1433 holds the 2.14 restore demo, WFC-1440 keeps the query watch firing on the same statement every evening.
Next week in order: split WFC-1419, apply the WFC-1440 migration on staging, finish WFC-1433 paging.`)
      ]
    }
  ]
})
