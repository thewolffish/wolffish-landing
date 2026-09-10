'use client'
import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'

type FooterReason = 'error'

export type TurnFooterProps = { stopReason: FooterReason }

const COLOR: Record<FooterReason, string> = {
  error: 'bg-red-500/10 text-red-600 dark:text-red-400'
}

const KEY: Record<FooterReason, string> = {
  error: 'chat.turnFooter.error'
}

export function TurnFooter({ stopReason }: TurnFooterProps): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'self-start inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        COLOR[stopReason]
      )}
    >
      {t(KEY[stopReason])}
    </span>
  )
}
