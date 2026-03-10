import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getConfig,
  resetConfigInstance,
  isValidConfigKey,
  resolveToken,
  resolveWorkspaceId,
  resolveOutputFormat,
  resolveColor,
  resolvePageSize,
} from '../config.js'

describe('config', () => {
  beforeEach(() => {
    resetConfigInstance()
    // Clean environment
    delete process.env.CLICKUP_API_TOKEN
    delete process.env.CLICKUP_WORKSPACE_ID
    delete process.env.CLICKUP_OUTPUT_FORMAT
    delete process.env.CLICKUP_COLOR
    delete process.env.CLICKUP_PAGE_SIZE
  })

  afterEach(() => {
    // Clean up config after tests
    try {
      const conf = getConfig()
      conf.clear()
    } catch {
      // ignore
    }
    resetConfigInstance()
  })

  describe('getConfig', () => {
    it('returns a conf instance', () => {
      const config = getConfig()
      expect(config).toBeDefined()
      expect(config.path).toBeDefined()
    })

    it('returns same instance on subsequent calls', () => {
      const a = getConfig()
      const b = getConfig()
      expect(a).toBe(b)
    })
  })

  describe('isValidConfigKey', () => {
    it('returns true for valid keys', () => {
      expect(isValidConfigKey('token')).toBe(true)
      expect(isValidConfigKey('workspace_id')).toBe(true)
      expect(isValidConfigKey('output_format')).toBe(true)
      expect(isValidConfigKey('color')).toBe(true)
      expect(isValidConfigKey('page_size')).toBe(true)
      expect(isValidConfigKey('timezone')).toBe(true)
    })

    it('returns false for invalid keys', () => {
      expect(isValidConfigKey('invalid')).toBe(false)
      expect(isValidConfigKey('TOKEN')).toBe(false)
    })
  })

  describe('resolveToken', () => {
    it('returns flag value first', () => {
      process.env.CLICKUP_API_TOKEN = 'env_token'
      getConfig().set('token', 'stored_token')

      expect(resolveToken('flag_token')).toBe('flag_token')
    })

    it('returns env var second', () => {
      process.env.CLICKUP_API_TOKEN = 'env_token'
      getConfig().set('token', 'stored_token')

      expect(resolveToken()).toBe('env_token')
    })

    it('returns stored config third', () => {
      getConfig().set('token', 'stored_token')

      expect(resolveToken()).toBe('stored_token')
    })

    it('returns undefined when nothing set', () => {
      expect(resolveToken()).toBeUndefined()
    })
  })

  describe('resolveWorkspaceId', () => {
    it('follows precedence: flag > env > config', () => {
      process.env.CLICKUP_WORKSPACE_ID = 'env_ws'
      getConfig().set('workspace_id', 'stored_ws')

      expect(resolveWorkspaceId('flag_ws')).toBe('flag_ws')
      expect(resolveWorkspaceId()).toBe('env_ws')

      delete process.env.CLICKUP_WORKSPACE_ID
      expect(resolveWorkspaceId()).toBe('stored_ws')
    })
  })

  describe('resolveOutputFormat', () => {
    it('returns flag value first', () => {
      expect(resolveOutputFormat('csv')).toBe('csv')
    })

    it('returns env var second', () => {
      process.env.CLICKUP_OUTPUT_FORMAT = 'json'
      expect(resolveOutputFormat()).toBe('json')
    })

    it('returns stored config third', () => {
      getConfig().set('output_format', 'csv')
      expect(resolveOutputFormat()).toBe('csv')
    })

    it('defaults to table for TTY', () => {
      // The default config value is 'table'
      expect(resolveOutputFormat()).toBe('table')
    })
  })

  describe('resolveColor', () => {
    it('returns flag value first', () => {
      expect(resolveColor(false)).toBe(false)
      expect(resolveColor(true)).toBe(true)
    })

    it('returns env var second', () => {
      process.env.CLICKUP_COLOR = 'false'
      expect(resolveColor()).toBe(false)
    })

    it('defaults to true', () => {
      expect(resolveColor()).toBe(true)
    })
  })

  describe('resolvePageSize', () => {
    it('returns flag value first', () => {
      expect(resolvePageSize('50')).toBe(50)
    })

    it('returns env var second', () => {
      process.env.CLICKUP_PAGE_SIZE = '25'
      expect(resolvePageSize()).toBe(25)
    })

    it('defaults to 100', () => {
      expect(resolvePageSize()).toBe(100)
    })
  })
})
