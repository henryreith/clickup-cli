import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerWorkspaceCommands } from '../../commands/workspace.js'
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

  registerWorkspaceCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('workspace commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env['CLICKUP_WORKSPACE_ID']
  })

  describe('workspace list', () => {
    it('calls GET /team and outputs workspaces', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        teams: [
          { id: '123', name: 'My Workspace', color: '#000', members: [{ user: { id: 1 } }] },
          { id: '456', name: 'Other Workspace', color: '#fff', members: [] },
        ],
      })

      await program.parseAsync(['node', 'clickup', 'workspace', 'list', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      const parsed = JSON.parse(output)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].name).toBe('My Workspace')
      expect(parsed[0].member_count).toBe(1)
    })
  })

  describe('workspace get', () => {
    it('calls GET /team/{id} with workspace ID from flag', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        team: { id: '123', name: 'My Workspace', color: '#000', members: [] },
      })

      await program.parseAsync(['node', 'clickup', 'workspace', 'get', '--workspace-id', '123', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/123')
    })

    it('uses workspace ID from config', async () => {
      config.set('workspace_id', '789')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        team: { id: '789', name: 'Config Workspace', members: [] },
      })

      await program.parseAsync(['node', 'clickup', 'workspace', 'get', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/789')
    })

    it('errors when no workspace ID is available', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'workspace', 'get'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      const errOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(errOutput).toContain('No workspace ID')
    })
  })

  describe('workspace seats', () => {
    it('calls GET /team/{id}/seats', async () => {
      config.set('workspace_id', '123')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        members: { filled_members_count: 5, total_member_seats: 10, empty_member_seats: 5 },
        guests: { filled_guest_count: 2, total_guest_seats: 5, empty_guest_seats: 3 },
      })

      await program.parseAsync(['node', 'clickup', 'workspace', 'seats', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/123/seats')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      const parsed = JSON.parse(output)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].type).toBe('Members')
      expect(parsed[0].filled).toBe(5)
    })
  })

  describe('workspace plan', () => {
    it('calls GET /team/{id}/plan', async () => {
      config.set('workspace_id', '123')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        plan_id: 2,
        plan_name: 'Business',
      })

      await program.parseAsync(['node', 'clickup', 'workspace', 'plan', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/123/plan')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      const parsed = JSON.parse(output)
      expect(parsed.plan_name).toBe('Business')
    })
  })
})
