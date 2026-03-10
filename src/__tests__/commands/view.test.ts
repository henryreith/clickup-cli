import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerViewCommands } from '../../commands/view.js'
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

  registerViewCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_VIEWS = {
  views: [
    {
      id: 'view1',
      name: 'Sprint Board',
      type: 'board',
      date_created: '1700000000000',
      creator: { id: 1, username: 'alice' },
    },
  ],
}

const FIXTURE_VIEW = {
  view: FIXTURE_VIEWS.views[0],
}

const FIXTURE_VIEW_TASKS = {
  tasks: [
    { id: 'task1', name: 'Fix bug', status: { status: 'open' }, assignees: [{ username: 'alice' }] },
  ],
  last_page: true,
}

describe('view commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('view list', () => {
    it('calls GET /team/{id}/view with --workspace-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_VIEWS)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'view', 'list', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/view')
    })

    it('calls GET /space/{id}/view with --space-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_VIEWS)

      await program.parseAsync(['node', 'clickup', 'view', 'list', '--space-id', 's1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/space/s1/view')
    })

    it('calls GET /folder/{id}/view with --folder-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_VIEWS)

      await program.parseAsync(['node', 'clickup', 'view', 'list', '--folder-id', 'f1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/folder/f1/view')
    })

    it('calls GET /list/{id}/view with --list-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_VIEWS)

      await program.parseAsync(['node', 'clickup', 'view', 'list', '--list-id', 'l1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1/view')
    })

    it('errors when no parent ID provided', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'view', 'list', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      expect(process.stderr.write).toHaveBeenCalledWith(
        'Error: Provide one of --workspace-id, --space-id, --folder-id, or --list-id.\n',
      )
    })

    it('errors when multiple parent IDs provided', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'view', 'list', '--space-id', 's1', '--folder-id', 'f1', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      expect(process.stderr.write).toHaveBeenCalledWith(
        'Error: Provide only one of --workspace-id, --space-id, --folder-id, or --list-id.\n',
      )
    })
  })

  describe('view get', () => {
    it('calls GET /view/{id}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_VIEW)

      await program.parseAsync(['node', 'clickup', 'view', 'get', 'view1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/view/view1')
    })
  })

  describe('view create', () => {
    it('calls POST /{segment}/{id}/view with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_VIEW)

      await program.parseAsync([
        'node', 'clickup', 'view', 'create',
        '--space-id', 's1', '--name', 'Sprint Board', '--type', 'board',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/space/s1/view', {
        name: 'Sprint Board',
        type: 'board',
      })
    })
  })

  describe('view update', () => {
    it('calls PUT /view/{id} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'view', 'update', 'view1',
        '--name', 'Updated Board',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/view/view1', {
        name: 'Updated Board',
      })
    })

    it('parses JSON settings options', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'view', 'update', 'view1',
        '--settings', '{"show_closed":true}',
        '--filters', '{"op":"AND","fields":[]}',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/view/view1', {
        settings: { show_closed: true },
        filters: { op: 'AND', fields: [] },
      })
    })

    it('errors on invalid JSON', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync([
        'node', 'clickup', 'view', 'update', 'view1',
        '--settings', 'not-json',
      ])

      expect(exitSpy).toHaveBeenCalledWith(2)
      expect(process.stderr.write).toHaveBeenCalledWith('Error: Invalid JSON for --settings.\n')
    })
  })

  describe('view delete', () => {
    it('calls DELETE /view/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'view', 'delete', 'view1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/view/view1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'view', 'delete', 'view1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('view tasks', () => {
    it('calls GET /view/{id}/task', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_VIEW_TASKS)

      await program.parseAsync(['node', 'clickup', 'view', 'tasks', 'view1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/view/view1/task', {})
    })

    it('passes page param', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_VIEW_TASKS)

      await program.parseAsync(['node', 'clickup', 'view', 'tasks', 'view1', '--page', '2', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/view/view1/task', { page: '2' })
    })
  })
})
