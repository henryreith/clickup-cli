import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createProgram } from '../../cli.js'
import { getConfig, resetConfigInstance } from '../../config.js'

describe('config commands', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>
  let stdoutOutput: string
  let stderrOutput: string

  beforeEach(() => {
    resetConfigInstance()
    stdoutOutput = ''
    stderrOutput = ''
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdoutOutput += String(chunk)
      return true
    })
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderrOutput += String(chunk)
      return true
    })
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
    try {
      getConfig().clear()
    } catch {
      // ignore
    }
    resetConfigInstance()
  })

  describe('config set', () => {
    it('sets a config value', async () => {
      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'set', 'workspace_id', '12345'])

      expect(getConfig().get('workspace_id')).toBe('12345')
      expect(stdoutOutput).toContain('Set workspace_id = 12345')
    })

    it('sets boolean config values', async () => {
      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'set', 'color', 'false'])

      expect(getConfig().get('color')).toBe(false)
    })

    it('sets numeric config values', async () => {
      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'set', 'page_size', '50'])

      expect(getConfig().get('page_size')).toBe(50)
    })

    it('rejects invalid keys', async () => {
      const program = createProgram()
      program.exitOverride()

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await program.parseAsync(['node', 'clickup', 'config', 'set', 'bad_key', 'value'])
      } catch {
        // Expected
      }

      expect(stderrOutput).toContain('Unknown config key')
      exitSpy.mockRestore()
    })
  })

  describe('config get', () => {
    it('prints config value', async () => {
      getConfig().set('workspace_id', '99999')

      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'get', 'workspace_id'])

      expect(stdoutOutput.trim()).toBe('99999')
    })

    it('prints (not set) for missing values', async () => {
      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'get', 'timezone'])

      expect(stdoutOutput).toContain('(not set)')
    })
  })

  describe('config list', () => {
    it('lists all config values', async () => {
      getConfig().set('workspace_id', '123')
      getConfig().set('output_format', 'json')

      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'list'])

      expect(stdoutOutput).toContain('workspace_id = 123')
      expect(stdoutOutput).toContain('output_format = json')
    })

    it('redacts token in listing', async () => {
      getConfig().set('token', 'pk_verylongsecrettoken')

      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'list'])

      expect(stdoutOutput).toContain('pk_veryl...')
      expect(stdoutOutput).not.toContain('pk_verylongsecrettoken')
    })
  })

  describe('config unset', () => {
    it('removes a config value', async () => {
      getConfig().set('workspace_id', '123')

      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'unset', 'workspace_id'])

      expect(getConfig().get('workspace_id')).toBeUndefined()
      expect(stdoutOutput).toContain('Unset workspace_id')
    })
  })

  describe('config path', () => {
    it('prints config file path', async () => {
      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'config', 'path'])

      expect(stdoutOutput).toContain('clickup-cli')
    })
  })
})
