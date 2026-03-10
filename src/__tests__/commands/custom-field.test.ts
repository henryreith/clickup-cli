import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerFieldCommands } from '../../commands/custom-field.js'
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

  registerFieldCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('custom field commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('field list', () => {
    it('routes to /list/{id}/field with --list-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        fields: [{ id: 'f1', name: 'Priority', type: 'dropdown' }],
      })

      await program.parseAsync(['node', 'clickup', 'field', 'list', '--list-id', 'l1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1/field')
    })

    it('routes to /folder/{id}/field with --folder-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ fields: [] })

      await program.parseAsync(['node', 'clickup', 'field', 'list', '--folder-id', 'f1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/folder/f1/field')
    })

    it('routes to /space/{id}/field with --space-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ fields: [] })

      await program.parseAsync(['node', 'clickup', 'field', 'list', '--space-id', 's1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/space/s1/field')
    })

    it('routes to /team/{id}/field with --workspace-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ fields: [] })

      await program.parseAsync(['node', 'clickup', 'field', 'list', '--workspace-id', 'ws1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/field')
    })

    it('errors when no ID flag is provided', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'field', 'list', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('field set', () => {
    it('calls POST /task/{id}/field/{fid} with string value', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'field', 'set',
        '--task-id', 't1', '--field-id', 'cf1', '--value', 'Approved',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/field/cf1', { value: 'Approved' })
    })

    it('parses JSON value', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'field', 'set',
        '--task-id', 't1', '--field-id', 'cf1', '--value', '[1,2,3]',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/field/cf1', { value: [1, 2, 3] })
    })
  })

  describe('field remove', () => {
    it('calls DELETE /task/{id}/field/{fid}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'field', 'remove',
        '--task-id', 't1', '--field-id', 'cf1',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/task/t1/field/cf1')
    })
  })
})
