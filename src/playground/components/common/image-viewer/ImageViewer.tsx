'use client'

import { MediaLightbox } from '@/playground/components/common/media-lightbox/MediaLightbox'
import { useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { useFileUrl } from '@/playground/lib/files'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { Download01Icon, FolderOpenIcon, Image02Icon, LinkSquare02Icon } from 'hugeicons-react'
import { useState } from 'react'

export type ImageViewerProps = {
  filePath: string
  fileExists: boolean
  mimeType: string
  fileName: string
  width?: number
  height?: number
  /**
   * Page surfaces (the workspace viewer) already carry the file name and the
   * reveal/download actions in their own header, so the card around the media
   * and its footer would be a second copy of both. `bare` drops them and hands
   * the whole pane to the file itself.
   */
  bare?: boolean
}

/**
 * Inline image preview for uploaded files. Click to open at full
 * resolution in a modal overlay.
 */
export function ImageViewer({
  filePath,
  fileExists,
  mimeType,
  fileName,
  width,
  height,
  bare = false
}: ImageViewerProps): React.JSX.Element {
  if (!fileExists) {
    return <DeletedImage width={width} height={height} />
  }
  return (
    <ActiveImage
      filePath={filePath}
      mimeType={mimeType}
      fileName={fileName}
      width={width}
      height={height}
      bare={bare}
    />
  )
}

function DeletedImage({ width, height }: { width?: number; height?: number }): React.JSX.Element {
  const { t } = useTranslation()
  const ratio = width && height ? `${width} / ${height}` : '1 / 1'
  return (
    <div
      className={cn(
        // The placeholder takes the width its container offers and treats the
        // original's pixel size as a ceiling, never as a fixed width. A fixed
        // width outranked the files-sheet grid wrapper's `[&>*]:w-full`, so a
        // deleted image sat in its masonry column as a 320px stub — or, from a
        // large original, a slab overflowing the column — while every other
        // tile filled it. Both caps here are liftable: the wrapper's
        // `[&>*]:max-w-none!` is `!important`, so it beats the class *and* the
        // inline ceiling, and the tile fills its column like the deleted
        // audio/video tiles. Under a chat bubble the ceiling holds, so sizing
        // there is unchanged — it restates the class's 85% because an inline
        // max-width would otherwise silently replace it. The aspect ratio
        // holds the shape the image had, with a floor so the icon and label
        // fit even when the original was a wide banner.
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full flex-col items-center justify-center',
        'min-h-24 gap-2 self-start rounded-2xl border opacity-50'
      )}
      style={{ aspectRatio: ratio, maxWidth: `min(85%, ${width ? Math.max(width, 192) : 320}px)` }}
    >
      <Image02Icon size={32} className="text-muted" />
      <span className="text-muted px-4 text-center text-sm italic">
        {t('chat.imageViewer.deleted')}
      </span>
    </div>
  )
}

function ActiveImage({
  filePath,
  mimeType,
  fileName,
  width,
  height,
  bare
}: {
  filePath: string
  mimeType: string
  fileName: string
  width?: number
  height?: number
  bare?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const { url, error } = useFileUrl(filePath, mimeType)
  const [open, setOpen] = useState(false)
  // Seeded from attachment metadata when present; the thumbnail's onLoad
  // overwrites it with the decoded image's real ratio, which wins on mismatch.
  const [ratio, setRatio] = useState<number | null>(width && height ? width / height : null)
  const demoAction = useDemoAction()

  if (error) {
    return <DeletedImage width={width} height={height} />
  }

  // On a page the picture takes the full width and its own ratio sets the
  // height. Click-to-zoom stays — it is the image's own affordance, not a
  // second copy of the header's reveal/download.
  if (bare) {
    return (
      <>
        {url ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block w-full cursor-zoom-in"
            aria-label={t('demo.media.openFull')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={fileName}
              className="block h-auto w-full"
              draggable={false}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget
                if (naturalWidth && naturalHeight) setRatio(naturalWidth / naturalHeight)
              }}
            />
          </button>
        ) : (
          <div
            className="bg-border/30 flex w-full items-center justify-center"
            style={{ aspectRatio: width && height ? `${width} / ${height}` : '4 / 3' }}
          >
            <span className="text-muted text-xs">{t('demo.media.loadingImage')}</span>
          </div>
        )}
        {url && (
          <ImageLightbox
            open={open}
            onClose={() => setOpen(false)}
            url={url}
            fileName={fileName}
            ratio={ratio}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div
        className={cn(
          'border-border bg-surface flex w-fit max-w-[85%] max-sm:max-w-full flex-col gap-2 self-start',
          'overflow-hidden rounded-2xl border'
        )}
      >
        {url ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block cursor-zoom-in"
            aria-label={t('demo.media.openFull')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={fileName}
              className="block max-w-full"
              draggable={false}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget
                if (naturalWidth && naturalHeight) setRatio(naturalWidth / naturalHeight)
              }}
            />
          </button>
        ) : (
          <div
            className="bg-border/30 flex max-w-full items-center justify-center"
            style={{
              aspectRatio: width && height ? `${width} / ${height}` : '4 / 3',
              width: width ?? 320
            }}
          >
            <span className="text-muted text-xs">{t('demo.media.loadingImage')}</span>
          </div>
        )}
        {/* w-0 + min-w-full keeps a long filename from widening the card past the image */}
        <div className="flex w-0 min-w-full items-center gap-2 px-3 pb-2">
          <span
            className="text-muted min-w-0 flex-1 truncate text-[11px] font-medium"
            title={fileName}
          >
            {fileName}
          </span>
          <button
            type="button"
            onClick={demoAction}
            title={t('demo.media.openDefaultViewer')}
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
      </div>

      {url && (
        <ImageLightbox
          open={open}
          onClose={() => setOpen(false)}
          url={url}
          fileName={fileName}
          ratio={ratio}
        />
      )}
    </>
  )
}

export type ImageLightboxProps = {
  open: boolean
  onClose: () => void
  url: string
  fileName: string
  /** Natural width/height ratio; null until the image has decoded once. */
  ratio: number | null
}

/**
 * Click-to-zoom overlay. The frame grows to the same limit as the expanded
 * prompt editor (80vw × 80vh) but keeps the image's aspect ratio: width is
 * min(80vw, 80vh · ratio), so whichever axis hits its limit first wins and
 * the frame hugs the image with no letterbox bars. Scroll zooms into the
 * cursor and dragging pans; see `MediaLightbox`.
 */
export function ImageLightbox({
  open,
  onClose,
  url,
  fileName,
  ratio
}: ImageLightboxProps): React.JSX.Element | null {
  // Callers seed the ratio from attachment metadata, which can be absent; the
  // overlay's own decode is the backstop so the frame is definite either way.
  const [decoded, setDecoded] = useState<number | null>(null)
  const shape = ratio ?? decoded

  return (
    <MediaLightbox
      open={open}
      onClose={onClose}
      label={fileName}
      frameStyle={
        shape
          ? { aspectRatio: `${shape}`, width: `min(80vw, calc(80vh * ${shape}))` }
          : { maxWidth: '80vw', maxHeight: '80vh' }
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={fileName}
        draggable={false}
        className={shape ? 'h-full w-full object-contain' : 'block'}
        style={shape ? undefined : { maxWidth: '80vw', maxHeight: '80vh' }}
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget
          if (naturalWidth && naturalHeight) setDecoded(naturalWidth / naturalHeight)
        }}
      />
    </MediaLightbox>
  )
}
