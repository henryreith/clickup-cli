import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerMemberCommands } from '../../commands/member.js'
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

  registerMemberCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_MEMBERS = {
  members: [
    { id: 112233, username: 'jane', email: 'jane@example.com', initials: 'J' },
  ],
}

describe('member commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('member list', () => {
    it('calls GET /task/{id}/member with --task-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_MEMBERS)

      await program.parseAsync(['node', 'clickup', 'member', 'list', '--task-id', 't1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/task/t1/member')
    })

    it('calls GET /list/{id}/member with --list-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_MEMBERS)

      await program.parseAsync(['node', 'clickup', 'member', 'list', '--list-id', 'l1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1/member')
    })

    it('errors without --task-id or --list-id', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'member', 'list', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })

    it('errors with both --task-id and --list-id', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'member', 'list', '--task-id', 't1', '--list-id', 'l1', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })
})
