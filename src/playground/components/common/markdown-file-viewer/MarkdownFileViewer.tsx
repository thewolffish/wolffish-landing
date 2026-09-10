'use client'

import { CodeFileViewer } from '@/playground/components/common/code-file-viewer/CodeFileViewer'
import { FileCard } from '@/playground/components/common/file-card/FileCard'
import { useFileText } from '@/playground/lib/files'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'

export type MarkdownFileViewerProps = {
  filePath: string
  fileExists: boolean
  fileName: string
  /** Byte size, or 0 when unknown (tool-delivered files). */
  sizeBytes: number
  mimeType: string
}

/**
 * Inline renderer for markdown and plain-text attachments (README.md, .txt
 * and friends). Loads the file text and reuses the CodeFileViewer card so
 * attached readmes look identical to tool-result ones: rendered markdown (or
 * line-numbered plain text, keyed off the file extension) in a max-height
 * scrollable block with copy and download in the footer. Falls back to the
 * plain FileCard while loading, on read failure, or for files too large to
 * render inline.
 */
const MAX_INLINE_BYTES = 512 * 1024

export function MarkdownFileViewer({
  filePath,
  fileExists,
  fileName,
  sizeBytes,
  mimeType
}: MarkdownFileViewerProps): React.JSX.Element {
  // Attachments pass a real size; tool-delivered files pass 0 (unknown), and
  // the demo's files are all small, so the oversize guard only ever fires on a
  // size the caller actually knows.
  const oversized = sizeBytes > 0 && sizeBytes > MAX_INLINE_BYTES
  const { text, error } = useFileText(fileExists && !oversized ? filePath : null)
  const demoAction = useDemoAction()

  if (text === null) {
    return (
      <FileCard
        filePath={filePath}
        fileExists={fileExists && !error}
        fileName={fileName}
        sizeBytes={sizeBytes}
        mimeType={mimeType}
      />
    )
  }

  return (
    <CodeFileViewer
      content={text}
      fileName={fileName}
      sizeBytes={sizeBytes || undefined}
      onDownload={demoAction}
      onReveal={demoAction}
    />
  )
}
