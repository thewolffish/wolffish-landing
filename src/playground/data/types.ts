/**
 * Data shapes for the Wolffish Cloud playground — a port of the desktop's
 * preload contract (apps/desktop/src/preload/index.ts) trimmed to what the
 * replica renders. Every page reads these, and every demo fixture is typed
 * against them, so a fixture that drifts from the desktop's shape fails to
 * compile instead of rendering a plausible-looking card with a hole in it.
 */

export type Locale = 'en' | 'ar'
export type ThemeSource = 'system' | 'light' | 'dark'

// ── Turn segments (apps/desktop/src/main/runtime/broca.ts) ───────────────

export type SegmentTurnEndReason =
  | 'end_turn'
  | 'tool_use'
  | 'max_tokens'
  | 'error'
  | 'no_provider_available'

export type ToolResultStatus = 'success' | 'failed' | 'denied'

export type SegmentWorker = { id: string; label: string }

export type WorkflowPhaseStatus = 'pending' | 'active' | 'done' | 'failed'

export type WorkflowAgentView = {
  id: string
  name: string
  task: string
  phase?: string
  provider: string
  model: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: number
  endedAt?: number
  llmCalls: number
  toolCalls: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  cost: number
  resultChars?: number
}

export type WorkflowSnapshot = {
  workflowId: string
  status: 'running' | 'completed' | 'canceled' | 'error'
  startedAt: number
  endedAt?: number
  note?: string
  phases: Array<{ title: string; status: WorkflowPhaseStatus }>
  agents: WorkflowAgentView[]
  totals: {
    agents: number
    toolCalls: number
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheWriteTokens: number
    cost: number
  }
  master?: {
    llmCalls: number
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheWriteTokens: number
    cost: number
  }
}

export type NoProviderAvailableInfo = {
  provider: string
  providerLogo: string
  statusCode: number | null
  errorReason: string
  errorDetail: string | null
  retriesAttempted: number
  totalDurationMs: number
}

/**
 * The change a file tool made, as the plugin recorded it (broca
 * ToolResultDiff). UI-only: the model sees the tool's text output.
 */
export type ToolResultDiff = {
  file: string
  /** Standard unified diff text (`--- a/…`, `+++ b/…`, `@@` hunks). */
  patch: string
  additions: number
  deletions: number
  kind: 'edit' | 'create' | 'overwrite'
}

/**
 * Structured facts about a tool result, for the UI only — the model reads
 * `output`, the user sees what `meta` renders. Optional on every result.
 */
export type ToolResultMeta = {
  diff?: ToolResultDiff
  /** Shell exit code, null when killed. */
  exitCode?: number | null
  durationMs?: number
  /** Absolute path of the full output when it was spilled to disk. */
  outputPath?: string
  truncated?: boolean
  /** The directory a command ran in. */
  cwd?: string
  /** A short human label chosen by the tool (e.g. "Run tests"). */
  label?: string
}

/**
 * The tools whose call changes the user's project — an edit, a write, a
 * shell run. Every clean feed shows these as a compact activity row even
 * with verbose off; every other tool call stays mechanics.
 */
export const CODE_ACTIVITY_TOOLS: ReadonlySet<string> = new Set([
  'file_edit',
  'file_write',
  'file_patch',
  'shell_exec'
])

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

/**
 * One item of the model's task list (todo_write). The whole list rides every
 * `todo` segment; consumers upsert by turnId so a turn shows exactly ONE
 * checklist card, at the position of its first write, in its latest state.
 */
export type TodoItem = {
  content: string
  status: TodoStatus
  priority?: 'high' | 'medium' | 'low'
}

export type Segment =
  | { kind: 'text'; turnId: string; segmentId: string; delta: string; worker?: SegmentWorker }
  | { kind: 'reasoning'; turnId: string; segmentId: string; delta: string; worker?: SegmentWorker }
  | {
      kind: 'tool_call'
      turnId: string
      segmentId: string
      toolCallId: string
      name: string
      args: Record<string, unknown>
      worker?: SegmentWorker
    }
  | {
      kind: 'tool_result'
      turnId: string
      segmentId: string
      toolCallId: string
      status: ToolResultStatus
      output: string
      error?: string
      /** UI-only structured facts (diff, exit code, duration). See ToolResultMeta. */
      meta?: ToolResultMeta
      worker?: SegmentWorker
    }
  | {
      /**
       * The model's task list after a todo_write call (see TodoItem).
       * Replace-by-turnId semantics — NOT append — so a turn carries one
       * checklist card in its latest state. Display-only: the model keeps
       * the list through the todo_write result it already has.
       */
      kind: 'todo'
      turnId: string
      segmentId: string
      items: TodoItem[]
      /**
       * The list this write belongs to — the turnId of the turn that created
       * it. Absent (or equal to turnId) on the creating write. A later turn
       * that continues an open list writes with the ORIGINAL list id, and
       * every renderer draws that card, at its original position, in the
       * latest state (latestTodoLists).
       */
      listId?: string
    }
  | { kind: 'active_model'; turnId: string; segmentId: string; provider: string; model: string }
  | {
      kind: 'turn_end'
      turnId: string
      segmentId: string
      stopReason: SegmentTurnEndReason
      iterationCount: number
      providerErrors?: NoProviderAvailableInfo[]
      reasoningContent?: string
    }
  | { kind: 'separator'; turnId: string; segmentId: string }
  | { kind: 'workflow'; turnId: string; segmentId: string; snapshot: WorkflowSnapshot }
  | {
      kind: 'compaction_started'
      turnId: string
      segmentId: string
      messagesCount: number
      targetsCount: number
      tokenCount: number
      tokenBudget: number
      startedAt: number
    }
  | {
      kind: 'compaction'
      turnId: string
      segmentId: string
      targetsCount: number
      tokensSaved: number
      durationMs: number
      details: Array<{
        toolName?: string
        originalChars: number
        compactedChars: number
        compactedBy: string
      }>
    }

export type ToolCallSegment = Extract<Segment, { kind: 'tool_call' }>
export type ToolResultSegment = Extract<Segment, { kind: 'tool_result' }>

// ── Approvals and ask cards ──────────────────────────────────────────────

export type DangerLevel = 'safe' | 'warn' | 'confirm' | 'destructive' | 'block'
export type ApprovalDecision = 'approved' | 'denied' | 'approved_session'
export type RiskLevel = 'low' | 'medium' | 'high'

export type ApprovalDescription = {
  title: string
  description: string
  command?: string
  impact?: string
  risk: RiskLevel
}

export type PersistedApproval = {
  approvalId: string
  toolCallId: string
  tool: string
  args: Record<string, unknown>
  reason: string
  level: DangerLevel
  description?: ApprovalDescription
  decision?: ApprovalDecision
}

export type ApprovalCardState = PersistedApproval

export type AskUserOption = { label: string; description?: string }

export type AskUserQuestion = {
  question: string
  details?: string
  options: AskUserOption[]
  allowOther: boolean
  otherLabel?: string
  otherDescription?: string
}

export type AskUserAnswer = { kind: 'option'; index: number } | { kind: 'custom'; text: string }

export type AskUserResponse =
  | { kind: 'answered'; answers: AskUserAnswer[] }
  | { kind: 'canceled' }
  | { kind: 'unsupported' }

export type AskCardState = {
  askId: string
  toolCallId: string
  questions: AskUserQuestion[]
  answers?: AskUserAnswer[]
  answered?: boolean
}

// ── Conversations ────────────────────────────────────────────────────────

export type MessageAttachmentType = 'audio' | 'video' | 'image' | 'pdf' | 'other'

export type MessageAttachment = {
  type: MessageAttachmentType
  /** Path relative to workspace root, e.g. "uploads/conv-…/photo.png". */
  filePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  durationSeconds?: number
}

export type PersistedToolTiming = { startedAt: number; endedAt?: number }
export type ToolTiming = PersistedToolTiming

export type ConversationMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  segments?: Segment[]
  approvals?: Record<string, PersistedApproval>
  toolTimings?: Record<string, PersistedToolTiming>
  stopReason?: SegmentTurnEndReason
  error?: string
  attachments?: MessageAttachment[]
  voicePrompt?: boolean
  voiceLang?: string
}

export type ConversationChannel = 'electron' | 'mobile' | 'heartbeat' | 'procedure'

export type TimelineEntry = {
  id: string
  timestamp: number
  kind: string
  summary?: string
  detail?: string
}

export type ConversationTurnStats = {
  endedAt: number
  elapsedMs: number
  apiMs: number
  apiCalls: number
  toolCalls: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  cost: number
  provider: string | null
  model: string | null
}

export type ConversationStats = {
  allTime: {
    processingMs: number
    apiMs: number
    turns: number
    apiCalls: number
    toolCalls: number
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheCreationTokens: number
    cost: number
  }
  lastTurn: ConversationTurnStats | null
  meter: {
    contextTokens: number
    contextBudget: number
    compactionAt?: number | null
    model?: string | null
  } | null
}

export type ConversationFile = {
  id: string
  title: string
  model: string | null
  messages: ConversationMessage[]
  createdAt: number
  updatedAt: number
  channel?: ConversationChannel
  projectId?: string
  icon?: string
  sealed?: boolean
  workingFolder?: string[] | null
  contextFiles?: string[] | null
  stats?: ConversationStats | null
  timeline?: TimelineEntry[]
  summary?: string | null
  /**
   * Playground-only: text content for workspace paths this conversation
   * produced (markdown, csv, json, chart specs, code). Binary types resolve to
   * the published sample for their extension instead (see lib/files.ts).
   */
  files?: Record<string, string>
}

export type ConversationMeta = {
  id: string
  title: string
  updatedAt: number
  channel?: ConversationChannel
  projectId?: string
  icon?: string
  messageCount: number
}

// ── Feed messages (the renderer's shape, apps/desktop providers/flow) ────

export type AssistantStatus = 'streaming' | 'complete' | 'error'

export type UserMessage = {
  id: string
  role: 'user'
  content: string
  attachments?: MessageAttachment[]
  voicePrompt?: boolean
  voiceLang?: string
  transcribing?: boolean
  timestamp?: number
}

export type AssistantMessage = {
  id: string
  role: 'assistant'
  segments: Segment[]
  approvals?: Record<string, ApprovalCardState>
  asks?: Record<string, AskCardState>
  toolTimings?: Record<string, ToolTiming>
  status: AssistantStatus
  stopReason?: SegmentTurnEndReason
  error?: string
  timestamp?: number
}

export type ChatMessage = UserMessage | AssistantMessage

export type ConversationRunPhase = 'processing' | 'completed' | 'failed' | 'stopped'

export type ConversationRunStatus = {
  phase: ConversationRunPhase
  channel: string
  title: string | null
  at: number
}

// ── Workspace config ─────────────────────────────────────────────────────

export type ThinkingMode = 'off' | 'on' | 'high' | 'max'
export type ChatMode = 'single' | 'workflow'
export type WeekStartsOn = 0 | 1

export type SafetyConfig = { bypassPermissions: boolean; blockCredentials: boolean }

export type InAppConfig = { verbose: boolean; reasoning: boolean }

export type SttConfig = { defaultModel: string; language: string }

export type TtsConfig = { defaultVoice: string; defaultSpeed: string; voiceReplies: boolean }

export type Variable = { name: string; value: string; sensitive: boolean }

export type ComputerUseConfig = { screenshotMaxWidth: number; screenshotFormat: 'jpeg' | 'png' }

export type BrowserExtensionConfig = {
  port: number
  screenshotMaxWidth: number
  screenshotFormat: 'jpeg' | 'png'
  screenshotQuality: number
}

export type CompactionConfig = {
  dailyHour: number
  weeklyDay: number
  weeklyHour: number
}

export type CompactionRunRecord = {
  at: number
  durationMs: number
  provider: string | null
  model: string | null
  inputTokens: number | null
  outputTokens: number | null
  output: string
}

export type CompactionRuns = {
  daily: CompactionRunRecord | null
  weekly: CompactionRunRecord | null
  reflection?: CompactionRunRecord | null
  deepClean?: CompactionRunRecord | null
}

export type ReflectionConfig = { hour: number; quietHours: number }

export type WorkspaceConfig = {
  version: 1
  launchAtStartup: boolean
  llm: {
    model: string | null
    mode: ChatMode
    thinkingModes: Record<string, ThinkingMode>
  }
  safety: SafetyConfig
  weekStartsOn: WeekStartsOn
  variables: Variable[]
  inapp: InAppConfig
  stt: SttConfig
  tts: TtsConfig
  computerUse: ComputerUseConfig
  browserExtension: BrowserExtensionConfig
  updates: { enabled: boolean }
  compaction: CompactionConfig
  reflection: ReflectionConfig
  locale: Locale
  theme: ThemeSource
  onboardingCompleted: boolean
}

export type SystemInfo = {
  totalRamBytes: number
  freeDiskBytes: number | null
  totalDiskBytes: number | null
  platform: 'darwin' | 'win32' | 'linux'
  arch: string
  cpuCount: number
  cpuModel: string
}

export type DataAnalytics = {
  workspaceBytes: number
  hippocampusBytes: number
  corpusBytes: number
  prefrontalBytes: number
  ramBytes: number
  cpuPercent: number
  totalRamBytes: number
  cpuCount: number
}

// ── Auth and profile ─────────────────────────────────────────────────────

export type AdminRole = 'owner' | 'admin' | 'support' | 'employee'

export type AuthUser = { email: string; name: string; role: AdminRole }

export type CloudProfile = {
  name: string
  email: string
  phone: string
  position: string
  bio: string
  role: AdminRole
  orgName: string | null
  pinSet: boolean
  hasAvatar: boolean
}

// ── Models ───────────────────────────────────────────────────────────────

export type CatalogModelEntry = {
  id: string
  name: string
  reasoning: boolean
  vision: boolean
  contextWindow: number
  inPerMtokMicroUsd: number
  outPerMtokMicroUsd: number
  cachedInPerMtokMicroUsd: number
  default: boolean
}

export type ModelCapabilities = {
  provider: string | null
  model: string | null
  supportsVision: boolean
  contextWindow: number
  compactionAt: number
}

// ── MCP ──────────────────────────────────────────────────────────────────

export type McpTransportKind = 'stdio' | 'http'
export type McpServerState = 'connected' | 'connecting' | 'needs-auth' | 'offline' | 'disabled'
export type McpHeader = { key: string; value: string; sensitive?: boolean }

export type McpServerSnapshot = {
  id: string
  name: string
  slug: string
  transport: McpTransportKind
  target: string
  enabled: boolean
  state: McpServerState
  toolCount: number
  toolNames: string[]
  headers?: McpHeader[]
  serverName?: string
  serverVersion?: string
  error?: string
  progress?: string
  lastConnectedAt?: number
}

// ── Capabilities ─────────────────────────────────────────────────────────

export type CapabilityEntry = {
  name: string
  description: string
  status: 'ok' | 'error'
  hasPlugin: boolean
  toolCount: number
  triggers: string[]
  requires: string[]
  official: boolean
  core: boolean
  wolffish: boolean
  tested: boolean
  enabled: boolean
  error?: string
}

// ── Usage and leaderboard ────────────────────────────────────────────────

export type UsageTimeRange = 'today' | 'this_month' | '3_months' | '6_months' | 'ytd' | 'all_time'

export type UsageProviderSummary = {
  provider: 'cloud'
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  models: Array<{ model: string; inputTokens: number; outputTokens: number; cost: number }>
}

export type UsageSummary = {
  providers: UsageProviderSummary[]
  brave: { totalQueries: number; totalCost: number }
}

export type UsageStats = {
  messages: number
  conversations: number
  activeDays: number
  longestStreak: number
  totalTokens: number
  favouriteModel: string | null
  totalCost: number
  topSpendDay: { date: string; cost: number } | null
}

export type UsageDailyEntry = { date: string; totalTokens: number }

export type LeaderboardRow = {
  rank: number
  user_id: string
  name: string
  role: string
  tokens: number
  conversations: number
  agentic_tasks: number
}

export type LeaderboardPage = {
  generated_at: string
  total: number
  board_size: number
  truncated: boolean
  limit: number
  offset: number
  rows: LeaderboardRow[]
  me: LeaderboardRow | null
}

// ── Admin ────────────────────────────────────────────────────────────────

export type AdminUserStatus = 'invited' | 'active' | 'suspended' | 'removed'
export type TokenPlan = 'standard' | 'high' | 'unmetered'
export type PlanCeilings = { monthlyIn: number; monthlyOut: number }

export type AdminAccess = {
  canRead: boolean
  canWrite: boolean
  isOwner: boolean
  role: string | null
  email: string | null
}

export type RosterPerson = {
  id: string
  email: string
  name: string
  role: AdminRole
  status: AdminUserStatus
  must_change_password: number
  created_at: string
  last_login_at: string | null
  token_plan: TokenPlan
  ceilings: PlanCeilings
  daily_token_cap: number | null
  daily_search_cap: number | null
  requests: number
  denied: number
  tokens_in: number
  tokens_out: number
  tokens_cached: number
  cost_microusd: number
  searches: number
  days_active: number
  last_active_day: string | null
  month_tokens_in: number
  month_tokens_out: number
  month_cost_microusd: number
  month_searches: number
  devices: number
  phones: number
  conversations: number
}

export type AdminRoster = {
  since: string
  days: number
  month_start: string
  plans: Record<TokenPlan, PlanCeilings>
  people: RosterPerson[]
}

export type AdminLaneTotals = {
  kind: 'chat' | 'search'
  requests: number
  denied: number
  tokens_in: number
  tokens_out: number
  tokens_cached: number
  cost_microusd: number
  month_requests: number
  month_tokens_in: number
  month_tokens_out: number
  month_cost_microusd: number
}

export type AdminSurfaceTotals = {
  surface: string
  kind: 'chat' | 'search'
  requests: number
  denied: number
  tokens_in: number
  tokens_out: number
  cost_microusd: number
}

export type AdminDailyPoint = {
  day: string
  requests: number
  tokens_in: number
  tokens_out: number
  cost_microusd: number
  searches: number
}

export type AdminDevice = {
  id: string
  platform: string
  name: string
  app_version: string
  status: string
  pin_set: number
  pin_clear_requested: number
  created_at: string
  last_seen_at: string | null
}

export type AdminSession = {
  id: string
  device_id: string
  issued_at: string
  refreshed_at: string | null
  expires_at: string
  revoked_at: string | null
  revoked_by: string | null
}

export type AdminUsageRow = {
  id: number
  device_id: string | null
  model: string
  kind: string
  surface: string
  upstream: string
  tokens_in: number
  tokens_out: number
  tokens_cached: number
  cost_microusd: number
  latency_ms: number
  decision: string
  error: string | null
  created_at: string
}

export type AdminUserOverview = {
  user: {
    id: string
    email: string
    name: string
    role: AdminRole
    status: AdminUserStatus
    must_change_password: number
    phone: string
    position: string
    bio: string
    created_at: string
    updated_at: string
    last_login_at: string | null
    temp_password_expires_at: string | null
  }
  window: { since: string; days: number; month_start: string }
  policy: {
    token_plan: TokenPlan
    ceilings: PlanCeilings
    allowed_models?: string | null
    daily_token_cap?: number | null
    daily_search_cap?: number | null
    updated_at?: string
  }
  plans: Record<TokenPlan, PlanCeilings>
  standing: {
    tokens: {
      userDayUsed: number
      orgMonthUsed: number
      userMonthIn: number
      userMonthOut: number
    } | null
    searches: { userDayUsed: number; orgMonthUsed: number } | null
  }
  lanes: AdminLaneTotals[]
  surfaces: AdminSurfaceTotals[]
  daily: AdminDailyPoint[]
  devices: AdminDevice[]
  sessions: AdminSession[]
  recent: AdminUsageRow[]
  counts: { conversations: number; files: number; bytes: number }
}

export type AdminConversationRow = {
  id: string
  title: string
  device_id: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
  model: string | null
  channel: string | null
  icon: string | null
  project_id: string | null
  sealed: number | null
  summary: string | null
  stats: Record<string, unknown> | null
  message_count: number
}

export type AdminTranscript = {
  conversation: ConversationFile
  owner: { userId: string; name: string | null; email: string | null }
  truncated: boolean
}

export type AdminAuditEntry = {
  id: number
  actor_user_id: string
  actor_name?: string | null
  actor_email?: string | null
  action: string
  target: string
  detail: string
  created_at: string
}

export type AdminOrgSettings = {
  id: number
  name: string
  default_model: string
  default_allowed_models: string
  user_daily_token_cap: number
  org_monthly_token_cap: number
  search_enabled: number
  user_daily_search_cap: number
  org_monthly_search_cap: number
  created_at: string
  updated_at: string
}

// ── Automations, procedures, projects ────────────────────────────────────

export type HeartbeatJobView = {
  id: string
  type: string
  cron: string | null
  label: string
  name: string | null
  body: string
  mode: ChatMode | null
  nextRunMs: number | null
}

export type RunFamily = 'automation' | 'compaction' | 'reflection' | 'procedure'

export type HeartbeatRunningJob = {
  id: string
  label: string
  body: string
  startedAt: number
  mode: ChatMode | null
  family: RunFamily
}

export type HeartbeatQueuedJob = {
  id: string
  label: string
  mode: ChatMode | null
  queuedAt: number
  family: RunFamily
}

export type HeartbeatRunsSnapshot = { running: HeartbeatRunningJob[]; queued: HeartbeatQueuedJob[] }

export type ProcedureFileRef = { path: string; name: string }

export type Procedure = {
  id: string
  title: string
  prompt: string
  mode?: ChatMode
  icon?: string
  projectId?: string
  files?: ProcedureFileRef[]
  directories?: string[]
  createdAt: number
  updatedAt: number
}

export type ProjectFileRef = { path: string; name: string }

export type Project = {
  id: string
  title: string
  icon: string
  instructions: string
  files: ProjectFileRef[]
  directories?: string[]
  createdAt: number
  updatedAt: number
}

// ── Services ─────────────────────────────────────────────────────────────

export type BraveLaneState = 'ready' | 'disabled' | 'unconfigured' | 'signed_out' | 'unreachable'

export type BraveStatus = {
  provider: 'brave'
  managed: true
  state: BraveLaneState
  configured: boolean
  enabled: boolean
  usedToday: number
  dailyCap: number
  orgUsedMonth: number
  orgMonthlyCap: number
  pricePerQueryUsd: number
  planQps: number
  limitPerSec: number | null
  error: string | null
  fetchedAt: number
}

export type ComputerUsePermissions = {
  platform: string
  hint: string | null
  accessibility: boolean
  screenRecording: boolean
}

export type ExtensionConnectionStatus = 'stopped' | 'listening' | 'connected' | 'error'

export type ExtensionBrowserInfo = {
  id: string
  instanceId: string | null
  key: string
  browser: string
  name: string
  version: string | null
  browserVersion: string | null
  os: string | null
  profileEmail: string | null
  connectedAt: number
  lastPing: number
}

export type ExtensionServerStatus = {
  status: ExtensionConnectionStatus
  error: string | null
  extensionVersion: string | null
  port: number
  browsers: ExtensionBrowserInfo[]
}

export type MobilePairedPhone = {
  id: string
  name: string
  platform: 'ios' | 'android' | null
  model: string | null
  osVersion: string | null
  appVersion: string | null
  pairedAt: number
  lastSeenAt: number | null
  pairMethod: 'qr' | 'code' | null
  connected: boolean
  connectedSince: number | null
}

export type MobileBridgeState = {
  status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  phones: Array<{
    deviceId: string
    name: string
    platform: string
    appVersion: string
    connectedAt: number
  }>
  connectedAt: number | null
  lastError: string | null
  reconnects: number
  framesSent: number
  framesReceived: number
  bytesSent: number
  bytesReceived: number
}

export type MobileStatus = {
  paired: boolean
  phones: MobilePairedPhone[]
  bridge: MobileBridgeState | null
  offer: { mode: 'qr' | 'code'; payload: string | null; code: string | null; expiresAt: number } | null
  verbose: boolean
  notificationsEnabled: boolean
  apiBase: string
}

// ── Workspace viewer ─────────────────────────────────────────────────────

export type ViewerTreeNode =
  | { type: 'dir'; name: string; relativePath: string; children: ViewerTreeNode[] }
  | { type: 'file'; name: string; relativePath: string }
