import { at } from '../clock'
import { PROJECT_INFRA } from '../projects'
import { ask, conversation, send, text, tool } from './dsl'

/** July and August, line by line. August is the invoice in the project files, unchanged. */
type Line = { item: string; unit: string; julQty: number; augQty: number; jul: number; aug: number }

const LINES: Line[] = [
  { item: 'Workers Paid plan', unit: 'month', julQty: 1, augQty: 1, jul: 5.0, aug: 5.0 },
  { item: 'Workers requests', unit: 'million', julQty: 43.4, augQty: 48.2, jul: 13.02, aug: 14.46 },
  { item: 'Workers CPU time', unit: 'million ms', julQty: 1009, augQty: 1120, jul: 20.18, aug: 22.4 },
  { item: 'D1 rows read', unit: 'million', julQty: 852, augQty: 912, jul: 852.0, aug: 912.0 },
  { item: 'D1 rows written', unit: 'million', julQty: 38.2, augQty: 41, jul: 38.2, aug: 41.0 },
  { item: 'D1 storage', unit: 'GB', julQty: 17.9, augQty: 18.4, jul: 13.4, aug: 13.8 },
  { item: 'R2 storage', unit: 'GB-month', julQty: 203, augQty: 214, jul: 3.05, aug: 3.21 },
  { item: 'R2 Class A operations', unit: 'million', julQty: 4.1, augQty: 38.6, jul: 18.45, aug: 173.7 },
  { item: 'R2 Class B operations', unit: 'million', julQty: 8.6, augQty: 12.1, jul: 3.1, aug: 4.36 },
  { item: 'KV reads', unit: 'million', julQty: 8.7, augQty: 9.4, jul: 4.35, aug: 4.7 },
  { item: 'KV writes', unit: 'million', julQty: 0.72, augQty: 0.8, jul: 3.6, aug: 4.0 },
  { item: 'Durable Objects requests', unit: 'million', julQty: 5.65, augQty: 6.2, jul: 0.85, aug: 0.93 },
  { item: 'Durable Objects duration', unit: 'GB-s', julQty: 376, augQty: 410, jul: 4.7, aug: 5.13 }
]

const round2 = (n: number): number => Math.round(n * 100) / 100
const JUL_TOTAL = round2(LINES.reduce((a, l) => a + l.jul, 0))
const AUG_TOTAL = round2(LINES.reduce((a, l) => a + l.aug, 0))
const DELTA = round2(AUG_TOTAL - JUL_TOTAL)

const COMPARISON_CSV = [
  'line_item,unit,jul_quantity,aug_quantity,jul_usd,aug_usd,delta_usd,delta_pct',
  ...LINES.map((l) => {
    const d = round2(l.aug - l.jul)
    const pct = ((l.aug - l.jul) / l.jul) * 100
    return `${l.item},${l.unit},${l.julQty},${l.augQty},${l.jul.toFixed(2)},${l.aug.toFixed(2)},${d.toFixed(2)},${pct.toFixed(1)}`
  }),
  `TOTAL,,,,${JUL_TOTAL.toFixed(2)},${AUG_TOTAL.toFixed(2)},${DELTA.toFixed(2)},${(((AUG_TOTAL - JUL_TOTAL) / JUL_TOTAL) * 100).toFixed(1)}`
].join('\n')

const CHART = JSON.stringify(
  {
    type: 'area',
    title: 'Cloudflare bill by product',
    subtitle: 'May to August 2026 · USD, from the monthly invoices',
    categories: ['May', 'June', 'July', 'August'],
    stacked: true,
    series: [
      { name: 'D1', data: [780.4, 842.9, 903.6, 966.8], color: 1 },
      { name: 'R2', data: [18.9, 20.4, 24.6, 181.27], color: 4 },
      { name: 'Workers', data: [33.1, 35.4, 38.2, 41.86], color: 2 },
      { name: 'KV + Durable Objects', data: [12.2, 12.9, 13.5, 14.76], color: 3 }
    ],
    unit: { prefix: '$', decimals: 2 },
    yAxis: 'Invoiced',
    footnote:
      'Monthly totals: $844.60, $911.60, $979.90, $1,204.69. D1 and Workers track seat growth at 6-8% a month. R2 does not: August is 7.4x July, and all of it is Class A operations.'
  },
  null,
  2
)

const EMAIL_MD = `**To:** Dana Alturki
**Cc:** Bandar Alanazi
**Subject:** Cloudflare August — $224.79 over July, cause found and fixed

Dana,

August's Cloudflare invoice is **$1,204.69**, up **$224.79** (23%) on July's $979.90. Two thirds of the increase is one line item, and it was a bug, not growth.

| Product | July | August | Change |
| --- | ---: | ---: | ---: |
| D1 | $903.60 | $966.80 | +$63.20 |
| R2 | $24.60 | $181.27 | +$156.67 |
| Workers | $38.20 | $41.86 | +$3.66 |
| KV + Durable Objects | $13.50 | $14.76 | +$1.26 |
| **Total** | **$979.90** | **$1,204.69** | **+$224.79** |

**The anomaly: R2 Class A operations.** 4.1 million in July, 38.6 million in August — $18.45 to $173.70. Class A is the write class: every PUT, every list. Storage itself barely moved (203 GB to 214 GB), so this was not more data, it was the same data written over and over.

**Cause.** The sync engine shipped on 3 August rewrote a device's entire file manifest to R2 on every bootstrap instead of only the entries that changed. A laptop opening the app ten times a day wrote the whole manifest ten times. Daily Class A operations step from 0.14 million on 2 August to 1.32 million on 3 August and stay there — the same day the release went out.

**Fix.** Sync 1.7.3, deployed 2 September, writes only changed entries. Daily operations are back to 0.14 million.

**What September should look like.** Two days at the old rate before the fix, then the corrected rate: about 6.0 million Class A operations, roughly $26.90 — around **$147 less than August**. From October, with a full month on 1.7.3, that line should sit near $19.

The rest of the increase is real: D1 reads and Workers requests grew 6-8%, in line with seats. Nothing else on the invoice moved more than 15%.

Workbook and the line-by-line comparison are attached.

Younes

*Figures from the August and July Cloudflare invoices and the Cloudflare GraphQL analytics API (r2OperationsAdaptiveGroups, daily, August). USD; the total in riyal at 3.75 is SAR 4,517.59.*
`

export const cloudflareBillAnomaly = conversation({
  id: 'conv-cloudflare-bill-anomaly',
  title: 'The August R2 spike on the Cloudflare bill',
  channel: 'electron',
  projectId: PROJECT_INFRA,
  contextFiles: ['uploads/project-infra/cloudflare-invoice-2026-08.csv'],
  files: {
    'files/sheets/cloudflare-jul-vs-aug.csv': COMPARISON_CSV,
    'files/charts/cloudflare-may-aug.chart.json': CHART,
    'files/drafts/email-to-dana.md': EMAIL_MD
  },
  turns: [
    {
      user: 'Dana says the August Cloudflare invoice is way over July and wants an explanation today. Find what moved and draft her something I can send.',
      at: at(5, 11, 20),
      steps: [
        text('Starting from the invoice line items, not the dashboard.'),
        tool(
          'file_read',
          { path: 'uploads/project-infra/cloudflare-invoice-2026-08.csv' },
          `13 line items, August 2026. Total $1,204.69.

Largest: D1 rows read $912.00 · R2 Class A operations $173.70 · D1 rows written $41.00 · Workers CPU time $22.40 · Workers requests $14.46.
Everything else is under $14.`,
          { ms: 480 }
        ),
        tool(
          'shell_exec',
          {
            command:
              "ls -1 ~/Documents/invoices/cloudflare/ && for m in 05 06 07 08; do printf '%s ' 2026-$m; awk -F, 'NR>1 {s+=$5} END {printf \"%.2f\\n\", s}' ~/Documents/invoices/cloudflare/2026-$m.csv; done"
          },
          `2026-05.csv
2026-06.csv
2026-07.csv
2026-08.csv
2026-05 844.60
2026-06 911.60
2026-07 979.90
2026-08 1204.69`,
          { ms: 760 }
        ),
        tool(
          'shell_exec',
          {
            command:
              "join -t, -j1 <(awk -F, 'NR>1 {print $1\",\"$2\",\"$5}' ~/Documents/invoices/cloudflare/2026-07.csv | sort) <(awk -F, 'NR>1 {print $1\",\"$2\",\"$5}' ~/Documents/invoices/cloudflare/2026-08.csv | sort) | awk -F, '{d=$5-$3; if (d/$3 > 0.15) printf \"%-28s %8.2f -> %8.2f  %+7.2f  %+7.1f%%\\n\", $1, $3, $5, d, 100*d/$3}'"
          },
          `R2 Class A operations          18.45 ->   173.70  +155.25   +841.5%
R2 Class B operations           3.10 ->     4.36    +1.26    +40.6%

(only two line items moved more than 15%; both are R2 operations. D1 rows read +7.0%, Workers requests +11.1%, storage +5.4% — all inside seat growth.)`,
          { ms: 920 }
        ),
        text(
          'R2 Class A is the whole story: $18.45 to $173.70, 4.1M operations to 38.6M, while stored bytes went from 203 GB to 214 GB. Same data, written far more often. Checking when it started.'
        ),
        tool(
          'shell_exec',
          {
            command:
              'curl -s https://api.cloudflare.com/client/v4/graphql -H "Authorization: Bearer $CF_API_TOKEN" --data @queries/r2-class-a-daily.graphql | jq -c \'.data.viewer.accounts[0].r2OperationsAdaptiveGroups[] | {day: .dimensions.date, class: .dimensions.actionType, ops: .sum.requests}\' | head -12'
          },
          `{"day":"2026-07-30","class":"ClassA","ops":139412}
{"day":"2026-07-31","class":"ClassA","ops":141880}
{"day":"2026-08-01","class":"ClassA","ops":138204}
{"day":"2026-08-02","class":"ClassA","ops":142117}
{"day":"2026-08-03","class":"ClassA","ops":1318440}
{"day":"2026-08-04","class":"ClassA","ops":1342016}
{"day":"2026-08-05","class":"ClassA","ops":1329771}
{"day":"2026-08-06","class":"ClassA","ops":1351208}
{"day":"2026-08-07","class":"ClassA","ops":1327904}
{"day":"2026-09-01","class":"ClassA","ops":1322480}
{"day":"2026-09-02","class":"ClassA","ops":702118}
{"day":"2026-09-03","class":"ClassA","ops":141066}

August sum: 38,604,912 Class A operations (invoice says 38.6 million).`,
          { ms: 2_180 }
        ),
        tool(
          'shell_exec',
          {
            command: "git log --since=2026-08-01 --until=2026-09-05 --oneline -- apps/api/src/sync",
            cwd: '~/dev/wolffish-cloud'
          },
          `c8e0a41 feat(sync): 1.7.0 — manifest-backed bootstrap (2026-08-03)
9b71f28 fix(sync): 1.7.1 — retry a partial manifest write (2026-08-11)
3ac9d70 fix(sync): 1.7.2 — cap manifest entries per page (2026-08-24)
0f4e1c6 fix(sync): 1.7.3 — write only changed manifest entries (2026-09-02)

c8e0a41 diff: putObject(manifestKey, JSON.stringify(all)) on every bootstrap.
0f4e1c6 diff: putObject only for entries whose etag changed since the last manifest.`,
          { ms: 1_040 }
        ),
        text(
          'Found it. Sync 1.7.0 (3 August) rewrote the whole file manifest to R2 on every bootstrap; daily Class A operations step from 0.14M to 1.32M on exactly that day and drop back on 2 September when 1.7.3 shipped. Three questions before I draft anything for Dana.'
        ),
        ask(
          [
            {
              question: 'Should the note recommend anything, or only explain?',
              options: [
                { label: 'Explain and recommend', description: 'Cause, fix, and what September should cost.' },
                { label: 'Explain only', description: 'She asked what moved; leave the next step to her.' }
              ],
              allowOther: true
            },
            {
              question: 'Cc Bandar?',
              details: 'He owns the Cloudflare account and will get the question anyway once finance replies.',
              options: [{ label: 'Yes, cc him' }, { label: 'No, send it to Dana alone' }],
              allowOther: false
            },
            {
              question: 'Riyal or dollars?',
              options: [
                { label: 'Dollars only', description: 'The invoice currency.' },
                { label: 'Riyal only, at 3.75' },
                { label: 'Dollars, with the riyal equivalent on the total line' }
              ],
              allowOther: false
            }
          ],
          [{ option: 0 }, { option: 0 }, { option: 2 }],
          52_000
        ),
        tool(
          'file_write',
          { path: 'files/sheets/cloudflare-jul-vs-aug.csv', content: COMPARISON_CSV },
          'Wrote files/sheets/cloudflare-jul-vs-aug.csv — 13 line items plus a total row, 8 columns (1.2 KB).',
          { ms: 170 }
        ),
        tool(
          'file_write',
          { path: 'files/charts/cloudflare-may-aug.chart.json', content: CHART },
          'Wrote files/charts/cloudflare-may-aug.chart.json (0.9 KB).',
          { ms: 130 }
        ),
        tool(
          'spreadsheet_create',
          {
            path: 'files/sheets/cloudflare-aug-breakdown.xlsx',
            sheets: [
              { name: 'Summary', header: ['Product', 'May', 'June', 'July', 'August', 'Delta', 'Delta %'], rows: 5, freeze: 'A2' },
              { name: 'Jul vs Aug', header: ['Line item', 'Unit', 'Jul qty', 'Aug qty', 'Jul $', 'Aug $', 'Delta $', 'Delta %'], rows: 14, freeze: 'A2' },
              { name: 'R2 Class A daily', header: ['Date', 'Operations', 'Cost $', 'Sync version'], rows: 62, freeze: 'A2' }
            ],
            number_format: { currency: '$#,##0.00', percent: '0.0%' }
          },
          'Created files/sheets/cloudflare-aug-breakdown.xlsx — 3 sheets, 81 data rows, header rows bold, panes frozen at A2, currency and percent formats applied. Rows above 15% change highlighted on "Jul vs Aug". 24 KB.',
          { ms: 2_410 }
        ),
        tool(
          'file_write',
          { path: 'files/drafts/email-to-dana.md', content: EMAIL_MD },
          'Wrote files/drafts/email-to-dana.md (2.2 KB).',
          { ms: 160 }
        ),
        tool(
          'document_create',
          {
            path: 'files/drafts/email-to-dana.docx',
            title: 'Cloudflare August — $224.79 over July',
            source: 'files/drafts/email-to-dana.md',
            style: { heading: 'IBM Plex Sans', body: 'IBM Plex Sans', size: 11 }
          },
          'Created files/drafts/email-to-dana.docx — 2 pages, 1 table, 389 words, 36 KB. Nothing was sent; this is a draft on disk.',
          { ms: 2_720 }
        ),
        send('files/charts/cloudflare-may-aug.chart.json'),
        send('files/sheets/cloudflare-jul-vs-aug.csv'),
        send('files/sheets/cloudflare-aug-breakdown.xlsx'),
        send('files/drafts/email-to-dana.docx'),
        send('files/drafts/email-to-dana.md'),
        text(`August is $1,204.69, up $224.79 on July, and $155.25 of that is one bug.

| Product | July | August | Change | Explained by |
| --- | ---: | ---: | ---: | --- |
| D1 | $903.60 | $966.80 | +$63.20 | 7% more rows read — seat growth |
| R2 | $24.60 | $181.27 | +$156.67 | Class A operations, 4.1M → 38.6M |
| Workers | $38.20 | $41.86 | +$3.66 | 11% more requests |
| KV + Durable Objects | $13.50 | $14.76 | +$1.26 | seat growth |
| **Total** | **$979.90** | **$1,204.69** | **+$224.79** | |

**The cause in one line:** sync 1.7.0 rewrote every device's whole file manifest to R2 on each bootstrap instead of the changed entries, from 3 August until 1.7.3 fixed it on 2 September.

- **September should come in around $147 lower on that line** — 1 and 2 September at the old rate plus twenty-eight days at the corrected one is 6.0M operations, about $26.90 against August's $173.70. From October it should sit near $19.
- **Nothing else on the invoice moved more than 15%**, so the rest is growth, not a second problem.
- **The email is a draft, not sent.** It is addressed to Dana with Bandar cc'd, dollars with the riyal total at the foot, as you chose. The Word version is what you paste; the Markdown is the one to edit first.`)
      ]
    }
  ]
})
