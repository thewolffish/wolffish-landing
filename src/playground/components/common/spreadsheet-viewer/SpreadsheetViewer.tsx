'use client'

import { useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { fileExt, useFileBytes } from '@/playground/lib/files'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { Download01Icon, File01Icon, FolderOpenIcon, LinkSquare02Icon } from 'hugeicons-react'
import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'

export type SpreadsheetViewerProps = {
  filePath: string
  fileExists: boolean
  fileName: string
  sizeBytes: number
}

export function SpreadsheetViewer({
  filePath,
  fileExists,
  fileName
}: SpreadsheetViewerProps): React.JSX.Element {
  if (!fileExists) return <Deleted fileName={fileName} />
  return <Active filePath={filePath} fileName={fileName} />
}

function Deleted({ fileName }: { fileName: string }): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full items-center gap-3 self-start',
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

/** Delimited text (a conversation's inline .csv/.tsv) parses from a string;
 *  real workbooks (.xlsx/.xls) parse from the sample's bytes. */
function parseWorkbook(bytes: ArrayBuffer, ext: string): XLSX.WorkBook {
  if (ext === 'csv' || ext === 'tsv') {
    const text = new TextDecoder().decode(bytes)
    return XLSX.read(text, { type: 'string', raw: false })
  }
  return XLSX.read(new Uint8Array(bytes), { type: 'array' })
}

function Active({ filePath, fileName }: { filePath: string; fileName: string }): React.JSX.Element {
  const { t } = useTranslation()
  const [activeSheet, setActiveSheet] = useState(0)
  const { bytes, error: bytesError } = useFileBytes(filePath)
  const demoAction = useDemoAction()

  // Parsing is synchronous once the bytes are in hand, so the workbook is
  // derived rather than parked in state.
  const parsed = useMemo(() => {
    if (!bytes) return null
    try {
      return { workbook: parseWorkbook(bytes, fileExt(filePath)), error: false as const }
    } catch {
      return { workbook: null, error: true as const }
    }
  }, [bytes, filePath])

  const workbook = parsed?.workbook ?? null
  const sheetNames = workbook?.SheetNames ?? []

  const html = useMemo(() => {
    if (!workbook) return null
    const name = workbook.SheetNames[Math.min(activeSheet, workbook.SheetNames.length - 1)]
    const sheet = name ? workbook.Sheets[name] : undefined
    return sheet ? XLSX.utils.sheet_to_html(sheet) : null
  }, [workbook, activeSheet])

  if (bytesError || parsed?.error) return <Deleted fileName={fileName} />

  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full flex-col self-start',
        'overflow-hidden rounded-2xl border'
      )}
    >
      {html !== null ? (
        <div
          className="spreadsheet-preview bg-bg text-fg max-h-[400px] overflow-auto p-4 text-xs"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="flex h-[200px] w-full items-center justify-center">
          <span className="text-muted animate-pulse text-xs">
            {t('chat.spreadsheetViewer.loading')}
          </span>
        </div>
      )}
      {sheetNames.length > 1 && (
        <div className="border-border flex gap-1 overflow-x-auto border-t px-2 py-1">
          {sheetNames.map((name, idx) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveSheet(idx)}
              className={cn(
                'shrink-0 rounded px-2 py-0.5 text-[11px]',
                idx === activeSheet
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted hover:text-fg cursor-pointer'
              )}
            >
              {name}
            </button>
          ))}
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
