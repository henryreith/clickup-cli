import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerAuthCommands } from '../../commands/auth-cmd.js'
import { ClickUpClient } from '../../client.js'

function createTestProgram() {
  const program = new Command()
  program
    .name('clickup')
    .option('--token <token>', 'API token')
    .option('--verbose')
    .option('--debug')
    .option('--dry-run')

  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  } as unknown as ClickUpClient

  registerAuthCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('auth commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env['CLICKUP_API_TOKEN']
  })

  describe('auth logout', () => {
    it('clears stored token', async () => {
      config.set('token', 'pk_test_token')
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'auth', 'logout'])

      expect(config.get('token')).toBeUndefined()
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Logged out')
    })
  })

  describe('auth token', () => {
    it('prints token to stdout', async () => {
      config.set('token', 'pk_test_token_123')
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'auth', 'token'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output.trim()).toBe('pk_test_token_123')
    })

    it('prints token from env var', async () => {
      process.env['CLICKUP_API_TOKEN'] = 'env_token_456'
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'auth', 'token'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output.trim()).toBe('env_token_456')
    })
  })

  describe('auth status', () => {
    it('shows not authenticated when no token', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'auth', 'status'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Not authenticated')
    })

    it('shows token prefix when token is stored', async () => {
      config.set('token', 'pk_abcdefgh12345')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { username: 'testuser', email: 'test@example.com' },
      })

      await program.parseAsync(['node', 'clickup', 'auth', 'status'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('pk_abcde')
    })
  })
})
