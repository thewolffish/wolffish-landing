'use client'

/**
 * The playground's whole app state — the desktop's Flow, Sessions, Theme,
 * Locale and workspace-config providers folded into one, backed by the demo
 * data instead of IPC. Navigation is instant (everything is already in
 * memory), settings mutate local state so every toggle feels real, and the
 * one thing that cannot happen here — a real turn — is replaced by the demo
 * reply after a few seconds of "thinking".
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { LocaleContext, RTL_LOCALES, makeT, type SupportedLocale } from '@/playground/i18n'
import { useToast } from '@/playground/components/core/toast/useToast'
import type {
  AssistantMessage,
  ChatMessage,
  ChatMode,
  ConversationFile,
  ConversationMeta,
  ConversationRunStatus,
  ConversationStats,
  MessageAttachment,
  Procedure,
  Project,
  Segment,
  ThemeSource,
  ThinkingMode,
  UserMessage,
  Variable,
  WorkspaceConfig
} from '@/playground/data/types'
import { INITIAL_CONFIG } from '@/playground/data/config'
import { PROJECTS } from '@/playground/data/projects'
import { PROCEDURES } from '@/playground/data/procedures'
import { CAPABILITIES } from '@/playground/data/capabilities'
import { MCP_SERVERS } from '@/playground/data/mcp'
import { CONVERSATIONS, conversationMetas } from '@/playground/data/conversations'
import { compactionAtFor, contextWindowFor, costUsd, PROVIDER } from '@/playground/data/catalog'
import { AGENTS_MD, SOUL_MD, USER_MD } from '@/playground/data/identityDocs'
import { HEARTBEAT_MD } from '@/playground/data/automations'
import type { CapabilityEntry, McpServerSnapshot } from '@/playground/data/types'

export type Screen =
  | 'chat'
  | 'settings'
  | 'viewer'
  | 'history'
  | 'library'
  | 'customization'
  | 'leaderboard'
  | 'admin'
  | 'locked'

/** A procedure queued for auto-send into a fresh chat (the Play button). */
export type PendingProcedure = {
  prompt: string
  mode?: ChatMode
  icon?: string
  files?: string[]
  directories?: string[]
}

/** One open chat session = one feed. The playground keeps them all mounted like the desktop. */
export type Session = {
  key: string
  conversationId: string | null
  /** The persisted file the session was opened from (null for a fresh chat). */
  file: ConversationFile | null
  messages: ChatMessage[]
  projectId: string | null
  icon: string | null
  procedure: PendingProcedure | null
  /** A demo turn in flight — the timer that ends it. */
  pendingTurn: { timer: ReturnType<typeof setTimeout>; assistantId: string } | null
  /** Draft + stats folded from demo turns so the meter moves. */
  stats: ConversationStats | null
  title: string | null
}

export type DemoState = {
  screen: Screen
  goTo: (screen: Screen) => void
  locale: SupportedLocale
  setLocale: (l: SupportedLocale) => void
  theme: ThemeSource
  isDark: boolean
  setTheme: (t: ThemeSource) => void
  config: WorkspaceConfig
  patchConfig: (patch: Partial<WorkspaceConfig> | ((c: WorkspaceConfig) => WorkspaceConfig)) => void
  setModel: (model: string | null) => void
  setChatMode: (mode: ChatMode) => void
  setThinkingMode: (model: string, mode: ThinkingMode) => void
  setBypass: (v: boolean) => void
  setVariables: (v: Variable[]) => void
  projects: Project[]
  setProjects: (updater: (p: Project[]) => Project[]) => void
  procedures: Procedure[]
  setProcedures: (updater: (p: Procedure[]) => Procedure[]) => void
  capabilities: CapabilityEntry[]
  toggleCapability: (name: string, enabled: boolean) => void
  mcpServers: McpServerSnapshot[]
  setMcpServers: (updater: (s: McpServerSnapshot[]) => McpServerSnapshot[]) => void
  identityDocs: Record<'soul' | 'user' | 'agents', string>
  setIdentityDoc: (doc: 'soul' | 'user' | 'agents', content: string) => void
  heartbeatMd: string
  setHeartbeatMd: (md: string) => void
  /** Conversations index (metas) — live demo conversations first. */
  metas: ConversationMeta[]
  loadConversation: (id: string) => ConversationFile | null
  deleteConversation: (id: string) => void
  // Sessions
  sessions: Session[]
  activeSessionKey: string
  activeSession: Session
  activeConversationId: string | null
  runStatuses: Record<string, ConversationRunStatus>
  activeProject: Project | null
  setActiveProject: (p: Project | null) => void
  newSession: (opts?: { procedure?: PendingProcedure; projectId?: string | null }) => void
  openConversation: (id: string) => boolean
  activateSession: (key: string) => void
  sendDemoPrompt: (sessionKey: string, text: string, attachments?: MessageAttachment[]) => void
  stopDemoTurn: (sessionKey: string) => void
  /** The universal "this does nothing here" toast. */
  demoAction: () => void
  demoSaved: () => void
  lock: () => void
  unlock: () => void
}

const DemoContext = createContext<DemoState | null>(null)

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within PlaygroundProvider')
  return ctx
}

/** The desktop's useFlow / useSessions shapes, for ported pages. */
export function useFlow(): { screen: Screen; goTo: (s: Screen) => void; config: WorkspaceConfig } {
  const d = useDemo()
  return { screen: d.screen, goTo: d.goTo, config: d.config }
}

export function useTheme(): { theme: ThemeSource; isDark: boolean; setTheme: (t: ThemeSource) => void } {
  const d = useDemo()
  return { theme: d.theme, isDark: d.isDark, setTheme: d.setTheme }
}

/** A click that has no effect in the demo: one toast, nothing else. */
export function useDemoAction(): () => void {
  return useDemo().demoAction
}

let sessionCounter = 0
function nextKey(): string {
  sessionCounter += 1
  // The time suffix keeps keys unique across a dev hot reload, which resets
  // the module counter while the mounted sessions keep their old keys.
  return `session_${sessionCounter}_${Date.now().toString(36)}`
}

function mintId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/** Map a persisted conversation into feed messages (conversation-open.ts). */
export function mapConversationMessages(conv: ConversationFile): ChatMessage[] {
  return conv.messages.map((m): ChatMessage => {
    if (m.role === 'user') {
      return {
        id: m.id,
        role: 'user',
        content: m.content,
        timestamp: m.timestamp,
        ...(m.attachments && m.attachments.length > 0 ? { attachments: m.attachments } : {}),
        ...(m.voicePrompt ? { voicePrompt: true } : {}),
        ...(m.voiceLang ? { voiceLang: m.voiceLang } : {})
      }
    }
    const segments = m.segments ?? [
      { kind: 'text' as const, delta: m.content, turnId: '', segmentId: `seg_${m.timestamp}` }
    ]
    return {
      id: m.id,
      role: 'assistant',
      segments,
      approvals: m.approvals,
      toolTimings: m.toolTimings,
      status: m.error ? 'error' : 'complete',
      stopReason: m.stopReason,
      ...(m.error ? { error: m.error } : {}),
      timestamp: m.timestamp
    }
  })
}

const DEMO_THINKING_MS = 5_000

function freshSession(opts?: { procedure?: PendingProcedure; projectId?: string | null }): Session {
  return {
    key: nextKey(),
    conversationId: null,
    file: null,
    messages: [],
    projectId: opts?.projectId ?? null,
    icon: opts?.procedure?.icon ?? null,
    procedure: opts?.procedure ?? null,
    pendingTurn: null,
    stats: null,
    title: null
  }
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function PlaygroundProvider({
  initialLocale,
  children
}: {
  initialLocale: SupportedLocale
  children: ReactNode
}): React.JSX.Element {
  const toast = useToast()
  const [screen, setScreen] = useState<Screen>('chat')
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale)
  const [theme, setThemeState] = useState<ThemeSource>(INITIAL_CONFIG.theme)
  const [systemDark, setSystemDark] = useState<boolean>(() => prefersDark())
  const [config, setConfig] = useState<WorkspaceConfig>(() => ({
    ...INITIAL_CONFIG,
    locale: initialLocale
  }))
  const [projects, setProjectsState] = useState<Project[]>(PROJECTS)
  const [procedures, setProceduresState] = useState<Procedure[]>(PROCEDURES)
  const [capabilities, setCapabilities] = useState<CapabilityEntry[]>(CAPABILITIES)
  const [mcpServers, setMcpServersState] = useState<McpServerSnapshot[]>(MCP_SERVERS)
  const [identityDocs, setIdentityDocs] = useState({ soul: SOUL_MD, user: USER_MD, agents: AGENTS_MD })
  const [heartbeatMd, setHeartbeatMd] = useState(HEARTBEAT_MD)
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(new Set())
  const [sessions, setSessions] = useState<Session[]>(() => [freshSession()])
  const [activeSessionKey, setActiveSessionKey] = useState<string>(() => sessions[0].key)
  const [runStatuses, setRunStatuses] = useState<Record<string, ConversationRunStatus>>({})
  const [activeProject, setActiveProjectState] = useState<Project | null>(null)
  const [locked, setLocked] = useState(false)
  const t = useMemo(() => makeT(locale), [locale])
  const sessionsRef = useRef(sessions)
  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  // Theme: the `dark` class on <html>, exactly as the desktop's ThemeProvider.
  const isDark = theme === 'dark' || (theme === 'system' && systemDark)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent): void => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('wf-playground')
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [isDark])
  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'
  }, [locale])

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next)
    setConfig((c) => ({ ...c, locale: next }))
  }, [])

  const setTheme = useCallback((next: ThemeSource) => {
    setThemeState(next)
    setConfig((c) => ({ ...c, theme: next }))
  }, [])

  const patchConfig = useCallback(
    (patch: Partial<WorkspaceConfig> | ((c: WorkspaceConfig) => WorkspaceConfig)) => {
      setConfig((c) => (typeof patch === 'function' ? patch(c) : { ...c, ...patch }))
    },
    []
  )

  const demoAction = useCallback(() => {
    toast.show({ message: t('demo.toast.noop'), tone: 'info' })
  }, [toast, t])

  const demoSaved = useCallback(() => {
    toast.show({ message: t('demo.toast.saved'), tone: 'success' })
  }, [toast, t])

  const metas = useMemo(
    () => conversationMetas().filter((m) => !deleted.has(m.id)),
    [deleted]
  )

  const loadConversation = useCallback(
    (id: string): ConversationFile | null => {
      if (deleted.has(id)) return null
      return CONVERSATIONS.find((c) => c.id === id) ?? null
    },
    [deleted]
  )

  const setActiveProject = useCallback((p: Project | null) => setActiveProjectState(p), [])

  const activateSession = useCallback((key: string) => {
    setActiveSessionKey(key)
    setScreen('chat')
  }, [])

  const newSession = useCallback(
    (opts?: { procedure?: PendingProcedure; projectId?: string | null }) => {
      const projectId = opts?.projectId ?? null
      const project = projectId ? PROJECTS.find((p) => p.id === projectId) ?? null : null
      setActiveProjectState(project)
      // Refocus an existing empty idle session with the same binding.
      const idle = sessionsRef.current.find(
        (s) => s.conversationId === null && s.messages.length === 0 && !s.pendingTurn && !opts?.procedure && s.projectId === projectId
      )
      if (idle) {
        setActiveSessionKey(idle.key)
        setScreen('chat')
        return
      }
      const session = freshSession({ procedure: opts?.procedure, projectId })
      setSessions((prev) => [...prev, session])
      setActiveSessionKey(session.key)
      setScreen('chat')
    },
    []
  )

  const openConversation = useCallback(
    (id: string): boolean => {
      const existing = sessionsRef.current.find((s) => s.conversationId === id)
      if (existing) {
        setActiveProjectState(existing.projectId ? PROJECTS.find((p) => p.id === existing.projectId) ?? null : null)
        setActiveSessionKey(existing.key)
        setScreen('chat')
        return true
      }
      const file = loadConversation(id)
      if (!file) return false
      const session: Session = {
        key: nextKey(),
        conversationId: file.id,
        file,
        messages: mapConversationMessages(file),
        projectId: file.projectId ?? null,
        icon: file.icon ?? null,
        procedure: null,
        pendingTurn: null,
        stats: file.stats ?? null,
        title: file.title
      }
      setActiveProjectState(file.projectId ? PROJECTS.find((p) => p.id === file.projectId) ?? null : null)
      setSessions((prev) => {
        // Bound the finished, backgrounded feeds like the desktop (MAX 6).
        const kept = prev.filter((s) => s.pendingTurn || s.key === activeSessionKey || s.messages.length === 0)
        const others = prev.filter((s) => !kept.includes(s)).slice(-4)
        return [...kept, ...others, session]
      })
      setActiveSessionKey(session.key)
      setScreen('chat')
      return true
    },
    [loadConversation, activeSessionKey]
  )

  const deleteConversation = useCallback((id: string) => {
    setDeleted((prev) => new Set([...prev, id]))
    setSessions((prev) => {
      const kept = prev.filter((s) => s.conversationId !== id)
      const next = kept.length > 0 ? kept : [freshSession()]
      // The active session may be the one going — land on the first survivor.
      setActiveSessionKey((key) => (next.some((s) => s.key === key) ? key : next[0].key))
      return next
    })
    setRunStatuses((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const updateSession = useCallback((key: string, updater: (s: Session) => Session) => {
    setSessions((prev) => prev.map((s) => (s.key === key ? updater(s) : s)))
  }, [])

  const stopDemoTurn = useCallback(
    (sessionKey: string) => {
      const session = sessionsRef.current.find((s) => s.key === sessionKey)
      if (!session?.pendingTurn) return
      clearTimeout(session.pendingTurn.timer)
      const convId = session.conversationId
      updateSession(sessionKey, (s) => ({
        ...s,
        pendingTurn: null,
        messages: s.messages.map((m) =>
          m.role === 'assistant' && m.id === s.pendingTurn?.assistantId
            ? {
                ...m,
                status: 'complete' as const,
                segments: [
                  ...m.segments,
                  { kind: 'turn_end' as const, turnId: 'demo', segmentId: 'end', stopReason: 'end_turn' as const, iterationCount: 1 }
                ]
              }
            : m
        )
      }))
      if (convId) setRunStatuses((prev) => ({ ...prev, [convId]: { phase: 'stopped', channel: 'electron', title: session.title, at: Date.now() } }))
    },
    [updateSession]
  )

  const sendDemoPrompt = useCallback(
    (sessionKey: string, content: string, attachments?: MessageAttachment[]) => {
      const now = Date.now()
      const session = sessionsRef.current.find((s) => s.key === sessionKey)
      if (!session) return
      const conversationId = session.conversationId ?? `conv-demo-${now.toString(36)}`
      const title = session.title ?? (content.trim().replace(/\s+/g, ' ').slice(0, 80) || attachments?.[0]?.originalName || 'Untitled')
      const userMessage: UserMessage = {
        id: mintId('m'),
        role: 'user',
        content,
        timestamp: now,
        ...(attachments && attachments.length > 0 ? { attachments } : {})
      }
      const assistantId = mintId('m')
      const streaming: AssistantMessage = {
        id: assistantId,
        role: 'assistant',
        segments: [],
        status: 'streaming',
        timestamp: now
      }
      const model = config.llm.model
      const timer = setTimeout(() => {
        const heading = t('demo.reply.heading')
        const body = t('demo.reply.body')
        const outro = t('demo.reply.outro')
        const reply = `**${heading}**\n\n${body}\n\n${outro}`
        const endedAt = Date.now()
        const segments: Segment[] = [
          { kind: 'active_model', turnId: 'demo', segmentId: 's0', provider: PROVIDER, model: model ?? 'wolffish-demo' },
          { kind: 'text', turnId: 'demo', segmentId: 's1', delta: reply },
          { kind: 'turn_end', turnId: 'demo', segmentId: 's2', stopReason: 'end_turn', iterationCount: 1 }
        ]
        const inputTokens = Math.round((content.length + 3_200) / 3.6)
        const outputTokens = Math.round(reply.length / 3.6)
        const cost = costUsd(model, inputTokens, outputTokens, Math.round(inputTokens * 0.5))
        updateSession(sessionKey, (s) => {
          const prevAll = s.stats?.allTime ?? {
            processingMs: 0,
            apiMs: 0,
            turns: 0,
            apiCalls: 0,
            toolCalls: 0,
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            cost: 0
          }
          const elapsedMs = endedAt - now
          return {
            ...s,
            pendingTurn: null,
            messages: s.messages.map((m) =>
              m.id === assistantId
                ? { ...m, status: 'complete' as const, segments, stopReason: 'end_turn' as const, timestamp: endedAt }
                : m
            ),
            stats: {
              allTime: {
                processingMs: prevAll.processingMs + elapsedMs,
                apiMs: prevAll.apiMs + Math.round(elapsedMs * 0.7),
                turns: prevAll.turns + 1,
                apiCalls: prevAll.apiCalls + 1,
                toolCalls: prevAll.toolCalls,
                inputTokens: prevAll.inputTokens + inputTokens,
                outputTokens: prevAll.outputTokens + outputTokens,
                cacheReadTokens: prevAll.cacheReadTokens + Math.round(inputTokens * 0.5),
                cacheCreationTokens: prevAll.cacheCreationTokens + Math.round(inputTokens * 0.1),
                cost: prevAll.cost + cost
              },
              lastTurn: {
                endedAt,
                elapsedMs,
                apiMs: Math.round(elapsedMs * 0.7),
                apiCalls: 1,
                toolCalls: 0,
                inputTokens,
                outputTokens,
                cacheReadTokens: Math.round(inputTokens * 0.5),
                cacheCreationTokens: Math.round(inputTokens * 0.1),
                cost,
                provider: PROVIDER,
                model
              },
              meter: {
                contextTokens: (s.stats?.meter?.contextTokens ?? 3_100) + inputTokens + outputTokens,
                contextBudget: contextWindowFor(model),
                compactionAt: compactionAtFor(model),
                model
              }
            }
          }
        })
        setRunStatuses((prev) => ({ ...prev, [conversationId]: { phase: 'completed', channel: 'electron', title, at: Date.now() } }))
      }, DEMO_THINKING_MS)
      updateSession(sessionKey, (s) => ({
        ...s,
        conversationId,
        title,
        messages: [...s.messages, userMessage, streaming],
        pendingTurn: { timer, assistantId }
      }))
      setRunStatuses((prev) => ({ ...prev, [conversationId]: { phase: 'processing', channel: 'electron', title, at: now } }))
    },
    [config.llm.model, t, updateSession]
  )

  useEffect(
    () => () => {
      for (const s of sessionsRef.current) if (s.pendingTurn) clearTimeout(s.pendingTurn.timer)
    },
    []
  )

  const lock = useCallback(() => {
    setLocked(true)
    toast.show({ message: t('demo.toast.locked'), tone: 'info' })
  }, [toast, t])
  const unlock = useCallback(() => setLocked(false), [])

  const goTo = useCallback((next: Screen) => setScreen(next), [])

  const activeSession = sessions.find((s) => s.key === activeSessionKey) ?? sessions[0]
  const resolvedActiveKey = activeSession.key

  const value = useMemo<DemoState>(
    () => ({
      screen: locked ? 'locked' : screen,
      goTo,
      locale,
      setLocale,
      theme,
      isDark,
      setTheme,
      config,
      patchConfig,
      setModel: (model) => patchConfig((c) => ({ ...c, llm: { ...c.llm, model } })),
      setChatMode: (mode) => patchConfig((c) => ({ ...c, llm: { ...c.llm, mode } })),
      setThinkingMode: (model, mode) =>
        patchConfig((c) => ({ ...c, llm: { ...c.llm, thinkingModes: { ...c.llm.thinkingModes, [model]: mode } } })),
      setBypass: (v) => patchConfig((c) => ({ ...c, safety: { ...c.safety, bypassPermissions: v } })),
      setVariables: (variables) => patchConfig((c) => ({ ...c, variables })),
      projects,
      setProjects: (updater) => setProjectsState((p) => updater(p)),
      procedures,
      setProcedures: (updater) => setProceduresState((p) => updater(p)),
      capabilities,
      toggleCapability: (name, enabled) =>
        setCapabilities((prev) => prev.map((c) => (c.name === name ? { ...c, enabled } : c))),
      mcpServers,
      setMcpServers: (updater) => setMcpServersState((s) => updater(s)),
      identityDocs,
      setIdentityDoc: (doc, content) => setIdentityDocs((d) => ({ ...d, [doc]: content })),
      heartbeatMd,
      setHeartbeatMd,
      metas,
      loadConversation,
      deleteConversation,
      sessions,
      activeSessionKey: resolvedActiveKey,
      activeSession,
      activeConversationId: activeSession.conversationId,
      runStatuses,
      activeProject,
      setActiveProject,
      newSession,
      openConversation,
      activateSession,
      sendDemoPrompt,
      stopDemoTurn,
      demoAction,
      demoSaved,
      lock,
      unlock
    }),
    [
      locked,
      screen,
      goTo,
      locale,
      setLocale,
      theme,
      isDark,
      setTheme,
      config,
      patchConfig,
      projects,
      procedures,
      capabilities,
      mcpServers,
      identityDocs,
      heartbeatMd,
      metas,
      loadConversation,
      deleteConversation,
      sessions,
      resolvedActiveKey,
      activeSession,
      runStatuses,
      activeProject,
      setActiveProject,
      newSession,
      openConversation,
      activateSession,
      sendDemoPrompt,
      stopDemoTurn,
      demoAction,
      demoSaved,
      lock,
      unlock
    ]
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
    </LocaleContext.Provider>
  )
}
