import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerSharedHierarchyCommands } from '../../commands/shared-hierarchy.js'
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

  registerSharedHierarchyCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_SHARED = {
  shared: {
    tasks: [
      { id: 'task1', name: 'Shared Task 1', status: { status: 'open' } },
    ],
    lists: [
      { id: 'list1', name: 'Shared List 1' },
    ],
    folders: [
      { id: 'folder1', name: 'Shared Folder 1' },
    ],
  },
}

describe('shared-hierarchy commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('shared-hierarchy get', () => {
    it('calls GET /team/{id}/shared with workspace ID', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_SHARED)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'shared-hierarchy', 'get', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/shared')
    })

    it('errors without workspace ID', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'shared-hierarchy', 'get', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })

    it('outputs all shared items in JSON format', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_SHARED)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'shared-hierarchy', 'get', '--format', 'json'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string
      const parsed = JSON.parse(output)
      expect(parsed.tasks).toHaveLength(1)
      expect(parsed.lists).toHaveLength(1)
      expect(parsed.folders).toHaveLength(1)
    })
  })
})
