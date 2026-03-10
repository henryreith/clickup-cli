import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerTimeTrackingCommands } from '../../commands/time-tracking.js'
import type { ClickUpClient } from '../../client.js'

function createTestProgram(workspaceId?: string) {
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

  registerTimeTrackingCommands(program, () => mockClient)

  const args = ['node', 'clickup']
  if (workspaceId) args.push('--workspace-id', workspaceId)

  return { program, mockClient, baseArgs: args }
}

const FIXTURE_ENTRIES = {
  data: [
    {
      id: 'te1',
      task: { id: 't1', name: 'My Task' },
      user: { id: 1, username: 'alice' },
      duration: '3600000',
      start: '1700000000000',
      end: '1700003600000',
      description: 'Working on feature',
      billable: true,
    },
  ],
}

const FIXTURE_SINGLE = {
  data: {
    id: 'te1',
    task: { id: 't1', name: 'My Task' },
    user: { id: 1, username: 'alice' },
    duration: '3600000',
    start: '1700000000000',
    end: '1700003600000',
    description: 'Working on feature',
    billable: true,
  },
}

describe('time tracking commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('time list', () => {
    it('calls GET /task/{id}/time with --task-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_ENTRIES)

      await program.parseAsync(['node', 'clickup', 'time', 'list', '--task-id', 't1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/task/t1/time')
    })

    it('calls GET /team/{id}/time_entries for workspace-level list', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_ENTRIES)

      await program.parseAsync([...baseArgs, 'time', 'list', '--start', '1700000000000', '--end', '1700100000000', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/w1/time_entries', {
        start_date: '1700000000000',
        end_date: '1700100000000',
      })
    })

    it('passes assignee params for workspace-level list', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_ENTRIES)

      await program.parseAsync([...baseArgs, 'time', 'list', '--assignee', '123', '--assignee', '456', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/w1/time_entries', {
        assignee: ['123', '456'],
      })
    })
  })

  describe('time get', () => {
    it('calls GET /team/{id}/time_entries/{entry_id}', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_SINGLE)

      await program.parseAsync([...baseArgs, 'time', 'get', 'te1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/w1/time_entries/te1')
    })
  })

  describe('time create', () => {
    it('calls POST /task/{id}/time with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_SINGLE)

      await program.parseAsync([
        'node', 'clickup', 'time', 'create',
        '--task-id', 't1', '--duration', '3600000', '--start', '1700000000000',
        '--description', 'Work', '--assignee', '123', '--billable', 'true',
        '--tag', 'dev', '--tag', 'frontend',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/time', {
        duration: 3600000,
        start: '1700000000000',
        description: 'Work',
        assignee: 123,
        billable: true,
        tags: [{ name: 'dev' }, { name: 'frontend' }],
      })
    })
  })

  describe('time update', () => {
    it('calls PUT /team/{id}/time_entries/{entry_id} with body', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        ...baseArgs, 'time', 'update', 'te1',
        '--description', 'Updated', '--duration', '7200000', '--billable', 'false',
        '--tag-action', 'add', '--tag', 'review',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/team/w1/time_entries/te1', {
        description: 'Updated',
        duration: 7200000,
        billable: false,
        tags: [{ name: 'review' }],
        tag_action: 'add',
      })
    })
  })

  describe('time delete', () => {
    it('calls DELETE /team/{id}/time_entries/{entry_id}', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([...baseArgs, 'time', 'delete', 'te1'])

      expect(mockClient.delete).toHaveBeenCalledWith('/team/w1/time_entries/te1')
    })
  })

  describe('time history', () => {
    it('calls GET /team/{id}/time_entries/{entry_id}/history', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })

      await program.parseAsync([...baseArgs, 'time', 'history', 'te1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/w1/time_entries/te1/history')
    })
  })

  describe('time running', () => {
    it('calls GET /team/{id}/time_entries/current', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: FIXTURE_SINGLE.data })

      await program.parseAsync([...baseArgs, 'time', 'running', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/w1/time_entries/current', {})
    })

    it('shows message when no running timer', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null })

      await program.parseAsync([...baseArgs, 'time', 'running', '--format', 'json'])

      expect(process.stdout.write).toHaveBeenCalledWith('No running timer.\n')
    })

    it('passes assignee param', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: FIXTURE_SINGLE.data })

      await program.parseAsync([...baseArgs, 'time', 'running', '--assignee', '123', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/w1/time_entries/current', { assignee: '123' })
    })
  })

  describe('time start', () => {
    it('calls POST /team/{id}/time_entries/start with body', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_SINGLE)

      await program.parseAsync([
        ...baseArgs, 'time', 'start',
        '--task-id', 't1', '--description', 'Starting work',
        '--billable', 'true', '--tag', 'dev',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/team/w1/time_entries/start', {
        tid: 't1',
        description: 'Starting work',
        billable: true,
        tags: [{ name: 'dev' }],
      })
    })
  })

  describe('time stop', () => {
    it('calls POST /team/{id}/time_entries/stop', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_SINGLE)

      await program.parseAsync([...baseArgs, 'time', 'stop'])

      expect(mockClient.post).toHaveBeenCalledWith('/team/w1/time_entries/stop')
    })
  })

  describe('time tags', () => {
    it('calls GET /team/{id}/time_entries/tags', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [{ name: 'dev', status: 'active' }] })

      await program.parseAsync([...baseArgs, 'time', 'tags', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/w1/time_entries/tags')
    })
  })

  describe('time add-tags', () => {
    it('calls POST /team/{id}/time_entries/tags with body', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        ...baseArgs, 'time', 'add-tags',
        '--timer-id', 'te1', '--timer-id', 'te2',
        '--tag', 'dev', '--tag', 'frontend',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/team/w1/time_entries/tags', {
        time_entry_ids: ['te1', 'te2'],
        tags: [{ name: 'dev' }, { name: 'frontend' }],
      })
    })

    it('errors when --timer-id or --tag missing', async () => {
      const { program, baseArgs } = createTestProgram('w1')
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync([...baseArgs, 'time', 'add-tags'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('time remove-tags', () => {
    it('calls DELETE /team/{id}/time_entries/tags with body', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        ...baseArgs, 'time', 'remove-tags',
        '--timer-id', 'te1', '--tag', 'old-tag',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/team/w1/time_entries/tags', {
        time_entry_ids: ['te1'],
        tags: [{ name: 'old-tag' }],
      })
    })
  })

  describe('time rename-tag', () => {
    it('calls PUT /team/{id}/time_entries/tags with body', async () => {
      const { program, mockClient, baseArgs } = createTestProgram('w1')
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([...baseArgs, 'time', 'rename-tag', '--name', 'old', '--new-name', 'new'])

      expect(mockClient.put).toHaveBeenCalledWith('/team/w1/time_entries/tags', {
        name: 'old',
        new_name: 'new',
      })
    })
  })

  describe('workspace ID requirement', () => {
    it('errors when workspace ID missing for workspace-scoped commands', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'time', 'get', 'te1', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      expect(process.stderr.write).toHaveBeenCalledWith(
        'Error: No workspace ID. Use --workspace-id or run: clickup config set workspace_id <id>\n',
      )
    })
  })
})
