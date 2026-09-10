'use client'

import { MediaLightbox } from '@/playground/components/common/media-lightbox/MediaLightbox'
import { useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { useFileUrl } from '@/playground/lib/files'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import {
  ArrowExpandIcon,
  Download01Icon,
  FolderOpenIcon,
  LinkSquare02Icon,
  VideoOffIcon
} from 'hugeicons-react'
import { useState } from 'react'

export type VideoPlayerProps = {
  filePath: string
  fileExists: boolean
  mimeType: string
  fileName: string
}

/**
 * Inline video player for uploaded files. Native `<video controls>` is
 * the right primitive here; the workspace path is purely metadata.
 */
export function VideoPlayer({
  filePath,
  fileExists,
  mimeType,
  fileName
}: VideoPlayerProps): React.JSX.Element {
  if (!fileExists) {
    return <DeletedVideo />
  }
  return <ActiveVideo filePath={filePath} mimeType={mimeType} fileName={fileName} />
}

function DeletedVideo(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'border-border bg-surface relative flex w-full max-w-[85%] max-sm:max-w-full flex-col gap-2 self-start',
        'aspect-video items-center justify-center rounded-2xl border opacity-50'
      )}
    >
      <VideoOffIcon size={32} className="text-muted" />
      <span className="text-muted text-sm italic">{t('chat.videoPlayer.deleted')}</span>
    </div>
  )
}

function ActiveVideo({
  filePath,
  mimeType,
  fileName
}: {
  filePath: string
  mimeType: string
  fileName: string
}): React.JSX.Element {
  const { t } = useTranslation()
  const { url, error } = useFileUrl(filePath, mimeType)
  const [open, setOpen] = useState(false)
  const demoAction = useDemoAction()

  if (error) {
    return <DeletedVideo />
  }

  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full flex-col gap-2 self-start',
        'overflow-hidden rounded-2xl border'
      )}
    >
      {url ? (
        <video
          src={url}
          controls
          preload="metadata"
          className="w-full bg-black"
          style={{ maxHeight: '60vh' }}
        />
      ) : (
        <div
          className="bg-border/30 flex w-full items-center justify-center"
          style={{ aspectRatio: '16 / 9' }}
        >
          <span className="text-muted animate-pulse text-xs">{t('demo.media.loadingVideo')}</span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 pb-2">
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
          title={t('demo.media.openDefaultPlayer')}
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
          title={t('chat.fileCard.download')}
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
        <VideoLightbox open={open} onClose={() => setOpen(false)} url={url} fileName={fileName} />
      )}
    </div>
  )
}

export type VideoLightboxProps = {
  open: boolean
  onClose: () => void
  url: string
  fileName: string
}

/**
 * Expanded video on the same zoom/pan surface as the image overlay. The ratio
 * comes from the decoded stream rather than an assumed 16:9, so the frame hugs
 * the picture. Native controls live inside the transform and therefore slide
 * out of frame while zoomed — reset (the toolbar, `0`, or a double-click)
 * brings them back.
 */
export function VideoLightbox({
  open,
  onClose,
  url,
  fileName
}: VideoLightboxProps): React.JSX.Element | null {
  const [ratio, setRatio] = useState(16 / 9)

  return (
    <MediaLightbox
      open={open}
      onClose={onClose}
      label={fileName}
      frameStyle={{ aspectRatio: `${ratio}`, width: `min(80vw, calc(80vh * ${ratio}))` }}
    >
      <video
        src={url}
        controls
        preload="metadata"
        className="h-full w-full bg-black object-contain"
        onLoadedMetadata={(e) => {
          const { videoWidth, videoHeight } = e.currentTarget
          if (videoWidth && videoHeight) setRatio(videoWidth / videoHeight)
        }}
      />
    </MediaLightbox>
  )
}
