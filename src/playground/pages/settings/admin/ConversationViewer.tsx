'use client'
import { SkeletonBar, SkeletonBlock } from '@/playground/components/core/Skeleton'
import { cn } from '@/playground/lib/cn'
import { RTL_LOCALES, useLocale, useTranslation } from '@/playground/i18n'
import type { AdminTranscript, ChatMessage } from '@/playground/data/types'
import { mapConversationMessages, useDemo } from '@/playground/providers/PlaygroundProvider'
import { ADMIN_ROSTER, adminConversationsFor } from '@/playground/data/admin'
import { USER, USER_ID } from '@/playground/data/identity'
import { latestTodoLists } from '@/playground/lib/markers'
import { AssistantBubble, UserBubble } from '@/playground/pages/Chat'
import { ArrowLeft02Icon, ArrowRight02Icon } from 'hugeicons-react'
import { useEffect, useMemo, useState } from 'react'
import { formatWhen } from '@/playground/pages/settings/admin/adminFormat'
import { actionLog, type ActionEntry } from '@/playground/pages/settings/admin/actionLog'

/**
 * One employee's conversation, as the admin sees it — which is to say, as
 * the EMPLOYEE saw it.
 *
 * The records are mapped by the same `mapConversationMessages` the chat page
 * uses and drawn by the same `UserBubble` / `AssistantBubble` the chat page
 * draws. Nothing here is an admin-flavoured re-implementation, because a
 * second renderer would drift from the real one silently — showing a
 * transcript that looks complete while quietly dropping a card type nobody
 * remembered to port.
 *
 * What IS different: it is read-only. The approval and ask callbacks are
 * inert (those decisions were made when the turn ran and cannot be revisited
 * months later from someone else's screen).
 *
 * Two tabs, because an admin arrives with one of two questions. The
 * TRANSCRIPT answers "what was said". The LOG answers "what did it DO" —
 * every tool call in order, which for a browser-extension conversation is
 * literally the list of actions taken in the employee's browser.
 *
 * IN THE DEMO only the signed-in account's own conversations carry records;
 * everyone else's row opens the reader's own unavailable state, with a line
 * saying why.
 */

type Tab = 'transcript' | 'log'

/**
 * Why another person's transcript will not open here. Not a desktop string —
 * it lives with the rest of the playground's own copy in i18n/demo.ts.
 */
const UNAVAILABLE_KEY = 'demo.admin.recordsOnly'
const UNAVAILABLE_NOTE_KEY = 'demo.admin.recordsNote'

export function ConversationViewer({
  conversationId,
  userId,
  title,
  onBack
}: {
  conversationId: string
  /** Whose conversation it is — the demo only holds the owner's records. */
  userId: string
  title: string
  onBack: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { loadConversation } = useDemo()
  const isRtl = RTL_LOCALES.has(locale)
  const BackIcon = isRtl ? ArrowRight02Icon : ArrowLeft02Icon
  const [tab, setTab] = useState<Tab>('transcript')
  const [data, setData] = useState<AdminTranscript | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Mounted fresh per conversation (the parent keys on the id), so this
  // effect only ever fills — there is no previous conversation's state left
  // to clear, which is what a reset here would have been for.
  useEffect(() => {
    const timer = setTimeout(() => {
      const file = userId === USER_ID ? loadConversation(conversationId) : null
      if (file) {
        setData({
          conversation: file,
          owner: { userId: USER_ID, name: USER.name, email: USER.email },
          truncated: false
        })
      } else {
        // The key, not the sentence: the reason re-renders in the reader's
        // language when they flip the locale with this open.
        setError(UNAVAILABLE_KEY)
      }
    }, 260)
    return () => clearTimeout(timer)
  }, [conversationId, userId, loadConversation])

  const messages = useMemo<ChatMessage[] | null>(
    () => (data ? mapConversationMessages(data.conversation) : null),
    [data]
  )
  const actions = useMemo(() => (data ? actionLog(data.conversation) : null), [data])

  // The header line for a transcript that will not open: who it belongs to
  // and when they last touched it, both of which the roster already knows.
  const fallbackOwner = useMemo(() => {
    if (userId === USER_ID) return null
    const person = ADMIN_ROSTER.people.find((p) => p.id === userId)
    const row = adminConversationsFor(userId).find((r) => r.id === conversationId)
    const when = row ? formatWhen(row.updated_at, locale) : null
    return `${person?.name ?? userId}${when ? ` · ${when}` : ''}`
  }, [userId, conversationId, locale])

  return (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'text-muted hover:text-fg -ms-2 flex w-fit cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
          )}
        >
          <BackIcon size={16} />
          <span>{t('settings.admin.conversations.backToUser')}</span>
        </button>
        <div className="flex items-start justify-between gap-4 max-sm:flex-wrap max-sm:gap-2">
          <div className="flex min-w-0 flex-col gap-1 max-sm:w-full">
            <h1 className="text-fg truncate text-xl font-semibold tracking-tight">
              {data?.conversation.title || title || t('settings.admin.conversations.untitled')}
            </h1>
            <p className="text-muted text-xs">
              {data ? (
                <>
                  {data.owner.name || data.owner.email || data.owner.userId}
                  {data.conversation.updatedAt
                    ? ` · ${formatWhen(new Date(data.conversation.updatedAt).toISOString(), locale)}`
                    : ''}
                </>
              ) : error !== null ? (
                (fallbackOwner ?? '')
              ) : (
                <SkeletonBar className="w-56" />
              )}
            </p>
          </div>
          <div
            role="tablist"
            className="border-border bg-bg/40 inline-flex shrink-0 items-center rounded-lg border p-0.5"
          >
            {(['transcript', 'log'] as Tab[]).map((key) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  tab === key
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-muted hover:text-fg cursor-pointer'
                )}
              >
                {t(`settings.admin.conversations.tabs.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {data?.truncated ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
          {t('settings.admin.conversations.truncated')}
        </p>
      ) : null}

      {error !== null ? (
        <div className="border-border flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-center">
          <p className="text-muted text-xs">
            {t('settings.admin.conversations.readFailed', { error: t(error) })}
          </p>
          <p className="text-muted/80 text-[11px]">{t(UNAVAILABLE_NOTE_KEY)}</p>
        </div>
      ) : tab === 'transcript' ? (
        <TranscriptView messages={messages} loading={data === null} />
      ) : (
        <LogView entries={actions} loading={data === null} />
      )}
    </div>
  )
}

/**
 * The transcript. `readOnly` is enforced by giving the interactive callbacks
 * nothing to do: approvals and asks belong to a turn that finished, and the
 * cards render in their settled state.
 */
function TranscriptView({
  messages,
  loading
}: {
  messages: ChatMessage[] | null
  loading: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const noop = (): void => undefined
  // Each task list once, in its latest state — the chat page's own rule
  // (a later turn's todo_write resolves the earlier card in place).
  const todoLists = useMemo(
    () =>
      latestTodoLists(
        (messages ?? []).map((m) => (m.role === 'assistant' ? m.segments : undefined))
      ),
    [messages]
  )

  if (loading || messages === null) return <TranscriptSkeleton />

  if (messages.length === 0) {
    return (
      <p className="border-border text-muted rounded-xl border border-dashed px-4 py-8 text-center text-xs">
        {t('settings.admin.conversations.emptyTranscript')}
      </p>
    )
  }

  return (
    <div className="bg-surface border-border flex flex-col gap-6 rounded-2xl border p-6 max-sm:p-4">
      {messages.map((m) =>
        m.role === 'user' ? (
          <UserBubble
            key={m.id}
            content={m.content}
            attachments={m.attachments}
            voicePrompt={m.voicePrompt}
            timestamp={m.timestamp}
            t={t}
          />
        ) : (
          <AssistantBubble
            key={m.id}
            message={m}
            todoLists={todoLists}
            awaitingApproval={false}
            awaitingAsk={false}
            onApprovalDecision={noop}
            onAskRespond={noop}
          />
        )
      )}
    </div>
  )
}

/**
 * A prompt bubble and a reply block, twice — the same alternating rhythm and
 * the same paddings the transcript has, so the panel is already its final
 * shape while the records load.
 */
function TranscriptSkeleton(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div
      className="bg-surface border-border flex flex-col gap-6 rounded-2xl border p-6 max-sm:p-4"
      role="status"
      aria-label={t('common.loading')}
    >
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-6">
          <div className="flex w-full flex-col items-end gap-1.5">
            <SkeletonBlock className="h-10 w-[45%] rounded-2xl" />
          </div>
          <div className="flex w-full flex-col gap-2">
            <SkeletonBar className="w-[85%] text-sm" />
            <SkeletonBar className="w-[92%] text-sm" />
            <SkeletonBar className="w-[70%] text-sm" />
            <SkeletonBlock className="mt-1 h-9 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

function LogView({
  entries,
  loading
}: {
  entries: ActionEntry[] | null
  loading: boolean
}): React.JSX.Element {
  const { t } = useTranslation()

  if (loading || entries === null) {
    return (
      <div
        className="bg-surface border-border flex flex-col rounded-2xl border p-6 max-sm:p-4"
        role="status"
        aria-label={t('common.loading')}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="border-border/60 flex items-baseline gap-3 border-b py-2 last:border-b-0"
          >
            <SkeletonBar className="w-28 shrink-0 font-mono text-xs" />
            <SkeletonBar className="min-w-0 flex-1 text-xs" />
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <p className="border-border text-muted rounded-xl border border-dashed px-4 py-8 text-center text-xs">
        {t('settings.admin.conversations.emptyLog')}
      </p>
    )
  }

  const browserCount = entries.filter((e) => e.browser).length
  return (
    <div className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-6 max-sm:p-4">
      <p className="text-muted text-xs">
        {t('settings.admin.conversations.logSummary', {
          count: entries.length,
          browser: browserCount
        })}
      </p>
      <ol className="flex flex-col">
        {entries.map((e, i) => (
          <li
            key={`${e.id}-${i}`}
            className="border-border/60 flex items-baseline gap-3 border-b py-2 last:border-b-0"
          >
            <span
              className={cn('shrink-0 font-mono text-xs', e.browser ? 'text-primary' : 'text-fg')}
              dir="ltr"
            >
              {e.name}
            </span>
            <span className="text-muted min-w-0 flex-1 truncate text-xs" dir="ltr" title={e.detail}>
              {e.detail}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
