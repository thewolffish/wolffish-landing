import { at } from '../clock'
import { ask, conversation, send, text, tool } from './dsl'

const ACCOUNTS_CSV = `account,plan,seats,signup_month,activated,last_active,d30_active,d90_active,renewal,status
acme-labs,Starter,3,2025-11,yes,2026-09-07,yes,yes,not_due,active
basira-tech,Starter,2,2026-02,yes,2026-05-19,no,no,not_due,active
cedar-works,Starter,4,2026-02,yes,2026-06-02,no,no,not_due,cancelled
dune-analytics,Starter,2,2026-03,yes,2026-09-05,yes,no,not_due,active
emerald-io,Starter,5,2025-04,no,2026-04-28,no,no,lapsed,cancelled
falak-systems,Starter,3,2026-02,yes,2026-09-08,yes,yes,not_due,active
gulf-ledger,Starter,2,2026-01,no,2026-06-21,no,no,not_due,cancelled
harath-co,Starter,4,2026-04,yes,2026-08-30,yes,no,not_due,active
iqama-desk,Starter,3,2026-05,yes,2026-09-01,yes,yes,not_due,active
jouf-retail,Starter,2,2026-06,yes,2026-09-06,yes,yes,not_due,active
kanz-media,Team,12,2025-08,yes,2026-09-08,yes,yes,renewed,active
lina-health,Team,9,2026-01,yes,2026-06-30,yes,no,not_due,cancelled
majra-logistics,Team,14,2025-12,yes,2026-09-04,yes,yes,not_due,active
nafith-group,Team,8,2026-02,no,2026-05-27,no,no,not_due,active
oasis-bank,Team,18,2025-10,yes,2026-09-07,yes,yes,not_due,active
qiyas-edu,Team,7,2026-03,yes,2026-07-02,no,no,not_due,cancelled
rawabi-foods,Team,11,2026-01,yes,2026-09-02,yes,yes,not_due,active
sadu-design,Team,9,2026-04,yes,2026-09-05,yes,yes,not_due,active
tuwaiq-cloud,Team,16,2025-07,yes,2026-08-29,yes,yes,renewed,active
ubar-travel,Team,10,2026-05,yes,2026-09-03,yes,no,not_due,active
wadi-motors,Team,13,2026-03,yes,2026-09-06,yes,yes,not_due,active
yamama-cement,Business,42,2025-06,yes,2026-09-08,yes,yes,renewed,active
zahra-retail,Business,28,2025-09,yes,2026-06-11,yes,no,due,active
aljazira-press,Business,35,2026-01,yes,2026-09-07,yes,yes,not_due,active
burj-realty,Business,51,2025-11,yes,2026-09-03,yes,yes,not_due,active
dirah-holdings,Business,24,2026-02,yes,2026-09-06,yes,yes,not_due,active
elm-partners,Business,38,2025-08,yes,2026-09-05,yes,yes,renewed,active
falcon-airways,Enterprise,180,2025-05,yes,2026-09-08,yes,yes,renewed,active
ghaith-energy,Enterprise,240,2025-07,yes,2026-09-08,yes,yes,renewed,active
hejaz-telecom,Enterprise,155,2026-01,yes,2026-09-07,yes,yes,not_due,active
ithra-studio,Starter,1,2026-08,yes,2026-09-08,n/a,n/a,not_due,trial
jubail-marine,Team,6,2026-08,no,2026-08-24,n/a,n/a,not_due,trial
khobar-clinic,Starter,2,2026-09,yes,2026-09-09,n/a,n/a,not_due,trial
laheq-apps,Team,4,2026-08,yes,2026-08-30,n/a,n/a,not_due,trial
madar-freight,Business,9,2026-09,yes,2026-09-08,n/a,n/a,not_due,trial
`

const PIE_CHART = JSON.stringify(
  {
    type: 'pie',
    title: 'Churned accounts by plan — Q3',
    subtitle: '8 of 30 paid accounts · churn = cancelled, or 60 days without activity',
    series: [
      {
        name: 'Churned accounts',
        data: [
          { name: 'Starter', value: 4 },
          { name: 'Team', value: 3 },
          { name: 'Business', value: 1 }
        ]
      }
    ],
    footnote: 'Enterprise: 0 of 3 churned, so it has no slice. Source: accounts-2026-q3.csv, 30 paid rows, 5 trials excluded.'
  },
  null,
  2
)

const FUNNEL_CHART = JSON.stringify(
  {
    type: 'funnel',
    title: 'Retention funnel — paid accounts',
    subtitle: '30 paid accounts in the Q3 export',
    series: [
      {
        name: 'Accounts',
        data: [
          { name: 'Signed up', value: 30 },
          { name: 'Activated', value: 27 },
          { name: 'Active at 30 days', value: 24 },
          { name: 'Active at 90 days', value: 19 },
          { name: 'Renewed', value: 6 }
        ]
      }
    ],
    footnote: 'The last bar is on a different denominator: only 8 accounts have reached a 12-month term — 6 renewed, 1 lapsed, 1 due this month. Read it as 6 of 8, not 6 of 30.'
  },
  null,
  2
)

export const churnCohortAnalysis = conversation({
  id: 'conv-churn-cohort-analysis',
  title: 'Q3 churn cohorts from the CS export',
  channel: 'electron',
  files: {
    'uploads/conv-churn/accounts-2026-q3.csv': ACCOUNTS_CSV,
    'files/charts/churn-by-plan.chart.json': PIE_CHART,
    'files/charts/retention-funnel.chart.json': FUNNEL_CHART
  },
  turns: [
    {
      user: 'Sara forwarded this from the CS team — Q3 accounts. I need churn cut properly and a deck I can put in front of them on Sunday.',
      attachments: ['uploads/conv-churn/accounts-2026-q3.csv'],
      at: at(11, 13, 45),
      steps: [
        text('Three decisions change every number in the deck, so I want them from you rather than picked by me.'),
        ask(
          [
            {
              question: 'What counts as churned?',
              details:
                'The export has both an explicit `cancelled` status (5 accounts) and a `last_active` date. Three accounts are still billing and have not opened the product in over 90 days.',
              options: [
                { label: 'Cancelled, or 30 days without activity', description: 'Catches trouble early; 30 days is one long holiday for a small team.' },
                { label: 'Cancelled, or 60 days without activity', description: 'The usual line for a monthly product.' },
                { label: 'Only an explicit cancellation', description: 'Clean, but hides the accounts that are quietly gone.' }
              ],
              allowOther: true
            },
            {
              question: 'Trials in or out?',
              details: '5 of the 35 rows are trials, all from August or September. None has reached 30 days.',
              options: [
                { label: 'Exclude them', description: 'Churn is measured on paid accounts only.' },
                { label: 'Include them as a separate cohort' },
                { label: 'Include them in the totals' }
              ],
              allowOther: false
            },
            {
              question: 'Segment by plan or by seat band?',
              options: [
                { label: 'By plan', description: 'Starter / Team / Business / Enterprise — what CS reports on.' },
                { label: 'By seat band', description: '1-5, 6-10, 11-25, 26+.' },
                { label: 'Both' }
              ],
              allowOther: false
            }
          ],
          [{ option: 1 }, { option: 0 }, { option: 0 }],
          52_000
        ),
        text('Churn = cancelled or 60 days quiet, trials out, cut by plan. That leaves 30 paid accounts and a cutoff of 11 July. Profiling the file first.'),
        tool(
          'spreadsheet_analyze',
          { path: 'uploads/conv-churn/accounts-2026-q3.csv' },
          `35 rows × 10 columns. No empty cells, no duplicate account keys.

column         type     distinct  notes
account        text           35  primary key, all unique
plan           text            4  Starter 12, Team 13, Business 7, Enterprise 3
seats          integer        25  min 1, max 240, median 9, sum 972
signup_month   month          17  2025-04 to 2026-09
activated      bool            2  yes 31, no 4
last_active    date           20  2026-04-28 to 2026-09-09
d30_active     enum            3  yes 24, no 6, n/a 5 (trials, not yet 30 days old)
d90_active     enum            3  yes 19, no 11, n/a 5
renewal        enum            4  not_due 27, renewed 6, lapsed 1, due 1
status         enum            3  active 25, cancelled 5, trial 5

After dropping the 5 trials: 30 paid accounts, 950 seats.
8 of them meet the churn rule — 5 cancelled outright, and 3 still billing with
no activity for 90, 105 and 113 days (zahra-retail, nafith-group, basira-tech).`,
          { ms: 2_140 }
        ),
        tool(
          'spreadsheet_pivot',
          {
            path: 'uploads/conv-churn/accounts-2026-q3.csv',
            filter: "status != 'trial'",
            rows: ['plan'],
            values: [
              { field: 'account', agg: 'count' },
              { field: 'churned', agg: 'count', expr: "status = 'cancelled' OR last_active < '2026-07-11'" },
              { field: 'seats', agg: 'sum' }
            ]
          },
          `Plan         Accounts  Churned  Rate    Seats  Seats lost
Starter            10        4  40.0%      30          13
Team               11        3  27.3%     127          24
Business            6        1  16.7%     218          28
Enterprise          3        0   0.0%     575           0
-----------------------------------------------------------
All                30        8  26.7%     950          65

Churn by seats is 6.8% (65 of 950); by account it is 26.7%. The gap is the
whole story: everything that left was small.`,
          { ms: 1_680 }
        ),
        tool(
          'spreadsheet_pivot',
          {
            path: 'uploads/conv-churn/accounts-2026-q3.csv',
            filter: "status != 'trial'",
            rows: ['seat_band'],
            bands: { seats: [[1, 5], [6, 10], [11, 25], [26, null]] },
            values: [{ field: 'account', agg: 'count' }, { field: 'churned', agg: 'count' }]
          },
          `Seat band  Accounts  Churned  Rate
1-5              10        4  40.0%
6-10              5        3  60.0%
11-25             7        0   0.0%
26+               8        1  12.5%

The 6-10 band is worse than the 1-5 band, which is not what a "small accounts
churn" story predicts. All three are Team plan: lina-health (9), nafith-group
(8), qiyas-edu (7). No Team account with 10 or more seats churned — 0 of 7.`,
          { ms: 1_520 }
        ),
        text('You asked for plan only, and I cut it by seat band as well because the Team number turned out to be two different stories glued together. Say the word and I drop that slide.'),
        tool(
          'file_write',
          { path: 'files/charts/churn-by-plan.chart.json', content: PIE_CHART },
          'Wrote files/charts/churn-by-plan.chart.json (0.5 KB)',
          { ms: 130 }
        ),
        tool(
          'file_write',
          { path: 'files/charts/retention-funnel.chart.json', content: FUNNEL_CHART },
          'Wrote files/charts/retention-funnel.chart.json (0.6 KB)',
          { ms: 140 }
        ),
        tool(
          'spreadsheet_create',
          {
            path: 'files/sheets/churn-q3.xlsx',
            sheets: [
              { name: 'Accounts', header: ['Account', 'Plan', 'Seats', 'Signup', 'Activated', 'Last active', 'Days quiet', '30d', '90d', 'Renewal', 'Status', 'Churned'], rows: 35, freeze: 'A2' },
              { name: 'By plan', header: ['Plan', 'Accounts', 'Churned', 'Rate', 'Seats', 'Seats lost'], rows: 5, freeze: 'A2' },
              { name: 'By seat band', header: ['Band', 'Accounts', 'Churned', 'Rate'], rows: 4, freeze: 'A2' },
              { name: 'Funnel', header: ['Stage', 'Accounts', 'Drop from previous'], rows: 5, freeze: 'A2' },
              { name: 'Cohorts', header: ['Signup month', 'Accounts', 'Churned', 'Rate'], rows: 17, freeze: 'A2' }
            ]
          },
          'Created files/sheets/churn-q3.xlsx — 5 sheets, 66 data rows, header rows bold, panes frozen at A2, Rate columns as percent, the 8 churned rows filled amber on Accounts. Days quiet is a formula against 2026-09-09, not a pasted value. 31 KB.',
          { ms: 2_680 }
        ),
        send('files/charts/churn-by-plan.chart.json'),
        send('files/charts/retention-funnel.chart.json'),
        send('files/sheets/churn-q3.xlsx'),
        tool(
          'document_create',
          {
            path: 'files/reports/2026-09/churn-q3-review.pptx',
            title: 'Q3 churn — CS review',
            slides: [
              'Q3 churn: 8 of 30 paid accounts',
              'How churn is defined here',
              'Churn by plan',
              'Retention funnel',
              'The seat band nobody expected',
              'Two cohorts to call this week',
              'Three accounts still billing and dark'
            ],
            charts: ['files/charts/churn-by-plan.chart.json', 'files/charts/retention-funnel.chart.json'],
            style: 'light'
          },
          'Created files/reports/2026-09/churn-q3-review.pptx — 7 slides, 2 charts placed at full width on slides 3 and 4, speaker notes on every slide naming the pivot behind the number. 16:9, 486 KB.',
          { ms: 4_380 }
        ),
        send('files/reports/2026-09/churn-q3-review.pptx'),
        text(`26.7% of paid accounts churned in Q3 — and 6.8% of seats. Both numbers are true and they tell opposite stories, so put them on the same slide.

| Plan | Accounts | Churned | Rate | Seats lost |
| --- | ---: | ---: | ---: | ---: |
| Starter | 10 | 4 | 40.0% | 13 |
| Team | 11 | 3 | 27.3% | 24 |
| Business | 6 | 1 | 16.7% | 28 |
| Enterprise | 3 | 0 | 0.0% | 0 |
| **All** | **30** | **8** | **26.7%** | **65 of 950** |

Two cohorts worth a call this week:

- **Team accounts under 10 seats: 3 of 4 gone.** lina-health (9), nafith-group (8), qiyas-edu (7). Every Team account at 10 seats or more is still here — 0 of 7. That is a plan-fit problem, not a product problem: the same price buys a seat count these teams never grow into.
- **The February 2026 signups: 3 of 5 gone.** basira-tech, cedar-works and nafith-group all signed up that month and all went quiet between May and June. Worth asking CS what onboarding looked like in February, because the January and March cohorts lost 2 of 5 and 1 of 3.

Two things to watch:

- **Three accounts are still billing and have not opened the product** for 113, 105 and 90 days (basira-tech, nafith-group, zahra-retail). They are counted as churned here. zahra-retail is a 28-seat Business account whose renewal is due this month — that is the one call to make today.
- **The funnel's last bar is on a different denominator.** 6 renewed of the 8 accounts that have reached twelve months, not 6 of 30. It is footnoted on the chart and in the speaker notes; do not let it get quoted as a 20% renewal rate.

Everything comes from \`accounts-2026-q3.csv\` and the two pivots in \`files/sheets/churn-q3.xlsx\`. Nothing in the deck is estimated.`)
      ]
    }
  ]
})
