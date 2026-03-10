import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerConfigCommands } from '../../commands/config-cmd.js'

function createTestProgram() {
  const program = new Command()
  program.name('clickup')
  registerConfigCommands(program)
  return program
}

describe('config commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('config set', () => {
    it('stores a string value', async () => {
      const program = createTestProgram()
      await program.parseAsync(['node', 'clickup', 'config', 'set', 'workspace_id', '12345'])

      expect(config.get('workspace_id')).toBe('12345')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Set workspace_id = 12345')
    })

    it('stores boolean for color', async () => {
      const program = createTestProgram()
      await program.parseAsync(['node', 'clickup', 'config', 'set', 'color', 'false'])

      expect(config.get('color')).toBe(false)
    })

    it('stores number for page_size', async () => {
      const program = createTestProgram()
      await program.parseAsync(['node', 'clickup', 'config', 'set', 'page_size', '50'])

      expect(config.get('page_size')).toBe(50)
    })
  })

  describe('config get', () => {
    it('prints stored value', async () => {
      config.set('workspace_id', '99999')
      const program = createTestProgram()
      await program.parseAsync(['node', 'clickup', 'config', 'get', 'workspace_id'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output.trim()).toBe('99999')
    })

    it('prints (not set) for unset key', async () => {
      const program = createTestProgram()
      await program.parseAsync(['node', 'clickup', 'config', 'get', 'workspace_id'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output.trim()).toBe('(not set)')
    })
  })

  describe('config list', () => {
    it('lists all set values', async () => {
      config.set('workspace_id', '12345')
      config.set('output_format', 'json')
      const program = createTestProgram()
      await program.parseAsync(['node', 'clickup', 'config', 'list'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('workspace_id = 12345')
      expect(output).toContain('output_format = json')
    })
  })

  describe('config reset', () => {
    it('clears config with --confirm', async () => {
      config.set('workspace_id', '12345')
      config.set('token', 'pk_test')
      const program = createTestProgram()
      await program.parseAsync(['node', 'clickup', 'config', 'reset', '--confirm'])

      expect(config.get('workspace_id')).toBeUndefined()
      expect(config.get('token')).toBeUndefined()
    })
  })

  describe('config path', () => {
    it('prints config file path', async () => {
      const program = createTestProgram()
      await program.parseAsync(['node', 'clickup', 'config', 'path'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output.trim()).toContain('config')
    })
  })
})
