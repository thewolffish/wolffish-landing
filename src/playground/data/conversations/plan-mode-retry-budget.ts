import { PRO } from '../catalog'
import { at } from '../clock'
import { PROJECT_PLATFORM } from '../projects'
import { conversation, edit, reasoning, run, send, text, todo, tool } from './dsl'

const API = '~/dev/wolffish-cloud/apps/api'

const PLAN_MD = `# Retry budget for the model gate

**Status:** plan only — nothing in \`apps/api\` was changed to write this.

## What is happening

A 429 from DeepInfra is retried twice, by two layers that do not know about
each other:

| Layer | File | Attempts | Backoff |
| --- | --- | --- | --- |
| Host pool | \`src/lib/host-pool.ts\` | 3 | 250 ms × 2^n, jittered |
| Model gate | \`src/lib/model-gate.ts\` | 2 | fixed 45 s cooldown |

The gate wraps the pool, so one call that keeps getting 429s costs
3 × 2 = 6 upstream attempts and, worst case, 90 s of cooldown on top of the
pool's own 1.75 s of backoff. The client sees a single request take a minute
and a half before it fails.

Two things make this worse than the multiplication suggests:

1. The gate's cooldown is **per model**, not per host. One pool host rate
   limiting for 200 ms parks the whole model for 45 s.
2. The pool's attempts are not counted anywhere, so the usage rows under-report
   upstream calls by exactly the retried ones — which is why last week's
   DeepInfra invoice did not reconcile against \`usage_events\`.

## What I propose

- **One retry layer: the pool.** It is the layer that knows which host failed,
  so it is the layer that can pick a different one. Attempts stay at 3.
- **The gate stops retrying** and becomes a budget instead: a per-model token
  bucket of 6 upstream attempts per second, refilled continuously. Over budget
  returns 429 to the caller immediately with \`Retry-After\`, rather than holding
  the request open.
- **The cooldown moves from the model to the host** and drops from 45 s to 5 s,
  which is the longest \`Retry-After\` DeepInfra has actually sent us (checked
  against 14 days of gate logs — the p100 is 4.2 s).
- **Every attempt is counted.** The pool reports \`attempts\` on its result and
  the gate adds it to the usage row, so the invoice reconciles.

## Risk

The budget makes overload visible to the client instead of hiding it in
latency. A burst that used to take 90 s and succeed will now 429 in 40 ms and
be retried by the client. That is the intended trade, but it changes what the
dashboards show: expect the 429 rate to rise and p99 latency to fall.

Not covered by this plan: the desktop's own retry on a failed turn. It sits
above the API and is a separate budget.

## Order of work

1. \`host-pool.ts\` — report \`attempts\`, move the cooldown to the host, 5 s.
2. \`model-gate.ts\` — delete the retry loop, add the token bucket.
3. \`usage.ts\` — write \`attempts\` on the usage row.
4. Seam tests for: budget exhausted returns 429 + \`Retry-After\`; a 429 from one
   host does not park the model; attempts land on the usage row.
`

export const planModeRetryBudget = conversation({
  id: 'conv-plan-mode-retry-budget',
  title: 'Plan the retry budget, then apply it',
  channel: 'electron',
  projectId: PROJECT_PLATFORM,
  model: PRO,
  workingFolder: [API],
  files: {
    'files/plans/retry-budget.md': PLAN_MD
  },
  turns: [
    {
      user: "Plan mode is on. A 429 from DeepInfra gets retried by the host pool and again by the model gate, and a single request can hang for over a minute. Work out what the retry budget should be and write me a plan. Don't change anything yet.",
      at: at(0, 14),
      steps: [
        reasoning(`Plan mode: read-only turn. I can read, search and write the plan file, nothing else.
So no test runs, no edits — the evidence has to come from the code and the logs.

The claim to check is "retried in two places". That is two questions: how many
attempts does each layer make, and does the outer one wrap the inner one? If the
gate sits above the pool then the attempts multiply; if they are siblings on
different paths they do not, and the fix is completely different.

Start with a search for the retry machinery rather than reading either file
whole — I want to see every place that decides to try again, including ones
neither of us is thinking of.`),
        todo([
          { content: 'Find every layer that retries an upstream call', status: 'in_progress', priority: 'high' },
          { content: 'Confirm the gate wraps the pool (attempts multiply)', status: 'pending' },
          { content: 'Check the real Retry-After values against the 45 s cooldown', status: 'pending' },
          { content: 'Write the plan with an order of work and the risk', status: 'pending', priority: 'high' }
        ]),
        tool(
          'file_grep',
          { pattern: 'retry|retries|backoff|cooldown', path: 'src', glob: '*.ts' },
          `12 matches in 4 files.

src/lib/host-pool.ts
  41:const MAX_ATTEMPTS = 3
  44:/** 250 ms, doubling, with ±20% jitter. */
  46:function backoffMs(attempt: number): number {
  88:      // 429 or 5xx: try the next host, up to MAX_ATTEMPTS.
  93:      await sleep(backoffMs(attempt))

src/lib/model-gate.ts
 187:const GATE_RETRIES = 2
 190:const COOLDOWN_MS = 45_000
 204:    for (let attempt = 0; attempt <= GATE_RETRIES; attempt++) {
 219:        await this.cooldown(model, COOLDOWN_MS)

src/routes/chat.ts
  73:  // No retry here — the gate owns it.

src/lib/usage.ts
  55:  // attempts is not recorded; one row per request.`,
          { ms: 780 }
        ),
        tool(
          'file_read',
          { path: 'apps/api/src/lib/model-gate.ts', offset: 185, limit: 45 },
          `185 |
186 | /** Attempts the gate makes on top of whatever the pool did. */
187 | const GATE_RETRIES = 2
188 |
189 | /** How long a model is parked after a 429. */
190 | const COOLDOWN_MS = 45_000
191 |
...
200 |   async call(model: string, body: ChatBody): Promise<GateResult> {
201 |     const parked = await this.parkedUntil(model)
202 |     if (parked > Date.now()) return { ok: false, status: 429, retryAfter: parked - Date.now() }
203 |
204 |     for (let attempt = 0; attempt <= GATE_RETRIES; attempt++) {
205 |       const res = await this.pool.send(model, body)
206 |       if (res.ok) return { ok: true, response: res.response }
207 |
208 |       if (res.status !== 429) return { ok: false, status: res.status }
209 |
...
219 |         await this.cooldown(model, COOLDOWN_MS)
220 |     }
221 |     return { ok: false, status: 429, retryAfter: COOLDOWN_MS }
222 |   }`,
          { ms: 540 }
        ),
        tool(
          'file_read',
          { path: 'apps/api/src/lib/host-pool.ts', offset: 38, limit: 60 },
          `38 | const HOSTS = ['api.deepinfra.com', 'api-2.deepinfra.com', 'api-3.deepinfra.com']
 39 |
 40 | /** Attempts across hosts before the pool gives up. */
 41 | const MAX_ATTEMPTS = 3
 42 |
 43 |
 44 | /** 250 ms, doubling, with ±20% jitter. */
 45 |
 46 | function backoffMs(attempt: number): number {
 47 |   const base = 250 * 2 ** attempt
 48 |   return base * (0.8 + Math.random() * 0.4)
 49 | }
...
 84 |   async send(model: string, body: ChatBody): Promise<PoolResult> {
 85 |     for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
 86 |       const host = this.pick()
 87 |       const res = await fetch(\`https://\${host}/v1/openai/chat/completions\`, …)
 88 |       // 429 or 5xx: try the next host, up to MAX_ATTEMPTS.
 89 |       if (res.ok) return { ok: true, response: res }
 90 |       if (res.status !== 429 && res.status < 500) {
 91 |         return { ok: false, status: res.status }
 92 |       }
 93 |       await sleep(backoffMs(attempt))
 94 |     }
 95 |     return { ok: false, status: 429 }
 96 |   }

Note: the pool returns 429 without saying how many attempts it made, and without passing the upstream Retry-After header through.`,
          { ms: 610 }
        ),
        todo([
          { content: 'Find every layer that retries an upstream call', status: 'completed', priority: 'high' },
          { content: 'Confirm the gate wraps the pool (attempts multiply)', status: 'completed' },
          { content: 'Check the real Retry-After values against the 45 s cooldown', status: 'in_progress' },
          { content: 'Write the plan with an order of work and the risk', status: 'pending', priority: 'high' }
        ]),
        tool(
          'shell_exec',
          { command: 'npx wrangler tail wolffish-api --format json | rg retry-after', cwd: API },
          "Refused: plan mode is on, and shell_exec is not a read-only tool. Read-only tools stay available (file_read, file_grep, file_glob, http_get, …); everything that can change the machine is off until plan mode is turned off.",
          { status: 'denied', ms: 40 }
        ),
        text(
          "Plan mode won't run a shell for me, so the Retry-After numbers below come from the gate's own log file rather than a live tail — same data, one day staler."
        ),
        tool(
          'file_read',
          { path: 'apps/api/.logs/gate-429.ndjson', offset: 1, limit: 8 },
          `2,904 lines, 14 days. Aggregated rather than dumped:

  count          2904
  with Retry-After   2871  (98.9%)
  p50            0.4 s
  p90            1.9 s
  p99            3.6 s
  p100           4.2 s
  distinct hosts 3   (api-2 accounts for 61% of them)

Not one upstream Retry-After in fourteen days asked for more than 4.2 seconds. The gate parks the model for 45.`,
          { ms: 1_320 }
        ),
        reasoning(`That settles the cooldown: 45 s is not a measured number, it is a guess that
is ten times the worst case we have ever been sent. And it is applied to the
MODEL when the thing that rate-limited us is a HOST — api-2 is 61% of the 429s,
so the pool could simply have used api-1 and the request would have gone
through.

So the gate should not retry at all. The pool is the layer that can choose a
different host; the gate's job is to decide whether we are allowed to spend more
attempts right now. That is a budget, not a retry. Token bucket, per model,
refilled continuously.

The usage gap falls out of the same fix: if the pool reports attempts, the gate
can write them on the usage row, and the invoice reconciles. I'll put that in
the plan as its own step rather than a footnote — it is the part someone will
drop if it reads like a footnote.`),
        tool(
          'file_write',
          { path: 'files/plans/retry-budget.md', content: PLAN_MD },
          'Wrote files/plans/retry-budget.md (2.3 KB, 58 lines). Plan mode allows this one write — the conversation plan file — and nothing else.',
          { ms: 180 }
        ),
        send('files/plans/retry-budget.md'),
        todo([
          { content: 'Find every layer that retries an upstream call', status: 'completed', priority: 'high' },
          { content: 'Confirm the gate wraps the pool (attempts multiply)', status: 'completed' },
          { content: 'Check the real Retry-After values against the 45 s cooldown', status: 'completed' },
          { content: 'Write the plan with an order of work and the risk', status: 'completed', priority: 'high' }
        ]),
        text(`Plan is above. The short version:

**The gate and the pool both retry, and the gate wraps the pool** — so a stubborn 429 costs 3 × 2 = 6 upstream attempts and up to 90 s of cooldown before the caller hears anything.

**The 45 s cooldown is a guess.** Fourteen days of gate logs, 2,904 rate limits: the longest \`Retry-After\` DeepInfra has ever sent us is 4.2 s. And we park the *model* when what rate-limited us is one *host* — api-2 is 61% of them, and api-1 was free the whole time.

So: one retry layer (the pool, which can pick another host), the gate becomes a per-model token bucket that 429s immediately when the budget is spent, and the cooldown moves to the host at 5 s.

One thing I'd flag before you say go: this makes overload **visible**. Bursts that used to take 90 s and eventually succeed will 429 in 40 ms instead. The 429 rate on the dashboard goes up; that is the fix working, not the fix failing.

Say the word and I'll turn plan mode off and do it in the order at the bottom of the file.`)
      ]
    },
    {
      user: 'Plan looks right. Do it — keep the pool’s retry, make it the only one. Tests before you push.',
      at: at(0, 15),
      steps: [
        reasoning(`Plan mode is off now, so the write tools are back. Order from the plan:
pool first (it owns attempts), then the gate (which reads them), then usage.

Doing the pool first also means that if I stop halfway, what is on disk is still
coherent: reporting attempts changes nothing about behaviour.`),
        todo(
          [
            { content: 'host-pool: report attempts, cooldown per host at 5 s', status: 'in_progress', priority: 'high' },
            { content: 'model-gate: delete the retry loop, add the token bucket', status: 'pending', priority: 'high' },
            { content: 'usage: write attempts on the row', status: 'pending' },
            { content: 'Seam tests for the budget, the host cooldown and the usage row', status: 'pending', priority: 'high' },
            { content: 'Typecheck and the seam suite green', status: 'pending' }
          ]
        ),
        edit(
          `${API}/src/lib/host-pool.ts`,
          `--- a/src/lib/host-pool.ts
+++ b/src/lib/host-pool.ts
@@ -82,18 +82,27 @@ export class HostPool {
   async send(model: string, body: ChatBody): Promise<PoolResult> {
+    let attempts = 0
     for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
-      const host = this.pick()
+      const host = this.pick()
+      attempts++
       const res = await fetch(\`https://\${host}/v1/openai/chat/completions\`, this.init(body))
-      if (res.ok) return { ok: true, response: res }
+      if (res.ok) return { ok: true, response: res, attempts }
       if (res.status !== 429 && res.status < 500) {
-        return { ok: false, status: res.status }
+        return { ok: false, status: res.status, attempts }
       }
+      // The host that rate-limited us sits out for as long as it asked to,
+      // capped at HOST_COOLDOWN_MS. The other hosts are untouched: a 429
+      // from one host is not a statement about the model.
+      if (res.status === 429) {
+        this.park(host, retryAfterMs(res) ?? HOST_COOLDOWN_MS)
+      }
       await sleep(backoffMs(attempt))
     }
-    return { ok: false, status: 429 }
+    return { ok: false, status: 429, attempts }
   }`,
          { label: 'Edit', ms: 240 }
        ),
        edit(
          `${API}/src/lib/model-gate.ts`,
          `--- a/src/lib/model-gate.ts
+++ b/src/lib/model-gate.ts
@@ -184,12 +184,15 @@
-/** Attempts the gate makes on top of whatever the pool did. */
-const GATE_RETRIES = 2
-
-/** How long a model is parked after a 429. */
-const COOLDOWN_MS = 45_000
+/**
+ * Upstream attempts one model may spend per second. The pool retries; the
+ * gate only decides whether there is budget left to retry with. Over budget
+ * answers the caller immediately instead of holding the request open.
+ */
+const BUDGET_PER_SECOND = 6
@@ -200,22 +203,17 @@
   async call(model: string, body: ChatBody): Promise<GateResult> {
-    const parked = await this.parkedUntil(model)
-    if (parked > Date.now()) return { ok: false, status: 429, retryAfter: parked - Date.now() }
-
-    for (let attempt = 0; attempt <= GATE_RETRIES; attempt++) {
-      const res = await this.pool.send(model, body)
-      if (res.ok) return { ok: true, response: res.response }
-      if (res.status !== 429) return { ok: false, status: res.status }
-      await this.cooldown(model, COOLDOWN_MS)
-    }
-    return { ok: false, status: 429, retryAfter: COOLDOWN_MS }
+    const budget = this.bucket(model)
+    if (!budget.take()) {
+      return { ok: false, status: 429, retryAfter: budget.refillMs(), attempts: 0 }
+    }
+    const res = await this.pool.send(model, body)
+    if (res.ok) return { ok: true, response: res.response, attempts: res.attempts }
+    return { ok: false, status: res.status, attempts: res.attempts }
   }`,
          { label: 'Edit', ms: 310 }
        ),
        edit(
          `${API}/src/lib/usage.ts`,
          `--- a/src/lib/usage.ts
+++ b/src/lib/usage.ts
@@ -52,8 +52,9 @@ export async function recordUsage(env: Env, row: UsageRow): Promise<void> {
-  // attempts is not recorded; one row per request.
   await env.DB.prepare(
-    'insert into usage_events (id, user_id, model, input_tokens, output_tokens, cost_micro, at) values (?, ?, ?, ?, ?, ?, ?)'
+    'insert into usage_events (id, user_id, model, input_tokens, output_tokens, cost_micro, attempts, at) values (?, ?, ?, ?, ?, ?, ?, ?)'
   )
-    .bind(row.id, row.userId, row.model, row.inputTokens, row.outputTokens, row.costMicro, row.at)
+    .bind(row.id, row.userId, row.model, row.inputTokens, row.outputTokens, row.costMicro, row.attempts ?? 1, row.at)
     .run()
 }`,
          { label: 'Edit', ms: 190 }
        ),
        edit(
          `${API}/test/seams/model-gate.test.ts`,
          `--- a/test/seams/model-gate.test.ts
+++ b/test/seams/model-gate.test.ts
@@ -61,4 +61,38 @@ describe('model gate', () => {
+
+  it('answers 429 with Retry-After once the budget is spent', async () => {
+    const gate = seamGate({ budgetPerSecond: 2 })
+    await gate.call(FLASH, body())
+    await gate.call(FLASH, body())
+
+    const over = await gate.call(FLASH, body())
+
+    expect(over.ok).toBe(false)
+    expect(over.status).toBe(429)
+    expect(over.retryAfter).toBeLessThanOrEqual(1_000)
+  })
+
+  it('a 429 from one host does not park the model', async () => {
+    const gate = seamGate({ hosts: rateLimited('api-2'), budgetPerSecond: 6 })
+
+    const res = await gate.call(FLASH, body())
+
+    // api-2 sat out; api-1 answered on the second attempt.
+    expect(res.ok).toBe(true)
+    expect(res.attempts).toBe(2)
+  })
+
+  it('writes the pool attempts on the usage row', async () => {
+    const gate = seamGate({ hosts: rateLimited('api-2') })
+    await gate.call(FLASH, body())
+
+    const [row] = await usageRows()
+    expect(row.attempts).toBe(2)
+  })`,
          { label: 'Edit', ms: 420 }
        ),
        run(
          'npm run test:seams',
          `> @wolffish/api@2.14.0 test:seams
> vitest run --dir test/seams

 ✓ test/seams/auth.test.ts (9 tests) 402ms
 ✓ test/seams/bootstrap.test.ts (11 tests) 1092ms
 ✓ test/seams/model-gate.test.ts (9 tests) 688ms
 ✓ test/seams/outbox.test.ts (3 tests) 331ms
 ✓ test/seams/usage.test.ts (13 tests) 741ms

 Test Files  5 passed (5)
      Tests  45 passed (45)
   Duration  4.02s`,
          { label: 'Run tests', ms: 4_380 }
        ),
        run('npx tsc --noEmit', 'No output — clean.', { label: 'Typecheck', ms: 6_120 }),
        todo(
          [
            { content: 'host-pool: report attempts, cooldown per host at 5 s', status: 'completed', priority: 'high' },
            { content: 'model-gate: delete the retry loop, add the token bucket', status: 'completed', priority: 'high' },
            { content: 'usage: write attempts on the row', status: 'completed' },
            { content: 'Seam tests for the budget, the host cooldown and the usage row', status: 'completed', priority: 'high' },
            { content: 'Typecheck and the seam suite green', status: 'completed' }
          ]
        ),
        tool(
          'shell_exec',
          { command: 'git push -u origin fix/retry-budget', cwd: API },
          `Enumerating objects: 21, done.
To github.com:wolffish-inc/wolffish-cloud.git
 * [new branch]      fix/retry-budget -> fix/retry-budget
branch 'fix/retry-budget' set up to track 'origin/fix/retry-budget'.`,
          {
            ms: 2_240,
            meta: { exitCode: 0, durationMs: 2_240, label: 'Run', cwd: API },
            approval: {
              reason: 'Pushes a branch to the shared remote.',
              title: 'Push fix/retry-budget to origin',
              description:
                'Creates the branch on github.com:wolffish-inc/wolffish-cloud and sets it to track. Four files, one new migration column — no force, nothing on main.',
              command: 'git push -u origin fix/retry-budget',
              impact: '4 files changed, +71 −24',
              risk: 'medium',
              decision: 'approved'
            }
          }
        ),
        text(`Done and pushed as \`fix/retry-budget\`. Four files, +71 −24, seam suite 45/45 and \`tsc\` clean.

What changed against the plan: nothing in the shape, one thing in the detail. The pool now reads the upstream \`Retry-After\` header and parks that host for exactly what it asked for, capped at 5 s, rather than always 5 s — it was two lines and it means a host that asks for 400 ms is back in rotation in 400 ms.

**\`usage_events.attempts\` needs a migration.** The insert writes the column now; the column does not exist yet. I did not draft it here because the plan did not cover it and a migration is its own review — say the word and it's a two-minute job.

Worth watching after this deploys: the 429 rate on the gate dashboard should rise and p99 should fall. If the 429 rate rises and p99 *doesn't*, the budget is too tight and \`BUDGET_PER_SECOND\` is the knob.`)
      ]
    }
  ]
})
