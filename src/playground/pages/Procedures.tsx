'use client'
import { ChipRow } from '@/playground/components/common/chip-row/ChipRow'
import { EmojiPicker } from '@/playground/components/common/emoji-picker/EmojiPicker'
import { Badge } from '@/playground/components/core/Badge'
import { Button } from '@/playground/components/core/Button'
import { CodeEditor } from '@/playground/components/core/CodeEditor'
import { EditorSheet } from '@/playground/components/core/EditorSheet'
import { ExpandedSheet } from '@/playground/components/core/ExpandedSheet'
import { Modal } from '@/playground/components/core/Modal'
import { useToast } from '@/playground/components/core/toast/useToast'
import { useLocale, useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import type { ChatMode, Procedure, ProcedureFileRef } from '@/playground/data/types'
import { useDemo, useDemoAction, useTheme } from '@/playground/providers/PlaygroundProvider'
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  PlayIcon
} from 'hugeicons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// The attached-files list holds rows of one fixed height, so the block keeps
// its space as files come and go — the project dialog's contract, because it
// is the same block.
const fileCardClass = 'border-border bg-bg rounded-lg border p-1.5'
/** h-8 — the remove button's h-6 plus the row's former py-1, top and bottom. */
const fileRowHeight = 'h-8'
const fileRowClass = cn(fileRowHeight, 'flex items-center gap-2 rounded-md px-1.5')

/** Last path segment, for either separator — these are absolute OS paths. */
function folderBaseName(filePath: string): string {
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

const fieldClass = cn(
  'bg-bg border-border text-fg placeholder:text-muted/60 block w-full rounded-lg border px-3 py-2 text-sm leading-5',
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg focus-visible:outline-none'
)

const iconButtonClass = cn(
  'text-muted flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg',
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  'disabled:cursor-not-allowed disabled:opacity-40'
)

/** Card emoji fallback for procedures that never picked one. */
const DEFAULT_PROCEDURE_ICON = '📋'

/** Procedures — one tab of the Library page, which owns the chrome around it. */
export function Procedures(): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { isDark } = useTheme()
  const { goTo, config, procedures, setProcedures, projects, newSession } = useDemo()
  const demoAction = useDemoAction()
  // Rows without a stamp follow the global mode — the pill shows that
  // effective value; clicking a tab stamps the row explicitly.
  const globalMode: ChatMode = config.llm.mode === 'workflow' ? 'workflow' : 'single'
  const toast = useToast()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftIcon, setDraftIcon] = useState('')
  const [draftProjectId, setDraftProjectId] = useState('')
  // Files and working folders persist IMMEDIATELY per add/remove (the project
  // dialog's contract), not on the prompt debounce — an attach already wrote
  // bytes to disk, so leaving the list unwritten until the next keystroke
  // would be a window in which the copy exists and nothing references it.
  const [draftFiles, setDraftFiles] = useState<ProcedureFileRef[]>([])
  const [draftDirs, setDraftDirs] = useState<string[]>([])
  // The prompt is edited in a full-screen sheet: the dialog shows four lines
  // and clicking opens the editor, which writes into this same draft state so
  // the existing autosave commits it.
  const [promptExpanded, setPromptExpanded] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  // Same contract as ProjectDialog: the required-title error arms on the
  // first edit to any field, never on open — a fresh procedure starts
  // untitled, and with an empty title autosave suspends + the stub is
  // discarded on close, so edits elsewhere are what the warning protects.
  const [touched, setTouched] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Procedure | null>(null)

  const editing = editingId ? (procedures.find((p) => p.id === editingId) ?? null) : null

  // Tick a clock so the "edited …" labels stay fresh without reloading the list.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  // Card emoji: a project-bound procedure wears its PROJECT's emoji; an
  // unbound one wears its own, else the page default.
  const procedureCardIcon = useCallback(
    (procedure: Procedure): string =>
      (procedure.projectId ? projectsById.get(procedure.projectId)?.icon : undefined) ||
      procedure.icon ||
      DEFAULT_PROCEDURE_ICON,
    [projectsById]
  )

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
      { value: '', label: t('procedures.projectNone'), icon: emoji('📄') },
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

  // The last values committed to the store for the open procedure. Used as the
  // auto-save baseline: comparing the draft against this (updated synchronously
  // at dispatch) stops an idle dialog from re-saving in a loop AND stops a close
  // from re-writing an edit the debounce already sent.
  const savedRef = useRef<{ title: string; prompt: string; icon: string; projectId: string }>({
    title: '',
    prompt: '',
    icon: '',
    projectId: ''
  })

  /** One funnel for every write — merges a patch into the stored procedure. */
  const patchProcedure = useCallback(
    (id: string, patch: Partial<Procedure>): void => {
      setProcedures((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p))
      )
    },
    [setProcedures]
  )

  const openEditor = useCallback((procedure: Procedure) => {
    setEditingId(procedure.id)
    setDraftTitle(procedure.title)
    setDraftPrompt(procedure.prompt)
    setDraftIcon(procedure.icon ?? '')
    setDraftProjectId(procedure.projectId ?? '')
    setDraftFiles(procedure.files ?? [])
    setDraftDirs(procedure.directories ?? [])
    setEmojiOpen(false)
    setPromptExpanded(false)
    setTouched(false)
    savedRef.current = {
      title: procedure.title,
      prompt: procedure.prompt,
      icon: procedure.icon ?? '',
      projectId: procedure.projectId ?? ''
    }
  }, [])

  const persist = useCallback(
    (id: string, title: string, prompt: string, icon: string, projectId: string) => {
      savedRef.current = { title, prompt, icon, projectId }
      patchProcedure(id, { title, prompt, icon, projectId })
    },
    [patchProcedure]
  )

  const removeFile = useCallback(
    (filePath: string) => {
      if (!editing) return
      const next = draftFiles.filter((f) => f.path !== filePath)
      setTouched(true)
      setDraftFiles(next)
      patchProcedure(editing.id, { files: next })
    },
    [draftFiles, editing, patchProcedure]
  )

  const removeDir = useCallback(
    (dir: string) => {
      if (!editing) return
      const next = draftDirs.filter((d) => d !== dir)
      setTouched(true)
      setDraftDirs(next)
      patchProcedure(editing.id, { directories: next })
    },
    [draftDirs, editing, patchProcedure]
  )

  // Auto-save ~600ms after the last keystroke. Title is required, so nothing is
  // persisted until one is typed; values are stored verbatim (no trim), so the
  // draft compares exactly against savedRef.
  useEffect(() => {
    if (!editingId) return
    if (draftTitle.trim() === '') return
    if (
      draftTitle === savedRef.current.title &&
      draftPrompt === savedRef.current.prompt &&
      draftIcon === savedRef.current.icon &&
      draftProjectId === savedRef.current.projectId
    ) {
      return
    }
    const handle = setTimeout(
      () => persist(editingId, draftTitle, draftPrompt, draftIcon, draftProjectId),
      600
    )
    return () => clearTimeout(handle)
  }, [editingId, draftTitle, draftPrompt, draftIcon, draftProjectId, persist])

  const closeEditor = useCallback(() => {
    const currentId = editingId
    setEditingId(null)
    setEmojiOpen(false)
    setPromptExpanded(false)
    if (!currentId) return
    // Title is required. With a blank title, nothing is persisted: a never-named
    // procedure (fresh stub) is discarded entirely; one that already had a title
    // keeps its last saved state (a cleared title is never written).
    if (draftTitle.trim() === '') {
      if (savedRef.current.title.trim() === '') {
        setProcedures((prev) => prev.filter((p) => p.id !== currentId))
      }
      return
    }
    // Flush any edit the debounce hasn't dispatched yet.
    if (
      draftTitle !== savedRef.current.title ||
      draftPrompt !== savedRef.current.prompt ||
      draftIcon !== savedRef.current.icon ||
      draftProjectId !== savedRef.current.projectId
    ) {
      persist(currentId, draftTitle, draftPrompt, draftIcon, draftProjectId)
    }
  }, [editingId, draftTitle, draftPrompt, draftIcon, draftProjectId, persist, setProcedures])

  // Create with a blank title (the card shows an "Untitled" fallback) and open
  // the editor. If the user closes without writing anything, closeEditor drops
  // it — so a create-then-abandon never leaves an orphan card.
  const handleCreate = useCallback(() => {
    const stamp = Date.now()
    const created: Procedure = {
      id: `prc_${stamp.toString(36)}`,
      title: '',
      prompt: '',
      files: [],
      directories: [],
      createdAt: stamp,
      updatedAt: stamp
    }
    setProcedures((prev) => [created, ...prev])
    openEditor(created)
  }, [openEditor, setProcedures])

  const handleDelete = useCallback(() => {
    const target = deleteTarget
    if (!target) return
    setProcedures((prev) => prev.filter((p) => p.id !== target.id))
    setDeleteTarget(null)
    toast.show({ tone: 'success', message: t('procedures.deleteSuccess') })
  }, [deleteTarget, setProcedures, t, toast])

  // The mode toggle persists immediately (per-field merge, so a concurrent
  // title/prompt autosave can't clobber it).
  const handleSetMode = useCallback(
    (procedure: Procedure, mode: ChatMode) => {
      if ((procedure.mode ?? 'single') === mode) return
      patchProcedure(procedure.id, { mode })
    },
    [patchProcedure]
  )

  // Play: start a fresh conversation, queue this procedure's prompt, and
  // reveal Chat — which auto-sends it. Navigating away unmounts this page, so
  // the page closes for free.
  const handlePlay = useCallback(
    (procedure: Procedure) => {
      // A fresh SESSION per run: the procedure auto-sends into its own new
      // conversation while every other session (including a streaming one)
      // keeps running untouched. The icon rides along so the conversation's
      // rail badge shows this procedure's emoji, and a project binding runs
      // the turn inside that project (overlay + conversation registration).
      newSession({
        procedure: {
          prompt: procedure.prompt,
          mode: procedure.mode,
          icon: procedure.icon || DEFAULT_PROCEDURE_ICON,
          files: (procedure.files ?? []).map((f) => f.path),
          directories: procedure.directories ?? []
        },
        projectId: procedure.projectId ?? null
      })
      goTo('chat')
    },
    [goTo, newSession]
  )

  return (
    <>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 max-sm:px-4 max-sm:py-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-fg text-2xl font-semibold tracking-tight">
                  {t('procedures.title')}
                </h1>
                <Badge variant="default" size="sm">
                  {procedures.length}
                </Badge>
              </div>
              <p className="text-muted text-sm leading-relaxed">{t('procedures.subtitle')}</p>
            </div>
            <Button size="sm" onClick={handleCreate} className="shrink-0">
              <Add01Icon size={16} />
              <span>{t('procedures.new')}</span>
            </Button>
          </header>

          {procedures.length === 0 ? (
            <div className="border-border text-muted rounded-2xl border border-dashed px-6 py-12 text-center text-sm">
              {t('procedures.empty')}
            </div>
          ) : (
            // Services' landing grid, card for card: two columns of equal
            // identity tiles — wide enough that a long name, its meta line and
            // the mode toggle stay readable. The prompt, files and folders are
            // NOT on the card — they are what the editor sheet is for.
            // One column on a phone: two of these tiles side by side leaves
            // neither the name nor the mode toggle a readable width.
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {procedures.map((procedure) => {
                const name = procedure.title.trim() || t('procedures.untitled')
                const runnable = procedure.prompt.trim().length > 0
                const project = procedure.projectId
                  ? projectsById.get(procedure.projectId)
                  : undefined
                // One mono line, the automations card's exact contract: facts
                // joined by " · ", with anything that doesn't apply dropped
                // rather than printed empty.
                const metaLine = [
                  t('procedures.editedAt', {
                    time: formatFromNow(procedure.updatedAt, now, locale)
                  }),
                  project ? project.title.trim() || t('projects.untitled') : null
                ]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <li key={procedure.id} className="min-w-0">
                    <div className="bg-surface border-border flex h-full w-full flex-col items-start gap-3 rounded-2xl border p-4 text-start">
                      <div className="flex w-full items-center justify-between gap-2">
                        <span
                          aria-hidden
                          className="border-border bg-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-lg leading-none"
                        >
                          {procedureCardIcon(procedure)}
                        </span>
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            onClick={() => handlePlay(procedure)}
                            disabled={!runnable}
                            aria-label={t('procedures.run')}
                            title={runnable ? t('procedures.run') : t('procedures.runEmptyHint')}
                            className={cn(
                              iconButtonClass,
                              'hover:text-emerald-600 disabled:hover:text-muted dark:hover:text-emerald-400'
                            )}
                          >
                            <PlayIcon size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditor(procedure)}
                            aria-label={t('procedures.edit')}
                            title={t('procedures.edit')}
                            className={cn(iconButtonClass, 'hover:text-fg')}
                          >
                            <Edit02Icon size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(procedure)}
                            aria-label={t('procedures.delete')}
                            title={t('procedures.delete')}
                            className={cn(iconButtonClass, 'hover:text-rose-500')}
                          >
                            <Delete02Icon size={15} />
                          </button>
                        </div>
                      </div>
                      {/* Mode is a property of the procedure, not of its
                          prompt — so it leads the stack rather than trailing
                          it, held to the card's end edge (`self-end`, which
                          follows the locale's direction) so every card's
                          toggle lands on the same column as the action buttons
                          above it. */}
                      <div
                        role="tablist"
                        aria-label={t('procedures.modeAria')}
                        className="border-border bg-bg/40 inline-flex items-center gap-0.5 self-end rounded-lg border p-0.5"
                      >
                        {(['single', 'workflow'] as const).map((m) => {
                          const active = (procedure.mode ?? globalMode) === m
                          return (
                            <button
                              key={m}
                              role="tab"
                              type="button"
                              aria-selected={active}
                              onClick={() => handleSetMode(procedure, m)}
                              className={cn(
                                'cursor-pointer rounded-md px-2 py-1 text-[10px] font-medium',
                                'focus-visible:ring-2 focus-visible:ring-accent',
                                active
                                  ? 'bg-primary text-primary-fg shadow-sm'
                                  : 'text-muted hover:text-fg'
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
                      <span title={name} className="text-fg w-full truncate text-sm font-semibold">
                        {name}
                      </span>
                      {/* The edit stamp and the bound project — reference
                          detail, in the mono well the automations cards use,
                          pinned to the bottom so every card in the row ends on
                          the same line. */}
                      <code className="border-border bg-bg text-muted mt-auto line-clamp-2 w-full rounded-lg border px-2 py-1 font-mono text-[10px] leading-relaxed">
                        {metaLine}
                      </code>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <EditorSheet
        open={editing !== null}
        onClose={closeEditor}
        // While the expanded prompt editor is stacked on top, Escape/backdrop
        // must only close that — not both sheets at once.
        dismissable={!promptExpanded}
        title={t('procedures.editTitle')}
        footer={
          <div className="flex justify-end">
            <Button size="sm" onClick={closeEditor}>
              {t('procedures.done')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <div className="relative">
              {/* A project-bound procedure wears the project's emoji — the
                  button shows it and disables (the procedure's own icon
                  returns when the binding is removed). */}
              <button
                type="button"
                disabled={draftProject !== undefined}
                onClick={() => setEmojiOpen((v) => !v)}
                aria-label={draftProject ? t('procedures.projectIcon') : t('procedures.pickIcon')}
                title={draftProject ? t('procedures.projectIcon') : t('procedures.pickIcon')}
                className={cn(
                  'bg-bg border-border flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-lg',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
                  'disabled:cursor-default'
                )}
              >
                {draftProject ? draftProject.icon || '📁' : draftIcon || DEFAULT_PROCEDURE_ICON}
              </button>
              {emojiOpen && (
                <EmojiPicker
                  onPick={(emoji) => {
                    setTouched(true)
                    setDraftIcon(emoji)
                    setEmojiOpen(false)
                  }}
                  onClose={() => setEmojiOpen(false)}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <input
                value={draftTitle}
                onChange={(e) => {
                  setTouched(true)
                  setDraftTitle(e.target.value)
                }}
                placeholder={t('procedures.titlePlaceholder')}
                aria-required
                aria-invalid={touched && draftTitle.trim() === ''}
                className={cn(
                  fieldClass,
                  touched && draftTitle.trim() === '' && 'border-rose-500/70'
                )}
              />
              {touched && draftTitle.trim() === '' && (
                <p className="text-xs text-rose-500">{t('procedures.titleRequired')}</p>
              )}
            </div>
          </div>
          <span className="text-muted text-xs font-medium">{t('procedures.project')}</span>
          {/* Bind/unbind a project: the run gets the project's context and its
              conversation registers under the project. The mobile chat menu's
              chip row — the whole list on one x-scrolling line. */}
          <ChipRow
            ariaLabel={t('procedures.project')}
            truncateLabels
            chips={projectChips}
            value={draftProjectId}
            onChange={(id) => {
              setTouched(true)
              setDraftProjectId(id)
              setEmojiOpen(false)
            }}
          />
          <span className="text-muted text-xs font-medium">{t('procedures.prompt')}</span>
          {/* The prompt, in the same CodeMirror editor the expanded sheet
              runs — editable in place, over the same draft state. Fixed
              height, filled or empty: the dialog never reflows as the prompt
              grows, so a long prompt scrolls inside the block and the button
              below opens the full-height sheet to write comfortably.
              background="field" sits the block in the same bg-bg well the
              Select and input fields use. */}
          <div className="border-border h-40 w-full overflow-hidden rounded-lg border">
            <CodeEditor
              value={draftPrompt}
              language="markdown"
              background="field"
              isDark={isDark}
              onChange={(value) => {
                setTouched(true)
                setDraftPrompt(value)
              }}
              placeholder={t('procedures.promptPlaceholder')}
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
            {draftPrompt.trim() ? t('procedures.editPrompt') : t('procedures.addPrompt')}
          </Button>

          {/* Files: copied INTO the workspace on attach, exactly like a
              project's, so the procedure can never dangle on a moved
              original. Every run gets the list, never the content. */}
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-medium">
              {t('procedures.files', { count: draftFiles.length })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={demoAction}
              className="flex items-center gap-1"
            >
              <Add01Icon size={13} />
              <span>{t('procedures.addFiles')}</span>
            </Button>
          </div>
          {draftFiles.length > 0 && (
            <ul className={cn(fileCardClass, 'flex max-h-36 flex-col gap-0.5 overflow-y-auto')}>
              {draftFiles.map((file) => {
                const { base, ext } = splitFileName(file.name)
                return (
                  <li key={file.path} className={cn('group shrink-0', fileRowClass)}>
                    {/* dir=ltr pins filename order (and the pinned extension)
                        even in the RTL locale — paths are LTR text. */}
                    <span
                      title={file.path}
                      dir="ltr"
                      className="text-fg flex min-w-0 flex-1 items-baseline text-xs"
                    >
                      <span className="truncate">{base}</span>
                      {ext && <span className="shrink-0">{ext}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(file.path)}
                      aria-label={t('procedures.removeFile')}
                      title={t('procedures.removeFile')}
                      className="text-muted flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md hover:text-rose-500"
                    >
                      <Delete02Icon size={13} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Working folders: references, never copies. Every run gets a fresh
              listing of each one, through the same channel chat's own folder
              picker uses. */}
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs font-medium">
              {t('procedures.folders', { count: draftDirs.length })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={demoAction}
              className="flex items-center gap-1"
            >
              <Add01Icon size={13} />
              <span>{t('procedures.addFolders')}</span>
            </Button>
          </div>
          {draftDirs.length > 0 && (
            <ul className={cn(fileCardClass, 'flex max-h-40 flex-col gap-1.5 overflow-y-auto')}>
              {draftDirs.map((dir) => (
                <li key={dir} dir="ltr" className="flex flex-col gap-0.5 px-1.5 py-0.5">
                  <span title={dir} className="text-fg truncate text-xs">
                    {folderBaseName(dir)}
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
                      onClick={() => removeDir(dir)}
                      aria-label={t('procedures.removeFolder')}
                      title={t('procedures.removeFolder')}
                      className="text-muted flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md hover:text-rose-500"
                    >
                      <Delete02Icon size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="text-muted text-xs">{t('procedures.autosaveHint')}</p>
        </div>
      </EditorSheet>

      {/* The expanded prompt editor — the file viewers' own expand sheet, over
          the same draft state, so what is typed here autosaves on the editor's
          debounce and the preview above reflects it the moment this closes.
          The sheet, not a centered dialog: the form behind it is a sheet too,
          so expanding the prompt widens the same surface instead of stacking a
          second shape on top of it. */}
      <ExpandedSheet
        open={editing !== null && promptExpanded}
        onClose={() => setPromptExpanded(false)}
        title={draftPrompt.trim() ? t('procedures.editPrompt') : t('procedures.addPrompt')}
      >
        <CodeEditor
          value={draftPrompt}
          language="markdown"
          background="field"
          isDark={isDark}
          onChange={(value) => {
            setTouched(true)
            setDraftPrompt(value)
          }}
          placeholder={t('procedures.promptPlaceholder')}
          className="h-full overflow-auto"
          spellcheck
        />
      </ExpandedSheet>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('procedures.deleteTitle')}
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              {t('procedures.deleteCancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              className="flex-1 border border-transparent bg-red-600 text-white shadow-none hover:bg-red-700"
            >
              {t('procedures.deleteConfirm')}
            </Button>
          </div>
        }
      >
        <p className="text-muted">
          {t('procedures.deleteWarning', {
            name: deleteTarget?.title.trim() || t('procedures.untitled')
          })}
        </p>
      </Modal>
    </>
  )
}
