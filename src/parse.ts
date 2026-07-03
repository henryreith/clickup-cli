import { parseDate } from './dates.js'

// Commander option coercion helpers. Passing parseInt directly to .option()
// is a footgun: Commander calls the coercion as fn(value, previous), so the
// previous value becomes the radix, and NaN flows through silently.

export function fail(message: string): never {
  process.stderr.write(`Error: ${message}\n`)
  process.exit(2)
}

export function parseIntStrict(value: string, flag: string): number {
  const num = parseInt(value, 10)
  if (isNaN(num)) fail(`${flag} must be a number, got "${value}"`)
  return num
}

export function parseFloatStrict(value: string, flag: string): number {
  const num = parseFloat(value)
  if (isNaN(num)) fail(`${flag} must be a number, got "${value}"`)
  return num
}

export function parseDateStrict(value: string, flag: string): number {
  try {
    return parseDate(value)
  } catch {
    fail(`${flag} must be a date (ISO 8601, relative like +3d, or Unix ms), got "${value}"`)
  }
}

export function parseBoolStrict(value: string, flag: string): boolean {
  if (value === 'true') return true
  if (value === 'false') return false
  fail(`${flag} must be "true" or "false", got "${value}"`)
}

export function intArg(flag: string): (value: string) => number {
  return (value: string): number => parseIntStrict(value, flag)
}

export function enumIntArg(flag: string, allowed: number[]): (value: string) => number {
  return (value: string): number => {
    const num = parseInt(value, 10)
    if (isNaN(num) || !allowed.includes(num)) {
      fail(`${flag} must be one of: ${allowed.join(', ')}`)
    }
    return num
  }
}
