'use client'

import { useTranslation, type TFunction } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { formatBytesL } from '@/playground/lib/format'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { Download01Icon, File01Icon, FolderOpenIcon } from 'hugeicons-react'

export type FileCardProps = {
  filePath: string
  fileExists: boolean
  fileName: string
  sizeBytes: number
  mimeType: string
}

/**
 * Fallback renderer for attachments we don't render inline (.zip,
 * .docx, anything outside our audio/video/image/pdf set). Same visual
 * weight as the PDF card so attachments stack uniformly.
 */
export function FileCard({
  filePath,
  fileExists,
  fileName,
  sizeBytes,
  mimeType
}: FileCardProps): React.JSX.Element {
  if (!fileExists) {
    return <DeletedFile fileName={fileName} />
  }
  return (
    <ActiveFile filePath={filePath} fileName={fileName} sizeBytes={sizeBytes} mimeType={mimeType} />
  )
}

/**
 * Short, human-friendly type label for the card subtitle. Prefers the
 * uppercased file extension ("DOCX", "ZIP") — the raw mimeType is unreadable
 * for Office formats (application/vnd.openxmlformats-officedocument…). Falls
 * back to the top-level mime type ("Image", "Audio") when there's no
 * extension, then to "File".
 */
function fileTypeLabel(fileName: string, mimeType: string, t: TFunction): string {
  const ext = fileName.match(/\.([a-z0-9]+)$/i)?.[1]
  if (ext) return ext.toUpperCase()
  const top = mimeType.split('/')[0]
  if (!top) return t('chat.pathCard.file')
  return t(`demo.fileTypes.${top.toLowerCase()}`, {
    defaultValue: top.charAt(0).toUpperCase() + top.slice(1)
  })
}

function DeletedFile({ fileName }: { fileName: string }): React.JSX.Element {
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

function ActiveFile({
  filePath,
  fileName,
  sizeBytes,
  mimeType
}: {
  filePath: string
  fileName: string
  sizeBytes: number
  mimeType: string
}): React.JSX.Element {
  const { t } = useTranslation()
  // Handing a file to the OS is a machine action: the demo answers with a toast.
  const demoAction = useDemoAction()
  void filePath

  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full items-center gap-3 self-start',
        'rounded-2xl border px-4 py-3'
      )}
    >
      <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <File01Icon size={20} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-fg truncate text-sm font-medium" title={fileName}>
          {fileName}
        </span>
        <span className="text-muted text-xs">
          {fileTypeLabel(fileName, mimeType, t)}
          {sizeBytes > 0 ? ` · ${formatBytesL(sizeBytes, t)}` : ''}
        </span>
      </div>
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
