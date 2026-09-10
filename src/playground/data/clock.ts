/**
 * The playground's clock. Every demo timestamp is expressed relative to the
 * moment the playground loads, so the conversations sheet always groups a
 * fresh "Today" and "Yesterday", the automations show a real next run, and
 * the usage charts end on the current day — whichever day someone opens it.
 */
export const NOW: number = Date.now()

const DAY = 86_400_000

/** A wall-clock moment `days` days ago at the given local time. */
export function at(daysAgo: number, hh: number, mm = 0, ss = 0): number {
  const d = new Date(NOW - daysAgo * DAY)
  d.setHours(hh, mm, ss, 0)
  // Never in the future: a "today at 17:30" opened at 09:00 slides back a day.
  if (d.getTime() > NOW) d.setDate(d.getDate() - 1)
  return d.getTime()
}

export function minutesAgo(minutes: number): number {
  return NOW - minutes * 60_000
}

export function hoursAgo(hours: number): number {
  return NOW - hours * 3_600_000
}

export function daysAgo(days: number): number {
  return NOW - days * DAY
}

export function isoDay(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function iso(ms: number): string {
  return new Date(ms).toISOString()
}

/** Deterministic pseudo-random draws — FNV-1a → xorshift32, the house PRNG. */
export function drawer(seedText: string): () => number {
  let h = 0x811c9dc5
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  let state = h || 0x9e3779b9
  return () => {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0xffffffff
  }
}
