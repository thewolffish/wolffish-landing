import { cn } from '@/playground/lib/cn'
import type { ConversationRunPhase } from '@/playground/data/types'

export const CONVERSATION_CHIP_BASE =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[8px] font-semibold tabular-nums'

const CHIP_PRIMARY = 'border-primary/40 bg-primary/15 text-primary'

export function conversationChipClasses(
  phase: ConversationRunPhase | null,
  isActive: boolean
): string {
  const hover = 'group-hover:border-primary/40 group-hover:bg-primary/15 group-hover:text-primary'
  if (isActive) {
    return cn(CHIP_PRIMARY, phase === 'processing' && 'animate-pulse', hover)
  }
  const base = ((): string => {
    switch (phase) {
      case 'processing':
        return `${CHIP_PRIMARY} animate-pulse`
      case 'completed':
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      case 'failed':
        return 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
      case 'stopped':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      default:
        return 'border-border text-muted'
    }
  })()
  return cn(base, hover)
}
