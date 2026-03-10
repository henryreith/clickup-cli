import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerTagCommands } from '../../commands/tag.js'
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

  registerTagCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('tag commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('tag list', () => {
    it('calls GET /space/{id}/tag', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        tags: [{ name: 'bug', tag_fg: '#fff', tag_bg: '#f00' }],
      })

      await program.parseAsync(['node', 'clickup', 'tag', 'list', '--space-id', 's1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/space/s1/tag')
    })
  })

  describe('tag create', () => {
    it('calls POST /space/{id}/tag with tag object', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'tag', 'create',
        '--space-id', 's1', '--name', 'design',
        '--fg-color', '#FFFFFF', '--bg-color', '#8B5CF6',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/space/s1/tag', {
        tag: { name: 'design', tag_fg: '#FFFFFF', tag_bg: '#8B5CF6' },
      })
    })
  })

  describe('tag update', () => {
    it('calls PUT /space/{id}/tag/{name} with updated fields', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'tag', 'update',
        '--space-id', 's1', '--name', 'design',
        '--new-name', 'ui-design',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/space/s1/tag/design', {
        tag: { name: 'ui-design' },
      })
    })
  })

  describe('tag delete', () => {
    it('calls DELETE /space/{id}/tag/{name} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'tag', 'delete',
        '--space-id', 's1', '--name', 'old-tag', '--confirm',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/space/s1/tag/old-tag')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync([
        'node', 'clickup', 'tag', 'delete',
        '--space-id', 's1', '--name', 'old-tag',
      ])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('tag add', () => {
    it('calls POST /task/{id}/tag/{name}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'tag', 'add',
        '--task-id', 't1', '--name', 'bug',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/tag/bug')
    })
  })

  describe('tag remove', () => {
    it('calls DELETE /task/{id}/tag/{name}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'tag', 'remove',
        '--task-id', 't1', '--name', 'bug',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/task/t1/tag/bug')
    })
  })
})
