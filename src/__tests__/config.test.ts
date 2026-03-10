import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  config,
  resolveToken,
  resolveWorkspaceId,
  resolveOutputFormat,
  resolveColor,
  resolvePageSize,
  isValidConfigKey,
} from '../config.js'

describe('config resolution', () => {
  beforeEach(() => {
    config.clear()
  })

  afterEach(() => {
    delete process.env['CLICKUP_API_TOKEN']
    delete process.env['CLICKUP_WORKSPACE_ID']
    delete process.env['CLICKUP_OUTPUT_FORMAT']
    delete process.env['CLICKUP_COLOR']
    delete process.env['CLICKUP_PAGE_SIZE']
  })

  describe('resolveToken', () => {
    it('returns flag value first', () => {
      config.set('token', 'stored-token')
      process.env['CLICKUP_API_TOKEN'] = 'env-token'
      expect(resolveToken('flag-token')).toBe('flag-token')
    })

    it('returns env var second', () => {
      config.set('token', 'stored-token')
      process.env['CLICKUP_API_TOKEN'] = 'env-token'
      expect(resolveToken()).toBe('env-token')
    })

    it('returns stored config third', () => {
      config.set('token', 'stored-token')
      expect(resolveToken()).toBe('stored-token')
    })

    it('returns undefined when nothing is set', () => {
      expect(resolveToken()).toBeUndefined()
    })
  })

  describe('resolveWorkspaceId', () => {
    it('follows precedence: flag > env > stored', () => {
      config.set('workspace_id', 'stored-ws')
      process.env['CLICKUP_WORKSPACE_ID'] = 'env-ws'
      expect(resolveWorkspaceId('flag-ws')).toBe('flag-ws')
      expect(resolveWorkspaceId()).toBe('env-ws')
      delete process.env['CLICKUP_WORKSPACE_ID']
      expect(resolveWorkspaceId()).toBe('stored-ws')
    })
  })

  describe('resolveOutputFormat', () => {
    it('returns flag value first', () => {
      expect(resolveOutputFormat('csv')).toBe('csv')
    })

    it('returns env var second', () => {
      process.env['CLICKUP_OUTPUT_FORMAT'] = 'json'
      expect(resolveOutputFormat()).toBe('json')
    })

    it('defaults to table or json based on TTY', () => {
      const result = resolveOutputFormat()
      expect(['table', 'json']).toContain(result)
    })
  })

  describe('resolveColor', () => {
    it('returns flag value first', () => {
      expect(resolveColor(false)).toBe(false)
    })

    it('returns env var second', () => {
      process.env['CLICKUP_COLOR'] = 'false'
      expect(resolveColor()).toBe(false)
    })

    it('defaults to true', () => {
      expect(resolveColor()).toBe(true)
    })
  })

  describe('resolvePageSize', () => {
    it('returns flag value first', () => {
      expect(resolvePageSize(50)).toBe(50)
    })

    it('returns env var second', () => {
      process.env['CLICKUP_PAGE_SIZE'] = '25'
      expect(resolvePageSize()).toBe(25)
    })

    it('defaults to 100', () => {
      expect(resolvePageSize()).toBe(100)
    })
  })

  describe('isValidConfigKey', () => {
    it('returns true for valid keys', () => {
      expect(isValidConfigKey('token')).toBe(true)
      expect(isValidConfigKey('workspace_id')).toBe(true)
      expect(isValidConfigKey('output_format')).toBe(true)
    })

    it('returns false for invalid keys', () => {
      expect(isValidConfigKey('invalid')).toBe(false)
      expect(isValidConfigKey('')).toBe(false)
    })
  })
})
