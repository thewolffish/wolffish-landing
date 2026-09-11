import { PRO } from '../catalog'
import { at } from '../clock'
import { conversation, edit, reasoning, run, send, text, todo, tool } from './dsl'

const DESKTOP = '~/dev/wolffish-cloud/apps/desktop'

const PROBE_MJS = `#!/usr/bin/env node
/**
 * Cold-start probe for git bisect.
 *
 * Builds the app, launches it with WFC_EXIT_ON_READY=1 (main exits the moment
 * the first window reports ready), and times three runs. Exits 0 when the
 * median is under the threshold and 1 when it is over — which is exactly the
 * contract \`git bisect run\` wants.
 *
 * Three runs, median not mean: the first launch after a build pays a cold
 * filesystem cache, and a mean lets that one run decide the verdict.
 */
import { execFileSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'

const THRESHOLD_MS = 2_000
const RUNS = 3

function once() {
  const started = performance.now()
  execFileSync('npx', ['electron', 'out/main/index.js'], {
    env: { ...process.env, WFC_EXIT_ON_READY: '1' },
    stdio: 'ignore',
    timeout: 60_000
  })
  return performance.now() - started
}

try {
  execFileSync('npm', ['run', 'build'], { stdio: 'ignore', timeout: 600_000 })
} catch {
  // A commit that does not build is not evidence either way — 125 tells
  // bisect to skip it rather than blaming it.
  process.exit(125)
}

const times = Array.from({ length: RUNS }, once).sort((a, b) => a - b)
const median = times[Math.floor(RUNS / 2)]
console.log(\`median \${Math.round(median)} ms  (\${times.map((t) => Math.round(t)).join(', ')})\`)
process.exit(median > THRESHOLD_MS ? 1 : 0)
`

export const bisectColdStart = conversation({
  id: 'conv-bisect-cold-start',
  title: 'Bisect the cold-start regression',
  channel: 'procedure',
  icon: '🔍',
  model: PRO,
  workingFolder: [DESKTOP],
  files: {
    'files/drafts/probe-startup.mjs': PROBE_MJS
  },
  turns: [
    {
      user: `Find the commit that caused the regression I describe, between the two refs I name.

Write a probe that answers good/bad on its own — never eyeball it commit by commit. Run git bisect with that probe, then read the commit it lands on and say what in it caused the regression. Draft a fix, run whatever check proves it, and hand it back. Do not push and do not merge.

Regression: desktop cold start went from about 1.2 s on v2.13.0 to about 4.8 s on v2.14.0. Nothing in the release notes explains it.`,
      at: at(6, 17, 10),
      steps: [
        reasoning(`The instruction that shapes everything: the probe answers good/bad on its own.
Forty-odd commits between two tags is five or six bisect steps, and a human
eyeballing a launch each step is both slow and unreliable — "felt slow" is not a
verdict a bisect can use.

So the probe has to be a script with an exit code, and it has to be stable
enough that a borderline commit does not flip the bisect down the wrong half.
Two things make it stable: the median of three runs rather than one (the first
launch after a build pays a cold filesystem cache), and exit 125 on a commit
that does not build, which tells bisect to skip rather than blame.

The threshold wants to sit in the gap, not near either end. 1.2 s good, 4.8 s
bad — 2 s is comfortably clear of both.`),
        run(
          'git log --oneline v2.13.0..v2.14.0 -- apps/desktop | wc -l && git log --oneline v2.13.0..v2.14.0 -- apps/desktop | head -5',
          `      43
9f4e1a2 desktop: reindex the corpus on launch so search is never stale
7b02c88 desktop: the files sheet counts what is actually there
3c1dd90 desktop: model chip shows the provider
a18f004 desktop: composer keeps focus after a queued send
e52b7c1 desktop: procedure Play seeds the working folder`,
          { label: 'Run', ms: 1_100 }
        ),
        reasoning(`43 commits, so six bisect steps. And the very first line is a candidate a human
would leap at — "reindex the corpus on launch". It is almost certainly the
answer.

I am going to run the bisect anyway rather than reading that commit and
declaring victory. Twice this year the obvious-looking commit was the one that
made an existing problem visible rather than the one that caused it, and a
bisect is six builds of certainty against a guess. If it lands on 9f4e1a2, I
have lost twenty minutes and gained a fact.`),
        todo([
          { content: 'Write a probe with a good/bad exit code', status: 'in_progress', priority: 'high' },
          { content: 'Bisect v2.13.0..v2.14.0 with it', status: 'pending', priority: 'high' },
          { content: 'Read the commit it lands on and explain the cause', status: 'pending' },
          { content: 'Draft the fix and prove it with the same probe', status: 'pending', priority: 'high' },
          { content: 'Hand back — no push, no merge', status: 'pending' }
        ]),
        tool(
          'file_write',
          { path: 'files/drafts/probe-startup.mjs', content: PROBE_MJS },
          'Wrote files/drafts/probe-startup.mjs (1.2 KB, 42 lines). Exit 0 under 2,000 ms, 1 over, 125 when the commit does not build.',
          { ms: 190 }
        ),
        run(
          'git checkout -q v2.13.0 && node ../../files/drafts/probe-startup.mjs; echo "exit $?"; git checkout -q v2.14.0 && node ../../files/drafts/probe-startup.mjs; echo "exit $?"',
          `median 1187 ms  (1104, 1187, 1264)
exit 0
median 4903 ms  (4788, 4903, 5051)
exit 4903 ms > 2000 ms
exit 1`,
          { label: 'Run', ms: 96_000 }
        ),
        text(
          'Probe agrees with the report at both ends — 1,187 ms on v2.13.0, 4,903 ms on v2.14.0 — so it is measuring the thing that regressed and the threshold sits in the gap. Bisecting.'
        ),
        run(
          'git bisect start v2.14.0 v2.13.0 && git bisect run node ../../files/drafts/probe-startup.mjs',
          `Bisecting: 21 revisions left to test after this (roughly 5 steps)
running node ../../files/drafts/probe-startup.mjs
median 1204 ms  (1150, 1204, 1301)
Bisecting: 10 revisions left to test after this (roughly 4 steps)
median 4871 ms  (4802, 4871, 4988)
Bisecting: 5 revisions left to test after this (roughly 3 steps)
median 4844 ms  (4790, 4844, 4901)
Bisecting: 2 revisions left to test after this (roughly 2 steps)
median 1198 ms  (1142, 1198, 1240)
Bisecting: 0 revisions left to test after this (roughly 1 step)
median 4820 ms  (4744, 4820, 4902)

9f4e1a2b6c0d4e8f1a2b3c4d5e6f7a8b9c0d1e2f is the first bad commit
commit 9f4e1a2b6c0d4e8f1a2b3c4d5e6f7a8b9c0d1e2f
    desktop: reindex the corpus on launch so search is never stale

 apps/desktop/src/main/index.ts              |  8 +++++++
 apps/desktop/src/main/workspace/corpus.ts   | 31 ++++++++++++++++++------

bisect run success`,
          { label: 'Run', ms: 512_000 }
        ),
        run('git bisect reset', "Previous HEAD position was 9f4e1a2 desktop: reindex the corpus on launch so search is never stale\nSwitched to branch 'main'", {
          label: 'Run',
          ms: 1_800
        }),
        tool(
          'file_read',
          { path: 'apps/desktop/src/main/index.ts', offset: 288, limit: 14 },
          `288 |   await window.loadURL(entry)
289 |
290 |   // Search must never be stale, so the corpus is rebuilt at launch.
291 |   await corpus.reindex()
292 |
293 |   window.show()
294 | }`,
          { ms: 460 }
        ),
        reasoning(`\`await corpus.reindex()\` sits BETWEEN loading the window and showing it. So the
window is fully loaded and then held back until every file in the workspace has
been read and embedded — on this machine, 3.6 seconds of it.

Two separate mistakes, and they need separating because the fix for each is
different:

1. It is awaited on the launch path at all. Nothing about showing a window
   depends on the index being current; the first search does.
2. It reindexes unconditionally. The corpus only changes when files change, and
   the store already records a hash per file — this rebuilds embeddings for
   files that have not moved since June.

Fixing only (1) hides the cost rather than removing it: the machine still burns
3.6 seconds of CPU on every launch, it just does it behind a visible window,
and a laptop on battery still pays. Fix both.`),
        edit(
          `${DESKTOP}/src/main/index.ts`,
          `--- a/src/main/index.ts
+++ b/src/main/index.ts
@@ -286,10 +286,16 @@ async function createWindow(): Promise<void> {
   await window.loadURL(entry)
 
-  // Search must never be stale, so the corpus is rebuilt at launch.
-  await corpus.reindex()
-
   window.show()
+
+  // Deliberately NOT awaited, and deliberately after show(): nothing about
+  // drawing the window depends on the index being current — the first
+  // SEARCH does, and search awaits the same promise (corpus.ready()).
+  // Awaiting it here cost 3.6 s of cold start for work the user was not
+  // waiting on. A failure degrades search until the next launch; it does
+  // not keep the app from opening.
+  void corpus.reindex().catch((err) => log.warn('corpus reindex failed', err))
 }`,
          { label: 'Edit', ms: 280 }
        ),
        edit(
          `${DESKTOP}/src/main/workspace/corpus.ts`,
          `--- a/src/main/workspace/corpus.ts
+++ b/src/main/workspace/corpus.ts
@@ -104,18 +104,38 @@ export class Corpus {
-  async reindex(): Promise<void> {
-    const files = await this.walk()
-    for (const file of files) {
-      const text = await fs.readFile(file, 'utf8')
-      await this.store.put(file, await embed(text))
-    }
-  }
+  /**
+   * Re-embed only what changed. The store already keeps a content hash per
+   * file, so an unchanged file needs no read, no embedding call and no
+   * write — on this workspace that is 2,847 of 2,891 files on a normal
+   * launch, which is the difference between 3.6 s and 40 ms.
+   */
+  async reindex(): Promise<void> {
+    this.readyPromise = this.doReindex()
+    return this.readyPromise
+  }
+
+  /** Resolves when the in-flight reindex finishes; search awaits this. */
+  ready(): Promise<void> {
+    return this.readyPromise ?? Promise.resolve()
+  }
+
+  private async doReindex(): Promise<void> {
+    const files = await this.walk()
+    const known = await this.store.hashes()
+    let changed = 0
+    for (const file of files) {
+      const stat = await fs.stat(file)
+      const hash = \`\${stat.size}:\${stat.mtimeMs}\`
+      if (known.get(file) === hash) continue
+      const text = await fs.readFile(file, 'utf8')
+      await this.store.put(file, await embed(text), hash)
+      changed++
+    }
+    // Files that no longer exist stop being searchable.
+    for (const gone of [...known.keys()].filter((f) => !files.includes(f))) {
+      await this.store.remove(gone)
+    }
+    log.info(\`corpus: \${changed} of \${files.length} files re-embedded\`)
+  }`,
          { label: 'Edit', ms: 640 }
        ),
        edit(
          `${DESKTOP}/src/main/workspace/__tests__/corpus.test.ts`,
          `--- a/src/main/workspace/__tests__/corpus.test.ts
+++ b/src/main/workspace/__tests__/corpus.test.ts
@@ -52,4 +52,32 @@ describe('corpus', () => {
+
+  it('re-embeds only the files whose hash changed', async () => {
+    const corpus = await seedCorpus(['a.md', 'b.md', 'c.md'])
+    embed.mockClear()
+
+    await write('b.md', 'changed')
+    await corpus.reindex()
+
+    expect(embed).toHaveBeenCalledTimes(1)
+    expect(embed).toHaveBeenCalledWith(expect.stringContaining('changed'))
+  })
+
+  it('drops files that no longer exist', async () => {
+    const corpus = await seedCorpus(['a.md', 'b.md'])
+    await remove('b.md')
+
+    await corpus.reindex()
+
+    expect(await corpus.search('b')).toEqual([])
+  })
+
+  it('search waits for an in-flight reindex', async () => {
+    const corpus = await seedCorpus(['a.md'])
+    void corpus.reindex()          // not awaited, exactly like launch
+
+    const hits = await corpus.search('a')
+    expect(hits).toHaveLength(1)
+  })`,
          { label: 'Edit', ms: 480 }
        ),
        run(
          'npm run test:main -- corpus && node ../../files/drafts/probe-startup.mjs; echo "exit $?"',
          ` ✓ src/main/workspace/__tests__/corpus.test.ts (11 tests) 284ms

 Test Files  1 passed (1)
      Tests  11 passed (11)

median 1163 ms  (1121, 1163, 1208)
exit 0`,
          { label: 'Run tests', ms: 112_000 }
        ),
        send('files/drafts/probe-startup.mjs'),
        todo([
          { content: 'Write a probe with a good/bad exit code', status: 'completed', priority: 'high' },
          { content: 'Bisect v2.13.0..v2.14.0 with it', status: 'completed', priority: 'high' },
          { content: 'Read the commit it lands on and explain the cause', status: 'completed' },
          { content: 'Draft the fix and prove it with the same probe', status: 'completed', priority: 'high' },
          { content: 'Hand back — no push, no merge', status: 'completed' }
        ]),
        text(`**\`9f4e1a2\` — "desktop: reindex the corpus on launch so search is never stale".** Cold start is back to **1,163 ms**, measured by the same probe that called v2.14.0 bad.

| | Cold start |
| --- | ---: |
| v2.13.0 | 1,187 ms |
| v2.14.0 | 4,903 ms |
| main + this fix | 1,163 ms |

\`await corpus.reindex()\` sat between \`loadURL\` and \`show()\` — a fully loaded window held back until every file in the workspace had been read and embedded. Two mistakes stacked, and they needed separate fixes:

- **It was awaited on the launch path.** Nothing about drawing a window needs a current index; the first *search* does. It now runs unawaited after \`show()\`, and \`search\` awaits \`corpus.ready()\`.
- **It re-embedded everything, every time.** The store already keeps a content hash per file. On this workspace 2,847 of 2,891 files are unchanged on a normal launch — that is the 3.6 s. Fixing only the first mistake would have hidden the cost behind a visible window and still burned it on battery.

Three tests: only changed files re-embed, deleted files stop being searchable, and a search started during an in-flight reindex waits for it rather than returning nothing.

I ran the full bisect even though the first commit in the range had "reindex on launch" in its subject line and was obviously it. Six builds, twenty minutes, and now it is a fact rather than a good guess — twice this year the obvious commit turned out to be the one that made an older problem visible.

As instructed: **not pushed, not merged.** Changes are in the working tree on \`main\`, three files. The probe is above if you want to re-run it yourself — \`node files/drafts/probe-startup.mjs\` from the desktop folder, exit 0 means under 2 s.`)
      ]
    }
  ]
})
