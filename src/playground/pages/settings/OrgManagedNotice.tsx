'use client'

import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'
import { ORG_LOCKED_KEYS } from '@/playground/data/config'
import { Building03Icon } from 'hugeicons-react'

/**
 * What the organization decides, said out loud.
 *
 * The API applies the org's config overlay on every read and forces it again
 * on every write, so a claimed setting IS the org's on this machine no matter
 * what the app does. Enforcement was never the gap — explanation was: an
 * employee would open Settings, change a value, and watch it revert two
 * minutes later with nothing anywhere saying why.
 *
 * It renders nothing while the org claims nothing, which is every deployment
 * until an admin decides otherwise — so the quiet case stays quiet, and the
 * notice appearing is itself the signal that something changed.
 *
 * The desktop shows the config paths verbatim; the playground names each
 * setting in the reader's language (demo.orgKeys) — a prospect reading
 * "safety.blockCredentials" learns nothing, "Block credentials in prompts" does.
 */
/**
 * Whether one setting is the org's. Accepts the exact path or any ancestor,
 * so locking `channels.telegram` covers every control under it without the
 * admin having to enumerate them. A control the org owns renders disabled —
 * the notice above the panels says why.
 */
export function orgOwns(path: string): boolean {
  return ORG_LOCKED_KEYS.some((k) => k === path || path.startsWith(`${k}.`))
}

export function OrgManagedNotice({ className }: { className?: string }): React.JSX.Element | null {
  const { t } = useTranslation()
  const keys = ORG_LOCKED_KEYS
  if (keys.length === 0) return null
  return (
    <section
      className={cn('border-border bg-bg-subtle rounded-xl border p-4', className)}
      aria-label={t('settings.orgManaged.title')}
    >
      <div className="flex items-start gap-3">
        <Building03Icon size={18} className="text-muted mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="text-fg text-sm font-semibold">{t('settings.orgManaged.title')}</h3>
            <span className="text-muted text-xs">
              {keys.length === 1
                ? t('settings.orgManaged.one')
                : t('settings.orgManaged.many', { count: keys.length })}
            </span>
          </div>
          <p className="text-muted mt-1 text-xs leading-relaxed">{t('settings.orgManaged.body')}</p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {keys.map((key) => (
              <li
                key={key}
                title={key}
                className="border-border text-muted max-w-full rounded-md border px-1.5 py-0.5 text-[11px] break-words"
              >
                {t(`demo.orgKeys.${key.replace(/\./g, '_')}`, { defaultValue: key })}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
