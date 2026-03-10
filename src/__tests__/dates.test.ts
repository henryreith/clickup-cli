import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseDate, formatDate } from '../dates.js'

describe('parseDate', () => {
  describe('Unix ms passthrough', () => {
    it('returns Unix ms timestamps as-is', () => {
      expect(parseDate('1742169600000')).toBe(1742169600000)
    })
  })

  describe('named dates', () => {
    it('parses "now"', () => {
      const before = Date.now()
      const result = parseDate('now')
      const after = Date.now()
      expect(result).toBeGreaterThanOrEqual(before)
      expect(result).toBeLessThanOrEqual(after)
    })

    it('parses "today"', () => {
      const result = parseDate('today')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      expect(result).toBe(today.getTime())
    })

    it('parses "tomorrow"', () => {
      const result = parseDate('tomorrow')
      const tomorrow = new Date()
      tomorrow.setHours(0, 0, 0, 0)
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(result).toBe(tomorrow.getTime())
    })

    it('parses "yesterday"', () => {
      const result = parseDate('yesterday')
      const yesterday = new Date()
      yesterday.setHours(0, 0, 0, 0)
      yesterday.setDate(yesterday.getDate() - 1)
      expect(result).toBe(yesterday.getTime())
    })
  })

  describe('relative offsets', () => {
    it('parses +3d', () => {
      const now = Date.now()
      const result = parseDate('+3d')
      // Should be roughly 3 days from now
      const diff = result - now
      expect(diff).toBeGreaterThan(2.9 * 24 * 60 * 60 * 1000)
      expect(diff).toBeLessThan(3.1 * 24 * 60 * 60 * 1000)
    })

    it('parses -1w', () => {
      const now = Date.now()
      const result = parseDate('-1w')
      const diff = now - result
      expect(diff).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000)
      expect(diff).toBeLessThan(7.1 * 24 * 60 * 60 * 1000)
    })

    it('parses +2h', () => {
      const now = Date.now()
      const result = parseDate('+2h')
      const diff = result - now
      expect(diff).toBeGreaterThan(1.9 * 60 * 60 * 1000)
      expect(diff).toBeLessThan(2.1 * 60 * 60 * 1000)
    })

    it('parses -30m', () => {
      const now = Date.now()
      const result = parseDate('-30m')
      const diff = now - result
      expect(diff).toBeGreaterThan(29 * 60 * 1000)
      expect(diff).toBeLessThan(31 * 60 * 1000)
    })
  })

  describe('next day', () => {
    it('parses "next monday"', () => {
      const result = parseDate('next monday')
      const date = new Date(result)
      expect(date.getDay()).toBe(1) // Monday
      expect(result).toBeGreaterThan(Date.now())
    })

    it('parses "next friday"', () => {
      const result = parseDate('next friday')
      const date = new Date(result)
      expect(date.getDay()).toBe(5) // Friday
    })
  })

  describe('ISO 8601', () => {
    it('parses date string', () => {
      const result = parseDate('2026-03-15')
      expect(result).toBeGreaterThan(0)
      const date = new Date(result)
      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(2) // 0-indexed
      expect(date.getDate()).toBe(15)
    })

    it('parses datetime string', () => {
      const result = parseDate('2026-03-15T14:00:00Z')
      const date = new Date(result)
      expect(date.getUTCHours()).toBe(14)
    })
  })

  describe('invalid input', () => {
    it('throws on invalid date', () => {
      expect(() => parseDate('not a date')).toThrow('Invalid date')
    })
  })
})

describe('formatDate', () => {
  it('formats Unix ms to human-readable string', () => {
    // 2026-03-15T14:00:00Z
    const result = formatDate(1773583200000, 'UTC')
    expect(result).toContain('2026')
    expect(result).toContain('03')
    expect(result).toContain('15')
    expect(result).toContain('14:00')
  })

  it('handles timezone', () => {
    const result = formatDate(1773583200000, 'America/New_York')
    expect(result).toContain('2026')
  })
})
