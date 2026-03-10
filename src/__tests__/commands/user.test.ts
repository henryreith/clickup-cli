import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerUserCommands } from '../../commands/user.js'
import type { ClickUpClient } from '../../client.js'

function createTestProgram() {
  const program = new Command()
  program
    .name('clickup')
    .option('--token <token>', 'API token')
    .option('--workspace-id <id>', 'Workspace ID')
    .option('--format <format>', 'Output format')
    .option('--no-color')
    .option('--no-header')
    .option('--fields <fields>')
    .option('--filter <filter>')
    .option('--sort <sort>')
    .option('--limit <n>', '', parseInt)
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

  registerUserCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_INVITE = {
  team: { id: 'ws1', name: 'Test Workspace' },
}

const FIXTURE_USER = {
  member: {
    user: { id: 112233, username: 'jane', email: 'jane@example.com', role: 3 },
    invited_by: { id: 1, username: 'admin', email: 'admin@example.com' },
  },
}

describe('user commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('user invite', () => {
    it('calls POST /team/{id}/user with email', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_INVITE)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'user', 'invite', '--email', 'jane@example.com'])

      expect(mockClient.post).toHaveBeenCalledWith('/team/ws1/user', { email: 'jane@example.com' })
    })

    it('sends admin flag when provided', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_INVITE)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'user', 'invite', '--email', 'jane@example.com', '--admin', 'true'])

      expect(mockClient.post).toHaveBeenCalledWith('/team/ws1/user', { email: 'jane@example.com', admin: true })
    })
  })

  describe('user get', () => {
    it('calls GET /team/{id}/user/{uid}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_USER)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'user', 'get', '112233', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/user/112233')
    })
  })

  describe('user update', () => {
    it('calls PUT /team/{id}/user/{uid} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'user', 'update', '112233', '--username', 'newname'])

      expect(mockClient.put).toHaveBeenCalledWith('/team/ws1/user/112233', { username: 'newname' })
    })
  })

  describe('user remove', () => {
    it('calls DELETE /team/{id}/user/{uid} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'user', 'remove', '112233', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/team/ws1/user/112233')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'user', 'remove', '112233'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })
})
