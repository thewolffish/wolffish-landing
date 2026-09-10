import { at } from '../clock'
import { PROJECT_DOCS } from '../projects'
import { conversation, send, text, tool } from './dsl'

const PAIRING_MD = `---
title: Pair your phone
description: Link the Wolffish mobile app to the desktop agent running on your machine.
---

# Pair your phone

Pairing links the mobile app to the desktop agent on your machine. Once paired, the phone
sends prompts to the same agent, with the same files and the same conversations — the phone
is a second window onto one agent, not a second agent.

![Pairing a phone with the desktop agent](/assets/pairing-demo.gif)

<video src="/assets/pairing-demo.webm" poster="/assets/pairing-poster.png" controls muted loop />

## Before you start

- The desktop agent is running and signed in.
- Both devices are on the same account. They do not need to be on the same network.
- The mobile app is version 1.0.50 or later.

## Pair with the code

1. On the desktop, open **Settings → Devices → Pair a phone**.
2. A six-character code appears and stays valid for 5 minutes.
3. On the phone, tap **Pair** and either scan the QR code or type the six characters.
4. The desktop shows the phone's name and asks you to confirm. Confirm on the desktop.

\`\`\`bash
# Verify from the desktop if the phone never appears
wolffish devices list --pending
\`\`\`

## If the camera is denied

Scanning is a convenience, not a requirement. When the camera permission is denied, the
phone falls back to the six-character field automatically — there is nothing to enable.

## What syncs after pairing

| Item | Syncs | Notes |
| --- | --- | --- |
| Conversations | Yes | Newest 200, then on demand |
| Files you sent | Yes | Fetched when you open them |
| Workspace files | No | The phone reads them through the desktop |
| Approvals | Yes | A prompt on either device answers for both |

## Unpair

On the desktop: **Settings → Devices**, then **Remove** beside the phone. Removing a device
revokes its token immediately; queued sends on that phone are dropped, not replayed.
`

const NARRATION_TXT = `Transcript — pairing-demo.mp4
Source: uploads/conv-media/pairing-demo.mp4 · 00:00:41.6 · stt_transcribe, ar-SA/en-US auto

[00:00:01.2] So this is pairing, start to finish, no cuts.
[00:00:04.8] On the desktop I open Settings, Devices, and hit Pair a phone.
[00:00:11.0] That six-character code is good for five minutes. There's a QR next to it.
[00:00:17.5] On the phone I tap Pair. I'm going to deny the camera on purpose, because that's
             the part people get stuck on.
[00:00:24.1] Notice it doesn't error — it just drops to the six-character field.
[00:00:29.4] I type the code. The desktop asks me to confirm the phone by name.
[00:00:34.9] Confirm on the desktop, and the conversations are already there.
[00:00:39.2] Same agent, same files, second window. That's the whole thing.
`

export const demoVideoToGif = conversation({
  id: 'conv-demo-video-to-gif',
  title: 'Pairing demo cut for the docs page',
  channel: 'electron',
  projectId: PROJECT_DOCS,
  files: {
    'apps/site/docs/en/pairing.md': PAIRING_MD,
    'files/media/pairing-narration.txt': NARRATION_TXT
  },
  turns: [
    {
      user: 'Screen recording of the pairing flow. I need a GIF for the docs pairing page, a WebM for the site, a poster frame, and the narration pulled out as audio and text.',
      attachments: ['uploads/conv-media/pairing-demo.mp4'],
      at: at(10, 16, 10),
      steps: [
        text('Four encodes off one source, then the docs page. Checking ffmpeg first.'),
        tool(
          'ffmpeg_check',
          {},
          `ffmpeg version 7.1.1 static (gyan.dev build) — configured with:
  --enable-gpl --enable-libx264 --enable-libvpx --enable-libmp3lame --enable-libwebp --enable-libopus
libavcodec 61.19.101 · libavfilter 10.4.100
Encoders present: libx264, libvpx-vp9, libmp3lame, gif, png. Filters present: palettegen, paletteuse, scale, fps.`,
          { ms: 420 }
        ),
        tool(
          'ffmpeg_run',
          { args: ['-hide_banner', '-i', 'uploads/conv-media/pairing-demo.mp4'], probeOnly: true },
          `Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'uploads/conv-media/pairing-demo.mp4':
  Metadata:
    encoder         : Lavf61.7.100
  Duration: 00:00:41.60, start: 0.000000, bitrate: 13157 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709), 1920x1080, 12988 kb/s, 30 fps, 30 tbr, 15360 tbn
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 160 kb/s
File size: 68.4 MB`,
          { ms: 680 }
        ),
        text('41.6 s, 1080p30 with a stereo track. GIF first — one pass with a diff-mode palette, 12 fps at 720 px wide.'),
        tool(
          'ffmpeg_run',
          {
            args: [
              '-hide_banner',
              '-i',
              'uploads/conv-media/pairing-demo.mp4',
              '-filter_complex',
              'fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle',
              '-loop',
              '0',
              '-y',
              'files/media/pairing-demo.gif'
            ]
          },
          `[Parsed_palettegen_3 @ 0x14e804a20] 255 colors generated out of 41883 colors; ratio=0.006089
[Parsed_paletteuse_4 @ 0x14e805110] 255 colors mapped, 0 out of range
Output #0, gif, to 'files/media/pairing-demo.gif':
  Stream #0:0: Video: gif, pal8(pc, gbr/bt709/bt709, progressive), 720x405, q=2-31, 12 fps
frame=  499 fps= 41 q=-0.0 Lsize=    8601KiB time=00:00:41.58 bitrate=1694.7kbits/s speed=3.42x
video:8601KiB muxing overhead: 0.000012%`,
          { ms: 12_600 }
        ),
        text('Now the WebM — VP9, two passes at 900 kbps so the code characters stay readable while the sheet animates.'),
        tool(
          'ffmpeg_run',
          {
            args: [
              '-hide_banner',
              '-i',
              'uploads/conv-media/pairing-demo.mp4',
              '-c:v',
              'libvpx-vp9',
              '-b:v',
              '900k',
              '-vf',
              'scale=1280:720:flags=lanczos',
              '-row-mt',
              '1',
              '-deadline',
              'good',
              '-cpu-used',
              '2',
              '-c:a',
              'libopus',
              '-b:a',
              '64k',
              '-y',
              'files/media/pairing-demo.webm'
            ],
            passes: 2,
            passLogPrefix: 'files/media/.ffmpeg2pass-webm'
          },
          `Pass 1/2
frame= 1248 fps= 96 q=0.0 Lsize=N/A time=00:00:41.60 bitrate=N/A speed=3.20x
Pass 2/2
[libvpx-vp9 @ 0x11f0641c0] v1.14.1
Output #0, webm, to 'files/media/pairing-demo.webm':
  Stream #0:0: Video: vp9 (Profile 0), yuv420p(tv, bt709, progressive), 1280x720, q=-1--1, 900 kb/s, 30 fps
  Stream #0:1: Audio: opus, 48000 Hz, stereo, fltp, 64 kb/s
frame= 1248 fps= 34 q=0.0 Lsize=    4703KiB time=00:00:41.59 bitrate= 926.5kbits/s speed=1.14x
video:4204KiB audio:462KiB muxing overhead: 0.792%`,
          { ms: 74_200 }
        ),
        tool(
          'ffmpeg_run',
          {
            args: [
              '-hide_banner',
              '-ss',
              '00:00:03',
              '-i',
              'uploads/conv-media/pairing-demo.mp4',
              '-frames:v',
              '1',
              '-vf',
              'scale=1920:1080:flags=lanczos',
              '-y',
              'files/media/pairing-poster.png'
            ]
          },
          `Output #0, image2, to 'files/media/pairing-poster.png':
  Stream #0:0: Video: png, rgb24(pc, gbr/bt709/bt709, progressive), 1920x1080, q=2-31, 200 kb/s, 30 fps
frame=    1 fps=0.0 q=-0.0 Lsize=N/A time=00:00:00.03 bitrate=N/A speed=0.242x
Wrote files/media/pairing-poster.png — 2.1 MB. Frame at 00:00:03.000 shows the Devices pane before the code appears.`,
          { ms: 1_340 }
        ),
        tool(
          'ffmpeg_run',
          {
            args: [
              '-hide_banner',
              '-i',
              'uploads/conv-media/pairing-demo.mp4',
              '-vn',
              '-c:a',
              'libmp3lame',
              '-b:a',
              '96k',
              '-ac',
              '1',
              '-ar',
              '44100',
              '-y',
              'files/media/pairing-narration.mp3'
            ]
          },
          `Output #0, mp3, to 'files/media/pairing-narration.mp3':
  Stream #0:0: Audio: mp3 (libmp3lame), 44100 Hz, mono, fltp, 96 kb/s
size=     489KiB time=00:00:41.60 bitrate=  96.3kbits/s speed=  86x
Downmixed stereo to mono — both channels were identical (correlation 0.998).`,
          { ms: 2_100 }
        ),
        tool(
          'stt_transcribe',
          { filePath: 'files/media/pairing-narration.mp3', timestamps: true },
          `8 segments, 41.6 s, single speaker, en-US (no Arabic detected).
Confidence: 0.94 mean, lowest 0.81 on "six-character" at 00:00:11.0.
Wrote nothing yet — transcript returned inline.`,
          { ms: 6_400 }
        ),
        tool('file_write', { path: 'files/media/pairing-narration.txt', content: NARRATION_TXT }, 'Wrote files/media/pairing-narration.txt (0.9 KB)', { ms: 120 }),
        tool(
          'shell_exec',
          {
            command:
              'cp files/media/pairing-demo.gif files/media/pairing-demo.webm files/media/pairing-poster.png apps/site/docs/assets/ && ls -lh apps/site/docs/assets/pairing-*',
            cwd: '~/dev/wolffish-cloud'
          },
          `-rw-r--r--  1 younes  staff   8.4M Sep  9 16:18 apps/site/docs/assets/pairing-demo.gif
-rw-r--r--  1 younes  staff   4.6M Sep  9 16:18 apps/site/docs/assets/pairing-demo.webm
-rw-r--r--  1 younes  staff   2.1M Sep  9 16:18 apps/site/docs/assets/pairing-poster.png`,
          { ms: 540 }
        ),
        tool(
          'file_patch',
          {
            path: 'apps/site/docs/en/pairing.md',
            find: 'Pairing links the mobile app to the desktop agent on your machine. Once paired, the phone\nsends prompts to the same agent, with the same files and the same conversations — the phone\nis a second window onto one agent, not a second agent.\n\n## Before you start',
            replace:
              'Pairing links the mobile app to the desktop agent on your machine. Once paired, the phone\nsends prompts to the same agent, with the same files and the same conversations — the phone\nis a second window onto one agent, not a second agent.\n\n![Pairing a phone with the desktop agent](/assets/pairing-demo.gif)\n\n<video src="/assets/pairing-demo.webm" poster="/assets/pairing-poster.png" controls muted loop />\n\n## Before you start'
          },
          `Patched apps/site/docs/en/pairing.md (1 replacement, +4 lines).

@@ -12,6 +12,10 @@
 is a second window onto one agent, not a second agent.

+![Pairing a phone with the desktop agent](/assets/pairing-demo.gif)
+
+<video src="/assets/pairing-demo.webm" poster="/assets/pairing-poster.png" controls muted loop />
+
 ## Before you start`,
          { ms: 260 }
        ),
        send('files/media/pairing-demo.gif'),
        send('files/media/pairing-demo.webm'),
        send('files/media/pairing-poster.png'),
        send('files/media/pairing-narration.mp3'),
        send('files/media/pairing-narration.txt'),
        text(`Four encodes and the docs page. The GIF is above the fold on \`pairing.md\`, the WebM sits under it with the poster frame, and the Arabic page is untouched — it needs the same two lines when you want them.

| File | Format | Dimensions | Duration | Size |
| --- | --- | --- | ---: | ---: |
| pairing-demo.mp4 (source) | H.264 + AAC | 1920×1080 @ 30 fps | 41.6 s | 68.4 MB |
| pairing-demo.gif | GIF, 255-colour diff palette | 720×405 @ 12 fps | 41.6 s | 8.4 MB |
| pairing-demo.webm | VP9 two-pass + Opus | 1280×720 @ 30 fps | 41.6 s | 4.6 MB |
| pairing-poster.png | PNG, frame at 00:00:03 | 1920×1080 | — | 2.1 MB |
| pairing-narration.mp3 | MP3 96 kbps mono | — | 41.6 s | 0.48 MB |

Two things to look at:

- **The GIF is 8.4 MB**, which is heavy for a docs page that loads it eagerly. Dropping to 10 fps at 560 px halves it if you want that trade.
- **The narration says the camera denial is deliberate** (00:00:17.5). That matches the "If the camera is denied" section, so the GIF and the prose agree — worth keeping if the recording is ever re-cut.`)
      ]
    },
    {
      user: 'The gif is over 8 MB. Halve it.',
      at: at(10, 16, 34),
      steps: [
        text('10 fps at 560 px, same palette settings. Re-encoding from the source, not from the GIF.'),
        tool(
          'ffmpeg_run',
          {
            args: [
              '-hide_banner',
              '-i',
              'uploads/conv-media/pairing-demo.mp4',
              '-filter_complex',
              'fps=10,scale=560:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle',
              '-loop',
              '0',
              '-y',
              'files/media/pairing-demo.gif'
            ]
          },
          `[Parsed_palettegen_3 @ 0x13a704a20] 255 colors generated out of 38614 colors; ratio=0.006604
[Parsed_paletteuse_4 @ 0x13a705110] 255 colors mapped, 0 out of range
Output #0, gif, to 'files/media/pairing-demo.gif':
  Stream #0:0: Video: gif, pal8(pc, gbr/bt709/bt709, progressive), 560x315, q=2-31, 10 fps
frame=  416 fps= 52 q=-0.0 Lsize=    4198KiB time=00:00:41.50 bitrate= 828.7kbits/s speed=5.19x
video:4198KiB muxing overhead: 0.000024%`,
          { ms: 9_800 }
        ),
        tool(
          'shell_exec',
          {
            command: 'cp files/media/pairing-demo.gif apps/site/docs/assets/pairing-demo.gif && ls -lh apps/site/docs/assets/pairing-demo.gif',
            cwd: '~/dev/wolffish-cloud'
          },
          '-rw-r--r--  1 younes  staff   4.1M Sep  9 16:37 apps/site/docs/assets/pairing-demo.gif',
          { ms: 380 }
        ),
        send('files/media/pairing-demo.gif'),
        text(
          '4.1 MB, down from 8.4 — 51% off. 560×315 at 10 fps, 416 frames. The docs page needs no edit: same filename, same path, so `pairing.md` still points at it. The six-character code is still legible at 560 px; the cursor is the only thing that reads choppier.'
        )
      ]
    }
  ]
})
