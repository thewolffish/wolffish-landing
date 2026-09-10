import { ChannelIcon, hasChannelIcon } from '@/playground/components/common/ChannelIcon'
import { Avatar } from '@/playground/components/common/Avatar'
import { CONVERSATION_CHIP_BASE, conversationChipClasses } from '@/playground/lib/conversation-chip'
import {
  buildConversationRows,
  groupConversationRows,
  type ConversationRow
} from '@/playground/lib/conversation-rows'
import { cn } from '@/playground/lib/cn'
import { isMac } from '@/playground/lib/platform'
import { useTranslation } from '@/playground/i18n'
import { useDemo, type Screen } from '@/playground/providers/PlaygroundProvider'
import { USER } from '@/playground/data/identity'
import {
  AiBrain01Icon,
  ChampionIcon,
  Clock01Icon,
  FileEditIcon,
  Folder01Icon,
  HeartCheckIcon,
  PlayListIcon,
  Settings02Icon,
  UserGroupIcon,
  SquareLock01Icon
} from 'hugeicons-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'

const PAGE = 40

const ADMIN_ROLES: ReadonlySet<string> = new Set(['owner', 'admin', 'support'])

/** Every navigable page, Settings first, in the mobile sheet's row idiom. */
const NAV: {
  key: string
  screen: Screen
  icon: ComponentType<{ size?: number }>
  labelKey: string
  adminOnly?: boolean
}[] = [
  { key: 'settings', screen: 'settings', icon: Settings02Icon, labelKey: 'chat.settings' },
  { key: 'admin', screen: 'admin', icon: UserGroupIcon, labelKey: 'chat.admin', adminOnly: true },
  { key: 'leaderboard', screen: 'leaderboard', icon: ChampionIcon, labelKey: 'chat.leaderboard' },
  { key: 'heartbeat', screen: 'heartbeat', icon: HeartCheckIcon, labelKey: 'chat.heartbeat' },
  { key: 'projects', screen: 'projects', icon: Folder01Icon, labelKey: 'chat.projects' },
  { key: 'procedures', screen: 'procedures', icon: PlayListIcon, labelKey: 'chat.procedures' },
  { key: 'customization', screen: 'customization', icon: AiBrain01Icon, labelKey: 'chat.customization' },
  { key: 'viewer', screen: 'viewer', icon: FileEditIcon, labelKey: 'chat.workspace' },
  { key: 'history', screen: 'history', icon: Clock01Icon, labelKey: 'chat.conversations' }
]

/** Leading-edge conversations sheet — the desktop port of the mobile app's sheet. */
export function ConversationsSheet({
  onClose,
  onOpenProfile,
  suspended = false
}: {
  onClose: () => void
  onOpenProfile: () => void
  suspended?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const { goTo, metas, projects, runStatuses, openConversation, activeConversationId, activeProject, lock } =
    useDemo()
  const pageRows = useMemo(
    () => (ADMIN_ROLES.has(USER.role) ? NAV : NAV.filter((row) => !row.adminOnly)),
    []
  )
  const [limit, setLimit] = useState(PAGE)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (suspended) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, suspended])

  const rows = useMemo<ConversationRow[]>(() => {
    const all = buildConversationRows({
      metas,
      runStatuses,
      projects,
      untitled: t('chat.conversationsUntitled')
    })
    if (!activeProject) return all
    return all.filter(
      (r) => r.projectId === activeProject.id || r.conversationId === activeConversationId
    )
  }, [metas, projects, runStatuses, t, activeProject, activeConversationId])

  const windowed = useMemo(() => (rows.length > limit ? rows.slice(0, limit) : rows), [rows, limit])
  const groups = useMemo(() => groupConversationRows(windowed), [windowed])
  const hasMore = rows.length > windowed.length

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((current) => current + PAGE)
      },
      { root: scrollerRef.current, rootMargin: '400px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore])

  const openRow = useCallback(
    (conversationId: string) => {
      onClose()
      openConversation(conversationId)
    },
    [onClose, openConversation]
  )

  const go = useCallback(
    (screen: Screen) => {
      onClose()
      goTo(screen)
    },
    [onClose, goTo]
  )

  return (
    <div className="fixed inset-0 z-50">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('chat.conversations')}
        className={cn(
          'wf-sheet-panel bg-bg border-border/40 absolute inset-y-0 start-0 flex w-[520px] max-w-[92vw] flex-col border-e'
        )}
      >
        <nav className={cn('flex shrink-0 flex-col gap-0.5 px-2.5 pb-1', isMac ? 'pt-12' : 'pt-6')}>
          {pageRows.map(({ key, screen, icon: Icon, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => go(screen)}
              aria-label={t(labelKey)}
              className={cn(
                'text-fg hover:bg-surface flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-2.5',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
              )}
            >
              <span className="text-muted flex h-6 w-6 shrink-0 items-center justify-center">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1 truncate text-start text-[13px] font-medium">
                {t(labelKey)}
              </span>
            </button>
          ))}
        </nav>
        <div aria-hidden className="border-border/60 mx-4 mt-2 shrink-0 border-t" />
        {activeProject && (
          <div className="flex shrink-0 items-center gap-1.5 px-4 pt-3">
            <span aria-hidden className="text-[11px] leading-none">
              {activeProject.icon || '📁'}
            </span>
            <span
              title={activeProject.title}
              className="text-muted min-w-0 flex-1 truncate text-[10px] font-medium tracking-wide uppercase"
            >
              {activeProject.title.trim() || t('projects.untitled')}
            </span>
          </div>
        )}
        <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
          {rows.length === 0 ? (
            <p className="text-muted px-1.5 pt-3 text-xs">{t('history.empty')}</p>
          ) : (
            <nav className="flex w-full flex-col gap-0.5">
              {groups.map((group) => (
                <div key={group.key} className="flex w-full flex-col gap-0.5">
                  <span className="text-muted truncate px-1.5 pt-2 text-[10px] font-medium tracking-wide uppercase">
                    {t(group.labelKey)}
                  </span>
                  {group.rows.map((row, i) => {
                    const position = group.startIndex + i
                    const isActive = row.conversationId === activeConversationId
                    return (
                      <button
                        key={row.conversationId}
                        type="button"
                        onClick={() => openRow(row.conversationId)}
                        title={row.title}
                        aria-label={row.title}
                        className={cn(
                          'group text-muted flex w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-start',
                          'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                          isActive ? 'bg-surface border-border border' : 'hover:bg-surface border border-transparent'
                        )}
                      >
                        <span className="relative inline-flex shrink-0">
                          <span
                            aria-hidden
                            className={cn(CONVERSATION_CHIP_BASE, conversationChipClasses(row.phase, isActive))}
                          >
                            {position}
                          </span>
                          {row.icon ? (
                            <span
                              aria-hidden
                              className="absolute -inset-e-1 -bottom-1.5 flex h-3.5 w-3.5 items-center justify-center text-[9px] leading-none"
                            >
                              {row.icon}
                            </span>
                          ) : (
                            hasChannelIcon(row.channel) && (
                              <span className="absolute -inset-e-1 -bottom-1.5 flex h-3.5 w-3.5 items-center justify-center">
                                <ChannelIcon channel={row.channel} size={9} className="text-muted" />
                              </span>
                            )
                          )}
                        </span>
                        <span
                          className={cn(
                            'group-hover:text-fg min-w-0 flex-1 truncate text-xs whitespace-nowrap',
                            isActive && 'text-fg'
                          )}
                        >
                          {row.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </nav>
          )}
          {hasMore && <div ref={sentinelRef} aria-hidden className="h-px" />}
        </div>
        <div className="border-border/60 flex shrink-0 items-center gap-1 border-t px-2.5 py-2.5">
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={t('profile.title')}
            className={cn(
              'hover:bg-surface flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-start',
              'focus-visible:ring-2 focus-visible:ring-accent'
            )}
          >
            <Avatar name={USER.name} size={30} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-fg truncate text-[13px] leading-tight font-medium">{USER.name}</span>
              <span className="text-muted truncate text-[11px] leading-tight" dir="ltr">
                {USER.email}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              lock()
            }}
            aria-label={t('profile.lockNow')}
            title={t('profile.lockNow')}
            className={cn(
              'text-muted hover:text-fg hover:bg-surface flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg',
              'focus-visible:ring-2 focus-visible:ring-accent'
            )}
          >
            <SquareLock01Icon size={16} />
          </button>
        </div>
      </aside>
    </div>
  )
}
