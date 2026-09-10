'use client'

import { WORKSPACE_ROOT } from '@/playground/data/identity'
import { useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { File01Icon, Folder01Icon, FolderOpenIcon, LinkSquare02Icon } from 'hugeicons-react'

export type PathCardProps = {
  path: string
  kind?: 'folder' | 'file'
}

export type PathInfo = { exists: boolean; isDirectory: boolean }

/** The demo machine's home directory — the workspace lives at <home>/.wfc/workspace. */
const HOME_DIR = WORKSPACE_ROOT.replace(/\/\.wfc\/workspace\/?$/, '')

/**
 * The locations this demo machine actually has: the workspace plus the few
 * folders the conversations point at. A path outside them is "unavailable",
 * which is what makes the card's gone-path state reachable in the demo.
 */
const KNOWN_ROOTS = [
  WORKSPACE_ROOT,
  `${HOME_DIR}/dev/wolffish-cloud`,
  `${HOME_DIR}/Desktop`,
  `${HOME_DIR}/Downloads`
]

/**
 * `~` expanded, trailing slashes dropped — the desktop's canonicalPath, plus
 * the workspace prefix for a relative path (which is always workspace-relative
 * in a conversation).
 */
export function canonicalPath(p: string): string {
  const s = p.trim().replace(/\/+$/, '')
  if (s === '~') return HOME_DIR
  if (s.startsWith('~/')) return `${HOME_DIR}/${s.slice(2)}`
  if (!s.startsWith('/')) return `${WORKSPACE_ROOT}/${s.replace(/^\.\//, '')}`
  return s
}

/**
 * The desktop stats the path on the device; here the answer comes from the
 * demo's known locations. A path with no file extension reads as a folder,
 * which is how every path the demo conversations show is shaped.
 */
export function pathInfo(path: string): PathInfo {
  const full = canonicalPath(path)
  const exists = KNOWN_ROOTS.some((root) => full === root || full.startsWith(`${root}/`))
  const base = full.split('/').pop() ?? ''
  return { exists, isDirectory: !/\.[a-z0-9]{1,8}$/i.test(base) }
}

/**
 * Renders a filesystem location the model explicitly pushed via the
 * `show_path` tool (its `[wolffish-path:]` marker) as a card — folder name
 * (or file name) + the path in a code block + a button to open it in the OS
 * file manager. A folder opens directly; a file is revealed in its parent
 * folder (selected), like "Reveal in Finder". Nothing is ever parsed out of
 * prose — no marker, no card.
 *
 * The path is still verified against the machine: since the card records a
 * real tool call it never vanishes, but when the path is not there (deleted
 * since the turn ran, e.g. in a resumed conversation) the button is disabled
 * and the subtitle becomes an "unavailable" note. `kind` is the path's type
 * at call time (from the marker) so a gone path keeps the right icon/labels.
 */
export function PathCard({ path, kind }: PathCardProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const demoAction = useDemoAction()
  const info = pathInfo(path)

  const exists = info.exists
  // The live check is the truth while the path exists; once gone, fall back to
  // the call-time kind from the marker.
  const isDir = exists ? info.isDirectory : kind === 'folder'
  const name = displayName(path, isDir)
  const actionLabel = isDir ? t('chat.pathCard.open') : t('chat.pathCard.reveal')
  const subtitle = exists
    ? isDir
      ? t('chat.pathCard.folder')
      : t('chat.pathCard.file')
    : kind === 'folder'
      ? t('chat.pathCard.unavailableFolder')
      : kind === 'file'
        ? t('chat.pathCard.unavailableFile')
        : t('chat.pathCard.unavailablePath')

  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full flex-col gap-2 self-start',
        'rounded-2xl border px-4 py-3'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            exists ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted'
          )}
        >
          {isDir ? <Folder01Icon size={20} /> : <File01Icon size={20} />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-fg truncate text-sm font-medium" title={name}>
            {name}
          </span>
          <span className="text-muted text-xs">{subtitle}</span>
        </div>
        <button
          type="button"
          onClick={demoAction}
          disabled={!exists}
          title={exists ? actionLabel : subtitle}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
            'focus-visible:ring-2 focus-visible:ring-accent',
            exists
              ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
              : 'bg-muted/10 text-muted cursor-not-allowed'
          )}
        >
          {isDir ? <FolderOpenIcon size={14} /> : <LinkSquare02Icon size={14} />}
          {actionLabel}
        </button>
      </div>
      <code
        dir="ltr"
        className={cn(
          'border-border/60 bg-muted/10 text-muted block rounded-lg border px-3 py-2',
          'text-start font-mono text-xs break-all'
        )}
        title={path}
      >
        {path}
      </code>
    </div>
  )
}

function displayName(path: string, isDir: boolean): string {
  const trimmed = isDir ? path.replace(/\/+$/, '') : path
  return trimmed.split('/').pop() || trimmed
}
