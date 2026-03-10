const RELATIVE_OFFSET_RE = /^([+-]\d+)([dwmh])$/
const UNIX_MS_RE = /^\d{13,}$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export function parseDate(input: string): number {
  const raw = input.trim()
  const lower = raw.toLowerCase()

  // Unix ms passthrough
  if (UNIX_MS_RE.test(raw)) {
    return parseInt(raw, 10)
  }

  // Named relative dates
  const now = new Date()
  switch (lower) {
    case 'today': {
      return startOfDay(now).getTime()
    }
    case 'tomorrow': {
      const d = startOfDay(now)
      d.setDate(d.getDate() + 1)
      return d.getTime()
    }
    case 'yesterday': {
      const d = startOfDay(now)
      d.setDate(d.getDate() - 1)
      return d.getTime()
    }
  }

  // Relative offset: +3d, -1w, +2h, -30m
  const offsetMatch = RELATIVE_OFFSET_RE.exec(lower)
  if (offsetMatch) {
    const amount = parseInt(offsetMatch[1]!, 10)
    const unit = offsetMatch[2]!
    const ms = unitToMs(unit, amount)
    return now.getTime() + ms
  }

  // Named day: "next monday", "next friday"
  if (lower.startsWith('next ')) {
    const dayName = lower.slice(5)
    const dayIndex = DAY_NAMES.indexOf(dayName as typeof DAY_NAMES[number])
    if (dayIndex !== -1) {
      const today = now.getDay()
      let daysAhead = dayIndex - today
      if (daysAhead <= 0) daysAhead += 7
      const target = startOfDay(now)
      target.setDate(target.getDate() + daysAhead)
      return target.getTime()
    }
  }

  // ISO 8601 date only
  if (ISO_DATE_RE.test(raw)) {
    const d = new Date(raw + 'T00:00:00')
    if (!isNaN(d.getTime())) return d.getTime()
  }

  // ISO 8601 datetime (with or without offset)
  if (ISO_DATETIME_RE.test(raw)) {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d.getTime()
  }

  throw new Error(`Unable to parse date: "${input}"`)
}

export function formatDate(unixMs: number, timezone?: string): string {
  const date = new Date(unixMs)

  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      const parts = formatter.formatToParts(date)
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
      const seconds = get('second')
      const timePart = seconds === '00' ? `${get('hour')}:${get('minute')}` : `${get('hour')}:${get('minute')}:${seconds}`
      return `${get('year')}-${get('month')}-${get('day')} ${timePart}`
    } catch {
      // Fall through to default formatting
    }
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = date.getSeconds()

  const timePart = seconds === 0 ? `${hours}:${minutes}` : `${hours}:${minutes}:${String(seconds).padStart(2, '0')}`
  return `${year}-${month}-${day} ${timePart}`
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function unitToMs(unit: string, amount: number): number {
  switch (unit) {
    case 'm':
      return amount * 60 * 1000
    case 'h':
      return amount * 60 * 60 * 1000
    case 'd':
      return amount * 24 * 60 * 60 * 1000
    case 'w':
      return amount * 7 * 24 * 60 * 60 * 1000
    default:
      return 0
  }
}
