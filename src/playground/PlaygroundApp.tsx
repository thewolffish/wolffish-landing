'use client'

/**
 * The playground root — the desktop's App.tsx: providers, the screen switch,
 * the persistent chat sessions kept mounted behind every other page, and the
 * one app-level floating chrome. Everything is fed from the demo data, so
 * navigation is instant; the only wait is the deliberate restore skeleton on
 * first paint, the way the real app walks the workspace back out of the org.
 */
import { useEffect, useState } from 'react'
import { ToastProvider, ToastViewport } from '@/playground/components/core/toast/ToastProvider'
import { FloatingChrome } from '@/playground/components/common/floating-chrome/FloatingChrome'
import { PlaygroundProvider, useDemo, type Screen } from '@/playground/providers/PlaygroundProvider'
import type { SupportedLocale } from '@/playground/i18n'
import dynamic from 'next/dynamic'
import { Chat } from '@/playground/pages/Chat'

// Every screen but the chat is a separate chunk: the first paint carries the
// chat alone, and the rest is warmed in the background once the restore is
// through (see PlaygroundApp), so navigation still lands instantly.
const PAGE_LOADERS = {
  settings: () => import('@/playground/pages/settings/Settings').then((m) => ({ default: m.Settings })),
  viewerpage: () => import('@/playground/pages/ViewerPage').then((m) => ({ default: m.ViewerPage })),
  history: () => import('@/playground/pages/History').then((m) => ({ default: m.History })),
  library: () => import('@/playground/pages/Library').then((m) => ({ default: m.Library })),
  customization: () => import('@/playground/pages/Customization').then((m) => ({ default: m.Customization })),
  leaderboard: () => import('@/playground/pages/Leaderboard').then((m) => ({ default: m.Leaderboard })),
  admin: () => import('@/playground/pages/Admin').then((m) => ({ default: m.Admin }))
}
function Blank(): React.JSX.Element {
  return <div className="bg-bg h-full w-full" aria-hidden />
}
const Settings = dynamic(() => import('@/playground/pages/settings/Settings').then((m) => ({ default: m.Settings })), {
  ssr: false,
  loading: Blank
})
const ViewerPage = dynamic(() => import('@/playground/pages/ViewerPage').then((m) => ({ default: m.ViewerPage })), {
  ssr: false,
  loading: Blank
})
const History = dynamic(() => import('@/playground/pages/History').then((m) => ({ default: m.History })), {
  ssr: false,
  loading: Blank
})
const Library = dynamic(() => import('@/playground/pages/Library').then((m) => ({ default: m.Library })), {
  ssr: false,
  loading: Blank
})
const Customization = dynamic(() => import('@/playground/pages/Customization').then((m) => ({ default: m.Customization })), {
  ssr: false,
  loading: Blank
})
const Leaderboard = dynamic(() => import('@/playground/pages/Leaderboard').then((m) => ({ default: m.Leaderboard })), {
  ssr: false,
  loading: Blank
})
const Admin = dynamic(() => import('@/playground/pages/Admin').then((m) => ({ default: m.Admin })), {
  ssr: false,
  loading: Blank
})
import { LockScreen } from '@/playground/pages/LockScreen'
import { RestoreSkeleton, RESTORE_MS } from '@/playground/pages/RestoreSkeleton'

const CHAT_KEEPALIVE_SCREENS = new Set<Screen>([
  'chat',
  'settings',
  'viewer',
  'history',
  'library',
  'customization',
  'leaderboard',
  'admin'
])

function NonChatScreen({ screen }: { screen: Screen }): React.JSX.Element | null {
  switch (screen) {
    case 'chat':
      return null
    case 'settings':
      return <Settings />
    case 'viewer':
      return <ViewerPage />
    case 'history':
      return <History />
    case 'library':
      return <Library />
    case 'customization':
      return <Customization />
    case 'leaderboard':
      return <Leaderboard />
    case 'admin':
      return <Admin />
    case 'locked':
      return <LockScreen />
  }
}

function Screens(): React.JSX.Element {
  const { screen, sessions, activeSessionKey } = useDemo()
  const chatMounted = CHAT_KEEPALIVE_SCREENS.has(screen)
  const chatVisible = chatMounted && screen === 'chat'
  return (
    <>
      <NonChatScreen screen={screen} />
      {chatMounted &&
        sessions.map((session) => {
          const show = chatVisible && session.key === activeSessionKey
          return (
            <div key={session.key} className={show ? 'contents' : 'hidden'}>
              <Chat sessionKey={session.key} visible={show} />
            </div>
          )
        })}
      {chatMounted && (
        <div className={chatVisible ? 'contents' : 'hidden'}>
          <FloatingChrome />
        </div>
      )}
    </>
  )
}

export default function PlaygroundApp({
  locale
}: {
  locale: SupportedLocale
}): React.JSX.Element {
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setRestored(true), RESTORE_MS)
    return () => clearTimeout(id)
  }, [])
  // Warm every page chunk once the chat is up, so the first tap on Settings or
  // Admin does not wait on the network.
  useEffect(() => {
    if (!restored) return
    for (const load of Object.values(PAGE_LOADERS)) void load().catch(() => {})
  }, [restored])
  return (
    <ToastProvider viewport={false}>
      <PlaygroundProvider initialLocale={locale}>
        <div className="app-titlebar" aria-hidden />
        <div className="bg-bg text-fg fixed inset-0 h-full w-full overflow-hidden">
          {restored ? <Screens /> : <RestoreSkeleton />}
        </div>
        <ToastViewport />
      </PlaygroundProvider>
    </ToastProvider>
  )
}
