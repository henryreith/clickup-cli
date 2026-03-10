import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerCommentCommands } from '../../commands/comment.js'
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

  registerCommentCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_COMMENTS = {
  comments: [
    {
      id: 'c1',
      comment_text: 'Hello world',
      user: { id: 1, username: 'alice' },
      assignee: null,
      resolved: false,
      date: '1700000000000',
    },
  ],
}

describe('comment commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('comment list', () => {
    it('calls GET /task/{id}/comment with --task-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_COMMENTS)

      await program.parseAsync(['node', 'clickup', 'comment', 'list', '--task-id', 't1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/task/t1/comment', {})
    })

    it('calls GET /list/{id}/comment with --list-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_COMMENTS)

      await program.parseAsync(['node', 'clickup', 'comment', 'list', '--list-id', 'l1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/list/l1/comment', {})
    })

    it('calls GET /view/{id}/comment with --view-id', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_COMMENTS)

      await program.parseAsync(['node', 'clickup', 'comment', 'list', '--view-id', 'v1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/view/v1/comment', {})
    })

    it('passes pagination params', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_COMMENTS)

      await program.parseAsync([
        'node', 'clickup', 'comment', 'list',
        '--task-id', 't1', '--start', '1700000000000', '--start-id', 'c0', '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/task/t1/comment', {
        start: '1700000000000',
        start_id: 'c0',
      })
    })

    it('errors when no parent ID provided', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'comment', 'list', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      expect(process.stderr.write).toHaveBeenCalledWith(
        'Error: Provide one of --task-id, --list-id, or --view-id.\n',
      )
    })
  })

  describe('comment create', () => {
    it('calls POST /task/{id}/comment with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c2' })

      await program.parseAsync([
        'node', 'clickup', 'comment', 'create',
        '--task-id', 't1', '--text', 'Great work!',
        '--assignee', '123', '--notify-all',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/task/t1/comment', {
        comment_text: 'Great work!',
        assignee: 123,
        notify_all: true,
      })
    })

    it('calls POST /list/{id}/comment', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c3' })

      await program.parseAsync([
        'node', 'clickup', 'comment', 'create',
        '--list-id', 'l1', '--text', 'List comment',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/list/l1/comment', {
        comment_text: 'List comment',
      })
    })
  })

  describe('comment update', () => {
    it('calls PUT /comment/{id} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'comment', 'update', 'c1',
        '--text', 'Updated text', '--resolved', 'true', '--assignee', '456',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/comment/c1', {
        comment_text: 'Updated text',
        assignee: 456,
        resolved: true,
      })
    })
  })

  describe('comment delete', () => {
    it('calls DELETE /comment/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'comment', 'delete', 'c1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/comment/c1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'comment', 'delete', 'c1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('comment list-threaded', () => {
    it('calls GET /comment/{id}/thread', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_COMMENTS)

      await program.parseAsync(['node', 'clickup', 'comment', 'list-threaded', 'c1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/comment/c1/thread')
    })
  })

  describe('comment reply', () => {
    it('calls POST /comment/{id}/thread with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c4' })

      await program.parseAsync([
        'node', 'clickup', 'comment', 'reply', 'c1',
        '--text', 'Thanks!', '--assignee', '789', '--notify-all',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/comment/c1/thread', {
        comment_text: 'Thanks!',
        assignee: 789,
        notify_all: true,
      })
    })
  })
})
