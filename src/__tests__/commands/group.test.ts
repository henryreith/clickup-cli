import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerGroupCommands } from '../../commands/group.js'
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

  registerGroupCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_GROUPS = {
  groups: [
    { id: 'grp_001', name: 'Frontend Team', members: [{ id: 1, username: 'alice', email: 'alice@example.com' }] },
  ],
}

describe('group commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('group list', () => {
    it('calls GET /team/{id}/group with workspace ID', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GROUPS)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'group', 'list', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/group', {})
    })

    it('sends group_ids query param when --group-id provided', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GROUPS)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'group', 'list', '--group-id', 'g1', '--group-id', 'g2', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/group', { group_ids: 'g1,g2' })
    })
  })

  describe('group create', () => {
    it('calls POST /team/{id}/group with name and members', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'grp_002', name: 'New Group' })

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'group', 'create',
        '--name', 'New Group', '--member-id', '1', '--member-id', '2',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/team/ws1/group', {
        name: 'New Group',
        members: [{ id: 1 }, { id: 2 }],
      })
    })
  })

  describe('group update', () => {
    it('calls PUT /group/{id} with add/remove members', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'group', 'update', 'grp_001',
        '--name', 'Renamed', '--add-member', '3', '--remove-member', '1',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/group/grp_001', {
        name: 'Renamed',
        members: {
          add: [{ id: 3 }],
          rem: [{ id: 1 }],
        },
      })
    })
  })

  describe('group delete', () => {
    it('calls DELETE /group/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'group', 'delete', 'grp_001', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/group/grp_001')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'group', 'delete', 'grp_001'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })
})
