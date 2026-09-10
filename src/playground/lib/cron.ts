/**
 * Heartbeat schedule grammar — a port of the desktop's Heartbeat.tsx parsers
 * (parseSchedule / nextCronMs), so the automations page shows exactly the
 * jobs the brainstem would register, with the same next-run arithmetic.
 */

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

export type ParsedSchedule = { type: string; cron: string | null; atMs?: number }

export function parseSchedule(heading: string): ParsedSchedule | null {
  if (/^Startup$/i.test(heading)) return { type: 'startup', cron: null }

  const once = /^Once\s*\((\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})\)$/i.exec(heading)
  if (once) {
    const y = Number(once[1])
    const mo = Number(once[2])
    const d = Number(once[3])
    const hh = Number(once[4])
    const mi = Number(once[5])
    const dt = new Date(y, mo - 1, d, hh, mi, 0, 0)
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() !== mo - 1 ||
      dt.getDate() !== d ||
      dt.getHours() !== hh ||
      dt.getMinutes() !== mi
    ) {
      return null
    }
    return { type: 'once', cron: null, atMs: dt.getTime() }
  }

  const every = /^Every\s*\((\d+)(m|h)\)$/i.exec(heading)
  if (every) {
    const n = Number(every[1])
    return {
      type: 'every',
      cron: every[2].toLowerCase() === 'm' ? `*/${n} * * * *` : `0 */${n} * * *`
    }
  }

  const hourly = /^Hourly\s*\(:?(\d{1,2})\)$/i.exec(heading)
  if (hourly) return { type: 'hourly', cron: `${Number(hourly[1])} * * * *` }

  const daily = /^(?:Nightly|Daily)\s*\((\d{1,2}):(\d{2})\)$/i.exec(heading)
  if (daily) return { type: 'daily', cron: `${Number(daily[2])} ${Number(daily[1])} * * *` }

  const weekday = /^Weekday\s*\((\d{1,2}):(\d{2})\)$/i.exec(heading)
  if (weekday)
    return { type: 'weekday', cron: `${Number(weekday[2])} ${Number(weekday[1])} * * 1-5` }

  const weekly =
    /^Weekly\s*\((Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(\d{1,2}):(\d{2})\)/i.exec(
      heading
    )
  if (weekly)
    return {
      type: 'weekly',
      cron: `${Number(weekly[3])} ${Number(weekly[2])} * * ${DAY_MAP[weekly[1].toLowerCase()] ?? 0}`
    }

  const monthly = /^Monthly\s*\((\d{1,2})\s+(\d{1,2}):(\d{2})\)$/i.exec(heading)
  if (monthly)
    return {
      type: 'monthly',
      cron: `${Number(monthly[3])} ${Number(monthly[2])} ${Number(monthly[1])} * *`
    }

  const cronMatch = /^Cron\s*\((.+)\)$/i.exec(heading)
  if (cronMatch) return { type: 'cron', cron: cronMatch[1].trim() }

  return null
}

function parseCronField(field: string, min: number, max: number): number[] | null {
  const out = new Set<number>()
  for (const part of field.split(',')) {
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part.trim())
    if (!m) return null
    const step = m[2] ? Number(m[2]) : 1
    if (step < 1) return null
    let lo: number
    let hi: number
    if (m[1] === '*') {
      lo = min
      hi = max
    } else if (m[1].includes('-')) {
      const [a, b] = m[1].split('-')
      lo = Number(a)
      hi = Number(b)
    } else {
      lo = Number(m[1])
      hi = m[2] ? max : lo
    }
    if (lo < min || hi > max || lo > hi) return null
    for (let v = lo; v <= hi; v += step) out.add(v)
  }
  return out.size > 0 ? [...out].sort((a, b) => a - b) : null
}

export function nextCronMs(expr: string, nowMs: number): number | null {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const minutes = parseCronField(parts[0], 0, 59)
  const hours = parseCronField(parts[1], 0, 23)
  const doms = parseCronField(parts[2], 1, 31)
  const months = parseCronField(parts[3], 1, 12)
  const dowsRaw = parseCronField(parts[4], 0, 7)
  if (!minutes || !hours || !doms || !months || !dowsRaw) return null
  const dows = new Set(dowsRaw.map((d) => d % 7))
  const domAny = parts[2] === '*'
  const dowAny = parts[4] === '*'
  const base = new Date(nowMs)
  for (let dayOffset = 0; dayOffset <= 4 * 366; dayOffset++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset)
    if (!months.includes(day.getMonth() + 1)) continue
    const domOk = doms.includes(day.getDate())
    const dowOk = dows.has(day.getDay())
    const dayOk = domAny && dowAny ? true : domAny ? dowOk : dowAny ? domOk : domOk || dowOk
    if (!dayOk) continue
    for (const h of hours) {
      for (const m of minutes) {
        const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime()
        if (t > nowMs) return t
      }
    }
  }
  return null
}

/**
 * One `## heading` block of heartbeat.md — the schedule, the optional
 * `mode:` / `icon:` / `name:` / `project:` marker lines, and the prompt body.
 * Commented-out blocks (inside `<!-- -->`) are skipped, exactly as the
 * brainstem skips them.
 */
export type HeartbeatBlock = {
  label: string
  name: string | null
  mode: 'single' | 'workflow' | null
  icon: string | null
  projectId: string | null
  files: string[]
  directories: string[]
  body: string
}

export function parseHeartbeatBlocks(markdown: string): HeartbeatBlock[] {
  const stripped = markdown.replace(/<!--[\s\S]*?-->/g, '')
  const lines = stripped.split('\n')
  const blocks: HeartbeatBlock[] = []
  let current: HeartbeatBlock | null = null
  let bodyLines: string[] = []
  const flush = (): void => {
    if (!current) return
    const markers = { ...current }
    const body: string[] = []
    let inHead = true
    for (const line of bodyLines) {
      const trimmed = line.trim()
      if (inHead) {
        if (trimmed === '') {
          if (body.length === 0) continue
        }
        const m = /^(mode|icon|name|project|file|dir):\s*(.+)$/.exec(trimmed)
        if (m) {
          const [, key, value] = m
          if (key === 'mode') markers.mode = value === 'workflow' ? 'workflow' : 'single'
          else if (key === 'icon') markers.icon = value.trim()
          else if (key === 'name') markers.name = value.trim()
          else if (key === 'project') markers.projectId = value.trim()
          else if (key === 'file') markers.files = [...markers.files, value.trim()]
          else if (key === 'dir') markers.directories = [...markers.directories, value.trim()]
          continue
        }
        inHead = false
      }
      body.push(line)
    }
    blocks.push({ ...markers, body: body.join('\n').trim() })
  }
  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading) {
      flush()
      current = {
        label: heading[1].trim(),
        name: null,
        mode: null,
        icon: null,
        projectId: null,
        files: [],
        directories: [],
        body: ''
      }
      bodyLines = []
      continue
    }
    if (current) bodyLines.push(line)
  }
  flush()
  return blocks.filter((b) => parseSchedule(b.label) !== null)
}
