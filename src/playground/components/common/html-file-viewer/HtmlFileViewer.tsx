'use client'

import { CodeFileViewer } from '@/playground/components/common/code-file-viewer/CodeFileViewer'
import { FileCard } from '@/playground/components/common/file-card/FileCard'
import { useFileText } from '@/playground/lib/files'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'

export type HtmlFileViewerProps = {
  filePath: string
  fileExists: boolean
  fileName: string
  /** Byte size, or 0 when unknown (tool-delivered files). */
  sizeBytes: number
  mimeType: string
}

/**
 * Inline renderer for HTML attachments and generated .html files. Mirrors
 * MarkdownFileViewer: loads the file text and reuses the CodeFileViewer card,
 * but with `htmlPreview` so the card can render the page live (sandboxed) and
 * flip to syntax-highlighted markup. Falls back to the plain FileCard while
 * loading, on read failure, or for files too large to render inline.
 */
const MAX_INLINE_BYTES = 512 * 1024

export function HtmlFileViewer({
  filePath,
  fileExists,
  fileName,
  sizeBytes,
  mimeType
}: HtmlFileViewerProps): React.JSX.Element {
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
      language="html"
      htmlPreview
      sizeBytes={sizeBytes || undefined}
      onDownload={demoAction}
      onReveal={demoAction}
      onOpenExternal={demoAction}
    />
  )
}
