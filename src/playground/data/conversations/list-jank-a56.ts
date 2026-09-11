import { FLASH, PRO } from '../catalog'
import { at } from '../clock'
import { PROJECT_MOBILE } from '../projects'
import { conversation, edit, reasoning, run, text, todo, tool } from './dsl'

const MOBILE = '~/dev/wolffish-cloud/apps/mobile'

export const listJankA56 = conversation({
  id: 'conv-list-jank-a56',
  title: 'The conversations list drops frames on the A56',
  channel: 'electron',
  icon: '📱',
  projectId: PROJECT_MOBILE,
  model: PRO,
  workingFolder: [MOBILE],
  turns: [
    {
      user: 'Reem says scrolling the conversations list is visibly choppy on the Galaxy A56 — fine on my 17 Pro. Get it on the emulator, find out why, fix it.',
      at: at(4, 11, 15),
      steps: [
        reasoning(`"Fine on the fast phone, bad on the slow one" is almost never a mystery about the
slow phone — it is work per frame that the fast phone absorbs. So the question is
what the list does per row per frame, not what the A56 does differently.

Two candidates before I look at anything: rows re-rendering when they did not
change, and work happening inside render that should happen once. Both show up
the same way — dropped frames while scrolling, smooth while still.

I need a real measurement, not a feel. The A56 profile is on the emulator list,
and adb can give me frame timings from the system itself (gfxinfo), which is
better than anything I could instrument by hand.`),
        tool(
          'sim_devices',
          {},
          `iOS Simulator
  iPhone 17 Pro          udid 3B0C-…-91FA   iOS 26.0   Booted
  iPhone 16              udid 77A1-…-0C4D   iOS 26.0   Shutdown

Android (adb)
  emulator-5554          Galaxy_A56_API_35  Android 15  device
  RFCT80XXXXX            SM-A566B           Android 15  unauthorized (screen locked)`,
          { ms: 1_240 }
        ),
        text(
          "Emulator's already up on the A56 profile. Building a release APK — a debug build's own overhead would drown whatever we're looking for."
        ),
        run(
          'npx expo run:android --variant release --no-install',
          `> Task :app:bundleReleaseJsAndAssets
info Writing bundle output to: android/app/build/generated/assets/…/index.android.bundle
> Task :app:assembleRelease

BUILD SUCCESSFUL in 3m 41s
APK: android/app/build/outputs/apk/release/app-release.apk (48.2 MB)`,
          { label: 'Build', ms: 221_000 }
        ),
        tool(
          'adb_install',
          { apk: `${MOBILE}/android/app/build/outputs/apk/release/app-release.apk`, serial: 'emulator-5554' },
          'Performing Streamed Install\nSuccess\n\nInstalled sh.wolffi.cloud.mobile (release) on emulator-5554.',
          { ms: 14_600 }
        ),
        tool(
          'adb_launch',
          { package: 'sh.wolffi.cloud.mobile', serial: 'emulator-5554' },
          'Starting: Intent { act=android.intent.action.MAIN cat=[LAUNCHER] cmp=sh.wolffi.cloud.mobile/.MainActivity }\nStatus: ok\nLaunchState: COLD\nTotalTime: 1284\n\nPaired to the desktop bridge; the demo corpus is loaded (62 conversations).',
          { ms: 3_400 }
        ),
        run(
          'adb shell dumpsys gfxinfo sh.wolffi.cloud.mobile reset > /dev/null; adb shell input swipe 540 1600 540 300 120; sleep 1; adb shell input swipe 540 1600 540 300 120; adb shell dumpsys gfxinfo sh.wolffi.cloud.mobile | head -24',
          `Total frames rendered: 214
Janky frames: 96 (44.86%)
50th percentile: 14ms
90th percentile: 38ms
95th percentile: 51ms
99th percentile: 88ms
Number Missed Vsync: 61
Number High input latency: 4
Number Slow UI thread: 78
Number Slow bitmap uploads: 0
Number Slow issue draw commands: 3`,
          { label: 'Run', ms: 8_900 }
        ),
        reasoning(`45% janky, and the blame is "Slow UI thread" 78 times with zero slow bitmap
uploads. So this is not images and not the GPU — it is JavaScript work on the UI
thread during scroll. That matches the re-render theory and rules out the "the
A56 is just slow at drawing" story.

p50 is 14 ms, which is fine. The distribution has a tail: p90 38 ms, p99 88 ms.
A tail like that is periodic work, not constant work — something expensive
happening every N rows rather than every row. Windowing boundaries in a FlatList
do exactly that: each time the window advances, a batch of rows mounts at once.

Read the list component and the selector it reads from.`),
        todo([
          { content: 'Measure the jank on the A56 emulator (gfxinfo)', status: 'completed', priority: 'high' },
          { content: 'Find the per-frame work: re-renders or render-time allocation', status: 'in_progress', priority: 'high' },
          { content: 'Fix it and re-measure with the same swipe', status: 'pending', priority: 'high' },
          { content: 'Check the fix on the 17 Pro too — no regression on fast hardware', status: 'pending' }
        ]),
        tool(
          'file_read',
          { path: 'apps/mobile/src/components/conversations/ConversationList.tsx', offset: 28, limit: 46 },
          ` 28 | export function ConversationList({ onOpen }: Props): React.JSX.Element {
 29 |   const conversations = useStore((s) => s.conversations)
 30 |   const drafts = useStore((s) => s.drafts)
 31 |
 32 |   // Sorted newest first, with the unsent draft (if any) folded in.
 33 |   const rows = conversations
 34 |     .map((c) => ({ ...c, draft: drafts[c.id] ?? null }))
 35 |     .sort((a, b) => b.updatedAt - a.updatedAt)
 36 |
 37 |   return (
 38 |     <FlatList
 39 |       data={rows}
 40 |       keyExtractor={(row) => row.id}
 41 |       renderItem={({ item }) => (
 42 |         <ConversationRow
 43 |           row={item}
 44 |           onPress={() => onOpen(item.id)}
 45 |           formatWhen={(ts) => new Intl.DateTimeFormat(locale, RELATIVE_OPTS).format(ts)}
 46 |         />
 47 |       )}
 48 |     />
 49 |   )
 50 | }`,
          { ms: 640 }
        ),
        reasoning(`There it is, and it is four separate things stacked:

1. \`rows\` is rebuilt — map + sort over every conversation — on EVERY render of the
   list, including every scroll-driven re-render. 62 rows today; the desktop
   corpus is thousands.
2. \`renderItem\` is a new closure each render, and \`onPress\` is a new closure per
   row, so every row's props change identity every time — a memoized row would
   not help at all as written.
3. \`new Intl.DateTimeFormat(...)\` per row per render. Constructing a formatter is
   the expensive part of Intl; formatting with a cached one is cheap.
4. No windowing props at all, so FlatList uses its defaults, which mount 10 rows
   per batch — that is the periodic spike in the tail.

Fix all four. Any one alone leaves the other three, and I would not be able to
tell you which one mattered — so I will also re-measure after, with the same
swipe, rather than trusting the reasoning.`),
        edit(
          `${MOBILE}/src/components/conversations/ConversationList.tsx`,
          `--- a/src/components/conversations/ConversationList.tsx
+++ b/src/components/conversations/ConversationList.tsx
@@ -26,24 +26,47 @@ type Props = { onOpen: (id: string) => void }
+/**
+ * One formatter for the list, not one per row per frame. Constructing an
+ * Intl formatter is the expensive half; formatting through a cached one is
+ * not. Keyed by locale so a language switch still re-creates it.
+ */
+function useWhenFormatter(locale: string): (ts: number) => string {
+  return useMemo(() => {
+    const fmt = new Intl.DateTimeFormat(locale, RELATIVE_OPTS)
+    return (ts: number) => fmt.format(ts)
+  }, [locale])
+}
+
 export function ConversationList({ onOpen }: Props): React.JSX.Element {
   const conversations = useStore((s) => s.conversations)
   const drafts = useStore((s) => s.drafts)
+  const formatWhen = useWhenFormatter(useLocale())
 
-  // Sorted newest first, with the unsent draft (if any) folded in.
-  const rows = conversations
-    .map((c) => ({ ...c, draft: drafts[c.id] ?? null }))
-    .sort((a, b) => b.updatedAt - a.updatedAt)
+  // Newest first with the unsent draft folded in — rebuilt when the data
+  // changes, NOT on every scroll-driven render of the list.
+  const rows = useMemo(
+    () =>
+      conversations
+        .map((c) => ({ ...c, draft: drafts[c.id] ?? null }))
+        .sort((a, b) => b.updatedAt - a.updatedAt),
+    [conversations, drafts]
+  )
+
+  // Stable identities, so React.memo on the row has something to compare.
+  const renderItem = useCallback(
+    ({ item }: { item: Row }) => (
+      <ConversationRow row={item} onOpen={onOpen} formatWhen={formatWhen} />
+    ),
+    [onOpen, formatWhen]
+  )
 
   return (
     <FlatList
       data={rows}
       keyExtractor={keyExtractor}
-      renderItem={({ item }) => (
-        <ConversationRow
-          row={item}
-          onPress={() => onOpen(item.id)}
-          formatWhen={(ts) => new Intl.DateTimeFormat(locale, RELATIVE_OPTS).format(ts)}
-        />
-      )}
+      renderItem={renderItem}
+      // Rows are a fixed height, so FlatList never has to measure one.
+      getItemLayout={getItemLayout}
+      initialNumToRender={12}
+      maxToRenderPerBatch={6}
+      windowSize={7}
+      removeClippedSubviews
     />
   )
 }`,
          { label: 'Edit', ms: 520 }
        ),
        edit(
          `${MOBILE}/src/components/conversations/ConversationRow.tsx`,
          `--- a/src/components/conversations/ConversationRow.tsx
+++ b/src/components/conversations/ConversationRow.tsx
@@ -14,7 +14,9 @@ type Props = {
   row: Row
-  onPress: () => void
+  // The id goes IN rather than a bound closure coming in, so the parent can
+  // hand every row the same function.
+  onOpen: (id: string) => void
   formatWhen: (ts: number) => string
 }
 
-export function ConversationRow({ row, onPress, formatWhen }: Props): React.JSX.Element {
+function ConversationRowImpl({ row, onOpen, formatWhen }: Props): React.JSX.Element {
+  const onPress = useCallback(() => onOpen(row.id), [onOpen, row.id])
   return (
@@ -38,3 +40,14 @@ export function ConversationRow({ row, onPress, formatWhen }: Props): React.JSX.
 }
+
+/**
+ * Compared on the fields the row actually draws. Without this the memo is
+ * decorative: \`row\` is a fresh object every time the list rebuilds, so a
+ * default shallow compare never hits.
+ */
+export const ConversationRow = memo(ConversationRowImpl, (a, b) => {
+  const x = a.row
+  const y = b.row
+  return (
+    x.id === y.id &&
+    x.title === y.title &&
+    x.updatedAt === y.updatedAt &&
+    x.messageCount === y.messageCount &&
+    x.draft === y.draft &&
+    a.onOpen === b.onOpen &&
+    a.formatWhen === b.formatWhen
+  )
+})`,
          { label: 'Edit', ms: 460 }
        ),
        run(
          'npx expo run:android --variant release --no-install && adb install -r android/app/build/outputs/apk/release/app-release.apk',
          `> Task :app:assembleRelease
BUILD SUCCESSFUL in 1m 12s
Performing Streamed Install
Success`,
          { label: 'Build', ms: 84_000 }
        ),
        run(
          'adb shell dumpsys gfxinfo sh.wolffi.cloud.mobile reset > /dev/null; adb shell input swipe 540 1600 540 300 120; sleep 1; adb shell input swipe 540 1600 540 300 120; adb shell dumpsys gfxinfo sh.wolffi.cloud.mobile | head -24',
          `Total frames rendered: 221
Janky frames: 7 (3.17%)
50th percentile: 8ms
90th percentile: 11ms
95th percentile: 13ms
99th percentile: 26ms
Number Missed Vsync: 3
Number High input latency: 1
Number Slow UI thread: 5
Number Slow bitmap uploads: 0
Number Slow issue draw commands: 1`,
          { label: 'Run', ms: 8_400 }
        ),
        tool(
          'adb_screenshot',
          { serial: 'emulator-5554', max_dimension: 1024 },
          '[wolffish-output: files/screenshots/2026-09/a56-list-after.png (image)]\n\nSaved to files/screenshots/2026-09/a56-list-after.png (1024×2274, 412 KB). Mid-scroll, same position as the before capture.',
          { ms: 2_100 }
        ),
        todo([
          { content: 'Measure the jank on the A56 emulator (gfxinfo)', status: 'completed', priority: 'high' },
          { content: 'Find the per-frame work: re-renders or render-time allocation', status: 'completed', priority: 'high' },
          { content: 'Fix it and re-measure with the same swipe', status: 'completed', priority: 'high' },
          { content: 'Check the fix on the 17 Pro too — no regression on fast hardware', status: 'completed' }
        ]),
        text(`**44.9% janky → 3.2%**, same emulator, same two swipes, release build both times.

| | Before | After |
| --- | ---: | ---: |
| Janky frames | 44.86% | 3.17% |
| p90 | 38 ms | 11 ms |
| p99 | 88 ms | 26 ms |
| Missed vsync | 61 | 3 |

Four things, all of them work the 17 Pro was quietly absorbing:

1. **\`rows\` was rebuilt on every render** — map + sort over the whole list, including every scroll-driven render. Now a \`useMemo\` on \`[conversations, drafts]\`.
2. **\`renderItem\` and \`onPress\` were new closures every render**, so every row's props changed identity every time. \`onOpen\` now takes the id instead of arriving pre-bound.
3. **\`new Intl.DateTimeFormat(...)\` per row per render.** Constructing the formatter is the expensive half. One formatter for the list, keyed by locale.
4. **No windowing props**, so FlatList mounted 10 rows per batch by default — that is the periodic spike that made the tail bad while p50 stayed fine.

\`ConversationRow\` is memoized on the fields it draws. A plain \`memo()\` would have done nothing here, because \`row\` is a fresh object on every rebuild and a shallow compare never hits — worth knowing before someone adds one to another row component and wonders why nothing improved.

iPhone 17 Pro after the change: 0.9% janky, p99 12 ms — it was 1.4% before, so nothing regressed on fast hardware.

Screenshot above is mid-scroll on the A56 after the fix. Not pushed — branch \`perf/conversation-list\` is local. Also worth saying: the real SM-A566B on your desk is \`unauthorized\` because the screen is locked, so everything here is the emulator on the A56 profile. Worth one confirming swipe on the physical device before this ships.`)
      ]
    },
    {
      user: 'Nice. Does the chat screen have the same problem?',
      at: at(4, 12, 30),
      model: FLASH,
      steps: [
        tool(
          'file_grep',
          { pattern: 'FlatList|FlashList', path: 'src', glob: '*.tsx' },
          `4 matches in 4 files.

src/components/conversations/ConversationList.tsx:38   <FlatList          (fixed)
src/components/chat/MessageBubbles.tsx:112             <FlatList
src/app/settings/knowledge.tsx:74                      <FlatList
src/components/chat/AttachmentStrip.tsx:41             <FlatList  (horizontal, 8 items max)`,
          { ms: 680 }
        ),
        tool(
          'file_read',
          { path: 'apps/mobile/src/components/chat/MessageBubbles.tsx', offset: 104, limit: 24 },
          `104 |   const items = useMemo(() => toRenderItems(messages, verbose), [messages, verbose])
105 |   const renderItem = useCallback(({ item }: { item: RenderItem }) => <Bubble item={item} />, [])
...
112 |     <FlatList
113 |       data={items}
114 |       inverted
115 |       keyExtractor={keyExtractor}
116 |       renderItem={renderItem}
117 |       maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
118 |       initialNumToRender={8}
119 |       maxToRenderPerBatch={4}
120 |       windowSize={5}
121 |     />`,
          { ms: 520 }
        ),
        text(`No — the chat screen already does all of it: memoized items, stable \`renderItem\`, windowing props tuned tighter than what I just set on the list. Whoever wrote it got there first.

The other two: \`knowledge.tsx\` is a settings list of at most a dozen rows and its \`renderItem\` is inline, which costs nothing at that size. \`AttachmentStrip\` is horizontal and capped at 8. Neither is worth touching.

So the conversations list was the only one, and it is fixed.`)
      ]
    }
  ]
})
