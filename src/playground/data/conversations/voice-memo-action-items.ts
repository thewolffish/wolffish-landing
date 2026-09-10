import { FLASH } from '../catalog'
import { at } from '../clock'
import { conversation, send, text, tool } from './dsl'

const TRANSCRIPT = `Okay, quick one before I lose it, sprint review just wrapped. Three things we decided. One, two-fourteen ships without the offline queue, it moves to two-fifteen, Nawaf already agreed. Two, the attachments sheet crash fix goes out as a hotfix, we're not waiting for the train. Three, we're dropping Android fifteen from the device matrix, nobody's on it anymore. Then two follow-ups. Sara needs to redo the settings panel spacing before anyone takes the docs screenshots, that's blocking the docs page. And Bandar has to rotate the EAS credentials token, it's expired twice in CI this month. Release candidate is due Thursday, hard date, Nawaf wants it in TestFlight by end of day.`

const ACTIONS_MD = `# Sprint review — decisions and actions

Captured from a voice note, ${'`'}uploads/conv-memo/voice-2026-09-01.mp3${'`'} (1:04, English). Nothing here was added that was not said out loud.

## Decisions

- [x] **2.14 ships without the offline queue.** It moves to 2.15. Nawaf already agreed, so this needs no further sign-off.
- [x] **The attachments sheet crash fix goes out as a hotfix.** Not held for the release train.
- [x] **Android 15 comes out of the device matrix.** No remaining share worth testing against.

## Actions

- [ ] **Sara — redo the settings panel spacing.** Due before the docs screenshots are taken, which means before Thursday. Blocking the docs page.
- [ ] **Bandar — rotate the EAS credentials token.** Due tomorrow. It has expired twice in CI this month.
- [ ] **Younes — release candidate in TestFlight.** Due Thursday, end of day. Hard date, Nawaf's.

## Not decided in the meeting

- Whether the offline queue gets split at 2.15 planning or carried whole. It rolled twice already, so the retro rule says split, but nobody said so on the recording.
`

export const voiceMemoActionItems = conversation({
  id: 'conv-voice-memo-action-items',
  title: 'Sprint review voice note into action items',
  channel: 'mobile',
  model: FLASH,
  files: {
    'files/drafts/sprint-review-actions.md': ACTIONS_MD
  },
  turns: [
    {
      user: TRANSCRIPT,
      voicePrompt: true,
      voiceLang: 'en',
      attachments: ['uploads/conv-memo/voice-2026-09-01.mp3'],
      at: at(9, 19, 22),
      steps: [
        tool(
          'stt_transcribe',
          { filePath: 'uploads/conv-memo/voice-2026-09-01.mp3' },
          `Transcribed uploads/conv-memo/voice-2026-09-01.mp3 — 1:04, 44.1 kHz mono, detected language en (confidence 0.98), 113 words, no segment below 0.90.

"${TRANSCRIPT}"

Two spoken numbers normalised for the write-up: "two-fourteen" → 2.14, "two-fifteen" → 2.15. "Android fifteen" → Android 15.`,
          { ms: 3_420 }
        ),
        text('Three decisions, three actions — you gave yourself one of them. Writing it down before it evaporates.'),
        tool(
          'file_write',
          { path: 'files/drafts/sprint-review-actions.md', content: ACTIONS_MD },
          'Wrote files/drafts/sprint-review-actions.md (1.1 KB, 19 lines). Decisions checked, actions open, one open question kept separate because it was not decided on the recording.',
          { ms: 160 }
        ),
        send('files/drafts/sprint-review-actions.md'),
        tool(
          'document_create',
          {
            source: 'files/drafts/sprint-review-actions.md',
            output: 'files/drafts/sprint-review-actions.docx',
            style: 'wolffish-memo',
            checkboxes: true
          },
          'Created files/drafts/sprint-review-actions.docx — 1 page, real Word checkboxes so the boxes are tickable in the app, owners bolded. 22 KB.',
          { ms: 2_240 }
        ),
        send('files/drafts/sprint-review-actions.docx'),
        tool(
          'createJiraIssue',
          {
            project: 'WFC',
            issuetype: 'Task',
            summary: 'Settings panel spacing before the docs screenshots',
            description:
              'From the sprint review: the settings panel spacing is redone before anyone takes the docs screenshots. Blocking the docs page, so it needs to be done before Thursday. Captured from a voice note, files/drafts/sprint-review-actions.md.',
            labels: ['ui', 'blocks-docs'],
            assignee: 'sara.almutairi',
            priority: 'High'
          },
          '{"key":"WFC-1447","id":"41791","self":"https://wolffish.atlassian.net/rest/api/3/issue/41791","status":"To Do","sprint":"Sprint 42"}',
          { ms: 1_290 }
        ),
        tool(
          'createJiraIssue',
          {
            project: 'WFC',
            issuetype: 'Task',
            summary: 'Rotate the EAS credentials token',
            description:
              'From the sprint review: the EAS credentials token has expired twice in CI this month and is rotated tomorrow. Captured from a voice note, files/drafts/sprint-review-actions.md.',
            labels: ['ci', 'devops'],
            assignee: 'bandar.alanazi',
            priority: 'High'
          },
          '{"key":"WFC-1448","id":"41792","self":"https://wolffish.atlassian.net/rest/api/3/issue/41792","status":"To Do","sprint":"Sprint 42"}',
          { ms: 1_150 }
        ),
        text(`Done — the memo and the Word copy are above, and the two follow-ups are on the board: **WFC-1447** to Sara (spacing, before the docs screenshots) and **WFC-1448** to Bandar (rotate the EAS token, tomorrow). Your own item, the RC in TestFlight by Thursday end of day, is in the file but not ticketed — say the word if you want it there too.

One thing you said and then moved past: nobody decided whether the offline queue gets split at 2.15 planning. It has rolled twice, which is the case the retro rule covers. I left it under "not decided" rather than deciding it for you.`)
      ]
    }
  ]
})
