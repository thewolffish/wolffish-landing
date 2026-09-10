'use client'

import dynamic from 'next/dynamic'
import type { SupportedLocale } from '@/playground/i18n'
import { RestoreSplash } from '@/playground/pages/RestoreSplash'

/**
 * Client-only: the playground stamps `Date.now()` into every demo timestamp
 * and toggles the document's theme and direction, none of which should be
 * prerendered. The restore skeleton inside the app covers the first paint.
 */
const load = () => import('@/playground/PlaygroundApp')

// One dynamic component per locale so the loading state — the restore
// screen's first frame — is server-rendered in the right language. The window
// is never blank while the app's chunk downloads; PlaygroundApp then replaces
// the splash with the animated restore from the same first frame.
const APPS = {
  en: dynamic(load, {
    ssr: false,
    loading: () => (
      <div className="bg-bg fixed inset-0">
        <RestoreSplash locale="en" />
      </div>
    )
  }),
  ar: dynamic(load, {
    ssr: false,
    loading: () => (
      <div className="bg-bg fixed inset-0">
        <RestoreSplash locale="ar" />
      </div>
    )
  })
}

export default function PlaygroundClient({ locale }: { locale: SupportedLocale }): React.JSX.Element {
  const PlaygroundApp = APPS[locale]
  return <PlaygroundApp locale={locale} />
}
