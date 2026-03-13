import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerTaskCommands } from '../../commands/task.js'
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

  registerTaskCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('task commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('task list', () => {
    it('calls GET /list/{id}/task with default params', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        tasks: [{ id: 't1', name: 'Task 1', status: { status: 'open' } }],
      })

      await program.parseAsync(['node', 'clickup', 'task', 'list', '--list-id', 'l1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1/task', {})
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      const parsed = JSON.parse(output)
      expect(parsed.id).toBe('t1')
    })

    it('passes filter params correctly', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ tasks: [] })

      await program.parseAsync([
        'node', 'clickup', 'task', 'list', '--list-id', 'l1',
        '--archived', '--include-closed', '--subtasks',
        '--page', '2', '--order-by', 'due_date', '--reverse',
        '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1/task', {
        archived: 'true',
        include_closed: 'true',
        subtasks: 'true',
        page: '2',
        order_by: 'due_date',
        reverse: 'true',
      })
    })

    it('passes array filters correctly', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ tasks: [] })

      await program.parseAsync([
        'node', 'clickup', 'task', 'list', '--list-id', 'l1',
        '--status', 'open', '--status', 'in progress',
        '--assignee', '111', '--assignee', '222',
        '--tag', 'bug',
        '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1/task', expect.objectContaining({
        'statuses[]': ['open', 'in progress'],
        'assignees[]': ['111', '222'],
        'tags[]': ['bug'],
      }))
    })

    it('passes date range filters', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ tasks: [] })

      await program.parseAsync([
        'node', 'clickup', 'task', 'list', '--list-id', 'l1',
        '--due-date-gt', '1000000', '--due-date-lt', '2000000',
        '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1/task', expect.objectContaining({
        due_date_gt: '1000000',
        due_date_lt: '2000000',
      }))
    })
  })

  describe('task search', () => {
    it('calls GET /team/{id}/task with workspace ID', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        tasks: [{ id: 't1', name: 'Found task' }],
      })

      await program.parseAsync([
        'node', 'clickup', 'task', 'search',
        '--workspace-id', 'ws1',
        '--query', 'launch',
        '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/task', expect.objectContaining({
        query: 'launch',
      }))
    })

    it('errors when no workspace ID provided', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'task', 'search', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })

    it('passes scope and priority filters', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ tasks: [] })

      await program.parseAsync([
        'node', 'clickup', 'task', 'search',
        '--workspace-id', 'ws1',
        '--priority', '1', '--priority', '2',
        '--list-id', 'l1', '--space-id', 's1',
        '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/task', expect.objectContaining({
        'priorities[]': ['1', '2'],
        'list_ids[]': ['l1'],
        'space_ids[]': ['s1'],
      }))
    })
  })

  describe('task get', () => {
    it('calls GET /task/{id}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 't1', name: 'My Task', status: { status: 'open' },
      })

      await program.parseAsync(['node', 'clickup', 'task', 'get', 't1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/task/t1', {})
    })

    it('passes include-subtasks param', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't1', name: 'Task' })

      await program.parseAsync(['node', 'clickup', 'task', 'get', 't1', '--include-subtasks', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/task/t1', { include_subtasks: 'true' })
    })
  })

  describe('task create', () => {
    it('calls POST /list/{id}/task with name', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 't2', name: 'New Task',
      })

      await program.parseAsync([
        'node', 'clickup', 'task', 'create',
        '--list-id', 'l1', '--name', 'New Task',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/list/l1/task', { name: 'New Task' })
    })

    it('includes all optional fields', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't2', name: 'Full Task' })

      await program.parseAsync([
        'node', 'clickup', 'task', 'create',
        '--list-id', 'l1', '--name', 'Full Task',
        '--description', 'A description',
        '--status', 'open',
        '--priority', '2',
        '--due-date', '1735689600000',
        '--start-date', '1735600000000',
        '--assignee', '111', '--assignee', '222',
        '--tag', 'bug', '--tag', 'urgent',
        '--time-estimate', '3600000',
        '--notify-all',
        '--parent', 'p1',
        '--links-to', 'lt1',
        '--check-required-custom-fields',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/list/l1/task', {
        name: 'Full Task',
        description: 'A description',
        status: 'open',
        priority: 2,
        due_date: 1735689600000,
        start_date: 1735600000000,
        assignees: [111, 222],
        tags: ['bug', 'urgent'],
        time_estimate: 3600000,
        notify_all: true,
        parent: 'p1',
        links_to: 'lt1',
        check_required_custom_fields: true,
      })
    })

    it('markdown-description overrides description', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't2', name: 'MD Task' })

      await program.parseAsync([
        'node', 'clickup', 'task', 'create',
        '--list-id', 'l1', '--name', 'MD Task',
        '--description', 'plain',
        '--markdown-description', '## Heading',
        '--format', 'json',
      ])

      const body = (mockClient.post as ReturnType<typeof vi.fn>).mock.calls[0]![1]
      expect(body.markdown_description).toBe('## Heading')
      expect(body.description).toBeUndefined()
    })

    it('parses custom-field id=value pairs', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't2', name: 'CF Task' })

      await program.parseAsync([
        'node', 'clickup', 'task', 'create',
        '--list-id', 'l1', '--name', 'CF Task',
        '--custom-field', 'cf1=hello',
        '--custom-field', 'cf2=42',
        '--format', 'json',
      ])

      const body = (mockClient.post as ReturnType<typeof vi.fn>).mock.calls[0]![1]
      expect(body.custom_fields).toEqual([
        { id: 'cf1', value: 'hello' },
        { id: 'cf2', value: 42 },
      ])
    })
  })

  describe('task update', () => {
    it('calls PUT /task/{id} with updated fields', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't1', name: 'Updated' })

      await program.parseAsync([
        'node', 'clickup', 'task', 'update', 't1',
        '--name', 'Updated',
        '--status', 'in progress',
        '--priority', '1',
        '--format', 'json',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/task/t1', {
        name: 'Updated',
        status: 'in progress',
        priority: 1,
      })
    })

    it('builds assignees add/rem structure', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't1', name: 'Task' })

      await program.parseAsync([
        'node', 'clickup', 'task', 'update', 't1',
        '--assignee-add', '111', '--assignee-add', '222',
        '--assignee-remove', '333',
        '--format', 'json',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/task/t1', {
        assignees: { add: [111, 222], rem: [333] },
      })
    })
  })

  describe('task delete', () => {
    it('calls DELETE /task/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'task', 'delete', 't1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/task/t1')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Deleted task t1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'task', 'delete', 't1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      const errOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(errOutput).toContain('--confirm')
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('task time-in-status', () => {
    it('calls GET /task/{id}/time_in_status', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        current_status: { status: 'open', color: '#fff', total_time: { by_minute: 120 } },
        status_history: [{ status: 'to do', color: '#eee', total_time: { by_minute: 60 } }],
      })

      await program.parseAsync(['node', 'clickup', 'task', 'time-in-status', 't1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/task/t1/time_in_status')
    })
  })

  describe('task bulk-time-in-status', () => {
    it('calls GET /task/{id}/time_in_status for each task ID', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        current_status: { status: 'open' },
        status_history: [],
      })

      await program.parseAsync([
        'node', 'clickup', 'task', 'bulk-time-in-status',
        '--task-id', 't1', '--task-id', 't2',
        '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/task/t1/time_in_status')
      expect(mockClient.get).toHaveBeenCalledWith('/task/t2/time_in_status')
      expect(mockClient.get).toHaveBeenCalledTimes(2)
    })
  })
})
