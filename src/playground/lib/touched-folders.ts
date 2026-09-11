import type { Segment } from '@/playground/data/types'

/**
 * The folders a conversation has changed files in — derived from the
 * persisted segment stream, never from live state, so the chips over the
 * transcript are the same while a turn streams, after it ends, and when the
 * conversation is reopened from history.
 *
 * A folder counts as touched when a file-changing tool call (file_edit,
 * file_write, file_patch) completed successfully inside it. The path comes
 * from the result's diff when the tool recorded one (already absolute —
 * the plugin resolved it against the working folder), and from the call's
 * own `path` argument otherwise. Failed and denied calls changed nothing
 * and are skipped.
 *
 * Resolving a relative `path` is the one place the replica does more than
 * the desktop's copy of this file. On the machine the plugin resolves the
 * path and hands back an absolute `diff.file`; a fixture written before
 * `meta` existed has only the path the author typed, and the demo corpus
 * types two kinds of them (workspace.ts draws the same line): a workspace
 * path rooted at `files/`, `uploads/`, `brain/`… belongs under
 * ~/.wfc/workspace, and anything else is a repo path under the working
 * folder — written whole ("apps/api/src/routes/sync.ts") even when the
 * working folder already ends in "apps/api", which is why the join drops
 * the overlap instead of doubling it.
 */

export type TouchedFolder = {
  /** Absolute directory path — what opens when the chip is clicked. */
  path: string
  /** Short display name: the directory relative to its working folder, or
   *  the folder's own name for the working folder root and outside paths. */
  label: string
  /** Distinct files changed under this folder, direct children only. */
  files: number
}

const FILE_CHANGING_TOOLS: ReadonlySet<string> = new Set(['file_edit', 'file_write', 'file_patch'])

/** ~/.wfc/workspace roots — the first segment that means "not in the repo". */
const WORKSPACE_ROOTS: ReadonlySet<string> = new Set([
  'brain',
  'files',
  'uploads',
  'screenshots',
  'speech',
  'voice',
  'extension'
])

const WORKSPACE_ROOT = '~/.wfc/workspace'

type SegmentMessage = { role: string; segments?: Segment[] }

const SEP_RE = /[\\/]+/

function normalize(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+$/, '')
}

function isAbsolute(p: string): boolean {
  return p.startsWith('/') || /^[a-zA-Z]:\//.test(p) || p.startsWith('~/')
}

function dirname(p: string): string {
  const idx = p.lastIndexOf('/')
  if (idx <= 0) return idx === 0 ? '/' : ''
  return p.slice(0, idx)
}

function basename(p: string): string {
  const parts = p.split(SEP_RE).filter(Boolean)
  return parts[parts.length - 1] ?? p
}

function joinPath(base: string, rel: string): string {
  const parts = `${normalize(base)}/${rel.replace(/\\/g, '/')}`.split('/')
  const out: string[] = []
  for (const part of parts) {
    if (part === '' && out.length > 0) continue
    if (part === '.') continue
    if (part === '..') {
      out.pop()
      continue
    }
    out.push(part)
  }
  return out.join('/') || '/'
}

/**
 * Join a repo-relative path to the working folder, dropping the leading
 * segments the folder already ends with: "apps/api" + "apps/api/src/x.ts"
 * is one "apps/api", not two.
 */
function joinRepoPath(folder: string, rel: string): string {
  const folderParts = normalize(folder).split('/').filter(Boolean)
  const relParts = rel.replace(/\\/g, '/').split('/').filter(Boolean)
  for (let overlap = Math.min(folderParts.length, relParts.length); overlap > 0; overlap--) {
    const tail = folderParts.slice(folderParts.length - overlap).join('/')
    if (tail === relParts.slice(0, overlap).join('/')) {
      return joinPath(folder, relParts.slice(overlap).join('/'))
    }
  }
  return joinPath(folder, rel)
}

/** The working folder that contains `dir`, longest match first. */
function containingFolder(dir: string, folders: string[]): string | null {
  let best: string | null = null
  for (const raw of folders) {
    const folder = normalize(raw)
    if (dir === folder || dir.startsWith(`${folder}/`)) {
      if (!best || folder.length > best.length) best = folder
    }
  }
  return best
}

function labelFor(dir: string, folders: string[]): string {
  const root = containingFolder(dir, folders)
  if (root) {
    const rel = dir.slice(root.length).replace(/^\//, '')
    return rel || basename(root)
  }
  return basename(dir)
}

/** The file each successful file-changing call touched, in stream order. */
export function collectChangedFiles(
  messages: SegmentMessage[],
  workingFolders: string[]
): string[] {
  const files: string[] = []
  for (const message of messages) {
    if (message.role !== 'assistant' || !message.segments) continue
    const results = new Map<string, Extract<Segment, { kind: 'tool_result' }>>()
    for (const seg of message.segments) {
      if (seg.kind === 'tool_result') results.set(seg.toolCallId, seg)
    }
    for (const seg of message.segments) {
      if (seg.kind !== 'tool_call' || !FILE_CHANGING_TOOLS.has(seg.name)) continue
      const result = results.get(seg.toolCallId)
      if (!result || result.status !== 'success') continue
      const fromDiff = result.meta?.diff?.file
      const raw =
        typeof fromDiff === 'string' && fromDiff
          ? fromDiff
          : typeof seg.args.path === 'string'
            ? seg.args.path
            : ''
      if (!raw) continue
      // A repo-relative path with no working folder cannot be resolved at
      // all — the desktop drops it rather than guessing, and so do we.
      const abs = isAbsolute(raw)
        ? normalize(raw)
        : WORKSPACE_ROOTS.has(raw.split('/')[0])
          ? joinPath(WORKSPACE_ROOT, raw)
          : workingFolders[0]
            ? joinRepoPath(workingFolders[0], raw)
            : ''
      if (abs) files.push(abs)
    }
  }
  return files
}

export function collectTouchedFolders(
  messages: SegmentMessage[],
  workingFolders: string[]
): TouchedFolder[] {
  const byDir = new Map<string, Set<string>>()
  for (const file of collectChangedFiles(messages, workingFolders)) {
    const dir = dirname(file)
    if (!dir) continue
    const set = byDir.get(dir) ?? new Set<string>()
    set.add(file)
    byDir.set(dir, set)
  }
  const out: TouchedFolder[] = []
  for (const [dir, set] of byDir) {
    out.push({ path: dir, label: labelFor(dir, workingFolders), files: set.size })
  }
  return out
}
