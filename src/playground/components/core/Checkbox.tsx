import { cn } from '@/playground/lib/cn'
import { Tick02Icon } from 'hugeicons-react'
import { forwardRef, type InputHTMLAttributes } from 'react'

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'checked' | 'defaultChecked'
> & {
  checked: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { checked, disabled = false, className, ...rest },
  ref
) {
  return (
    <span className="relative inline-flex shrink-0">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className={cn(
          'peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0',
          'disabled:cursor-not-allowed'
        )}
        {...rest}
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded-sm border',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg',
          checked ? 'bg-primary border-primary text-primary-fg' : 'bg-bg border-border',
          disabled ? 'opacity-50' : !checked && 'peer-hover:border-muted',
          className
        )}
      >
        {checked && <Tick02Icon size={12} strokeWidth={3} />}
      </span>
    </span>
  )
})
