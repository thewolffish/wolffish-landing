import type { Metadata, Viewport } from 'next'
import { getLocale } from 'next-intl/server'
import PlaygroundClient from './PlaygroundClient'
import './playground.css'

/**
 * /cloud/playground — the Wolffish Cloud desktop app, replicated on demo
 * data. Embedded in the /cloud hero and openable full screen. Not indexed:
 * it is a demo surface, not a page with content of its own.
 */
export const metadata: Metadata = {
  title: 'Wolffish Cloud — desktop playground',
  robots: { index: false, follow: false }
}

export const viewport: Viewport = {
  themeColor: '#f0f4f8',
  width: 'device-width',
  initialScale: 1
}

export default async function PlaygroundPage({
  searchParams
}: {
  searchParams: Promise<{ locale?: string }>
}): Promise<React.JSX.Element> {
  // The hero passes the language explicitly, so a locale toggle on the site
  // reloads the frame in the new language without waiting on the cookie.
  const { locale: fromQuery } = await searchParams
  const locale = fromQuery === 'ar' || fromQuery === 'en' ? fromQuery : await getLocale()
  return <PlaygroundClient locale={locale === 'ar' ? 'ar' : 'en'} />
}
