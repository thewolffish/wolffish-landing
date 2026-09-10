'use client'

import { CodeEditor } from '@/playground/components/core/CodeEditor'
import { CopyButton } from '@/playground/components/core/CopyButton'
import { useToast } from '@/playground/components/core/toast/useToast'
import { RTL_LOCALES, useLocale, useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { pageTopPadding } from '@/playground/lib/platform'
import { useDemo, useTheme } from '@/playground/providers/PlaygroundProvider'
import {
  AngelIcon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  FloppyDiskIcon,
  Refresh01Icon,
  Robot01Icon,
  UserIcon
} from 'hugeicons-react'
import { useCallback, useEffect, useState, type ComponentType } from 'react'

/**
 * The three hand-written documents that shape the agent. The paths are the
 * ones the workspace tree shows for the same three files, so an edit here and
 * an edit in the file viewer are edits to the same document.
 */
type Doc = 'soul' | 'user' | 'agents'

const DOCS: {
  key: Doc
  path: string
  fileName: string
  icon: ComponentType<{ size?: number }>
}[] = [
  { key: 'soul', path: 'brain/identity/soul.md', fileName: 'soul.md', icon: AngelIcon },
  { key: 'user', path: 'brain/identity/user.md', fileName: 'user.md', icon: UserIcon },
  { key: 'agents', path: 'brain/prefrontal/agents.md', fileName: 'agents.md', icon: Robot01Icon }
]

/**
 * One document's editing state. `original` is the text as this page last saw
 * it — the dirty test.
 */
type DocState = { content: string; original: string }

/**
 * Customization — Soul, User and Agents as one page with three tabs.
 *
 * They were three sidebar destinations rendering the same editor over three
 * files, which made "adjust how the agent behaves" a question of remembering
 * which of three near-identical pages held the paragraph you meant. The phone
 * collapsed them into one Customization screen; this is the desktop's version
 * of that move, with tabs where the Changelog page puts its version chip — the
 * back button leads, the tabs sit beside it, and the editor fills the rest.
 *
 * All three documents are held at once rather than one per visit. That is what
 * lets an inactive tab carry an honest unsaved-changes dot: a draft you left
 * in Soul is still there when you come back from Agents, which was never true
 * when the three were separate pages.
 */
export function Customization(): React.JSX.Element {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { isDark } = useTheme()
  const isRtl = RTL_LOCALES.has(locale)
  const BackIcon = isRtl ? ArrowRight02Icon : ArrowLeft02Icon
  const { goTo, identityDocs, setIdentityDoc } = useDemo()
  const toast = useToast()

  const [active, setActive] = useState<Doc>('soul')
  // The desktop reads the three files off disk on mount; here they are already
  // in memory, so the page opens on the live text with no loading state.
  const [docs, setDocs] = useState<Record<Doc, DocState>>(() => ({
    soul: { content: identityDocs.soul, original: identityDocs.soul },
    user: { content: identityDocs.user, original: identityDocs.user },
    agents: { content: identityDocs.agents, original: identityDocs.agents }
  }))
  const [saving, setSaving] = useState(false)

  const activeDoc = DOCS.find((d) => d.key === active) ?? DOCS[0]
  const state = docs[active]
  const isDirty = state.content !== state.original

  const handleChange = useCallback(
    (value: string) => {
      setDocs((prev) => ({ ...prev, [active]: { ...prev[active], content: value } }))
    },
    [active]
  )

  const handleSave = useCallback((): void => {
    if (saving) return
    const saved = state.content
    setSaving(true)
    setIdentityDoc(active, saved)
    // Stamp what actually went to the workspace, not whatever is in the box
    // now: a keystroke landing during the write should leave the tab dirty,
    // not pretend it was included in the save.
    setDocs((prev) => ({ ...prev, [active]: { ...prev[active], original: saved } }))
    toast.show({ tone: 'success', message: t('workspace.saved') })
    setSaving(false)
  }, [active, saving, setIdentityDoc, state.content, t, toast])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  /**
   * Re-read the document from the workspace. On the desktop that is a disk
   * read that also adopts a write from another window or the paired phone;
   * here it reloads the text the file viewer and this page share, which is
   * the same reconciliation with the same outcome — an unsaved draft is
   * replaced by what is stored.
   */
  const handleRefresh = useCallback((): void => {
    const raw = identityDocs[active]
    setDocs((prev) => ({ ...prev, [active]: { content: raw, original: raw } }))
    toast.show({ tone: 'success', message: t('workspace.resynced') })
  }, [active, identityDocs, t, toast])

  return (
    <main className={cn('bg-bg flex h-full w-full flex-col', pageTopPadding)}>
      {/* Wraps on a phone: Back plus three tabs is wider than 360px, and the
          tabs are the whole navigation of this page — they may not be cut. */}
      <header className="border-border flex flex-wrap items-center gap-2 border-b px-3 py-3">
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

        {/* Where the Changelog page puts its version chip. Laid out with the
            document flow, so in Arabic the tabs run right-to-left from the
            back button without a single mirrored class here. */}
        <div
          role="tablist"
          aria-label={t('customization.title')}
          className={cn(
            'border-border bg-surface inline-flex max-w-full items-center rounded-lg border p-0.5',
            'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          )}
        >
          {DOCS.map(({ key, icon: Icon }) => {
            const selected = key === active
            const dirty = docs[key].content !== docs[key].original
            return (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setActive(key)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  selected ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg'
                )}
              >
                <Icon size={14} />
                <span>{t(`chat.${key}`)}</span>
                {/* The unsaved mark, on the tab rather than only in the row
                    below — a draft left in a tab you navigated away from is
                    exactly the one you can no longer see. */}
                {dirty ? (
                  <span
                    aria-hidden
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      selected ? 'bg-primary-fg' : 'bg-accent'
                    )}
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </header>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-border flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 max-sm:gap-2 max-sm:px-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              {/* A path, so it reads left-to-right in every locale. */}
              <span dir="ltr" className="text-fg font-mono text-sm font-medium">
                {activeDoc.fileName}
              </span>
              {isDirty ? (
                <span className="text-muted text-xs italic">{t('customization.unsaved')}</span>
              ) : null}
            </div>
            {/* What this document is FOR. The page name no longer says it — the
                tab is one word — so the sentence the three separate pages never
                had earns its line here. */}
            <p className="text-muted truncate text-xs">
              {t(`customization.docs.${active}.description`)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleRefresh}
              className={cn(
                'text-muted hover:text-fg inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs',
                'disabled:cursor-not-allowed disabled:opacity-40'
              )}
            >
              <Refresh01Icon size={14} />
              <span>{t('workspace.resync')}</span>
            </button>
            <CopyButton text={state.content} variant="inline" />
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              aria-label={t('workspace.save')}
              title={t('workspace.save')}
              className={cn(
                'text-muted hover:text-fg hover:bg-border/40 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted'
              )}
            >
              <FloppyDiskIcon size={16} />
            </button>
          </div>
        </div>
        {/* `dir="auto"` rather than inheriting the app's direction: these are
            documents, not chrome. An English soul.md stays flush-left while
            the page around it is Arabic, and one written in Arabic gets the
            right-to-left editor it deserves.

            Keyed by document so a tab switch builds a fresh editor. The text
            itself survives the switch (it lives up here), but the undo
            history must not: a Cmd+Z after switching tabs should never reach
            back into another document's edits. */}
        <div dir="auto" className="min-h-0 w-full flex-1">
          <CodeEditor
            key={active}
            value={state.content}
            language="markdown"
            isDark={isDark}
            readOnly={false}
            onChange={handleChange}
            className="h-full w-full"
            spellcheck
          />
        </div>
      </section>
    </main>
  )
}
