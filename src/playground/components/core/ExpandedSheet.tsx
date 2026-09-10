import { cn } from '@/playground/lib/cn'
import { isMac } from '@/playground/lib/platform'
import { useTranslation } from '@/playground/i18n'
import { Cancel01Icon } from 'hugeicons-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ExpandedSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  actions?: ReactNode
  children: ReactNode
}

/** Trailing-edge side sheet (80vw) — the file viewers' and editors' expand surface. */
export function ExpandedSheet({
  open,
  onClose,
  title,
  actions,
  children
}: ExpandedSheetProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
  }, [open])

  if (!open || typeof document === 'undefined') return null


  return createPortal(
    <div role="presentation" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className="wf-sheet-panel-end border-border bg-surface absolute inset-y-0 end-0 flex w-[80vw] max-w-full flex-col overflow-hidden border-s shadow-xl max-sm:w-full"
      >
        <div
          className={cn(
            // Clears the titlebar strip on BOTH edges: the desktop only needs it
            // under RTL (traffic lights), but the hero frame's controls sit in the
            // opposite corner, and a close button under either is unreachable.
            'border-border flex shrink-0 items-center gap-2 border-b px-5 py-3',
            isMac && 'pt-12'
          )}
        >
          <span
            id={titleId}
            className="text-fg min-w-0 flex-1 truncate text-sm font-semibold"
            title={title}
          >
            {title}
          </span>
          {actions}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('chat.fileCard.close')}
            title={t('chat.fileCard.close')}
            className={cn(
              'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center justify-center rounded p-1',
              'focus-visible:ring-2 focus-visible:ring-accent'
            )}
          >
            <Cancel01Icon size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </aside>
    </div>,
    document.body
  )
}
