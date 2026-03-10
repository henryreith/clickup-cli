const RELATIVE_OFFSET_RE = /^([+-])(\d+)([dwmhM])$/
const UNIX_MS_RE = /^\d{13,}$/
const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export function parseDate(input: string, timezone?: string): number {
  const trimmed = input.trim().toLowerCase()

  // Unix ms passthrough
  if (UNIX_MS_RE.test(trimmed)) {
    return parseInt(trimmed, 10)
  }

  // Named relative dates
  const now = new Date()
  switch (trimmed) {
    case 'now':
      return now.getTime()
    case 'today':
      return startOfDay(now).getTime()
    case 'tomorrow':
      return addDays(startOfDay(now), 1).getTime()
    case 'yesterday':
      return addDays(startOfDay(now), -1).getTime()
  }

  // Relative offset: +3d, -1w, +2h, -30m
  const offsetMatch = trimmed.match(RELATIVE_OFFSET_RE)
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? 1 : -1
    const amount = parseInt(offsetMatch[2], 10) * sign
    const unit = offsetMatch[3]
    return applyOffset(now, amount, unit).getTime()
  }

  // "next monday", "next friday", etc.
  if (trimmed.startsWith('next ')) {
    const dayName = trimmed.slice(5)
    const dayIndex = DAY_NAMES.indexOf(dayName)
    if (dayIndex !== -1) {
      const today = now.getDay()
      let daysUntil = dayIndex - today
      if (daysUntil <= 0) daysUntil += 7
      return addDays(startOfDay(now), daysUntil).getTime()
    }
  }

  // ISO 8601 date or datetime
  const parsed = new Date(input.trim())
  if (!isNaN(parsed.getTime())) {
    return parsed.getTime()
  }

  throw new Error(
    `Invalid date: "${input}". Expected: ISO 8601 date, relative date (+3d, tomorrow), or Unix ms timestamp`,
  )
}

export function formatDate(unixMs: number, timezone?: string): string {
  const date = new Date(unixMs)
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
    if (timezone) {
      options.timeZone = timezone
    }
    const formatter = new Intl.DateTimeFormat('en-CA', options)
    const parts = formatter.formatToParts(date)
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? ''
    const year = get('year')
    const month = get('month')
    const day = get('day')
    const hour = get('hour')
    const minute = get('minute')

    const seconds = date.getSeconds()
    if (seconds !== 0) {
      return `${year}-${month}-${day} ${hour}:${minute}:${String(seconds).padStart(2, '0')}`
    }
    return `${year}-${month}-${day} ${hour}:${minute}`
  } catch {
    return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function applyOffset(date: Date, amount: number, unit: string): Date {
  const d = new Date(date)
  switch (unit) {
    case 'm':
      d.setMinutes(d.getMinutes() + amount)
      break
    case 'h':
      d.setHours(d.getHours() + amount)
      break
    case 'd':
      d.setDate(d.getDate() + amount)
      break
    case 'w':
      d.setDate(d.getDate() + amount * 7)
      break
    case 'M':
      d.setMonth(d.getMonth() + amount)
      break
  }
  return d
}
