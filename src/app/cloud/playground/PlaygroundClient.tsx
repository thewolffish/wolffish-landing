'use client'

import dynamic from 'next/dynamic'
import type { SupportedLocale } from '@/playground/i18n'

/**
 * Client-only: the playground stamps `Date.now()` into every demo timestamp
 * and toggles the document's theme and direction, none of which should be
 * prerendered. The restore skeleton inside the app covers the first paint.
 */
const PlaygroundApp = dynamic(() => import('@/playground/PlaygroundApp'), {
  ssr: false,
  loading: () => <div className="bg-bg fixed inset-0" aria-hidden />
})

export default function PlaygroundClient({ locale }: { locale: SupportedLocale }): React.JSX.Element {
  return <PlaygroundApp locale={locale} />
}
