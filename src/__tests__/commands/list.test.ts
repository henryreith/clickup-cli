import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerListCommands } from '../../commands/list.js'
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

  registerListCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('list commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('list list', () => {
    it('calls GET /folder/{id}/list with archived=false by default', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        lists: [
          { id: 'l1', name: 'Backlog', task_count: '10', content: '' },
          { id: 'l2', name: 'Sprint', task_count: '5', content: 'Active sprint' },
        ],
      })

      await program.parseAsync(['node', 'clickup', 'list', 'list', '--folder-id', 'f1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/folder/f1/list', { archived: 'false' })
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      const parsed = JSON.parse(output)
      expect(parsed).toHaveLength(2)
    })

    it('passes archived=true when --archived is set', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ lists: [] })

      await program.parseAsync(['node', 'clickup', 'list', 'list', '--folder-id', 'f1', '--archived', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/folder/f1/list', { archived: 'true' })
    })
  })

  describe('list list-folderless', () => {
    it('calls GET /space/{id}/list', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        lists: [{ id: 'l3', name: 'Folderless List', task_count: '2' }],
      })

      await program.parseAsync(['node', 'clickup', 'list', 'list-folderless', '--space-id', 's1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/space/s1/list', { archived: 'false' })
    })
  })

  describe('list get', () => {
    it('calls GET /list/{id}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'l1', name: 'Backlog', task_count: '10',
      })

      await program.parseAsync(['node', 'clickup', 'list', 'get', 'l1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1')
    })
  })

  describe('list create', () => {
    it('calls POST /folder/{id}/list with name', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'l4', name: 'New List',
      })

      await program.parseAsync(['node', 'clickup', 'list', 'create', '--folder-id', 'f1', '--name', 'New List', '--format', 'json'])

      expect(mockClient.post).toHaveBeenCalledWith('/folder/f1/list', { name: 'New List' })
    })

    it('includes optional fields in request body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'l4', name: 'Sprint 4' })

      await program.parseAsync([
        'node', 'clickup', 'list', 'create',
        '--folder-id', 'f1',
        '--name', 'Sprint 4',
        '--content', 'Sprint description',
        '--due-date', '1735689600000',
        '--priority', '2',
        '--status', 'to do',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/folder/f1/list', {
        name: 'Sprint 4',
        content: 'Sprint description',
        due_date: 1735689600000,
        priority: 2,
        status: 'to do',
      })
    })
  })

  describe('list create-folderless', () => {
    it('calls POST /space/{id}/list', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'l5', name: 'Folderless',
      })

      await program.parseAsync(['node', 'clickup', 'list', 'create-folderless', '--space-id', 's1', '--name', 'Folderless', '--format', 'json'])

      expect(mockClient.post).toHaveBeenCalledWith('/space/s1/list', { name: 'Folderless' })
    })
  })

  describe('list update', () => {
    it('calls PUT /list/{id} with updated fields', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'l1', name: 'Updated' })

      await program.parseAsync(['node', 'clickup', 'list', 'update', 'l1', '--name', 'Updated', '--content', 'New desc', '--format', 'json'])

      expect(mockClient.put).toHaveBeenCalledWith('/list/l1', {
        name: 'Updated',
        content: 'New desc',
      })
    })

    it('sends unset_status when --unset-status is set', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'l1', name: 'Test' })

      await program.parseAsync(['node', 'clickup', 'list', 'update', 'l1', '--unset-status', '--format', 'json'])

      expect(mockClient.put).toHaveBeenCalledWith('/list/l1', { unset_status: true })
    })
  })

  describe('list delete', () => {
    it('calls DELETE /list/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'list', 'delete', 'l1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/list/l1')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Deleted list l1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'list', 'delete', 'l1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      const errOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(errOutput).toContain('--confirm')
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('list add-task', () => {
    it('calls POST /list/{id}/task/{taskId}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'list', 'add-task', 'l1', '--task-id', 't1'])

      expect(mockClient.post).toHaveBeenCalledWith('/list/l1/task/t1')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Added task t1 to list l1')
    })
  })

  describe('list remove-task', () => {
    it('calls DELETE /list/{id}/task/{taskId}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'list', 'remove-task', 'l1', '--task-id', 't1'])

      expect(mockClient.delete).toHaveBeenCalledWith('/list/l1/task/t1')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Removed task t1 from list l1')
    })
  })
})
