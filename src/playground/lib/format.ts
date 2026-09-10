import type { TFunction } from '../i18n'

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—'
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return s === 0 ? `${m}m` : `${m}m ${s}s`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatDurationL(seconds: number | null | undefined, t: TFunction): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—'
  if (seconds < 60) return t('units.seconds', { value: ltrIsolate(Math.ceil(seconds)) })
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    if (s === 0) return t('units.minutes', { value: ltrIsolate(m) })
    return `${t('units.minutes', { value: ltrIsolate(m) })} ${t('units.seconds', { value: ltrIsolate(s) })}`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (m === 0) return t('units.hours', { value: ltrIsolate(h) })
  return `${t('units.hours', { value: ltrIsolate(h) })} ${t('units.minutes', { value: ltrIsolate(m) })}`
}

const BYTE_UNIT_KEYS = [
  'units.bytes',
  'units.kilobytes',
  'units.megabytes',
  'units.gigabytes',
  'units.terabytes'
]

export function formatBytesL(bytes: number | null | undefined, t: TFunction, digits = 1): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—'
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < BYTE_UNIT_KEYS.length - 1) {
    value /= 1024
    unit++
  }
  const precision = unit === 0 ? 0 : digits
  return t(BYTE_UNIT_KEYS[unit], { value: ltrIsolate(value.toFixed(precision)) })
}

export function formatGBL(bytes: number | null | undefined, t: TFunction): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024 ** 3) return formatBytesL(bytes, t, 0)
  return t('units.gigabytes', { value: ltrIsolate(Math.round(bytes / 1024 ** 3)) })
}

export function formatCompact(n: number, locale?: string): string {
  const fmt = (v: number): string => {
    try {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(v)
    } catch {
      return String(Math.round(v * 10) / 10)
    }
  }
  if (n >= 1_000_000_000) return `${fmt(n / 1_000_000_000)}b`
  if (n >= 1_000_000) return `${fmt(n / 1_000_000)}m`
  if (n >= 1_000) return `${fmt(n / 1_000)}k`
  return fmt(n)
}

export function ltrIsolate(value: string | number): string {
  return `⁨${value}⁩`
}

export function formatCost(v: number): string {
  if (v === 0) return '$0'
  if (v < 1) return `$${v.toFixed(4)}`
  return `$${v.toFixed(2)}`
}

/** "3 minutes ago" style stamp in the active locale. */
export function relativeTime(ts: number, locale: string, now: number = Date.now()): string {
  const diff = ts - now
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (abs < 60_000) return rtf.format(Math.round(diff / 1000), 'second')
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute')
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour')
  if (abs < 30 * 86_400_000) return rtf.format(Math.round(diff / 86_400_000), 'day')
  if (abs < 365 * 86_400_000) return rtf.format(Math.round(diff / (30 * 86_400_000)), 'month')
  return rtf.format(Math.round(diff / (365 * 86_400_000)), 'year')
}

export function formatDateTime(ms: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(ms)
}
