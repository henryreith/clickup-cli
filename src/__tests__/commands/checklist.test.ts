import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerChecklistCommands } from '../../commands/checklist.js'
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

  registerChecklistCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('checklist commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checklist create', () => {
    it('calls POST /task/{id}/checklist with name', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        checklist: { id: 'chk1', name: 'Launch', resolved: 0, unresolved: 0 },
      })

      await program.parseAsync([
        'node', 'clickup', 'checklist', 'create',
        '--task-id', 't1', '--name', 'Launch',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/checklist', { name: 'Launch' })
    })
  })

  describe('checklist update', () => {
    it('calls PUT /checklist/{id} with updated fields', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({
        checklist: { id: 'chk1', name: 'Updated', resolved: 0, unresolved: 0 },
      })

      await program.parseAsync([
        'node', 'clickup', 'checklist', 'update', 'chk1',
        '--name', 'Updated', '--position', '2',
        '--format', 'json',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/checklist/chk1', { name: 'Updated', position: 2 })
    })
  })

  describe('checklist delete', () => {
    it('calls DELETE /checklist/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'checklist', 'delete', 'chk1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/checklist/chk1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'checklist', 'delete', 'chk1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('checklist add-item', () => {
    it('calls POST /checklist/{id}/checklist_item with name', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        checklist: { id: 'chk1', name: 'Launch' },
      })

      await program.parseAsync([
        'node', 'clickup', 'checklist', 'add-item', 'chk1',
        '--name', 'Verify staging',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/checklist/chk1/checklist_item', { name: 'Verify staging' })
    })

    it('includes optional fields', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        checklist: { id: 'chk1', name: 'Launch' },
      })

      await program.parseAsync([
        'node', 'clickup', 'checklist', 'add-item', 'chk1',
        '--name', 'Check deploy',
        '--assignee', '111',
        '--resolved', 'true',
        '--parent', 'item1',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/checklist/chk1/checklist_item', {
        name: 'Check deploy',
        assignee: 111,
        resolved: true,
        parent: 'item1',
      })
    })
  })

  describe('checklist update-item', () => {
    it('calls PUT /checklist/{id}/checklist_item/{itemId}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({
        checklist: { id: 'chk1', name: 'Launch' },
      })

      await program.parseAsync([
        'node', 'clickup', 'checklist', 'update-item', 'chk1',
        '--item-id', 'item1', '--resolved', 'true',
        '--format', 'json',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/checklist/chk1/checklist_item/item1', { resolved: true })
    })
  })

  describe('checklist delete-item', () => {
    it('calls DELETE /checklist/{id}/checklist_item/{itemId} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'checklist', 'delete-item', 'chk1',
        '--item-id', 'item1', '--confirm',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/checklist/chk1/checklist_item/item1')
    })
  })
})
