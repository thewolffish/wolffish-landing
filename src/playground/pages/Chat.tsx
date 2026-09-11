'use client'

/**
 * The chat page — the centre of the replica.
 *
 * One mounted instance per open session (PlaygroundApp maps `sessions`), each
 * owning ONE conversation for its whole life exactly as the desktop does. The
 * feed, the cards, the composer and its two sheets are the desktop's; the turn
 * itself is the demo's: `sendDemoPrompt` appends the user bubble plus a
 * streaming assistant message, the thinking-words animation runs while it is
 * pending, and the provider swaps in the demo reply a few seconds later.
 *
 * Navigation lives in the app-level FloatingChrome laid over this transcript —
 * no rails, no header, same as the desktop.
 */
import { ApprovalCard } from '@/playground/components/common/approval-card/ApprovalCard'
import { AttachmentList } from '@/playground/components/common/attachment-list/AttachmentList'
import { AudioPlayer } from '@/playground/components/common/audio-player/AudioPlayer'
import { ChartCard } from '@/playground/components/common/chart-card/ChartCard'
import { CompactionCard } from '@/playground/components/common/compaction-card/CompactionCard'
import {
  ContextMeter,
  type MeterLastCall
} from '@/playground/components/common/context-meter/ContextMeter'
import { DocxViewer } from '@/playground/components/common/docx-viewer/DocxViewer'
import { FileCard } from '@/playground/components/common/file-card/FileCard'
import { HtmlFileViewer } from '@/playground/components/common/html-file-viewer/HtmlFileViewer'
import { ImageViewer } from '@/playground/components/common/image-viewer/ImageViewer'
import { MarkdownFileViewer } from '@/playground/components/common/markdown-file-viewer/MarkdownFileViewer'
import { ModelSwitch } from '@/playground/components/common/model-switch/ModelSwitch'
import { PageViewer } from '@/playground/components/common/page-viewer/PageViewer'
import { PathCard } from '@/playground/components/common/path-card/PathCard'
import { PdfViewer } from '@/playground/components/common/pdf-viewer/PdfViewer'
import { ProviderErrorCards } from '@/playground/components/common/provider-error-card/ProviderErrorCard'
import { QuestionCard } from '@/playground/components/common/question-card/QuestionCard'
import { ReasoningCard } from '@/playground/components/common/reasoning-card/ReasoningCard'
import { SpreadsheetViewer } from '@/playground/components/common/spreadsheet-viewer/SpreadsheetViewer'
import { TodoCard } from '@/playground/components/common/todo-card/TodoCard'
import { ToolCard } from '@/playground/components/common/tool-card/ToolCard'
import { TouchedFolders } from '@/playground/components/common/touched-folders/TouchedFolders'
import { TurnFooter } from '@/playground/components/common/turn-footer/TurnFooter'
import { VideoPlayer } from '@/playground/components/common/video-player/VideoPlayer'
import { WorkflowCard } from '@/playground/components/common/workflow-card/WorkflowCard'
import { CodeEditor } from '@/playground/components/core/CodeEditor'
import { CopyButton } from '@/playground/components/core/CopyButton'
import { ExpandedSheet } from '@/playground/components/core/ExpandedSheet'
import { Markdown } from '@/playground/components/core/Markdown'
import {
  compactionAtFor,
  contextWindowFor,
  normalizeReasoningMode,
  reasoningModesFor,
  PROVIDER
} from '@/playground/data/catalog'
import type {
  AskCardState,
  AskUserResponse,
  AssistantMessage,
  ChatMessage,
  ChatMode,
  MessageAttachment,
  Segment,
  ThinkingMode,
  TimelineEntry,
  TodoItem,
  ToolResultSegment,
  ToolTiming,
  ApprovalCardState,
  WorkflowSnapshot
} from '@/playground/data/types'
import { CODE_ACTIVITY_TOOLS } from '@/playground/data/types'
import { collectTouchedFolders } from '@/playground/lib/touched-folders'
import { RTL_LOCALES, makeT, useLocale, useTranslation, type TFunction } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { docMimeType, fileAvailable, normalizePath } from '@/playground/lib/files'
import { formatCompact } from '@/playground/lib/format'
import {
  ASK_USER_TOOL,
  WORKFLOW_TOOL_NAMES,
  collectConversationFiles,
  collectText,
  extractToolResultCharts,
  extractToolResultDocuments,
  extractToolResultGenericFiles,
  extractToolResultImage,
  extractToolResultMedia,
  extractToolResultPage,
  extractToolResultPaths,
  isFileContentResult,
  latestTodoLists,
  todoListId
} from '@/playground/lib/markers'
import { pageTopPadding } from '@/playground/lib/platform'
import {
  useDemo,
  type PendingProcedure,
  type Session
} from '@/playground/providers/PlaygroundProvider'
import {
  ArrowUp02Icon,
  BubbleChatIcon,
  CancelCircleIcon,
  Clock01Icon,
  CloudUploadIcon,
  ComputerTerminal01Icon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  Files01Icon,
  Folder01Icon,
  Image02Icon,
  Mic01Icon,
  PlusSignIcon,
  Settings02Icon,
  StopCircleIcon,
  Task01Icon,
  WorkflowSquare03Icon
} from 'hugeicons-react'
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'

// In-app verbose display preference, mirroring the phone channel toggle but
// for what the renderer DISPLAYS (history is untouched). false (default) =
// clean feed: agent replies, file-bearing tool results and errors only; the
// tool-activity and compaction cards are hidden. true = the full activity
// feed. Provided by Chat, read in AssistantBubble.
const InAppVerboseContext = createContext(false)

// Whether the model's thinking renders as a ReasoningCard. Off by default and
// display-only: reasoning still streams and still persists — the feed simply
// doesn't show it. Same workspace key the phone obeys (`inapp.reasoning`).
const InAppReasoningContext = createContext(false)

/**
 * A prompt submitted while a turn was still streaming. It waits in a
 * cancelable row above the composer (never in the feed) and is sent through
 * the normal send path when the running turn ends.
 */
type QueuedPrompt = {
  id: string
  text: string
  attachments: MessageAttachment[]
}

export type ChatProps = {
  /** Stable identity of this session in the playground provider. */
  sessionKey: string
  /**
   * True only for the active session while the chat screen is showing.
   * Hidden instances keep their state but must not run portals or
   * focus-stealing behavior.
   */
  visible: boolean
}

export function Chat({ sessionKey, visible }: ChatProps): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isRtl = RTL_LOCALES.has(locale)
  const {
    sessions,
    config,
    goTo,
    isDark,
    activeProject,
    sendDemoPrompt,
    stopDemoTurn,
    setChatMode,
    setThinkingMode,
    setBypass,
    demoAction
  } = useDemo()

  // The row memo keys on `t`, and useTranslation() mints a fresh closure every
  // render — so the feed reads its translator from a locale-stable one.
  const rowT = useMemo<TFunction>(() => makeT(locale), [locale])

  const session = useMemo<Session | null>(
    () => sessions.find((s) => s.key === sessionKey) ?? null,
    [sessions, sessionKey]
  )
  const messages = useMemo<ChatMessage[]>(() => session?.messages ?? [], [session])
  const activeConversationId = session?.conversationId ?? null
  const convStats = session?.stats ?? null

  // Project mode: THIS session runs inside the globally active project. The
  // binding is per-session, so a backgrounded plain chat never borrows another
  // session's project chrome. (The project button and manage dialog live in
  // the app-level FloatingChrome, alongside New Chat.)
  const sessionProject =
    activeProject !== null && session?.projectId === activeProject.id ? activeProject : null

  // One lane: the selected model is the whole model state. The org catalog is
  // the authority on what may be picked.
  const selectedModel = config.llm.model
  const hasAnyModel = !!selectedModel
  // Bypass permissions rides next to the model controls in chat.
  const bypass = config.safety.bypassPermissions
  // Chat mode: 'single' (solo turns) vs 'workflow' (model-led agents).
  const chatMode: ChatMode = config.llm.mode === 'workflow' ? 'workflow' : 'single'

  // Ordered reasoning modes this model honours (canonical scale). Drives the
  // brain chips inside the model card.
  const reasoningModes = useMemo<ThinkingMode[]>(
    () => (selectedModel ? reasoningModesFor(selectedModel) : []),
    [selectedModel]
  )
  // Active mode, clamped/migrated to a value valid for this model's modes.
  const thinkingMode = useMemo<ThinkingMode>(
    () =>
      normalizeReasoningMode(
        selectedModel ? config.llm.thinkingModes[selectedModel] : undefined,
        reasoningModes
      ),
    [selectedModel, config.llm.thinkingModes, reasoningModes]
  )
  const onSelectReasoning = useCallback(
    (mode: ThinkingMode) => {
      if (!selectedModel) return
      setThinkingMode(selectedModel, mode)
    },
    [selectedModel, setThinkingMode]
  )
  const onSelectChatMode = useCallback(
    async (mode: ChatMode) => {
      setChatMode(mode)
    },
    [setChatMode]
  )
  const onToggleBypass = useCallback(
    async (next: boolean) => {
      if (next === bypass) return
      setBypass(next)
    },
    [bypass, setBypass]
  )

  const inAppVerbose = config.inapp.verbose
  const inAppReasoning = config.inapp.reasoning

  // While the agent is paused for a confirm/destructive approval, the
  // streaming bubble swaps "Thinking…" for "Awaiting permission…".
  const awaitingApproval = messages.some((m) => {
    if (!isAssistant(m) || !m.approvals) return false
    for (const approval of Object.values(m.approvals)) {
      if (approval.decision === undefined) return true
    }
    return false
  })
  // While the agent is paused on an ask_user question, the streaming bubble
  // shows "Awaiting your answer…" instead of the thinking shimmer.
  const awaitingAsk = messages.some((m) => {
    if (!isAssistant(m) || !m.asks) return false
    for (const ask of Object.values(m.asks)) {
      if (!ask.answered) return true
    }
    return false
  })

  const [draft, setDraft] = useState('')
  const [draftExpanded, setDraftExpanded] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)
  /**
   * Prompts queued while a turn streams. Each busy→idle transition flushes
   * exactly one — and because Stop also resolves the turn, stopping a run
   * advances the queue the same way a natural finish does.
   */
  const [queuedPrompts, setQueuedPrompts] = useState<QueuedPrompt[]>([])

  /**
   * "A turn is in flight for this conversation" — the gate every piece of chat
   * chrome reads (composer, stop/queue, export, model switch).
   */
  const busy = session?.pendingTurn != null

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  // On turn end, return focus to the composer so the user can keep typing
  // without reaching for the mouse. Don't steal focus if the user is
  // deliberately typing in another field, and it's a no-op when Chat is hidden
  // (display:none can't hold focus).
  const prevBusyRef = useRef(false)
  useEffect(() => {
    const wasBusy = prevBusyRef.current
    prevBusyRef.current = busy
    if (!wasBusy || busy) return
    if (!visible) return
    const el = textareaRef.current
    if (!el || el.disabled) return
    const active = document.activeElement as HTMLElement | null
    const typingElsewhere =
      !!active &&
      active !== el &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
    if (typingElsewhere) return
    el.focus()
  }, [busy, visible])

  // ── The meter's numbers ───────────────────────────────────────
  // The live turn is the trailing assistant message while the demo "thinks";
  // once it lands, the frozen roll-up on the session's stats takes over.
  const liveTurn = busy
  const lastAssistant = useMemo<AssistantMessage | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (isAssistant(m)) return m
    }
    return null
  }, [messages])
  const turnStartedAt = liveTurn
    ? (lastAssistant?.timestamp ?? null)
    : convStats?.lastTurn
      ? convStats.lastTurn.endedAt - convStats.lastTurn.elapsedMs
      : null
  const turnEndedAt = liveTurn ? null : (convStats?.lastTurn?.endedAt ?? null)
  // Usage for the turn in flight is not known until it lands — the card shows
  // zeros for it, exactly as the desktop does before the first usage event.
  const inputTokens = liveTurn ? null : (convStats?.lastTurn?.inputTokens ?? null)
  const outputTokens = liveTurn ? null : (convStats?.lastTurn?.outputTokens ?? null)
  const cacheReadTokens = liveTurn ? null : (convStats?.lastTurn?.cacheReadTokens ?? null)
  const cacheWriteTokens = liveTurn ? null : (convStats?.lastTurn?.cacheCreationTokens ?? null)
  const contextTokens = convStats?.meter?.contextTokens ?? null
  const contextBudget = convStats?.meter?.contextBudget ?? (selectedModel ? contextWindowFor(selectedModel) : null)
  const compactionAt = convStats?.meter?.compactionAt ?? (selectedModel ? compactionAtFor(selectedModel) : null)
  const meterModel = convStats?.meter?.model ?? null
  // The last brain call, rebuilt from the frozen turn roll-up: it is what
  // drives the card's composition bar and its footnote row.
  const lastCall = useMemo<MeterLastCall | null>(() => {
    const turn = convStats?.lastTurn
    if (!turn || !turn.model) return null
    return {
      provider: turn.provider ?? PROVIDER,
      model: turn.model,
      durationMs: turn.apiMs,
      fresh: turn.inputTokens,
      cacheRead: turn.cacheReadTokens,
      cacheWrite: turn.cacheCreationTokens
    }
  }, [convStats])
  // The live/last turn's workflow run, mirrored from the same snapshot
  // segments that drive the feed's WorkflowCard.
  const workflowSpend = useMemo<WorkflowSnapshot | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (!isAssistant(m)) continue
      for (let j = m.segments.length - 1; j >= 0; j--) {
        const s = m.segments[j]
        if (s.kind === 'workflow') return s.snapshot
      }
    }
    return null
  }, [messages])

  // ── Files and the event log ───────────────────────────────────
  // Files that appear in the conversation — user uploads plus files delivered
  // by tools — unified into MessageAttachment[] so the files sheet can render
  // them through AttachmentList (the same per-type dispatch and viewers the
  // feed uses).
  const conversationFiles = useMemo(() => collectConversationFiles(messages), [messages])
  // What the sheet and its chip actually show: named-and-still-resolvable. The
  // FEED deliberately keeps the opposite behavior — a message that delivered a
  // file still renders that file's per-type "deleted" state.
  const presentFiles = useMemo(
    () => conversationFiles.filter((f) => fileAvailable(f.filePath)),
    [conversationFiles]
  )

  // A conversation's event log. Conversations restored from disk carry their
  // stored timeline; the rest derive one from the persisted messages (a turn
  // divider per prompt + a row per tool call / result) so "View Logs" reflects
  // real activity either way.
  const derivedTimeline = useMemo(() => deriveTimelineFromMessages(messages), [messages])
  const storedTimeline = session?.file?.timeline ?? []
  const displayTimeline = storedTimeline.length > 0 ? storedTimeline : derivedTimeline
  // Real events only — turn-boundary dividers structure the log but shouldn't
  // count toward the "N events" badges.
  const timelineEventCount = useMemo(
    () => displayTimeline.reduce((n, e) => n + (e.kind === 'turn.started' ? 0 : 1), 0),
    [displayTimeline]
  )

  // Reference folders this conversation's turns are told about. Read-only in
  // the replica: picking and dropping folders is a machine act.
  const workingFolders = useMemo(() => session?.file?.workingFolder ?? [], [session])

  // Every task list in its latest state, keyed by list id (broca
  // latestTodoLists): a later turn's todo_write that continues an earlier
  // list resolves THAT card in place, at its original position.
  const todoLists = useMemo(
    () => latestTodoLists(messages.map((m) => (m.role === 'assistant' ? m.segments : undefined))),
    [messages]
  )
  // The folders this conversation changed files in — chips over the
  // transcript's top edge. Derived from the persisted segments so the strip
  // is the same live, after the turn and on a reopened conversation.
  const touchedFolders = useMemo(
    () => collectTouchedFolders(messages, workingFolders),
    [messages, workingFolders]
  )
  // Plan mode: a read-only turn that may only write the conversation's plan
  // file. A stance for the next turns, not a property of the transcript —
  // the desktop keeps it per conversation for the session and never persists
  // it, so the replica keeps it in local state and starts every chat off.
  const [planMode, setPlanMode] = useState(false)

  // ── Send / stop / queue ───────────────────────────────────────
  const send = useCallback(() => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (!hasAnyModel) return
    // Mid-turn submits QUEUE instead of sending: the prompt waits in a row
    // above the composer and flushes when the turn ends.
    if (busy) {
      setQueuedPrompts((prev) => [...prev, { id: cryptoId(), text: trimmed, attachments: [] }])
      setDraft('')
      return
    }
    setDraft('')
    sendDemoPrompt(sessionKey, trimmed)
    const el = scrollerRef.current
    if (el) el.scrollTop = 0
  }, [draft, hasAnyModel, busy, sendDemoPrompt, sessionKey])

  const stop = useCallback(() => {
    stopDemoTurn(sessionKey)
  }, [stopDemoTurn, sessionKey])

  const cancelQueued = useCallback((id: string) => {
    setQueuedPrompts((prev) => prev.filter((q) => q.id !== id))
  }, [])

  // Each busy→idle transition flushes exactly one queued prompt. The send runs
  // off a microtask, not straight in the effect body — it mutates provider
  // state, which must not happen synchronously inside an effect.
  const prevBusyQueueRef = useRef(false)
  useEffect(() => {
    const wasBusy = prevBusyQueueRef.current
    prevBusyQueueRef.current = busy
    if (!wasBusy || busy) return
    if (queuedPrompts.length === 0) return
    const [next, ...rest] = queuedPrompts
    void Promise.resolve().then(() => {
      setQueuedPrompts(rest)
      sendDemoPrompt(sessionKey, next.text, next.attachments)
    })
  }, [busy, queuedPrompts, sendDemoPrompt, sessionKey])

  /**
   * A procedure's Play spawns a fresh SESSION carrying the procedure, then
   * switches to Chat — this instance auto-sends it into its brand-new
   * conversation. The ref is the one-shot latch: the procedure object is
   * stable for the life of the session, so reference identity is enough.
   */
  const procedure = session?.procedure ?? null
  const procedureRunRef = useRef<PendingProcedure | null>(null)
  useEffect(() => {
    if (procedure === null || busy) return
    if (procedureRunRef.current === procedure) return
    procedureRunRef.current = procedure
    const prompt = procedure.prompt
    void Promise.resolve().then(() => sendDemoPrompt(sessionKey, prompt))
  }, [procedure, busy, sendDemoPrompt, sessionKey])

  // ── Approvals, asks, retries ──────────────────────────────────
  // Cards restored from history are already answered, so these only ever fire
  // from a live card — which the replica never produces. They keep the wiring
  // whole (and never leave a button inert).
  const respondApproval = useCallback<(id: string, decision: 'approved' | 'denied') => void>(
    () => demoAction(),
    [demoAction]
  )
  const respondAsk = useCallback<(askId: string, response: AskUserResponse) => void>(
    () => demoAction(),
    [demoAction]
  )
  // "Try again" on a failed turn's error card: continue the conversation with
  // a message that names what went wrong, so the model resumes from where it
  // stopped instead of restarting the task blind.
  const handleTryAgain = useCallback(
    (reason: string) => {
      if (busy) return
      sendDemoPrompt(sessionKey, rowT('errors.provider.tryAgainMessage', { reason }))
    },
    [busy, sendDemoPrompt, sessionKey, rowT]
  )

  // ── The PDF export ────────────────────────────────────────────
  const canExportPdf = useMemo(
    () => hasExportableContent(messages, inAppVerbose),
    [messages, inAppVerbose]
  )

  // ── Drag and drop ─────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // The dragleave fires on every child boundary; only clear the flag when we
    // leave the chat container itself (relatedTarget outside).
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as Node).contains(related)) return
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if ((e.dataTransfer.files?.length ?? 0) === 0) return
      demoAction()
    },
    [demoAction]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLElement>) => {
      if ((e.clipboardData?.files?.length ?? 0) === 0) return
      // Intercept clipboard files so they don't end up as binary noise pasted
      // into the textarea. Plain text paste keeps default behavior.
      e.preventDefault()
      demoAction()
    },
    [demoAction]
  )

  const hasMessages = messages.length > 0
  const placeholderAlign = useMemo(() => (isRtl ? 'text-right' : 'text-left'), [isRtl])
  const canSend = draft.trim().length > 0

  return (
    <main
      className={cn('bg-bg relative flex h-full w-full flex-col', pageTopPadding)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {dragActive && (
        <div
          aria-hidden
          className={cn(
            'bg-bg/80 pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 backdrop-blur',
            'text-fg text-sm font-medium'
          )}
        >
          <CloudUploadIcon size={40} className="text-accent" />
          {t('chat.dropToAttach')}
        </div>
      )}
      {/* The folders this conversation changed files in — chips on the row
          the FloatingChrome owns, between its two glass discs. */}
      <TouchedFolders folders={touchedFolders} />
      <div
        ref={scrollerRef}
        className="relative flex flex-1 flex-col-reverse overflow-x-hidden overflow-y-auto px-6 py-8 max-sm:px-3 max-sm:py-5"
      >
        <div
          className={cn(
            // `w-full` is essential: as a flex item of the column-reverse
            // scroller, `mx-auto` alone would shrink this wrapper to its
            // content width (collapsing the column and centering bubbles).
            'mx-auto flex w-full max-w-3xl flex-col gap-4',
            // Empty state centers the welcome; otherwise the conversation
            // bottom-pins via the column-reverse scroller — the newest message
            // is glued to the bottom from the first frame.
            !hasMessages && 'h-full justify-center'
          )}
        >
          {!hasMessages && (
            <div className="text-fg flex flex-col items-center gap-4 text-center">
              {/* Project mode swaps the wolffish hero for the project's own
                  identity: emoji icon, title, and the instructions themselves —
                  the base every conversation here starts from. */}
              {sessionProject ? (
                <span aria-hidden className="text-6xl leading-none">
                  {sessionProject.icon || '📁'}
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/icon_transparent.png"
                  alt=""
                  aria-hidden
                  className="h-20 w-20 object-contain"
                  draggable={false}
                />
              )}
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {sessionProject
                    ? sessionProject.title.trim() || t('projects.untitled')
                    : t('chat.empty.title')}
                </h2>
                {sessionProject ? (
                  // The instructions in full, in the same capped code block the
                  // Projects cards draw — a prompt is the thing you actually
                  // came here to read, and two clamped lines never showed it.
                  sessionProject.instructions.trim() ? (
                    <pre
                      dir="auto"
                      className={cn(
                        'bg-surface border-border text-muted w-full max-w-md',
                        'max-h-40 overflow-auto overscroll-contain rounded-lg border px-3 py-2',
                        'text-start font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap'
                      )}
                    >
                      {sessionProject.instructions.trim()}
                    </pre>
                  ) : (
                    <p className="text-muted max-w-md text-sm leading-relaxed">
                      {t('projects.noInstructions')}
                    </p>
                  )
                ) : (
                  <p dir="auto" className="text-muted text-sm leading-relaxed">
                    {t('chat.empty.subtitle')}
                  </p>
                )}
              </div>
              {!hasAnyModel && (
                <div
                  className={cn(
                    'border-border bg-surface text-muted',
                    'mt-2 flex w-full max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-xs leading-relaxed'
                  )}
                >
                  <Settings02Icon size={14} className="shrink-0" aria-hidden />
                  <p className="flex-1">
                    {t('chat.noModel.notice')}
                    <br />
                    <button
                      type="button"
                      onClick={() => goTo('settings')}
                      className="text-primary hover:underline cursor-pointer font-medium"
                    >
                      {t('chat.noModel.settingsLink')}
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}
          <InAppVerboseContext.Provider value={inAppVerbose}>
            <InAppReasoningContext.Provider value={inAppReasoning}>
              {messages.map((m, i) => (
                <ChatItem
                  key={m.id}
                  message={m}
                  t={rowT}
                  todoLists={todoLists}
                  awaitingApproval={awaitingApproval}
                  awaitingAsk={awaitingAsk}
                  onApprovalDecision={respondApproval}
                  onAskRespond={respondAsk}
                  onTryAgain={
                    i === messages.length - 1 && !busy && m.role === 'assistant' && m.status === 'error'
                      ? handleTryAgain
                      : undefined
                  }
                />
              ))}
            </InAppReasoningContext.Provider>
          </InAppVerboseContext.Provider>
          {hasMessages && !hasAnyModel && (
            <div
              className={cn(
                'border-border bg-surface text-muted',
                'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs leading-relaxed self-start'
              )}
            >
              <Settings02Icon size={14} className="shrink-0" aria-hidden />
              <p className="flex-1">
                {t('chat.noModel.notice')}
                <br />
                <button
                  type="button"
                  onClick={() => goTo('settings')}
                  className="text-primary hover:underline cursor-pointer font-medium"
                >
                  {t('chat.noModel.settingsLink')}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Composer: identical for every conversation, whatever channel it came
          from. A phone / terminal / heartbeat / procedure conversation is
          continued from here exactly like an in-app one. */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (busy) stop()
          else send()
        }}
        className={cn(
          'bg-bg/80 relative z-40 p-3 backdrop-blur',
          !busy && 'border-t border-border/60'
        )}
      >
        {busy && <div className="rainbow-border" />}
        {queuedPrompts.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-full flex flex-col gap-2 px-4 pb-2">
            {/* Queued prompts live HERE, above the composer — never in the
                feed. A message only enters the feed once its turn is sent. */}
            <div className="pointer-events-auto mx-auto flex max-h-40 w-full max-w-xl flex-col gap-1.5 overflow-y-auto">
              {queuedPrompts.map((q) => (
                <QueuedPromptRow key={q.id} prompt={q} onCancel={() => cancelQueued(q.id)} />
              ))}
            </div>
          </div>
        )}
        {/* One surface, Codex/Claude-style: the prompt IS the composer. The
            card carries the border/background that used to belong to the
            textarea; every control rides INSIDE it. Top zone: just the
            textarea. Bottom zone: model + usage at the start, message actions
            + send at the end. */}
        <div className="border-border bg-surface focus-within:border-muted relative flex w-full flex-col rounded-xl border">
          <div className="flex w-full items-start">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  // Mid-turn this queues instead of sending — send() branches
                  // on `busy`.
                  send()
                }
              }}
              rows={1}
              placeholder={busy ? t('chat.queue.placeholder') : t('chat.placeholder')}
              dir={isRtl ? 'rtl' : 'ltr'}
              className={cn(
                'text-fg placeholder:text-muted max-h-40 min-h-[38px] min-w-0 flex-1 resize-none bg-transparent px-3.5 pt-2.5 pb-0.5 text-sm outline-none',
                placeholderAlign
              )}
            />
          </div>
          {/* Below 640px the footer wraps into two rows — the chips (model,
              meter, logs, files) then the action buttons — because seven
              controls plus a model name never fit one 360px line without
              squeezing the send button off the end. */}
          <div className="flex w-full items-center gap-1 px-1.5 pb-1.5 max-sm:flex-wrap">
            {/* Reasoning effort and chat mode ride INSIDE this card's chip
                rows (two rows above the model list) — one panel for every
                model knob instead of three composer pills. */}
            <ModelSwitch
              model={selectedModel}
              disabled={busy}
              reasoningModes={reasoningModes}
              reasoningMode={thinkingMode}
              chatMode={chatMode}
              bypass={bypass}
              showControls
              onSelectReasoning={onSelectReasoning}
              onSelectChatMode={onSelectChatMode}
              onToggleBypass={onToggleBypass}
            />
            <ContextMeter
              used={contextTokens ?? 0}
              budget={contextBudget ?? 0}
              compactionAt={compactionAt}
              locale={locale}
              turnStartedAt={turnStartedAt}
              turnEndedAt={turnEndedAt}
              turnInputTokens={inputTokens}
              turnOutputTokens={outputTokens}
              turnCacheReadTokens={cacheReadTokens}
              turnCacheWriteTokens={cacheWriteTokens}
              lastTurn={convStats?.lastTurn ?? null}
              allTime={convStats?.allTime ?? null}
              sideSpend={null}
              workflow={workflowSpend}
              lastCall={lastCall}
              usageUnavailable={false}
              meterModel={meterModel}
              activeModel={selectedModel}
              provider={lastCall?.provider ?? convStats?.lastTurn?.provider ?? (selectedModel ? PROVIDER : null)}
            />
            {/* Logs and files ride beside the meter rather than inside its
                card: the footer's start edge has the room, and one click opens
                the sheet instead of hover-card → button. Icon + count only —
                the count is the label. A chip with nothing behind it is dead
                weight, so each one stays out of the row until its count is
                non-zero. */}
            <SheetCountButton
              icon={<ComputerTerminal01Icon size={14} />}
              count={timelineEventCount}
              label={t('chat.timeline.viewLogs')}
              countLabel={t('chat.timeline.eventCount', { count: timelineEventCount })}
              onOpen={() => setTimelineOpen(true)}
            />
            <SheetCountButton
              icon={<Files01Icon size={14} />}
              count={presentFiles.length}
              label={t('chat.files.viewFiles')}
              countLabel={t('chat.files.fileCount', { count: presentFiles.length })}
              onOpen={() => setFilesOpen(true)}
            />
            {/* Spacer on desktop; on phones it takes a whole line so the
                action buttons break onto their own row. */}
            <div className="min-w-0 flex-1 max-sm:basis-full" />
            {/* Plan mode, leading the end-edge cluster beside the draft
                editor button. A stance for the next turns: the turn runs
                read-only and writes a plan the user approves before anything
                changes. Kept per conversation for the session, never
                persisted — a reopened chat starts with it off. */}
            {hasAnyModel && (
              <button
                type="button"
                onClick={() => setPlanMode(!planMode)}
                aria-pressed={planMode}
                title={planMode ? t('chat.planMode.onTitle') : t('chat.planMode.offTitle')}
                className={cn(
                  'me-1 flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2 text-xs font-medium',
                  // Leads the wrapped action row on phones, the way the draft
                  // editor button did before this chip sat in front of it.
                  'max-sm:ms-auto',
                  planMode
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-surface text-muted hover:text-fg'
                )}
              >
                <Task01Icon size={14} aria-hidden />
                {t('chat.planMode.label')}
              </button>
            )}
            {/* Opens the draft in the full-height CodeMirror sheet — leads the
                end-edge cluster. It names the sheet it opens, the way the
                automation, project and procedure editors name theirs. */}
            <button
              type="button"
              onClick={() => setDraftExpanded(true)}
              title={t('chat.expandDraft')}
              aria-label={t('chat.expandDraft')}
              // The plan chip in front of it leads the wrapped row on phones
              // and carries the `ms-auto`; this button follows it in the same
              // cluster. Without a model there is no chip, and the cluster
              // simply starts at the row's start edge.
              className="text-muted hover:text-fg hover:bg-border/40 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg"
            >
              <Edit02Icon size={16} />
            </button>
            {/* Hidden outright when the chat has nothing printable — an
                always-present-but-disabled download reads as broken. */}
            {canExportPdf && (
              <button
                type="button"
                onClick={demoAction}
                disabled={busy}
                title={t('chat.downloadPdf')}
                aria-label={t('chat.downloadPdf')}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  'text-muted enabled:hover:text-fg enabled:hover:bg-border/40',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  !busy && 'cursor-pointer'
                )}
              >
                <Download01Icon size={16} />
              </button>
            )}
            {/* Picking a folder stays live mid-turn — it rides the next queued
                prompt, same as an attachment. Removing is locked while the
                turn runs so the agent can't lose a folder it's working in. */}
            <WorkingFolderButton
              key={activeConversationId ?? 'none'}
              folders={workingFolders}
              onAdd={demoAction}
              onRemove={demoAction}
              removeDisabled={busy}
            />
            {/* Attaching stays live mid-turn — staged files ride the next
                queued prompt instead of the running one. */}
            <button
              type="button"
              onClick={demoAction}
              title={t('chat.attachFile')}
              aria-label={t('chat.attachFile')}
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                'text-muted hover:text-fg hover:bg-border/40',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                'cursor-pointer'
              )}
            >
              <Image02Icon size={16} />
            </button>
            {/* Recording stays live mid-turn, like attaching: the take is
                queued instead of sent, and goes out when the turn ends. */}
            <button
              type="button"
              onClick={demoAction}
              title={busy ? t('chat.voice.queue') : t('chat.voice.record')}
              aria-label={busy ? t('chat.voice.queue') : t('chat.voice.record')}
              className={cn(
                'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg',
                'text-muted hover:text-fg hover:bg-border/40',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
              )}
            >
              <Mic01Icon size={16} />
            </button>
            {/* Mid-turn the composer keeps a primary send: it QUEUES the draft
                (send() branches on `busy`) while the red submit button next to
                it stays the Stop. Enter matches the arrow. */}
            {busy && (
              <button
                type="button"
                onClick={send}
                disabled={!hasAnyModel || !canSend}
                title={t('chat.queue.add')}
                aria-label={t('chat.queue.add')}
                className={cn(
                  'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full max-sm:h-9 max-sm:w-9',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'bg-primary text-primary-fg enabled:hover:brightness-110'
                )}
              >
                <ArrowUp02Icon size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={!hasAnyModel || (!busy && !canSend)}
              aria-label={busy ? t('chat.stop') : t('chat.send')}
              className={cn(
                'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full max-sm:h-9 max-sm:w-9',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                'disabled:cursor-not-allowed disabled:opacity-50',
                busy
                  ? 'bg-red-600 text-white enabled:hover:bg-red-700'
                  : 'bg-primary text-primary-fg enabled:hover:brightness-110'
              )}
            >
              {busy ? <StopCircleIcon size={16} /> : <ArrowUp02Icon size={16} />}
            </button>
          </div>
        </div>
      </form>
      {/* The expanded composer — the file viewers' own expand sheet, over the
          same draft state, so what is written here is what the composer sends
          once this closes. Gated on `visible`, for the reason the portals
          below are: it mounts to <body>, so a hidden session's sheet would
          otherwise paint over whatever screen is actually in front. */}
      <ExpandedSheet
        open={visible && draftExpanded}
        onClose={() => setDraftExpanded(false)}
        title={t('chat.expandDraft')}
      >
        <CodeEditor
          value={draft}
          language="markdown"
          background="field"
          isDark={isDark}
          onChange={setDraft}
          className="h-full overflow-auto"
          placeholder={t('chat.placeholder')}
          spellcheck
        />
      </ExpandedSheet>
      {/* Gated on visibility: these portal to <body>, so without this they
          would escape the hidden wrapper and paint over another screen (or
          another session's view). */}
      {visible &&
        timelineOpen &&
        createPortal(
          <div
            role="presentation"
            onClick={() => setTimelineOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          >
            <aside
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="wf-sheet-panel-end border-border bg-surface absolute inset-y-0 end-0 flex w-[80vw] max-w-full flex-col overflow-hidden border-s shadow-xl max-sm:w-[92vw]"
            >
              <div className="border-border flex shrink-0 items-center justify-between border-b px-5 py-3 pt-12 max-sm:px-3">
                <h2 className="text-fg min-w-0 flex-1 truncate text-sm font-semibold">
                  {messages.find((m) => m.role === 'user')?.content || t('chat.timeline.title')}
                </h2>
                <span
                  className={cn(
                    'ms-3 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    chatMode === 'workflow'
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted'
                  )}
                >
                  {chatMode === 'workflow' ? (
                    <WorkflowSquare03Icon size={11} />
                  ) : (
                    <BubbleChatIcon size={11} />
                  )}
                  {t(chatMode === 'workflow' ? 'chat.modePicker.workflow' : 'chat.modePicker.single')}
                </span>
                <span className="text-muted ms-3 shrink-0 text-[10px] tabular-nums">
                  {t('chat.timeline.eventCount', { count: timelineEventCount })}
                </span>
              </div>
              <TimelineList entries={displayTimeline} locale={locale} />
            </aside>
          </div>,
          document.body
        )}
      {visible &&
        filesOpen &&
        presentFiles.length > 0 &&
        createPortal(
          <div
            role="presentation"
            onClick={() => setFilesOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          >
            <aside
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="wf-sheet-panel-end border-border bg-surface absolute inset-y-0 end-0 flex w-[80vw] max-w-full flex-col overflow-hidden border-s shadow-xl max-sm:w-[92vw]"
            >
              <div className="border-border flex shrink-0 items-center justify-between border-b px-5 py-3 pt-12 max-sm:px-3">
                <h2 className="text-fg min-w-0 flex-1 truncate text-sm font-semibold">
                  {t('chat.files.title')}
                </h2>
                <span
                  className={cn(
                    'ms-3 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    chatMode === 'workflow'
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted'
                  )}
                >
                  {chatMode === 'workflow' ? (
                    <WorkflowSquare03Icon size={11} />
                  ) : (
                    <BubbleChatIcon size={11} />
                  )}
                  {t(chatMode === 'workflow' ? 'chat.modePicker.workflow' : 'chat.modePicker.single')}
                </span>
                <span className="text-muted ms-3 shrink-0 text-[10px] tabular-nums">
                  {t('chat.files.fileCount', { count: presentFiles.length })}
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 max-sm:px-3">
                <AttachmentList attachments={presentFiles} variant="grid" />
              </div>
            </aside>
          </div>,
          document.body
        )}
    </main>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────

function relativeTime(ts: number, locale: string): string {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (d > 0) return rtf.format(-d, 'day')
    if (h > 0) return rtf.format(-h, 'hour')
    if (m > 0) return rtf.format(-m, 'minute')
    if (s < 5) return rtf.format(0, 'second') // "now" / "الآن"
    return rtf.format(-s, 'second')
  } catch {
    if (d > 0) return `${d}d ago`
    if (h > 0) return `${h}h ago`
    if (m > 0) return `${m}m ago`
    if (s < 5) return 'just now'
    return `${s}s ago`
  }
}

const TIMELINE_KIND_COLOR: Record<string, string> = {
  'turn.started': 'bg-accent',
  'context.built': 'bg-sky-500',
  'llm.response': 'bg-indigo-500',
  'tool.called': 'bg-blue-500',
  'tool.completed': 'bg-emerald-500',
  'tool.failed': 'bg-red-500',
  'safety.allowed': 'bg-emerald-500',
  'safety.blocked': 'bg-red-500',
  'safety.approved': 'bg-emerald-500',
  'safety.denied': 'bg-amber-500',
  'compaction.started': 'bg-blue-500',
  'compaction.applied': 'bg-violet-500',
  'task.created': 'bg-sky-500',
  'task.stepCompleted': 'bg-emerald-500',
  'task.completed': 'bg-emerald-500',
  'task.failed': 'bg-red-500',
  'task.stopped': 'bg-amber-500',
  'segment.tool_call': 'bg-blue-500',
  'segment.workflow': 'bg-primary',
  'segment.tool_result': 'bg-violet-500',
  'segment.compaction': 'bg-violet-500'
}

function CompactionStartedCard({
  messagesCount,
  targetsCount,
  tokenCount,
  tokenBudget,
  startedAt
}: {
  messagesCount: number
  targetsCount: number
  tokenCount: number
  tokenBudget: number
  startedAt: number
}): React.JSX.Element {
  const { t } = useTranslation()
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [])
  const elapsedMs = now - startedAt
  return (
    <div className="border-border bg-surface w-full max-w-[85%] max-sm:max-w-full self-start rounded-2xl border px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 animate-pulse dark:text-blue-400">
          {t('chat.compactionCard.title')}
        </span>
        <span className="text-muted shrink-0 text-xs tabular-nums">
          {formatCompactionElapsed(elapsedMs)}
        </span>
      </div>
      <p className="text-muted mt-1 text-xs">
        {t('chat.compactionCard.compacting', {
          targets: targetsCount,
          messages: messagesCount,
          current: formatCompact(tokenCount),
          limit: formatCompact(tokenBudget)
        })}
      </p>
    </div>
  )
}

function formatCompactionElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const totalSeconds = ms / 1000
  if (totalSeconds < 60) return `${totalSeconds.toFixed(totalSeconds < 10 ? 1 : 0)}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}m ${seconds}s`
}

// Render a duration in seconds — never raw milliseconds. Sub-ten-second values
// keep one decimal ("0.3s", "9.4s") so short turns stay legible; past a minute
// we roll up into m/s and h/m because "1m 49s" scans far better than "109s".
function formatDuration(ms: number): string {
  const totalSec = ms / 1000
  if (totalSec < 10) return `${totalSec.toFixed(1)}s`
  // Round to whole seconds first so the m/s split can never yield "1m 60s".
  const rounded = Math.round(totalSec)
  if (rounded < 60) return `${rounded}s`
  const min = Math.floor(rounded / 60)
  const sec = rounded % 60
  if (min < 60) return sec === 0 ? `${min}m` : `${min}m ${sec}s`
  const hr = Math.floor(min / 60)
  const remMin = min % 60
  return remMin === 0 ? `${hr}h` : `${hr}h ${remMin}m`
}

// A composer-footer chip for a sheet that has a count: icon + number, no text.
// Zero renders nothing at all — there is no sheet worth opening behind an
// empty log or file list, and a greyed-out chip only advertises that absence.
function SheetCountButton({
  icon,
  count,
  label,
  countLabel,
  onOpen
}: {
  icon: ReactNode
  count: number
  label: string
  /** Pluralized "N events" / "N files" — the count for screen readers. */
  countLabel: string
  onOpen: () => void
}): React.JSX.Element | null {
  if (count === 0) return null
  return (
    <button
      type="button"
      onClick={onOpen}
      title={label}
      aria-label={`${label} (${countLabel})`}
      className={cn(
        // The same frame the ContextMeter wears beside it: 28px tall, 8px
        // radius, a 1px stroke in the border token and no fill. The hover wash
        // is the single departure: unlike the meter's hover-card trigger these
        // chips actually click, so they keep the affordance.
        'flex h-7 shrink-0 items-center gap-1 rounded-lg border border-border px-1.5',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'text-muted hover:text-fg hover:bg-border/40 cursor-pointer'
      )}
    >
      {icon}
      <span className="text-[10px] font-medium leading-none tabular-nums" dir="ltr">
        {count}
      </span>
    </button>
  )
}

// The working-folder control: a bordered card that reveals the folder list on
// hover and pins it open on click — the same hover(150ms)/pin/Escape/outside-
// click model as the context meter. With no folders yet it is a plain "select
// folder" button. The parent keys this by conversation id, so it remounts
// (popover reset) when the conversation changes.
function WorkingFolderButton({
  folders,
  onAdd,
  onRemove,
  removeDisabled
}: {
  folders: string[]
  onAdd: () => void
  onRemove: (folder: string) => void
  // Mid-turn (queue mode) the picker stays open for business — only the
  // per-folder delete locks, so a queued prompt can gain a folder but the
  // running turn can never lose one out from under it.
  removeDisabled: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const hasFolders = folders.length > 0

  // Escape unpins/closes; clicking outside while open/pinned closes.
  useEffect(() => {
    if (!open && !pinned) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setPinned(false)
        setOpen(false)
      }
    }
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPinned(false)
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, pinned])

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
    }
  }, [])

  const onEnter = (): void => {
    if (!hasFolders) return
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setOpen(true), 150)
  }
  const onLeave = (): void => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    if (pinned) return
    hoverTimer.current = setTimeout(() => setOpen(false), 200)
  }
  const cardVisible = (open || pinned) && hasFolders

  return (
    <div
      ref={rootRef}
      // Reference folders are a machine act (read-only here) and the phone
      // composer row has no space for them — desktop only.
      className="relative max-sm:hidden"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        onClick={() => {
          if (!hasFolders) {
            onAdd()
            return
          }
          setPinned((p) => {
            const next = !p
            if (next) setOpen(true)
            return next
          })
        }}
        onFocus={onEnter}
        onBlur={onLeave}
        aria-expanded={cardVisible}
        title={hasFolders ? t('chat.workingFolder') : t('chat.selectFolder')}
        aria-label={hasFolders ? t('chat.workingFolder') : t('chat.selectFolder')}
        className={cn(
          'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg',
          'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          hasFolders
            ? 'bg-primary/10 text-primary hover:bg-primary/20'
            : 'text-muted hover:text-fg hover:bg-border/40'
        )}
      >
        <Folder01Icon size={16} />
      </button>
      {cardVisible && (
        <div className="border-border bg-surface text-fg absolute bottom-full inset-e-0 z-20 mb-2 rounded-lg border px-2 py-2 text-xs shadow-md min-w-50 max-w-70">
          <div className="text-muted mb-1.5 text-[10px] font-medium uppercase tracking-wide whitespace-nowrap">
            {t('chat.workingFolder')}
          </div>
          <div dir="ltr" className="space-y-1.5">
            {folders.map((folder) => (
              <div key={folder} className="space-y-0.5">
                <div className="truncate text-xs" title={folder}>
                  {folder.split('/').pop()}
                </div>
                <div className="flex items-center gap-1">
                  <code
                    className="border-border bg-bg text-muted block min-w-0 flex-1 truncate rounded border px-1 py-0.5 font-mono text-[9px]"
                    title={folder}
                  >
                    {folder}
                  </code>
                  <button
                    type="button"
                    onClick={() => onRemove(folder)}
                    disabled={removeDisabled}
                    className={cn(
                      'text-muted/40 shrink-0',
                      'enabled:hover:text-red-500 enabled:cursor-pointer',
                      'disabled:cursor-not-allowed disabled:opacity-40'
                    )}
                    title={removeDisabled ? t('chat.removeFolderBusy') : t('chat.removeFolder')}
                    aria-label={t('chat.removeFolder')}
                  >
                    <Delete02Icon size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="text-muted hover:text-fg mt-1.5 flex w-full cursor-pointer items-center gap-1 text-[10px]"
          >
            <PlusSignIcon size={10} />
            {t('chat.addMore')}
          </button>
        </div>
      )}
    </div>
  )
}

function TimelineList({
  entries,
  locale
}: {
  entries: TimelineEntry[]
  locale: string
}): React.JSX.Element {
  const { t } = useTranslation()
  const endRef = useRef<HTMLDivElement>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  if (entries.length === 0) {
    return (
      <div className="text-muted/50 flex items-center justify-center py-8 text-xs">
        {t('heartbeat.overlay.waiting')}
      </div>
    )
  }

  // Number only real events (skip turn-boundary dividers) so the badges stay
  // contiguous — 1, 2, 3… — across every turn in the accumulated log.
  let running = 0
  const eventNumbers = entries.map((e) => (e.kind === 'turn.started' ? 0 : ++running))

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-3 max-sm:px-3">
      <div className="flex flex-col gap-1">
        {entries.map((entry, i) => {
          const isLast = i === entries.length - 1
          // A turn boundary renders as a labeled divider, not a numbered row —
          // it visually groups the events that follow into one turn.
          if (entry.kind === 'turn.started') {
            return (
              <div key={entry.id} className="mt-3 flex items-center gap-2 first:mt-0">
                <span className="bg-border/60 h-px flex-1" />
                <span
                  dir="auto"
                  className="text-muted/60 max-w-[75%] shrink truncate text-[10px] font-medium"
                >
                  {entry.summary || t('chat.timeline.event.turn.started')}
                </span>
                <span className="bg-border/60 h-px flex-1" />
              </div>
            )
          }
          const color = TIMELINE_KIND_COLOR[entry.kind] ?? 'bg-muted/40'
          const label = t(`chat.timeline.event.${entry.kind}`, { defaultValue: entry.kind })
          const timeStr = relativeTime(entry.timestamp, locale)
          const content =
            entry.summary || entry.detail
              ? [entry.summary, entry.detail].filter(Boolean).join('\n')
              : null
          return (
            <div
              key={entry.id}
              className={cn(
                'rounded-lg px-3 py-2 text-xs',
                isLast ? 'text-fg bg-accent/5' : 'text-muted/70'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-semibold tabular-nums',
                    isLast ? `${color} text-white` : 'bg-muted/15 text-muted/50',
                    entry.kind === 'compaction.started' && 'animate-pulse'
                  )}
                >
                  {eventNumbers[i]}
                </span>
                <span className="font-semibold">{label}</span>
                {entry.kind === 'compaction.started' && (
                  <span className="text-blue-500 animate-pulse text-[10px]">●</span>
                )}
                <span className="flex-1" />
                <span className="text-muted/40 shrink-0 text-[10px] tabular-nums">{timeStr}</span>
              </div>
              {content && (
                <div className="group/tl relative mt-1.5 ms-4">
                  <pre
                    dir="ltr"
                    className={cn(
                      'overflow-x-auto rounded-md border px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap wrap-break-word',
                      isLast
                        ? 'bg-bg border-border text-fg/80'
                        : 'bg-bg/50 border-border/50 text-muted/50'
                    )}
                  >
                    {content}
                  </pre>
                  <div className="absolute right-1.5 top-1.5 opacity-0 group-hover/tl:opacity-100">
                    <CopyButton text={content} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
    </div>
  )
}

function buildSegmentTimelineEntry(segment: Segment): TimelineEntry | null {
  const segKind = segment.kind
  const ts = Date.now()
  if (segKind === 'workflow') {
    // One line, dot-separated, no detail — mirrors the drawer's other rows.
    const snap = segment.snapshot
    const activePhase = snap.phases.find((p) => p.status === 'active')?.title
    const line = [
      snap.status,
      activePhase ?? null,
      `${snap.totals.agents} agent${snap.totals.agents === 1 ? '' : 's'}`,
      `${snap.totals.toolCalls} tool${snap.totals.toolCalls === 1 ? '' : 's'}`
    ]
      .filter(Boolean)
      .join(' · ')
    return {
      id: segment.segmentId,
      timestamp: ts,
      kind: 'segment.workflow',
      summary: line
    }
  }
  if (segKind === 'tool_call') {
    const args = segment.args
    const action =
      typeof args.command === 'string'
        ? args.command
        : typeof args.path === 'string'
          ? args.path
          : typeof args.query === 'string'
            ? args.query
            : null
    return {
      id: segment.segmentId,
      timestamp: ts,
      kind: `segment.${segKind}`,
      summary: segment.name,
      detail: action ?? (Object.keys(args).length > 0 ? JSON.stringify(args, null, 2) : undefined)
    }
  }
  if (segKind === 'tool_result') {
    const output = segment.output || segment.error || ''
    return {
      id: segment.segmentId,
      timestamp: ts,
      kind: `segment.${segKind}`,
      summary: segment.status,
      detail: output ? (output.length > 2000 ? output.slice(0, 2000) + '…' : output) : undefined
    }
  }
  if (segKind === 'compaction') {
    const lines = segment.details.map((d) => {
      const pct =
        d.originalChars > 0 ? Math.round((1 - d.compactedChars / d.originalChars) * 100) : 0
      return `${d.toolName ?? 'unknown'}: ${d.originalChars} → ${d.compactedChars} chars (${pct}% reduced)`
    })
    lines.unshift(
      `~${formatCompact(segment.tokensSaved)} tokens saved in ${formatDuration(segment.durationMs)}`
    )
    return {
      id: segment.segmentId,
      timestamp: ts,
      kind: `segment.${segKind}`,
      detail: lines.join('\n')
    }
  }
  return null
}

/**
 * Reconstruct a conversation's event log from its messages: one `turn.started`
 * divider per user prompt, then a row per tool call / result (plus any
 * workflow / compaction segments). Timestamps come from the owning message so
 * rows read the right times instead of "just now", and ids fall back to a
 * positional key when a segment carries none.
 */
export function deriveTimelineFromMessages(messages: ChatMessage[]): TimelineEntry[] {
  const out: TimelineEntry[] = []
  messages.forEach((message, mi) => {
    if (message.role === 'user') {
      const clean = (message.content ?? '').trim().replace(/\s+/g, ' ')
      out.push({
        id: `derived_turn_${mi}`,
        timestamp: message.timestamp ?? 0,
        kind: 'turn.started',
        ...(clean ? { summary: clean.length > 140 ? `${clean.slice(0, 140)}…` : clean } : {})
      })
      return
    }
    message.segments.forEach((segment, si) => {
      const entry = buildSegmentTimelineEntry(segment)
      if (!entry) return
      out.push({
        ...entry,
        id: entry.id || `derived_${mi}_${si}`,
        timestamp: message.timestamp ?? entry.timestamp
      })
    })
  })
  return out
}

// ── The feed ──────────────────────────────────────────────────────────────

function useRelativeTime(ts: number | undefined): string | null {
  const { i18n } = useTranslation()
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!ts) return
    const id = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [ts])
  return ts ? relativeTime(ts, i18n.language) : null
}

type ChatItemProps = {
  message: ChatMessage
  t: TFunction
  /** Every task list in its latest state — see Chat's todoLists memo. */
  todoLists: Map<string, TodoItem[]>
  awaitingApproval: boolean
  awaitingAsk: boolean
  onApprovalDecision: (id: string, decision: 'approved' | 'denied') => void
  onAskRespond: (askId: string, response: AskUserResponse) => void
  /** Present only on the last message when it's a failed turn and no turn is running. */
  onTryAgain?: (reason: string) => void
}

// Memoized so a streaming turn (or any parent state tick) re-renders ONLY the
// rows that actually changed instead of the whole feed.
const ChatItem = memo(
  function ChatItem({
    message,
    t,
    todoLists,
    awaitingApproval,
    awaitingAsk,
    onApprovalDecision,
    onAskRespond,
    onTryAgain
  }: ChatItemProps): React.JSX.Element {
    if (message.role === 'user') {
      return (
        <UserBubble
          content={message.content}
          attachments={message.attachments}
          transcribing={message.transcribing}
          voicePrompt={message.voicePrompt}
          timestamp={message.timestamp}
          t={t}
        />
      )
    }
    return (
      <AssistantBubble
        message={message}
        todoLists={todoLists}
        awaitingApproval={awaitingApproval}
        awaitingAsk={awaitingAsk}
        onApprovalDecision={onApprovalDecision}
        onAskRespond={onAskRespond}
        onTryAgain={onTryAgain}
      />
    )
  },
  (prev, next) => {
    // Re-render only when this row's own inputs change. The callbacks are
    // useCallback-stable and message identity changes solely for the message
    // that was actually mutated (new segment, approval/ask update, status flip).
    if (prev.message !== next.message) return false
    if (prev.t !== next.t) return false
    // A todo_write anywhere in the conversation may resolve THIS row's card.
    if (prev.todoLists !== next.todoLists) return false
    if (prev.onApprovalDecision !== next.onApprovalDecision) return false
    if (prev.onAskRespond !== next.onAskRespond) return false
    // Flips between undefined and a stable callback as the row gains/loses
    // "last failed message while idle" status — must invalidate the memo.
    if (prev.onTryAgain !== next.onTryAgain) return false
    // awaitingApproval/awaitingAsk are GLOBAL booleans passed to every row but
    // only drive the streaming bubble's "Awaiting…" placeholder.
    if (next.message.role === 'assistant' && next.message.status === 'streaming') {
      return prev.awaitingApproval === next.awaitingApproval && prev.awaitingAsk === next.awaitingAsk
    }
    return true
  }
)

/**
 * Exported for the admin transcript viewer, which must render another
 * employee's conversation EXACTLY as that employee saw it. A second,
 * admin-only renderer would drift from this one message type at a time, and
 * the drift would be invisible — a transcript that looks plausible while
 * omitting a card. Same components, same input shape, one source of truth.
 */
export function UserBubble({
  content,
  attachments,
  transcribing,
  voicePrompt,
  timestamp,
  t
}: {
  content: string
  attachments?: MessageAttachment[]
  transcribing?: boolean
  voicePrompt?: boolean
  timestamp?: number
  t: (k: string, opts?: Record<string, unknown>) => string
}): React.JSX.Element {
  // A voice note's own player IS the prompt on screen. The transcript is still
  // what `content` stores — history, titling and export all read it — but
  // printing it back under the player only repeats what the user said out loud.
  const hasContent = content.length > 0 && !voicePrompt
  const hasAttachments = !!attachments && attachments.length > 0
  const timeLabel = useRelativeTime(timestamp)
  const showFooter = !transcribing && hasContent
  return (
    <div className="flex w-full flex-col gap-1.5 items-end">
      {transcribing ? (
        <div className="bg-primary text-primary-fg max-w-[85%] max-sm:max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed wrap-break-word">
          <span className="animate-pulse">{t('chat.voice.transcribing')}</span>
        </div>
      ) : (
        hasContent && (
          <div
            data-select-root
            className="bg-primary text-primary-fg max-w-[85%] max-sm:max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed wrap-anywhere [&_h1]:text-inherit [&_h2]:text-inherit [&_h3]:text-inherit [&_h4]:text-inherit [&_code]:text-inherit [&_code]:bg-primary-fg/15 [&_pre_pre]:bg-primary-fg/10 [&_pre_pre]:text-inherit [&_pre_pre]:border-primary-fg/20 [&_a]:text-primary-fg [&_blockquote]:text-inherit [&_blockquote]:border-primary-fg/40 [&_table]:border-primary-fg/20 [&_th]:border-primary-fg/20 [&_td]:border-primary-fg/20 [&_thead]:bg-primary-fg/10 [&_hr]:border-primary-fg/30"
          >
            <Markdown content={content} />
          </div>
        )
      )}
      {hasAttachments && (
        <div className="flex w-full flex-col items-end gap-2">
          <AttachmentList attachments={attachments!} align="end" />
        </div>
      )}
      {showFooter && (
        <div className="flex items-center gap-1.5">
          <CopyButton
            text={content}
            variant="inline"
            ariaLabelKey="chat.copyMessage"
            className="px-2"
          />
          {timeLabel && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Clock01Icon size={14} />
              {timeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function AssistantBubble({
  message,
  todoLists,
  awaitingApproval,
  awaitingAsk,
  onApprovalDecision,
  onAskRespond,
  onTryAgain
}: {
  message: AssistantMessage
  todoLists: Map<string, TodoItem[]>
  awaitingApproval: boolean
  awaitingAsk: boolean
  onApprovalDecision: (id: string, decision: 'approved' | 'denied') => void
  onAskRespond: (askId: string, response: AskUserResponse) => void
  onTryAgain?: (reason: string) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const verbose = useContext(InAppVerboseContext)
  const showReasoning = useContext(InAppReasoningContext)
  const isStreaming = message.status === 'streaming'
  const isError = message.status === 'error'
  const [typedText, setTypedText] = useState('')
  const wordsRef = useRef<string[]>([])

  useEffect(() => {
    const words = [...(t('chat.thinkingWords', { returnObjects: true }) as unknown as string[])]
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[words[i], words[j]] = [words[j], words[i]]
    }
    wordsRef.current = words
  }, [t])

  useEffect(() => {
    if (!isStreaming) return
    let wordIdx = 0
    let charIdx = 0
    let wait = 0
    let phase: 'typing' | 'pause' = 'typing'

    const id = setInterval(() => {
      const words = wordsRef.current
      if (words.length === 0) return
      const c = [...words[wordIdx % words.length]]

      if (phase === 'typing') {
        charIdx++
        setTypedText(c.slice(0, charIdx).join(''))
        if (charIdx >= c.length) {
          phase = 'pause'
          wait = 0
        }
      } else {
        if (++wait >= 40) {
          // 2s hold then next word
          wordIdx = (wordIdx + 1) % words.length
          charIdx = 0
          phase = 'typing'
        }
      }
    }, 50)

    return () => clearInterval(id)
  }, [isStreaming])

  const renderable = renderSegments(
    message.segments,
    message.approvals,
    message.asks,
    message.toolTimings,
    onApprovalDecision,
    onAskRespond,
    verbose,
    showReasoning,
    todoLists
  )
  const showThinking = isStreaming && renderable.empty
  const fullText = useMemo(() => collectText(message.segments), [message.segments])
  const showCopy = !isStreaming && !isError && fullText.length > 0
  const timeLabel = useRelativeTime(message.timestamp)

  if (isError && message.error) {
    const providerSeg = message.segments.find(
      (s): s is Extract<Segment, { kind: 'turn_end' }> =>
        s.kind === 'turn_end' && !!s.providerErrors?.length
    )
    if (providerSeg?.providerErrors?.length) {
      return (
        <div className="flex flex-col gap-1 items-start">
          <ProviderErrorCards failures={providerSeg.providerErrors} onTryAgain={onTryAgain} />
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-1 items-start">
        <ProviderErrorCards
          failures={[
            {
              provider: 'unknown',
              providerLogo: '',
              statusCode: null,
              errorReason: message.error,
              errorDetail: null,
              retriesAttempted: 0,
              totalDurationMs: 0
            }
          ]}
          onTryAgain={onTryAgain}
        />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2 items-start">
      {showThinking ? (
        <div className="bg-surface border-border text-fg max-w-[85%] max-sm:max-w-full rounded-2xl border px-4 py-2.5 text-sm leading-relaxed wrap-break-word">
          <span className="text-muted italic">
            {awaitingApproval ? (
              <span className="animate-pulse">{t('chat.awaitingPermission')}</span>
            ) : awaitingAsk ? (
              <span className="animate-pulse">{t('chat.awaitingAnswer')}</span>
            ) : (
              <span className="animate-pulse">{typedText}…</span>
            )}
          </span>
        </div>
      ) : (
        renderable.blocks
      )}
      {showCopy && (
        <div className="flex items-center gap-1.5">
          <CopyButton
            text={fullText}
            variant="inline"
            ariaLabelKey="chat.copyMessage"
            className="px-2"
          />
          {timeLabel && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Clock01Icon size={14} />
              {timeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

type RenderResult = { blocks: ReactNode; empty: boolean }

function renderSegments(
  segments: Segment[],
  approvals: Record<string, ApprovalCardState> | undefined,
  asks: Record<string, AskCardState> | undefined,
  toolTimings: Record<string, ToolTiming> | undefined,
  onApprovalDecision: (id: string, decision: 'approved' | 'denied') => void,
  onAskRespond: (askId: string, response: AskUserResponse) => void,
  verbose: boolean,
  showReasoning: boolean,
  todoLists: Map<string, TodoItem[]> = new Map()
): RenderResult {
  const blocks: ReactNode[] = []
  let textBuffer = ''
  let textRun = 0
  let reasoningBuffer = ''
  let reasoningRun = 0
  // In-place reasoning (kind 'reasoning') supersedes the legacy turn_end copy:
  // when any exists in this message, the turn_end card is skipped or the final
  // iteration's thinking would render twice.
  const hasReasoningSegments = segments.some((s) => s.kind === 'reasoning' && !s.worker)
  // Generic guard: every file path already rendered as a player/viewer in this
  // message. Prevents the same file showing twice when it's reachable from more
  // than one detector. Rebuilt every render, so the per-render scope IS the TTL.
  const emittedFiles = new Set<string>()
  const emitOnce = (filePath: string): boolean => {
    if (emittedFiles.has(filePath)) return false
    emittedFiles.add(filePath)
    return true
  }

  // A run of streamed thinking flushes as one collapsed ReasoningCard at its
  // true position — above the prose/tool activity that thinking produced. At
  // most one of textBuffer/reasoningBuffer is ever non-empty, so flushText
  // draining both below can never reorder them.
  const flushReasoning = (): void => {
    // Thinking hidden (default): drop the run instead of carding it.
    if (!showReasoning) {
      reasoningBuffer = ''
      return
    }
    if (reasoningBuffer.trim().length === 0) {
      reasoningBuffer = ''
      return
    }
    reasoningRun += 1
    blocks.push(<ReasoningCard key={`rs-${reasoningRun}`} content={reasoningBuffer} />)
    reasoningBuffer = ''
  }

  const flushTextOnly = (): void => {
    if (textBuffer.length === 0) return
    textRun += 1
    // A standalone wolffish-media image (e.g. a generated chart) renders as a
    // proper file card — filename + reveal/download — matching every other
    // attachment, instead of a bare floating photo.
    const mediaImage = textBuffer.trim().match(/^!\[[^\]]*\]\(wolffish-media:\/\/([^)]+)\)$/)
    if (mediaImage) {
      const relativePath = mediaImage[1]
      const mediaFileName = relativePath.split('/').pop() ?? 'image'
      const mediaExt = (mediaFileName.match(/\.[^./\\]+$/)?.[0] ?? '').toLowerCase()
      const mediaMime = `image/${mediaExt === '.jpg' ? 'jpeg' : mediaExt.slice(1) || 'png'}`
      blocks.push(
        <ImageViewer
          key={`md-${textRun}`}
          filePath={relativePath}
          fileExists={true}
          mimeType={mediaMime}
          fileName={mediaFileName}
        />
      )
      textBuffer = ''
      return
    }
    blocks.push(
      <div
        key={`md-${textRun}`}
        data-select-root
        className="bg-surface border-border text-fg max-w-[85%] max-sm:max-w-full rounded-2xl border px-4 py-2.5 text-sm leading-relaxed self-start wrap-anywhere"
      >
        <Markdown content={textBuffer} />
      </div>
    )
    textBuffer = ''
  }

  const flushText = (): void => {
    flushTextOnly()
    flushReasoning()
  }

  // One O(n) index of tool results by call id so the loops below resolve a
  // call's result in O(1). First-match semantics preserved (don't overwrite).
  const resultByToolCall = new Map<string, ToolResultSegment>()
  for (const s of segments) {
    if (s.kind === 'tool_result' && !resultByToolCall.has(s.toolCallId))
      resultByToolCall.set(s.toolCallId, s)
  }

  // Voice replies: a turn surfaces at most ONE voice_respond memo — the LAST
  // one. The model occasionally replies, then redoes the reply; only the final
  // voice_respond is the real answer. voice_generate ASSETS are unaffected.
  let lastVoiceReplyId: string | null = null
  for (const s of segments) {
    if (s.kind !== 'tool_call') continue
    const r = resultByToolCall.get(s.toolCallId)
    const v = r?.status === 'success' ? parseVoiceResult(r.output) : null
    if (v?.isResponse) lastVoiceReplyId = s.toolCallId
  }

  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const seg = segments[segIdx]
    if (seg.kind === 'text') {
      // LEGACY: worker-tagged segments only exist in conversations persisted by
      // the removed Orchestrator mode — never render them.
      if (seg.worker) continue
      // A pending thinking run preceded this prose — its card goes above.
      flushReasoning()
      textBuffer += seg.delta
    } else if (seg.kind === 'reasoning') {
      if (seg.worker) continue // LEGACY orchestrator-mode segments
      // Prose already buffered belongs to the previous iteration — it goes
      // above this thinking run. Text only: draining the reasoning buffer here
      // would split one streamed run into a card per tick.
      flushTextOnly()
      reasoningBuffer += seg.delta
    } else if (seg.kind === 'todo') {
      // The model's task list: one checklist card per LIST, at the turn that
      // created it, in its latest state — a later turn's write that continues
      // the list (listId ≠ turnId) resolves this card in place and draws
      // nothing of its own. Output FOR the user — renders on the clean feed.
      if (todoListId(seg) !== seg.turnId) continue
      flushText()
      blocks.push(
        <TodoCard key={`todo-${seg.turnId}`} items={todoLists.get(seg.turnId) ?? seg.items} />
      )
    } else if (seg.kind === 'workflow') {
      // The workflow card: one full-width, deterministic, collapsible block per
      // run. Snapshots are upserted by workflowId, so exactly one segment (the
      // latest state) exists per run.
      flushText()
      blocks.push(<WorkflowCard key={`wf-${seg.snapshot.workflowId}`} snapshot={seg.snapshot} />)
    } else if (seg.kind === 'tool_call') {
      if (seg.worker) continue // LEGACY orchestrator-mode segments
      flushText()
      // The master's workflow tools never render as chips (even in verbose) —
      // the workflow card above is their surface.
      if (WORKFLOW_TOOL_NAMES.has(seg.name)) continue
      const result = resultByToolCall.get(seg.toolCallId)

      // ask_user renders a dedicated interactive question card instead of a
      // tool card — always visible (the user must be able to answer), even on
      // the clean feed. Rendered while pending and after answering.
      if (seg.name === ASK_USER_TOOL) {
        const ask = asks?.[seg.toolCallId]
        if (ask || result) {
          blocks.push(
            <QuestionCard
              key={`ask_${seg.segmentId}`}
              args={seg.args}
              result={result}
              ask={ask}
              onRespond={onAskRespond}
            />
          )
        }
        continue
      }

      const approval = approvals?.[seg.toolCallId]
      const timing = toolTimings?.[seg.toolCallId]

      const voiceData = result?.status === 'success' ? parseVoiceResult(result.output) : null
      // An stt_* result's filePath is the user's SOURCE recording (an input),
      // never a deliverable — don't echo it back as an audio card.
      const isSttResult = (seg.name ?? '').startsWith('stt_')

      // Clean feed (verbose off): the tool-activity card is dropped entirely —
      // successful, failed AND denied calls alike. The clean feed relays only
      // what the model produces FOR the user: prose plus the file viewers and
      // location cards below, which render in their own branches regardless of
      // this flag. Tool mechanics, including failures, are verbose-only.
      // The code tools are the one exception: an edit, a write or a shell run
      // is a change the user can see in their project, so the clean feed
      // shows it as a compact activity row (status, file or command, +N −M
      // or exit code) expandable to the diff or output — never hidden.
      const cardVisible = verbose || CODE_ACTIVITY_TOOLS.has(seg.name)

      if (voiceData) {
        if (cardVisible) {
          blocks.push(
            <ToolCard
              key={seg.segmentId}
              call={seg}
              result={result}
              timing={timing}
              compact={!verbose}
            />
          )
        }
        // Render every voice_generate asset, but for the voice_respond REPLY
        // only the final one — a redone reply must not show as a second memo.
        const supersededReply = voiceData.isResponse && seg.toolCallId !== lastVoiceReplyId
        if (!supersededReply) {
          blocks.push(
            <AudioPlayer
              key={`voice_${seg.segmentId}`}
              source="voice"
              filePath={voiceData.filePath}
              fileExists={true}
              mimeType="audio/mpeg"
              fileName={voiceData.fileName}
            />
          )
        }
      } else if (approval) {
        // Approval cards always render — the user must be able to act on a
        // pending tool call regardless of the verbose preference.
        blocks.push(
          <ApprovalCard
            key={`appr_${seg.segmentId}`}
            state={approval}
            onDecision={(d) => onApprovalDecision(approval.approvalId, d)}
          />
        )
        if (approval.decision !== undefined && cardVisible) {
          blocks.push(
            <ToolCard
              key={seg.segmentId}
              call={seg}
              result={result}
              timing={timing}
              compact={!verbose}
            />
          )
        }
      } else if (cardVisible) {
        blocks.push(
          <ToolCard
            key={seg.segmentId}
            call={seg}
            result={result}
            timing={timing}
            compact={!verbose}
          />
        )
      }

      const fileContent = isFileContentResult(seg, result)
      const page = fileContent ? null : extractToolResultPage(seg, result)

      // File-content results (file_read/file_write/file_patch — the body of the
      // file named by args.path) render NOTHING, but still own their branch:
      // generating or touching a file is not delivering it — the model shows a
      // file only via its own send_file act — and marker text quoted INSIDE file
      // content must never be mistaken for a delivery.
      if (fileContent) {
        // Deliberately empty — file content is invisible in the feed.
      } else if (page) {
        if (verbose) {
          blocks.push(
            <PageViewer
              key={`page_${seg.segmentId}`}
              content={page.content}
              title={page.title}
              url={page.url}
              format={page.format}
            />
          )
        }
      } else {
        const imagePath = extractToolResultImage(result)
        if (imagePath) {
          const imgRelPath = imagePath.startsWith('wolffish-media://')
            ? imagePath
            : normalizePath(imagePath)
          const imgReachable = !imgRelPath.startsWith('/')
          const imgFileName = imagePath.split('/').pop() ?? 'image'
          const imgExt = (imagePath.match(/\.[^./\\]+$/) || [''])[0].toLowerCase()
          const imgMime = `image/${imgExt === '.jpg' ? 'jpeg' : imgExt.slice(1)}`
          if (emitOnce(imgRelPath)) {
            blocks.push(
              <ImageViewer
                key={`img_${seg.segmentId}`}
                filePath={imgRelPath}
                fileExists={imgReachable}
                mimeType={imgMime}
                fileName={imgFileName}
              />
            )
          }
        }

        const docResults = extractToolResultDocuments(result)
        if (docResults) {
          for (let di = 0; di < docResults.length; di++) {
            const doc = docResults[di]
            const fileName = doc.path.split('/').pop() ?? 'document'
            const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
            if (ext === 'pdf') {
              blocks.push(
                <PdfViewer
                  key={`doc_${seg.segmentId}_${di}`}
                  filePath={doc.path}
                  fileExists={true}
                  fileName={fileName}
                  sizeBytes={doc.size}
                />
              )
            } else if (ext === 'docx') {
              blocks.push(
                <DocxViewer
                  key={`doc_${seg.segmentId}_${di}`}
                  filePath={doc.path}
                  fileExists={true}
                  fileName={fileName}
                  sizeBytes={doc.size}
                />
              )
            } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
              blocks.push(
                <SpreadsheetViewer
                  key={`doc_${seg.segmentId}_${di}`}
                  filePath={doc.path}
                  fileExists={true}
                  fileName={fileName}
                  sizeBytes={doc.size}
                />
              )
            } else if (ext === 'txt') {
              // Plain text delivered as a (document) renders the same inline
              // text card as .txt via the (file) catch-all.
              blocks.push(
                <MarkdownFileViewer
                  key={`doc_${seg.segmentId}_${di}`}
                  filePath={doc.path}
                  fileExists={true}
                  fileName={fileName}
                  sizeBytes={doc.size}
                  mimeType="text/plain"
                />
              )
            } else {
              blocks.push(
                <FileCard
                  key={`doc_${seg.segmentId}_${di}`}
                  filePath={doc.path}
                  fileExists={true}
                  fileName={fileName}
                  sizeBytes={doc.size}
                  mimeType={docMimeType(ext)}
                />
              )
            }
          }
        }

        // Skip the generic media extractor for voice_respond / voice_generate:
        // their audio already rendered as the dedicated voice player above, and
        // the same workspace path would otherwise render a SECOND player.
        const media = voiceData || isSttResult ? null : extractToolResultMedia(result)
        if (media) {
          const mediaFileName = media.path.split('/').pop() ?? 'media'
          const mediaExt = (media.path.match(/\.[^./\\]+$/) || [''])[0].toLowerCase()
          const mediaMime =
            media.type === 'audio'
              ? `audio/${mediaExt === '.mp3' ? 'mpeg' : mediaExt.slice(1)}`
              : `video/${mediaExt === '.mov' ? 'quicktime' : mediaExt.slice(1)}`
          // Convert an absolute workspace path to a relative one for the loader.
          // A path outside the workspace stays absolute — render it with
          // fileExists=false so the player shows its "unavailable" placeholder.
          const relPath = normalizePath(media.path)
          const fileReachable = !relPath.startsWith('/')
          if (emitOnce(relPath)) {
            if (media.type === 'audio') {
              blocks.push(
                <AudioPlayer
                  key={`media_${seg.segmentId}`}
                  filePath={relPath}
                  fileExists={fileReachable}
                  mimeType={mediaMime}
                  fileName={mediaFileName}
                />
              )
            } else {
              blocks.push(
                <VideoPlayer
                  key={`media_${seg.segmentId}`}
                  filePath={relPath}
                  fileExists={fileReachable}
                  mimeType={mediaMime}
                  fileName={mediaFileName}
                />
              )
            }
          }
        }

        // Generic files (any extension) explicitly delivered via send_file —
        // render a file card with reveal/download, same as a non-previewable
        // attachment.
        const genericFiles = extractToolResultGenericFiles(result)
        for (let gi = 0; gi < genericFiles.length; gi++) {
          const gPath = genericFiles[gi]
          const gName = gPath.split('/').pop() ?? 'file'
          const gExt = gName.split('.').pop()?.toLowerCase() ?? ''
          // Markdown delivered via the (file) catch-all renders inline as rich
          // markdown — same card attachments use — not a bare file card.
          if (gExt === 'md' || gExt === 'mdx' || gExt === 'markdown') {
            blocks.push(
              <MarkdownFileViewer
                key={`file_${seg.segmentId}_${gi}`}
                filePath={gPath}
                fileExists={true}
                fileName={gName}
                sizeBytes={0}
                mimeType="text/markdown"
              />
            )
          } else if (gExt === 'txt') {
            // Plain text renders inline as a line-numbered text card — same
            // loader/viewer .md files use.
            blocks.push(
              <MarkdownFileViewer
                key={`file_${seg.segmentId}_${gi}`}
                filePath={gPath}
                fileExists={true}
                fileName={gName}
                sizeBytes={0}
                mimeType="text/plain"
              />
            )
          } else if (gExt === 'html' || gExt === 'htm') {
            // HTML renders inline as highlighted source with a live, sandboxed
            // preview on expand — same card attachments use.
            blocks.push(
              <HtmlFileViewer
                key={`file_${seg.segmentId}_${gi}`}
                filePath={gPath}
                fileExists={true}
                fileName={gName}
                sizeBytes={0}
                mimeType="text/html"
              />
            )
          } else {
            blocks.push(
              <FileCard
                key={`file_${seg.segmentId}_${gi}`}
                filePath={gPath}
                fileExists={true}
                fileName={gName}
                sizeBytes={0}
                mimeType={docMimeType(gExt)}
              />
            )
          }
        }

        // Interactive chart cards — `.chart.json` specs explicitly delivered
        // via send_file carry the (chart) marker. Rendered on the clean feed
        // too, like every delivered file; a spec that fails to parse falls back
        // to a plain file card inside ChartCard itself.
        const chartFiles = extractToolResultCharts(result)
        for (let ci = 0; ci < chartFiles.length; ci++) {
          const cPath = chartFiles[ci]
          if (!emitOnce(cPath)) continue
          blocks.push(
            <ChartCard
              key={`chart_${seg.segmentId}_${ci}`}
              filePath={cPath}
              fileExists={true}
              fileName={cPath.split('/').pop() ?? 'chart.json'}
              sizeBytes={0}
              mimeType="application/json"
            />
          )
        }

        // Location cards the model explicitly pushed via show_path — the
        // [wolffish-path:] marker is their transport, mirroring send_file's
        // delivery markers. Always rendered (clean feed too): pushing an
        // openable folder/file location is a deliberate act FOR the user, not
        // tool mechanics. Nothing is ever parsed out of prose.
        const shownPaths = extractToolResultPaths(result)
        for (let pi = 0; pi < shownPaths.length; pi++) {
          blocks.push(
            <PathCard
              key={`path_${seg.segmentId}_${pi}`}
              path={shownPaths[pi].path}
              kind={shownPaths[pi].kind}
            />
          )
        }
      }
    } else if (seg.kind === 'tool_result') {
      // Already rendered alongside its tool_call.
      continue
    } else if (seg.kind === 'separator') {
      // Flush whatever text has accumulated into its own bubble, then continue
      // — the next text segment starts a new bubble.
      flushText()
    } else if (seg.kind === 'compaction_started') {
      // Clean feed: compaction is internal activity, not a result — hide it.
      if (!verbose) continue
      const hasCompletion = segments.some((s, j) => j > segIdx && s.kind === 'compaction')
      if (!hasCompletion) {
        flushText()
        blocks.push(
          <CompactionStartedCard
            key={seg.segmentId}
            messagesCount={seg.messagesCount}
            targetsCount={seg.targetsCount}
            tokenCount={seg.tokenCount}
            tokenBudget={seg.tokenBudget}
            startedAt={seg.startedAt}
          />
        )
      }
    } else if (seg.kind === 'compaction') {
      // Clean feed: compaction is internal activity, not a result — hide it.
      if (!verbose) continue
      flushText()
      blocks.push(
        <CompactionCard
          key={seg.segmentId}
          targetsCount={seg.targetsCount}
          tokensSaved={seg.tokensSaved}
          durationMs={seg.durationMs}
          details={seg.details}
        />
      )
    } else if (seg.kind === 'turn_end') {
      flushText()
      if (seg.providerErrors?.length) {
        blocks.push(<ProviderErrorCards key={seg.segmentId} failures={seg.providerErrors} />)
      } else if (seg.stopReason === 'error') {
        blocks.push(<TurnFooter key={seg.segmentId} stopReason={seg.stopReason} />)
      }
      // LEGACY: conversations persisted before in-place reasoning segments
      // carry the final iteration's thinking only here. When the message has
      // reasoning segments, this is a duplicate of the last one — skip it.
      if (showReasoning && seg.reasoningContent?.trim() && !hasReasoningSegments) {
        blocks.push(<ReasoningCard key={`r-${seg.segmentId}`} content={seg.reasoningContent} />)
      }
    }
  }

  flushText()

  return { blocks: <>{blocks}</>, empty: blocks.length === 0 }
}

/**
 * One prompt waiting above the composer for the running turn to end. An
 * attachment-only prompt (no caption) labels itself with its file names.
 */
function QueuedPromptRow({
  prompt,
  onCancel
}: {
  prompt: QueuedPrompt
  onCancel: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="border-border bg-surface text-fg flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs">
      <Clock01Icon size={12} className="text-muted shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate" dir="auto" title={prompt.text}>
        {prompt.text || prompt.attachments.map((a) => a.originalName).join(', ')}
      </span>
      {prompt.attachments.length > 0 && (
        <span
          className="text-muted flex shrink-0 items-center gap-1 text-[10px] tabular-nums"
          title={t('chat.queue.attachmentCount', { count: prompt.attachments.length })}
        >
          <Image02Icon size={11} aria-hidden />
          {prompt.attachments.length}
        </span>
      )}
      <button
        type="button"
        onClick={onCancel}
        title={t('chat.queue.remove')}
        aria-label={t('chat.queue.remove')}
        className="text-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent shrink-0 cursor-pointer rounded"
      >
        <CancelCircleIcon size={14} />
      </button>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────

type VoiceResultData = {
  filePath: string
  fileName: string
  isResponse: boolean
}

function parseVoiceResult(output: string): VoiceResultData | null {
  try {
    const parsed = JSON.parse(output)
    if (typeof parsed?.filePath === 'string' && typeof parsed?.fileName === 'string') {
      return {
        filePath: parsed.filePath,
        fileName: parsed.fileName,
        isResponse: !!parsed.isResponse
      }
    }
  } catch {
    // not voice output
  }
  return null
}

function isAssistant(m: ChatMessage): m is AssistantMessage {
  return m.role === 'assistant'
}

function cryptoId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function hasFiles(e: React.DragEvent<HTMLDivElement>): boolean {
  const types = e.dataTransfer?.types
  if (!types) return false
  return Array.from(types).includes('Files')
}

/**
 * Does this conversation have anything a PDF export would print? A user turn
 * with text or attachments, or an assistant turn with prose or (in verbose)
 * tool activity. Mirrors the desktop's hasExportableContent.
 */
function hasExportableContent(messages: ChatMessage[], verbose: boolean): boolean {
  return messages.some((m) => {
    if (m.role === 'user') return m.content.trim().length > 0 || (m.attachments?.length ?? 0) > 0
    return m.segments.some((s) => {
      if (s.kind === 'text') return s.delta.trim().length > 0
      if (verbose) return s.kind === 'tool_call' || s.kind === 'tool_result'
      return false
    })
  })
}
