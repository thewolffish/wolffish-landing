/**
 * Where the playground's file bytes come from.
 *
 * Demo conversations keep the desktop's workspace-relative paths
 * ("uploads/conv-…/sprint-42.csv", "files/reports/velocity.pdf"). Text-ish
 * files the agent "wrote" (markdown, csv, json, chart specs, code) carry their
 * real content inline on the conversation (`files`), so what you read is the
 * work the conversation describes. Binary types (pdf, xlsx, docx, pptx, images,
 * audio, video) resolve to the published sample for their extension — the same
 * set the mobile app's demo mode serves — through the same-origin proxy at
 * /api/playground/sample/<name>. The download is keyed by the original path,
 * so every viewer classifies and labels the file exactly as it would a real one.
 */
import { useEffect, useMemo, useState } from 'react'

export const SAMPLE_PROXY_BASE = '/api/playground/sample'
export const SAMPLE_STEM = 'wolffish-sample'

const SAMPLE_EXTENSIONS = new Set<string>([
  'aac', 'avi', 'avif', 'bash', 'bat', 'bmp', 'c', 'cjs', 'clj', 'cmd', 'conf', 'cpp', 'cs', 'css',
  'csv', 'dart', 'doc', 'dockerfile', 'docx', 'env', 'erl', 'ex', 'exs', 'fish', 'flac', 'flv',
  'gif', 'go', 'gql', 'graphql', 'groovy', 'h', 'heic', 'heif', 'hpp', 'hs', 'htm', 'html', 'ico',
  'ini', 'java', 'jpeg', 'jpg', 'js', 'json', 'jsx', 'kt', 'kts', 'less', 'log', 'lua', 'm4a',
  'm4v', 'makefile', 'markdown', 'md', 'mdx', 'mjs', 'mkv', 'ml', 'mov', 'mp3', 'mp4', 'odp',
  'ods', 'odt', 'oga', 'ogg', 'opus', 'pdf', 'php', 'pl', 'png', 'ppt', 'pptx', 'proto', 'ps1',
  'py', 'r', 'rb', 'rs', 'rtf', 'sass', 'scala', 'scss', 'sh', 'sql', 'svelte', 'svg', 'swift',
  'tiff', 'toml', 'ts', 'tsv', 'tsx', 'txt', 'vue', 'wav', 'webm', 'webp', 'wma', 'wmv', 'xls',
  'xlsx', 'xml', 'yaml', 'yml', 'zig', 'zsh'
])

const SAMPLE_ALIASES: Record<string, string> = { tif: 'tiff' }

export function fileName(pathOrName: string): string {
  return pathOrName.split(/[\\/]/).pop() ?? pathOrName
}

/** Lowercase extension without the dot, or '' when there is none. */
export function fileExt(pathOrName: string): string {
  const base = fileName(pathOrName)
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function isChartSpecPath(pathOrName: string): boolean {
  return fileName(pathOrName).toLowerCase().endsWith('.chart.json')
}

export function sampleExtFor(pathOrName: string): string | null {
  if (isChartSpecPath(pathOrName)) return null
  const ext = fileExt(pathOrName)
  if (!ext) return null
  if (SAMPLE_EXTENSIONS.has(ext)) return ext
  return SAMPLE_ALIASES[ext] ?? null
}

export function sampleUrlFor(pathOrName: string): string | null {
  const ext = sampleExtFor(pathOrName)
  return ext ? `${SAMPLE_PROXY_BASE}/${SAMPLE_STEM}.${ext}` : null
}

// ── Inline text files (registered by the demo data) ──────────────────────

const INLINE_FILES = new Map<string, string>()
const BLOB_URLS = new Map<string, string>()

/** Register text content for workspace paths (conversations, projects, workspace tree). */
export function registerInlineFiles(files: Record<string, string> | undefined): void {
  if (!files) return
  for (const [path, content] of Object.entries(files)) INLINE_FILES.set(normalizePath(path), content)
}

export function normalizePath(p: string): string {
  return p.replace(/^.*?\.wfc\/workspace\//, '').replace(/^\.?\//, '')
}

export function getInlineFile(path: string): string | null {
  return INLINE_FILES.get(normalizePath(path)) ?? null
}

export function hasInlineFile(path: string): boolean {
  return INLINE_FILES.has(normalizePath(path))
}

export function mimeForPath(pathOrName: string): string {
  const ext = fileExt(pathOrName)
  return MIME_MAP[ext] ?? 'application/octet-stream'
}

/**
 * A URL a media element, iframe or anchor can load for this path: a blob URL
 * for inline text (created once, cached), the proxied sample for everything
 * else, or null when the type has no published sample (.zip) — the viewers
 * then show their per-type unavailable state.
 */
export function resolveFileUrl(path: string): string | null {
  const key = normalizePath(path)
  const inline = INLINE_FILES.get(key)
  if (inline !== null && inline !== undefined) {
    if (typeof window === 'undefined') return null
    const cached = BLOB_URLS.get(key)
    if (cached) return cached
    const url = URL.createObjectURL(new Blob([inline], { type: mimeForPath(key) }))
    BLOB_URLS.set(key, url)
    return url
  }
  return sampleUrlFor(key)
}

/** Whether the path resolves to any bytes at all. */
export function fileAvailable(path: string): boolean {
  return hasInlineFile(path) || sampleExtFor(path) !== null
}

// ── Hooks (the desktop's useUploadBlob / useUploadText shapes) ───────────

/**
 * The desktop's useUploadBlob shape. Resolution is synchronous here (an
 * inline blob URL or the proxied sample), so the hook is a memo: `url` is
 * never null for a resolvable path, and `error` marks a type with no sample.
 */
export function useFileUrl(filePath: string, mimeType?: string): { url: string | null; error: boolean } {
  const url = useMemo(() => {
    void mimeType
    return typeof window === 'undefined' ? null : resolveFileUrl(filePath)
  }, [filePath, mimeType])
  return { url, error: url === null }
}

type LoadedText = { forPath: string; text: string | null; error: boolean }

/**
 * The desktop's useUploadText shape. Inline content answers synchronously;
 * a sample is fetched through the proxy and lands on the next render.
 */
export function useFileText(filePath: string | null): { text: string | null; error: boolean } {
  const inline = filePath ? getInlineFile(filePath) : null
  const [fetched, setFetched] = useState<LoadedText | null>(null)

  useEffect(() => {
    if (!filePath || getInlineFile(filePath) !== null) return
    const url = sampleUrlFor(filePath)
    let cancelled = false
    const load = url
      ? fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      : Promise.reject(new Error('no sample'))
    void load
      .then((text) => {
        if (!cancelled) setFetched({ forPath: filePath, text, error: false })
      })
      .catch(() => {
        if (!cancelled) setFetched({ forPath: filePath, text: null, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [filePath])

  if (!filePath) return { text: null, error: false }
  if (inline !== null) return { text: inline, error: false }
  if (fetched?.forPath !== filePath) return { text: null, error: false }
  return { text: fetched.text, error: fetched.error }
}

type LoadedBytes = { forPath: string; bytes: ArrayBuffer | null; error: boolean }

function inlineBytes(text: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(text)
  const copy = new ArrayBuffer(encoded.byteLength)
  new Uint8Array(copy).set(encoded)
  return copy
}

export function useFileBytes(filePath: string | null): { bytes: ArrayBuffer | null; error: boolean } {
  const inline = useMemo(() => {
    const text = filePath ? getInlineFile(filePath) : null
    return text === null ? null : inlineBytes(text)
  }, [filePath])
  const [fetched, setFetched] = useState<LoadedBytes | null>(null)

  useEffect(() => {
    if (!filePath || getInlineFile(filePath) !== null) return
    const url = sampleUrlFor(filePath)
    let cancelled = false
    const load = url
      ? fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      : Promise.reject(new Error('no sample'))
    void load
      .then((bytes) => {
        if (!cancelled) setFetched({ forPath: filePath, bytes, error: false })
      })
      .catch(() => {
        if (!cancelled) setFetched({ forPath: filePath, bytes: null, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [filePath])

  if (!filePath) return { bytes: null, error: false }
  if (inline !== null) return { bytes: inline, error: false }
  if (fetched?.forPath !== filePath) return { bytes: null, error: false }
  return { bytes: fetched.bytes, error: fetched.error }
}

// ── Extension buckets (Chat.tsx extToBucket + attachment kinds) ──────────

export type DeliveredBucket = 'image' | 'audio' | 'video' | 'document' | 'file' | 'chart'

export const IMAGE_EXTS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'avif', 'tiff', 'tif', 'ico'
])
export const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'wma'])
export const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', 'wmv', 'flv'])
export const DOC_EXTS = new Set([
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'tsv', 'txt', 'md', 'markdown',
  'html', 'htm', 'rtf', 'odt', 'ods', 'odp', 'json', 'xml', 'yaml', 'yml'
])

export function extToBucket(filePath: string): DeliveredBucket {
  if (filePath.startsWith('wolffish-media://')) return 'image'
  if (isChartSpecPath(filePath)) return 'chart'
  const ext = fileExt(filePath)
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (AUDIO_EXTS.has(ext)) return 'audio'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (DOC_EXTS.has(ext)) return 'document'
  return 'file'
}

export type AttachmentKind = 'audio' | 'video' | 'image' | 'pdf' | 'other'

export function attachmentTypeFor(filePath: string): AttachmentKind {
  const ext = fileExt(filePath)
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (AUDIO_EXTS.has(ext)) return 'audio'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  return 'other'
}

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  mdx: 'text/markdown',
  html: 'text/html',
  htm: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  log: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  avif: 'image/avif',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  ico: 'image/x-icon',
  heic: 'image/heic',
  heif: 'image/heif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  opus: 'audio/opus',
  wma: 'audio/x-ms-wma',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  m4v: 'video/x-m4v',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  zip: 'application/zip',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  js: 'text/javascript',
  jsx: 'text/javascript',
  mjs: 'text/javascript',
  cjs: 'text/javascript',
  py: 'text/x-python',
  sql: 'text/x-sql',
  sh: 'text/x-shellscript',
  bash: 'text/x-shellscript',
  zsh: 'text/x-shellscript',
  css: 'text/css',
  scss: 'text/x-scss',
  toml: 'text/toml',
  ini: 'text/plain',
  env: 'text/plain',
  conf: 'text/plain',
  go: 'text/x-go',
  rs: 'text/x-rust',
  java: 'text/x-java',
  kt: 'text/x-kotlin',
  swift: 'text/x-swift',
  rb: 'text/x-ruby',
  php: 'text/x-php',
  c: 'text/x-c',
  cpp: 'text/x-c++',
  h: 'text/x-c',
  cs: 'text/x-csharp',
  dart: 'text/x-dart'
}

export function docMimeType(ext: string): string {
  return MIME_MAP[ext] ?? 'application/octet-stream'
}

/** Code/text extensions that render as a line-numbered source card. */
export const CODE_EXTS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'py', 'sql', 'sh', 'bash', 'zsh', 'fish', 'css',
  'scss', 'sass', 'less', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'env', 'conf', 'log',
  'go', 'rs', 'java', 'kt', 'kts', 'swift', 'rb', 'php', 'c', 'cpp', 'h', 'hpp', 'cs', 'dart',
  'lua', 'pl', 'r', 'scala', 'clj', 'erl', 'ex', 'exs', 'hs', 'ml', 'zig', 'proto', 'gql',
  'graphql', 'groovy', 'vue', 'svelte', 'ps1', 'bat', 'cmd', 'makefile', 'dockerfile', 'txt'
])

/** highlight.js language for a code file extension. */
export function languageForExt(ext: string): string | undefined {
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    py: 'python',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    css: 'css',
    scss: 'scss',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'ini',
    ini: 'ini',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    rb: 'ruby',
    php: 'php',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    cs: 'csharp',
    md: 'markdown',
    html: 'xml',
    htm: 'xml',
    diff: 'diff',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    lua: 'lua',
    r: 'r',
    scala: 'scala',
    pl: 'perl',
    ps1: 'powershell'
  }
  return map[ext]
}
