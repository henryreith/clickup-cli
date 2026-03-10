import { describe, it, expect } from 'vitest'
import {
  ClickUpError,
  parseApiError,
  mapToExitCode,
  isRetryable,
  isClientError,
  getUserFriendlyMessage,
  EXIT_AUTH_FAILURE,
  EXIT_NOT_FOUND,
  EXIT_PERMISSION_DENIED,
  EXIT_RATE_LIMITED,
  EXIT_GENERAL,
} from '../errors.js'

describe('ClickUpError', () => {
  it('creates error with all properties', () => {
    const err = new ClickUpError({
      message: 'Not found',
      status: 404,
      ecode: 'ITEM_015',
      body: { err: 'Not found', ECODE: 'ITEM_015' },
    })

    expect(err.message).toBe('Not found')
    expect(err.status).toBe(404)
    expect(err.ecode).toBe('ITEM_015')
    expect(err.body).toEqual({ err: 'Not found', ECODE: 'ITEM_015' })
    expect(err.name).toBe('ClickUpError')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('parseApiError', () => {
  it('extracts err and ECODE from response body', () => {
    const error = parseApiError(404, { err: 'Task not found', ECODE: 'ITEM_015' })
    expect(error.status).toBe(404)
    expect(error.ecode).toBe('ITEM_015')
    expect(error.message).toBe('Task not found. Check the task ID.')
  })

  it('handles response without ECODE', () => {
    const error = parseApiError(400, { err: 'Bad request' })
    expect(error.ecode).toBeUndefined()
    expect(error.message).toBe('Bad request')
  })

  it('handles empty body', () => {
    const error = parseApiError(500, {})
    expect(error.message).toBe('ClickUp server error. Retrying...')
  })

  it('handles non-object body', () => {
    const error = parseApiError(500, 'string body')
    expect(error.status).toBe(500)
  })
})

describe('mapToExitCode', () => {
  it('maps auth errors to EXIT_AUTH_FAILURE', () => {
    expect(mapToExitCode(401)).toBe(EXIT_AUTH_FAILURE)
    expect(mapToExitCode(200, 'OAUTH_023')).toBe(EXIT_AUTH_FAILURE)
    expect(mapToExitCode(200, 'OAUTH_024')).toBe(EXIT_AUTH_FAILURE)
  })

  it('maps 403 to EXIT_PERMISSION_DENIED', () => {
    expect(mapToExitCode(403)).toBe(EXIT_PERMISSION_DENIED)
  })

  it('maps 404 and item errors to EXIT_NOT_FOUND', () => {
    expect(mapToExitCode(404)).toBe(EXIT_NOT_FOUND)
    expect(mapToExitCode(200, 'ITEM_015')).toBe(EXIT_NOT_FOUND)
    expect(mapToExitCode(200, 'TEAM_015')).toBe(EXIT_NOT_FOUND)
  })

  it('maps 429 to EXIT_RATE_LIMITED', () => {
    expect(mapToExitCode(429)).toBe(EXIT_RATE_LIMITED)
  })

  it('maps 5xx to EXIT_GENERAL', () => {
    expect(mapToExitCode(500)).toBe(EXIT_GENERAL)
    expect(mapToExitCode(503)).toBe(EXIT_GENERAL)
  })
})

describe('getUserFriendlyMessage', () => {
  it('returns ECODE message when available', () => {
    expect(getUserFriendlyMessage(404, 'ITEM_015')).toBe(
      'Task not found. Check the task ID.',
    )
  })

  it('returns status message when no ECODE', () => {
    expect(getUserFriendlyMessage(401)).toBe(
      'Authentication failed. Run: clickup auth login',
    )
  })

  it('returns raw message as fallback', () => {
    expect(getUserFriendlyMessage(400, undefined, 'Custom error')).toBe('Custom error')
  })

  it('returns generic 5xx message', () => {
    expect(getUserFriendlyMessage(502)).toBe('ClickUp server error. Retrying...')
  })
})

describe('isRetryable', () => {
  it('returns true for 429', () => {
    expect(isRetryable(429)).toBe(true)
  })

  it('returns true for 5xx', () => {
    expect(isRetryable(500)).toBe(true)
    expect(isRetryable(503)).toBe(true)
  })

  it('returns false for client errors', () => {
    expect(isRetryable(400)).toBe(false)
    expect(isRetryable(404)).toBe(false)
  })
})

describe('isClientError', () => {
  it('returns true for 4xx except 429', () => {
    expect(isClientError(400)).toBe(true)
    expect(isClientError(404)).toBe(true)
  })

  it('returns false for 429', () => {
    expect(isClientError(429)).toBe(false)
  })

  it('returns false for 5xx', () => {
    expect(isClientError(500)).toBe(false)
  })
})
