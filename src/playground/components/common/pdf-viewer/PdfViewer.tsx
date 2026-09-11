'use client'

import { ExpandedSheet } from '@/playground/components/core/ExpandedSheet'
import { useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { useFileUrl } from '@/playground/lib/files'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import {
  ArrowExpandIcon,
  Download01Icon,
  FolderOpenIcon,
  LinkSquare02Icon,
  Pdf02Icon
} from 'hugeicons-react'
import { useState } from 'react'

export type PdfViewerProps = {
  filePath: string
  fileExists: boolean
  fileName: string
  sizeBytes: number
  /**
   * Page surfaces (the workspace viewer) already carry the file name and the
   * reveal/download actions in their own header, so the card around the media
   * and its footer would be a second copy of both. `bare` drops them and hands
   * the whole pane to the file itself.
   */
  bare?: boolean
}

export function PdfViewer({
  filePath,
  fileExists,
  fileName,
  bare = false
}: PdfViewerProps): React.JSX.Element {
  if (!fileExists) {
    return <DeletedPdf fileName={fileName} bare={bare} />
  }

  return <ActivePdf filePath={filePath} fileName={fileName} bare={bare} />
}

function DeletedPdf({ fileName, bare }: { fileName: string; bare?: boolean }): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full items-center gap-3 self-start',
        !bare && 'max-w-[85%] max-sm:max-w-full',
        'rounded-2xl border px-4 py-3 opacity-50'
      )}
    >
      <div className="bg-muted/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Pdf02Icon size={18} className="text-muted" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-muted truncate text-sm font-medium" title={fileName}>
          {fileName}
        </span>
        <span className="text-muted text-xs italic">{t('chat.pdfViewer.deleted')}</span>
      </div>
    </div>
  )
}

function ActivePdf({
  filePath,
  fileName,
  bare
}: {
  filePath: string
  fileName: string
  bare?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const { url, error } = useFileUrl(filePath, 'application/pdf')
  const [open, setOpen] = useState(false)
  const demoAction = useDemoAction()

  if (error) {
    return <DeletedPdf fileName={fileName} bare={bare} />
  }

  // The native viewer keeps its own toolbar, thumbnails and download — that IS
  // the built-in chrome, so the document simply takes the pane at full width
  // and full height. A PDF has no ratio to preserve; its own viewer scrolls.
  if (bare) {
    return url ? (
      <iframe src={url} title={fileName} className="h-full w-full border-0" />
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-muted animate-pulse text-xs">{t('chat.pdfViewer.loading')}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full flex-col self-start',
        'overflow-hidden rounded-2xl border'
      )}
    >
      {url ? (
        <iframe src={url} title={fileName} className="h-[400px] w-full border-0" />
      ) : (
        <div className="flex h-[400px] w-full items-center justify-center">
          <span className="text-muted animate-pulse text-xs">{t('chat.pdfViewer.loading')}</span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2">
        <Pdf02Icon size={14} className="text-muted shrink-0" />
        <span
          className="text-muted min-w-0 flex-1 truncate text-[11px] font-medium"
          title={fileName}
        >
          {fileName}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!url}
          title={t('chat.fileCard.expand')}
          className={cn(
            'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center justify-center rounded p-1',
            'disabled:cursor-default disabled:opacity-40',
            'focus-visible:ring-2 focus-visible:ring-accent'
          )}
        >
          <ArrowExpandIcon size={14} />
        </button>
        <button
          type="button"
          onClick={demoAction}
          title={t('chat.pdfViewer.openExternal')}
          className={cn(
            'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center justify-center rounded p-1',
            'focus-visible:ring-2 focus-visible:ring-accent'
          )}
        >
          <LinkSquare02Icon size={14} />
        </button>
        <button
          type="button"
          onClick={demoAction}
          title={t('chat.fileCard.reveal')}
          className={cn(
            'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center justify-center rounded p-1',
            'focus-visible:ring-2 focus-visible:ring-accent'
          )}
        >
          <FolderOpenIcon size={14} />
        </button>
        <button
          type="button"
          onClick={demoAction}
          title={t('chat.pdfViewer.download')}
          className={cn(
            'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center justify-center rounded p-1',
            'focus-visible:ring-2 focus-visible:ring-accent'
          )}
        >
          <Download01Icon size={14} />
        </button>
      </div>
      {/* Portals to document.body, so nesting it in the card costs no layout. */}
      {url && (
        <PdfLightbox open={open} onClose={() => setOpen(false)} url={url} fileName={fileName} />
      )}
    </div>
  )
}

export type PdfLightboxProps = {
  open: boolean
  onClose: () => void
  url: string
  fileName: string
}

/**
 * The same native PDF viewer on the shared trailing-edge sheet, alongside the
 * code/markdown/html viewers. No zoom/pan wrapper: the browser's viewer already
 * scrolls and zooms, and its frame swallows those events before a stage would
 * ever see them. Dismissed by Escape or the sheet's × button.
 */
export function PdfLightbox({
  open,
  onClose,
  url,
  fileName
}: PdfLightboxProps): React.JSX.Element | null {
  return (
    <ExpandedSheet open={open} onClose={onClose} title={fileName}>
      <iframe src={url} title={fileName} className="h-full w-full border-0" />
    </ExpandedSheet>
  )
}
