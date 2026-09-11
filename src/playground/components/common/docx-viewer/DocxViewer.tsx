'use client'

import { useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { useFileBytes } from '@/playground/lib/files'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { Download01Icon, File01Icon, FolderOpenIcon, LinkSquare02Icon } from 'hugeicons-react'
import { useEffect, useState } from 'react'

export type DocxViewerProps = {
  filePath: string
  fileExists: boolean
  fileName: string
  sizeBytes: number
  /**
   * Page surfaces (the workspace viewer) already carry the file name and the
   * reveal/download actions in their own header, so the card around the file
   * and its footer would be a second copy of both. `bare` drops them and hands
   * the whole pane to the file itself.
   */
  bare?: boolean
}

export function DocxViewer({
  filePath,
  fileExists,
  fileName,
  bare = false
}: DocxViewerProps): React.JSX.Element {
  if (!fileExists) return <Deleted fileName={fileName} bare={bare} />
  return <Active filePath={filePath} fileName={fileName} bare={bare} />
}

function Deleted({ fileName, bare }: { fileName: string; bare?: boolean }): React.JSX.Element {
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
        <File01Icon size={18} className="text-muted" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-muted truncate text-sm font-medium" title={fileName}>
          {fileName}
        </span>
        <span className="text-muted text-xs italic">{t('chat.fileCard.deleted')}</span>
      </div>
    </div>
  )
}

function Active({
  filePath,
  fileName,
  bare
}: {
  filePath: string
  fileName: string
  bare?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const { bytes, error: bytesError } = useFileBytes(filePath)
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState(false)

  // The sample .docx arrives as an ArrayBuffer; mammoth turns it into the
  // simple HTML the card renders (same conversion the desktop runs on the
  // bytes the upload channel hands back).
  useEffect(() => {
    if (!bytes) return
    let cancelled = false
    // mammoth (~500 KB) loads the first time a Word file is on screen.
    void import('mammoth')
      .then((m) => m.default.convertToHtml({ arrayBuffer: bytes }))
      .then((result) => {
        if (!cancelled) setHtml(result.value)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [bytes])

  const demoAction = useDemoAction()

  if (error || bytesError) return <Deleted fileName={fileName} bare={bare} />

  // On a page the document takes the whole pane and scrolls in it, with no
  // card around it and no 400px ceiling.
  if (bare) {
    return html !== null ? (
      <div
        className="bg-surface text-fg h-full w-full overflow-auto p-4 text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-muted animate-pulse text-xs">{t('chat.docxViewer.loading')}</span>
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
      {html !== null ? (
        <div
          className="bg-surface text-fg max-h-[400px] overflow-auto p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="flex h-[200px] w-full items-center justify-center">
          <span className="text-muted animate-pulse text-xs">{t('chat.docxViewer.loading')}</span>
        </div>
      )}
      <Footer
        fileName={fileName}
        onOpenExternal={demoAction}
        onReveal={demoAction}
        onDownload={demoAction}
      />
    </div>
  )
}

function Footer({
  fileName,
  onOpenExternal,
  onReveal,
  onDownload
}: {
  fileName: string
  onOpenExternal: () => void
  onReveal: () => void
  onDownload: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <File01Icon size={14} className="text-muted shrink-0" />
      <span className="text-muted min-w-0 flex-1 truncate text-[11px] font-medium" title={fileName}>
        {fileName}
      </span>
      <button
        type="button"
        onClick={onOpenExternal}
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
        onClick={onReveal}
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
        onClick={onDownload}
        title={t('chat.fileCard.download')}
        className={cn(
          'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center justify-center rounded p-1',
          'focus-visible:ring-2 focus-visible:ring-accent'
        )}
      >
        <Download01Icon size={14} />
      </button>
    </div>
  )
}
