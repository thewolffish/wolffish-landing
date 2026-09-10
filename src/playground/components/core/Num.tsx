import type { ReactNode } from 'react'
import { cn } from '@/playground/lib/cn'

/** Forces left-to-right rendering for numeric content with ASCII units. */
export function Num({
  children,
  className
}: {
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <span dir="ltr" className={cn('inline-block tabular-nums', className)}>
      {children}
    </span>
  )
}
