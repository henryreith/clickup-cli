import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerRelationCommands } from '../../commands/relation.js'
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

  registerRelationCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('relation commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('relation add', () => {
    it('calls POST /task/{id}/link/{linkId}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'relation', 'add',
        '--task-id', 't1', '--links-to', 't2',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/link/t2')
    })
  })

  describe('relation remove', () => {
    it('calls DELETE /task/{id}/link/{linkId}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'relation', 'remove',
        '--task-id', 't1', '--links-to', 't2',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/task/t1/link/t2')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Removed relation')
    })
  })
})
