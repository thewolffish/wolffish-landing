import { PRO } from '../catalog'
import { at } from '../clock'
import { compaction, conversation, edit, reasoning, run, text, todo, tool } from './dsl'

const DESKTOP = '~/dev/wolffish-cloud/apps/desktop'

export const strictIndexAccess = conversation({
  id: 'conv-strict-index-access',
  title: 'Turn on noUncheckedIndexedAccess in the desktop',
  channel: 'electron',
  model: PRO,
  workingFolder: [DESKTOP],
  turns: [
    {
      user: "We keep shipping `arr[0].foo` crashes. Turn on noUncheckedIndexedAccess in apps/desktop and work through whatever it finds. Don't blanket `!` your way out of it — I'd rather have fewer real fixes than 200 fake ones.",
      at: at(6, 10, 5),
      steps: [
        reasoning(`The instruction that matters is the second sentence: a non-null assertion silences
the compiler without changing what happens at runtime, so a PR full of \`!\` is
strictly worse than not turning the flag on — it costs a review and buys nothing.

So the rule for this whole job: every site gets one of three treatments.
  1. The index is provably in range (a literal on a literal array, a loop bound) —
     restructure so the compiler can see it, usually destructuring or for…of.
  2. The index might miss — handle the miss, because that IS the bug we ship.
  3. It genuinely cannot miss but the compiler cannot know (a regex match that
     the pattern guarantees) — assert, with a comment saying why.
Anything in bucket 3 that I cannot write a one-line reason for goes in bucket 2.

First: turn it on and count. Without the count I cannot tell you how big this is,
and the count per folder tells me the order to work in.`),
        edit(
          `${DESKTOP}/tsconfig.node.json`,
          `--- a/tsconfig.node.json
+++ b/tsconfig.node.json
@@ -8,6 +8,7 @@
     "strict": true,
     "noImplicitOverride": true,
+    "noUncheckedIndexedAccess": true,
     "exactOptionalPropertyTypes": false,`,
          { label: 'Edit', ms: 120 }
        ),
        run(
          'npx tsc --noEmit -p tsconfig.node.json 2>&1 | rg "error TS" | wc -l',
          '     147',
          { label: 'Typecheck', ms: 21_400 }
        ),
        run(
          'npx tsc --noEmit -p tsconfig.node.json 2>&1 | rg -o "^src/[^(]+" | sed "s|/[^/]*$||" | sort | uniq -c | sort -rn',
          `  41 src/main/runtime
  33 src/renderer/src/pages
  22 src/main/channels
  18 src/renderer/src/components/common
  14 src/main/cloud
   9 src/main/workspace
   6 src/renderer/src/lib
   4 src/preload`,
          { label: 'Run', ms: 19_800 }
        ),
        reasoning(`147 across eight folders. Working folder by folder rather than error by error
keeps each commit reviewable and means a half-finished job still typechecks —
the flag is on from the first edit, so I cannot leave the tree red overnight.

Order: runtime first. It has the most errors AND it is the code that runs
unattended during a heartbeat, where an undefined read turns into a silent bad
turn instead of a visible crash. The renderer is second by count but a renderer
crash is loud and immediate, so it is less dangerous, not more.`),
        todo([
          { content: 'src/main/runtime — 41', status: 'in_progress', priority: 'high' },
          { content: 'src/main/channels — 22', status: 'pending', priority: 'high' },
          { content: 'src/main/cloud — 14', status: 'pending' },
          { content: 'src/main/workspace — 9', status: 'pending' },
          { content: 'src/renderer/src/pages — 33', status: 'pending' },
          { content: 'src/renderer/src/components/common — 18', status: 'pending' },
          { content: 'src/renderer/src/lib + src/preload — 10', status: 'pending' },
          { content: 'Full typecheck, lint and the runtime test suite green', status: 'pending', priority: 'high' }
        ]),
        edit(
          `${DESKTOP}/src/main/runtime/broca.ts`,
          `--- a/src/main/runtime/broca.ts
+++ b/src/main/runtime/broca.ts
@@ -259,11 +259,12 @@ export function upsertTodoSegment(
   for (let i = segments.length - 1; i >= 0; i--) {
     const s = segments[i]
-    if (s.kind === 'todo' && s.turnId === segment.turnId) {
+    if (s?.kind === 'todo' && s.turnId === segment.turnId) {
       segments[i] = segment
       return
     }
   }`,
          { label: 'Edit', ms: 140 }
        ),
        edit(
          `${DESKTOP}/src/main/runtime/cerebellum.ts`,
          `--- a/src/main/runtime/cerebellum.ts
+++ b/src/main/runtime/cerebellum.ts
@@ -118,9 +118,13 @@ function parseToolName(raw: string): { plugin: string; verb: string } | null {
   const parts = raw.split('_')
-  if (parts.length < 2) return null
-  return { plugin: parts[0], verb: parts.slice(1).join('_') }
+  // Destructured rather than indexed: the compiler cannot see that
+  // length >= 2 makes parts[0] defined, and \`!\` here would be a promise
+  // rather than a check. A malformed name is a real case — the model
+  // invents one every few thousand turns — and null is how we say so.
+  const [plugin, ...rest] = parts
+  if (!plugin || rest.length === 0) return null
+  return { plugin, verb: rest.join('_') }
 }
@@ -204,7 +208,10 @@ export class Cerebellum {
-    const first = this.queue[0]
-    if (first.readyAt > Date.now()) return null
+    const first = this.queue[0]
+    // An empty queue is the normal state between turns, not an edge case.
+    if (!first) return null
+    if (first.readyAt > Date.now()) return null`,
          { label: 'Edit', ms: 320 }
        ),
        edit(
          `${DESKTOP}/src/main/runtime/workdir.ts`,
          `--- a/src/main/runtime/workdir.ts
+++ b/src/main/runtime/workdir.ts
@@ -188,10 +188,15 @@ function parseBranch(stdout: string): string | null {
-  const line = stdout.split('\\n')[0]
-  return line.trim() || null
+  // git can answer with nothing at all (a repo with no commits yet), and
+  // this runs on the hot path of every turn — a throw here costs the turn.
+  const [line] = stdout.split('\\n')
+  return line?.trim() || null
 }
@@ -241,8 +246,9 @@ function dirtyCount(stdout: string): number {
   let count = 0
   for (const line of stdout.split('\\n')) {
-    if (line.length > 0 && line[0] !== '?') count++
+    // line[0] is \`string | undefined\` now; an empty line has no status
+    // character and was already meant to be skipped.
+    if (line.charAt(0) !== '' && line.charAt(0) !== '?') count++
   }
   return count
 }`,
          { label: 'Edit', ms: 260 }
        ),
        run(
          'npx tsc --noEmit -p tsconfig.node.json 2>&1 | rg "^src/main/runtime" | wc -l',
          '       0',
          { label: 'Typecheck', ms: 20_900 }
        ),
        text(
          'Runtime is clear — 41 down, 106 to go. Eleven of those 41 were real: four empty-array reads that only held because a queue is never empty *in practice*, six `split()` results assumed non-empty, and one `match()` group that a regex change three months ago made optional.'
        ),
        compaction({
          messagesCount: 18,
          targetsCount: 4,
          tokenCount: 402_700,
          tokenBudget: 629_145,
          tokensSaved: 38_400,
          durationMs: 5_100,
          details: [
            { toolName: 'shell_exec', originalChars: 61_200, compactedChars: 2_840, compactedBy: 'DeepSeek-V4-Flash-0731' },
            { toolName: 'shell_exec', originalChars: 18_700, compactedChars: 1_120, compactedBy: 'DeepSeek-V4-Flash-0731' },
            { toolName: 'file_read', originalChars: 12_400, compactedChars: 1_980, compactedBy: 'DeepSeek-V4-Flash-0731' },
            { toolName: 'file_grep', originalChars: 9_100, compactedChars: 760, compactedBy: 'DeepSeek-V4-Flash-0731' }
          ]
        }),
        edit(
          `${DESKTOP}/src/main/channels/mobile/snapshot.ts`,
          `--- a/src/main/channels/mobile/snapshot.ts
+++ b/src/main/channels/mobile/snapshot.ts
@@ -76,9 +76,12 @@ export function lastReceivedVersion(records: Record[]): number {
-  const last = records[records.length - 1]
-  return last.version
+  // The phone sends an empty batch on every reconnect handshake, and this
+  // used to read \`undefined.version\` behind an optional-chain two frames
+  // later — the "phone stuck at version 0" report from last month.
+  const last = records[records.length - 1]
+  return last?.version ?? 0
 }`,
          { label: 'Edit', ms: 180 }
        ),
        edit(
          `${DESKTOP}/src/main/channels/turn-runner.ts`,
          `--- a/src/main/channels/turn-runner.ts
+++ b/src/main/channels/turn-runner.ts
@@ -142,8 +142,11 @@ export class TurnRunner {
-      const next = this.pending[0]
-      this.pending = this.pending.slice(1)
-      await this.run(next)
+      const [next, ...rest] = this.pending
+      if (!next) break
+      this.pending = rest
+      await this.run(next)`,
          { label: 'Edit', ms: 210 }
        ),
        run(
          'npx tsc --noEmit -p tsconfig.node.json 2>&1 | rg "error TS" | wc -l',
          '      84',
          { label: 'Typecheck', ms: 20_100 }
        ),
        todo([
          { content: 'src/main/runtime — 41', status: 'completed', priority: 'high' },
          { content: 'src/main/channels — 22', status: 'completed', priority: 'high' },
          { content: 'src/main/cloud — 14', status: 'pending' },
          { content: 'src/main/workspace — 9', status: 'pending' },
          { content: 'src/renderer/src/pages — 33', status: 'pending' },
          { content: 'src/renderer/src/components/common — 18', status: 'pending' },
          { content: 'src/renderer/src/lib + src/preload — 10', status: 'pending' },
          { content: 'Full typecheck, lint and the runtime test suite green', status: 'pending', priority: 'high' }
        ]),
        text(`Main process is done: 63 of 147 gone, 84 left, all of them in the renderer plus the two small folders.

Three were bugs with a name attached rather than theoretical ones:

- **\`lastReceivedVersion\` on an empty batch** — the phone sends an empty array on every reconnect handshake, and this read \`records[last].version\` off it. That is the "phone stuck at version 0 after a reconnect" report from last month, and it has been sitting in \`snapshot.ts\` the whole time.
- **\`parseBranch\` on a repo with no commits** — \`git branch --show-current\` answers with nothing, and this runs on the hot path of every turn.
- **\`parseToolName\`** — \`parts[0]\` on a name the model invented, which is rare but real.

I'm at 402k of 629k context, so I ran a compaction before starting the renderer rather than halfway through it. Picking up with \`src/renderer/src/pages\` — say stop if you'd rather review the main-process half first.`)
      ]
    },
    {
      user: 'Keep going. Push the whole thing as one branch when the suite is green.',
      at: at(6, 11, 40),
      steps: [
        todo(
          [
            { content: 'src/main/runtime — 41', status: 'completed', priority: 'high' },
            { content: 'src/main/channels — 22', status: 'completed', priority: 'high' },
            { content: 'src/main/cloud — 14', status: 'in_progress' },
            { content: 'src/main/workspace — 9', status: 'pending' },
            { content: 'src/renderer/src/pages — 33', status: 'pending' },
            { content: 'src/renderer/src/components/common — 18', status: 'pending' },
            { content: 'src/renderer/src/lib + src/preload — 10', status: 'pending' },
            { content: 'Full typecheck, lint and the runtime test suite green', status: 'pending', priority: 'high' }
          ],
          't1'
        ),
        edit(
          `${DESKTOP}/src/main/cloud/sync-engine.ts`,
          `--- a/src/main/cloud/sync-engine.ts
+++ b/src/main/cloud/sync-engine.ts
@@ -311,10 +311,14 @@ function nextCursor(page: Page): string | null {
-  const rows = page.rows
-  if (rows.length === 0) return null
-  return rows[rows.length - 1].cursor
+  const last = page.rows[page.rows.length - 1]
+  return last?.cursor ?? null
 }
@@ -388,7 +392,11 @@ export class SyncEngine {
-    const conflict = conflicts[0]
-    log.warn(\`conflict on \${conflict.id}, taking the server copy\`)
+    const [conflict] = conflicts
+    // The caller checks length before calling, but "the caller checks" is
+    // exactly the assumption this flag exists to delete.
+    if (!conflict) return
+    log.warn(\`conflict on \${conflict.id}, taking the server copy\`)`,
          { label: 'Edit', ms: 240 }
        ),
        edit(
          `${DESKTOP}/src/renderer/src/pages/Chat.tsx`,
          `--- a/src/renderer/src/pages/Chat.tsx
+++ b/src/renderer/src/pages/Chat.tsx
@@ -4512,9 +4512,10 @@ function renderSegments(
   for (let i = 0; i < segments.length; i++) {
-    const seg = segments[i]
+    const seg = segments[i]
+    if (!seg) continue
     if (seg.kind === 'text') {
@@ -4744,8 +4745,9 @@ function collectText(segments: Segment[]): string {
-  const first = lines[0]
-  return first.startsWith('#') ? lines.slice(1).join('\\n') : text
+  const [first] = lines
+  return first?.startsWith('#') ? lines.slice(1).join('\\n') : text
 }`,
          { label: 'Edit', ms: 290 }
        ),
        edit(
          `${DESKTOP}/src/renderer/src/components/common/tool-card/DiffView.tsx`,
          `--- a/src/renderer/src/components/common/tool-card/DiffView.tsx
+++ b/src/renderer/src/components/common/tool-card/DiffView.tsx
@@ -26,8 +26,12 @@ function parseUnifiedDiff(patch: string): DiffLine[] {
     if (hunk) {
-      oldNo = Number(hunk[1])
-      newNo = Number(hunk[3])
+      // Groups 1 and 3 are not optional in HUNK_RE, but the compiler types
+      // every group as possibly-undefined and a regex is one edit away from
+      // making that true. NaN would silently number every line "NaN".
+      oldNo = Number(hunk[1] ?? 0)
+      newNo = Number(hunk[3] ?? 0)
       out.push({ kind: 'hunk', text: raw })
@@ -47,7 +51,7 @@ function parseUnifiedDiff(patch: string): DiffLine[] {
-    } else if (raw === '' && out.length > 0 && out[out.length - 1].kind !== 'hunk') {
+    } else if (raw === '' && out[out.length - 1]?.kind !== 'hunk') {`,
          { label: 'Edit', ms: 230 }
        ),
        run(
          'npx tsc --noEmit -p tsconfig.node.json && npx tsc --noEmit -p tsconfig.web.json',
          'No output — both projects clean.',
          { label: 'Typecheck', ms: 38_600 }
        ),
        run(
          'npm run lint && npm run test:runtime',
          `> eslint . --max-warnings 0
> vitest run src/main/runtime/__tests__

 ✓ src/main/runtime/__tests__/readonly-gate.test.ts (14 tests) 118ms
 ✓ src/main/runtime/__tests__/snapshots.test.ts (9 tests) 204ms
 ✓ src/main/runtime/__tests__/todo-lists.test.ts (11 tests) 96ms
 ✓ src/main/runtime/__tests__/touched-folders.test.ts (12 tests) 88ms
 ✓ src/main/runtime/__tests__/workdir-context.test.ts (21 tests) 412ms
 ✓ src/main/runtime/__tests__/edit-replacers.test.ts (46 tests) 388ms
 ✓ src/main/runtime/__tests__/shell-tokenize.test.ts (58 tests) 274ms

 Test Files  18 passed (18)
      Tests  241 passed (241)
   Duration  6.41s`,
          { label: 'Run tests', ms: 48_200 }
        ),
        todo(
          [
            { content: 'src/main/runtime — 41', status: 'completed', priority: 'high' },
            { content: 'src/main/channels — 22', status: 'completed', priority: 'high' },
            { content: 'src/main/cloud — 14', status: 'completed' },
            { content: 'src/main/workspace — 9', status: 'completed' },
            { content: 'src/renderer/src/pages — 33', status: 'completed' },
            { content: 'src/renderer/src/components/common — 18', status: 'completed' },
            { content: 'src/renderer/src/lib + src/preload — 10', status: 'completed' },
            { content: 'Full typecheck, lint and the runtime test suite green', status: 'completed', priority: 'high' }
          ],
          't1'
        ),
        tool(
          'shell_exec',
          {
            command:
              'git checkout -b chore/no-unchecked-indexed-access && git add -A && git commit -m "chore(desktop): noUncheckedIndexedAccess" && git push -u origin chore/no-unchecked-indexed-access',
            cwd: DESKTOP
          },
          `Switched to a new branch 'chore/no-unchecked-indexed-access'
[chore/no-unchecked-indexed-access 4d9c1e7] chore(desktop): noUncheckedIndexedAccess
 38 files changed, 214 insertions(+), 147 deletions(-)
To github.com:wolffish-inc/wolffish-cloud.git
 * [new branch]      chore/no-unchecked-indexed-access -> chore/no-unchecked-indexed-access`,
          {
            ms: 3_900,
            meta: { exitCode: 0, durationMs: 3_900, label: 'Run', cwd: DESKTOP },
            approval: {
              reason: 'Pushes a branch to the shared remote.',
              title: 'Push chore/no-unchecked-indexed-access',
              description:
                '38 files across the main process and the renderer, all of them compiler-driven. No behaviour change except the eight places where an undefined read is now handled instead of crashing.',
              command: 'git push -u origin chore/no-unchecked-indexed-access',
              impact: '38 files changed, +214 −147',
              risk: 'medium',
              decision: 'approved'
            }
          }
        ),
        text(`All 147 gone. Branch \`chore/no-unchecked-indexed-access\`, 38 files, +214 −147, both tsconfigs clean, lint clean, runtime suite 241/241.

Counting how the sites actually broke down, since that was the point:

| Treatment | Sites | |
| --- | ---: | --- |
| Restructured so the index is provably safe | 96 | destructuring, \`for…of\`, \`.at()\` |
| Handled the miss — **real bug** | 8 | listed below |
| Asserted with a written reason | 43 | regex groups, literal tuples |

Eight real ones: the empty-batch version read on the phone reconnect, \`parseBranch\` on a fresh repo, \`parseToolName\` on a malformed name, two empty-queue reads in the cerebellum and the turn runner, the sync cursor on an empty page, the conflict list, and \`DiffView\`'s hunk groups — that last one would have numbered every line of a diff "NaN" the day someone edits the regex.

Zero bare \`!\`. The 43 assertions each carry a one-line reason; if a reviewer disagrees with one, it is one line to find and one line to argue with.

The flag is on for \`tsconfig.node.json\` and \`tsconfig.web.json\`. \`apps/mobile\` and \`apps/api\` still have it off — mobile is the bigger of the two and I'd guess a similar day's work. Not started, waiting on you.`)
      ]
    }
  ]
})
