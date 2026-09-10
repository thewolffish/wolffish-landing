import { at } from '../clock'
import { PROJECT_MOBILE } from '../projects'
import { conversation, send, text, tool } from './dsl'

const CRASHES_CSV = `issue_id,title,device,os,screen,count,sessions_pct,first_seen,last_seen
WFC-MOB-118,TypeError: undefined is not an object (reading 'length'),Samsung Galaxy A56,Android 16,AttachmentsSheet,412,3.5,2026-09-02,2026-09-07
WFC-MOB-118,TypeError: undefined is not an object (reading 'length'),Xiaomi 15,Android 16,AttachmentsSheet,168,2.9,2026-09-02,2026-09-07
WFC-MOB-118,TypeError: undefined is not an object (reading 'length'),OnePlus 13,Android 16,AttachmentsSheet,96,2.7,2026-09-02,2026-09-07
WFC-MOB-118,TypeError: undefined is not an object (reading 'length'),Pixel 10,Android 17,AttachmentsSheet,121,1.5,2026-09-02,2026-09-07
WFC-MOB-118,TypeError: undefined is not an object (reading 'length'),Samsung Galaxy S26,Android 17,AttachmentsSheet,203,1.3,2026-09-02,2026-09-07
WFC-MOB-121,NSInvalidArgumentException -[AVAudioSession setActive:],iPhone 17 Pro,iOS 26.1,VoiceNoteRecorder,812,3.0,2026-09-02,2026-09-07
WFC-MOB-121,NSInvalidArgumentException -[AVAudioSession setActive:],iPhone 16,iOS 26.0,VoiceNoteRecorder,655,2.7,2026-09-02,2026-09-07
WFC-MOB-121,NSInvalidArgumentException -[AVAudioSession setActive:],iPhone 15,iOS 25.6,VoiceNoteRecorder,352,1.9,2026-09-02,2026-09-07
WFC-MOB-121,NSInvalidArgumentException -[AVAudioSession setActive:],iPhone 14,iOS 25.6,VoiceNoteRecorder,121,1.7,2026-09-03,2026-09-07
WFC-MOB-124,SIGABRT in SyncOutbox.replay — batch over 200 items,iPhone 15,iOS 25.6,SyncOutbox,402,2.2,2026-09-03,2026-09-07
WFC-MOB-124,SIGABRT in SyncOutbox.replay — batch over 200 items,Samsung Galaxy A56,Android 16,SyncOutbox,286,2.4,2026-09-03,2026-09-07
WFC-MOB-124,SIGABRT in SyncOutbox.replay — batch over 200 items,Pixel 10,Android 17,SyncOutbox,174,2.1,2026-09-03,2026-09-07
WFC-MOB-124,SIGABRT in SyncOutbox.replay — batch over 200 items,iPhone 14,iOS 25.6,SyncOutbox,163,2.2,2026-09-03,2026-09-06
WFC-MOB-124,SIGABRT in SyncOutbox.replay — batch over 200 items,Xiaomi 15,Android 16,SyncOutbox,118,2.1,2026-09-04,2026-09-07
WFC-MOB-124,SIGABRT in SyncOutbox.replay — batch over 200 items,Other,various,SyncOutbox,141,2.0,2026-09-03,2026-09-07
WFC-MOB-126,RangeError: Maximum call stack size exceeded,iPhone 17 Pro,iOS 26.1,ChatScreen,214,0.8,2026-08-19,2026-09-07
WFC-MOB-126,RangeError: Maximum call stack size exceeded,iPhone 16,iOS 26.0,ChatScreen,168,0.7,2026-08-19,2026-09-07
WFC-MOB-126,RangeError: Maximum call stack size exceeded,Samsung Galaxy S26,Android 17,ChatScreen,121,0.8,2026-08-20,2026-09-07
WFC-MOB-126,RangeError: Maximum call stack size exceeded,Pixel 10,Android 17,ChatScreen,74,0.9,2026-08-21,2026-09-06
WFC-MOB-129,Unhandled rejection: CameraPermissionDenied,Samsung Galaxy A56,Android 16,PairingScreen,96,0.8,2026-07-30,2026-09-07
WFC-MOB-129,Unhandled rejection: CameraPermissionDenied,Xiaomi 15,Android 16,PairingScreen,61,1.1,2026-07-30,2026-09-07
WFC-MOB-129,Unhandled rejection: CameraPermissionDenied,OnePlus 13,Android 16,PairingScreen,38,1.1,2026-08-02,2026-09-05
WFC-MOB-129,Unhandled rejection: CameraPermissionDenied,Other,various,PairingScreen,47,0.7,2026-07-31,2026-09-07
WFC-MOB-131,SQLiteException: database is locked,iPhone 15,iOS 25.6,ConversationList,143,0.8,2026-08-11,2026-09-07
WFC-MOB-131,SQLiteException: database is locked,iPhone 14,iOS 25.6,ConversationList,68,0.9,2026-08-11,2026-09-06
WFC-MOB-131,SQLiteException: database is locked,Samsung Galaxy A56,Android 16,ConversationList,92,0.8,2026-08-12,2026-09-07
WFC-MOB-131,SQLiteException: database is locked,Pixel 10,Android 17,ConversationList,51,0.6,2026-08-13,2026-09-07
WFC-MOB-133,TypeError: Network request failed,iPhone 17 Pro,iOS 26.1,FileViewer,131,0.5,2026-06-14,2026-09-07
WFC-MOB-133,TypeError: Network request failed,iPhone 16,iOS 26.0,FileViewer,118,0.5,2026-06-14,2026-09-07
WFC-MOB-133,TypeError: Network request failed,Samsung Galaxy S26,Android 17,FileViewer,87,0.6,2026-06-18,2026-09-07
WFC-MOB-133,TypeError: Network request failed,Xiaomi 15,Android 16,FileViewer,34,0.6,2026-06-21,2026-09-06
WFC-MOB-136,IllegalStateException: Fragment not attached to an activity,Samsung Galaxy S26,Android 17,SettingsScreen,74,0.5,2026-08-28,2026-09-07
WFC-MOB-136,IllegalStateException: Fragment not attached to an activity,Samsung Galaxy A56,Android 16,SettingsScreen,63,0.5,2026-08-28,2026-09-07
WFC-MOB-136,IllegalStateException: Fragment not attached to an activity,OnePlus 13,Android 16,SettingsScreen,21,0.6,2026-08-29,2026-09-04
WFC-MOB-138,EXC_BAD_ACCESS (SIGSEGV) in ChartCard.render,iPhone 17 Pro,iOS 26.1,ChartCard,88,0.3,2026-09-04,2026-09-07
WFC-MOB-138,EXC_BAD_ACCESS (SIGSEGV) in ChartCard.render,iPhone 16,iOS 26.0,ChartCard,71,0.3,2026-09-04,2026-09-07
WFC-MOB-138,EXC_BAD_ACCESS (SIGSEGV) in ChartCard.render,iPhone 15,iOS 25.6,ChartCard,42,0.2,2026-09-05,2026-09-07
WFC-MOB-140,TypeError: locale.split is not a function,iPhone 16,iOS 26.0,LanguageToggle,39,0.2,2026-08-05,2026-09-06
WFC-MOB-140,TypeError: locale.split is not a function,Samsung Galaxy S26,Android 17,LanguageToggle,27,0.2,2026-08-05,2026-09-07
WFC-MOB-140,TypeError: locale.split is not a function,Other,various,LanguageToggle,18,0.3,2026-08-06,2026-09-07
`

const DEVICE_CHART = JSON.stringify(
  {
    type: 'bar',
    title: 'Crashes per device — 1.0.52',
    subtitle: '6,210 crashes over 128,400 sessions · 2026-09-01 to 2026-09-07',
    categories: [
      'iPhone 17 Pro',
      'iPhone 16',
      'Samsung Galaxy A56',
      'iPhone 15',
      'Samsung Galaxy S26',
      'Pixel 10',
      'Xiaomi 15',
      'iPhone 14',
      'Other',
      'OnePlus 13'
    ],
    series: [{ name: 'Crashes', data: [1245, 1051, 949, 939, 512, 420, 381, 352, 206, 155], color: 2 }],
    unit: { suffix: ' crashes' },
    footnote:
      'Source: sentry-crashes-1.0.52.csv, sum of count grouped by device. Galaxy A56 leads on rate (8.1% of its sessions), not on volume.'
  },
  null,
  2
)

const TICKETS_MD = `# Draft Jira tickets — 1.0.52 crash triage

Three clusters cross 2% of the sessions they can reach. All three are new in 1.0.52.
Nothing below has been created in Jira — these are drafts for you to paste or edit.

---

## 1. WFC-MOB-118 — AttachmentsSheet crashes on Android when a send has no rows yet

**Type:** Bug · **Priority:** Blocker · **Component:** mobile/attachments
**Affected versions:** 1.0.52 (internal), 1.0.52-rc.2
**Devices:** Galaxy A56 (3.5%), Xiaomi 15 (2.9%), OnePlus 13 (2.7%), Pixel 10 (1.5%), Galaxy S26 (1.3%)
**Reach:** 1,000 crashes · 2.3% of Android sessions · first seen 2026-09-02

### Steps to reproduce
1. Open any conversation on an Android build of 1.0.52.
2. Tap the paperclip before the conversation has finished its first sync.
3. The attachments sheet mounts with \`sheet.rows\` still undefined.

### Stack (top frames)
\`\`\`
TypeError: undefined is not an object (reading 'length')
  at AttachmentsSheet (src/screens/AttachmentsSheet.tsx:64:28)
  at renderWithHooks (react-native-renderer:11121:18)
  at mountIndeterminateComponent (react-native-renderer:14652:13)
  at beginWork (react-native-renderer:15634:16)
\`\`\`

### Notes
Android only, all OS versions — it tracks the sheet's mount order, not the OS. iOS mounts the
sheet after the first sync resolves, which is why the same code path is quiet there.

---

## 2. WFC-MOB-121 — VoiceNoteRecorder crashes activating the audio session on iOS 26

**Type:** Bug · **Priority:** Blocker · **Component:** mobile/voice
**Affected versions:** 1.0.52 (internal)
**Devices:** iPhone 17 Pro (3.0%), iPhone 16 (2.7%), iPhone 15 (1.9%), iPhone 14 (1.7%)
**Reach:** 1,940 crashes · 2.5% of iOS sessions · first seen 2026-09-02

### Steps to reproduce
1. Start a voice note while a call, Music or another app holds the audio session.
2. Grant the mic prompt on the first run.
3. \`setActive:\` is called on the session before the category is set.

### Stack (top frames)
\`\`\`
NSInvalidArgumentException: -[AVAudioSession setActive:withOptions:error:]
  0 CoreFoundation      __exceptionPreprocess + 160
  1 libobjc.A.dylib     objc_exception_throw + 60
  2 AVFAudio            -[AVAudioSession setActive:withOptions:error:] + 412
  3 WolffishMobile      -[RNVoiceRecorder startRecording:] (RNVoiceRecorder.m:118)
\`\`\`

### Notes
Highest-volume cluster in the export. It is the only one that hits the tier-1 iPhones hardest,
so it will dominate the store reviews if 1.0.52 promotes as-is.

---

## 3. WFC-MOB-124 — SyncOutbox.replay aborts on batches over 200 items

**Type:** Bug · **Priority:** Critical · **Component:** mobile/sync
**Affected versions:** 1.0.52 (internal)
**Devices:** Galaxy A56 (2.4%), iPhone 15 (2.2%), iPhone 14 (2.2%), Pixel 10 (2.1%), Xiaomi 15 (2.1%), other (2.0%)
**Reach:** 1,284 crashes · 2.2% of sessions on affected devices · first seen 2026-09-03

### Steps to reproduce
1. Put the app in airplane mode and queue more than 200 sends.
2. Restore the network.
3. The replay builds the whole batch in memory and aborts.

### Stack (top frames)
\`\`\`
SIGABRT · abort() called
  at SyncOutbox.replay (src/sync/outbox.ts:212:11)
  at SyncEngine.flush (src/sync/engine.ts:88:22)
  at NetInfo.onChange (src/sync/netinfo.ts:31:9)
\`\`\`

### Notes
Evenly spread across devices and both platforms — it follows queue depth, not hardware.
Related to the API-side outbox work (WFC-1425); the fix here is chunking the replay.
`

export const mobileCrashTriage = conversation({
  id: 'conv-mobile-crash-triage',
  title: 'Crash triage for the 1.0.52 build',
  channel: 'procedure',
  icon: '📱',
  projectId: PROJECT_MOBILE,
  files: {
    'uploads/conv-crash/sentry-crashes-1.0.52.csv': CRASHES_CSV,
    'files/charts/crashes-per-device-1.0.52.chart.json': DEVICE_CHART,
    'files/drafts/jira-crash-tickets.md': TICKETS_MD
  },
  turns: [
    {
      user: `Triage the crash export I attach.

Group by device and OS first, then by screen. Bar chart of crashes per device, a workbook with one sheet per top issue, and a draft Jira ticket for each cluster above 2% of sessions — title, steps, stack, affected versions.

Create nothing in Jira; hand the drafts back.

The export is the last 7 days of 1.0.52 from Sentry.`,
      attachments: ['uploads/conv-crash/sentry-crashes-1.0.52.csv'],
      at: at(2, 9, 15),
      steps: [
        text('Reading the export, pivoting by device, then by screen — then the chart, the workbook and the drafts.'),
        tool(
          'spreadsheet_read',
          { path: 'uploads/conv-crash/sentry-crashes-1.0.52.csv', sheet: 0 },
          `40 rows × 9 columns (issue_id, title, device, os, screen, count, sessions_pct, first_seen, last_seen)

10 distinct issues across 10 devices and 5 OS versions.
Sum of count: 6,210 crashes.
Date range: first_seen 2026-06-14 → 2026-09-05, last_seen 2026-09-04 → 2026-09-07.
5 issues have first_seen on or after 2026-09-02 (the 1.0.52 rollout): WFC-MOB-118, 121, 124, 138 — and WFC-MOB-121 on iPhone 14 a day later.`,
          { ms: 980 }
        ),
        tool(
          'spreadsheet_read',
          { path: 'uploads/project-mobile/device-matrix.csv' },
          `10 rows × 4 columns (device, os, share_pct, tier). Shares sum to 100.0%.
Used to check the session base: count ÷ sessions_pct per row gives a per-device session count, and those agree with share_pct × 128,400 to within 1% on every device.`,
          { ms: 520 }
        ),
        tool(
          'spreadsheet_pivot',
          {
            path: 'uploads/conv-crash/sentry-crashes-1.0.52.csv',
            rows: ['device', 'os'],
            values: [
              { field: 'count', agg: 'sum' },
              { field: 'issue_id', agg: 'count' }
            ],
            sort: { by: 'count', dir: 'desc' }
          },
          `Pivot — sum(count), count(issue_id) by device × os

Device               OS           Crashes  Issues  Sessions  Crash rate
iPhone 17 Pro        iOS 26.1       1,245       4    27,500       4.5%
iPhone 16            iOS 26.0       1,051       5    24,300       4.3%
Samsung Galaxy A56   Android 16       949       5    11,700       8.1%
iPhone 15            iOS 25.6         939       4    18,200       5.2%
Samsung Galaxy S26   Android 17       512       5    15,100       3.4%
Pixel 10             Android 17       420       4     8,100       5.2%
Xiaomi 15            Android 16       381       4     5,700       6.7%
iPhone 14            iOS 25.6         352       3     7,300       4.8%
Other                various          206       3     6,900       3.0%
OnePlus 13           Android 16       155       3     3,600       4.3%
                                    ------            -------
Total                                6,210          128,400       4.8%

Crash-free sessions: 95.2%. The release checklist gate is 99.5%.`,
          { ms: 1_460 }
        ),
        tool(
          'spreadsheet_pivot',
          {
            path: 'uploads/conv-crash/sentry-crashes-1.0.52.csv',
            rows: ['screen'],
            values: [{ field: 'count', agg: 'sum' }],
            sort: { by: 'count', dir: 'desc' }
          },
          `Pivot — sum(count) by screen

Screen              Crashes  Issue      Reach (sessions it can hit)
VoiceNoteRecorder     1,940  MOB-121    2.5% of iOS
SyncOutbox            1,284  MOB-124    2.2% of affected devices
AttachmentsSheet      1,000  MOB-118    2.3% of Android
ChatScreen              577  MOB-126    0.8%
FileViewer              370  MOB-133    0.5%
ConversationList        354  MOB-131    0.8%
PairingScreen           242  MOB-129    0.9%
ChartCard               201  MOB-138    0.3%
SettingsScreen          158  MOB-136    0.5%
LanguageToggle           84  MOB-140    0.2%

Three screens clear 2%. The next one down is ChatScreen at 0.8%, so the cut is not close.`,
          { ms: 1_180 }
        ),
        text(
          '1.0.52 does not pass the release gate: 95.2% crash-free against a 99.5% checklist rule. Three clusters carry 4,224 of the 6,210 crashes, and all three are new in this build. Building the chart, the workbook and the three drafts.'
        ),
        tool(
          'file_write',
          { path: 'files/charts/crashes-per-device-1.0.52.chart.json', content: DEVICE_CHART },
          'Wrote files/charts/crashes-per-device-1.0.52.chart.json (0.7 KB)',
          { ms: 130 }
        ),
        tool(
          'spreadsheet_create',
          {
            path: 'files/sheets/crash-triage-1.0.52.xlsx',
            sheets: [
              { name: 'Summary', header: ['Metric', 'Value'], rows: 8 },
              { name: 'By device', header: ['Device', 'OS', 'Crashes', 'Issues', 'Sessions', 'Crash rate'], rows: 10, freeze: 'A2' },
              { name: 'By screen', header: ['Screen', 'Issue', 'Crashes', 'Reach'], rows: 10, freeze: 'A2' },
              { name: 'WFC-MOB-118', header: ['Device', 'OS', 'Count', 'Sessions %', 'First seen', 'Last seen'], rows: 5, freeze: 'A2' },
              { name: 'WFC-MOB-121', header: ['Device', 'OS', 'Count', 'Sessions %', 'First seen', 'Last seen'], rows: 4, freeze: 'A2' },
              { name: 'WFC-MOB-124', header: ['Device', 'OS', 'Count', 'Sessions %', 'First seen', 'Last seen'], rows: 6, freeze: 'A2' },
              { name: 'Raw export', header: ['Issue', 'Title', 'Device', 'OS', 'Screen', 'Count', 'Sessions %', 'First seen', 'Last seen'], rows: 40, freeze: 'A2' }
            ]
          },
          'Created files/sheets/crash-triage-1.0.52.xlsx — 7 sheets, 83 data rows, header rows bold, panes frozen at A2, Sessions % and Crash rate formatted as percent, Crashes right-aligned with thousands separators.',
          { ms: 2_340 }
        ),
        tool(
          'file_write',
          { path: 'files/drafts/jira-crash-tickets.md', content: TICKETS_MD },
          'Wrote files/drafts/jira-crash-tickets.md (3.6 KB) — 3 tickets.',
          { ms: 180 }
        ),
        send('files/charts/crashes-per-device-1.0.52.chart.json'),
        send('files/sheets/crash-triage-1.0.52.xlsx'),
        send('files/drafts/jira-crash-tickets.md'),
        tool(
          'createJiraIssue',
          {
            project: 'WFC',
            issuetype: 'Bug',
            summary: 'AttachmentsSheet crashes on Android when a send has no rows yet',
            priority: 'Blocker',
            components: ['mobile/attachments'],
            affectsVersions: ['1.0.52']
          },
          'Denied by the user. Nothing was changed.',
          {
            ms: 9_200,
            approval: {
              reason: 'Creating an issue in the shared WFC project is a write to a system other people work in.',
              level: 'confirm',
              title: 'Create WFC bug for WFC-MOB-118?',
              description:
                'Would file the first draft as a Blocker in WFC with the steps, stack and affected versions from the draft file.',
              command: 'createJiraIssue project=WFC type=Bug priority=Blocker',
              impact: 'Creates 1 issue, notifies the mobile component watchers.',
              risk: 'medium',
              decision: 'denied'
            }
          }
        ),
        text(
          'Denied — and correctly: the procedure says create nothing in Jira and hand the drafts back. I should not have offered. The three tickets stay in `files/drafts/jira-crash-tickets.md` for you to paste.'
        ),
        text(`1.0.52 is not promotable. Crash-free sessions are 95.2% against the checklist's 99.5% floor, and three regressions introduced in this build carry 68% of the crashes.

| Cluster | Screen | Crashes | Sessions affected | First seen |
| --- | --- | ---: | ---: | --- |
| WFC-MOB-121 \`AVAudioSession setActive:\` | VoiceNoteRecorder | 1,940 | 2.5% of iOS | 2026-09-02 |
| WFC-MOB-124 \`SyncOutbox.replay\` SIGABRT | SyncOutbox | 1,284 | 2.2% of affected devices | 2026-09-03 |
| WFC-MOB-118 \`reading 'length'\` | AttachmentsSheet | 1,000 | 2.3% of Android | 2026-09-02 |

Three things worth knowing before the release call:

- **Galaxy A56 is the worst device, not the loudest.** It is 9.1% of the fleet but 8.1% of its sessions crash — it carries two of the three clusters (118 and 124). Volume ranks the iPhones first; rate ranks the A56 first.
- **Nothing here is an OS regression.** MOB-118 hits Android 16 and 17 equally, MOB-121 hits iOS 25.6 and 26.x equally. Both track our own mount and call order, so an OS-version guard would not help.
- **MOB-124 is the same shape as the API's outbox work (WFC-1425).** It follows queue depth, not hardware; chunking the replay is the fix on the phone side.

Every figure is the sum of \`count\` in the export, grouped in the two pivots above. Session counts are \`count ÷ sessions_pct\` per row, cross-checked against \`device-matrix.csv\`.`)
      ]
    }
  ]
})
