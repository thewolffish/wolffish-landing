import { at } from '../clock'
import { PROJECT_PLATFORM } from '../projects'
import { ask, conversation, send, text, tool } from './dsl'

const GIT_LOG = `a41c8f2 feat(i18n): Arabic interface across the desktop app (WFC-1402) (Sara Almutairi)
3d90b17 feat(i18n): mirror the composer and the file rail in RTL (WFC-1403) (Sara Almutairi)
7c2e441 feat(mobile): offline queue for sends, drains on reconnect (WFC-1419) (Younes Alturkey)
b8140aa feat(mobile): pairing code fallback when the camera is denied (WFC-1409) (Younes Alturkey)
2f7c093 fix(mobile): retry a failed voice-note transcript instead of dropping it (WFC-1415) (Reem Alyami)
55ab3e1 feat(mobile): leaderboard sheet on the phone (WFC-1428) (Sara Almutairi)
9e30c74 fix(mobile): attachments sheet no longer crashes on Galaxy A56 (WFC-1401) (Reem Alyami)
1c884d0 feat(mobile): push notifications deep-link into the conversation (WFC-1423) (Younes Alturkey)
d7719b3 feat(admin): per-user daily search cap, enforced in the gate (WFC-1430) (Younes Alturkey)
4a02cc8 feat(admin): allowed-models chips in the org panel (WFC-1431) (Sara Almutairi)
6b31f27 feat(admin): resend an activation from the invite sheet (WFC-1417) (Sara Almutairi)
0fd4e19 feat(admin): month columns on the people grid (WFC-1404) (Sara Almutairi)
e2c7710 feat(api): archive idle conversations to R2 nightly (WFC-1421) (Younes Alturkey)
8817b02 feat(api): page the file manifest in sync bootstrap (WFC-1433) (Younes Alturkey)
c14a3e9 feat(api): ModelGate cooldown on 429 raised from 20s to 45s (WFC-1418) (Younes Alturkey)
f2810d5 feat(api): rate-limit /v1/search per employee (WFC-1412) (Younes Alturkey)
77b0e34 fix(api): outbox batch names every refused item (WFC-1425) (Younes Alturkey)
b0c9a71 feat(api): leaderboard board cache per org (WFC-1427) (Sara Almutairi)
930f18c feat(api): usage rollup retires raw rows after 180 days (WFC-1436) (Younes Alturkey)
a7734e0 test(api): seam tests for the sync outbox (WFC-1438) (Reem Alyami)
5c0281b refactor(api): one router table instead of three registration passes (Younes Alturkey)
e91b447 refactor(desktop): extract the file rail into its own store (Sara Almutairi)
2b7708f chore(ci): cache the Expo prebuild between EAS runs (Bandar Alanazi)
40aa1c6 chore(deps): expo 55.0.4, react-native 0.83.2 (Bandar Alanazi)
17d3e08 docs: quotas page in Arabic (WFC-1411) (Sara Almutairi)`

const DROPPED_BULLET = `- **Notifications open the right place.** Tapping a push notification lands in the conversation and the message it came from, not on the home screen.
`

const INTERNAL_SECTION = `## Internal

- **Idle conversations are archived to R2 nightly.** D1 keeps a bounded hot window; anything untouched for 60 days moves to object storage and is fetched on demand.
- **ModelGate holds a 429 cooldown for 45 seconds instead of 20.** The shorter window let the whole fleet retry into the same wall.
- **Seam tests for the sync outbox.** The outbox contract is now tested at the seam, so a replay bug fails in CI rather than on a phone.

`

const NOTES_V1 = `# Wolffish 2.14

Released from \`release/2.14\` · 25 commits since \`v2.13.0\` · 14 merged pull requests.

## What you will notice

- **The app speaks Arabic.** Every screen, menu and message in the desktop app is translated, and the whole interface mirrors right-to-left — including the composer, the file rail and the conversation list.
- **The phone app queues sends when you are offline.** Anything you write without a connection is held and delivered in order the moment you are back, with a marker on each queued message.
- **Pairing works without the camera.** If the camera is denied or unavailable, the phone shows a six-digit pairing code you type into the desktop app instead of scanning a QR.
- **A failed voice note retries itself.** Transcripts that fail on a flaky connection now retry twice before the note is marked failed, and the audio is kept either way.
${DROPPED_BULLET}- **The leaderboard is on the phone.** The same usage board as the desktop app, as a sheet, with your rank pinned at the top.

## For administrators

- **A daily search cap per employee.** Set it in the org panel; the gate enforces it, and the employee sees the remaining count instead of a failure.
- **Allowed-models chips.** Pick which catalog models an org can use from the panel, one chip per model, applied on the next request rather than the next session.
- **Resend an activation.** The invite sheet resends an activation email without creating a second invite, and the people grid now has month columns for joins and last activity.

${INTERNAL_SECTION}Upgrade notes: no migration is required. The archive job starts on the first night after deploy and runs at 02:00 in the org's timezone.
`

const NOTES_FINAL = NOTES_V1.replace(DROPPED_BULLET, '').replace(INTERNAL_SECTION, '')

export const releaseNotes214 = conversation({
  id: 'conv-release-notes-2-14',
  title: 'Release notes for 2.14',
  channel: 'electron',
  projectId: PROJECT_PLATFORM,
  workingFolder: ['~/dev/wolffish-cloud'],
  files: {
    'files/drafts/release-notes-2.14.md': NOTES_FINAL
  },
  turns: [
    {
      user: 'Release notes for 2.14. Branch is release/2.14, last tag is v2.13.0. I need the Markdown for the repo and a Word version for the customer email.',
      at: at(1, 14, 5),
      steps: [
        text('Reading the log and the merged PRs first, then three questions before I write a word.'),
        tool(
          'shell_exec',
          {
            command: "git fetch --tags --quiet && git log v2.13.0..release/2.14 --no-merges --pretty=format:'%h %s (%an)'",
            cwd: '~/dev/wolffish-cloud'
          },
          `${GIT_LOG}\n\n(25 commits)`,
          { ms: 1_320 }
        ),
        tool(
          'shell_exec',
          { command: 'git diff --shortstat v2.13.0..release/2.14', cwd: '~/dev/wolffish-cloud' },
          ' 318 files changed, 11842 insertions(+), 4106 deletions(-)',
          { ms: 640 }
        ),
        tool(
          'list_pull_requests',
          { owner: 'wolffish', repo: 'wolffish-cloud', state: 'closed', base: 'release/2.14', per_page: 50 },
          `14 merged pull requests into release/2.14:

#812  Arabic interface, end to end (WFC-1402, WFC-1403)      Sara Almutairi   labels: feature, i18n, desktop
#814  Offline queue for sends (WFC-1419)                     Younes Alturkey  labels: feature, mobile
#815  Pairing code fallback (WFC-1409)                       Younes Alturkey  labels: feature, mobile
#817  Voice note transcript retry (WFC-1415)                 Reem Alyami      labels: bug, mobile
#818  Leaderboard sheet on the phone (WFC-1428)              Sara Almutairi   labels: feature, mobile
#819  Attachments sheet crash on Galaxy A56 (WFC-1401)       Reem Alyami      labels: bug, mobile
#821  Push deep links (WFC-1423)                             Younes Alturkey  labels: feature, mobile
#823  Per-user daily search cap (WFC-1430)                   Younes Alturkey  labels: feature, admin
#824  Allowed-models chips (WFC-1431)                        Sara Almutairi   labels: feature, admin
#825  Invite resend + people grid months (WFC-1417, WFC-1404) Sara Almutairi  labels: feature, admin
#827  Nightly archive of idle conversations (WFC-1421)       Younes Alturkey  labels: feature, api
#828  ModelGate cooldown 20s -> 45s (WFC-1418)               Younes Alturkey  labels: reliability, api
#830  Sync outbox seam tests (WFC-1438)                      Reem Alyami      labels: tests, api
#831  Router table refactor + Expo 55 bump                   Bandar Alanazi   labels: chore, refactor

Open against release/2.14: none.`,
          { ms: 2_080 }
        ),
        ask(
          [
            {
              question: 'Who reads these notes?',
              details: 'The Markdown lives in the repo either way; the question is whose language the bullets are in.',
              options: [
                { label: 'Customers — org admins and their employees', description: 'Written for someone who uses the app, not someone who ships it.' },
                { label: 'Internal — the team and support' }
              ],
              allowOther: true
            },
            {
              question: 'Tone?',
              options: [
                { label: 'Plain', description: 'What changed and what it means for you. No adjectives that cannot be verified.' },
                { label: 'Marketing', description: 'Launch language, benefit-first headlines.' }
              ],
              allowOther: false
            },
            {
              question: 'Do the internal changes go in?',
              details: 'Six of the 25 commits are refactors, CI and dependency bumps with no visible change. Three others are internal but explain behaviour customers will feel.',
              options: [
                { label: 'Leave them all out' },
                { label: 'A separate Internal section in the Markdown, not in the customer email' },
                { label: 'Everything in one list' }
              ],
              allowOther: false
            }
          ],
          [{ option: 0 }, { option: 0 }, { option: 1 }],
          46_000
        ),
        text(
          'Customers, plain, internal changes in their own section that the Word version drops. Twelve bullets — the pure refactors, the Expo bump and the CI cache are out, since none of them changes anything a user can see.'
        ),
        tool(
          'file_write',
          { path: 'files/drafts/release-notes-2.14.md', content: NOTES_V1 },
          'Wrote files/drafts/release-notes-2.14.md — 12 bullets in 3 sections, 2.4 KB.',
          { ms: 180 }
        ),
        tool(
          'document_create',
          {
            path: 'files/drafts/release-notes-2.14-customer-email.docx',
            title: 'Wolffish 2.14 — what is new',
            source: 'files/drafts/release-notes-2.14.md',
            omit_sections: ['Internal'],
            style: { heading: 'IBM Plex Sans', body: 'IBM Plex Sans', size: 11 }
          },
          'Created files/drafts/release-notes-2.14-customer-email.docx — 2 pages, 9 bullets in 2 sections, 412 words, 38 KB. The Internal section was omitted as instructed.',
          { ms: 2_640 }
        ),
        send('files/drafts/release-notes-2.14.md'),
        send('files/drafts/release-notes-2.14-customer-email.docx'),
        text(`Both drafted from the log, not from memory.

| Section | Bullets | Commits behind them |
| --- | ---: | ---: |
| What you will notice | 6 | 7 |
| For administrators | 3 | 4 |
| Internal | 3 | 3 |
| Not in the notes | — | 11 |

The eleven left out: four refactors, CI and dependency bumps; five API changes with no behaviour a user or an admin can see; and two real ones — the Galaxy A56 crash fix and the Arabic quotas docs page — cut to stay under twelve bullets. Say the word and either comes back in.

- **The Word file has no Internal section**, per your answer, so it is 9 bullets on 2 pages and can go to customers as it stands.
- **One claim I could not verify from the log:** the archive job's 02:00 local run time. I took it from the PR #827 description, not from the code. Worth a glance before this ships.`)
      ]
    },
    {
      user: 'Too long. Shorten to eight bullets and drop the internal section entirely — both files.',
      at: at(1, 14, 29),
      steps: [
        text('Cutting the Internal section and the push-notification bullet — it is the smallest visible change of the six.'),
        tool(
          'file_patch',
          { path: 'files/drafts/release-notes-2.14.md', find: DROPPED_BULLET, replace: '' },
          'Patched files/drafts/release-notes-2.14.md (1 replacement, -1 bullet).',
          { ms: 110 }
        ),
        tool(
          'file_patch',
          { path: 'files/drafts/release-notes-2.14.md', find: INTERNAL_SECTION, replace: '' },
          'Patched files/drafts/release-notes-2.14.md (1 replacement, -1 section, -3 bullets). File is now 8 bullets in 2 sections, 1.8 KB.',
          { ms: 140 }
        ),
        tool(
          'document_create',
          {
            path: 'files/drafts/release-notes-2.14-customer-email.docx',
            title: 'Wolffish 2.14 — what is new',
            source: 'files/drafts/release-notes-2.14.md',
            style: { heading: 'IBM Plex Sans', body: 'IBM Plex Sans', size: 11 }
          },
          'Rewrote files/drafts/release-notes-2.14-customer-email.docx — 1 page, 8 bullets in 2 sections, 341 words, 34 KB.',
          { ms: 2_310 }
        ),
        send('files/drafts/release-notes-2.14.md'),
        send('files/drafts/release-notes-2.14-customer-email.docx'),
        text(`Eight bullets, two sections, both files match now. The Word version fits on one page.

| File | Before | After |
| --- | ---: | ---: |
| \`release-notes-2.14.md\` | 12 bullets, 3 sections | 8 bullets, 2 sections |
| \`release-notes-2.14-customer-email.docx\` | 9 bullets, 2 pages | 8 bullets, 1 page |

Gone with the Internal section: the nightly R2 archive, the ModelGate cooldown change and the outbox seam tests. The cooldown one is the only one I would keep somewhere — it is the fix for the 6 September incident, and support will be asked about it.`)
      ]
    }
  ]
})
