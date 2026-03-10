import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerFolderCommands } from '../../commands/folder.js'
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

  registerFolderCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('folder commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('folder list', () => {
    it('calls GET /space/{id}/folder with archived=false by default', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        folders: [
          { id: 'f1', name: 'Sprint 1', task_count: '5' },
          { id: 'f2', name: 'Sprint 2', task_count: '3' },
        ],
      })

      await program.parseAsync(['node', 'clickup', 'folder', 'list', '--space-id', 's1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/space/s1/folder', { archived: 'false' })
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      const parsed = JSON.parse(output)
      expect(parsed).toHaveLength(2)
    })

    it('passes archived=true when --archived is set', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ folders: [] })

      await program.parseAsync(['node', 'clickup', 'folder', 'list', '--space-id', 's1', '--archived', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/space/s1/folder', { archived: 'true' })
    })
  })

  describe('folder get', () => {
    it('calls GET /folder/{id}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'f1', name: 'Sprint 1', task_count: '5',
      })

      await program.parseAsync(['node', 'clickup', 'folder', 'get', 'f1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/folder/f1')
    })
  })

  describe('folder create', () => {
    it('calls POST /space/{id}/folder with name', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'f3', name: 'New Folder',
      })

      await program.parseAsync(['node', 'clickup', 'folder', 'create', '--space-id', 's1', '--name', 'New Folder', '--format', 'json'])

      expect(mockClient.post).toHaveBeenCalledWith('/space/s1/folder', { name: 'New Folder' })
    })
  })

  describe('folder update', () => {
    it('calls PUT /folder/{id} with updated name', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'f1', name: 'Renamed' })

      await program.parseAsync(['node', 'clickup', 'folder', 'update', 'f1', '--name', 'Renamed', '--format', 'json'])

      expect(mockClient.put).toHaveBeenCalledWith('/folder/f1', { name: 'Renamed' })
    })
  })

  describe('folder delete', () => {
    it('calls DELETE /folder/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'folder', 'delete', 'f1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/folder/f1')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Deleted folder f1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'folder', 'delete', 'f1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      const errOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(errOutput).toContain('--confirm')
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })
})
