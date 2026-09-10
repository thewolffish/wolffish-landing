import type { Project } from './types'
import { at } from './clock'

/** Younes's projects — the standing contexts his conversations run inside. */
export const PROJECT_PLATFORM = 'prj_platform_api'
export const PROJECT_MOBILE = 'prj_mobile_release'
export const PROJECT_INFRA = 'prj_infra_cost'
export const PROJECT_HIRING = 'prj_hiring_loop'
export const PROJECT_DOCS = 'prj_docs_onboarding'

export const PROJECTS: Project[] = [
  {
    id: PROJECT_PLATFORM,
    title: 'Platform API',
    icon: '🧩',
    instructions: `The org API: one Cloudflare Worker at api.wolffi.sh, D1 for the relational master, R2 for blobs, two Durable Objects for the gates. Work in ~/dev/wolffish-cloud/apps/api.

Every change ships behind a PR with the seam tests green. A migration is drafted and handed back, never applied. Quote the endpoint and the query beside any latency figure, and read staging through the replica only.`,
    files: [
      { path: 'uploads/project-platform/api-conventions.md', name: 'api-conventions.md' },
      { path: 'uploads/project-platform/endpoints.csv', name: 'endpoints.csv' },
      { path: 'uploads/project-platform/schema.sql', name: 'schema.sql' }
    ],
    directories: ['~/dev/wolffish-cloud/apps/api'],
    createdAt: at(188, 10, 12),
    updatedAt: at(2, 11, 40)
  },
  {
    id: PROJECT_MOBILE,
    title: 'Mobile App Release',
    icon: '📱',
    instructions: `The Expo companion app, shipped through EAS to TestFlight and Play internal testing. Work in ~/dev/wolffish-cloud/apps/mobile.

Release checklist before any build: fingerprint drift fixed, changelog entry written, the crash-free rate from the last build above 99.5%. Crash triage groups by device and OS first, then by screen. Never submit to the stores from a conversation — hand the command back.`,
    files: [
      { path: 'uploads/project-mobile/release-checklist.md', name: 'release-checklist.md' },
      { path: 'uploads/project-mobile/device-matrix.csv', name: 'device-matrix.csv' }
    ],
    directories: ['~/dev/wolffish-cloud/apps/mobile'],
    createdAt: at(141, 9, 5),
    updatedAt: at(4, 16, 22)
  },
  {
    id: PROJECT_INFRA,
    title: 'Infra & Cost',
    icon: '☁️',
    instructions: `Cloudflare, DeepInfra and the staging Postgres bill. Bandar owns the accounts; you own the numbers.

Every cost figure starts from the invoice line items, never from a dashboard estimate. Forecasts show the assumption beside the number. Deliver spreadsheets with a header row and frozen panes, and a chart for anything with a trend.`,
    files: [
      { path: 'uploads/project-infra/cost-model-assumptions.md', name: 'cost-model-assumptions.md' },
      { path: 'uploads/project-infra/cloudflare-invoice-2026-08.csv', name: 'cloudflare-invoice-2026-08.csv' }
    ],
    createdAt: at(96, 14, 30),
    updatedAt: at(1, 9, 48)
  },
  {
    id: PROJECT_HIRING,
    title: 'Hiring Loop',
    icon: '🧑‍💻',
    instructions: `The platform engineer hiring loop with Majed. Score every take-home against the rubric in the project files — the five criteria, 1 to 5 each — and never guess a score from a skim.

Feedback is written for the candidate, not for us: specific, kind, with one thing to keep and one thing to change. Names and emails stay out of any file that leaves this project.`,
    files: [
      { path: 'uploads/project-hiring/take-home-rubric.md', name: 'take-home-rubric.md' },
      { path: 'uploads/project-hiring/interview-loop.md', name: 'interview-loop.md' }
    ],
    createdAt: at(63, 11, 0),
    updatedAt: at(3, 15, 12)
  },
  {
    id: PROJECT_DOCS,
    title: 'Docs & Onboarding',
    icon: '📚',
    instructions: `The Mintlify docs (EN + AR) and the new-engineer onboarding guide. Arabic pages are full translations, not summaries, and keep every code block, path and command in English.

A docs change ships with the feature, not after it. Preview every page in the browser before handing it back.`,
    files: [{ path: 'uploads/project-docs/style-guide.md', name: 'style-guide.md' }],
    directories: ['~/dev/wolffish-cloud/apps/site/docs'],
    createdAt: at(54, 13, 20),
    updatedAt: at(6, 10, 5)
  }
]

/** Text content of the project files, so opening one shows the real document. */
export const PROJECT_FILES: Record<string, string> = {
  'uploads/project-platform/api-conventions.md': `# API conventions

## Routes
- One Worker, one router. Every route lives under \`src/routes/\` and is registered in \`src/index.ts\`.
- Public: \`/auth/*\`, \`/health\`. Session: \`/v1/*\`, \`/ai/v1/*\`. Admin: \`/v1/admin/*\` — re-verified server-side against \`lib/permissions.ts\`.

## Responses
- JSON only. Errors are \`{ error: <code>, detail?: <string> }\` with the code from \`lib/errors.ts\`.
- Never leak a provider error body to the client; log it, return the code.

## Data
- D1 is the master. R2 holds blobs. KV is a cache and may be empty at any moment.
- Every write is idempotent by an id the client minted. Replays are no-ops.
- Migrations are numbered, forward-only, and reviewed by two people.

## Latency
- Budget: p95 under 800 ms for \`/ai/v1/chat/completions\` admission, under 120 ms for everything else.
- A query that shows up in \`pg_stat_statements\` above 50 ms mean gets an index or a rewrite, not a comment.
`,
  'uploads/project-platform/endpoints.csv': `method,path,auth,p95_ms_budget,owner
POST,/auth/login,public,300,younes
POST,/auth/refresh,public,200,younes
POST,/ai/v1/chat/completions,session,800,younes
POST,/v1/search,session,600,younes
GET,/v1/sync/bootstrap,session,120,younes
POST,/v1/sync/outbox,session,120,younes
GET,/v1/models,session,60,younes
GET,/v1/leaderboard,session,120,sara
GET,/v1/admin/roster,admin,200,younes
POST,/v1/admin/invite,admin,400,younes
GET,/v1/admin/audit,admin,150,younes
`,
  'uploads/project-platform/schema.sql': `-- Master tables (D1). Forward-only migrations in migrations/.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','support','employee')),
  status TEXT NOT NULL DEFAULT 'active',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  position TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_login_at TEXT
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  channel TEXT,
  project_id TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);
CREATE INDEX conversations_user_updated ON conversations(user_id, updated_at DESC);

CREATE TABLE usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  model TEXT NOT NULL,
  kind TEXT NOT NULL,
  tokens_in INTEGER NOT NULL,
  tokens_out INTEGER NOT NULL,
  tokens_cached INTEGER NOT NULL DEFAULT 0,
  cost_microusd INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX usage_user_day ON usage(user_id, created_at);
`,
  'uploads/project-mobile/release-checklist.md': `# Release checklist — mobile

1. \`npm run fix:fingerprint\` — no drift between the committed and computed fingerprint.
2. Changelog entry under \`src/changelog/\` for the version being cut.
3. Crash-free sessions on the previous build ≥ 99.5% (Sentry, last 7 days).
4. \`npm run ts:check\` and \`npm test\` green on main.
5. EAS build with the \`production\` profile, both platforms.
6. TestFlight + Play internal testing for 24 hours before promotion.
7. Store submission is a human step — never from an agent turn.
`,
  'uploads/project-mobile/device-matrix.csv': `device,os,share_pct,tier
iPhone 17 Pro,iOS 26.1,21.4,1
iPhone 16,iOS 26.0,18.9,1
iPhone 15,iOS 25.6,14.2,1
Samsung Galaxy S26,Android 17,11.8,1
Samsung Galaxy A56,Android 16,9.1,2
Pixel 10,Android 17,6.3,2
iPhone 14,iOS 25.6,5.7,2
Xiaomi 15,Android 16,4.4,3
OnePlus 13,Android 16,2.8,3
Other,various,5.4,3
`,
  'uploads/project-infra/cost-model-assumptions.md': `# Cost model assumptions

- Seats: 200 today, 260 by December (hiring plan from Majed, 2026-08-28).
- Inference: DeepSeek V4 Flash for 85% of tokens, Pro for 15%. Blended from the August usage rollup.
- Tokens per seat per month: 1.9M in, 0.31M out, 38% cache hit (August, org-wide).
- Cloudflare: Workers Paid, D1, R2 (Class A ops dominate after the sync engine change), KV.
- Search: Brave Pro plan, $5 per 1,000 queries after the included 20,000.
- FX: SAR pegged at 3.75.
- Every forecast row shows the assumption it multiplies.
`,
  'uploads/project-infra/cloudflare-invoice-2026-08.csv': `line_item,quantity,unit,unit_price_usd,amount_usd
Workers Paid plan,1,month,5.00,5.00
Workers requests,48.2,million,0.30,14.46
Workers CPU time,1120,million ms,0.02,22.40
D1 rows read,912,million,0.001,912.00
D1 rows written,41,million,1.00,41.00
D1 storage,18.4,GB,0.75,13.80
R2 storage,214,GB-month,0.015,3.21
R2 Class A operations,38.6,million,4.50,173.70
R2 Class B operations,12.1,million,0.36,4.36
KV reads,9.4,million,0.50,4.70
KV writes,0.8,million,5.00,4.00
Durable Objects requests,6.2,million,0.15,0.93
Durable Objects duration,410,GB-s,12.50,5.13
`,
  'uploads/project-hiring/take-home-rubric.md': `# Take-home rubric — platform engineer

Score each 1–5. A 3 is "would pass review with comments."

1. **Correctness** — does it do what the brief asked, including the edge cases named in the brief?
2. **Data model** — are the tables and ids the ones a real system would keep? Idempotency where writes can replay?
3. **Failure handling** — what happens on a timeout, a duplicate, a bad input? Is it visible in the code?
4. **Tests** — do they test behaviour, not implementation? Would they catch the bug you would introduce?
5. **Communication** — README, commit messages, the note that explains the trade-off they took.

Total out of 25. Under 15: no. 15–18: discuss. 19+: onsite.
`,
  'uploads/project-hiring/interview-loop.md': `# Interview loop

1. Recruiter screen — 30 min (Majed).
2. Take-home — 4 hours, one week window. Scored against the rubric by two engineers independently.
3. Technical deep-dive — 60 min on the take-home (Younes + one platform engineer).
4. Systems conversation — 45 min (Nawaf).
5. Values — 30 min (Majed).

Debrief within 24 hours of the last step. Every score is written before the debrief, not during it.
`,
  'uploads/project-docs/style-guide.md': `# Docs style guide

- Sentence case for headings. No trailing periods in headings.
- Every page opens with what the reader can do after reading it.
- Commands in fenced blocks with the shell named. One command per block.
- Paths, flags, env vars and endpoints in code font, in English, in both languages.
- Arabic pages: full translations. Numbers use Western digits. Ranges use a hyphen-minus.
- Screenshots only when the UI is the subject. Never a screenshot of a terminal.
`
}
