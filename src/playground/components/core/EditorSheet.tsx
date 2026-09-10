import { cn } from '@/playground/lib/cn'
import { isMac } from '@/playground/lib/platform'
import { useTranslation } from '@/playground/i18n'
import { Cancel01Icon } from 'hugeicons-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type EditorSheetProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  dismissable?: boolean
  closable?: boolean
}

/** Trailing-edge side sheet for the long edit forms — automations, projects, procedures. */
export function EditorSheet({
  open,
  onClose,
  title,
  children,
  footer,
  dismissable = true,
  closable = true
}: EditorSheetProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open || !dismissable) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, dismissable, onClose])

  useEffect(() => {
    if (!open) return
    if (closeRef.current) closeRef.current.focus()
    else panelRef.current?.focus()
  }, [open])

  if (!open || typeof document === 'undefined') return null


  return createPortal(
    <div
      role="presentation"
      onClick={dismissable ? onClose : undefined}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'wf-sheet-panel-end border-border bg-surface absolute inset-y-0 end-0 flex flex-col overflow-hidden border-s shadow-xl',
          'w-[520px] max-w-[92vw] max-sm:w-full max-sm:max-w-none'
        )}
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
          <h2 id={titleId} className="text-fg min-w-0 flex-1 truncate text-sm font-semibold">
            {title}
          </h2>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            {closable && (
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={t('chat.fileCard.close')}
                title={t('chat.fileCard.close')}
                className={cn(
                  'text-muted hover:text-fg flex cursor-pointer items-center justify-center rounded p-1',
                  'focus-visible:ring-2 focus-visible:ring-accent'
                )}
              >
                <Cancel01Icon size={16} />
              </button>
            )}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed">
          {children}
        </div>
        {footer && (
          <div className="border-border flex shrink-0 flex-col gap-2 border-t px-5 py-3">
            {footer}
          </div>
        )}
      </aside>
    </div>,
    document.body
  )
}
