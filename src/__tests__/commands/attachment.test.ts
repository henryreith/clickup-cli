import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerAttachmentCommands } from '../../commands/attachment.js'
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

  registerAttachmentCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('attachment commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('attachment upload', () => {
    it('calls client.upload with correct path and file', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.upload as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'att1', title: 'mockup.fig', url: 'https://example.com/file', type: 'fig', size: 1024,
      })

      await program.parseAsync([
        'node', 'clickup', 'attachment', 'upload',
        '--task-id', 't1', '--file', './designs/mockup.fig',
        '--format', 'json',
      ])

      expect(mockClient.upload).toHaveBeenCalledWith('/task/t1/attachment', './designs/mockup.fig', undefined)
    })

    it('passes custom filename', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.upload as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'att2', title: 'Report.pdf',
      })

      await program.parseAsync([
        'node', 'clickup', 'attachment', 'upload',
        '--task-id', 't1', '--file', './export.pdf', '--filename', 'Q1-Report.pdf',
        '--format', 'json',
      ])

      expect(mockClient.upload).toHaveBeenCalledWith('/task/t1/attachment', './export.pdf', 'Q1-Report.pdf')
    })
  })
})
