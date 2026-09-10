import { PRO } from '../catalog'
import { at } from '../clock'
import { PROJECT_INFRA } from '../projects'
import { conversation, send, text, tool, workflow, workflowRun } from './dsl'

const FORECAST_CSV = `month,basis,seats,cloudflare_usd,inference_usd,brave_search_usd,staging_postgres_usd,total_usd
2026-06,actual,186,1051.90,88.40,344.75,148.00,1633.05
2026-07,actual,194,1138.60,94.15,369.80,148.00,1750.55
2026-08,actual,200,1204.69,99.76,382.00,148.00,1834.45
2026-09,forecast,212,1315.28,105.75,410.92,148.00,1979.95
2026-10,forecast,228,1456.98,113.73,449.48,176.00,2196.19
2026-11,forecast,244,1606.00,121.71,488.04,176.00,2391.75
2026-12,forecast,260,1762.66,129.69,526.60,176.00,2594.95
`

const FORECAST_CHART = JSON.stringify(
  {
    type: 'line',
    title: 'Infrastructure spend — actual to August, forecast to December',
    subtitle: 'All four vendors · seats 186 in June to 260 in December',
    categories: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [
      { name: 'Actual', data: [1633.05, 1750.55, 1834.45, null, null, null, null], color: 1 },
      { name: 'Forecast', data: [null, null, 1834.45, 1979.95, 2196.19, 2391.75, 2594.95], color: 3 }
    ],
    smooth: true,
    unit: { prefix: '$', compact: true },
    yAxis: 'Monthly spend',
    footnote:
      'Actuals from the June, July and August invoices; forecast from cost-model-assumptions.md — seats per the hiring plan of 2026-08-28, Cloudflare per seat plus 3% a month of accumulated D1 reads, inference and search per seat flat. August is on both lines because the forecast is anchored there. Source: files/sheets/q4-forecast.csv.'
  },
  null,
  2
)

const MEMO_MD = `# Q4 2026 infrastructure forecast

**For:** Dana Alturki, finance · **From:** Younes Alturkey, Platform · **Date:** 2026-09-03
**Sources:** Cloudflare invoices June-August 2026, the August usage rollup, \`cost-model-assumptions.md\` (2026-08-28)

## The number

| | USD | SAR at 3.75 |
| --- | ---: | ---: |
| Q4 net (Oct + Nov + Dec) | 7,182.89 | 26,935.84 |
| VAT at 15% | 1,077.43 | 4,040.38 |
| **Q4 gross** | **8,260.32** | **30,976.21** |

VAT is shown separately because all four vendors bill from outside the Kingdom and it is settled under reverse charge, not on the invoice.

## Monthly detail

| Month | Basis | Seats | Cloudflare | Inference | Brave search | Staging Postgres | Total |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Jun | actual | 186 | 1,051.90 | 88.40 | 344.75 | 148.00 | 1,633.05 |
| Jul | actual | 194 | 1,138.60 | 94.15 | 369.80 | 148.00 | 1,750.55 |
| Aug | actual | 200 | 1,204.69 | 99.76 | 382.00 | 148.00 | 1,834.45 |
| Sep | forecast | 212 | 1,315.28 | 105.75 | 410.92 | 148.00 | 1,979.95 |
| Oct | forecast | 228 | 1,456.98 | 113.73 | 449.48 | 176.00 | 2,196.19 |
| Nov | forecast | 244 | 1,606.00 | 121.71 | 488.04 | 176.00 | 2,391.75 |
| Dec | forecast | 260 | 1,762.66 | 129.69 | 526.60 | 176.00 | 2,594.95 |

Figures in USD. Q4 is the last three rows.

## What each line is

**Cloudflare — $1,204.69 in August, 66% of the bill.** One line is three quarters of it: D1 rows read, 912 million at $912.00, which is 75.7% of the Cloudflare invoice. It grows with seats *and* with how much conversation history the sync engine reads back. Cost per seat went $5.66 in June, $5.87 in July, $6.02 in August — +3.8% then +2.6% — so the forecast keeps 3% a month on top of the seat count.

**Inference — $99.76 in August.** Priced from the org catalog against the August rollup: 380M input, 62M output, 38% cache hit, 85% of tokens on Flash and 15% on Pro. Pro is 15% of the tokens and $72.29 of the $99.76 — 72% of the inference bill.

**Brave search — $382.00 in August.** 96,400 queries org-wide, 20,000 included in the Pro plan, 76,400 billable at $5 per 1,000.

**Staging Postgres — $148.00 a month.** Flat until the storage tier moves in October, then $176.00.

## Sensitivity

| Scenario | Q4 total | Δ vs base |
| --- | ---: | ---: |
| Base — 260 seats by December, D1 reads +3%/month | 7,182.89 | — |
| WFC-1436 ships in September, D1 reads flat | 6,766.42 | -416.47 |
| D1 reads +5%/month | 7,476.35 | +293.46 |
| Hiring 10 seats behind plan all quarter | 6,898.10 | -284.79 |
| Hiring 10 seats ahead of plan all quarter | 7,467.67 | +284.78 |

## What I would do

1. **Land WFC-1436** (usage rollup retires raw rows after 180 days). It is already in flight and it is the single biggest lever on the forecast: $416.47 off Q4, and more every quarter after.
2. **Budget the gross, not the net.** SAR 30,976.21. The reverse-charge VAT is real cash out even though no vendor invoices it.
3. **Re-run this when the hiring plan moves.** Every 10 seats is $285 a quarter, so a slipped requisition is worth re-forecasting, and a pulled-forward one is not a surprise.
`

const START = at(6, 9, 48)

export const q4InfraCostForecast = conversation({
  id: 'conv-q4-infra-cost-forecast',
  title: 'Q4 infrastructure cost forecast for finance',
  channel: 'electron',
  projectId: PROJECT_INFRA,
  model: PRO,
  files: {
    'files/sheets/q4-forecast.csv': FORECAST_CSV,
    'files/charts/q4-infra-forecast.chart.json': FORECAST_CHART,
    'files/reports/2026-09/q4-infra-forecast.md': MEMO_MD
  },
  turns: [
    {
      user: 'Dana needs the Q4 infra forecast before the budget lock. Build it from the invoices in the project, not from the dashboard, and give me something she can read in two minutes.',
      at: START,
      steps: [
        text('Three passes: read the actuals, build the model, write the memo. Running them as a workflow so the invoice and the usage rollup are read in parallel.'),
        workflow(
          workflowRun({
            startedAt: START + 9_000,
            seconds: 134,
            model: PRO,
            note: 'Q4 forecast — actuals from the project invoices, model anchored on August, memo for finance.',
            phases: ['Gather', 'Model', 'Write'],
            agents: [
              {
                name: 'invoice-reader',
                task: 'Sum the June-August Cloudflare invoices by line item and flag every line above 10% of the bill',
                phase: 'Gather',
                seconds: 36,
                startOffset: 0,
                llmCalls: 6,
                toolCalls: 5,
                inputTokens: 61_400,
                outputTokens: 3_180,
                resultChars: 2_140
              },
              {
                name: 'usage-rollup-reader',
                task: 'Pull the August usage rollup and price it against the org model catalog at the Flash/Pro split',
                phase: 'Gather',
                seconds: 44,
                startOffset: 2,
                llmCalls: 7,
                toolCalls: 6,
                inputTokens: 74_600,
                outputTokens: 4_120,
                resultChars: 1_860
              },
              {
                name: 'model-builder',
                task: 'Build the Jun-Dec monthly model at 200 to 260 seats and the five-scenario sensitivity grid',
                phase: 'Model',
                seconds: 82,
                startOffset: 48,
                llmCalls: 11,
                toolCalls: 9,
                inputTokens: 128_200,
                outputTokens: 9_440,
                resultChars: 4_620
              }
            ],
            master: { llmCalls: 6, inputTokens: 52_000, outputTokens: 3_900 }
          })
        ),
        tool(
          'file_read',
          { path: 'uploads/project-infra/cost-model-assumptions.md' },
          `Seats: 200 today, 260 by December (hiring plan, Majed, 2026-08-28).
Inference: Flash 85% of tokens, Pro 15%. Tokens per seat per month 1.9M in / 0.31M out, 38% cache hit (August, org-wide).
Search: Brave Pro, $5 per 1,000 queries after the included 20,000.
FX: SAR pegged at 3.75.
Rule: every forecast row shows the assumption it multiplies.`,
          { ms: 210 }
        ),
        tool(
          'spreadsheet_read',
          { path: 'uploads/project-infra/cloudflare-invoice-2026-08.csv' },
          `13 rows × 5 columns (line_item, quantity, unit, unit_price_usd, amount_usd).

sum(amount_usd) = 1204.69

Lines above 10% of the invoice:
  D1 rows read          912 million     912.00   75.7%
  R2 Class A operations  38.6 million   173.70   14.4%

Next largest: D1 rows written 41.00 (3.4%), Workers CPU time 22.40 (1.9%). The remaining 9 lines total 55.59 (4.6%).`,
          { ms: 880 }
        ),
        tool(
          'shell_exec',
          {
            command:
              "for f in uploads/project-infra/cloudflare-invoice-*.csv; do printf '%s\\t' \"$f\"; awk -F, 'NR>1 {t+=$5} END {printf \"%.2f\\n\", t}' \"$f\"; done",
            cwd: '~/.wfc/workspace'
          },
          `uploads/project-infra/cloudflare-invoice-2026-06.csv\t1051.90
uploads/project-infra/cloudflare-invoice-2026-07.csv\t1138.60
uploads/project-infra/cloudflare-invoice-2026-08.csv\t1204.69

Per seat, at 186 / 194 / 200 seats: $5.66, $5.87, $6.02 — up 3.8% then 2.6%. That is the growth rate the forecast carries forward, not a number I picked.`,
          { ms: 540 }
        ),
        tool(
          'usage_report',
          { scope: 'org', month: '2026-08', group_by: 'model' },
          `Org usage, August 2026 (200 seats, 194 with any usage):

model                              tokens_in     tokens_out   cached_in    share_tokens
DeepSeek-V4-Flash-0731             323.0M        52.7M        122.7M       85.0%
DeepSeek-V4-Pro-0813                57.0M         9.3M         21.7M       15.0%
                                   ------        -----        ------
total                              380.0M        62.0M        144.4M       (38.0% cache hit)

Search: 96,400 queries to /v1/search.
Matches the assumptions file: 200 × 1.9M in = 380M, 200 × 0.31M out = 62M.`,
          { ms: 1_760 }
        ),
        tool(
          'shell_exec',
          {
            command:
              "python3 -c \"f=lambda t,p:t*p; flash=f(200.26,0.08)+f(122.74,0.016)+f(52.7,0.18); pro=f(35.34,1.30)+f(21.66,0.10)+f(9.3,2.60); print(round(flash,2), round(pro,2), round(flash+pro,2))\"",
            cwd: '~/.wfc/workspace'
          },
          `27.47 72.29 99.76

Flash: 200.26M fresh in @ $0.08 + 122.74M cached in @ $0.016 + 52.7M out @ $0.18 = $27.47
Pro:    35.34M fresh in @ $1.30 +  21.66M cached in @ $0.10 +  9.3M out @ $2.60 = $72.29
August inference = $99.76. Pro is 15% of tokens and 72.5% of the bill.`,
          { ms: 720 }
        ),
        text(
          'August lands at $1,834.45 across the four vendors, up from $1,633.05 in June. Two lines carry the whole story: D1 rows read is 75.7% of Cloudflare, and Pro is 15% of tokens but 72.5% of inference. Building the model on those two.'
        ),
        tool(
          'file_write',
          { path: 'files/sheets/q4-forecast.csv', content: FORECAST_CSV },
          'Wrote files/sheets/q4-forecast.csv (8 lines, 0.5 KB). Column totals reconcile row by row; Jun-Aug match the invoices to the cent.',
          { ms: 150 }
        ),
        tool(
          'file_write',
          { path: 'files/charts/q4-infra-forecast.chart.json', content: FORECAST_CHART },
          'Wrote files/charts/q4-infra-forecast.chart.json (1.1 KB)',
          { ms: 120 }
        ),
        tool(
          'spreadsheet_create',
          {
            path: 'files/sheets/q4-infra-forecast.xlsx',
            sheets: [
              { name: 'Assumptions', header: ['Assumption', 'Value', 'Source', 'Dated'], rows: 11, freeze: 'A2' },
              { name: 'Monthly', header: ['Month', 'Basis', 'Seats', 'Cloudflare', 'Inference', 'Brave search', 'Staging Postgres', 'Total USD', 'Total SAR'], rows: 7, freeze: 'A2' },
              { name: 'Sensitivity', header: ['Scenario', 'Cloudflare Q4', 'Inference Q4', 'Search Q4', 'Postgres Q4', 'Q4 total', 'Delta vs base'], rows: 5, freeze: 'A2' }
            ]
          },
          `Created files/sheets/q4-infra-forecast.xlsx — 3 sheets, 23 data rows, header rows bold, panes frozen at A2, currency columns at 2 decimals.
Monthly!I references Monthly!H * Assumptions!B9 (FX 3.75), so changing the peg in one cell re-rates the sheet.
Sensitivity!G is a formula against Monthly, not a pasted number. 28 KB.`,
          { ms: 2_610 }
        ),
        tool(
          'file_write',
          { path: 'files/reports/2026-09/q4-infra-forecast.md', content: MEMO_MD },
          'Wrote files/reports/2026-09/q4-infra-forecast.md (3.1 KB, 54 lines).',
          { ms: 190 }
        ),
        tool(
          'pdf_create',
          {
            source: 'files/reports/2026-09/q4-infra-forecast.md',
            output: 'files/reports/2026-09/q4-infra-forecast.pdf',
            charts: ['files/charts/q4-infra-forecast.chart.json'],
            page: 'A4',
            footer: 'Wolffish Inc · Platform · Q4 2026 infrastructure forecast'
          },
          'Rendered files/reports/2026-09/q4-infra-forecast.pdf — 2 pages (page 1: the number, monthly detail and the chart; page 2: line-by-line, sensitivity, recommendations), chart embedded at 2x, 226 KB.',
          { ms: 4_180 }
        ),
        send('files/charts/q4-infra-forecast.chart.json'),
        send('files/sheets/q4-forecast.csv'),
        send('files/sheets/q4-infra-forecast.xlsx'),
        send('files/reports/2026-09/q4-infra-forecast.pdf'),
        text(`Q4 comes to **$7,182.89 net**, and that is the number Dana should hold.

| | USD | SAR at 3.75 |
| --- | ---: | ---: |
| Q4 net (Oct + Nov + Dec) | 7,182.89 | 26,935.84 |
| VAT at 15%, reverse charge | 1,077.43 | 4,040.38 |
| **Q4 gross** | **8,260.32** | **30,976.21** |

The two-page PDF is what goes to her; the workbook behind it has Assumptions, Monthly and Sensitivity, and the FX peg is one cell so the whole sheet re-rates if it ever moves.

Two assumptions move this more than anything else:

- **D1 rows read growing 3% a month.** It is 75.7% of the Cloudflare invoice and the reason the line bends upward. If WFC-1436 (retire raw rollup rows after 180 days) lands in September, Q4 drops to $6,766.42 — $416.47 off, and it compounds. At 5% a month instead of 3% it goes the other way, to $7,476.35.
- **Seats reaching 260 by December.** Straight from Majed's hiring plan of 2026-08-28, not from me. Every 10 seats off that plan, for the whole quarter, is $284.79.

Every actual is the \`amount_usd\` column of the invoices in the project; inference is priced from the org catalog against the August rollup, and the arithmetic is the python line above. Nothing came from a dashboard estimate.`)
      ]
    }
  ]
})
