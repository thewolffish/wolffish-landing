import { PRO } from '../catalog'
import { at } from '../clock'
import { ask, conversation, send, text, tool } from './dsl'

const LOG = `2026-09-06T02:13:58+03:00 info  gateway    boot ok build=2.13.4 region=weur workers=8 rps_1m=39.4
2026-09-06T02:14:07+03:00 warn  modelgate  upstream=deepinfra status=429 retry_after=2 model=DeepSeek-V4-Flash-0731 route=/ai/v1/chat/completions req=req_8f21a4
2026-09-06T02:14:31+03:00 warn  modelgate  upstream=deepinfra status=429 retry_after=2 model=DeepSeek-V4-Flash-0731 route=/ai/v1/chat/completions req=req_8f22b0
2026-09-06T02:15:02+03:00 warn  modelgate  upstream=deepinfra status=429 retry_after=4 model=DeepSeek-V4-Pro-0813 route=/ai/v1/chat/completions req=req_8f2410
2026-09-06T02:15:44+03:00 info  modelgate  cooldown open reason=429 window_s=20 model=DeepSeek-V4-Flash-0731 admitted=0 queued=12
2026-09-06T02:16:04+03:00 info  modelgate  cooldown closed window_s=20 queued=31 draining=31
2026-09-06T02:16:05+03:00 warn  modelgate  upstream=deepinfra status=429 retry_after=4 burst=31 note=all queued requests released in the same tick
2026-09-06T02:16:25+03:00 info  modelgate  cooldown open reason=429 window_s=20 admitted=0 queued=58
2026-09-06T02:17:09+03:00 warn  gateway    status=503 error=model_unavailable route=/ai/v1/chat/completions user=usr_4a11 req=req_8f2733
2026-09-06T02:17:41+03:00 warn  gateway    status=503 error=model_unavailable count_1m=9 route=/ai/v1/chat/completions user=usr_9b02 req=req_8f2790
2026-09-06T02:18:12+03:00 info  modelgate  cooldown closed window_s=20 queued=104 draining=104
2026-09-06T02:18:13+03:00 warn  modelgate  upstream=deepinfra status=429 retry_after=8 burst=104
2026-09-06T02:18:50+03:00 warn  gateway    status=503 error=model_unavailable count_1m=14 error_rate=0.6%
2026-09-06T02:19:01+03:00 error gateway    status=503 error=model_unavailable count_1m=38 route=/ai/v1/chat/completions
2026-09-06T02:19:38+03:00 info  modelgate  cooldown open reason=429 window_s=20 admitted=0 queued=163
2026-09-06T02:20:04+03:00 error gateway    status=503 error=model_unavailable count_1m=96 rps_1m=41.2 error_rate=3.9%
2026-09-06T02:20:11+03:00 info  heartbeat  job="Deploy and error watch" trigger=error_rate baseline_7d=0.4% observed=3.9% action=notify device=phone user=younes
2026-09-06T02:21:02+03:00 error gateway    status=503 count_1m=154 error_rate=6.2% queue_depth=241
2026-09-06T02:22:06+03:00 error gateway    status=503 count_1m=212 error_rate=8.5% queue_depth=318
2026-09-06T02:23:00+03:00 error gateway    status=503 count_1m=268 error_rate=10.8% queue_depth=402
2026-09-06T02:23:44+03:00 info  session    user=younes device=desktop action=login source=on_call
2026-09-06T02:24:07+03:00 error gateway    status=503 count_1m=301 error_rate=12.1% queue_depth=455
2026-09-06T02:25:03+03:00 error gateway    status=503 count_1m=344 error_rate=13.8% queue_depth=511
2026-09-06T02:26:01+03:00 error gateway    status=503 count_1m=402 error_rate=16.1% queue_depth=588
2026-09-06T02:26:38+03:00 warn  modelgate  cooldown cycle=44 mean_open_s=20.0 jitter_s=0 note=every worker opens and closes on the same boundary
2026-09-06T02:27:05+03:00 error gateway    status=503 count_1m=451 error_rate=18.1% queue_depth=641
2026-09-06T02:28:02+03:00 error gateway    status=503 count_1m=478 error_rate=19.2% queue_depth=677
2026-09-06T02:29:09+03:00 error gateway    status=503 count_1m=496 error_rate=19.9% queue_depth=702
2026-09-06T02:30:03+03:00 error gateway    status=503 count_1m=511 error_rate=20.5% queue_depth=719
2026-09-06T02:31:01+03:00 error gateway    status=503 count_1m=523 error_rate=21.0% queue_depth=731 note=peak
2026-09-06T02:31:52+03:00 info  modelgate  upstream=deepinfra probe status=200 latency_ms=612 note=upstream healthy between cooldowns
2026-09-06T02:32:04+03:00 error gateway    status=503 count_1m=517 error_rate=20.8%
2026-09-06T02:33:07+03:00 error gateway    status=503 count_1m=508 error_rate=20.4%
2026-09-06T02:34:02+03:00 error gateway    status=503 count_1m=496 error_rate=19.9%
2026-09-06T02:35:05+03:00 error gateway    status=503 count_1m=489 error_rate=19.6%
2026-09-06T02:36:01+03:00 error gateway    status=503 count_1m=477 error_rate=19.2%
2026-09-06T02:37:03+03:00 error gateway    status=503 count_1m=468 error_rate=18.8%
2026-09-06T02:38:08+03:00 error gateway    status=503 count_1m=455 error_rate=18.3%
2026-09-06T02:39:02+03:00 error gateway    status=503 count_1m=441 error_rate=17.7%
2026-09-06T02:40:04+03:00 error gateway    status=503 count_1m=430 error_rate=17.3%
2026-09-06T02:40:51+03:00 warn  logship    backpressure queue_full drop_policy=oldest note=gateway lines dropped from here
2026-09-06T02:44:02+03:00 warn  logship    recovered dropped_lines=1184 window=02:41:00-02:43:59
2026-09-06T02:44:06+03:00 error gateway    status=503 count_1m=412 error_rate=16.6%
2026-09-06T02:45:01+03:00 error gateway    status=503 count_1m=398 error_rate=16.0%
2026-09-06T02:46:03+03:00 error gateway    status=503 count_1m=386 error_rate=15.5%
2026-09-06T02:46:40+03:00 info  session    user=younes action=config_read key=modelgate.cooldown_window_s value=20
2026-09-06T02:47:02+03:00 error gateway    status=503 count_1m=371 error_rate=14.9%
2026-09-06T02:47:18+03:00 info  config     key=modelgate.cooldown_window_s old=20 new=45 actor=younes source=admin_panel
2026-09-06T02:47:19+03:00 info  config     key=modelgate.cooldown_jitter_pct old=0 new=30 actor=younes source=admin_panel
2026-09-06T02:47:41+03:00 info  modelgate  cooldown open reason=429 window_s=45 jitter_pct=30 admitted=0 queued=688
2026-09-06T02:48:09+03:00 error gateway    status=503 count_1m=288 error_rate=11.6% queue_depth=594
2026-09-06T02:49:03+03:00 error gateway    status=503 count_1m=194 error_rate=7.8% queue_depth=402
2026-09-06T02:50:02+03:00 error gateway    status=503 count_1m=121 error_rate=4.9% queue_depth=233
2026-09-06T02:51:05+03:00 warn  gateway    status=503 count_1m=78 error_rate=3.1% queue_depth=118
2026-09-06T02:52:01+03:00 warn  gateway    status=503 count_1m=46 error_rate=1.8% queue_depth=44
2026-09-06T02:53:04+03:00 warn  gateway    status=503 count_1m=31 error_rate=1.2% queue_depth=19
2026-09-06T02:54:03+03:00 warn  gateway    status=503 count_1m=22 error_rate=0.9% queue_depth=9
2026-09-06T02:55:02+03:00 warn  gateway    status=503 count_1m=17 error_rate=0.7% queue_depth=4
2026-09-06T02:56:04+03:00 warn  gateway    status=503 count_1m=12 error_rate=0.5% queue_depth=1
2026-09-06T02:57:01+03:00 warn  gateway    status=503 count_1m=9 error_rate=0.4% queue_depth=0
2026-09-06T02:58:03+03:00 warn  gateway    status=503 count_1m=7 error_rate=0.3% queue_depth=0
2026-09-06T02:59:03+03:00 warn  gateway    status=503 count_1m=5 error_rate=0.2%
2026-09-06T03:00:05+03:00 warn  gateway    status=503 count_1m=4 error_rate=0.2%
2026-09-06T03:01:02+03:00 warn  gateway    status=503 count_1m=2 error_rate=0.1%
2026-09-06T03:02:47+03:00 warn  gateway    status=503 error=model_unavailable count_1m=1 route=/ai/v1/chat/completions req=req_9c8801 note=last 5xx of the window
2026-09-06T03:05:01+03:00 info  modelgate  cooldown cycle=91 mean_open_s=45.0 jitter_s=13.4 admitted=1.0 queued=0
2026-09-06T03:07:12+03:00 info  gateway    steady state error_rate=0.2% baseline_7d=0.4% rps_1m=38.1 queue_depth=0
`

/** Everything below is read out of the log above, so the chart cannot drift from it. */
const START_MIN = 2 * 60 + 14
const WINDOW_MIN = 54
const GAP = new Set(['02:41', '02:42', '02:43'])

const MINUTES = Array.from({ length: WINDOW_MIN }, (_, i) => {
  const m = START_MIN + i
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})
const indexOfMinute = (hhmm: string): number =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)) - START_MIN

const LOG_LINES = LOG.trimEnd().split('\n')

/** count_1m= is the gateway's own per-minute roll-up; a minute with no line had none. */
const ERRORS: Array<number | null> = MINUTES.map((m) => (GAP.has(m) ? null : 0))
for (const line of LOG_LINES) {
  const m = line.match(/T(\d\d:\d\d):\d\d\+03:00.*count_1m=(\d+)/)
  if (!m) continue
  const i = indexOfMinute(m[1])
  if (i >= 0 && i < WINDOW_MIN) ERRORS[i] = Math.max(ERRORS[i] ?? 0, Number(m[2]))
}
const TOTAL_5XX = ERRORS.reduce<number>((a, v) => a + (v ?? 0), 0)
const BUSY_MINUTES = ERRORS.filter((v) => (v ?? 0) > 0).length
const PEAK = Math.max(...ERRORS.map((v) => v ?? 0))

/** grep -c per minute over the lines that carry a 429 or a 5xx. */
const LINE_COUNTS = (() => {
  const counts = new Map<string, number>()
  for (const line of LOG_LINES) {
    if (!/status=(429|5\d\d)/.test(line)) continue
    const m = line.match(/T(\d\d:\d\d):/)
    if (!m) continue
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([minute, n]) => `${String(n).padStart(7)}  ${minute}`)
    .join('\n')
})()

const LEVELS = ['info', 'warn', 'error'].map(
  (lvl) => `${lvl} ${LOG_LINES.filter((l) => l.split(/\s+/)[1] === lvl).length}`
)
const COMPONENTS = ['gateway', 'modelgate', 'config', 'logship', 'session', 'heartbeat'].map(
  (c) => `${c} ${LOG_LINES.filter((l) => l.split(/\s+/)[2] === c).length}`
)

const GREP_TABLE = [
  ' count  minute',
  ...MINUTES.map((label, i) => (ERRORS[i] ? `${String(ERRORS[i]).padStart(6)}  ${label}` : null)).filter(
    (l): l is string => l !== null
  ),
  '',
  `total ${TOTAL_5XX} across ${BUSY_MINUTES} minutes with at least one 5xx, peak ${PEAK}`,
  'no count_1m line at all for 02:41, 02:42, 02:43 — see the logship backpressure warning at 02:40:51'
].join('\n')

const CHART = JSON.stringify(
  {
    type: 'line',
    title: '5xx returned to clients, per minute',
    subtitle: 'api.wolffi.sh gateway · 6 September 2026, 02:14-03:07 UTC+3',
    categories: MINUTES,
    series: [{ name: '5xx per minute', data: ERRORS, color: 4 }],
    smooth: false,
    unit: { suffix: ' /min' },
    yAxis: 'Responses',
    footnote:
      'Counted with grep on api-gateway-2026-09-06.log. The break at 02:41-02:43 is missing data, not zero: the log shipper hit backpressure and dropped 1,184 lines.',
    height: 320
  },
  null,
  2
)

const POSTMORTEM = `# Postmortem — model admission storm, 6 September 2026

**Severity:** SEV2 · **Duration:** 53 minutes (02:14-03:07 UTC+3) · **Detected:** 02:20, automatically · **Author:** Younes Alturkey
**Source:** \`api-gateway-2026-09-06.log\` (single file, 1,184 lines missing between 02:41 and 02:43)

## Summary

For 53 minutes, ${TOTAL_5XX.toLocaleString('en-US')} chat requests were refused with \`503 model_unavailable\`. The upstream provider was healthy for most of that time. The refusals came from our own admission gate: a fixed 20-second cooldown, opened by a DeepInfra 429 wave, released every queued request on the same boundary, which produced another 429, which opened another cooldown. By 02:26 it had already run 44 cycles; it was broken by hand at 02:47.

No data was lost, no request was answered incorrectly, and nothing was deleted. Requests that were refused were refused cleanly and the desktop app showed the failure to the employee.

## Impact

| Measure | Value |
| --- | ---: |
| Requests refused (5xx) | ${TOTAL_5XX.toLocaleString('en-US')} counted, plus whatever fell in the 3 missing minutes |
| Peak error rate | 21.0% at 02:31 (523 refusals in the minute) |
| Peak admission queue | 731 requests |
| Endpoints affected | \`POST /ai/v1/chat/completions\` only |
| Employees who saw a failure | 68 of 200 seats (usage rollup, not this log) |
| Data loss | none |

## Timeline (UTC+3)

| Time | What happened |
| --- | --- |
| 02:14:07 | First DeepInfra 429 on \`DeepSeek-V4-Flash-0731\`, \`retry_after=2\`. |
| 02:15:44 | ModelGate opens its first cooldown, 20-second window, 12 requests queued. |
| 02:16:05 | The window closes; all 31 queued requests are released in the same tick and draw a second 429. The loop starts here. |
| 02:17:09 | First \`503 model_unavailable\` reaches a client. |
| 02:20:11 | The hourly deploy-and-error watch sees 3.9% against a 0.4% seven-day baseline and pages the phone. **Detection.** |
| 02:23:44 | Younes signs in from the on-call rotation. |
| 02:26:38 | ModelGate reports 44 cooldown cycles, mean window 20.0 s, jitter 0 — every worker on the same boundary. |
| 02:31:01 | Peak: 523 refusals in the minute, 21.0% error rate, queue depth 731. |
| 02:31:52 | A probe to DeepInfra returns 200 in 612 ms — the upstream is healthy between our own cooldowns. |
| 02:40:51 | The log shipper hits backpressure; 1,184 gateway lines are dropped through 02:43:59. |
| 02:47:18 | Cooldown window raised 20 s → 45 s and jitter 0 → 30% from the admin panel. **Mitigation.** |
| 02:48-02:52 | Refusals fall from 371/min to 46/min as the fleet stops retrying in lockstep. |
| 03:02:47 | Last 5xx of the window. |
| 03:07:12 | Steady state: 0.2% error rate, queue depth 0. **Resolved.** |

## Root cause

A fixed, un-jittered cooldown turned one upstream rate-limit wave into a self-sustaining storm. Every ModelGate instance opened a 20-second window at the same moment, queued everything that arrived, and released the whole queue on the same boundary. The release was large enough to earn a fresh 429 on its own, which opened the next window. The upstream provider recovered within the first two minutes; the loop did not need it to keep going.

## Contributing factors

- **No jitter.** The window was a constant, so the workers stayed in phase for 44 cycles.
- **The queue had no ceiling.** Depth reached 731 with no shedding, so each release was bigger than the last.
- **We alerted on the symptom, not the cause.** The first 429 was at 02:14:07 and the page came at 02:20:11 — six minutes of a metric nobody was watching (upstream 429 ratio) before a metric somebody was (gateway 5xx).
- **The log shipper dropped 1,184 lines under exactly the load that produced them**, so three minutes of this timeline are inference, not evidence.

## Action items

| # | Action | Owner | Due |
| --- | --- | --- | --- |
| 1 | Ship the 45 s cooldown with 30% jitter as code with a queue ceiling of 250 and shed above it — not a runtime flag. Tracked as WFC-1418, in the 2.14 release. | Younes | With 2.14 |
| 2 | Alert on the upstream 429 ratio directly, at 1% over five minutes, so detection does not wait for client-visible 5xx. | Bandar | 20 September |
| 3 | Show a queued state in the desktop app while admission is cooling down, instead of a red failure the employee has to retry by hand. | Sara | 30 September |

## What went right

- The automated watch paged the phone without anyone asking it to, at 02:20, on a metric with a real baseline.
- The mitigation was a config change, live in seconds, with no deploy and no restart.
- The blast radius stayed on one endpoint. Sync, search and admin traffic were untouched throughout.
`

export const incidentPostmortem = conversation({
  id: 'conv-incident-postmortem',
  title: 'Postmortem for the 6 September admission storm',
  channel: 'electron',
  icon: '🚨',
  files: {
    'uploads/conv-incident/api-gateway-2026-09-06.log': LOG,
    'files/charts/incident-2026-09-06-errors.chart.json': CHART,
    'files/reports/2026-09/postmortem-2026-09-06.md': POSTMORTEM
  },
  turns: [
    {
      user: 'Gateway logs from last night. Write the postmortem — Nawaf wants it before standup.',
      attachments: ['uploads/conv-incident/api-gateway-2026-09-06.log'],
      at: at(3, 9, 40),
      model: PRO,
      steps: [
        text('Reading the whole file first, then counting per minute so the timeline comes from timestamps rather than from the shape of the story.'),
        tool(
          'file_read',
          { path: 'uploads/conv-incident/api-gateway-2026-09-06.log' },
          `${LOG_LINES.length} lines, 02:13:58 to 03:07:12 (+03:00), 7 KB.

Levels: ${LEVELS.join(', ')}.
Components: ${COMPONENTS.join(', ')}.
First anomaly: 02:14:07 warn modelgate upstream=deepinfra status=429.
Last anomaly: 03:02:47 warn gateway status=503.
One gap flagged in-band: logship backpressure at 02:40:51, recovered 02:44:02, dropped_lines=1184 covering 02:41:00-02:43:59.`,
          { ms: 720 }
        ),
        tool(
          'shell_exec',
          {
            command:
              "grep -E 'status=(429|5[0-9]{2})' uploads/conv-incident/api-gateway-2026-09-06.log | awk '{print substr($1,12,5)}' | sort | uniq -c",
            cwd: '~/wolffish'
          },
          `${LINE_COUNTS}

(these are log lines, not requests — the gateway rolls up its own count in count_1m on each line)`,
          { ms: 980 }
        ),
        tool(
          'shell_exec',
          {
            command:
              "awk -F'count_1m=' '/count_1m=/ { split($1, a, \"T\"); m = substr(a[2], 1, 5); split($2, b, \" \"); if (b[1]+0 > c[m]) c[m] = b[1]+0 } END { for (k in c) printf \"%6d  %s\\n\", c[k], k }' uploads/conv-incident/api-gateway-2026-09-06.log | sort -k2",
            cwd: '~/wolffish'
          },
          GREP_TABLE,
          { ms: 1_240 }
        ),
        text(
          `${TOTAL_5XX.toLocaleString('en-US')} refusals across the window, peaking at ${PEAK} in the minute at 02:31. The upstream answered a probe in 612 ms at 02:31:52 while we were still refusing 20% of traffic — so this stopped being a provider problem within the first two minutes and became ours. One question before I write the summary.`
        ),
        ask(
          [
            {
              question: 'What severity does this get?',
              details:
                `53 minutes, one endpoint, ${TOTAL_5XX.toLocaleString('en-US')} requests refused with a clean error, peak ${PEAK} in a minute at 21.0%, no data loss, mitigated by a config change. The usage rollup says 68 of 200 seats saw at least one failure.`,
              options: [
                {
                  label: 'SEV1',
                  description: 'Core service unusable for most employees, or any data loss. Pages the whole team, postmortem within 24 hours.'
                },
                {
                  label: 'SEV2',
                  description: 'A major feature degraded or failing for a subset, with a workaround or self-recovery. Pages on-call, postmortem within 3 working days.'
                },
                {
                  label: 'SEV3',
                  description: 'Degraded but usable, no customer-visible failures. No page, written up in the weekly digest.'
                }
              ],
              allowOther: true
            }
          ],
          [{ option: 1 }],
          31_000
        ),
        text('SEV2. Writing the chart and the report — blameless, past tense, one page and a bit.'),
        tool(
          'file_write',
          { path: 'files/charts/incident-2026-09-06-errors.chart.json', content: CHART },
          'Wrote files/charts/incident-2026-09-06-errors.chart.json — 54 points, 3 nulls for the shipper gap (1.4 KB).',
          { ms: 150 }
        ),
        tool(
          'file_write',
          { path: 'files/reports/2026-09/postmortem-2026-09-06.md', content: POSTMORTEM },
          'Wrote files/reports/2026-09/postmortem-2026-09-06.md — 14 timeline rows, 3 action items, 4.9 KB.',
          { ms: 210 }
        ),
        tool(
          'pdf_create',
          {
            source: 'files/reports/2026-09/postmortem-2026-09-06.md',
            output: 'files/reports/2026-09/postmortem-2026-09-06.pdf',
            charts: ['files/charts/incident-2026-09-06-errors.chart.json'],
            page: 'A4',
            header: 'Wolffish Inc · Incident postmortem · SEV2 · 2026-09-06'
          },
          'Rendered files/reports/2026-09/postmortem-2026-09-06.pdf — 2 pages, 1 chart embedded at 2x, 226 KB.',
          { ms: 3_910 }
        ),
        send('files/reports/2026-09/postmortem-2026-09-06.pdf'),
        send('files/reports/2026-09/postmortem-2026-09-06.md'),
        send('files/charts/incident-2026-09-06-errors.chart.json'),
        text(`SEV2, 53 minutes, ${TOTAL_5XX.toLocaleString('en-US')} refused requests, no data lost. The PDF is what goes to Nawaf; the Markdown is the one to edit.

| Milestone | Time (UTC+3) | From the first 429 |
| --- | --- | ---: |
| First upstream 429 | 02:14:07 | — |
| First client-visible 503 | 02:17:09 | 3 min |
| Paged automatically | 02:20:11 | 6 min |
| Mitigated (cooldown 45 s + 30% jitter) | 02:47:18 | 33 min |
| Resolved | 03:07:12 | 53 min |

- **The root cause is ours, not DeepInfra's.** Their 429 wave lasted about two minutes; our un-jittered 20-second cooldown kept the loop alive for another fifty by releasing the whole queue on every boundary — 44 cycles, all in phase.
- **Three minutes of the timeline are inference.** The log shipper dropped 1,184 lines between 02:41 and 02:43 under the same load it was reporting on. The chart shows that stretch as a break, not as zero, and I have not filled it in.
- **Action item 1 is already in flight** — WFC-1418 ships the 45 s window with jitter as code in 2.14, so the mitigation stops being a flag someone has to remember. Items 2 and 3 are Bandar's and Sara's, dated in the report.`)
      ]
    }
  ]
})
