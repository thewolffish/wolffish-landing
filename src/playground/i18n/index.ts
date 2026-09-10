/**
 * The playground's translator — a tiny i18next-compatible lookup over the
 * desktop's own locale files (copied verbatim from
 * apps/desktop/src/renderer/src/lib/i18n/locales) plus the playground's own
 * `demo.*` strings. Same key paths, same `{{var}}` interpolation, same
 * `_one` / `_other` plural suffixes and `returnObjects` arrays the desktop's
 * react-i18next calls rely on, so a page ported from the desktop keeps its
 * `t('chat.newChat')` lines untouched.
 */
import ar from './ar.json'
import en from './en.json'
import { DEMO_STRINGS } from './demo'
import { createContext, useContext } from 'react'

export type SupportedLocale = 'en' | 'ar'
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'ar']
export const RTL_LOCALES: ReadonlySet<SupportedLocale> = new Set(['ar'])

type Tree = { [key: string]: Tree | string | string[] }

const RESOURCES: Record<SupportedLocale, Tree> = {
  en: { ...(en as Tree), demo: DEMO_STRINGS.en as unknown as Tree },
  ar: { ...(ar as Tree), demo: DEMO_STRINGS.ar as unknown as Tree }
}

export type TOptions = Record<string, unknown> & {
  count?: number
  returnObjects?: boolean
  defaultValue?: unknown
}

export type TFunction = {
  (key: string, options?: TOptions): string
}

/**
 * i18next's `deepFind`, not a plain `split('.')` walk — because the desktop's
 * locale files put dots INSIDE leaf keys: `audit.actions` holds `"user.invite"`
 * and `timeline.event` holds `"tool.called"` as single keys. A naive walk looks
 * for a `user` object under `actions`, finds nothing, and the UI falls back to
 * printing the raw id ("user.invite"). So at every level, try the longest run
 * of remaining segments first and shorten until something matches — exactly
 * what i18next does, which is why those strings render on the desktop.
 */
function lookup(tree: Tree, path: string): Tree | string | string[] | undefined {
  const direct = tree[path]
  if (direct !== undefined) return direct

  const parts = path.split('.')
  let node: Tree | string | string[] | undefined = tree
  let i = 0
  while (i < parts.length) {
    if (node === undefined || typeof node === 'string' || Array.isArray(node)) return undefined
    const here: Tree = node
    let next: Tree | string | string[] | undefined
    let consumed = 0
    for (let j = parts.length; j > i; j--) {
      const candidate = here[parts.slice(i, j).join('.')]
      if (candidate !== undefined) {
        next = candidate
        consumed = j - i
        break
      }
    }
    if (consumed === 0) return undefined
    node = next
    i += consumed
  }
  return node
}

function pluralSuffix(locale: SupportedLocale, count: number): string {
  try {
    return new Intl.PluralRules(locale).select(count)
  } catch {
    return count === 1 ? 'one' : 'other'
  }
}

function interpolate(template: string, options?: TOptions): string {
  if (!options) return template
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (whole, name: string) => {
    const value = options[name]
    if (value === undefined || value === null) return whole
    return String(value)
  })
}

export function translate(locale: SupportedLocale, key: string, options?: TOptions): unknown {
  const trees = [RESOURCES[locale], RESOURCES.en]
  for (const tree of trees) {
    let node: Tree | string | string[] | undefined
    if (options && typeof options.count === 'number') {
      const suffix = pluralSuffix(locale, options.count)
      node = lookup(tree, `${key}_${suffix}`)
      if (node === undefined && suffix !== 'other') node = lookup(tree, `${key}_other`)
      if (node === undefined) node = lookup(tree, key)
    } else {
      node = lookup(tree, key)
    }
    if (node === undefined) continue
    if (options?.returnObjects) return node
    if (typeof node === 'string') return interpolate(node, options)
    if (Array.isArray(node)) return node
    return node
  }
  if (options && 'defaultValue' in options) return options.defaultValue
  return key
}

export function makeT(locale: SupportedLocale): TFunction {
  return ((key: string, options?: TOptions) => translate(locale, key, options)) as TFunction
}

export const LocaleContext = createContext<{
  locale: SupportedLocale
  setLocale: (next: SupportedLocale) => void
} | null>(null)

export function useLocale(): { locale: SupportedLocale; setLocale: (next: SupportedLocale) => void } {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within the playground')
  return ctx
}

/**
 * The desktop's `useTranslation()` shape, so ported components keep their
 * `const { t } = useTranslation()` line. `t` is re-created when the locale
 * flips, which is exactly what invalidates the memoized rows that key on it.
 */
export function useTranslation(): { t: TFunction; i18n: { language: SupportedLocale } } {
  // Tolerant of a missing provider: the toast layer mounts OUTSIDE the
  // playground provider (the provider itself shows toasts), so its labels
  // fall back to English instead of throwing before the app has a locale.
  const ctx = useContext(LocaleContext)
  const locale = ctx?.locale ?? 'en'
  return { t: makeT(locale), i18n: { language: locale } }
}
