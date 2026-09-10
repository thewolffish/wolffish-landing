'use client'

import type { ConversationChannel } from '@/playground/data/types'
import { useTranslation } from '@/playground/i18n'
import { Activity04Icon, PlayIcon, SmartPhone01Icon } from 'hugeicons-react'

const CHANNEL_ICON_KINDS: ReadonlySet<string> = new Set(['mobile', 'heartbeat', 'procedure'])

export function hasChannelIcon(channel?: ConversationChannel | string | null): boolean {
  return typeof channel === 'string' && CHANNEL_ICON_KINDS.has(channel)
}

export function ChannelIcon({
  channel,
  size = 12,
  className
}: {
  channel?: ConversationChannel | string | null
  size?: number
  className?: string
}): React.JSX.Element | null {
  const { t } = useTranslation()
  switch (channel) {
    case 'heartbeat':
      return (
        <Activity04Icon
          size={size}
          className={className}
          aria-label={t('settings.admin.channels.heartbeat')}
        />
      )
    case 'procedure':
      return (
        <PlayIcon
          size={size}
          className={className}
          aria-label={t('settings.admin.channels.procedure')}
        />
      )
    case 'mobile':
      return (
        <SmartPhone01Icon
          size={size}
          className={className}
          aria-label={t('settings.admin.channels.mobile')}
        />
      )
    default:
      return null
  }
}
