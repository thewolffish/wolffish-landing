'use client'
import { Button } from '@/playground/components/core/Button'
import { EditorSheet } from '@/playground/components/core/EditorSheet'
import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'
import type { AdminRole } from '@/playground/data/types'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { Mail01Icon } from 'hugeicons-react'
import { useId, useState } from 'react'

/**
 * Adding a person — a trailing-edge sheet in the app's own editor language
 * (EditorSheet: same width and motion as the profile and conversations
 * sheets), because a centred dialog had nowhere to put the one thing this
 * form owes the admin: an explanation of what pressing the button actually
 * sends, and to whom.
 *
 * Role leads the form because it is the decision, not the detail: it
 * changes what the person can do the moment they sign in, while name and
 * email are transcription.
 *
 * The form is real here — the role picker, the fields, the readiness check,
 * the dirty guard that refuses a quiet dismissal, Enter-to-submit. Only the
 * send is not: nobody is invited from a replica, so the submit is one toast
 * and the sheet stays where it was.
 */

const ROLES: AdminRole[] = ['employee', 'support', 'admin']

const fieldClass = cn(
  'border-border bg-bg text-fg placeholder:text-muted/60 w-full rounded-lg border px-3 py-2.5 text-sm',
  'focus:border-primary/60 outline-none focus-visible:ring-2 focus-visible:ring-accent'
)

export function InviteSheet({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const demoAction = useDemoAction()
  // The send button lives in the sheet's pinned footer, outside the <form>.
  // Owning it through `form=` rather than an onClick keeps it the form's
  // default submit button, which is what makes Enter in either field send
  // the invitation.
  const formId = useId()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('employee')

  const ready = name.trim().length > 0 && email.trim().length > 3
  // Anything typed or picked. While this is true the sheet refuses every
  // quiet dismissal — backdrop, Escape and the header's X are all gone — so
  // the only way out is Cancel, which says what it does.
  const dirty = name.trim() !== '' || email.trim() !== '' || role !== 'employee'

  const close = (): void => {
    setName('')
    setEmail('')
    setRole('employee')
    onClose()
  }

  return (
    <EditorSheet
      open={open}
      onClose={close}
      dismissable={!dirty}
      closable={!dirty}
      title={t('settings.admin.invite.title')}
      footer={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={formId} size="lg" className="flex-1" disabled={!ready}>
            {t('settings.admin.invite.submit')}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!ready) return
          demoAction()
        }}
      >
        {/* Role first: the only field that changes what they can do. */}
        <div className="flex flex-col gap-2">
          <span className="text-fg text-sm font-medium">{t('settings.admin.invite.role')}</span>
          <div
            role="tablist"
            className="border-border bg-bg/40 grid w-full grid-cols-3 items-center rounded-lg border p-0.5"
          >
            {ROLES.map((r) => (
              <button
                key={r}
                role="tab"
                type="button"
                aria-selected={role === r}
                onClick={() => setRole(r)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium',
                  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  role === r
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-muted hover:text-fg cursor-pointer'
                )}
              >
                {t(`settings.admin.roles.${r}`)}
              </button>
            ))}
          </div>
          <p className="text-muted text-xs leading-relaxed">
            {t(`settings.admin.invite.roleHint.${role}`)}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-sm font-medium">{t('settings.admin.invite.name')}</span>
          <input
            value={name}
            autoFocus
            placeholder={t('settings.admin.invite.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-sm font-medium">{t('settings.admin.invite.email')}</span>
          <input
            value={email}
            type="email"
            dir="ltr"
            placeholder={t('settings.admin.invite.emailPlaceholder')}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
          <span className="text-muted text-xs leading-relaxed">
            {t('settings.admin.invite.emailHint')}
          </span>
        </label>

        <HowItWorksCard />
      </form>
    </EditorSheet>
  )
}

/** The three steps, once, where the admin is deciding to send them. */
function HowItWorksCard(): React.JSX.Element {
  const { t } = useTranslation()
  const steps = ['send', 'enter', 'secure'] as const
  return (
    <section className="border-border bg-bg/40 flex flex-col gap-3 rounded-xl border p-4">
      <header className="flex items-center gap-2">
        <Mail01Icon size={14} className="text-muted shrink-0" />
        <h3 className="text-fg text-xs font-semibold">{t('settings.admin.invite.how.title')}</h3>
      </header>
      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5">
            <span className="border-border text-muted mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium tabular-nums">
              {i + 1}
            </span>
            <span className="text-muted text-xs leading-relaxed">
              {t(`settings.admin.invite.how.${step}`)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-muted/80 text-[11px] leading-relaxed">
        {t('settings.admin.invite.how.footer')}
      </p>
    </section>
  )
}
