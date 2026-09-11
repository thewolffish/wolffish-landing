import type {
  AdminAccess,
  AdminAuditEntry,
  AdminConversationRow,
  AdminOrgSettings,
  AdminRoster,
  AdminUserOverview,
  PlanCeilings,
  RosterPerson,
  TokenPlan
} from './types'
import { daysAgo, drawer, hoursAgo, iso, isoDay, minutesAgo, NOW } from './clock'
import { FLASH, PRO } from './catalog'
import { ORG_NAME, USER, USER_ID } from './identity'
import { ROSTER, personById, type Person } from './roster'

export const ADMIN_ACCESS: AdminAccess = {
  canRead: true,
  canWrite: true,
  isOwner: true,
  role: USER.role,
  email: USER.email
}

export const PLANS: Record<TokenPlan, PlanCeilings> = {
  standard: { monthlyIn: 60_000_000, monthlyOut: 8_000_000 },
  high: { monthlyIn: 240_000_000, monthlyOut: 30_000_000 },
  unmetered: { monthlyIn: 0, monthlyOut: 0 }
}

const ROSTER_DAYS = 30

function monthStart(): number {
  const d = new Date(NOW)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Everyone starts on `standard`; the platform and DevOps people run `high`. */
function planFor(p: Person): TokenPlan {
  if (p.n === 0 || p.n === 50) return 'unmetered'
  if (/devops|reliability|data engineer|senior software/i.test(p.position)) return 'high'
  return 'standard'
}

/**
 * Who sees what in the model picker. Both owners and both admins hold the
 * full catalog by an explicit row — an owner locked out of a model the org
 * runs cannot administer it — which is the same list as the baseline today;
 * the row is the shape, kept for the day the catalog grows. 021-030 were the
 * vision pilot until 2026-09-11; V4.1 Flash sees for every account, so the
 * grant retired with the model and they are back on the plain baseline.
 */
function allowedModelsFor(p: Person): string[] | null {
  if (p.n === 0 || p.n === 50 || p.role === 'admin') return [FLASH, PRO]
  if (p.n >= 5 && p.n <= 14) return [FLASH]
  if (p.n >= 15 && p.n <= 30) return null
  return [FLASH, PRO]
}

function rosterPerson(p: Person): RosterPerson {
  const rnd = drawer(`roster-${p.id}`)
  const engineer = /engineer|devops|reliability|data|qa|lead|manager/i.test(p.position)
  const base = p.status === 'invited' ? 0 : p.status === 'suspended' ? 0.15 : engineer ? 1 : 0.4
  const requests = Math.round((140 + rnd() * 900) * base)
  const tokensIn = Math.round((6_000_000 + rnd() * 34_000_000) * base)
  const tokensOut = Math.round(tokensIn * (0.11 + rnd() * 0.06))
  const tokensCached = Math.round(tokensIn * (0.28 + rnd() * 0.2))
  const pro = 0.1 + rnd() * 0.1
  const cost =
    ((tokensIn - tokensCached) * (200_000 * (1 - pro) + 1_300_000 * pro) +
      tokensCached * (6_000 * (1 - pro) + 100_000 * pro) +
      tokensOut * (600_000 * (1 - pro) + 2_600_000 * pro)) /
    1_000_000
  const monthFraction = Math.min(1, (NOW - monthStart()) / (ROSTER_DAYS * 86_400_000))
  const me = p.id === USER_ID
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    status: p.status,
    must_change_password: p.status === 'invited' ? 1 : 0,
    created_at: iso(daysAgo(212 - Math.round(rnd() * 150))),
    last_login_at:
      p.status === 'invited' ? null : iso(me ? minutesAgo(3) : hoursAgo(Math.round(rnd() * 96))),
    token_plan: planFor(p),
    ceilings: PLANS[planFor(p)],
    daily_token_cap: p.n >= 5 && p.n <= 9 ? 4_000_000 : null,
    daily_search_cap: p.n >= 5 && p.n <= 9 ? 100 : null,
    requests: me ? 1_912 : requests,
    denied: Math.round(requests * (rnd() < 0.2 ? 0.02 : 0)),
    tokens_in: me ? 41_204_330 : tokensIn,
    tokens_out: me ? 5_811_206 : tokensOut,
    tokens_cached: me ? 15_902_118 : tokensCached,
    cost_microusd: Math.round(me ? 21_384_112 : cost),
    searches: Math.round((30 + rnd() * 420) * base),
    days_active: p.status === 'invited' ? 0 : Math.min(ROSTER_DAYS, Math.round(8 + rnd() * 20)),
    last_active_day: p.status === 'invited' ? null : isoDay(daysAgo(Math.round(rnd() * 4))),
    month_tokens_in: Math.round((me ? 41_204_330 : tokensIn) * monthFraction),
    month_tokens_out: Math.round((me ? 5_811_206 : tokensOut) * monthFraction),
    month_cost_microusd: Math.round((me ? 21_384_112 : cost) * monthFraction),
    month_searches: Math.round((30 + rnd() * 420) * base * monthFraction),
    devices: p.status === 'invited' ? 0 : 1 + (rnd() < 0.2 ? 1 : 0),
    phones: p.status === 'invited' ? 0 : rnd() < 0.55 ? 1 : 0,
    conversations: me ? 412 : Math.round((20 + rnd() * 300) * base)
  }
}

export const ADMIN_ROSTER: AdminRoster = {
  since: iso(daysAgo(ROSTER_DAYS)),
  days: ROSTER_DAYS,
  month_start: iso(monthStart()),
  plans: PLANS,
  people: ROSTER.map(rosterPerson)
}

export const ORG_SETTINGS: AdminOrgSettings = {
  id: 1,
  name: ORG_NAME,
  default_model: FLASH,
  default_allowed_models: JSON.stringify([FLASH, PRO]),
  user_daily_token_cap: 8_000_000,
  org_monthly_token_cap: 4_000_000_000,
  search_enabled: 1,
  user_daily_search_cap: 400,
  org_monthly_search_cap: 60_000,
  created_at: iso(daysAgo(212)),
  updated_at: iso(daysAgo(6))
}

export const ORG_GATES: Record<string, unknown> = {
  model: {
    admitted: 3,
    waiting: 0,
    capacity: 48,
    hosts: [
      { id: 'deepinfra-primary', concurrency: 32, inFlight: 3, cooldownUntil: null },
      { id: 'deepinfra-secondary', concurrency: 16, inFlight: 0, cooldownUntil: null }
    ]
  },
  search: { admitted: 0, waiting: 0, capacity: 20 },
  quotas: { orgMonthTokens: 1_912_448_120, orgMonthSearches: 4_812 }
}

const AUDIT_ACTIONS: Array<[string, string, string]> = [
  ['user.invite', 'usr_demo_049', 'Invited ruba.alsanea@wolffi.sh as employee'],
  ['policy.set', 'usr_demo_027', 'Allowed models cleared to the org baseline — the vision pilot ended'],
  ['user.suspend', 'usr_demo_048', 'Suspended talal.alkhathlan@wolffi.sh — contractor offboarded'],
  ['org.patch', 'org', 'user_daily_token_cap 6,000,000 → 8,000,000'],
  ['plan.set', 'usr_demo_011', 'Plan standard → high'],
  ['session.revoke', 'usr_demo_033', 'Revoked 2 sessions — lost laptop'],
  ['pin.clear', 'usr_demo_019', 'Cleared PIN on device dev_7f21 at the user\'s request'],
  ['capability.grant', 'computer-use', 'Granted to team platform'],
  ['policy.set', 'usr_demo_008', 'daily_search_cap set to 100'],
  ['user.role', 'usr_demo_002', 'Role support → admin'],
  ['org.patch', 'org', 'default_model set to DeepSeek V4.1 Flash — it sees, so no vision grant'],
  ['user.invite', 'usr_demo_047', 'Invited abrar.almogbel@wolffi.sh as employee'],
  ['password.reset', 'usr_demo_036', 'Temporary password issued'],
  ['capability.publish', 'pdf-design', 'Published pdf-design 1.3.0 to the registry'],
  ['user.activate', 'usr_demo_047', 'Account activated from the emailed code']
]

export const ADMIN_AUDIT: AdminAuditEntry[] = AUDIT_ACTIONS.map(([action, target, detail], i) => {
  const actor = i % 4 === 0 ? personById('usr_demo_001') : personById(USER_ID)
  return {
    id: 4_120 - i,
    actor_user_id: actor?.id ?? USER_ID,
    actor_name: actor?.name ?? USER.name,
    actor_email: actor?.email ?? USER.email,
    action,
    target,
    detail,
    created_at: iso(NOW - (i * 7 + 3) * 3_600_000 - i * 11 * 60_000)
  }
})

const CONVERSATION_TITLES = [
  'Draft the Q3 customer newsletter',
  'Summarise the support queue for Monday',
  'Fix the flaky onboarding test',
  'Compare the two CRM proposals',
  'Reconcile the marketing spend sheet',
  'Prepare the renewal call notes',
  'Rewrite the pricing page FAQ',
  'Triage the weekend alerts',
  'Convert the webinar recording to clips',
  'Build the pipeline coverage chart',
  'Translate the release email to Arabic',
  'Review the vendor security questionnaire',
  'Plan the sprint 43 capacity',
  'Write the incident summary for leadership',
  'Extract the invoices into the ledger',
  'Draft the job posting for a data engineer',
  'Audit the shared drive for stale docs',
  'Summarise the customer interviews',
  'Build the churn cohort workbook',
  'Prepare the board slide on usage'
]

export function adminConversationsFor(userId: string): AdminConversationRow[] {
  const rnd = drawer(`admin-conversations-${userId}`)
  const count = 6 + Math.round(rnd() * 8)
  const rows: AdminConversationRow[] = []
  for (let i = 0; i < count; i++) {
    const created = NOW - Math.round(rnd() * 40 * 86_400_000)
    const updated = created + Math.round(rnd() * 4 * 3_600_000)
    const channel = rnd() < 0.15 ? 'mobile' : rnd() < 0.2 ? 'heartbeat' : 'electron'
    rows.push({
      id: `conv_${userId.slice(-3)}_${i}`,
      title: CONVERSATION_TITLES[Math.floor(rnd() * CONVERSATION_TITLES.length)],
      device_id: channel === 'mobile' ? 'dev_phone' : 'dev_mac',
      created_at: iso(created),
      updated_at: iso(updated),
      archived_at: null,
      model: rnd() < 0.8 ? FLASH : PRO,
      channel,
      icon: channel === 'heartbeat' ? '🗓️' : null,
      project_id: null,
      sealed: channel === 'heartbeat' ? 1 : 0,
      summary: null,
      stats: null,
      message_count: 2 + Math.round(rnd() * 10) * 2
    })
  }
  return rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export function adminUserOverview(userId: string): AdminUserOverview | null {
  const p = personById(userId)
  const r = ADMIN_ROSTER.people.find((x) => x.id === userId)
  if (!p || !r) return null
  const rnd = drawer(`overview-${userId}`)
  const daily = []
  for (let back = 29; back >= 0; back--) {
    const ms = daysAgo(back)
    const dow = new Date(ms).getDay()
    const weekend = dow === 5 || dow === 6
    const scale = r.status === 'invited' ? 0 : weekend ? 0.15 : 0.6 + rnd() * 0.8
    const tokensIn = Math.round((r.tokens_in / 22) * scale)
    daily.push({
      day: isoDay(ms),
      requests: Math.round((r.requests / 22) * scale),
      tokens_in: tokensIn,
      tokens_out: Math.round((r.tokens_out / 22) * scale),
      cost_microusd: Math.round((r.cost_microusd / 22) * scale),
      searches: Math.round((r.searches / 22) * scale)
    })
  }
  const allowed = allowedModelsFor(p)
  const devices = []
  if (r.devices > 0) {
    devices.push({
      id: `dev_${userId.slice(-3)}_mac`,
      platform: 'darwin',
      name: `${p.name.split(' ')[0]}'s MacBook Pro`,
      app_version: '1.4.2',
      status: 'active',
      pin_set: 1,
      pin_clear_requested: 0,
      created_at: r.created_at,
      last_seen_at: r.last_login_at
    })
  }
  if (r.phones > 0) {
    devices.push({
      id: `dev_${userId.slice(-3)}_phone`,
      platform: 'mobile',
      name: `${p.name.split(' ')[0]}'s iPhone`,
      app_version: '1.0.52',
      status: 'active',
      pin_set: 0,
      pin_clear_requested: 0,
      created_at: iso(daysAgo(41)),
      last_seen_at: iso(hoursAgo(1 + Math.round(rnd() * 20)))
    })
  }
  const sessions = devices.map((d, i) => ({
    id: `ses_${userId.slice(-3)}_${i}`,
    device_id: d.id,
    issued_at: iso(daysAgo(3 + i)),
    refreshed_at: iso(minutesAgo(9 + i * 40)),
    expires_at: iso(NOW + 12 * 3_600_000),
    revoked_at: null,
    revoked_by: null
  }))
  const recent = []
  for (let i = 0; i < 12; i++) {
    const model = rnd() < 0.82 ? FLASH : PRO
    const tokensIn = Math.round(4_000 + rnd() * 60_000)
    const tokensOut = Math.round(300 + rnd() * 3_000)
    const cached = Math.round(tokensIn * rnd() * 0.5)
    const isSearch = rnd() < 0.15
    recent.push({
      id: 88_120 - i,
      device_id: devices[0]?.id ?? null,
      model: isSearch ? 'brave' : model,
      kind: isSearch ? 'search' : 'chat',
      surface: rnd() < 0.2 ? 'mobile' : 'desktop',
      upstream: isSearch ? 'brave' : 'deepinfra',
      tokens_in: isSearch ? 0 : tokensIn,
      tokens_out: isSearch ? 0 : tokensOut,
      tokens_cached: isSearch ? 0 : cached,
      cost_microusd: isSearch
        ? 5_000
        : Math.round(
            ((tokensIn - cached) * (model === PRO ? 1_300_000 : 200_000) +
              cached * (model === PRO ? 100_000 : 6_000) +
              tokensOut * (model === PRO ? 2_600_000 : 600_000)) /
              1_000_000
          ),
      latency_ms: Math.round(isSearch ? 280 + rnd() * 400 : 900 + rnd() * 9_000),
      decision: 'allowed',
      error: null,
      created_at: iso(NOW - i * (11 + Math.round(rnd() * 50)) * 60_000)
    })
  }
  return {
    user: {
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role,
      status: p.status,
      must_change_password: r.must_change_password,
      phone: p.phone,
      position: p.position,
      bio: p.bio,
      created_at: r.created_at,
      updated_at: iso(daysAgo(2)),
      last_login_at: r.last_login_at,
      temp_password_expires_at: p.status === 'invited' ? iso(NOW + 5 * 86_400_000) : null
    },
    window: { since: ADMIN_ROSTER.since, days: ROSTER_DAYS, month_start: ADMIN_ROSTER.month_start },
    policy: {
      token_plan: r.token_plan,
      ceilings: r.ceilings,
      allowed_models: allowed ? JSON.stringify(allowed) : null,
      daily_token_cap: r.daily_token_cap,
      daily_search_cap: r.daily_search_cap,
      updated_at: iso(daysAgo(9))
    },
    plans: PLANS,
    standing: {
      tokens: {
        userDayUsed: daily[daily.length - 1]?.tokens_in ?? 0,
        orgMonthUsed: 1_912_448_120,
        userMonthIn: r.month_tokens_in,
        userMonthOut: r.month_tokens_out
      },
      searches: { userDayUsed: daily[daily.length - 1]?.searches ?? 0, orgMonthUsed: 4_812 }
    },
    lanes: [
      {
        kind: 'chat',
        requests: r.requests,
        denied: r.denied,
        tokens_in: r.tokens_in,
        tokens_out: r.tokens_out,
        tokens_cached: r.tokens_cached,
        cost_microusd: r.cost_microusd,
        month_requests: Math.round(r.requests * 0.4),
        month_tokens_in: r.month_tokens_in,
        month_tokens_out: r.month_tokens_out,
        month_cost_microusd: r.month_cost_microusd
      },
      {
        kind: 'search',
        requests: r.searches,
        denied: 0,
        tokens_in: 0,
        tokens_out: 0,
        tokens_cached: 0,
        cost_microusd: r.searches * 5_000,
        month_requests: r.month_searches,
        month_tokens_in: 0,
        month_tokens_out: 0,
        month_cost_microusd: r.month_searches * 5_000
      }
    ],
    surfaces: [
      {
        surface: 'desktop',
        kind: 'chat',
        requests: Math.round(r.requests * 0.78),
        denied: r.denied,
        tokens_in: Math.round(r.tokens_in * 0.8),
        tokens_out: Math.round(r.tokens_out * 0.8),
        cost_microusd: Math.round(r.cost_microusd * 0.8)
      },
      {
        surface: 'mobile',
        kind: 'chat',
        requests: Math.round(r.requests * 0.12),
        denied: 0,
        tokens_in: Math.round(r.tokens_in * 0.1),
        tokens_out: Math.round(r.tokens_out * 0.1),
        cost_microusd: Math.round(r.cost_microusd * 0.1)
      },
      {
        surface: 'heartbeat',
        kind: 'chat',
        requests: Math.round(r.requests * 0.1),
        denied: 0,
        tokens_in: Math.round(r.tokens_in * 0.1),
        tokens_out: Math.round(r.tokens_out * 0.1),
        cost_microusd: Math.round(r.cost_microusd * 0.1)
      },
      {
        surface: 'desktop',
        kind: 'search',
        requests: r.searches,
        denied: 0,
        tokens_in: 0,
        tokens_out: 0,
        cost_microusd: r.searches * 5_000
      }
    ],
    daily,
    devices,
    sessions,
    recent,
    counts: {
      conversations: r.conversations,
      files: Math.round(r.conversations * 1.7),
      bytes: Math.round(r.conversations * 2_400_000)
    }
  }
}
