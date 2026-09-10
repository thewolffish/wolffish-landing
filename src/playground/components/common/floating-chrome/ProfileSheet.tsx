import { Avatar } from '@/playground/components/common/Avatar'
import { Button } from '@/playground/components/core/Button'
import { Modal } from '@/playground/components/core/Modal'
import { PasswordInput } from '@/playground/components/core/PasswordInput'
import { useToast } from '@/playground/components/core/toast/useToast'
import { cn } from '@/playground/lib/cn'
import { isMac } from '@/playground/lib/platform'
import { useTranslation } from '@/playground/i18n'
import { useDemo } from '@/playground/providers/PlaygroundProvider'
import { ORG_NAME, PROFILE, USER } from '@/playground/data/identity'
import { ImageUpload01Icon, Logout03Icon } from 'hugeicons-react'
import { useEffect, useState } from 'react'

const fieldErrCls = 'border-red-500/70 focus:border-red-500/80 focus-visible:ring-red-500/30'

const fieldClass = cn(
  'border-border bg-bg text-fg placeholder:text-muted/60 w-full rounded-lg border px-3 py-2.5 text-sm',
  'focus:border-primary/60 outline-none focus-visible:ring-2 focus-visible:ring-accent'
)

function FieldError({ text }: { text: string | undefined }): React.JSX.Element | null {
  if (!text) return null
  return (
    <p className="text-xs leading-snug text-red-500 dark:text-red-400" dir="auto">
      {text}
    </p>
  )
}

type FieldErrors = {
  name?: string
  position?: string
  phone?: string
  bio?: string
  currentPw?: string
  newPw?: string
  confirmPw?: string
  currentPin?: string
  newPin?: string
}

/** The user's profile — a slide-over sheet in the conversations sheet's language. */
export function ProfileSheet({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const toast = useToast()
  const { demoAction, demoSaved } = useDemo()

  const [baseline, setBaseline] = useState({
    name: PROFILE.name,
    phone: PROFILE.phone,
    position: PROFILE.position,
    bio: PROFILE.bio
  })
  const [name, setName] = useState(baseline.name)
  const [phone, setPhone] = useState(baseline.phone)
  const [position, setPosition] = useState(baseline.position)
  const [bio, setBio] = useState(baseline.bio)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const dirty =
    name.trim() !== baseline.name.trim() ||
    phone.trim() !== baseline.phone.trim() ||
    position.trim() !== baseline.position.trim() ||
    bio.trim() !== baseline.bio.trim() ||
    currentPw.length > 0 ||
    newPw.length > 0 ||
    confirmPw.length > 0 ||
    currentPin.length > 0 ||
    newPin.length > 0

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !dirty && !confirmSignOut) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, dirty, onClose, confirmSignOut])

  const discard = (): void => {
    setName(baseline.name)
    setPhone(baseline.phone)
    setPosition(baseline.position)
    setBio(baseline.bio)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setCurrentPin('')
    setNewPin('')
    setFieldErrors({})
    onClose()
  }

  const clearField = (key: keyof FieldErrors): void =>
    setFieldErrors((f) => (f[key] ? { ...f, [key]: undefined } : f))

  const saveProfile = (): void => {
    const errors: FieldErrors = {}
    if (name.trim().length === 0) errors.name = t('profile.validation.nameRequired')
    else if (name.trim().length > 200) errors.name = t('profile.validation.nameLong')
    if (position.trim().length > 120) errors.position = t('profile.validation.positionLong')
    if (!/^[+0-9 ()-]*$/.test(phone.trim())) errors.phone = t('profile.validation.phoneFormat')
    else if (phone.trim().length > 32) errors.phone = t('profile.validation.phoneLong')
    if (bio.trim().length > 500) errors.bio = t('profile.validation.bioLong')
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors((f) => ({ ...f, ...errors }))
      return
    }
    setBaseline({ name: name.trim(), phone: phone.trim(), position: position.trim(), bio: bio.trim() })
    demoSaved()
  }

  const changePassword = (): void => {
    const errors: FieldErrors = {}
    if (currentPw.length === 0) errors.currentPw = t('profile.validation.currentRequired')
    if (newPw.length < 10) errors.newPw = t('auth.errors.weak_password')
    if (confirmPw !== newPw) errors.confirmPw = t('auth.change.mismatch')
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors((f) => ({ ...f, ...errors }))
      return
    }
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    toast.show({ message: t('profile.passwordChanged'), tone: 'success' })
  }

  const changePin = (): void => {
    const errors: FieldErrors = {}
    if (currentPin.length !== 4) errors.currentPin = t('auth.errors.pin_format')
    if (newPin.length !== 4) errors.newPin = t('auth.errors.pin_format')
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors((f) => ({ ...f, ...errors }))
      return
    }
    setCurrentPin('')
    setNewPin('')
    toast.show({ message: t('profile.pinChanged'), tone: 'success' })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div aria-hidden onClick={dirty ? undefined : onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('profile.title')}
        className={cn(
          'wf-sheet-panel bg-bg border-border/40 absolute inset-y-0 start-0 flex w-[520px] max-w-[92vw] flex-col border-e'
        )}
      >
        <header className={cn('flex shrink-0 items-center justify-between gap-3 px-5 pb-3', isMac ? 'pt-12' : 'pt-6')}>
          <h2 className="text-fg text-lg font-semibold tracking-tight">{t('profile.title')}</h2>
          {dirty && (
            <button
              type="button"
              onClick={discard}
              className="border-border text-muted hover:text-fg hover:bg-border/40 cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium"
            >
              {t('profile.discard')}
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar name={USER.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="text-fg truncate text-sm font-semibold">{USER.name}</p>
                <p className="text-muted truncate text-xs" dir="ltr">
                  {USER.email}
                </p>
                <p className="text-muted truncate text-xs">
                  {t(`settings.admin.roles.${USER.role}`, { defaultValue: USER.role })} · {ORG_NAME}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium',
                  'border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400',
                  'focus-visible:ring-2 focus-visible:ring-accent'
                )}
              >
                <Logout03Icon size={14} />
                {t('profile.signOut')}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={demoAction}
                  className="border-border text-fg hover:bg-border/40 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ImageUpload01Icon size={14} />
                  {t('profile.uploadPhoto')}
                </button>
              </div>
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                saveProfile()
              }}
            >
              <h3 className="text-muted text-[10px] font-medium tracking-wide uppercase">{t('profile.sectionProfile')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-muted text-xs">{t('profile.name')}</span>
                  <input
                    className={cn(fieldClass, fieldErrors.name && fieldErrCls)}
                    value={name}
                    maxLength={200}
                    onChange={(e) => {
                      setName(e.target.value)
                      clearField('name')
                    }}
                  />
                  <FieldError text={fieldErrors.name} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-muted text-xs">{t('profile.position')}</span>
                  <input
                    className={cn(fieldClass, fieldErrors.position && fieldErrCls)}
                    value={position}
                    maxLength={120}
                    placeholder={t('profile.positionPlaceholder')}
                    onChange={(e) => {
                      setPosition(e.target.value)
                      clearField('position')
                    }}
                  />
                  <FieldError text={fieldErrors.position} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-muted text-xs">{t('profile.email')}</span>
                  <input className={cn(fieldClass, 'opacity-60')} value={USER.email} disabled readOnly dir="ltr" title={t('profile.emailLocked')} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-muted text-xs">{t('profile.phone')}</span>
                  <input
                    className={cn(fieldClass, fieldErrors.phone && fieldErrCls)}
                    value={phone}
                    maxLength={32}
                    placeholder="+966 5x xxx xxxx"
                    inputMode="tel"
                    dir="ltr"
                    onChange={(e) => {
                      setPhone(e.target.value)
                      clearField('phone')
                    }}
                  />
                  <FieldError text={fieldErrors.phone} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-muted text-xs">
                    {t('profile.bio')}
                    <span className="text-muted/60"> · {bio.trim().length}/500</span>
                  </span>
                  <textarea
                    className={cn(fieldClass, 'min-h-20 resize-y leading-relaxed')}
                    value={bio}
                    maxLength={500}
                    placeholder={t('profile.bioPlaceholder')}
                    onChange={(e) => {
                      setBio(e.target.value)
                      clearField('bio')
                    }}
                  />
                  <FieldError text={fieldErrors.bio} />
                </label>
              </div>
              <Button type="submit" className="self-end">
                {t('profile.save')}
              </Button>
            </form>

            <form
              className="border-border/60 flex flex-col gap-4 border-t pt-5"
              onSubmit={(e) => {
                e.preventDefault()
                changePassword()
              }}
            >
              <h3 className="text-muted text-[10px] font-medium tracking-wide uppercase">{t('profile.sectionPassword')}</h3>
              <div className="flex flex-col gap-1.5">
                <PasswordInput
                  value={currentPw}
                  onChange={(v) => {
                    setCurrentPw(v)
                    clearField('currentPw')
                  }}
                  placeholder={t('profile.currentPassword')}
                  autoComplete="current-password"
                  invalid={Boolean(fieldErrors.currentPw)}
                />
                <FieldError text={fieldErrors.currentPw} />
              </div>
              <div className="flex flex-col gap-1.5">
                <PasswordInput
                  value={newPw}
                  onChange={(v) => {
                    setNewPw(v)
                    clearField('newPw')
                  }}
                  placeholder={t('auth.change.newPassword')}
                  autoComplete="new-password"
                  invalid={Boolean(fieldErrors.newPw)}
                />
                <FieldError text={fieldErrors.newPw} />
              </div>
              <div className="flex flex-col gap-1.5">
                <PasswordInput
                  value={confirmPw}
                  onChange={(v) => {
                    setConfirmPw(v)
                    clearField('confirmPw')
                  }}
                  placeholder={t('auth.change.confirmPassword')}
                  autoComplete="new-password"
                  invalid={Boolean(fieldErrors.confirmPw)}
                />
                <FieldError text={fieldErrors.confirmPw} />
              </div>
              <Button type="submit" className="self-end">
                {t('profile.changePassword')}
              </Button>
            </form>

            <form
              className="border-border/60 flex flex-col gap-4 border-t pt-5"
              onSubmit={(e) => {
                e.preventDefault()
                changePin()
              }}
            >
              <h3 className="text-muted text-[10px] font-medium tracking-wide uppercase">{t('profile.sectionPin')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className={cn(fieldClass, 'text-center tracking-[0.4em]', fieldErrors.currentPin && fieldErrCls)}
                    value={currentPin}
                    placeholder={t('profile.currentPin')}
                    onChange={(e) => {
                      setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                      clearField('currentPin')
                    }}
                    dir="ltr"
                  />
                  <FieldError text={fieldErrors.currentPin} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className={cn(fieldClass, 'text-center tracking-[0.4em]', fieldErrors.newPin && fieldErrCls)}
                    value={newPin}
                    placeholder={t('profile.newPin')}
                    onChange={(e) => {
                      setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                      clearField('newPin')
                    }}
                    dir="ltr"
                  />
                  <FieldError text={fieldErrors.newPin} />
                </div>
              </div>
              <Button type="submit" className="self-end">
                {t('profile.changePin')}
              </Button>
            </form>
          </div>
        </div>
      </aside>

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
    </div>
  )
}
