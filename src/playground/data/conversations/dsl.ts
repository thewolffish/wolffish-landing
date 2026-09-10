/**
 * The conversation builder — a small DSL that turns a readable script of
 * turns into the exact ConversationFile shape the desktop persists: segments
 * in order, tool timings, approvals, ask cards (as tool_call + tool_result),
 * per-turn stats, a context meter reading, and a timeline. Authors write the
 * work; the DSL writes the bookkeeping the same way the agent runtime does.
 *
 * Every timestamp is relative to the playground clock (data/clock.ts), so the
 * conversations always read as recent.
 */
import type {
  ConversationChannel,
  ConversationFile,
  ConversationMessage,
  ConversationStats,
  ConversationTurnStats,
  MessageAttachment,
  PersistedApproval,
  PersistedToolTiming,
  RiskLevel,
  Segment,
  TimelineEntry,
  WorkflowSnapshot
} from '../types'
import { compactionAtFor, contextWindowFor, costUsd, FLASH, PROVIDER } from '../catalog'
import { attachmentFor } from '../../lib/markers'
import { registerInlineFiles } from '../../lib/files'

// ── Steps an assistant turn is made of ───────────────────────────────────

export type Step =
  | { kind: 'text'; md: string }
  | { kind: 'reasoning'; text: string }
  | {
      kind: 'tool'
      name: string
      args: Record<string, unknown>
      output: string
      status?: 'success' | 'failed' | 'denied'
      error?: string
      /** Wall-clock the call took, ms. */
      ms?: number
      approval?: {
        reason: string
        level?: 'confirm' | 'destructive'
        title: string
        description: string
        command?: string
        impact?: string
        risk?: RiskLevel
        decision: 'approved' | 'denied'
      }
    }
  | {
      kind: 'send'
      path: string
      /** Marker type; inferred from the extension when omitted. */
      type?: 'image' | 'audio' | 'video' | 'document' | 'file' | 'chart'
      ms?: number
    }
  | { kind: 'path'; path: string; type: 'folder' | 'file' }
  | {
      kind: 'ask'
      questions: Array<{
        question: string
        details?: string
        options: Array<{ label: string; description?: string }>
        allowOther?: boolean
        otherLabel?: string
        otherDescription?: string
      }>
      answers: Array<{ option: number } | { custom: string }>
      /** How long the user took to answer, ms. */
      ms?: number
    }
  | { kind: 'workflow'; snapshot: Omit<WorkflowSnapshot, 'workflowId'> & { workflowId?: string } }
  | { kind: 'separator' }
  | {
      kind: 'compaction'
      messagesCount: number
      targetsCount: number
      tokenCount: number
      tokenBudget: number
      tokensSaved: number
      durationMs: number
      details: Array<{ toolName?: string; originalChars: number; compactedChars: number; compactedBy: string }>
    }

export type TurnSpec = {
  /** The user's message. */
  user: string
  /** Workspace paths the user attached. */
  attachments?: string[]
  voicePrompt?: boolean
  voiceLang?: string
  /** When the user sent it (epoch ms). */
  at: number
  /** The model the turn ran on; defaults to the conversation's model. */
  model?: string
  /** The assistant's work, in order. */
  steps: Step[]
  /** Seconds the whole turn took; derived from the steps when omitted. */
  seconds?: number
  /** Override the turn's outcome. */
  stopReason?: 'end_turn' | 'error'
  error?: string
}

export type ConversationSpec = {
  id: string
  title: string
  icon?: string
  channel?: ConversationChannel
  projectId?: string
  model?: string
  sealed?: boolean
  workingFolder?: string[]
  contextFiles?: string[]
  turns: TurnSpec[]
  /** Text content for workspace paths this conversation produced. */
  files?: Record<string, string>
}

// ── Helpers authors call ─────────────────────────────────────────────────

export const text = (md: string): Step => ({ kind: 'text', md })
export const reasoning = (t: string): Step => ({ kind: 'reasoning', text: t })
export const tool = (
  name: string,
  args: Record<string, unknown>,
  output: string,
  opts: Partial<Omit<Extract<Step, { kind: 'tool' }>, 'kind' | 'name' | 'args' | 'output'>> = {}
): Step => ({ kind: 'tool', name, args, output, ...opts })
export const send = (path: string, type?: Extract<Step, { kind: 'send' }>['type'], ms?: number): Step => ({
  kind: 'send',
  path,
  type,
  ms
})
export const showPath = (path: string, type: 'folder' | 'file'): Step => ({ kind: 'path', path, type })
export const ask = (
  questions: Extract<Step, { kind: 'ask' }>['questions'],
  answers: Extract<Step, { kind: 'ask' }>['answers'],
  ms?: number
): Step => ({ kind: 'ask', questions, answers, ms })
export const workflow = (snapshot: Extract<Step, { kind: 'workflow' }>['snapshot']): Step => ({
  kind: 'workflow',
  snapshot
})
export const separator = (): Step => ({ kind: 'separator' })
export const compaction = (c: Omit<Extract<Step, { kind: 'compaction' }>, 'kind'>): Step => ({
  kind: 'compaction',
  ...c
})

/** The marker type send_file emits for a path (Chat.tsx extToBucket). */
function markerTypeFor(path: string): 'image' | 'audio' | 'video' | 'document' | 'file' | 'chart' {
  const base = path.split('/').pop() ?? ''
  if (base.toLowerCase().endsWith('.chart.json')) return 'chart'
  const ext = (base.match(/\.([^.]+)$/)?.[1] ?? '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'avif', 'tiff', 'ico'].includes(ext))
    return 'image'
  if (['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'wma'].includes(ext)) return 'audio'
  if (['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', 'wmv', 'flv'].includes(ext)) return 'video'
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'tsv', 'txt', 'md', 'markdown', 'html', 'htm', 'rtf', 'odt', 'ods', 'odp', 'json', 'xml', 'yaml', 'yml'].includes(ext))
    return 'document'
  return 'file'
}

/** The ask plugin's stable output format, so QuestionCard rebuilds the answers. */
function askOutput(
  questions: Extract<Step, { kind: 'ask' }>['questions'],
  answers: Extract<Step, { kind: 'ask' }>['answers']
): string {
  if (questions.length === 1) {
    const a = answers[0]
    const q = questions[0]
    if ('option' in a) {
      const opt = q.options[a.option]
      return `The user selected option ${a.option + 1} of ${q.options.length}: "${opt?.label ?? ''}"${opt?.description ? ` — ${opt.description}` : ''}`
    }
    return `The user chose none of the options and instead instructed:\n${a.custom}`
  }
  const lines = [`The user answered all ${questions.length} questions:`, '']
  questions.forEach((q, i) => {
    const a = answers[i]
    lines.push(`${i + 1}. ${q.question}`)
    if (a && 'option' in a) lines.push(`   → Selected option ${a.option + 1} of ${q.options.length}`)
    else if (a) lines.push(`   → Answered in their own words:`, `   ${a.custom.replace(/\n/g, '\n   ')}`)
    lines.push('')
  })
  return lines.join('\n').trimEnd()
}

function estimateTokens(s: string): number {
  return Math.max(1, Math.round(s.length / 3.6))
}

// ── The builder ──────────────────────────────────────────────────────────

let seq = 0
const nextId = (prefix: string): string => `${prefix}_${(++seq).toString(36).padStart(4, '0')}`

export function conversation(spec: ConversationSpec): ConversationFile {
  const model = spec.model ?? FLASH
  registerInlineFiles(spec.files)
  const messages: ConversationMessage[] = []
  const timeline: TimelineEntry[] = []
  let allTime: ConversationStats['allTime'] = {
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
  let lastTurn: ConversationTurnStats | null = null
  let contextTokens = 2_900 + estimateTokens(spec.title) * 4 // the system prompt + identity docs

  for (let ti = 0; ti < spec.turns.length; ti++) {
    const turn = spec.turns[ti]
    const turnModel = turn.model ?? model
    const turnId = `t${ti + 1}`
    const userId = nextId('m')
    const attachments: MessageAttachment[] | undefined = turn.attachments?.map((p) =>
      attachmentFor(p, 0)
    )
    messages.push({
      id: userId,
      role: 'user',
      content: turn.user,
      timestamp: turn.at,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
      ...(turn.voicePrompt ? { voicePrompt: true } : {}),
      ...(turn.voiceLang ? { voiceLang: turn.voiceLang } : {})
    })
    timeline.push({
      id: nextId('tl'),
      timestamp: turn.at,
      kind: 'turn',
      summary: turn.user.slice(0, 120)
    })

    const segments: Segment[] = []
    const approvals: Record<string, PersistedApproval> = {}
    const toolTimings: Record<string, PersistedToolTiming> = {}
    let clock = turn.at + 1_400 + Math.round(Math.random() * 0) // the first token
    let iterations = 1
    let toolCalls = 0
    let outputChars = 0
    let inputChars = turn.user.length
    let segIdx = 0
    const sid = (): string => `s${segIdx++}`

    segments.push({ kind: 'active_model', turnId, segmentId: sid(), provider: PROVIDER, model: turnModel })
    timeline.push({ id: nextId('tl'), timestamp: clock, kind: 'context.built', summary: `Context built for ${turnModel.split('/').pop()}` })

    for (const step of turn.steps) {
      switch (step.kind) {
        case 'text': {
          segments.push({ kind: 'text', turnId, segmentId: sid(), delta: step.md })
          outputChars += step.md.length
          clock += Math.round(step.md.length * 9)
          break
        }
        case 'reasoning': {
          segments.push({ kind: 'reasoning', turnId, segmentId: sid(), delta: step.text })
          outputChars += step.text.length
          clock += Math.round(step.text.length * 5)
          break
        }
        case 'separator': {
          segments.push({ kind: 'separator', turnId, segmentId: sid() })
          break
        }
        case 'tool': {
          const callId = nextId('call')
          const ms = step.ms ?? 900 + Math.round((step.output.length / 40) * 60)
          segments.push({ kind: 'tool_call', turnId, segmentId: sid(), toolCallId: callId, name: step.name, args: step.args })
          toolTimings[callId] = { startedAt: clock, endedAt: clock + ms }
          timeline.push({ id: nextId('tl'), timestamp: clock, kind: 'tool.called', summary: step.name, detail: JSON.stringify(step.args).slice(0, 200) })
          if (step.approval) {
            approvals[callId] = {
              approvalId: `apr_${callId}`,
              toolCallId: callId,
              tool: step.name,
              args: step.args,
              reason: step.approval.reason,
              level: step.approval.level ?? 'confirm',
              description: {
                title: step.approval.title,
                description: step.approval.description,
                ...(step.approval.command ? { command: step.approval.command } : {}),
                ...(step.approval.impact ? { impact: step.approval.impact } : {}),
                risk: step.approval.risk ?? 'medium'
              },
              decision: step.approval.decision
            }
            timeline.push({
              id: nextId('tl'),
              timestamp: clock + 800,
              kind: step.approval.decision === 'approved' ? 'safety.approved' : 'safety.denied',
              summary: `${step.name} ${step.approval.decision}`
            })
          }
          const status = step.status ?? (step.approval?.decision === 'denied' ? 'denied' : 'success')
          segments.push({
            kind: 'tool_result',
            turnId,
            segmentId: sid(),
            toolCallId: callId,
            status,
            output: step.output,
            ...(step.error ? { error: step.error } : {})
          })
          timeline.push({
            id: nextId('tl'),
            timestamp: clock + ms,
            kind: status === 'success' ? 'tool.completed' : 'tool.failed',
            summary: step.name,
            detail: step.output.slice(0, 200)
          })
          clock += ms + 1_100
          toolCalls += 1
          iterations += 1
          inputChars += step.output.length + JSON.stringify(step.args).length
          break
        }
        case 'send': {
          const callId = nextId('call')
          const type = step.type ?? markerTypeFor(step.path)
          const ms = step.ms ?? 420
          segments.push({ kind: 'tool_call', turnId, segmentId: sid(), toolCallId: callId, name: 'send_file', args: { path: step.path } })
          toolTimings[callId] = { startedAt: clock, endedAt: clock + ms }
          segments.push({
            kind: 'tool_result',
            turnId,
            segmentId: sid(),
            toolCallId: callId,
            status: 'success',
            // The utilities plugin emits the marker as the WHOLE output — the
            // feed's file-content guard exempts exactly that shape.
            output: `[wolffish-output: ${step.path} (${type})]`
          })
          timeline.push({ id: nextId('tl'), timestamp: clock, kind: 'tool.completed', summary: 'send_file', detail: step.path })
          clock += ms + 600
          toolCalls += 1
          iterations += 1
          break
        }
        case 'path': {
          const callId = nextId('call')
          segments.push({ kind: 'tool_call', turnId, segmentId: sid(), toolCallId: callId, name: 'show_path', args: { path: step.path } })
          toolTimings[callId] = { startedAt: clock, endedAt: clock + 120 }
          segments.push({
            kind: 'tool_result',
            turnId,
            segmentId: sid(),
            toolCallId: callId,
            status: 'success',
            output: `[wolffish-path: ${step.path} (${step.type})]`
          })
          clock += 700
          toolCalls += 1
          break
        }
        case 'ask': {
          const callId = nextId('call')
          const questions = step.questions.map((q) => ({
            question: q.question,
            ...(q.details ? { details: q.details } : {}),
            options: q.options,
            allow_other: q.allowOther !== false,
            ...(q.otherLabel ? { other_label: q.otherLabel } : {}),
            ...(q.otherDescription ? { other_description: q.otherDescription } : {})
          }))
          const ms = step.ms ?? 38_000
          segments.push({ kind: 'tool_call', turnId, segmentId: sid(), toolCallId: callId, name: 'ask_user', args: { questions } })
          toolTimings[callId] = { startedAt: clock, endedAt: clock + ms }
          segments.push({
            kind: 'tool_result',
            turnId,
            segmentId: sid(),
            toolCallId: callId,
            status: 'success',
            output: askOutput(step.questions, step.answers)
          })
          timeline.push({ id: nextId('tl'), timestamp: clock, kind: 'tool.called', summary: 'ask_user', detail: `${step.questions.length} question(s)` })
          timeline.push({ id: nextId('tl'), timestamp: clock + ms, kind: 'tool.completed', summary: 'ask_user answered' })
          clock += ms + 900
          toolCalls += 1
          iterations += 1
          break
        }
        case 'workflow': {
          const snapshot: WorkflowSnapshot = {
            workflowId: step.snapshot.workflowId ?? nextId('wf'),
            ...step.snapshot
          }
          segments.push({ kind: 'workflow', turnId, segmentId: sid(), snapshot })
          timeline.push({ id: nextId('tl'), timestamp: snapshot.startedAt, kind: 'task.created', summary: `Workflow: ${snapshot.agents.length} agents` })
          if (snapshot.endedAt) {
            timeline.push({ id: nextId('tl'), timestamp: snapshot.endedAt, kind: 'task.completed', summary: `Workflow ${snapshot.status}` })
            clock = Math.max(clock, snapshot.endedAt)
          }
          toolCalls += snapshot.totals.toolCalls
          break
        }
        case 'compaction': {
          segments.push({
            kind: 'compaction_started',
            turnId,
            segmentId: sid(),
            messagesCount: step.messagesCount,
            targetsCount: step.targetsCount,
            tokenCount: step.tokenCount,
            tokenBudget: step.tokenBudget,
            startedAt: clock
          })
          segments.push({
            kind: 'compaction',
            turnId,
            segmentId: sid(),
            targetsCount: step.targetsCount,
            tokensSaved: step.tokensSaved,
            durationMs: step.durationMs,
            details: step.details
          })
          timeline.push({ id: nextId('tl'), timestamp: clock, kind: 'compaction.applied', summary: `Compacted ${step.targetsCount} results, saved ${step.tokensSaved} tokens` })
          clock += step.durationMs
          break
        }
      }
    }

    const stopReason = turn.stopReason ?? 'end_turn'
    segments.push({ kind: 'turn_end', turnId, segmentId: sid(), stopReason, iterationCount: iterations })

    const endedAt = turn.seconds ? turn.at + turn.seconds * 1000 : clock
    const elapsedMs = Math.max(1_500, endedAt - turn.at)
    const inputTokens = estimateTokens(String(inputChars)) + contextTokens * iterations + Math.round(inputChars / 3.6)
    const outputTokens = Math.round(outputChars / 3.6) + iterations * 60
    const cacheRead = Math.round(inputTokens * 0.62)
    const cacheWrite = Math.round(inputTokens * 0.08)
    const cost = costUsd(turnModel, inputTokens, outputTokens, cacheRead)
    const turnStats: ConversationTurnStats = {
      endedAt,
      elapsedMs,
      apiMs: Math.round(elapsedMs * 0.72),
      apiCalls: iterations,
      toolCalls,
      inputTokens,
      outputTokens,
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheWrite,
      cost,
      provider: PROVIDER,
      model: turnModel
    }
    allTime = {
      processingMs: allTime.processingMs + elapsedMs,
      apiMs: allTime.apiMs + turnStats.apiMs,
      turns: allTime.turns + 1,
      apiCalls: allTime.apiCalls + iterations,
      toolCalls: allTime.toolCalls + toolCalls,
      inputTokens: allTime.inputTokens + inputTokens,
      outputTokens: allTime.outputTokens + outputTokens,
      cacheReadTokens: allTime.cacheReadTokens + cacheRead,
      cacheCreationTokens: allTime.cacheCreationTokens + cacheWrite,
      cost: allTime.cost + cost
    }
    lastTurn = turnStats
    contextTokens += Math.round((inputChars + outputChars) / 3.6)
    timeline.push({ id: nextId('tl'), timestamp: endedAt, kind: 'turn.usage', summary: `${inputTokens.toLocaleString()} in · ${outputTokens.toLocaleString()} out · $${cost.toFixed(4)}` })

    messages.push({
      id: nextId('m'),
      role: 'assistant',
      content: segments
        .filter((s): s is Extract<Segment, { kind: 'text' }> => s.kind === 'text')
        .map((s) => s.delta)
        .join('\n'),
      timestamp: endedAt,
      segments,
      ...(Object.keys(approvals).length > 0 ? { approvals } : {}),
      toolTimings,
      stopReason,
      ...(turn.error ? { error: turn.error } : {})
    })
  }

  const createdAt = spec.turns[0]?.at ?? Date.now()
  const updatedAt = messages[messages.length - 1]?.timestamp ?? createdAt
  return {
    id: spec.id,
    title: spec.title,
    model,
    messages,
    createdAt,
    updatedAt,
    channel: spec.channel ?? 'electron',
    ...(spec.projectId ? { projectId: spec.projectId } : {}),
    ...(spec.icon ? { icon: spec.icon } : {}),
    ...(spec.sealed ? { sealed: true } : {}),
    workingFolder: spec.workingFolder ?? null,
    contextFiles: spec.contextFiles ?? null,
    stats: {
      allTime,
      lastTurn,
      meter: {
        contextTokens,
        contextBudget: contextWindowFor(model),
        compactionAt: compactionAtFor(model),
        model
      }
    },
    timeline,
    files: spec.files
  }
}

/** A completed workflow snapshot from a compact description of its agents. */
export function workflowRun(input: {
  startedAt: number
  seconds: number
  note?: string
  phases: string[]
  model?: string
  agents: Array<{
    name: string
    task: string
    phase: string
    seconds: number
    startOffset?: number
    llmCalls: number
    toolCalls: number
    inputTokens: number
    outputTokens: number
    resultChars?: number
    status?: 'completed' | 'failed' | 'cancelled'
  }>
  master?: { llmCalls: number; inputTokens: number; outputTokens: number }
}): Omit<WorkflowSnapshot, 'workflowId'> {
  const model = input.model ?? FLASH
  const agents = input.agents.map((a, i) => {
    const startedAt = input.startedAt + (a.startOffset ?? 0) * 1000
    const cacheRead = Math.round(a.inputTokens * 0.55)
    return {
      id: `agent_${i + 1}`,
      name: a.name,
      task: a.task,
      phase: a.phase,
      provider: PROVIDER,
      model,
      status: a.status ?? ('completed' as const),
      startedAt,
      endedAt: startedAt + a.seconds * 1000,
      llmCalls: a.llmCalls,
      toolCalls: a.toolCalls,
      inputTokens: a.inputTokens,
      outputTokens: a.outputTokens,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: Math.round(a.inputTokens * 0.06),
      cost: costUsd(model, a.inputTokens, a.outputTokens, cacheRead),
      ...(a.resultChars ? { resultChars: a.resultChars } : {})
    }
  })
  const totals = agents.reduce(
    (acc, a) => ({
      agents: acc.agents + 1,
      toolCalls: acc.toolCalls + a.toolCalls,
      inputTokens: acc.inputTokens + a.inputTokens,
      outputTokens: acc.outputTokens + a.outputTokens,
      cacheReadTokens: acc.cacheReadTokens + a.cacheReadTokens,
      cacheWriteTokens: acc.cacheWriteTokens + a.cacheWriteTokens,
      cost: acc.cost + a.cost
    }),
    { agents: 0, toolCalls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, cost: 0 }
  )
  const master = input.master ?? { llmCalls: 4, inputTokens: 38_000, outputTokens: 2_400 }
  const masterCacheRead = Math.round(master.inputTokens * 0.6)
  return {
    status: 'completed',
    startedAt: input.startedAt,
    endedAt: input.startedAt + input.seconds * 1000,
    ...(input.note ? { note: input.note } : {}),
    phases: input.phases.map((title) => ({ title, status: 'done' as const })),
    agents,
    totals,
    master: {
      llmCalls: master.llmCalls,
      inputTokens: master.inputTokens,
      outputTokens: master.outputTokens,
      cacheReadTokens: masterCacheRead,
      cacheWriteTokens: Math.round(master.inputTokens * 0.05),
      cost: costUsd(model, master.inputTokens, master.outputTokens, masterCacheRead)
    }
  }
}
