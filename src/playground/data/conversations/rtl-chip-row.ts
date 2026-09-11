import { VISION } from '../catalog'
import { at } from '../clock'
import { conversation, edit, reasoning, run, send, text, todo, tool } from './dsl'

const DESKTOP = '~/dev/wolffish-cloud/apps/desktop'

export const rtlChipRow = conversation({
  id: 'conv-rtl-chip-row',
  title: 'Chips run the wrong way in Arabic',
  channel: 'mobile',
  icon: '🔤',
  model: VISION,
  workingFolder: [DESKTOP],
  turns: [
    {
      user: 'Nawaf switched the app to Arabic for the board demo and the chips under the composer are laid out left-to-right with the arrow pointing the wrong way. Screenshot attached. Can you fix it before Thursday?',
      attachments: ['uploads/conv-rtl/arabic-composer.png'],
      at: at(1, 20, 40),
      steps: [
        reasoning(`Reading the screenshot rather than the sentence: the row itself IS mirrored —
the context meter is on the right, the send button on the left, which is correct
for RTL. So the container is fine and \`dir="rtl"\` is doing its job.

What is wrong is inside the chips. Each chip's icon sits to the left of its
number with a gap on the right, which is the LTR arrangement, and the disclosure
arrow points right — away from the content it would open in RTL.

That pattern — container mirrors, contents do not — is the signature of physical
CSS properties: \`ml-*\`, \`mr-*\`, \`left-*\`, \`text-left\`. Those do not flip with
direction; the logical ones (\`ms-*\`, \`me-*\`, \`start-*\`, \`text-start\`) do. So this
is a grep, not an investigation — and the right fix is every one of them in that
row, not just the two in the screenshot.`),
        tool(
          'file_grep',
          {
            pattern: '\\b(ml-|mr-|pl-|pr-|left-|right-|text-left|text-right)',
            path: 'src/renderer/src/pages',
            glob: '*.tsx'
          },
          `9 matches in 2 files.

src/renderer/src/pages/Chat.tsx
 1148:  'flex items-center gap-1 rounded-lg pl-2 pr-1.5 text-xs'      (SheetCountButton)
 1163:  <ArrowRight01Icon size={12} className="text-muted ml-0.5" />
 1281:  'ml-1 flex h-7 shrink-0 items-center gap-1 rounded-full'       (WorkingFolderButton)
 1294:  'absolute left-0 bottom-full mb-2 w-64 rounded-xl'            (folder popover)
 1302:  <span className="text-left truncate">{folder}</span>

src/renderer/src/pages/Library.tsx
  88:   'mr-2 inline-flex items-center'
 141:   'text-right tabular-nums'
 208:   'pl-6'
 214:   'pr-3'`,
          { ms: 740 }
        ),
        reasoning(`Nine, and only five of them are in the composer row the screenshot shows. The
Library ones are the same bug on a page nobody has looked at in Arabic yet —
same fix, and leaving them would mean doing this twice.

The arrow is its own case. \`ArrowRight01Icon\` is not a layout property; it is a
glyph that points right, and no CSS class flips it. In RTL "forward" is left, so
the icon itself has to change with the direction — a conditional on the locale,
not a margin.

Rule I'm applying: logical properties everywhere, and direction-aware glyphs
where the glyph means a direction. Then prove it by looking at it, because a
screenshot is what started this and a screenshot is what should end it.`),
        todo([
          { content: 'Replace the physical spacing classes in the composer row', status: 'in_progress', priority: 'high' },
          { content: 'Flip the disclosure arrow with the direction, not with CSS', status: 'pending', priority: 'high' },
          { content: 'Same fix on Library — four more', status: 'pending' },
          { content: 'Lint rule so the next one fails CI instead of the demo', status: 'pending' },
          { content: 'Screenshot both languages side by side', status: 'pending', priority: 'high' }
        ]),
        edit(
          `${DESKTOP}/src/renderer/src/pages/Chat.tsx`,
          `--- a/src/renderer/src/pages/Chat.tsx
+++ b/src/renderer/src/pages/Chat.tsx
@@ -1145,11 +1145,13 @@ function SheetCountButton({ icon, count, label, countLabel, onOpen }: Props) {
       className={cn(
-        'flex items-center gap-1 rounded-lg pl-2 pr-1.5 text-xs',
+        // Logical, not physical: ps/pe follow the direction, pl/pr do not.
+        'flex items-center gap-1 rounded-lg ps-2 pe-1.5 text-xs',
         'text-muted hover:text-fg hover:bg-border/40 cursor-pointer'
       )}
@@ -1160,7 +1162,11 @@ function SheetCountButton({ icon, count, label, countLabel, onOpen }: Props) {
-      <ArrowRight01Icon size={12} className="text-muted ml-0.5" />
+      {/* The glyph MEANS "forward", and forward is leftwards in Arabic — no
+          CSS property flips an icon, so the icon has to be chosen. */}
+      {rtl ? (
+        <ArrowLeft01Icon size={12} className="text-muted ms-0.5" />
+      ) : (
+        <ArrowRight01Icon size={12} className="text-muted ms-0.5" />
+      )}
@@ -1278,7 +1284,7 @@ function WorkingFolderButton({ folders, onAdd, onRemove, removeDisabled }: Props)
       className={cn(
-        'ml-1 flex h-7 shrink-0 items-center gap-1 rounded-full border px-2',
+        'ms-1 flex h-7 shrink-0 items-center gap-1 rounded-full border px-2',
         'border-border bg-surface text-muted hover:text-fg text-xs font-medium'
       )}
@@ -1291,9 +1297,9 @@ function WorkingFolderButton({ folders, onAdd, onRemove, removeDisabled }: Props)
         <div
           className={cn(
-            'absolute left-0 bottom-full mb-2 w-64 rounded-xl border p-3',
+            'absolute start-0 bottom-full mb-2 w-64 rounded-xl border p-3',
             'border-border bg-surface shadow-lg'
           )}
         >
-          <span className="text-left truncate">{folder}</span>
+          {/* The PATH stays LTR even in Arabic — a path is not prose. */}
+          <span dir="ltr" className="text-start truncate">{folder}</span>`,
          { label: 'Edit', ms: 480 }
        ),
        edit(
          `${DESKTOP}/src/renderer/src/pages/Library.tsx`,
          `--- a/src/renderer/src/pages/Library.tsx
+++ b/src/renderer/src/pages/Library.tsx
@@ -85,7 +85,7 @@ function TabIcon({ children }: { children: ReactNode }) {
-  return <span className={cn('mr-2 inline-flex items-center')}>{children}</span>
+  return <span className={cn('me-2 inline-flex items-center')}>{children}</span>
@@ -138,7 +138,9 @@ function RunCount({ value }: { value: number }) {
-  return <span className="text-right tabular-nums">{value}</span>
+  // Numbers stay end-aligned in both directions; tabular-nums keeps the
+  // columns from dancing as counts change.
+  return <span className="text-end tabular-nums">{value}</span>
@@ -205,10 +207,10 @@ function Row({ item }: { item: LibraryItem }) {
-      <td className="pl-6">{item.title}</td>
+      <td className="ps-6">{item.title}</td>
@@ -211,7 +213,7 @@ function Row({ item }: { item: LibraryItem }) {
-      <td className="pr-3">{item.updatedAt}</td>
+      <td className="pe-3">{item.updatedAt}</td>`,
          { label: 'Edit', ms: 360 }
        ),
        edit(
          `${DESKTOP}/eslint.config.mjs`,
          `--- a/eslint.config.mjs
+++ b/eslint.config.mjs
@@ -48,6 +48,24 @@ export default [
+      // Physical spacing classes do not flip in Arabic, and the app ships
+      // in Arabic. The logical pair (ps/pe, ms/me, start/end, text-start)
+      // does. Caught here rather than in a board demo.
+      'no-restricted-syntax': [
+        'error',
+        {
+          selector:
+            "Literal[value=/(^|\\\\s)(ml|mr|pl|pr)-[0-9.]+(\\\\s|$)|(^|\\\\s)(left|right)-[0-9.]+(\\\\s|$)|text-(left|right)(\\\\s|$)/]",
+          message:
+            'Use the logical property (ms/me, ps/pe, start/end, text-start/text-end) — physical ones do not flip in RTL.'
+        }
+      ],`,
          { label: 'Edit', ms: 260 }
        ),
        run(
          'npm run lint',
          `> eslint . --max-warnings 0

/Users/younes/dev/wolffish-cloud/apps/desktop/src/renderer/src/components/common/media-lightbox/MediaLightbox.tsx
  71:22  error  Use the logical property (ms/me, ps/pe, start/end, text-start/text-end) — physical ones do not flip in RTL

/Users/younes/dev/wolffish-cloud/apps/desktop/src/renderer/src/components/common/audio-player/AudioPlayer.tsx
  38:15  error  Use the logical property (ms/me, ps/pe, start/end, text-start/text-end) — physical ones do not flip in RTL

✖ 2 problems (2 errors, 0 warnings)`,
          { label: 'Lint', exitCode: 1, ms: 12_400 }
        ),
        text(
          'The rule immediately found two more the grep missed — they were in `components/`, and I had only swept `pages/`. Fixing both rather than narrowing the rule.'
        ),
        edit(
          `${DESKTOP}/src/renderer/src/components/common/media-lightbox/MediaLightbox.tsx`,
          `--- a/src/renderer/src/components/common/media-lightbox/MediaLightbox.tsx
+++ b/src/renderer/src/components/common/media-lightbox/MediaLightbox.tsx
@@ -68,7 +68,7 @@ export function MediaLightbox({ items, index, onClose }: Props) {
       <button
         type="button"
         aria-label={t('chat.lightbox.next')}
-        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2"
+        className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full p-2"
         onClick={next}
       >`,
          { label: 'Edit', ms: 170 }
        ),
        edit(
          `${DESKTOP}/src/renderer/src/components/common/audio-player/AudioPlayer.tsx`,
          `--- a/src/renderer/src/components/common/audio-player/AudioPlayer.tsx
+++ b/src/renderer/src/components/common/audio-player/AudioPlayer.tsx
@@ -35,7 +35,9 @@ export function AudioPlayer({ filePath, fileName, mimeType }: Props) {
-      <span className="text-muted ml-2 text-xs tabular-nums">{elapsed}</span>
+      {/* The TIME is LTR in both languages (0:42, never 42:0), but where it
+          sits in the row follows the direction. */}
+      <span dir="ltr" className="text-muted ms-2 text-xs tabular-nums">{elapsed}</span>`,
          { label: 'Edit', ms: 180 }
        ),
        run('npm run lint && npm run typecheck', 'No output — clean.', {
          label: 'Lint',
          ms: 31_200
        }),
        tool(
          'screenshot_app',
          { app: 'Wolffish Cloud', locale: 'ar', page: 'chat' },
          'Saved files/screenshots/2026-09/composer-ar-after.png (1512×982). Arabic, composer row: meter at the start edge (right), action cluster at the end edge (left), chip icons leading their numbers, disclosure arrows pointing left.',
          { ms: 3_800 }
        ),
        tool(
          'screenshot_app',
          { app: 'Wolffish Cloud', locale: 'en', page: 'chat' },
          'Saved files/screenshots/2026-09/composer-en-after.png (1512×982). English, same page, for comparison — unchanged from before the fix.',
          { ms: 3_400 }
        ),
        send('files/screenshots/2026-09/composer-ar-after.png'),
        send('files/screenshots/2026-09/composer-en-after.png'),
        todo([
          { content: 'Replace the physical spacing classes in the composer row', status: 'completed', priority: 'high' },
          { content: 'Flip the disclosure arrow with the direction, not with CSS', status: 'completed', priority: 'high' },
          { content: 'Same fix on Library — four more', status: 'completed' },
          { content: 'Lint rule so the next one fails CI instead of the demo', status: 'completed' },
          { content: 'Screenshot both languages side by side', status: 'completed', priority: 'high' }
        ]),
        text(`Fixed — both screenshots above, Arabic first.

The row itself was never wrong: \`dir="rtl"\` mirrored the container correctly, which is why it looked *nearly* right. What did not flip was everything inside, because those chips used **physical** Tailwind classes — \`pl-2\`, \`mr-2\`, \`left-0\`, \`text-left\` — and physical properties do not know about direction. The logical pair (\`ps/pe\`, \`ms/me\`, \`start/end\`, \`text-start/end\`) does.

The arrow was a different animal. No CSS class flips a glyph that *points*: \`ArrowRight01Icon\` draws an arrow to the right in any direction. In Arabic, forward is leftwards, so the component now picks the icon rather than styling it.

Two things stay LTR on purpose even in Arabic: **file paths** and **timestamps**. \`~/dev/wolffish-cloud\` reversed is not a path, and \`0:42\` reversed is not a duration. Both got an explicit \`dir="ltr"\`.

I also added an eslint rule that refuses the physical classes, and it immediately caught two I had missed in \`components/\` — the lightbox's next button and the audio player's elapsed time. That is the part that matters for Thursday: the next one fails CI instead of failing in front of the board.

Nine files, \`npm run lint\` and \`typecheck\` clean. Local branch \`fix/rtl-logical-properties\`, not pushed.`)
      ]
    }
  ]
})
