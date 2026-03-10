import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerGoalCommands } from '../../commands/goal.js'
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

  registerGoalCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_GOALS = {
  goals: [
    {
      id: 'goal1',
      name: 'Launch v2',
      description: 'Ship version 2',
      due_date: '1740787200000',
      color: '#FF0000',
      percent_completed: 50,
      owners: [{ id: 1, username: 'alice' }],
      key_results: [],
    },
  ],
  folders: [],
}

const FIXTURE_GOAL = {
  goal: FIXTURE_GOALS.goals[0],
}

const FIXTURE_KEY_RESULT = {
  key_result: {
    id: 'kr1',
    name: 'Coverage',
    type: 'percentage',
    steps_start: 60,
    steps_end: 90,
    steps_current: 75,
  },
}

describe('goal commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('goal list', () => {
    it('calls GET /team/{id}/goal with workspace ID', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GOALS)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'goal', 'list', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/goal', {})
    })

    it('passes include_completed param', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GOALS)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'goal', 'list', '--include-completed', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/goal', { include_completed: 'true' })
    })

    it('errors without workspace ID', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'goal', 'list', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('goal get', () => {
    it('calls GET /goal/{id}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GOAL)

      await program.parseAsync(['node', 'clickup', 'goal', 'get', 'goal1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/goal/goal1')
    })
  })

  describe('goal create', () => {
    it('calls POST /team/{id}/goal with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GOAL)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'goal', 'create',
        '--name', 'Launch v2', '--description', 'Ship it',
        '--due-date', '1740787200000', '--color', '#FF0000',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/team/ws1/goal', {
        name: 'Launch v2',
        description: 'Ship it',
        due_date: '1740787200000',
        color: '#FF0000',
      })
    })

    it('parses owner IDs to integers', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_GOAL)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'goal', 'create',
        '--name', 'Test', '--owner', '123', '--owner', '456', '--multiple-owners',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/team/ws1/goal', {
        name: 'Test',
        owners: [123, 456],
        multiple_owners: true,
      })
    })
  })

  describe('goal update', () => {
    it('calls PUT /goal/{id} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'goal', 'update', 'goal1',
        '--name', 'New Name', '--color', '#00FF00',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/goal/goal1', {
        name: 'New Name',
        color: '#00FF00',
      })
    })
  })

  describe('goal delete', () => {
    it('calls DELETE /goal/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'goal', 'delete', 'goal1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/goal/goal1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'goal', 'delete', 'goal1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('goal add-key-result', () => {
    it('calls POST /goal/{id}/key_result with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_KEY_RESULT)

      await program.parseAsync([
        'node', 'clickup', 'goal', 'add-key-result', 'goal1',
        '--name', 'Coverage', '--type', 'percentage',
        '--steps-start', '60', '--steps-end', '90', '--unit', '%',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/goal/goal1/key_result', {
        name: 'Coverage',
        type: 'percentage',
        steps_start: 60,
        steps_end: 90,
        unit: '%',
      })
    })

    it('handles repeatable task-ids and list-ids', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_KEY_RESULT)

      await program.parseAsync([
        'node', 'clickup', 'goal', 'add-key-result', 'goal1',
        '--name', 'Tasks Done', '--type', 'automatic',
        '--task-ids', 't1', '--task-ids', 't2', '--list-ids', 'l1',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/goal/goal1/key_result', {
        name: 'Tasks Done',
        type: 'automatic',
        task_ids: ['t1', 't2'],
        list_ids: ['l1'],
      })
    })
  })

  describe('goal update-key-result', () => {
    it('calls PUT /key_result/{id} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'goal', 'update-key-result', 'kr1',
        '--steps-current', '75.5', '--note', 'Good progress',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/key_result/kr1', {
        steps_current: 75.5,
        note: 'Good progress',
      })
    })
  })

  describe('goal delete-key-result', () => {
    it('calls DELETE /key_result/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'goal', 'delete-key-result', 'kr1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/key_result/kr1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'goal', 'delete-key-result', 'kr1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })
})
