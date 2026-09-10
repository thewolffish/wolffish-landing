'use client'

import { ChannelIcon } from '@/playground/components/common/ChannelIcon'
import { Button } from '@/playground/components/core/Button'
import { Modal } from '@/playground/components/core/Modal'
import { CONVERSATION_CHIP_BASE, conversationChipClasses } from '@/playground/lib/conversation-chip'
import {
  buildConversationRows,
  groupConversationRows,
  type ConversationRow
} from '@/playground/lib/conversation-rows'
import { RTL_LOCALES, useLocale, useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { pageTopPadding } from '@/playground/lib/platform'
import { useDemo } from '@/playground/providers/PlaygroundProvider'
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  BubbleChatIcon,
  Bug01Icon,
  Delete01Icon
} from 'hugeicons-react'
import { useCallback, useMemo, useState } from 'react'

export function History(): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const isRtl = RTL_LOCALES.has(locale)
  const BackIcon = isRtl ? ArrowRight02Icon : ArrowLeft02Icon
  const {
    goTo,
    metas,
    projects,
    runStatuses,
    sessions,
    activateSession,
    openConversation,
    newSession,
    deleteConversation,
    activeConversationId,
    demoAction
  } = useDemo()

  const [deleteTarget, setDeleteTarget] = useState<ConversationRow | null>(null)

  // Indexed conversations MERGED with this session's live runs, so a
  // conversation started anywhere — in-app, the phone, the terminal, an automation,
  // a procedure — shows up here the moment its first turn starts, with the
  // same pulsing number chip the rail gives it, instead of only once the work
  // is over and the cortex has caught up.
  const rows = useMemo(
    () =>
      buildConversationRows({
        metas,
        runStatuses,
        projects,
        untitled: t('chat.conversationsUntitled')
      }),
    [metas, runStatuses, projects, t]
  )

  // Sliced into the recency buckets the page renders headers over. Recomputed
  // with the rows, so the day boundary is never more stale than the list.
  const groups = useMemo(() => groupConversationRows(rows), [rows])

  const handleResume = useCallback(
    (id: string) => {
      // A still-processing conversation has no file to load, so activate its
      // live session directly — a load-first path would return null and
      // dead-end. Only fall to the stored conversation when no live session
      // holds it.
      const live = sessions.find((s) => s.conversationId === id)
      if (live) {
        activateSession(live.key)
        return
      }
      openConversation(id)
    },
    [sessions, activateSession, openConversation]
  )

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return
    // The row's disabled state keeps a conversation with a turn in flight out
    // of here; this is the backstop.
    deleteConversation(deleteTarget.conversationId)
    setDeleteTarget(null)
  }, [deleteTarget, deleteConversation])

  const handleNewChat = useCallback(() => {
    newSession()
    goTo('chat')
  }, [goTo, newSession])

  return (
    <main className={cn('bg-bg flex h-full w-full flex-col', pageTopPadding)}>
      <div className="flex items-center gap-3 px-6 pb-4 pt-3 max-sm:px-3">
        <button
          type="button"
          onClick={() => goTo('chat')}
          aria-label={t('common.back')}
          className={cn(
            'text-muted hover:text-fg flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-sm',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
          )}
        >
          <BackIcon size={16} />
          <span>{t('common.back')}</span>
        </button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleNewChat}>
          {t('history.newChat')}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 max-sm:px-2">
        <div className="mx-auto flex h-full max-w-5xl flex-col">
          {/* The desktop paints a row skeleton on its first-ever cold load,
              while the cortex list call is in flight. Here the index is
              already in memory, so the loaded state is the only state. */}
          {rows.length === 0 && (
            <div className="text-muted flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <BubbleChatIcon size={40} className="opacity-40" />
              <p className="text-sm">{t('history.empty')}</p>
            </div>
          )}
          {rows.length > 0 && (
            /* The bottom breathing room lives HERE, on the content, not on the
               scroll container's pb-6: the wrapper above is h-full, so the
               groups overflow OUT of its box and Chromium drops the scroller's
               end-side padding — the last row ends flush against the window
               edge. Padding on the overflowing content itself survives (a
               margin does not). The scroller keeps its pb-6 for short lists
               that never overflow. */
            <div className="flex flex-col gap-5 pb-8">
              {groups.map((group) => (
                <section key={group.key} className="flex flex-col gap-1.5">
                  {/* The header sits at the row padding's inset so it lines up
                      with the titles under it, not with the number chips. */}
                  <h2 className="text-muted px-4 text-[11px] font-medium tracking-wide uppercase max-sm:px-2.5">
                    {t(group.labelKey)}
                  </h2>
                  <div className="grid grid-cols-1 gap-x-3 gap-y-1 md:grid-cols-2">
                    {group.rows.map((row, i) => {
                      // Rank in the WHOLE list, not in this group — the chip
                      // number has to keep counting across the headers.
                      const position = group.startIndex + i
                      const isActive = activeConversationId === row.conversationId
                      const processing = row.phase === 'processing'
                      const title = row.title
                      const sourceIcon = row.icon
                      const diagnosticsDisabled = !row.indexed
                      // Visibility and the disabled dim are ONE decision, not two
                      // opacity utilities stacked in the class list: `cn` is plain
                      // clsx, so a second `opacity-*` would be settled by stylesheet
                      // order rather than by the order written here. The row that is
                      // currently open keeps its actions on screen — it is already
                      // pinned with its own surface, so the controls read as part of
                      // that row instead of as hover chrome; every other row reveals
                      // them on hover. A phone has no hover at all, so below the
                      // desktop breakpoint the controls are simply always on —
                      // otherwise the only way to delete a conversation from this
                      // page would be unreachable there.
                      const actionVisibility = (disabled: boolean): string =>
                        disabled
                          ? isActive
                            ? 'opacity-40'
                            : 'opacity-0 group-hover:opacity-40 max-sm:opacity-40'
                          : isActive
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100 max-sm:opacity-100'
                      return (
                        <div
                          key={row.conversationId}
                          className={cn(
                            'group flex items-center gap-3 rounded-xl px-4 py-3 max-sm:gap-2 max-sm:px-2.5',
                            'hover:bg-surface cursor-pointer',
                            isActive && 'bg-surface border-border border'
                          )}
                          onClick={() => handleResume(row.conversationId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleResume(row.conversationId)
                          }}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              CONVERSATION_CHIP_BASE,
                              conversationChipClasses(row.phase, isActive)
                            )}
                          >
                            {position}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="text-fg truncate text-sm font-medium">{title}</span>
                              {sourceIcon ? (
                                <span aria-hidden className="shrink-0 text-xs leading-none">
                                  {sourceIcon}
                                </span>
                              ) : (
                                <ChannelIcon
                                  channel={row.channel}
                                  size={12}
                                  className="text-muted shrink-0"
                                />
                              )}
                            </div>
                            <span className="text-muted text-xs">
                              {relativeTime(row.updatedAt, locale)}
                            </span>
                          </div>
                          {/* Row actions as one cluster — the row's own gap-3
                              would read as two unrelated controls, not a pair. */}
                          <div className="flex shrink-0 items-center gap-0.5">
                            {/* Diagnostic export — this is the ONLY export
                                button in the app now (the chat composer used to
                                carry a second one), so it stays live for the
                                open conversation too. Off only while the row is
                                live-only (`!indexed`): that conversation isn't
                                in the index — for an in-app first turn it isn't
                                even on disk yet — so there is nothing to
                                collect until the index catches up. */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!diagnosticsDisabled) demoAction()
                              }}
                              disabled={diagnosticsDisabled}
                              aria-label={t('diagnostics.button')}
                              title={
                                diagnosticsDisabled
                                  ? t('history.diagnosticsPending')
                                  : t('diagnostics.button')
                              }
                              className={cn(
                                'text-muted rounded-lg p-1.5',
                                actionVisibility(diagnosticsDisabled),
                                diagnosticsDisabled
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer hover:text-fg',
                                'focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent'
                              )}
                            >
                              <Bug01Icon size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!processing) setDeleteTarget(row)
                              }}
                              disabled={processing}
                              aria-label={t('history.delete')}
                              title={processing ? t('history.processing') : undefined}
                              className={cn(
                                'text-muted rounded-lg p-1.5',
                                actionVisibility(processing),
                                processing
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer hover:text-red-600 dark:hover:text-red-400',
                                'focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent'
                              )}
                            >
                              <Delete01Icon size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('history.deleteTitle')}
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              {t('history.deleteCancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              className="flex-1 border border-transparent bg-red-600 text-white shadow-none hover:bg-red-700"
            >
              {t('history.deleteConfirm')}
            </Button>
          </div>
        }
      >
        <p className="text-muted">{t('history.deleteWarning')}</p>
      </Modal>
    </main>
  )
}

function relativeTime(timestamp: number, locale: string): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (days > 0) return rtf.format(-days, 'day')
    if (hours > 0) return rtf.format(-hours, 'hour')
    if (minutes > 0) return rtf.format(-minutes, 'minute')
    return rtf.format(-seconds, 'second')
  } catch {
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
  }
}
