import { cn } from '@/playground/lib/cn'

/** The floating glass disc — the desktop twin of the mobile app's FloatingChrome buttons. */
export const glassButtonClass = cn(
  'pointer-events-auto flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full',
  'border-border bg-bg/40 text-fg border backdrop-blur-md',
  'hover:bg-bg/60 active:opacity-60',
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
)
