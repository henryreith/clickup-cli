import { describe, it, expect } from 'vitest'
import { ClickUpError, parseApiError, mapToExitCode, EXIT_CODES } from '../errors.js'

describe('ClickUpError', () => {
  it('creates error with all properties', () => {
    const err = new ClickUpError('test message', 404, 'ITEM_015', { err: 'test' })
    expect(err.message).toBe('test message')
    expect(err.status).toBe(404)
    expect(err.ecode).toBe('ITEM_015')
    expect(err.body).toEqual({ err: 'test' })
    expect(err.name).toBe('ClickUpError')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('parseApiError', () => {
  it('extracts err and ECODE from response body', () => {
    const body = { err: 'Task not found', ECODE: 'ITEM_015' }
    const error = parseApiError(body, 404)
    expect(error.ecode).toBe('ITEM_015')
    expect(error.status).toBe(404)
    expect(error.message).toBe('Task not found. Check the task ID.')
  })

  it('uses ECODE message over raw err when known', () => {
    const body = { err: 'some raw message', ECODE: 'OAUTH_023' }
    const error = parseApiError(body, 401)
    expect(error.message).toBe('Invalid or expired token. Run: clickup auth login')
  })

  it('falls back to status message when no ECODE', () => {
    const body = { err: 'Unauthorized' }
    const error = parseApiError(body, 401)
    expect(error.message).toBe('Authentication failed. Run: clickup auth login')
  })

  it('falls back to raw err for unknown ECODE', () => {
    const body = { err: 'Something weird happened', ECODE: 'UNKNOWN_999' }
    const error = parseApiError(body, 400)
    expect(error.message).toBe('Something weird happened')
  })

  it('handles empty response body', () => {
    const error = parseApiError(null, 500)
    expect(error.message).toBe('API request failed with status 500')
    expect(error.ecode).toBeUndefined()
  })

  it('handles non-object response body', () => {
    const error = parseApiError('plain text', 500)
    expect(error.message).toBe('API request failed with status 500')
  })
})

describe('mapToExitCode', () => {
  it('maps 401 to AUTH_FAILURE', () => {
    const err = new ClickUpError('test', 401, undefined, {})
    expect(mapToExitCode(err)).toBe(EXIT_CODES.AUTH_FAILURE)
  })

  it('maps 403 to PERMISSION_DENIED', () => {
    const err = new ClickUpError('test', 403, undefined, {})
    expect(mapToExitCode(err)).toBe(EXIT_CODES.PERMISSION_DENIED)
  })

  it('maps 404 to NOT_FOUND', () => {
    const err = new ClickUpError('test', 404, undefined, {})
    expect(mapToExitCode(err)).toBe(EXIT_CODES.NOT_FOUND)
  })

  it('maps 429 to RATE_LIMITED', () => {
    const err = new ClickUpError('test', 429, undefined, {})
    expect(mapToExitCode(err)).toBe(EXIT_CODES.RATE_LIMITED)
  })

  it('maps non-ClickUpError to GENERAL_ERROR', () => {
    expect(mapToExitCode(new Error('random'))).toBe(EXIT_CODES.GENERAL_ERROR)
  })

  it('maps 5xx to GENERAL_ERROR', () => {
    const err = new ClickUpError('test', 502, undefined, {})
    expect(mapToExitCode(err)).toBe(EXIT_CODES.GENERAL_ERROR)
  })
})
