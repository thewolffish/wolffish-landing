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
import { Chat } from '@/playground/pages/Chat'
import { Settings } from '@/playground/pages/settings/Settings'
import { ViewerPage } from '@/playground/pages/ViewerPage'
import { History } from '@/playground/pages/History'
import { Library } from '@/playground/pages/Library'
import { Customization } from '@/playground/pages/Customization'
import { Leaderboard } from '@/playground/pages/Leaderboard'
import { Admin } from '@/playground/pages/Admin'
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

export default function PlaygroundApp({ locale }: { locale: SupportedLocale }): React.JSX.Element {
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setRestored(true), RESTORE_MS)
    return () => clearTimeout(id)
  }, [])
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
