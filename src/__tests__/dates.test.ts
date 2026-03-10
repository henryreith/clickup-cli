import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseDate, formatDate } from '../dates.js'

describe('parseDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set to 2026-03-10T12:00:00.000Z
    vi.setSystemTime(new Date('2026-03-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('parses Unix ms passthrough', () => {
    expect(parseDate('1742169600000')).toBe(1742169600000)
  })

  it('parses "today"', () => {
    const result = parseDate('today')
    const d = new Date(result)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })

  it('parses "tomorrow"', () => {
    const result = parseDate('tomorrow')
    const today = parseDate('today')
    expect(result - today).toBe(24 * 60 * 60 * 1000)
  })

  it('parses "yesterday"', () => {
    const result = parseDate('yesterday')
    const today = parseDate('today')
    expect(today - result).toBe(24 * 60 * 60 * 1000)
  })

  it('parses relative +3d', () => {
    const now = Date.now()
    const result = parseDate('+3d')
    expect(result - now).toBe(3 * 24 * 60 * 60 * 1000)
  })

  it('parses relative -1w', () => {
    const now = Date.now()
    const result = parseDate('-1w')
    expect(now - result).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('parses relative +2h', () => {
    const now = Date.now()
    const result = parseDate('+2h')
    expect(result - now).toBe(2 * 60 * 60 * 1000)
  })

  it('parses relative -30m', () => {
    const now = Date.now()
    const result = parseDate('-30m')
    expect(now - result).toBe(30 * 60 * 1000)
  })

  it('parses "next monday"', () => {
    const result = parseDate('next monday')
    const d = new Date(result)
    expect(d.getDay()).toBe(1) // Monday
    expect(result).toBeGreaterThan(Date.now())
  })

  it('parses ISO 8601 date', () => {
    const result = parseDate('2026-03-15')
    const d = new Date(result)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2) // March (0-indexed)
    expect(d.getDate()).toBe(15)
  })

  it('parses ISO 8601 datetime', () => {
    const result = parseDate('2026-03-15T14:00:00')
    const d = new Date(result)
    expect(d.getFullYear()).toBe(2026)
  })

  it('parses ISO 8601 with offset', () => {
    const result = parseDate('2026-03-15T14:00:00-05:00')
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThan(0)
  })

  it('throws on invalid input', () => {
    expect(() => parseDate('not-a-date')).toThrow('Unable to parse date')
  })
})

describe('formatDate', () => {
  it('formats Unix ms to readable date', () => {
    // 2026-03-15 14:30:00 UTC
    const ms = new Date('2026-03-15T14:30:00Z').getTime()
    const result = formatDate(ms, 'UTC')
    expect(result).toBe('2026-03-15 14:30')
  })

  it('omits seconds when zero', () => {
    const ms = new Date('2026-03-15T14:30:00Z').getTime()
    const result = formatDate(ms, 'UTC')
    expect(result).not.toContain(':00')
  })

  it('includes seconds when nonzero', () => {
    const ms = new Date('2026-03-15T14:30:45Z').getTime()
    const result = formatDate(ms, 'UTC')
    expect(result).toBe('2026-03-15 14:30:45')
  })

  it('works without timezone (local time)', () => {
    const ms = new Date('2026-03-15T14:30:00Z').getTime()
    const result = formatDate(ms)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)
  })
})
