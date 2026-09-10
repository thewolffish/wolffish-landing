'use client'
import { ChipRow } from '@/playground/components/common/chip-row/ChipRow'
import { EmojiPicker } from '@/playground/components/common/emoji-picker/EmojiPicker'
import { Badge } from '@/playground/components/core/Badge'
import { Button } from '@/playground/components/core/Button'
import { CodeEditor } from '@/playground/components/core/CodeEditor'
import { CopyButton } from '@/playground/components/core/CopyButton'
import { EditorSheet } from '@/playground/components/core/EditorSheet'
import { ExpandedSheet } from '@/playground/components/core/ExpandedSheet'
import { Modal } from '@/playground/components/core/Modal'
import { useToast } from '@/playground/components/core/toast/useToast'
import { escapePromptBody } from '@/playground/lib/heartbeat-escape'
import { nextCronMs, parseSchedule } from '@/playground/lib/cron'
import { useLocale, useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { HEARTBEAT_JOBS, HEARTBEAT_META, HEARTBEAT_RUNS } from '@/playground/data/automations'
import type { ChatMode, HeartbeatJobView } from '@/playground/data/types'
import { useDemo, useDemoAction, useTheme } from '@/playground/providers/PlaygroundProvider'
import {
  Add01Icon,
  Clock01Icon,
  Delete02Icon,
  Edit02Icon,
  FloppyDiskIcon,
  HelpCircleIcon,
  InformationCircleIcon,
  PlayIcon,
  Refresh01Icon
} from 'hugeicons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const FROM_NOW_RANGES: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000]
]

function formatFromNow(targetMs: number, nowMs: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const diff = targetMs - nowMs
  for (const [unit, ms] of FROM_NOW_RANGES) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit)
  }
  return rtf.format(Math.round(diff / 1000), 'second')
}

function formatAbsolute(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(ms)
}

const EN_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * The chip anchor: now, rounded up to the next 5-minute mark — a chip's
 * schedule means "…starting about now", so its first run lands within
 * minutes and the preview line immediately confirms the pick.
 */
function chipAnchor(): Date {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() + 5 - (d.getMinutes() % 5))
  return d
}

type ChipKind = 'hourly' | 'daily' | 'weekly' | 'monthly'

const CHIP_KINDS: readonly ChipKind[] = ['hourly', 'daily', 'weekly', 'monthly']

function chipSchedule(kind: ChipKind): string {
  const d = chipAnchor()
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  switch (kind) {
    case 'hourly':
      return `Hourly (${d.getMinutes()})`
    case 'daily':
      return `Daily (${time})`
    case 'weekly':
      return `Weekly (${EN_WEEKDAYS[d.getDay()]} ${time})`
    case 'monthly':
      // Cron skips a day number the month doesn't have — clamp to 28 so
      // the job fires every month without exception.
      return `Monthly (${Math.min(d.getDate(), 28)} ${time})`
  }
}

const DEFAULT_AUTOMATION_ICON = '🫀'

/** Guide rows: syntax literals stay English (the file format), text localizes. */
const GUIDE_ROWS = [
  { code: 'Startup', key: 'startup' },
  { code: 'Every (30m)', key: 'every' },
  { code: 'Hourly (15)', key: 'hourly' },
  { code: 'Daily (08:00)', key: 'daily' },
  { code: 'Nightly (23:00)', key: 'nightly' },
  { code: 'Weekday (09:00)', key: 'weekday' },
  { code: 'Weekly (Monday 09:30)', key: 'weekly' },
  { code: 'Monthly (1 09:00)', key: 'monthly' },
  { code: 'Once (2026-08-01 15:00)', key: 'once' },
  { code: 'Cron (0 9 * * 1,3,5)', key: 'cron' }
] as const

const fieldClass = cn(
  'bg-bg border-border text-fg placeholder:text-muted/60 block w-full rounded-lg border px-3 py-2 text-sm leading-5',
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg focus-visible:outline-none'
)

const iconButtonClass = cn(
  'text-muted flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg',
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
)

// The attached-files list holds rows of one fixed height, so the block keeps
// its space as files come and go — the project dialog's contract, because it
// is the same block.
const fileCardClass = 'border-border bg-bg rounded-lg border p-1.5'
/**
 * The composer's active-model chip, shape for shape — what the countdown wears
 * on a card and, identically, in the editor's schedule preview. One constant so
 * the preview and the thing it previews can never drift apart. The tint is the
 * caller's: primary for an armed run, muted for a switched-off automation.
 */
const nextRunChipClass = cn(
  'inline-flex h-7 max-w-full items-center gap-1.5 self-start rounded-lg px-2',
  'text-[11px] leading-tight font-medium'
)
/** h-8 — the remove button's h-6 plus the row's former py-1, top and bottom. */
const fileRowHeight = 'h-8'
const fileRowClass = cn(fileRowHeight, 'flex items-center gap-2 rounded-md px-1.5')

/** Last path segment, for either separator — these are absolute OS paths. */
function fileBaseName(filePath: string): string {
  const parts = filePath.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] ?? filePath
}

/**
 * Middle truncation that keeps the extension visible: the base name gets the
 * CSS ellipsis while ".pdf" stays pinned — "quarterly-report-fin….pdf".
 */
function splitFileName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return { base: name, ext: '' }
  return { base: name.slice(0, dot), ext: name.slice(dot) }
}

type SidebarJob = {
  label: string
  type: string
  active: boolean
  nextRunMs: number | null
  body: string
  cron: string | null
  lineIndex: number
  endLineIndex: number
  /** The job's `mode: …` marker value; null ⇒ follows the global mode. */
  mode: ChatMode | null
  /** Absolute file line of the marker, for in-place rewrites; null if absent. */
  modeLineIndex: number | null
  /** The job's `project: <id>` marker — its runs bind to that project. */
  project: string | null
  /** The job's `icon: <emoji>` marker; null ⇒ the page default. */
  icon: string | null
  /**
   * The job's `name: …` marker — what the card calls it. Null on a job written
   * before the field existed; the schedule heading stands in there. The
   * heading stays the identity, so renaming is free and never re-keys a job.
   */
  name: string | null
  /** Attached files (`file: …` markers) — copies inside the workspace. */
  files: string[]
  /** Working directories (`dir: …` markers) — references to real folders. */
  dirs: string[]
}

/**
 * Per-job setting markers — the LEADING non-empty body lines, `mode: …` /
 * `project: …` / `icon: …` / the repeatable `file: …` and `dir: …`, in any
 * order (blank lines allowed between them). Mirrors the engine's splitMarkers,
 * the automations plugin and the phone's port: parsed here so DISABLED jobs
 * show theirs too, and stripped from the preview so a marker never reads as
 * instruction text.
 */
const MODE_MARKER_RE = /^mode:\s*(single|workflow)\s*$/i
const PROJECT_MARKER_RE = /^project:\s*(\S+)\s*$/i
const ICON_MARKER_RE = /^icon:\s*(\S+)\s*$/i
// The display name is free text, so it takes the whole line like the paths.
const NAME_MARKER_RE = /^name:\s*(.+?)\s*$/i
// Paths, so these take the whole line (spaces and all) rather than one token.
const FILE_MARKER_RE = /^file:\s*(.+?)\s*$/i
const DIR_MARKER_RE = /^dir:\s*(.+?)\s*$/i

/**
 * Drop leading setting-marker lines (and the blanks between them) from a
 * prompt. The dialog owns the markers — a prompt that still carries them
 * (pasted text, or a body that reached the editor through an out-of-date
 * engine) would get fresh markers composed ON TOP at save time, duplicating
 * the marker block on every save. The engine strips leading markers when it
 * runs the job anyway, so they can never be legitimate instruction text.
 */
function stripLeadingSettings(text: string): string {
  const lines = text.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (
      line === '' ||
      MODE_MARKER_RE.test(line) ||
      PROJECT_MARKER_RE.test(line) ||
      ICON_MARKER_RE.test(line) ||
      NAME_MARKER_RE.test(line) ||
      FILE_MARKER_RE.test(line) ||
      DIR_MARKER_RE.test(line)
    ) {
      i++
      continue
    }
    break
  }
  return lines.slice(i).join('\n').trim()
}

function parseSidebarJobs(
  content: string,
  activeJobs: HeartbeatJobView[],
  nowMs: number
): SidebarJob[] {
  const lines = content.split('\n')
  const result: SidebarJob[] = []
  const activeByLabel = new Map(activeJobs.map((j) => [j.label, j]))
  let insideRawComment = false

  for (let i = 0; i < lines.length; i++) {
    if (
      !insideRawComment &&
      /<!--/.test(lines[i]) &&
      !/-->/.test(lines[i]) &&
      !/^<!--\s*##\s+/.test(lines[i])
    ) {
      insideRawComment = true
      continue
    }
    if (insideRawComment) {
      if (/-->/.test(lines[i])) insideRawComment = false
      continue
    }

    const activeLine = lines[i].match(/^##\s+(.+?)\s*$/)
    const inactiveSingle = lines[i].match(/^<!--\s*##\s+(.+?)\s*-->$/)
    const inactiveBlock = !inactiveSingle && lines[i].match(/^<!--\s*##\s+(.+?)\s*$/)
    if (!activeLine && !inactiveSingle && !inactiveBlock) continue

    const label = (activeLine ?? inactiveSingle ?? (inactiveBlock || null))![1]
    const schedule = parseSchedule(label)
    if (!schedule) continue

    const isBlock = !!inactiveBlock
    const bodyLines: string[] = []
    let endIdx = i
    let mode: ChatMode | null = null
    let modeLineIndex: number | null = null
    let project: string | null = null
    let icon: string | null = null
    let name: string | null = null
    const files: string[] = []
    const dirs: string[] = []
    let sawContent = false

    for (let j = i + 1; j < lines.length; j++) {
      if (isBlock && /^\s*-->\s*$/.test(lines[j])) {
        endIdx = j
        break
      }
      // A job's body ends at the next heading, the next toggle opener, OR the
      // start of any raw comment block (e.g. the commented-out examples). Without
      // the raw-comment guard the body would swallow the `<!--` opener below it,
      // so deleting/toggling the job would strip that comment and un-comment the
      // examples it wraps.
      if (/^##\s+/.test(lines[j]) || /^\s*<!--/.test(lines[j])) break
      // Dashed separators are not content (the engine drops them wholesale) —
      // they must not stop the marker scan or a marker after one would be
      // missed and the toggle would insert a duplicate.
      if (/^---+\s*$/.test(lines[j])) {
        if (!isBlock) endIdx = j
        continue
      }
      // Setting markers are the leading non-empty body lines — capture and
      // skip them so they never show in the preview. Blank lines between
      // markers are allowed (same rule as the engine's splitMarkers).
      if (!sawContent && lines[j].trim() !== '') {
        const line = lines[j].trim()
        const m = line.match(MODE_MARKER_RE)
        if (m) {
          mode = m[1].toLowerCase() as ChatMode
          modeLineIndex = j
          if (!isBlock) endIdx = j
          continue
        }
        const p = line.match(PROJECT_MARKER_RE)
        if (p) {
          project = p[1]
          if (!isBlock) endIdx = j
          continue
        }
        const ic = line.match(ICON_MARKER_RE)
        if (ic) {
          icon = ic[1]
          if (!isBlock) endIdx = j
          continue
        }
        const nm = line.match(NAME_MARKER_RE)
        if (nm) {
          name = nm[1]
          if (!isBlock) endIdx = j
          continue
        }
        const f = line.match(FILE_MARKER_RE)
        if (f) {
          files.push(f[1])
          if (!isBlock) endIdx = j
          continue
        }
        const d = line.match(DIR_MARKER_RE)
        if (d) {
          dirs.push(d[1])
          if (!isBlock) endIdx = j
          continue
        }
        sawContent = true
      }
      bodyLines.push(lines[j])
      if (!isBlock && lines[j].trim() !== '') endIdx = j
    }

    const body = bodyLines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    const activeJob = activeByLabel.get(label)
    const cron = activeJob?.cron ?? schedule.cron
    // The registered snapshot stamps nextRunMs when it is taken, so the value
    // goes stale the moment it passes — the job fired, or the page has simply
    // been open across it. Trust it only while it is still ahead; otherwise
    // re-derive from the cron, so a card's countdown rolls over to the next
    // occurrence on its own instead of sitting on a moment already gone.
    const engineNextMs = activeJob?.nextRunMs ?? null

    result.push({
      label,
      type: schedule.type,
      active: !!activeLine,
      nextRunMs:
        engineNextMs != null && engineNextMs > nowMs
          ? engineNextMs
          : (schedule.atMs ?? (cron ? nextCronMs(cron, nowMs) : engineNextMs)),
      // Body and mode come from THIS parse of the current text — never from
      // the job snapshot, which keeps supplying only what it uniquely owns
      // (cron + next run).
      body,
      cron,
      lineIndex: i,
      endLineIndex: endIdx,
      mode,
      modeLineIndex,
      project,
      icon,
      name,
      files,
      dirs
    })
  }

  return result
}

/** The two ways the Automations tab shows heartbeat.md: cards, or the file itself. */
export type HeartbeatView = 'cards' | 'markdown'

/**
 * Automations — one tab of the Library page. The page owns the chrome (back
 * button, tab strip) and the cards/markdown toggle, so `view` arrives as a
 * prop rather than living here: the toggle sits in the Library header beside
 * the tabs, where this page's own header used to put it.
 */
export function Heartbeat({ view }: { view: HeartbeatView }): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { isDark } = useTheme()
  const { config, projects, heartbeatMd, setHeartbeatMd } = useDemo()
  const demoAction = useDemoAction()
  // Jobs without a marker follow the global mode — show that as the effective
  // selection; clicking a tab stamps an explicit marker.
  const globalMode: ChatMode = config.llm.mode === 'workflow' ? 'workflow' : 'single'
  const toast = useToast()

  // The registered jobs, as the brainstem would have them — the page's own
  // parse of the current text owns everything else.
  const jobs = HEARTBEAT_JOBS
  const [deleteTarget, setDeleteTarget] = useState<SidebarJob | null>(null)
  const [content, setContent] = useState<string>(heartbeatMd)
  const [originalContent, setOriginalContent] = useState<string>(heartbeatMd)
  // Per-job "Edited …" stamps (label → epoch ms). The page adds its own stamp
  // on every save so the label moves the moment an edit lands.
  const [editStamps, setEditStamps] = useState<Record<string, number>>(HEARTBEAT_META)

  // Card editor dialog state. editorJob is only a create/edit discriminator
  // for the title — the live binding is boundRef, which follows the block
  // through label changes across autosaves.
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorJob, setEditorJob] = useState<SidebarJob | null>(null)
  const [draftSchedule, setDraftSchedule] = useState('')
  /** Required — an automation with no name can't be saved (see draftSaveable). */
  const [draftName, setDraftName] = useState('')
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftIcon, setDraftIcon] = useState('')
  const [draftProjectId, setDraftProjectId] = useState('')
  // The automation's own attachments: files copied into the workspace, and
  // references to folders it works in. Both persist as marker lines, so they
  // ride the very same autosave the rest of the draft does.
  const [draftFiles, setDraftFiles] = useState<string[]>([])
  const [draftDirs, setDraftDirs] = useState<string[]>([])
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  // The prompt is edited in a full-screen sheet rather than inline: the dialog
  // shows four lines of it and clicking opens the editor. Autosave is unchanged
  // — the sheet writes into the same draft state, so an edit made in it is
  // committed by the same debounce and reflected in the preview on close.
  const [promptExpanded, setPromptExpanded] = useState(false)
  // The persisted block's identity. The ref is what the save chain reads; the
  // state mirror is the same label for render-time checks (the duplicate
  // guard), where reading a ref is off-limits.
  const boundRef = useRef<{ label: string; active: boolean } | null>(null)
  const [boundLabel, setBoundLabel] = useState<string | null>(null)
  // Last values written to the file — the auto-save baseline (same contract as
  // the procedures editor: stops idle re-saves and close-time double writes).
  const savedDraftRef = useRef<{
    schedule: string
    name: string
    prompt: string
    icon: string
    projectId: string
    /** The file/dir lists, joined — cheap value identity for the dirty check. */
    files: string
    dirs: string
  }>({
    schedule: '',
    name: '',
    prompt: '',
    icon: '',
    projectId: '',
    files: '',
    dirs: ''
  })
  const contentRef = useRef(heartbeatMd)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  // The run pool sits idle here — nothing executes in the replica — but the
  // card gating stays wired to it, exactly as the desktop reads its snapshot.
  const runs = HEARTBEAT_RUNS

  // Keyed by heading label (the page's job identity). Procedure runs share
  // the pool but aren't automations — they never gate a card here.
  const busyByLabel = useMemo(() => {
    const map = new Map<string, 'running' | 'queued'>()
    for (const run of runs.running) {
      if (!run.id.startsWith('procedure:')) map.set(run.label, 'running')
    }
    for (const entry of runs.queued) {
      if (!entry.id.startsWith('procedure:') && !map.has(entry.label)) {
        map.set(entry.label, 'queued')
      }
    }
    return map
  }, [runs])

  useEffect(() => {
    contentRef.current = content
  }, [content])

  const applyContent = useCallback(
    (next: string): void => {
      contentRef.current = next
      setContent(next)
      setOriginalContent(next)
      // The workspace viewer reads the same string — one write keeps the file
      // and this page telling the same story.
      setHeartbeatMd(next)
    },
    [setHeartbeatMd]
  )

  const handleSave = useCallback((): void => {
    setOriginalContent(content)
    contentRef.current = content
    setHeartbeatMd(content)
    toast.show({ tone: 'success', message: t('workspace.saved') })
  }, [content, setHeartbeatMd, t, toast])

  useEffect(() => {
    if (view !== 'markdown') return
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [view, handleSave])

  // Resync: drop any unsaved local edit and re-read the shared file.
  const handleRefresh = useCallback((): void => {
    applyContent(heartbeatMd)
    toast.show({ tone: 'success', message: t('workspace.resynced') })
  }, [applyContent, heartbeatMd, t, toast])

  const handleToggle = useCallback(
    (job: SidebarJob): void => {
      const lines = content.split('\n')
      if (job.active) {
        if (job.endLineIndex > job.lineIndex) {
          lines[job.lineIndex] = `<!-- ${lines[job.lineIndex]}`
          lines.splice(job.endLineIndex + 1, 0, '-->')
        } else {
          lines[job.lineIndex] = `<!-- ${lines[job.lineIndex]} -->`
        }
      } else {
        lines[job.lineIndex] = lines[job.lineIndex].replace(/^<!--\s*/, '')
        if (/\s*-->$/.test(lines[job.lineIndex])) {
          lines[job.lineIndex] = lines[job.lineIndex].replace(/\s*-->$/, '')
        } else {
          for (let j = job.lineIndex + 1; j < lines.length; j++) {
            if (/^\s*-->\s*$/.test(lines[j])) {
              lines.splice(j, 1)
              break
            }
            if (/^##\s+/.test(lines[j]) || /^<!--\s*##/.test(lines[j])) break
          }
        }
      }
      applyContent(lines.join('\n'))
    },
    [applyContent, content]
  )

  // Rewrite (or insert) the job's `mode:` marker line and save. Works for
  // disabled jobs too (the marker is a plain line inside the comment block).
  const handleSetMode = useCallback(
    (job: SidebarJob, mode: ChatMode): void => {
      if (job.mode === mode) return
      const lines = content.split('\n')
      const singleLineDisabled = /^<!--\s*##\s+.+?\s*-->\s*$/.test(lines[job.lineIndex])
      if (job.modeLineIndex !== null) {
        lines[job.modeLineIndex] = `mode: ${mode}`
      } else if (singleLineDisabled) {
        // A body-less disabled job is a one-line comment — splicing the marker
        // after it would put it OUTSIDE the comment, where the engine's
        // comment strip folds it into the PREVIOUS job's instruction. Convert
        // to the block-comment form with the marker inside.
        const heading = lines[job.lineIndex].replace(/^<!--\s*/, '').replace(/\s*-->\s*$/, '')
        lines.splice(job.lineIndex, 1, `<!-- ${heading}`, '', `mode: ${mode}`, '-->')
      } else {
        lines.splice(job.lineIndex + 1, 0, '', `mode: ${mode}`)
      }
      applyContent(lines.join('\n'))
    },
    [applyContent, content]
  )

  const handleDelete = useCallback(
    (job: SidebarJob): void => {
      const lines = content.split('\n')
      lines.splice(job.lineIndex, job.endLineIndex - job.lineIndex + 1)
      // Collapse the blank line the removed block leaves behind, so deletes
      // don't accumulate gaps (leading blank, or a double blank between jobs).
      if (lines[job.lineIndex] === '' && (job.lineIndex === 0 || lines[job.lineIndex - 1] === '')) {
        lines.splice(job.lineIndex, 1)
      }
      applyContent(lines.join('\n'))
      setDeleteTarget(null)
      setEditStamps((prev) => {
        const next = { ...prev }
        delete next[job.label]
        return next
      })
      toast.show({ tone: 'success', message: t('heartbeat.deleteSuccess') })
    },
    [applyContent, content, t, toast]
  )

  const isDirty = content !== originalContent
  const sidebarJobs = useMemo(() => parseSidebarJobs(content, jobs, now), [content, jobs, now])

  // Cards order = fire order: the job that runs next comes first. Active
  // jobs with no computable moment (Startup, exotic crons) follow, and
  // inactive jobs — which never fire — go last; file order within each
  // group (stable sort). Reorders live as runs roll over (the 30s tick).
  const orderedJobs = useMemo(() => {
    const rank = (j: SidebarJob): number =>
      j.active
        ? j.nextRunMs != null
          ? j.nextRunMs
          : Number.MAX_SAFE_INTEGER - 1
        : Number.MAX_SAFE_INTEGER
    return [...sidebarJobs].sort((a, b) => rank(a) - rank(b))
  }, [sidebarJobs])

  // The soonest armed run — what the cards' countdown chips are racing toward.
  const soonestRunMs = useMemo(() => {
    let soonest: number | null = null
    for (const job of sidebarJobs) {
      if (!job.active || job.nextRunMs == null) continue
      if (soonest == null || job.nextRunMs < soonest) soonest = job.nextRunMs
    }
    return soonest
  }, [sidebarJobs])

  // A chip inside its final minute counts seconds ("Next run in 17 seconds"),
  // which the 30s clock above would render as a lie for up to 29 of them. This
  // second clock ticks per second — but ONLY inside that last minute: further
  // out it sleeps right up to the moment the minute begins, and while the
  // editor sheet covers the cards it doesn't run at all.
  const [countdownNow, setCountdownNow] = useState(() => Date.now())
  useEffect(() => {
    if (editorOpen || soonestRunMs == null) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = (): void => {
      const dt = soonestRunMs - Date.now()
      // Overdue by more than half a minute means the run is still executing
      // (the snapshot re-arms when it ends) — back off instead of spinning at
      // 1Hz for the length of a long run.
      const delay = dt > 60_000 ? Math.min(30_000, dt - 60_000) : dt > -30_000 ? 1_000 : 30_000
      timer = setTimeout(() => {
        setCountdownNow(Date.now())
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [editorOpen, soonestRunMs])

  // Newest sample of the two clocks: the chips must never read older than the
  // page's coarse tick (which keeps running while the countdown one sleeps).
  const clock = Math.max(now, countdownNow)

  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  // Card emoji: a project-bound automation wears its PROJECT's emoji; an
  // unbound one wears its own `icon:` marker, else the page default.
  const jobCardIcon = useCallback(
    (job: SidebarJob): string =>
      (job.project ? projectsById.get(job.project)?.icon : undefined) ||
      job.icon ||
      DEFAULT_AUTOMATION_ICON,
    [projectsById]
  )

  // ---- Card editor -------------------------------------------------------

  const draftScheduleTrimmed = draftSchedule.trim()
  const draftNameTrimmed = draftName.trim()
  const draftParsed = useMemo(() => parseSchedule(draftScheduleTrimmed), [draftScheduleTrimmed])
  // The heading is the job's identity (run status and card joins key on it) —
  // a second job with the same label would collide, so the editor blocks it.
  const isDuplicateSchedule =
    editorOpen &&
    draftScheduleTrimmed !== '' &&
    sidebarJobs.some(
      (j) =>
        j.label.toLowerCase() === draftScheduleTrimmed.toLowerCase() &&
        j.label.toLowerCase() !== (boundLabel?.toLowerCase() ?? '')
    )
  // Errors paint late, validity paints now: mid-edit keystrokes pass through
  // invalid states ("Daily (09:3" on the way to "Daily (09:30)"), and turning
  // the field red for each one reads as flicker. The red state waits out a
  // typing pause; a parseable draft clears it immediately. Display-only — the
  // autosave gate below still reads the raw validity.
  const scheduleInvalid = draftParsed === null || isDuplicateSchedule
  const [invalidHeld, setInvalidHeld] = useState(false)
  useEffect(() => {
    if (!scheduleInvalid) {
      // Re-arm the debounce for the next invalid stretch. showScheduleError
      // already derives false the instant the draft turns valid; the microtask
      // keeps the write async (off the effect's synchronous path) yet still
      // lands before any next input event can start a new stretch.
      queueMicrotask(() => setInvalidHeld(false))
      return
    }
    const handle = setTimeout(() => setInvalidHeld(true), 600)
    return () => clearTimeout(handle)
  }, [scheduleInvalid, draftScheduleTrimmed])
  const showScheduleError = scheduleInvalid && invalidHeld
  // While the error is held back, the helper line keeps previewing the last
  // parseable draft — swapping to blank and back would be its own flash.
  // Tracked as state from the event handlers that write the draft (never
  // during render): every draftSchedule write funnels through
  // applyDraftSchedule, which records the parse when it succeeds. Dialog
  // opens always pass a parseable value, so a stale carry-over can't leak
  // across dialogs.
  const [lastParsed, setLastParsed] = useState<ReturnType<typeof parseSchedule>>(null)
  const applyDraftSchedule = useCallback((value: string): void => {
    setDraftSchedule(value)
    const parsed = parseSchedule(value.trim())
    if (parsed) setLastParsed(parsed)
  }, [])
  const displayParsed = draftParsed ?? lastParsed
  const draftNextMs = displayParsed
    ? (displayParsed.atMs ?? (displayParsed.cron ? nextCronMs(displayParsed.cron, now) : null))
    : null
  const draftProject = draftProjectId ? projectsById.get(draftProjectId) : undefined

  // The editor's project chips: "No project" first, then every project with
  // its own emoji and title. A binding whose project is missing from that
  // list still needs a chip, or the row would show nothing lit and the next
  // pick would silently drop it — the mobile chat menu's exact rules.
  const projectChips = useMemo(() => {
    const emoji = (e: string): React.ReactNode => (
      <span aria-hidden className="text-sm leading-none">
        {e}
      </span>
    )
    const rows = [
      { value: '', label: t('heartbeat.editor.projectNone'), icon: emoji('📄') },
      ...projects.map((p) => ({
        value: p.id,
        label: p.title.trim() || t('projects.untitled'),
        icon: emoji(p.icon || '📁')
      }))
    ]
    if (draftProjectId && !projects.some((p) => p.id === draftProjectId)) {
      rows.push({ value: draftProjectId, label: draftProjectId, icon: emoji('📁') })
    }
    return rows
  }, [projects, draftProjectId, t])

  const openCreate = useCallback((): void => {
    boundRef.current = null
    setBoundLabel(null)
    savedDraftRef.current = {
      schedule: '',
      name: '',
      prompt: '',
      icon: '',
      projectId: '',
      files: '',
      dirs: ''
    }
    setEditorJob(null)
    applyDraftSchedule(chipSchedule('daily'))
    setDraftName('')
    setDraftPrompt('')
    setDraftIcon('')
    setDraftProjectId('')
    setDraftFiles([])
    setDraftDirs([])
    setEmojiOpen(false)
    setPromptExpanded(false)
    setEditorOpen(true)
  }, [applyDraftSchedule])

  const openEditor = useCallback(
    (job: SidebarJob): void => {
      const icon = job.icon ?? ''
      const projectId = job.project ?? ''
      boundRef.current = { label: job.label, active: job.active }
      setBoundLabel(job.label)
      const name = job.name ?? ''
      savedDraftRef.current = {
        schedule: job.label,
        name,
        prompt: job.body,
        icon,
        projectId,
        files: job.files.join('\n'),
        dirs: job.dirs.join('\n')
      }
      setEditorJob(job)
      applyDraftSchedule(job.label)
      setDraftName(name)
      setDraftPrompt(job.body)
      setDraftIcon(icon)
      setDraftProjectId(projectId)
      setDraftFiles(job.files)
      setDraftDirs(job.dirs)
      setEmojiOpen(false)
      setPromptExpanded(false)
      setEditorOpen(true)
    },
    [applyDraftSchedule]
  )

  const persistDraft = useCallback(
    (
      schedule: string,
      name: string,
      prompt: string,
      icon: string,
      projectId: string,
      files: string[],
      dirs: string[]
    ): void => {
      savedDraftRef.current = {
        schedule,
        name,
        prompt,
        icon,
        projectId,
        files: files.join('\n'),
        dirs: dirs.join('\n')
      }
      const current = contentRef.current
      // Escaped at the write seam: a pasted prompt with its own `## `
      // sections, dashed separators or comment tokens would otherwise
      // corrupt the file's block grammar (see escapePromptBody).
      const promptLines = escapePromptBody(stripLeadingSettings(prompt)).split('\n')
      const bound = boundRef.current
      // Marker lines the dialog owns. The icon is always written (every
      // automation carries an emoji — default 🫀); the project marker only
      // when bound. The mode marker is preserved from the existing block.
      // Files and directories are repeatable, one line each.
      const settingLines = (mode: ChatMode | null): string[] => [
        ...(mode ? [`mode: ${mode}`] : []),
        ...(projectId ? [`project: ${projectId}`] : []),
        `icon: ${icon || DEFAULT_AUTOMATION_ICON}`,
        // Always written: the editor refuses to save without one, so every
        // automation this dialog touches leaves with a name.
        `name: ${name}`,
        ...files.map((f) => `file: ${f}`),
        ...dirs.map((d) => `dir: ${d}`)
      ]

      // Re-locate the bound block in the CURRENT text — indices captured at
      // dialog-open go stale after the first autosave. A block that vanished
      // (markdown edit elsewhere) falls through to insert, preserving the
      // user's work as a new job.
      const target = bound
        ? (() => {
            const blocks = parseSidebarJobs(current, [], Date.now())
            return (
              blocks.find((b) => b.label === bound.label && b.active === bound.active) ??
              blocks.find((b) => b.label === bound.label) ??
              null
            )
          })()
        : null

      let nextContent: string
      let nextActive = true
      if (target) {
        nextActive = target.active
        const markers = [...settingLines(target.mode), '']
        const block = target.active
          ? [`## ${schedule}`, '', ...markers, ...promptLines]
          : [`<!-- ## ${schedule}`, '', ...markers, ...promptLines, '-->']
        const lines = current.split('\n')
        lines.splice(target.lineIndex, target.endLineIndex - target.lineIndex + 1, ...block)
        nextContent = lines.join('\n')
      } else {
        // New jobs go before the first HTML comment (the examples block) —
        // the same shape the automations plugin's insertBlock produces.
        const block = [`## ${schedule}`, '', ...settingLines(null), '', ...promptLines].join('\n')
        const firstComment = current.search(/<!--/)
        nextContent = (
          firstComment >= 0
            ? `${current.slice(0, firstComment).replace(/\s+$/, '')}\n\n${block}\n\n${current.slice(firstComment)}`
            : `${current.replace(/\s+$/, '')}\n\n${block}\n`
        ).replace(/^\n+/, '')
      }

      applyContent(nextContent)
      // The binding must move in the same render as the content swap: the
      // duplicate check excludes the draft's own block only through
      // boundLabel, so updating it later paints a spurious "duplicate label"
      // flash.
      boundRef.current = { label: schedule, active: nextActive }
      setBoundLabel(schedule)
      setEditStamps((prev) => {
        const next = { ...prev }
        if (bound && bound.label !== schedule) delete next[bound.label]
        next[schedule] = Date.now()
        return next
      })
    },
    [applyContent]
  )

  // Auto-save ~600ms after the last keystroke, but only while the draft is
  // actually saveable: schedule recognized, no label collision, name and
  // prompt present. An invalid draft is never written — closing keeps the last
  // saved state, mirroring the procedures title-required contract.
  useEffect(() => {
    if (!editorOpen) return
    if (!draftParsed || isDuplicateSchedule) return
    if (draftNameTrimmed === '' || draftPrompt.trim() === '') return
    if (
      draftScheduleTrimmed === savedDraftRef.current.schedule &&
      draftNameTrimmed === savedDraftRef.current.name &&
      draftPrompt === savedDraftRef.current.prompt &&
      draftIcon === savedDraftRef.current.icon &&
      draftProjectId === savedDraftRef.current.projectId &&
      draftFiles.join('\n') === savedDraftRef.current.files &&
      draftDirs.join('\n') === savedDraftRef.current.dirs
    ) {
      return
    }
    const handle = setTimeout(
      () =>
        persistDraft(
          draftScheduleTrimmed,
          draftNameTrimmed,
          draftPrompt,
          draftIcon,
          draftProjectId,
          draftFiles,
          draftDirs
        ),
      600
    )
    return () => clearTimeout(handle)
  }, [
    editorOpen,
    draftScheduleTrimmed,
    draftNameTrimmed,
    draftPrompt,
    draftIcon,
    draftProjectId,
    draftFiles,
    draftDirs,
    draftParsed,
    isDuplicateSchedule,
    persistDraft
  ])

  /** The draft is in a state the file can hold — the autosave gate, reused. */
  const draftSaveable =
    draftParsed !== null &&
    !isDuplicateSchedule &&
    draftNameTrimmed !== '' &&
    draftPrompt.trim() !== ''

  const closeEditor = useCallback((): void => {
    setEditorOpen(false)
    setEmojiOpen(false)
    setGuideOpen(false)
    setPromptExpanded(false)
    // Flush any edit the debounce hasn't dispatched yet.
    const saved = savedDraftRef.current
    if (
      draftSaveable &&
      (draftScheduleTrimmed !== saved.schedule ||
        draftNameTrimmed !== saved.name ||
        draftPrompt !== saved.prompt ||
        draftIcon !== saved.icon ||
        draftProjectId !== saved.projectId ||
        draftFiles.join('\n') !== saved.files ||
        draftDirs.join('\n') !== saved.dirs)
    ) {
      persistDraft(
        draftScheduleTrimmed,
        draftNameTrimmed,
        draftPrompt,
        draftIcon,
        draftProjectId,
        draftFiles,
        draftDirs
      )
    }
  }, [
    draftScheduleTrimmed,
    draftNameTrimmed,
    draftPrompt,
    draftIcon,
    draftProjectId,
    draftFiles,
    draftDirs,
    draftSaveable,
    persistDraft
  ])

  const removeDraftFile = useCallback(
    (filePath: string): void => {
      const next = draftFiles.filter((f) => f !== filePath)
      setDraftFiles(next)
      // An unsaveable draft (no schedule yet, empty prompt) writes nothing, so
      // the marker only leaves the file once the rest of the draft can be
      // written with it.
      if (!draftSaveable) return
      persistDraft(
        draftScheduleTrimmed,
        draftNameTrimmed,
        draftPrompt,
        draftIcon,
        draftProjectId,
        next,
        draftDirs
      )
    },
    [
      draftFiles,
      draftDirs,
      draftSaveable,
      draftScheduleTrimmed,
      draftNameTrimmed,
      draftPrompt,
      draftIcon,
      draftProjectId,
      persistDraft
    ]
  )

  // The countdown chip's label. Timing lives in the chip now, not the meta
  // line: it is the one thing on an automation card that changes by itself.
  const nextRunLabel = useCallback(
    (job: SidebarJob): string => {
      if (!job.active) return t('heartbeat.inactive')
      if (job.type === 'startup') return t('heartbeat.onLaunch')
      if (job.nextRunMs == null) return t('heartbeat.active')
      // A moment already gone formats as "… ago", which is nonsense for a NEXT
      // run — that window is the job firing before the snapshot re-arms, so
      // clamp it to now and read "Next run now" until the new moment lands.
      return t('heartbeat.nextRun', {
        time: formatFromNow(Math.max(job.nextRunMs, clock), clock, locale)
      })
    },
    [clock, locale, t]
  )

  const jobMetaLine = useCallback(
    (job: SidebarJob): string => {
      // With a name in the title slot the heading's own syntax would otherwise
      // vanish from the card — "next run in 21 hours" does not say "weekly".
      // A job with no name still has it as its title, so don't repeat it.
      const parts = job.name?.trim() ? [job.label] : []
      // The chip carries the relative countdown; the wall-clock moment it
      // lands on stays here, where it doesn't have to re-render every second.
      if (job.active && job.type !== 'startup' && job.nextRunMs != null) {
        parts.push(formatAbsolute(job.nextRunMs, locale))
      }
      const project = job.project ? projectsById.get(job.project) : undefined
      if (project) parts.push(project.title.trim() || t('projects.untitled'))
      const edited = editStamps[job.label]
      if (edited != null) {
        parts.push(t('heartbeat.editedAt', { time: formatFromNow(edited, now, locale) }))
      }
      return parts.join(' · ')
    },
    [editStamps, locale, now, projectsById, t]
  )

  return (
    <>

      {view === 'cards' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 max-sm:px-4 max-sm:py-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-fg text-2xl font-semibold tracking-tight">
                    {t('heartbeat.title')}
                  </h1>
                  <Badge variant="default" size="sm">
                    {sidebarJobs.length}
                  </Badge>
                </div>
                <p className="text-muted text-sm leading-relaxed">{t('heartbeat.subtitle')}</p>
              </div>
              <Button size="sm" onClick={openCreate} className="shrink-0">
                <Add01Icon size={16} />
                <span>{t('heartbeat.new')}</span>
              </Button>
            </header>

            {orderedJobs.length === 0 ? (
              <div className="border-border text-muted rounded-2xl border border-dashed px-6 py-12 text-center text-sm">
                {t('heartbeat.empty')}
              </div>
            ) : (
              // Services' landing grid, card for card: two columns of equal
              // identity tiles — wide enough that the next-run chip, the name
              // and the toggles stay readable. The prompt, files and folders
              // are NOT on the card — they are what the editor sheet is for.
              // One column on a phone: two of these tiles side by side leaves
              // neither the name nor the toggles a readable width.
              <ul className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
                {orderedJobs.map((job) => {
                  const busy = job.active ? busyByLabel.get(job.label) : undefined
                  // The name is what this automation is CALLED; the schedule
                  // is what it does, and the chip below already reads it. A
                  // job written before names existed has only its heading.
                  const title = job.name?.trim() || job.label
                  // Can come back empty (an unnamed, inactive, unbound job) —
                  // the chip above already says everything it would have.
                  const metaLine = jobMetaLine(job)
                  return (
                    <li key={job.label} className="min-w-0">
                      <div
                        className={cn(
                          'bg-surface border-border flex h-full w-full flex-col items-start gap-3 rounded-2xl border p-4 text-start',
                          !job.active && 'opacity-60'
                        )}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span
                            aria-hidden
                            className="border-border bg-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-lg leading-none"
                          >
                            {jobCardIcon(job)}
                          </span>
                          <div className="flex shrink-0 items-center">
                            {job.active && (
                              <button
                                type="button"
                                onClick={demoAction}
                                disabled={!!busy}
                                aria-label={t('heartbeat.run')}
                                title={
                                  busy
                                    ? t(
                                        busy === 'running'
                                          ? 'heartbeat.noteRunning'
                                          : 'heartbeat.noteQueued'
                                      )
                                    : t('heartbeat.run')
                                }
                                className={cn(
                                  iconButtonClass,
                                  'hover:text-emerald-600 dark:hover:text-emerald-400',
                                  'disabled:cursor-not-allowed disabled:opacity-40'
                                )}
                              >
                                <PlayIcon size={17} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditor(job)}
                              aria-label={t('heartbeat.edit')}
                              title={t('heartbeat.edit')}
                              className={cn(iconButtonClass, 'hover:text-fg')}
                            >
                              <Edit02Icon size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(job)}
                              aria-label={t('heartbeat.delete')}
                              title={t('heartbeat.delete')}
                              className={cn(iconButtonClass, 'hover:text-rose-500')}
                            >
                              <Delete02Icon size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
                          {/* On/off and mode are properties of the
                              automation, not of its prompt. They lead the
                              stack, pushed to the card's two edges: the switch
                              under the emoji, the mode under the action
                              buttons — so the controls frame the same width the
                              header row above them does. */}
                          <div className="flex w-full flex-wrap items-center justify-between gap-1.5">
                            <div
                              role="tablist"
                              className="border-border bg-bg/40 inline-flex shrink-0 items-center rounded-lg border p-0.5"
                            >
                              <button
                                role="tab"
                                type="button"
                                aria-selected={job.active}
                                onClick={() => {
                                  if (!job.active) handleToggle(job)
                                }}
                                className={cn(
                                  'rounded-md px-2 py-1 text-[10px] font-medium',
                                  job.active
                                    ? 'bg-primary text-primary-fg shadow-sm'
                                    : 'text-muted hover:text-fg cursor-pointer'
                                )}
                              >
                                {t('settings.wolffish.toggle.on')}
                              </button>
                              <button
                                role="tab"
                                type="button"
                                aria-selected={!job.active}
                                onClick={() => {
                                  if (job.active) handleToggle(job)
                                }}
                                className={cn(
                                  'rounded-md px-2 py-1 text-[10px] font-medium',
                                  !job.active
                                    ? 'bg-primary text-primary-fg shadow-sm'
                                    : 'text-muted hover:text-fg cursor-pointer'
                                )}
                              >
                                {t('settings.wolffish.toggle.off')}
                              </button>
                            </div>
                            <div
                              role="tablist"
                              aria-label={t('heartbeat.modeAria')}
                              className="border-border bg-bg/40 inline-flex shrink-0 items-center rounded-lg border p-0.5"
                            >
                              {(['single', 'workflow'] as const).map((m) => {
                                const selected = (job.mode ?? globalMode) === m
                                return (
                                  <button
                                    key={m}
                                    role="tab"
                                    type="button"
                                    aria-selected={selected}
                                    onClick={() => {
                                      if (!selected) handleSetMode(job, m)
                                    }}
                                    className={cn(
                                      'rounded-md px-2 py-1 text-[10px] font-medium',
                                      selected
                                        ? 'bg-primary text-primary-fg shadow-sm'
                                        : 'text-muted hover:text-fg cursor-pointer'
                                    )}
                                  >
                                    {t(
                                      m === 'workflow'
                                        ? 'chat.modePicker.workflow'
                                        : 'chat.modePicker.single'
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <span
                            title={title}
                            className="text-fg flex w-full min-w-0 items-center justify-between gap-2 text-sm font-semibold"
                          >
                            {/* The name takes the whole row and ellipses on one
                                line however long it runs; the interval badge
                                holds the end edge, so every card's badge lands
                                on the same column. */}
                            <bdi className="min-w-0 flex-1 truncate">{title}</bdi>
                            <Badge variant="primary" size="sm" className="shrink-0">
                              {t(`heartbeat.type.${job.type}`)}
                            </Badge>
                          </span>
                          {/* The countdown, worn as the composer's active-model
                              chip: same soft primary tint, same size. It sits
                              straight under the name because it is the card's
                              headline fact — when this thing runs next. An
                              automation that is switched off wears the muted
                              variant instead of promising a run that isn't
                              coming. */}
                          <span
                            title={
                              job.active && job.nextRunMs != null
                                ? formatAbsolute(job.nextRunMs, locale)
                                : undefined
                            }
                            className={cn(
                              nextRunChipClass,
                              job.active ? 'bg-primary/10 text-primary' : 'bg-border/40 text-muted'
                            )}
                          >
                            <Clock01Icon size={13} className="shrink-0" />
                            <span className="truncate">{nextRunLabel(job)}</span>
                          </span>
                          {busy && (
                            <span
                              className={cn(
                                'flex items-center gap-1.5 text-xs',
                                busy === 'running'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              )}
                            >
                              <InformationCircleIcon size={13} className="shrink-0" />
                              <span className="truncate">
                                {t(
                                  busy === 'running'
                                    ? 'heartbeat.noteRunning'
                                    : 'heartbeat.noteQueued'
                                )}
                              </span>
                            </span>
                          )}
                          {/* Schedule syntax, the moment it lands on, and
                              the edit stamp — reference detail, set in the
                              mono well the guide and folder rows use, and
                              pinned to the bottom so every card in the row
                              ends on the same line. */}
                          {metaLine !== '' && (
                            <code className="border-border bg-bg text-muted mt-auto line-clamp-2 rounded-lg border px-2 py-1 font-mono text-[10px] leading-relaxed">
                              {metaLine}
                            </code>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div dir="ltr" className="flex min-h-0 flex-1">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="border-border flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3 max-sm:px-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-fg text-sm font-medium">heartbeat.md</span>
                {isDirty && (
                  <span className="text-muted text-xs italic">{t('demo.heartbeat.unsaved')}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className={cn(
                    'text-muted hover:text-fg inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs',
                    'disabled:cursor-not-allowed disabled:opacity-40'
                  )}
                >
                  <Refresh01Icon size={14} />
                  <span>{t('workspace.resync')}</span>
                </button>
                <CopyButton text={content} variant="inline" />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty}
                  aria-label={t('workspace.save')}
                  title={t('workspace.save')}
                  className={cn(
                    'text-muted hover:text-fg hover:bg-border/40 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg',
                    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted'
                  )}
                >
                  <FloppyDiskIcon size={16} />
                </button>
              </div>
            </div>
            <CodeEditor
              value={content}
              language="markdown"
              isDark={isDark}
              readOnly={false}
              onChange={setContent}
              className="min-h-0 w-full flex-1"
              spellcheck
            />
          </section>
        </div>
      )}

      <EditorSheet
        open={editorOpen}
        onClose={closeEditor}
        // While the guide or the expanded prompt editor is stacked on top,
        // Escape/backdrop must only close that — not both surfaces at once.
        dismissable={!guideOpen && !promptExpanded}
        title={editorJob ? t('heartbeat.editor.editTitle') : t('heartbeat.editor.createTitle')}
        footer={
          <div className="flex justify-end">
            <Button size="sm" onClick={closeEditor}>
              {t('heartbeat.editor.done')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {/* Identity first: what this automation is CALLED, next to the emoji
              it wears. The schedule follows below — it is a setting of the
              automation, not its name, and the card now says the name. */}
          <span className="text-muted text-xs font-medium">{t('heartbeat.editor.name')}</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              {/* A project-bound automation wears the project's emoji — the
                  button shows it and disables (the automation's own icon
                  returns when the binding is removed). */}
              <button
                type="button"
                disabled={draftProject !== undefined}
                onClick={() => setEmojiOpen((v) => !v)}
                aria-label={
                  draftProject ? t('heartbeat.editor.projectIcon') : t('heartbeat.editor.pickIcon')
                }
                title={
                  draftProject ? t('heartbeat.editor.projectIcon') : t('heartbeat.editor.pickIcon')
                }
                className={cn(
                  'bg-bg border-border flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-lg',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
                  'disabled:cursor-default'
                )}
              >
                {draftProject ? draftProject.icon || '📁' : draftIcon || DEFAULT_AUTOMATION_ICON}
              </button>
              {emojiOpen && (
                <EmojiPicker
                  onPick={(emoji) => {
                    setDraftIcon(emoji)
                    setEmojiOpen(false)
                  }}
                  onClose={() => setEmojiOpen(false)}
                />
              )}
            </div>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={t('heartbeat.editor.namePlaceholder')}
              dir="auto"
              aria-label={t('heartbeat.editor.name')}
              aria-invalid={draftNameTrimmed === ''}
              className={cn(fieldClass, 'min-w-0')}
            />
          </div>
          {/* Muted, not red: an empty name on a fresh dialog is where everyone
              starts, not a mistake. It has to be said all the same — nothing
              saves without it, so silence here would lose a typed prompt. */}
          {draftNameTrimmed === '' && (
            <p className="text-muted text-xs">{t('heartbeat.editor.nameRequired')}</p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-medium">{t('heartbeat.editor.schedule')}</span>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              aria-label={t('heartbeat.editor.guideButton')}
              title={t('heartbeat.editor.guideButton')}
              className="text-muted hover:text-fg flex h-7 w-7 cursor-pointer items-center justify-center rounded-md"
            >
              <HelpCircleIcon size={15} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {CHIP_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => applyDraftSchedule(chipSchedule(kind))}
                className={cn(
                  'border-border bg-bg text-muted cursor-pointer rounded-full border px-2.5 py-1 text-xs',
                  'hover:border-accent/50 hover:text-fg',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
                )}
              >
                {t(`heartbeat.editor.chips.${kind}`)}
              </button>
            ))}
          </div>
          <input
            value={draftSchedule}
            onChange={(e) => applyDraftSchedule(e.target.value)}
            placeholder="Daily (09:00)"
            dir="ltr"
            aria-label={t('heartbeat.editor.schedule')}
            aria-invalid={showScheduleError}
            className={cn(fieldClass, 'w-full font-mono', showScheduleError && 'border-rose-500/70')}
          />
          {showScheduleError || displayParsed === null ? (
            draftParsed === null ? (
              <p className="text-xs text-rose-500">
                {t('heartbeat.editor.invalid')}{' '}
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="cursor-pointer underline underline-offset-2"
                >
                  {t('heartbeat.editor.guideButton')}
                </button>
              </p>
            ) : (
              <p className="text-xs text-rose-500">{t('heartbeat.editor.duplicate')}</p>
            )
          ) : displayParsed.type === 'startup' ? (
            <p className="text-muted text-xs">{t('heartbeat.onLaunch')}</p>
          ) : displayParsed.atMs != null && displayParsed.atMs <= now ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('heartbeat.editor.pastOnce')}
            </p>
          ) : draftNextMs != null ? (
            // The very chip this automation will wear on its card once saved —
            // the preview and the result should not be two different objects.
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(nextRunChipClass, 'bg-primary/10 text-primary')}>
                <Clock01Icon size={13} className="shrink-0" />
                <span className="truncate">
                  {t('heartbeat.nextRun', { time: formatFromNow(draftNextMs, now, locale) })}
                </span>
              </span>
              <span className="text-muted text-xs">{formatAbsolute(draftNextMs, locale)}</span>
            </div>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('heartbeat.editor.cronUnknown')}
            </p>
          )}

          <span className="text-muted text-xs font-medium">{t('heartbeat.editor.project')}</span>
          {/* Bind/unbind a project: the run gets the project's context and its
              conversation registers under the project. The mobile chat menu's
              chip row — the whole list on one x-scrolling line. */}
          <ChipRow
            ariaLabel={t('heartbeat.editor.project')}
            truncateLabels
            chips={projectChips}
            value={draftProjectId}
            onChange={(id) => {
              setDraftProjectId(id)
              setEmojiOpen(false)
            }}
          />

          <span className="text-muted text-xs font-medium">{t('heartbeat.editor.prompt')}</span>
          {/* The prompt, in the same CodeMirror editor the expanded sheet
              runs — editable in place, over the same draft state. Fixed
              height, filled or empty: the dialog never reflows as the prompt
              grows, so the longest prompt scrolls inside the block and the
              button below opens the full-height sheet to write comfortably.
              background="field" sits the block in the same bg-bg well the
              Select and input fields use. */}
          <div className="border-border h-40 w-full overflow-hidden rounded-lg border">
            <CodeEditor
              value={draftPrompt}
              language="markdown"
              background="field"
              isDark={isDark}
              onChange={setDraftPrompt}
              placeholder={t('heartbeat.editor.promptPlaceholder')}
              className="h-full overflow-auto overscroll-contain"
              spellcheck
            />
          </div>
          {/* Same draft, more room — opens the full-height editor sheet. */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPromptExpanded(true)}
            className="self-start"
          >
            {draftPrompt.trim()
              ? t('heartbeat.editor.editPrompt')
              : t('heartbeat.editor.addPrompt')}
          </Button>

          {/* Files: copied INTO the workspace on attach, exactly like a
              project's, so the automation can never dangle on a moved
              original. The run gets the list, never the content. */}
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-medium">
              {t('heartbeat.editor.files', { count: draftFiles.length })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={demoAction}
              className="flex items-center gap-1"
            >
              <Add01Icon size={13} />
              <span>{t('heartbeat.editor.addFiles')}</span>
            </Button>
          </div>
          {draftFiles.length > 0 && (
            <ul className={cn(fileCardClass, 'flex max-h-36 flex-col gap-0.5 overflow-y-auto')}>
              {draftFiles.map((filePath) => {
                const { base, ext } = splitFileName(fileBaseName(filePath))
                return (
                  <li key={filePath} className={cn('group shrink-0', fileRowClass)}>
                    {/* dir=ltr pins filename order (and the pinned extension)
                        even in the RTL locale — paths are LTR text. */}
                    <span
                      title={filePath}
                      dir="ltr"
                      className="text-fg flex min-w-0 flex-1 items-baseline text-xs"
                    >
                      <span className="truncate">{base}</span>
                      {ext && <span className="shrink-0">{ext}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDraftFile(filePath)}
                      aria-label={t('heartbeat.editor.removeFile')}
                      title={t('heartbeat.editor.removeFile')}
                      className="text-muted flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md hover:text-rose-500"
                    >
                      <Delete02Icon size={13} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Working directories: references, never copies. They ride the run
              through the same channel as chat's folder picker, so the model
              sees a fresh listing of each one on every iteration. */}
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-medium">
              {t('heartbeat.editor.folders', { count: draftDirs.length })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={demoAction}
              className="flex items-center gap-1"
            >
              <Add01Icon size={13} />
              <span>{t('heartbeat.editor.addFolders')}</span>
            </Button>
          </div>
          {draftDirs.length > 0 && (
            <ul className={cn(fileCardClass, 'flex max-h-40 flex-col gap-1.5 overflow-y-auto')}>
              {draftDirs.map((dir) => (
                <li key={dir} dir="ltr" className="flex flex-col gap-0.5 px-1.5 py-0.5">
                  <span title={dir} className="text-fg truncate text-xs">
                    {fileBaseName(dir)}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* The full path, in a code block — the same treatment the
                        composer's working-folder card gives it. */}
                    <code
                      title={dir}
                      className="border-border bg-surface text-muted block min-w-0 flex-1 truncate rounded border px-1 py-0.5 font-mono text-[10px]"
                    >
                      {dir}
                    </code>
                    <button
                      type="button"
                      onClick={() => setDraftDirs((prev) => prev.filter((d) => d !== dir))}
                      aria-label={t('heartbeat.editor.removeFolder')}
                      title={t('heartbeat.editor.removeFolder')}
                      className="text-muted flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md hover:text-rose-500"
                    >
                      <Delete02Icon size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="text-muted text-xs">{t('heartbeat.editor.autosaveHint')}</p>
        </div>
      </EditorSheet>

      {/* The expanded prompt editor — the file viewers' own expand sheet, over
          the same draft state, so what is typed here autosaves on the editor's
          debounce and the preview above reflects it the moment this closes.
          The sheet, not a centered dialog: the form behind it is a sheet too,
          so expanding the prompt widens the same surface instead of stacking a
          second shape on top of it. */}
      <ExpandedSheet
        open={editorOpen && promptExpanded}
        onClose={() => setPromptExpanded(false)}
        title={
          draftPrompt.trim() ? t('heartbeat.editor.editPrompt') : t('heartbeat.editor.addPrompt')
        }
      >
        <CodeEditor
          value={draftPrompt}
          language="markdown"
          background="field"
          isDark={isDark}
          onChange={setDraftPrompt}
          placeholder={t('heartbeat.editor.promptPlaceholder')}
          className="h-full overflow-auto"
          spellcheck
        />
      </ExpandedSheet>

      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title={t('heartbeat.guide.title')}
        className="max-w-xl"
      >
        <div className="flex flex-col gap-3">
          <p className="text-muted text-sm leading-relaxed">{t('heartbeat.guide.intro')}</p>
          {/* Stacked rows (code block, description under it) grow tall with
              10 forms — the list scrolls so the intro and footer notes stay
              put and the dialog never outgrows the viewport. */}
          <ul className="flex max-h-[55vh] flex-col gap-2.5 overflow-y-auto pe-1">
            {GUIDE_ROWS.map((row) => (
              <li key={row.key} className="flex flex-col gap-1">
                <div
                  dir="ltr"
                  className="bg-bg border-border flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5"
                >
                  <code className="text-fg font-mono text-xs">{row.code}</code>
                  <CopyButton text={row.code} size={13} variant="inline" className="shrink-0" />
                </div>
                <span className="text-muted px-0.5 text-xs leading-relaxed">
                  {t(`heartbeat.guide.${row.key}`)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted text-xs leading-relaxed">{t('heartbeat.guide.localTime')}</p>
          <p className="text-muted text-xs leading-relaxed">{t('heartbeat.guide.chipsTip')}</p>
        </div>
      </Modal>

      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title={t('heartbeat.deleteTitle')}
          footer={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                className="flex-1"
              >
                {t('heartbeat.deleteCancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 border border-transparent bg-red-600 text-white shadow-none hover:bg-red-700"
              >
                {t('heartbeat.deleteConfirm')}
              </Button>
            </div>
          }
        >
          <p className="text-muted">
            {t('heartbeat.deleteWarning', {
              name: deleteTarget.name?.trim() || deleteTarget.label
            })}
          </p>
        </Modal>
      )}
    </>
  )
}
