import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerWebhookCommands } from '../../commands/webhook.js'
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

  registerWebhookCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_WEBHOOKS = {
  webhooks: [
    {
      id: 'wh1',
      endpoint: 'https://example.com/hook',
      events: ['taskCreated', 'taskUpdated'],
      health: { status: 'active', fail_count: 0 },
    },
  ],
}

const FIXTURE_WEBHOOK = {
  id: 'wh1',
  webhook: FIXTURE_WEBHOOKS.webhooks[0],
}

describe('webhook commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('webhook list', () => {
    it('calls GET /team/{id}/webhook with workspace ID', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_WEBHOOKS)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'webhook', 'list', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/webhook')
    })

    it('errors without workspace ID', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'webhook', 'list', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('webhook create', () => {
    it('calls POST /team/{id}/webhook with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_WEBHOOK)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'webhook', 'create',
        '--endpoint', 'https://example.com/hook',
        '--event', 'taskCreated', '--event', 'taskUpdated',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/team/ws1/webhook', {
        endpoint: 'https://example.com/hook',
        events: ['taskCreated', 'taskUpdated'],
      })
    })

    it('includes scope IDs when provided', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_WEBHOOK)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'webhook', 'create',
        '--endpoint', 'https://example.com/hook',
        '--event', 'taskCreated',
        '--space-id', 's1', '--list-id', 'l1',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/team/ws1/webhook', {
        endpoint: 'https://example.com/hook',
        events: ['taskCreated'],
        space_id: 's1',
        list_id: 'l1',
      })
    })
  })

  describe('webhook update', () => {
    it('calls PUT /webhook/{id} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', 'webhook', 'update', 'wh1',
        '--endpoint', 'https://example.com/new-hook',
        '--event', 'taskDeleted', '--status', 'active',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/webhook/wh1', {
        endpoint: 'https://example.com/new-hook',
        events: ['taskDeleted'],
        status: 'active',
      })
    })
  })

  describe('webhook delete', () => {
    it('calls DELETE /webhook/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'webhook', 'delete', 'wh1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/webhook/wh1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'webhook', 'delete', 'wh1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })

  describe('webhook events', () => {
    it('outputs event list without making API calls', async () => {
      const { program, mockClient } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'webhook', 'events', '--format', 'json'])

      expect(mockClient.get).not.toHaveBeenCalled()
      expect(mockClient.post).not.toHaveBeenCalled()
      expect(process.stdout.write).toHaveBeenCalled()
    })
  })
})
