/**
 * The PIN lock — the desktop's AuthGate `locked` state, ported shell and all:
 * the avatar header, the bordered card, the wide `••••` PIN field and the red
 * "sign out instead" link behind its confirm modal. Any four digits unlock the
 * demo, so the desktop's wrong-PIN error card has no path to appear here; the
 * demo's hint line sits where it would have.
 */
import { Avatar } from '@/playground/components/common/Avatar'
import { Button } from '@/playground/components/core/Button'
import { Modal } from '@/playground/components/core/Modal'
import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'
import { useDemo, useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { USER } from '@/playground/data/identity'
import { Logout03Icon } from 'hugeicons-react'
import { useEffect, useRef, useState } from 'react'

/** AuthGate's shared field skin, copied verbatim from the desktop. */
const fieldClass = cn(
  'border-border bg-bg text-fg placeholder:text-muted/60 w-full rounded-lg border px-3 py-2.5 text-sm',
  'focus:border-primary/60 outline-none focus-visible:ring-2 focus-visible:ring-accent'
)

/** One wide numeric field for the 4-digit PIN, rendered as spaced digits. */
function PinField({
  value,
  onChange,
  label
}: {
  value: string
  onChange: (next: string) => void
  label: string
}): React.JSX.Element {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <input
      ref={ref}
      type="password"
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      placeholder="••••"
      maxLength={4}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      className={cn(fieldClass, 'text-center text-2xl tracking-[0.6em] font-semibold tabular-nums', 'py-3')}
      dir="ltr"
    />
  )
}

export function LockScreen(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { unlock } = useDemo()
  const demoAction = useDemoAction()
  const [pin, setPin] = useState('')
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  // The desktop hands the PIN to the main process and waits; here the four
  // digits are the whole check, with the same beat of delay so the field
  // reads as "verifying" rather than as a link.
  useEffect(() => {
    if (pin.length === 4) {
      const id = setTimeout(() => unlock(), 250)
      return () => clearTimeout(id)
    }
  }, [pin, unlock])

  // The desktop composes this greeting with a hardcoded Latin comma; Arabic
  // punctuates with ، (U+060C), so the separator follows the locale here
  // rather than the port.
  const comma = i18n.language === 'ar' ? '،' : ','
  const title = t('auth.lock.title', { name: `${comma} ${USER.name.split(' ')[0]}` })

  return (
    <main className="bg-bg flex min-h-full w-full items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <Avatar name={USER.name} size={80} />
          <div className="flex flex-col gap-2">
            <h1 className="text-fg text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
        </header>
        <section className="bg-surface border-border flex w-full flex-col gap-4 rounded-2xl border p-6 shadow-sm dark:shadow-none">
          <PinField value={pin} onChange={setPin} label={t('auth.lock.title', { name: '' })} />
          <p className="text-muted text-center text-xs leading-relaxed">{t('demo.lock.hint')}</p>
          <button
            type="button"
            className={cn(
              'flex cursor-pointer items-center justify-center gap-1.5 text-xs font-medium',
              'text-red-600 underline-offset-2 hover:text-red-700 hover:underline',
              'dark:text-red-400 dark:hover:text-red-300'
            )}
            onClick={() => setConfirmSignOut(true)}
          >
            <Logout03Icon size={14} />
            {t('auth.lock.signOutInstead')}
          </button>
          <Modal
            open={confirmSignOut}
            onClose={() => setConfirmSignOut(false)}
            title={t('profile.signOutTitle')}
            footer={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmSignOut(false)} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setConfirmSignOut(false)
                    demoAction()
                  }}
                  className="flex-1 border border-transparent bg-red-600 text-white shadow-none hover:bg-red-700"
                >
                  {t('profile.signOut')}
                </Button>
              </div>
            }
          >
            <p className="text-muted">{t('profile.signOutBody')}</p>
          </Modal>
        </section>
      </div>
    </main>
  )
}
