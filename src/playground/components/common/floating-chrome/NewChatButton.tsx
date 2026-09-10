import { glassButtonClass } from '@/playground/components/common/floating-chrome/glass'
import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'
import { useDemo } from '@/playground/providers/PlaygroundProvider'
import { PlusSignIcon } from 'hugeicons-react'
import { useEffect, useRef, useState } from 'react'

/** The floating New-chat disc with the projects hover card. */
export function NewChatButton({
  onNew,
  onNewInProject
}: {
  onNew: () => void
  onNewInProject: (projectId: string) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const { projects } = useDemo()
  const [open, setOpen] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
    }
  }, [])

  const onEnter = (): void => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setOpen(true), 150)
  }
  const onLeave = (): void => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setOpen(false), 200)
  }

  const cardVisible = open && projects.length > 0

  return (
    <span
      ref={rootRef}
      className="pointer-events-auto relative inline-flex shrink-0"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        onClick={() => {
          setOpen(false)
          onNew()
        }}
        onFocus={onEnter}
        onBlur={onLeave}
        title={t('chat.newChat')}
        aria-label={t('chat.newChat')}
        aria-expanded={cardVisible}
        className={glassButtonClass}
      >
        <PlusSignIcon size={18} />
      </button>

      {cardVisible && (
        <div
          role="dialog"
          className="border-border bg-surface absolute top-full inset-e-0 z-50 mt-2 flex w-80 max-w-[90vw] flex-col gap-1.5 rounded-xl border p-1.5 shadow-xl"
        >
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {projects.map((p) => {
              const instructions = p.instructions.trim().replace(/\s+/g, ' ')
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onNewInProject(p.id)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 text-start',
                    'focus-visible:ring-2 focus-visible:ring-accent',
                    'border-border hover:bg-border/40'
                  )}
                >
                  <span aria-hidden className="mt-0.5 shrink-0 text-base leading-none">
                    {p.icon || '📁'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-fg block truncate text-xs font-medium">
                      {p.title.trim() || t('projects.untitled')}
                    </span>
                    {instructions !== '' && (
                      <span dir="auto" className="text-muted block truncate text-[11px] leading-snug">
                        {instructions}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </span>
  )
}
