'use client'

import { useToast } from '@/playground/components/core/toast/useToast'
import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'
import { useDemo, useDemoAction } from '@/playground/providers/PlaygroundProvider'
import type { WeekStartsOn } from '@/playground/data/types'
import { useMemo } from 'react'
import { Avatar } from '@/playground/components/common/Avatar'
import { Building03Icon } from 'hugeicons-react'
import { ORG_NAME, USER } from '@/playground/data/identity'

export function WolffishPanel(): React.JSX.Element {
  const { t } = useTranslation()
  const { show } = useToast()
  const { config, patchConfig } = useDemo()

  const launchAtStartup = config.launchAtStartup
  // The OS login item and the config mirror of it agree on this machine.
  const startupActive = config.launchAtStartup
  const blockCredentials = config.safety.blockCredentials
  const weekStartsOn = config.weekStartsOn
  // Voice replies (default ON): voice prompt in → spoken reply out. Lives in
  // config under tts.voiceReplies but is a PREFERENCE about how Wolffish
  // answers, so its one switch is here — the model-facing <voice_prompts>
  // instructions are included if and only if this is on.
  const voiceReplies = config.tts.voiceReplies
  const savingKey: 'launchAtStartup' | 'blockCredentials' | 'weekStart' | 'voiceReplies' | null =
    null

  const onChangeLaunchAtStartup = (next: boolean): void => {
    if (next === launchAtStartup) return
    patchConfig({ launchAtStartup: next })
    if (next) show({ message: t('settings.wolffish.launchAtStartup.enabledToast'), tone: 'success' })
  }

  const onChangeBlockCredentials = (next: boolean): void => {
    if (next === blockCredentials) return
    patchConfig((c) => ({ ...c, safety: { ...c.safety, blockCredentials: next } }))
  }

  const onChangeVoiceReplies = (next: boolean): void => {
    if (next === voiceReplies) return
    patchConfig((c) => ({ ...c, tts: { ...c.tts, voiceReplies: next } }))
  }

  const onChangeWeekStart = (next: WeekStartsOn): void => {
    if (next === weekStartsOn) return
    patchConfig({ weekStartsOn: next })
  }

  return (
    <div className="flex min-h-full w-full items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-fg text-2xl font-semibold tracking-tight">
            {t('settings.wolffish.title')}
          </h1>
          <p className="text-muted text-sm leading-relaxed">{t('settings.wolffish.subtitle')}</p>
        </header>

        <AccountCard />

        <section className="bg-surface border-border flex flex-col gap-6 rounded-2xl border p-6 max-sm:p-4">
          <StartupSetting
            value={launchAtStartup}
            active={startupActive}
            onChange={onChangeLaunchAtStartup}
            disabled={savingKey === 'launchAtStartup'}
          />
          <div className="border-border/60 border-t" />
          <SettingToggle
            label={t('settings.wolffish.blockCredentials.label')}
            description={t('settings.wolffish.blockCredentials.description')}
            value={blockCredentials}
            onChange={onChangeBlockCredentials}
            disabled={savingKey === 'blockCredentials'}
          />

          <div className="border-border/60 border-t" />
          <SettingToggle
            label={t('settings.wolffish.voiceReplies.label')}
            description={t('settings.wolffish.voiceReplies.description')}
            value={voiceReplies}
            onChange={onChangeVoiceReplies}
            disabled={savingKey === 'voiceReplies'}
          />
          <div className="border-border/60 border-t" />
          <WeekStartChoice
            value={weekStartsOn}
            onChange={onChangeWeekStart}
            disabled={savingKey === 'weekStart'}
          />
        </section>
      </div>
    </div>
  )
}

function WeekStartChoice({
  value,
  onChange,
  disabled
}: {
  value: WeekStartsOn
  onChange: (next: WeekStartsOn) => void
  disabled?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const options = useMemo<Array<{ value: WeekStartsOn; label: string }>>(
    () => [
      { value: 0, label: t('settings.wolffish.weekStartsOn.sunday') },
      { value: 1, label: t('settings.wolffish.weekStartsOn.monday') }
    ],
    [t]
  )
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
        <span className="text-fg text-sm font-medium">
          {t('settings.wolffish.weekStartsOn.label')}
        </span>
        <div
          role="tablist"
          className="border-border bg-bg/40 inline-flex shrink-0 items-center rounded-lg border p-0.5"
        >
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                role="tab"
                type="button"
                disabled={disabled}
                aria-selected={active}
                onClick={() => onChange(opt.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  active
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-muted hover:text-fg cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-muted text-xs leading-relaxed">
        {t('settings.wolffish.weekStartsOn.description')}
      </p>
    </div>
  )
}

function SettingToggle({
  label,
  description,
  value,
  onChange,
  disabled
}: {
  label: string
  description: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const options = useMemo(
    () => [
      { value: false, label: t('settings.wolffish.toggle.off') },
      { value: true, label: t('settings.wolffish.toggle.on') }
    ],
    [t]
  )
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
        <span className="text-fg text-sm font-medium">{label}</span>
        <div
          role="tablist"
          className="border-border bg-bg/40 inline-flex shrink-0 items-center rounded-lg border p-0.5"
        >
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={String(opt.value)}
                role="tab"
                type="button"
                disabled={disabled}
                aria-selected={active}
                onClick={() => onChange(opt.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  active
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-muted hover:text-fg cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-muted text-xs leading-relaxed">{description}</p>
    </div>
  )
}

function StartupSetting({
  value,
  active,
  onChange,
  disabled
}: {
  value: boolean
  active: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const options = useMemo(
    () => [
      { value: false, label: t('settings.wolffish.toggle.off') },
      { value: true, label: t('settings.wolffish.toggle.on') }
    ],
    [t]
  )
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-fg text-sm font-medium">
            {t('settings.wolffish.launchAtStartup.label')}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              active
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            )}
          >
            {active
              ? t('settings.wolffish.launchAtStartup.active')
              : t('settings.wolffish.launchAtStartup.inactive')}
          </span>
        </div>
        <div
          role="tablist"
          className="border-border bg-bg/40 inline-flex shrink-0 items-center rounded-lg border p-0.5"
        >
          {options.map((opt) => {
            const isActive = opt.value === value
            return (
              <button
                key={String(opt.value)}
                role="tab"
                type="button"
                disabled={disabled}
                aria-selected={isActive}
                onClick={() => onChange(opt.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  isActive
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-muted hover:text-fg cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-muted text-xs leading-relaxed">
        {t('settings.wolffish.launchAtStartup.description')}
      </p>
    </div>
  )
}

/**
 * Who this device is signed in as, and the way out. The session (and its
 * tokens) live in the main process; this card only renders the redacted
 * state and calls signOut — which drops every surface back to the gate.
 */
function AccountCard(): React.JSX.Element | null {
  const { t } = useTranslation()
  const signOut = useDemoAction()
  const busy = false
  return (
    <section className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-6 max-sm:p-4">
      <h2 className="text-fg text-sm font-semibold">{t('settings.wolffish.account.title')}</h2>
      <div className="flex items-center gap-3 max-sm:flex-wrap">
        <Avatar name={USER.name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-fg truncate text-sm font-semibold">{USER.name}</p>
          <p className="text-muted truncate text-xs" dir="ltr">
            {USER.email}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 max-sm:w-full max-sm:justify-start">
          <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
            {t(`settings.admin.roles.${USER.role}`, { defaultValue: USER.role })}
          </span>
          {ORG_NAME ? (
            <span className="border-border bg-border/30 text-fg inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
              <Building03Icon size={11} className="text-muted shrink-0" />
              {ORG_NAME}
            </span>
          ) : null}
        </div>
      </div>
      <div className="border-border/60 flex items-center justify-between gap-4 border-t pt-4">
        <p className="text-muted flex-1 text-xs leading-relaxed">
          {t('settings.wolffish.account.signOutDescription')}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={signOut}
          className="border-border text-fg hover:bg-border/40 shrink-0 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {t('settings.wolffish.account.signOut')}
        </button>
      </div>
    </section>
  )
}
