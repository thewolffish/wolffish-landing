'use client'

import { Badge } from '@/playground/components/core/Badge'
import { CodeEditor, type CodeLanguage } from '@/playground/components/core/CodeEditor'
import { CopyButton } from '@/playground/components/core/CopyButton'
import { Markdown } from '@/playground/components/core/Markdown'
import { Modal } from '@/playground/components/core/Modal'
import { Button } from '@/playground/components/core/Button'
import { AudioPlayer } from '@/playground/components/common/audio-player/AudioPlayer'
import { DocxViewer } from '@/playground/components/common/docx-viewer/DocxViewer'
import { ImageViewer } from '@/playground/components/common/image-viewer/ImageViewer'
import { PdfViewer } from '@/playground/components/common/pdf-viewer/PdfViewer'
import { SpreadsheetViewer } from '@/playground/components/common/spreadsheet-viewer/SpreadsheetViewer'
import { VideoPlayer } from '@/playground/components/common/video-player/VideoPlayer'
import { useToast } from '@/playground/components/core/toast/useToast'
import { RTL_LOCALES, useLocale, useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { fileAvailable, getInlineFile, mimeForPath, useFileText } from '@/playground/lib/files'
import { pageTopPadding } from '@/playground/lib/platform'
import { conversationFilePaths } from '@/playground/data/conversations'
import { NOW } from '@/playground/data/clock'
import { AGENTS_MD, SOUL_MD, USER_MD } from '@/playground/data/identityDocs'
import { HEARTBEAT_MD } from '@/playground/data/automations'
import { buildWorkspaceTree, WORKSPACE_FILES } from '@/playground/data/workspace'
import type { ViewerTreeNode } from '@/playground/data/types'
import { useDemo, useTheme } from '@/playground/providers/PlaygroundProvider'
import {
  ArrowDown01Icon,
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  Download01Icon,
  File02Icon,
  FloppyDiskIcon,
  Folder01Icon,
  FolderOpenIcon,
  ArrowTurnBackwardIcon,
  Refresh01Icon
} from 'hugeicons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type ViewMode = 'edit' | 'preview'
type MediaType = 'image' | 'video' | 'audio' | 'pdf' | 'docx' | 'spreadsheet'
type IdentityDoc = 'soul' | 'user' | 'agents'

const HEARTBEAT_PATH = 'brain/brainstem/heartbeat.md'

/** The three identity documents, by the path the tree shows them at. */
const IDENTITY_PATHS: Record<string, IdentityDoc> = {
  'brain/identity/soul.md': 'soul',
  'brain/identity/user.md': 'user',
  'brain/prefrontal/agents.md': 'agents'
}

/**
 * The files that ship with a bundled default — the desktop asks main
 * (`viewer:hasDefault` / `viewer:readDefault`); here the default IS the
 * fixture the workspace was seeded from.
 */
const BUNDLED_DEFAULTS: Record<string, string> = {
  'brain/identity/soul.md': SOUL_MD,
  'brain/identity/user.md': USER_MD,
  'brain/prefrontal/agents.md': AGENTS_MD,
  [HEARTBEAT_PATH]: HEARTBEAT_MD
}

/**
 * The file header's labelled actions — reset, reveal, download, resync. One
 * constant because they are one row and must stay one shape. Below the
 * desktop breakpoint the words drop (each `<span>` carries `max-sm:hidden`)
 * and what is left is the icon in a 36px-square target: four labels plus the
 * copy button and the mode toggle are wider than a phone by a long way, and
 * the label survives as the button's aria-label either way.
 */
const headerActionClass = cn(
  'inline-flex items-center gap-1 rounded-md text-xs cursor-pointer',
  'text-muted hover:text-fg px-1.5 py-0.5',
  'max-sm:h-9 max-sm:w-9 max-sm:justify-center max-sm:gap-0 max-sm:px-0',
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  'disabled:cursor-not-allowed disabled:opacity-40'
)

function isReadOnlyPath(relativePath: string): boolean {
  if (relativePath.startsWith('logs/')) return true
  if (relativePath.endsWith('.log.md')) return true
  if (relativePath.startsWith('brain/conversations/')) return true
  if (relativePath.startsWith('brain/hippocampus/episodes/')) return true
  if (relativePath.startsWith('brain/motor/tasks/')) return true
  if (relativePath.startsWith('brain/prefrontal/.debug/')) return true
  if (relativePath === 'brain/prefrontal/agents.core.md') return true
  if (relativePath === HEARTBEAT_PATH) return true
  if (relativePath.startsWith('brain/basalganglia/')) return true
  const cereMatch = relativePath.match(/^brain\/cerebellum\/([^/]+)/)
  if (cereMatch && cereMatch[1].startsWith('.')) return true
  if (relativePath.startsWith('screenshots/')) return true
  if (relativePath.startsWith('speech/')) return true
  if (relativePath.startsWith('voice/')) return true
  if (relativePath.startsWith('files/')) return true
  return false
}

function prettyJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}

function languageFor(name: string): CodeLanguage | null {
  if (name.endsWith('.json')) return 'json'
  if (name.endsWith('.md') || name.endsWith('.mdx')) return 'markdown'
  if (
    name.endsWith('.js') ||
    name.endsWith('.mjs') ||
    name.endsWith('.cjs') ||
    name.endsWith('.jsx')
  )
    return 'javascript'
  if (
    name.endsWith('.ts') ||
    name.endsWith('.tsx') ||
    name.endsWith('.mts') ||
    name.endsWith('.cts')
  )
    return 'typescript'
  if (name.endsWith('.txt') || name.endsWith('.log')) return 'markdown'
  // Delimited text the workspace carries as real content (a project's
  // endpoints.csv, a conversation's export) opens as text rather than through
  // the spreadsheet viewer — plain-text highlighting, same as .txt/.log.
  if (name.endsWith('.csv') || name.endsWith('.tsv')) return 'markdown'
  if (name.endsWith('.css') || name.endsWith('.scss') || name.endsWith('.less')) return 'css'
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'html'
  if (name.endsWith('.xml') || name.endsWith('.svg')) return 'xml'
  if (name.endsWith('.yaml') || name.endsWith('.yml')) return 'yaml'
  if (name.endsWith('.sh') || name.endsWith('.bash') || name.endsWith('.zsh')) return 'shell'
  if (name.endsWith('.py')) return 'python'
  if (name.endsWith('.sql')) return 'sql'
  if (name.endsWith('.graphql') || name.endsWith('.gql')) return 'graphql'
  return null
}

const MEDIA_EXTENSIONS: Record<string, MediaType> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  ico: 'image',
  heic: 'image',
  mp4: 'video',
  // webm → audio: wolffish's webm files are voice/TTS clips, shown with the
  // audio player (consistent with the chat + upload classifiers).
  webm: 'audio',
  mov: 'video',
  avi: 'video',
  mkv: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  aac: 'audio',
  m4a: 'audio',
  flac: 'audio',
  pdf: 'pdf',
  docx: 'docx',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  csv: 'spreadsheet'
}

function detectMediaType(name: string): MediaType | null {
  const ext = name.split('.').pop()?.toLowerCase()
  if (!ext) return null
  return MEDIA_EXTENSIONS[ext] ?? null
}

function stripHtmlComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '')
}

function splitFilename(name: string): { stem: string; ext: string } {
  if (name.endsWith('.log.md')) return { stem: name.slice(0, -'.log.md'.length), ext: '.log.md' }
  const lastDot = name.lastIndexOf('.')
  if (lastDot <= 0) return { stem: name, ext: '' }
  return { stem: name.slice(0, lastDot), ext: name.slice(lastDot) }
}

const FROM_NOW_RANGES: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60]
]

function formatFromNow(mtimeMs: number, now: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const diff = Math.max(0, (now - mtimeMs) / 1000)
  for (const [unit, seconds] of FROM_NOW_RANGES) {
    if (diff >= seconds) return rtf.format(-Math.floor(diff / seconds), unit)
  }
  return rtf.format(-Math.floor(diff), 'second')
}

/** Stable 32-bit hash — the seed under both the demo mtimes and file sizes. */
function hashPath(path: string): number {
  let h = 2166136261
  for (let i = 0; i < path.length; i++) {
    h ^= path.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/**
 * The desktop stats the file. There are no inodes here, so each path gets one
 * stable moment inside the last three weeks — stable being the point: the
 * header must not report a different "modified" time every time a file is
 * reopened.
 */
function mtimeFor(path: string): number {
  return NOW - (5 * 60_000 + (hashPath(path) % (21 * 86_400_000)))
}

/**
 * Size for the file header and the media cards. Text the workspace actually
 * carries is measured; a binary resolves to the published sample for its
 * type, whose real length says nothing about the file it stands in for — so
 * those get one stable, plausible figure per path instead.
 */
function sizeBytesFor(path: string, content: string | null): number {
  if (content !== null) return new TextEncoder().encode(content).length
  const h = hashPath(path)
  switch (detectMediaType(path)) {
    case 'video':
      return 6_000_000 + (h % 24_000_000)
    case 'audio':
      return 300_000 + (h % 4_000_000)
    case 'image':
      return 80_000 + (h % 900_000)
    case 'pdf':
      return 120_000 + (h % 1_800_000)
    case 'docx':
      return 20_000 + (h % 400_000)
    case 'spreadsheet':
      return 15_000 + (h % 300_000)
    default:
      return 1_000 + (h % 60_000)
  }
}

export function ViewerPage(): React.JSX.Element {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const { locale } = useLocale()
  const {
    goTo,
    projects,
    identityDocs,
    setIdentityDoc,
    heartbeatMd,
    setHeartbeatMd,
    config,
    demoAction
  } = useDemo()
  const toast = useToast()
  const isRtl = RTL_LOCALES.has(locale)
  const BackIcon = isRtl ? ArrowRight02Icon : ArrowLeft02Icon

  /**
   * The workspace as the viewer walks it: every registered file plus every
   * path the conversations and the projects reference. The desktop reads this
   * off disk; here it is built from the demo data, so there is no cold-load
   * skeleton — the tree is ready on the first paint.
   */
  const tree = useMemo<ViewerTreeNode[]>(
    () =>
      buildWorkspaceTree([
        ...conversationFilePaths(),
        ...projects.flatMap((p) => p.files.map((f) => f.path))
      ]),
    [projects]
  )

  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  /** Files saved in this session that are not owned by the provider. */
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({})
  /** The unsaved buffer, held with the path it belongs to so a tree click
      never carries one file's draft into another's editor. */
  const [draft, setDraft] = useState<{ path: string; text: string } | null>(null)
  /** The view toggle, per file: the default follows the file's type, and an
      explicit choice sticks only while that file is open. */
  const [modeChoice, setModeChoice] = useState<{ path: string; mode: ViewMode } | null>(null)
  const [resetTarget, setResetTarget] = useState<string | null>(null)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  /**
   * What the workspace holds for a path, or null when nothing does — the
   * three identity documents and heartbeat.md read from the live app state
   * (an edit here and an edit on the Customization page are edits to the same
   * document), config.json is the running configuration, and everything else
   * is the fixture text or the content a conversation carries inline.
   */
  const storedContent = useCallback(
    (path: string): string | null => {
      const edited = localEdits[path]
      if (edited !== undefined) return edited
      const doc = IDENTITY_PATHS[path]
      if (doc) return identityDocs[doc]
      if (path === HEARTBEAT_PATH) return heartbeatMd
      if (path === 'config.json') return JSON.stringify(config, null, 2)
      return WORKSPACE_FILES[path] ?? getInlineFile(path)
    },
    [localEdits, identityDocs, heartbeatMd, config]
  )

  const stored = selectedPath ? storedContent(selectedPath) : null
  // Text the workspace carries wins over the type's media viewer: a .csv with
  // real rows in it is a file to read, not a workbook to render.
  const mediaType = selectedPath && stored === null ? detectMediaType(selectedPath) : null
  // Only a text file with nothing stored needs the published sample fetched.
  const fetchPath = selectedPath && !mediaType && stored === null ? selectedPath : null
  const { text: fetched, error: fetchError } = useFileText(fetchPath)

  const originalContent = stored ?? fetched ?? ''
  const editorContent = draft?.path === selectedPath ? draft.text : originalContent
  const isDirty = editorContent !== originalContent

  const language = selectedPath ? languageFor(selectedPath) : null
  const readOnly = selectedPath ? isReadOnlyPath(selectedPath) : false
  const isMarkdown = language === 'markdown'
  const fileName = selectedPath ? (selectedPath.split('/').pop() ?? selectedPath) : null
  const hasContent = language || mediaType
  const viewMode: ViewMode =
    modeChoice?.path === selectedPath
      ? modeChoice.mode
      : mediaType || readOnly
        ? 'preview'
        : 'edit'
  // The desktop surfaces the read error main sent back; the only failure that
  // exists here is a sample that would not load for a text file.
  const fileError =
    selectedPath && !mediaType && stored === null && fetchError
      ? t('workspace.unsupported')
      : null
  const defaultText = selectedPath ? BUNDLED_DEFAULTS[selectedPath] : undefined
  const hasDefault = defaultText !== undefined

  const handleSelectFile = useCallback(
    (relativePath: string) => {
      if (relativePath === selectedPath) return
      setSelectedPath(relativePath)
    },
    [selectedPath]
  )

  const setEditorContent = useCallback(
    (value: string) => {
      if (!selectedPath) return
      setDraft({ path: selectedPath, text: value })
    },
    [selectedPath]
  )

  /**
   * Write the buffer back to wherever the file lives: the identity documents
   * and heartbeat.md into the app state that every other page reads, anything
   * else into this session's own copy. No disk, so no failure path — the
   * toast the desktop shows on success is the whole outcome.
   */
  const writeFile = useCallback(
    (path: string, content: string) => {
      const doc = IDENTITY_PATHS[path]
      if (doc) setIdentityDoc(doc, content)
      else if (path === HEARTBEAT_PATH) setHeartbeatMd(content)
      else setLocalEdits((prev) => ({ ...prev, [path]: content }))
      setDraft((prev) => (prev?.path === path ? null : prev))
      toast.show({ tone: 'success', message: t('workspace.saved') })
    },
    [setIdentityDoc, setHeartbeatMd, t, toast]
  )

  const handleSave = useCallback((): void => {
    if (!selectedPath || !isDirty) return
    writeFile(selectedPath, editorContent)
  }, [editorContent, isDirty, selectedPath, writeFile])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  /** Put the bundled text back, then close the confirmation. */
  const handleReset = useCallback((): void => {
    const path = resetTarget
    const bundled = path ? BUNDLED_DEFAULTS[path] : undefined
    if (path && bundled !== undefined) writeFile(path, bundled)
    setResetTarget(null)
  }, [resetTarget, writeFile])

  return (
    <main className={cn('bg-bg flex h-full w-full flex-col', pageTopPadding)}>
      <header className="border-border flex items-center justify-between gap-4 border-b px-4 py-3">
        <button
          type="button"
          onClick={() => goTo('chat')}
          aria-label={t('common.back')}
          className={cn(
            'text-muted hover:text-fg flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-sm',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
          )}
        >
          <BackIcon size={16} />
          <span>{t('common.back')}</span>
        </button>
        {/* Phone only. The tree and the file are one pane below the desktop
            breakpoint, so opening a file replaces the list — this is the way
            back to it. On the desktop both panes are on screen at once and
            the button would mean nothing, so it isn't there. */}
        {selectedPath && (
          <button
            type="button"
            onClick={() => setSelectedPath(null)}
            aria-label={t('workspace.title')}
            className={cn(
              'text-muted hover:text-fg flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-sm sm:hidden',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
            )}
          >
            <Folder01Icon size={16} />
            <span>{t('workspace.title')}</span>
          </button>
        )}
      </header>

      <div dir="ltr" className="flex min-h-0 flex-1">
        {/* Two panes side by side on the desktop; on a phone there is only
            room for one, so the tree IS the page until a file is picked, and
            the file takes the whole width once it is — with the header's
            phone-only Workspace button to walk back to the list. */}
        <aside
          className={cn(
            'border-border overflow-y-auto p-3 sm:w-64 sm:shrink-0 sm:border-e',
            selectedPath ? 'max-sm:hidden' : 'max-sm:w-full'
          )}
        >
          {tree.length > 0 ? (
            <ViewerTree nodes={tree} selectedPath={selectedPath} onSelectFile={handleSelectFile} />
          ) : (
            <p className="text-muted px-2 py-3 text-xs">{t('workspace.empty')}</p>
          )}
        </aside>

        <section
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
            !selectedPath && 'max-sm:hidden'
          )}
        >
          {selectedPath && hasContent ? (
            <>
              <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 max-sm:px-3">
                <div className="flex min-w-0 flex-col">
                  <div className="flex min-w-0 items-baseline gap-1.5">
                    <span className="text-fg truncate text-sm font-medium" title={selectedPath}>
                      {fileName}
                    </span>
                    <span className="text-muted shrink-0 text-xs" aria-hidden>
                      ·
                    </span>
                    <span className="text-muted shrink-0 truncate text-xs">
                      {formatFromNow(mtimeFor(selectedPath), now, locale)}
                    </span>
                  </div>
                  <span className="text-muted truncate text-xs" title={selectedPath}>
                    {selectedPath}
                  </span>
                </div>
                {/* Four labelled actions, a copy button and the mode toggle
                    are far wider than a phone. Below the desktop breakpoint
                    the words drop and each action becomes its icon in a
                    36px-square target — the labels survive as title/aria. */}
                <div className="flex shrink-0 items-center gap-2 max-sm:gap-1">
                  {!readOnly && !mediaType && (
                    <IconButton
                      label={t('workspace.save')}
                      disabled={!isDirty}
                      onClick={handleSave}
                    >
                      <FloppyDiskIcon size={16} />
                    </IconButton>
                  )}
                  {(readOnly || mediaType) && (
                    <Badge variant="default" size="md">
                      {t('workspace.readOnly')}
                    </Badge>
                  )}
                  {/* Only the documents that ship with a bundled copy can be
                      put back — everything else in the workspace was written
                      here and has nothing to be restored to. */}
                  {hasDefault && (
                    <button
                      type="button"
                      onClick={() => setResetTarget(selectedPath)}
                      disabled={originalContent === defaultText}
                      aria-label={t('workspace.reset')}
                      title={t('workspace.reset')}
                      className={headerActionClass}
                    >
                      <ArrowTurnBackwardIcon size={14} />
                      <span className="max-sm:hidden">{t('workspace.reset')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={demoAction}
                    aria-label={t('workspace.reveal')}
                    title={t('workspace.reveal')}
                    className={headerActionClass}
                  >
                    <FolderOpenIcon size={14} />
                    <span className="max-sm:hidden">{t('workspace.reveal')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={demoAction}
                    aria-label={t('workspace.download')}
                    title={t('workspace.download')}
                    className={headerActionClass}
                  >
                    <Download01Icon size={14} />
                    <span className="max-sm:hidden">{t('workspace.download')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={demoAction}
                    aria-label={t('workspace.resync')}
                    title={t('workspace.resync')}
                    className={headerActionClass}
                  >
                    <Refresh01Icon size={14} />
                    <span className="max-sm:hidden">{t('workspace.resync')}</span>
                  </button>
                  {!mediaType && <CopyButton text={editorContent} variant="inline" />}
                  {!mediaType && (
                    <ViewModeToggle
                      value={viewMode}
                      onChange={(mode) =>
                        setModeChoice(selectedPath ? { path: selectedPath, mode } : null)
                      }
                      readOnly={readOnly}
                    />
                  )}
                </div>
              </div>
              {fileError && (
                <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-500">
                  {fileError}
                </div>
              )}
              <div className="flex min-h-0 flex-1">
                {mediaType ? (
                  <WorkspaceMediaViewer
                    relativePath={selectedPath}
                    fileName={fileName!}
                    mediaType={mediaType}
                  />
                ) : viewMode === 'preview' ? (
                  <div className="bg-surface text-fg min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-5 text-sm max-sm:px-4 max-sm:py-4">
                    {isMarkdown ? (
                      <Markdown content={stripHtmlComments(editorContent)} />
                    ) : (
                      <pre className="whitespace-pre-wrap wrap-break-word font-mono text-xs leading-relaxed">
                        {prettyJson(editorContent)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <CodeEditor
                    key={selectedPath}
                    value={editorContent}
                    language={language!}
                    isDark={isDark}
                    readOnly={readOnly}
                    onChange={setEditorContent}
                    className="h-full w-full"
                    // Prose only: squiggles on code/JSON would be noise.
                    spellcheck={!readOnly && language === 'markdown'}
                  />
                )}
              </div>
            </>
          ) : selectedPath && !hasContent ? (
            <EmptyState message={t('workspace.unsupported')} />
          ) : (
            <EmptyState message={t('workspace.pickFile')} />
          )}
        </section>
      </div>

      <Modal
        open={resetTarget !== null}
        onClose={() => setResetTarget(null)}
        title={t('workspace.resetTitle')}
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetTarget(null)}
              className="flex-1"
            >
              {t('workspace.resetCancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleReset} className="flex-1">
              {t('workspace.resetConfirm')}
            </Button>
          </div>
        }
      >
        <p className="text-muted">{t('workspace.resetWarning')}</p>
      </Modal>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Media viewer
// ---------------------------------------------------------------------------

/**
 * The desktop's viewer page carries its own image/video/audio/pdf/docx/xlsx
 * renderers. The replica hands each type to the same component the chat feed
 * uses, so a PDF opened from a conversation and the same PDF opened from the
 * tree are one viewer with one set of controls.
 */
function WorkspaceMediaViewer({
  relativePath,
  fileName,
  mediaType
}: {
  relativePath: string
  fileName: string
  mediaType: MediaType
}): React.JSX.Element {
  const mime = mimeForPath(fileName)
  const exists = fileAvailable(relativePath)
  const sizeBytes = sizeBytesFor(relativePath, getInlineFile(relativePath))
  switch (mediaType) {
    case 'image':
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <ImageViewer
            filePath={relativePath}
            fileExists={exists}
            mimeType={mime}
            fileName={fileName}
          />
        </div>
      )
    case 'video':
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <VideoPlayer
            filePath={relativePath}
            fileExists={exists}
            mimeType={mime}
            fileName={fileName}
          />
        </div>
      )
    case 'audio':
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <AudioPlayer
            filePath={relativePath}
            fileExists={exists}
            mimeType={mime}
            fileName={fileName}
            source="file"
          />
        </div>
      )
    case 'pdf':
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <PdfViewer
            filePath={relativePath}
            fileExists={exists}
            fileName={fileName}
            sizeBytes={sizeBytes}
          />
        </div>
      )
    case 'docx':
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
          <DocxViewer
            filePath={relativePath}
            fileExists={exists}
            fileName={fileName}
            sizeBytes={sizeBytes}
          />
        </div>
      )
    case 'spreadsheet':
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
          <SpreadsheetViewer
            filePath={relativePath}
            fileExists={exists}
            fileName={fileName}
            sizeBytes={sizeBytes}
          />
        </div>
      )
  }
}

// ---------------------------------------------------------------------------
// Shared UI pieces
// ---------------------------------------------------------------------------

function IconButton({
  label,
  disabled,
  onClick,
  children
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'text-muted hover:text-fg hover:bg-border/40 flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted'
      )}
    >
      {children}
    </button>
  )
}

function ViewModeToggle({
  value,
  onChange,
  readOnly = false
}: {
  value: ViewMode
  onChange: (next: ViewMode) => void
  readOnly?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const modes: { key: ViewMode; label: string }[] = [
    { key: 'edit', label: t('workspace.edit') },
    { key: 'preview', label: t('workspace.preview') }
  ]
  return (
    <div
      role="tablist"
      className="border-border bg-surface inline-flex items-center rounded-lg border p-0.5"
    >
      {modes.map((m) => {
        const active = m.key === value
        const disabled = readOnly && m.key === 'edit'
        return (
          <button
            key={m.key}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(m.key)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
              active ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg'
            )}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6 text-center">
      <p className="text-muted text-sm leading-relaxed">{message}</p>
    </div>
  )
}

function ViewerTree({
  nodes,
  selectedPath,
  onSelectFile
}: {
  nodes: ViewerTreeNode[]
  selectedPath: string | null
  onSelectFile: (path: string) => void
}): React.JSX.Element {
  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((node) => (
        <ViewerTreeNodeItem
          key={node.relativePath}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ))}
    </ul>
  )
}

function ViewerTreeNodeItem({
  node,
  depth,
  selectedPath,
  onSelectFile
}: {
  node: ViewerTreeNode
  depth: number
  selectedPath: string | null
  onSelectFile: (path: string) => void
}): React.JSX.Element {
  const containsSelected = useMemo(() => {
    if (!selectedPath) return false
    if (node.type === 'file') return false
    return selectedPath === node.relativePath || selectedPath.startsWith(node.relativePath + '/')
  }, [node, selectedPath])

  const [userOpen, setUserOpen] = useState<boolean | null>(null)
  const open = userOpen ?? (depth === 0 || containsSelected)

  const indent = { paddingInlineStart: `${depth * 12 + 8}px` }

  if (node.type === 'dir') {
    const Chevron = open ? ArrowDown01Icon : ArrowRight01Icon
    return (
      <li>
        <button
          type="button"
          onClick={() => setUserOpen(!open)}
          aria-expanded={open}
          style={indent}
          className={cn(
            'text-muted hover:text-fg hover:bg-border/40 flex w-full items-center gap-1.5 rounded-md py-1.5 pe-2 text-start text-sm cursor-pointer',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
          )}
        >
          <Chevron size={14} className="shrink-0" />
          <Folder01Icon size={14} className="shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {node.children.map((child) => (
              <ViewerTreeNodeItem
                key={child.relativePath}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
              />
            ))}
          </ul>
        )}
      </li>
    )
  }

  const isSelected = selectedPath === node.relativePath
  const { stem, ext } = splitFilename(node.name)
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelectFile(node.relativePath)}
        aria-current={isSelected ? 'true' : undefined}
        style={indent}
        title={node.name}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md py-1.5 pe-2 text-start text-sm cursor-pointer',
          'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          isSelected ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg hover:bg-border/40'
        )}
      >
        <span className="w-3.5 shrink-0" />
        <File02Icon size={14} className="shrink-0" />
        <span className="flex min-w-0 flex-1 items-baseline">
          <span className="truncate">{stem}</span>
          {ext && <span className="shrink-0">{ext}</span>}
        </span>
      </button>
    </li>
  )
}
