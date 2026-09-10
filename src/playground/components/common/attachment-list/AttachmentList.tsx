'use client'

import { AudioPlayer } from '@/playground/components/common/audio-player/AudioPlayer'
import { ChartCard } from '@/playground/components/common/chart-card/ChartCard'
import { CodeFileViewer } from '@/playground/components/common/code-file-viewer/CodeFileViewer'
import { FileCard } from '@/playground/components/common/file-card/FileCard'
import { HtmlFileViewer } from '@/playground/components/common/html-file-viewer/HtmlFileViewer'
import { ImageViewer } from '@/playground/components/common/image-viewer/ImageViewer'
import { MarkdownFileViewer } from '@/playground/components/common/markdown-file-viewer/MarkdownFileViewer'
import { PdfViewer } from '@/playground/components/common/pdf-viewer/PdfViewer'
import { VideoPlayer } from '@/playground/components/common/video-player/VideoPlayer'
import type { MessageAttachment } from '@/playground/data/types'
import { cn } from '@/playground/lib/cn'
import { CODE_EXTS, fileAvailable, fileExt } from '@/playground/lib/files'
import { Fragment } from 'react'

export type AttachmentListProps = {
  attachments: MessageAttachment[]
  /**
   * Alignment of each attachment card within the parent flex column.
   * Defaults to 'start' (assistant-side rendering); pass 'end' under
   * user bubbles so cards line up against the right edge instead of
   * inheriting the renderer components' built-in self-start.
   * Only applies to the default 'list' variant.
   */
  align?: 'start' | 'end'
  /**
   * 'list' (default) — a single column at chat-bubble width (each viewer's
   * built-in max-w-[85%]), used under message bubbles. 'grid' — a full-width
   * CSS-columns masonry that lets tiles of different heights (image / audio /
   * video / pdf) pack naturally with no single-column dead space; used by the
   * conversation files dialog.
   */
  variant?: 'list' | 'grid'
}

/**
 * Render each attachment with the type-appropriate renderer. Existence is
 * resolved from the demo's file set: a type with no bytes behind it (a .zip,
 * say) renders the per-type "deleted"/unavailable state instead of a broken
 * player, exactly as a since-deleted file does on the desktop.
 */
export function AttachmentList({
  attachments,
  align = 'start',
  variant = 'list'
}: AttachmentListProps): React.JSX.Element | null {
  if (attachments.length === 0) return null

  if (variant === 'grid') {
    return (
      // CSS multi-column masonry: tiles flow into as many ~26rem columns as
      // fit and keep their natural height, so a short audio card sits beside a
      // tall image without the single-column dead space. The per-tile wrapper
      // neutralizes each viewer's built-in max-w-[85%]/self-start so tiles fill
      // their column edge to edge (break-inside-avoid keeps a tile whole).
      <div className="columns-[26rem] gap-4">
        {attachments.map((att, idx) => (
          <div
            key={`${att.filePath}-${idx}`}
            className="mb-4 break-inside-avoid [&>*]:w-full [&>*]:max-w-none!"
          >
            {renderViewer(att)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        // w-full lets each renderer's `w-full max-w-[85%]` resolve against
        // the parent bubble's full width instead of the AttachmentList's
        // intrinsic content width — without this, the audio/video players
        // collapse to the size of their controls.
        'flex w-full flex-col gap-2',
        align === 'end' ? 'items-end [&>*]:self-end' : 'items-start [&>*]:self-start'
      )}
    >
      {attachments.map((att, idx) => (
        <Fragment key={`${att.filePath}-${idx}`}>{renderViewer(att)}</Fragment>
      ))}
    </div>
  )
}

/** Dispatch one attachment to its type-appropriate viewer (no key — the caller
 *  owns keying so the same dispatch serves both the list and grid variants). */
function renderViewer(att: MessageAttachment): React.JSX.Element {
  const exists = fileAvailable(att.filePath)

  if (att.type === 'audio') {
    return (
      <AudioPlayer
        filePath={att.filePath}
        fileExists={exists}
        mimeType={att.mimeType}
        fileName={att.originalName}
      />
    )
  }
  if (att.type === 'video') {
    return (
      <VideoPlayer
        filePath={att.filePath}
        fileExists={exists}
        mimeType={att.mimeType}
        fileName={att.originalName}
      />
    )
  }
  if (att.type === 'image') {
    return (
      <ImageViewer
        filePath={att.filePath}
        fileExists={exists}
        mimeType={att.mimeType}
        fileName={att.originalName}
        width={att.width}
        height={att.height}
      />
    )
  }
  if (att.type === 'pdf') {
    return (
      <PdfViewer
        filePath={att.filePath}
        fileExists={exists}
        fileName={att.originalName}
        sizeBytes={att.sizeBytes}
      />
    )
  }
  if (isChartAttachment(att)) {
    return (
      <ChartCard
        filePath={att.filePath}
        fileExists={exists}
        fileName={att.originalName}
        sizeBytes={att.sizeBytes}
        mimeType={att.mimeType}
      />
    )
  }
  if (isMarkdownAttachment(att) || isPlainTextAttachment(att)) {
    return (
      <MarkdownFileViewer
        filePath={att.filePath}
        fileExists={exists}
        fileName={att.originalName}
        sizeBytes={att.sizeBytes}
        mimeType={att.mimeType}
      />
    )
  }
  if (isHtmlAttachment(att)) {
    return (
      <HtmlFileViewer
        filePath={att.filePath}
        fileExists={exists}
        fileName={att.originalName}
        sizeBytes={att.sizeBytes}
        mimeType={att.mimeType}
      />
    )
  }
  if (isCodeAttachment(att)) {
    return (
      <CodeFileViewer
        filePath={att.filePath}
        fileExists={exists}
        fileName={att.originalName}
        sizeBytes={att.sizeBytes}
        mimeType={att.mimeType}
      />
    )
  }
  return (
    <FileCard
      filePath={att.filePath}
      fileExists={exists}
      fileName={att.originalName}
      sizeBytes={att.sizeBytes}
      mimeType={att.mimeType}
    />
  )
}

function isChartAttachment(att: MessageAttachment): boolean {
  // The full `.chart.json` suffix — not the mime type — is the chart-card
  // contract; a plain .json stays a generic file.
  return /\.chart\.json$/i.test(att.originalName)
}

function isMarkdownAttachment(att: MessageAttachment): boolean {
  return att.mimeType === 'text/markdown' || /\.(md|mdx|markdown)$/i.test(att.originalName)
}

function isPlainTextAttachment(att: MessageAttachment): boolean {
  return att.mimeType === 'text/plain' || /\.txt$/i.test(att.originalName)
}

function isHtmlAttachment(att: MessageAttachment): boolean {
  return att.mimeType === 'text/html' || /\.(html|htm)$/i.test(att.originalName)
}

/** Source files (.ts, .py, .sql…) read as a line-numbered code card. */
function isCodeAttachment(att: MessageAttachment): boolean {
  return CODE_EXTS.has(fileExt(att.originalName))
}
