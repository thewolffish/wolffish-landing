/**
 * Delivery markers — the `[wolffish-output: <path> (<type>)]` lines send_file
 * writes into a tool result, and the `[wolffish-path: …]` lines show_path
 * writes. Ported from the desktop's Chat.tsx so the feed, the files sheet and
 * the admin transcript all read a conversation the same way.
 */
import {
  attachmentTypeFor,
  docMimeType,
  extToBucket,
  fileExt,
  normalizePath,
  type DeliveredBucket
} from '@/playground/lib/files'
import type {
  ChatMessage,
  MessageAttachment,
  MessageAttachmentType,
  Segment,
  ToolCallSegment,
  ToolResultSegment
} from '@/playground/data/types'

export const ASK_USER_TOOL = 'ask_user'

export const WORKFLOW_TOOL_NAMES: ReadonlySet<string> = new Set([
  'workflow_plan',
  'agent_spawn',
  'agent_send',
  'agents_await',
  'agent_cancel'
])

const DELIVERY_MARKER_ONLY_RE =
  /^\[wolffish-output:\s*[^\]]+?\s+\((?:image|audio|video|document|file|chart)\)\]$/
const PATH_MARKER_ONLY_RE = /^\[wolffish-path:\s*[^\]]+\]$/

const CODE_EXTS_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|java|kt|swift|c|cpp|h|hpp|cs|php|sh|bash|zsh|sql|json|yaml|yml|toml|ini|env|md|markdown|txt|html|htm|css|scss|xml|csv|tsv|log)$/i

const DOCUMENT_EXTS_RE =
  /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|csv|tsv|txt|md|markdown|html|htm|rtf|odt|ods|odp|json|xml|yaml|yml)$/i

export function isFileContentResult(call: ToolCallSegment, result?: ToolResultSegment): boolean {
  if (!result?.output || result.status !== 'success') return false
  const trimmed = result.output.trim()
  if (DELIVERY_MARKER_ONLY_RE.test(trimmed) || PATH_MARKER_ONLY_RE.test(trimmed)) return false
  const argsPath = typeof call.args?.path === 'string' ? call.args.path : null
  return argsPath != null && CODE_EXTS_RE.test(argsPath)
}

export function extractToolResultImage(result?: ToolResultSegment): string | null {
  if (!result?.output || result.status !== 'success') return null
  const marker = result.output.match(
    /^[ \t]*\[wolffish-output:[ \t]*([^\]\n]+?)[ \t]+\(image\)\][ \t]*$/m
  )
  return marker ? marker[1].trim() : null
}

const PAGE_CONTENT_TOOLS = new Set(['browser_page_content', 'ext_read_page', 'web_fetch'])

export function extractToolResultPage(
  call: ToolCallSegment,
  result?: ToolResultSegment
): { content: string; title: string | null; url: string | null; format: string } | null {
  if (!result?.output || result.status !== 'success') return null
  if (!PAGE_CONTENT_TOOLS.has(call.name)) return null
  const raw = result.output.trim()
  if (!raw) return null
  const argFormat = typeof call.args?.format === 'string' ? call.args.format : null
  const argUrl = typeof call.args?.url === 'string' ? call.args.url : null
  if (call.name === 'ext_read_page') {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.content === 'string') {
        return {
          content: parsed.content,
          title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : null,
          url: typeof parsed.url === 'string' && parsed.url.trim() ? parsed.url : null,
          format: argFormat ?? 'text'
        }
      }
    } catch {
      /* not JSON — fall through */
    }
  }
  const format = argFormat ?? (call.name === 'web_fetch' ? 'markdown' : 'text')
  let title: string | null = null
  if (format === 'html') {
    const tm = raw.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (tm) title = tm[1].trim()
  }
  return { content: raw, title, url: argUrl, format }
}

export function extractToolResultDocuments(
  result?: ToolResultSegment
): { path: string; size: number }[] | null {
  if (!result?.output || result.status !== 'success') return null
  const output = result.output.trim()
  const docs: { path: string; size: number }[] = []
  const seen = new Set<string>()
  const markerRegex = /^[ \t]*\[wolffish-output:[ \t]*([^\]\n]+?)[ \t]+\(document\)\][ \t]*$/gm
  let marker: RegExpExecArray | null
  while ((marker = markerRegex.exec(output)) !== null) {
    const markerPath = marker[1].trim()
    if (DOCUMENT_EXTS_RE.test(markerPath) && !seen.has(markerPath)) {
      seen.add(markerPath)
      docs.push({ path: markerPath, size: 0 })
    }
  }
  return docs.length > 0 ? docs : null
}

export function extractToolResultMedia(
  result?: ToolResultSegment
): { path: string; type: 'audio' | 'video' } | null {
  if (!result?.output || result.status !== 'success') return null
  const marker = result.output.match(
    /^[ \t]*\[wolffish-output:[ \t]*([^\]\n]+?)[ \t]+\((audio|video)\)\][ \t]*$/m
  )
  if (marker) return { path: marker[1].trim(), type: marker[2] as 'audio' | 'video' }
  return null
}

function extractMarkerPaths(result: ToolResultSegment | undefined, type: string): string[] {
  if (!result?.output || result.status !== 'success') return []
  const paths: string[] = []
  const seen = new Set<string>()
  const markerRegex = new RegExp(
    `^[ \\t]*\\[wolffish-output:[ \\t]*([^\\]\\n]+?)[ \\t]+\\(${type}\\)\\][ \\t]*$`,
    'gm'
  )
  let match: RegExpExecArray | null
  while ((match = markerRegex.exec(result.output)) !== null) {
    const p = match[1].trim()
    if (!seen.has(p)) {
      seen.add(p)
      paths.push(p)
    }
  }
  return paths
}

export function extractToolResultGenericFiles(result?: ToolResultSegment): string[] {
  return extractMarkerPaths(result, 'file')
}

export function extractToolResultCharts(result?: ToolResultSegment): string[] {
  return extractMarkerPaths(result, 'chart')
}

export function extractToolResultPaths(
  result?: ToolResultSegment
): { path: string; kind?: 'folder' | 'file' }[] {
  if (!result?.output || result.status !== 'success') return []
  const out: { path: string; kind?: 'folder' | 'file' }[] = []
  const seen = new Set<string>()
  const markerRegex =
    /^[ \t]*\[wolffish-path:[ \t]*([^\]\n]+?)(?:[ \t]+\((folder|file)\))?[ \t]*\][ \t]*$/gm
  let match: RegExpExecArray | null
  while ((match = markerRegex.exec(result.output)) !== null) {
    const p = match[1].trim()
    if (!seen.has(p)) {
      seen.add(p)
      out.push({ path: p, kind: match[2] as 'folder' | 'file' | undefined })
    }
  }
  return out
}

// ── The conversation's "log of files" (View Files sheet) ─────────────────

const FILE_PATH_ARG_KEYS = new Set([
  'path',
  'filepath',
  'file_path',
  'file',
  'output_path',
  'outputpath',
  'input_path',
  'inputpath',
  'dest',
  'destination',
  'dest_path',
  'save_path',
  'paths',
  'output',
  'url'
])

const CONTENT_READ_TOOLS = new Set([
  'file_read',
  'pdf_read',
  'pdf_info',
  'pdf_search',
  'archive_list',
  'skill_read_source'
])

function normalizeFilePathArg(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let s = raw.trim()
  if (s.length === 0 || s.length > 512 || /[\n\r\t]/.test(s)) return null
  if (s.startsWith('wolffish-media://')) return s.slice('wolffish-media://'.length)
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return null
  if (/[\s'"`$|&;<>(){}\[\]*?!]/.test(s)) return null
  s = normalizePath(s)
  if (s.startsWith('/') || s.startsWith('~') || /^[a-zA-Z]:/.test(s)) return null
  if (s.split(/[\\/]/).some((part) => part === '..')) return null
  if (!/\.[a-zA-Z][a-zA-Z0-9]{0,9}$/.test(s)) return null
  return s
}

function argFilePaths(args: Record<string, unknown> | undefined): string[] {
  if (!args) return []
  const out: string[] = []
  for (const [key, value] of Object.entries(args)) {
    if (!FILE_PATH_ARG_KEYS.has(key.toLowerCase())) continue
    const values = Array.isArray(value) ? value : [value]
    for (const v of values) {
      const p = normalizeFilePathArg(v)
      if (p) out.push(p)
    }
  }
  return out
}

export function collectText(segments: Segment[]): string {
  let out = ''
  for (const s of segments) {
    if (s.kind === 'text') out += s.delta
  }
  return out
}

function mediaRefsInText(segments: Segment[]): string[] {
  const text = collectText(segments)
  if (!text.includes('wolffish-media://')) return []
  const out: string[] = []
  for (const m of text.matchAll(/!\[[^\]\n]*\]\(wolffish-media:\/\/([^)\s]+)\)/g)) {
    let rel: string
    try {
      rel = decodeURIComponent(m[1])
    } catch {
      continue
    }
    rel = (rel.split('?')[0] ?? '').replace(/^\/+/, '')
    if (!rel) continue
    if (rel.split(/[\\/]/).some((part) => part === '..')) continue
    out.push(rel)
  }
  return out
}

export function fileToAttachment(
  filePath: string,
  bucket: DeliveredBucket,
  sizeBytes = 0
): MessageAttachment {
  const name = filePath.split('/').pop() ?? 'file'
  const ext = fileExt(name)
  const type: MessageAttachmentType =
    bucket === 'image'
      ? 'image'
      : bucket === 'audio'
        ? 'audio'
        : bucket === 'video'
          ? 'video'
          : ext === 'pdf'
            ? 'pdf'
            : 'other'
  return {
    type,
    filePath,
    originalName: name,
    mimeType: bucket === 'chart' ? 'application/json' : mimeForAttachment(type, ext),
    sizeBytes
  }
}

export function mimeForAttachment(type: MessageAttachmentType, ext: string): string {
  if (type === 'image') return `image/${ext === 'jpg' ? 'jpeg' : ext || 'png'}`
  if (type === 'audio') return `audio/${ext === 'mp3' ? 'mpeg' : ext || 'mpeg'}`
  if (type === 'video') return `video/${ext === 'mov' ? 'quicktime' : ext || 'mp4'}`
  if (type === 'pdf') return 'application/pdf'
  return docMimeType(ext)
}

/** Build a MessageAttachment for a workspace path — the shape user uploads carry. */
export function attachmentFor(filePath: string, sizeBytes = 0): MessageAttachment {
  const type = attachmentTypeFor(filePath)
  const name = filePath.split('/').pop() ?? 'file'
  return {
    type,
    filePath,
    originalName: name,
    mimeType: mimeForAttachment(type, fileExt(name)),
    sizeBytes
  }
}

export function deliveredFilesToAttachments(result: ToolResultSegment): MessageAttachment[] {
  const atts: MessageAttachment[] = []
  const imagePath = extractToolResultImage(result)
  if (imagePath) atts.push(fileToAttachment(normalizePath(imagePath), 'image'))
  const docs = extractToolResultDocuments(result)
  if (docs) for (const d of docs) atts.push(fileToAttachment(normalizePath(d.path), 'document', d.size))
  const media = extractToolResultMedia(result)
  if (media) atts.push(fileToAttachment(normalizePath(media.path), media.type))
  for (const p of extractToolResultGenericFiles(result))
    atts.push(fileToAttachment(normalizePath(p), 'file'))
  for (const p of extractToolResultCharts(result)) atts.push(fileToAttachment(normalizePath(p), 'chart'))
  return atts
}

/** The flat, ordered, de-duplicated list of files across the conversation. */
export function collectConversationFiles(messages: ChatMessage[]): MessageAttachment[] {
  const out: MessageAttachment[] = []
  const seen = new Set<string>()
  const push = (att: MessageAttachment): void => {
    const key = normalizePath(att.filePath)
    if (seen.has(key)) return
    seen.add(key)
    out.push(att)
  }

  for (const message of messages) {
    if (message.role === 'user') {
      for (const att of message.attachments ?? []) push(att)
      continue
    }
    const callById = new Map<string, ToolCallSegment>()
    for (const seg of message.segments) {
      if (seg.kind !== 'tool_call') continue
      callById.set(seg.toolCallId, seg)
      if (CONTENT_READ_TOOLS.has(seg.name)) continue
      for (const p of argFilePaths(seg.args)) push(fileToAttachment(p, extToBucket(p)))
    }
    for (const ref of mediaRefsInText(message.segments)) push(fileToAttachment(ref, 'image'))
    for (const seg of message.segments) {
      if (seg.kind !== 'tool_result' || seg.status !== 'success' || !seg.output) continue
      const call = callById.get(seg.toolCallId)
      if (call && (isFileContentResult(call, seg) || extractToolResultPage(call, seg))) continue
      if (call && WORKFLOW_TOOL_NAMES.has(call.name)) continue
      for (const att of deliveredFilesToAttachments(seg)) push(att)
    }
  }
  return out
}
