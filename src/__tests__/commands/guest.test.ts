import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerGuestCommands } from '../../commands/guest.js'
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

  registerGuestCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_GUEST = {
  guest: { id: 10, username: 'client', email: 'client@external.com', can_edit_tags: false, can_see_time_spent: true, can_see_time_estimated: false },
}

describe('guest commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('guest invite', () => {
    it('calls POST /team/{id}/guest with email and permissions', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GUEST)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'guest', 'invite',
        '--email', 'client@external.com', '--can-edit-tags', 'true',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/team/ws1/guest', {
        email: 'client@external.com',
        can_edit_tags: true,
      })
    })
  })

  describe('guest get', () => {
    it('calls GET /team/{id}/guest/{gid}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GUEST)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'guest', 'get', '10', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/guest/10')
    })
  })

  describe('guest update', () => {
    it('calls PUT /team/{id}/guest/{gid} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'guest', 'update', '10',
        '--username', 'newname', '--can-see-time-spent', 'false',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/team/ws1/guest/10', {
        username: 'newname',
        can_see_time_spent: false,
      })
    })
  })

  describe('guest remove', () => {
    it('calls DELETE /team/{id}/guest/{gid} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'guest', 'remove', '10', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/team/ws1/guest/10')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'guest', 'remove', '10'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('guest add-to-task', () => {
    it('calls POST /task/{tid}/guest/{gid} with permission_level', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'guest', 'add-to-task', '10',
        '--task-id', 't1', '--permission', 'edit',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/guest/10', { permission_level: 'edit' })
    })
  })

  describe('guest remove-from-task', () => {
    it('calls DELETE /task/{tid}/guest/{gid}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'guest', 'remove-from-task', '10', '--task-id', 't1'])

      expect(mockClient.delete).toHaveBeenCalledWith('/task/t1/guest/10')
    })
  })

  describe('guest add-to-list', () => {
    it('calls POST /list/{lid}/guest/{gid} with permission_level', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'guest', 'add-to-list', '10',
        '--list-id', 'l1', '--permission', 'read',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/list/l1/guest/10', { permission_level: 'read' })
    })
  })

  describe('guest add-to-folder', () => {
    it('calls POST /folder/{fid}/guest/{gid} with permission_level', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'guest', 'add-to-folder', '10',
        '--folder-id', 'f1', '--permission', 'comment',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/folder/f1/guest/10', { permission_level: 'comment' })
    })
  })

  describe('guest remove-from-folder', () => {
    it('calls DELETE /folder/{fid}/guest/{gid}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'guest', 'remove-from-folder', '10', '--folder-id', 'f1'])

      expect(mockClient.delete).toHaveBeenCalledWith('/folder/f1/guest/10')
    })
  })
})
