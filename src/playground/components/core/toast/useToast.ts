import { createContext, useContext } from 'react'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export type ToastInput = {
  message: string
  tone?: ToastTone
  durationMs?: number
  sticky?: boolean
  placement?: 'top' | 'bottom'
}

export type ToastRecord = ToastInput & { id: number }

export type ToastContextValue = {
  show: (input: ToastInput) => number
  dismiss: (id: number) => void
  /** The live list, for the viewport. */
  toasts: ToastRecord[]
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
