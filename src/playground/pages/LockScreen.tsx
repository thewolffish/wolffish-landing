import { Avatar } from '@/playground/components/common/Avatar'
import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'
import { useDemo } from '@/playground/providers/PlaygroundProvider'
import { USER } from '@/playground/data/identity'
import { useEffect, useRef, useState } from 'react'

/** The PIN lock — the desktop's AuthGate `locked` state. Any four digits unlock the demo. */
export function LockScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const { unlock } = useDemo()
  const [pin, setPin] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (pin.length === 4) {
      const id = setTimeout(() => unlock(), 250)
      return () => clearTimeout(id)
    }
  }, [pin, unlock])

  return (
    <main className="bg-bg flex min-h-full w-full items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <Avatar name={USER.name} size={80} />
          <div className="flex flex-col gap-1">
            <h1 className="text-fg text-2xl font-semibold tracking-tight">{USER.name}</h1>
            <p className="text-muted text-sm">{t('auth.lock.subtitle', { defaultValue: t('demo.lock.subtitle') })}</p>
          </div>
        </header>
        <label className="flex w-full flex-col items-center gap-3">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            aria-label={t('demo.lock.subtitle')}
            dir="ltr"
            className={cn(
              'border-border bg-surface text-fg w-48 rounded-xl border px-4 py-3 text-center text-2xl tracking-[0.6em]',
              'focus:border-primary/60 outline-none focus-visible:ring-2 focus-visible:ring-accent'
            )}
          />
          <span className="text-muted text-xs">{t('demo.lock.hint')}</span>
        </label>
      </div>
    </main>
  )
}
