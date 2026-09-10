'use client'
import { SkeletonBar } from '@/playground/components/core/Skeleton'
import { useToast } from '@/playground/components/core/toast/useToast'
import { cn } from '@/playground/lib/cn'
import { useLocale, useTranslation } from '@/playground/i18n'
import type {
  AdminAccess,
  AdminAuditEntry,
  AdminConversationRow,
  AdminRoster
} from '@/playground/data/types'
import { ADMIN_ACCESS, ADMIN_AUDIT, ADMIN_ROSTER } from '@/playground/data/admin'
import { Add01Icon, Refresh01Icon } from 'hugeicons-react'
import { useCallback, useEffect, useState } from 'react'
import { AuditList } from '@/playground/pages/settings/admin/AuditList'
import { ConversationViewer } from '@/playground/pages/settings/admin/ConversationViewer'
import { InviteSheet } from '@/playground/pages/settings/admin/InviteSheet'
import { OrgPanel } from '@/playground/pages/settings/admin/OrgPanel'
import { PeopleGrid } from '@/playground/pages/settings/admin/PeopleGrid'
import { UserDetail } from '@/playground/pages/settings/admin/UserDetail'
import { formatUsd, formatTokens } from '@/playground/pages/settings/admin/adminFormat'
import { ADMIN_SECTIONS, isSection } from '@/playground/pages/settings/admin/adminNav'
import type { AdminNav } from '@/playground/pages/settings/admin/useAdminNav'

/**
 * The admin page — everything an owner or admin needs to run the deployment,
 * inside the app the company already uses.
 *
 * Three sections and two drills. People is the landing grid; opening a card
 * drills into one person, and opening one of their conversations drills once
 * more into the transcript. Organization holds the settings that apply to
 * everybody, and Log is the audit trail.
 *
 * WHERE IT IS comes from outside. The screen (pages/Admin.tsx) owns the
 * history of pages and hands it down as `nav`, because the screen's Back
 * button has to pop the same stack this panel's drill links do. Every
 * navigation here is a push; every way back is the same pop.
 *
 * THE ROSTER IS FETCHED ONCE and kept while the screen is open, because it
 * is one call for the whole company and the people grid is what every drill
 * returns to.
 *
 * NOTHING IS PERSISTED. In the desktop that is a promise about other
 * people's data; here it is simply true — the roster is a fixture, and every
 * control that would change it ends in the demo toast.
 */

/** The beats the real calls take, so the skeletons are the ones you'd see. */
const ACCESS_MS = 180
const ROSTER_MS = 380
const AUDIT_MS = 320
const REFRESH_MS = 520

export function AdminPanel({ nav }: { nav: AdminNav }): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const toast = useToast()
  const view = nav.current

  const [access, setAccess] = useState<AdminAccess | null>(null)
  const [roster, setRoster] = useState<AdminRoster | null>(null)
  const [audit, setAudit] = useState<AdminAuditEntry[] | null>(null)
  const [inviting, setInviting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAccess(ADMIN_ACCESS), ACCESS_MS)
    return () => clearTimeout(timer)
  }, [])

  const canRead = access?.canRead === true

  useEffect(() => {
    if (!canRead) return
    const timer = setTimeout(() => setRoster(ADMIN_ROSTER), ROSTER_MS)
    return () => clearTimeout(timer)
  }, [canRead])

  useEffect(() => {
    if (!canRead || view.kind !== 'audit' || audit !== null) return
    const timer = setTimeout(() => setAudit(ADMIN_AUDIT.slice(0, 150)), AUDIT_MS)
    return () => clearTimeout(timer)
  }, [canRead, view.kind, audit])

  // The explicit press, as opposed to the silent refetch a mutation deeper
  // in asks for: it locks the button for the round trip and says so when the
  // roster is back.
  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, REFRESH_MS))
    setRoster(ADMIN_ROSTER)
    setRefreshing(false)
    toast.show({ message: t('settings.admin.people.refreshed'), tone: 'success' })
  }, [toast, t])

  if (access === null) return <AdminPanelSkeleton />
  if (!access.canRead) {
    return (
      <Shell>
        <p className="border-border text-muted rounded-2xl border border-dashed px-6 py-12 text-center text-sm">
          {t('settings.admin.noAccess')}
        </p>
      </Shell>
    )
  }

  const openUser = (userId: string): void => nav.push({ kind: 'user', userId })

  return (
    <Shell>
      <header className="flex items-start justify-between gap-4 max-sm:flex-wrap max-sm:gap-3">
        <div className="flex min-w-0 flex-col gap-2 max-sm:w-full">
          <h1 className="text-fg text-2xl font-semibold tracking-tight">
            {t('settings.admin.title')}
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            {access.canWrite ? t('settings.admin.subtitle') : t('settings.admin.subtitleReadOnly')}
          </p>
        </div>
        {view.kind === 'people' ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              aria-label={t('common.refresh')}
              className={cn(
                'border-border text-muted hover:text-fg hover:bg-border/40 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border',
                'disabled:hover:text-muted disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              <Refresh01Icon size={14} className={cn(refreshing && 'animate-spin')} />
            </button>
            {access.canWrite ? (
              <button
                type="button"
                onClick={() => setInviting(true)}
                className="bg-primary text-primary-fg inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-4 text-sm font-medium shadow-sm"
              >
                <Add01Icon size={14} />
                {t('settings.admin.invite.open')}
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {/* The section nav only makes sense at the top level; a drill replaces
          the whole body, and its own back link is the way out. A tab switch
          is a push like any other move, so Back returns to the section the
          admin came from. */}
      {isSection(view) ? (
        <div
          role="tablist"
          className="border-border bg-bg/40 flex w-full items-stretch rounded-lg border p-0.5"
        >
          {ADMIN_SECTIONS.map((key) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={view.kind === key}
              onClick={() => nav.push({ kind: key })}
              className={cn(
                'flex flex-1 items-center justify-center rounded-md px-4 py-1.5 text-xs font-medium',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                view.kind === key
                  ? 'bg-primary text-primary-fg shadow-sm'
                  : 'text-muted hover:text-fg cursor-pointer'
              )}
            >
              {t(`settings.admin.sections.${key}`)}
            </button>
          ))}
        </div>
      ) : null}

      {view.kind === 'people' ? (
        <>
          <OrgSummary roster={roster} locale={locale} />
          <PeopleGrid roster={roster} selfEmail={access.email} onOpen={openUser} />
        </>
      ) : null}

      {view.kind === 'org' ? <OrgPanel access={access} plans={roster?.plans ?? null} /> : null}

      {view.kind === 'audit' ? (
        <div className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-6 max-sm:p-4">
          <header className="flex flex-col gap-1">
            <h2 className="text-fg text-sm font-semibold">{t('settings.admin.audit.title')}</h2>
            <p className="text-muted text-xs leading-relaxed">
              {t('settings.admin.audit.subtitle')}
            </p>
          </header>
          <AuditList entries={audit} emptyLabel={t('settings.admin.audit.empty')} />
        </div>
      ) : null}

      {view.kind === 'user' ? (
        <UserDetail
          // Keyed so switching person remounts with empty state and paints
          // its skeleton, instead of showing the last person's figures
          // under the new person's name for a frame.
          key={view.userId}
          userId={view.userId}
          access={access}
          onBack={nav.back}
          onOpenConversation={(row: AdminConversationRow) =>
            nav.push({
              kind: 'conversation',
              userId: view.userId,
              conversationId: row.id,
              title: row.title
            })
          }
        />
      ) : null}

      {view.kind === 'conversation' ? (
        <ConversationViewer
          key={view.conversationId}
          conversationId={view.conversationId}
          userId={view.userId}
          title={view.title}
          onBack={nav.back}
        />
      ) : null}

      <InviteSheet open={inviting} onClose={() => setInviting(false)} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-h-full w-full items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <div className="flex w-full max-w-4xl flex-col gap-6">{children}</div>
    </div>
  )
}

/** The company in one line: headcount, spend, and what is being spent on. */
function OrgSummary({
  roster,
  locale
}: {
  roster: AdminRoster | null
  locale: string
}): React.JSX.Element {
  const { t } = useTranslation()
  const totals = roster
    ? roster.people.reduce(
        (acc, p) => ({
          people: acc.people + 1,
          active: acc.active + (p.status === 'active' ? 1 : 0),
          tokens: acc.tokens + p.tokens_in + p.tokens_out,
          cost: acc.cost + p.cost_microusd,
          searches: acc.searches + p.searches
        }),
        { people: 0, active: 0, tokens: 0, cost: 0, searches: 0 }
      )
    : null

  const cells: Array<{ key: string; value: string }> = totals
    ? [
        { key: 'people', value: `${totals.active} / ${totals.people}` },
        { key: 'tokens', value: formatTokens(totals.tokens, locale) },
        { key: 'cost', value: formatUsd(totals.cost, locale) },
        { key: 'searches', value: formatTokens(totals.searches, locale) }
      ]
    : [{ key: 'people' }, { key: 'tokens' }, { key: 'cost' }, { key: 'searches' }].map((c) => ({
        ...c,
        value: ''
      }))

  return (
    <section className="bg-surface border-border grid grid-cols-2 gap-4 rounded-2xl border p-5 sm:grid-cols-4 max-sm:p-4">
      {cells.map((c) => (
        <div key={c.key} className="flex min-w-0 flex-col gap-1">
          <span className="text-muted truncate text-[11px]">
            {t(`settings.admin.summary.${c.key}`)}
          </span>
          <span className="text-fg text-lg font-semibold tabular-nums" dir="ltr">
            {totals ? c.value : <SkeletonBar className="w-16" />}
          </span>
        </div>
      ))}
    </section>
  )
}

/**
 * The whole page while the access check is in flight. Same header block,
 * same section nav, same summary strip and the same card grid the People
 * section lands on — so the screen is already its final shape before the
 * first byte arrives.
 */
function AdminPanelSkeleton(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <Shell>
      <div role="status" aria-label={t('common.loading')} className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            <SkeletonBar className="w-40" />
          </h1>
          <p className="text-sm">
            <SkeletonBar className="w-96" />
          </p>
        </header>
        <SkeletonBar className="h-[34px] w-full rounded-lg" />
        <section className="bg-surface border-border grid grid-cols-2 gap-4 rounded-2xl border p-5 sm:grid-cols-4 max-sm:p-4">
          {['people', 'tokens', 'cost', 'searches'].map((k) => (
            <div key={k} className="flex min-w-0 flex-col gap-1">
              <span className="text-muted truncate text-[11px]">
                {t(`settings.admin.summary.${k}`)}
              </span>
              <span className="text-lg font-semibold">
                <SkeletonBar className="w-16" />
              </span>
            </div>
          ))}
        </section>
      </div>
    </Shell>
  )
}
