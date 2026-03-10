import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerDependencyCommands } from '../../commands/dependency.js'
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

  registerDependencyCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('dependency commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('dependency add', () => {
    it('calls POST /task/{id}/dependency with depends_on', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'dependency', 'add',
        '--task-id', 't1', '--depends-on', 't2',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/dependency', { depends_on: 't2' })
    })

    it('calls POST /task/{id}/dependency with dependency_of', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'dependency', 'add',
        '--task-id', 't1', '--dependency-of', 't3',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/dependency', { dependency_of: 't3' })
    })

    it('errors when neither --depends-on nor --dependency-of provided', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync([
        'node', 'clickup', 'dependency', 'add',
        '--task-id', 't1',
        '--format', 'json',
      ])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('dependency remove', () => {
    it('calls DELETE /task/{id}/dependency with depends_on query param', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'dependency', 'remove',
        '--task-id', 't1', '--depends-on', 't2',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/task/t1/dependency?depends_on=t2')
    })

    it('calls DELETE with dependency_of query param', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'dependency', 'remove',
        '--task-id', 't1', '--dependency-of', 't3',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/task/t1/dependency?dependency_of=t3')
    })
  })
})
