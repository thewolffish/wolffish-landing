import { PRO } from '../catalog'
import { at } from '../clock'
import { PROJECT_PLATFORM } from '../projects'
import {
  conversation,
  edit,
  reasoning,
  run,
  separator,
  showPath,
  text,
  todo,
  tool,
  workflow,
  workflowRun
} from './dsl'

const API = '~/dev/wolffish-cloud/apps/api'

export const usageDailyEndpoint = conversation({
  id: 'conv-usage-daily-endpoint',
  title: 'Add the daily usage endpoint',
  channel: 'electron',
  projectId: PROJECT_PLATFORM,
  model: PRO,
  workingFolder: [API],
  turns: [
    {
      user: 'The admin usage page needs a per-day series instead of the running total. Add GET /v1/usage/daily — route, tests, docs, the lot. Workflow mode, you know the conventions file.',
      at: at(0, 9, 20),
      steps: [
        reasoning(`Workflow mode, so the question is how to CUT this, not how to do it. A bad cut
here is three agents editing the same file; a good cut gives each one a file
nobody else opens.

Route, tests and docs are exactly that: three files, three owners, one shared
contract. So the contract has to exist before any of them start — otherwise the
test agent invents a response shape, the docs agent invents a different one, and
I spend longer reconciling than writing it myself.

So: I write the contract first, from the conventions file and the existing usage
route, then three agents work against it in parallel. The review pass at the end
is not ceremony — it is the only place the three files are looked at together.`),
        todo([
          { content: 'Pin the response contract from api-conventions.md', status: 'in_progress', priority: 'high' },
          { content: 'Route, seam tests and docs in parallel against that contract', status: 'pending', priority: 'high' },
          { content: 'Read the three together and reconcile', status: 'pending' },
          { content: 'Seam suite + typecheck, then push and open the PR', status: 'pending', priority: 'high' }
        ]),
        tool(
          'file_read',
          { path: 'uploads/project-platform/api-conventions.md', offset: 1, limit: 30 },
          `# API conventions

## Routes
- One Worker, one router. Every route lives under \`src/routes/\` and is registered in \`src/index.ts\`.
- List endpoints answer \`{ items: [...], next_cursor: string | null }\`. Never a bare array.
- Time ranges: \`from\` and \`to\` as YYYY-MM-DD, inclusive, both required. Default nothing.
- Money is integer micro-USD in the field name (\`cost_micro\`), never a float.
- Errors go through \`errors.*\` so the shape is one thing.

## Auth
- Admin-only routes call \`requireAdmin(c)\` as their first line, before reading any parameter.`,
          { ms: 560 }
        ),
        text(`Contract, pinned before anyone writes anything:

\`\`\`
GET /v1/usage/daily?from=2026-08-01&to=2026-08-31&user_id=usr_…
→ { items: [{ day: "2026-08-01", input_tokens, output_tokens, cost_micro, turns }], next_cursor: null }
\`\`\`

Admin-only, both dates required and inclusive, \`user_id\` optional (omitted = the whole org), days with no usage omitted rather than zero-filled — the chart draws the gap.`),
        workflow(
          workflowRun({
            startedAt: at(0, 9, 22),
            seconds: 164,
            note: 'Three agents, three files, one contract fixed before any of them started — so nothing had to be reconciled except the two things the reviewer found. The route agent owned src/, the test agent owned test/, the docs agent owned the docs site; no two agents could touch the same file.',
            phases: ['Build', 'Review'],
            model: PRO,
            agents: [
              {
                name: 'Route',
                task: 'Write src/routes/usage.ts — the daily handler against the pinned contract, requireAdmin first, one grouped D1 query, no N+1.',
                phase: 'Build',
                seconds: 96,
                startOffset: 2,
                llmCalls: 9,
                toolCalls: 14,
                inputTokens: 128_400,
                outputTokens: 5_120,
                resultChars: 7_240
              },
              {
                name: 'Seam tests',
                task: 'Write test/seams/usage-daily.test.ts from the contract alone — never from the route source, so the tests can disagree with the implementation.',
                phase: 'Build',
                seconds: 88,
                startOffset: 2,
                llmCalls: 8,
                toolCalls: 11,
                inputTokens: 96_800,
                outputTokens: 4_380,
                resultChars: 6_010
              },
              {
                name: 'Docs',
                task: 'Add the endpoint to the API reference in EN and AR, with a worked example and the empty-day rule stated.',
                phase: 'Build',
                seconds: 74,
                startOffset: 3,
                llmCalls: 6,
                toolCalls: 9,
                inputTokens: 74_200,
                outputTokens: 3_910,
                resultChars: 5_140
              },
              {
                name: 'Reviewer',
                task: 'Read the three outputs together against the contract and the conventions file. Report disagreements; change nothing.',
                phase: 'Review',
                seconds: 52,
                startOffset: 104,
                llmCalls: 5,
                toolCalls: 6,
                inputTokens: 61_300,
                outputTokens: 2_640,
                resultChars: 3_320
              }
            ],
            master: { llmCalls: 6, inputTokens: 52_400, outputTokens: 3_180 }
          })
        ),
        separator(),
        text(
          'Reviewer found two disagreements. Both real, both mine — the contract was underspecified, not misread.'
        ),
        reasoning(`First: the tests assert \`turns\` counts DISTINCT conversation turns; the route
counted usage rows. Those differ whenever a turn makes more than one upstream
call, which with tool use is most turns. The tests are right — "turns" on an
admin chart means turns, not calls — and this is exactly the value of having the
test agent work from the contract rather than from the route source.

Second: docs say an out-of-range \`to\` is clamped; the route 400s. Clamping hides
a caller's bug, and the conventions file says both dates are required precisely
so the caller is explicit. Route is right, docs get corrected.

So: route changes to count distinct turns, docs change on the clamp. Then I run
the tests myself — the agents' word for it is not a test run.`),
        edit(
          `${API}/src/routes/usage.ts`,
          `--- a/src/routes/usage.ts
+++ b/src/routes/usage.ts
@@ -112,6 +112,58 @@ usage.get('/', async (c) => {
+
+usage.get('/daily', async (c) => {
+  const admin = requireAdmin(c)
+  if (!admin.ok) return admin.response
+
+  const from = c.req.query('from')
+  const to = c.req.query('to')
+  if (!isDay(from) || !isDay(to)) {
+    return c.json(errors.badRequest('from and to are required, as YYYY-MM-DD'), 400)
+  }
+  if (from > to) {
+    return c.json(errors.badRequest('from must not be after to'), 400)
+  }
+
+  const userId = c.req.query('user_id') ?? null
+
+  // One grouped query rather than a day-per-round-trip loop: a month is 31
+  // round trips the naive way, and D1 charges for every one of them.
+  //
+  // count(distinct turn_id), not count(*): a turn with three tool calls
+  // writes three usage rows, and "turns" on an admin chart means turns.
+  const rows = await c.env.DB.prepare(
+    \`select day,
+            sum(input_tokens)  as input_tokens,
+            sum(output_tokens) as output_tokens,
+            sum(cost_micro)    as cost_micro,
+            count(distinct turn_id) as turns
+       from usage_events
+      where org_id = ?
+        and day between ? and ?
+        and (? is null or user_id = ?)
+      group by day
+      order by day asc\`
+  )
+    .bind(admin.org.id, from, to, userId, userId)
+    .all<DailyRow>()
+
+  // Days with no usage are omitted, not zero-filled — the chart draws the
+  // gap, and a zero would read as "measured, and it was nothing".
+  return c.json({ items: rows.results, next_cursor: null })
+})`,
          { label: 'Edit', ms: 620 }
        ),
        edit(
          `${API}/src/index.ts`,
          `--- a/src/index.ts
+++ b/src/index.ts
@@ -41,6 +41,7 @@ app.route('/v1/conversations', conversations)
 app.route('/v1/usage', usage)
+// /v1/usage/daily rides the same router — registered here for the audit log.
 app.route('/v1/leaderboard', leaderboard)`,
          { label: 'Edit', ms: 110 }
        ),
        run(
          'npm run test:seams -- usage',
          ` ✓ test/seams/usage.test.ts (13 tests) 702ms
 ✓ test/seams/usage-daily.test.ts (9 tests) 511ms
   ✓ requires admin
   ✓ 400s without from/to
   ✓ 400s when from is after to
   ✓ groups by day, inclusive of both ends
   ✓ omits days with no usage
   ✓ counts distinct turns, not usage rows
   ✓ scopes to one user when user_id is given
   ✓ never leaks another org's rows
   ✓ answers { items, next_cursor } like every other list

 Test Files  2 passed (2)
      Tests  22 passed (22)
   Duration  1.92s`,
          { label: 'Run tests', ms: 2_640 }
        ),
        run('npx tsc --noEmit', 'No output — clean.', { label: 'Typecheck', ms: 5_900 }),
        todo([
          { content: 'Pin the response contract from api-conventions.md', status: 'completed', priority: 'high' },
          { content: 'Route, seam tests and docs in parallel against that contract', status: 'completed', priority: 'high' },
          { content: 'Read the three together and reconcile', status: 'completed' },
          { content: 'Seam suite + typecheck, then push and open the PR', status: 'in_progress', priority: 'high' }
        ]),
        tool(
          'shell_exec',
          {
            command:
              'git checkout -b feat/usage-daily && git add -A && git commit -m "feat(api): GET /v1/usage/daily" && git push -u origin feat/usage-daily',
            cwd: API
          },
          `Switched to a new branch 'feat/usage-daily'
[feat/usage-daily e17b0c4] feat(api): GET /v1/usage/daily
 5 files changed, 186 insertions(+), 2 deletions(-)
To github.com:wolffish-inc/wolffish-cloud.git
 * [new branch]      feat/usage-daily -> feat/usage-daily`,
          {
            ms: 3_100,
            meta: { exitCode: 0, durationMs: 3_100, label: 'Run', cwd: API },
            approval: {
              reason: 'Pushes a branch to the shared remote.',
              title: 'Push feat/usage-daily to origin',
              description:
                'One new route, one seam test file, two docs pages and the router registration. Nothing on main; no migration.',
              command: 'git push -u origin feat/usage-daily',
              impact: '5 files changed, +186 −2',
              risk: 'medium',
              decision: 'approved'
            }
          }
        ),
        tool(
          'gh_pr_create',
          {
            repo: 'wolffish-inc/wolffish-cloud',
            base: 'main',
            head: 'feat/usage-daily',
            title: 'feat(api): GET /v1/usage/daily',
            reviewers: ['sara.almutairi']
          },
          'https://github.com/wolffish-inc/wolffish-cloud/pull/612\n\nOpened, review requested from sara.almutairi. Checks queued.',
          { ms: 2_400 }
        ),
        showPath('apps/api/src/routes/usage.ts', 'file'),
        todo([
          { content: 'Pin the response contract from api-conventions.md', status: 'completed', priority: 'high' },
          { content: 'Route, seam tests and docs in parallel against that contract', status: 'completed', priority: 'high' },
          { content: 'Read the three together and reconcile', status: 'completed' },
          { content: 'Seam suite + typecheck, then push and open the PR', status: 'completed', priority: 'high' }
        ]),
        text(`Shipped to review: [#612](https://github.com/wolffish-inc/wolffish-cloud/pull/612), Sara requested. 5 files, +186 −2, 22 seam tests green, \`tsc\` clean.

\`\`\`
GET /v1/usage/daily?from=2026-08-01&to=2026-08-31&user_id=usr_…
→ { items: [{ day, input_tokens, output_tokens, cost_micro, turns }], next_cursor: null }
\`\`\`

Three things in there that are decisions rather than typing, so you can argue with them in review:

- **\`count(distinct turn_id)\`, not \`count(*)\`.** A turn with three tool calls writes three usage rows. The test agent asserted turns; the route agent counted rows; the tests were right. That disagreement is the reason the tests were written from the contract instead of from the route.
- **Empty days are omitted, not zero-filled.** A zero reads as "we measured, and it was nothing". A gap reads as a gap, which is what it is. The chart will need to handle that — worth a word to whoever builds the admin page.
- **An out-of-range \`to\` is a 400, not a clamp.** Docs claimed clamping; the docs were wrong and are fixed. Clamping hides the caller's bug.

One grouped query, not a loop over days — a month would have been 31 D1 round trips the naive way.`)
      ]
    }
  ]
})
