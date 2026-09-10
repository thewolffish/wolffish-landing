import { cn } from '@/playground/lib/cn'
import type { ReactNode } from 'react'

/** A bar exactly one line tall in its context — the desktop's loading primitive. */
export function SkeletonBar({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-border/60 inline-block animate-pulse rounded text-transparent select-none',
        className
      )}
    >
      &nbsp;
    </span>
  )
}

export function SkeletonBlock({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn('bg-border/60 block animate-pulse rounded', className)}
    />
  )
}

export function SkeletonRegion({
  label,
  children
}: {
  label: string
  children: ReactNode
}): React.JSX.Element {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      {children}
    </div>
  )
}
