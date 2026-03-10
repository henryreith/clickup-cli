import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerDocCommands } from '../../commands/doc.js'
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

  registerDocCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_DOCS = {
  docs: [
    { id: 'doc1', name: 'Onboarding Guide', date_created: '2024-01-01', date_updated: '2024-01-02' },
    { id: 'doc2', name: 'API Reference', date_created: '2024-01-03', date_updated: '2024-01-04' },
  ],
}

const FIXTURE_DOC = {
  id: 'doc1',
  name: 'Onboarding Guide',
  date_created: '2024-01-01',
  date_updated: '2024-01-02',
}

const FIXTURE_PAGES = {
  pages: [
    { id: 'page1', name: 'Introduction', parent_page: null, date_created: '2024-01-01' },
    { id: 'page2', name: 'Getting Started', parent_page: 'page1', date_created: '2024-01-02' },
  ],
}

describe('doc commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('doc list', () => {
    it('calls GET /v3/workspaces/{id}/docs', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_DOCS)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'doc', 'list', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/v3/workspaces/ws1/docs')
    })

    it('errors without workspace ID', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'doc', 'list', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('doc get', () => {
    it('calls GET /v3/workspaces/{id}/docs/{docId}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_DOC)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'get', '--doc-id', 'doc1', '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/v3/workspaces/ws1/docs/doc1')
    })
  })

  describe('doc create', () => {
    it('calls POST /v3/workspaces/{id}/docs with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_DOC)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'create', '--name', 'New Doc', '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/v3/workspaces/ws1/docs', { name: 'New Doc' })
    })

    it('includes parent when specified', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_DOC)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'create',
        '--name', 'New Doc', '--parent-id', 'space1', '--parent-type', '4', '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/v3/workspaces/ws1/docs', {
        name: 'New Doc',
        parent: { id: 'space1', type: 4 },
      })
    })
  })

  describe('doc update', () => {
    it('calls PUT /v3/workspaces/{id}/docs/{docId} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_DOC)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'update', '--doc-id', 'doc1', '--name', 'Updated', '--format', 'json',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/v3/workspaces/ws1/docs/doc1', { name: 'Updated' })
    })
  })

  describe('doc delete', () => {
    it('calls DELETE /v3/workspaces/{id}/docs/{docId} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'delete', '--doc-id', 'doc1', '--confirm', '--format', 'json',
      ])

      expect(mockClient.delete).toHaveBeenCalledWith('/v3/workspaces/ws1/docs/doc1')
    })
  })

  describe('doc search', () => {
    it('calls GET /v3/workspaces/{id}/docs with query param', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_DOCS)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'search', '--query', 'onboarding', '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/v3/workspaces/ws1/docs', { query: 'onboarding' })
    })
  })

  describe('doc pages', () => {
    it('calls GET /v3/workspaces/{id}/docs/{docId}/pages', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_PAGES)

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'pages', '--doc-id', 'doc1', '--format', 'json',
      ])

      expect(mockClient.get).toHaveBeenCalledWith('/v3/workspaces/ws1/docs/doc1/pages')
    })
  })

  describe('doc page-create', () => {
    it('calls POST /v3/workspaces/{id}/docs/{docId}/pages with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_PAGES.pages[0])

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'page-create',
        '--doc-id', 'doc1', '--name', 'New Page', '--content', 'Hello', '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/v3/workspaces/ws1/docs/doc1/pages', {
        name: 'New Page',
        content: 'Hello',
      })
    })
  })

  describe('doc page-update', () => {
    it('calls PUT /v3/workspaces/{id}/docs/{docId}/pages/{pageId} with body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_PAGES.pages[0])

      await program.parseAsync([
        'node', 'clickup', '--workspace-id', 'ws1', 'doc', 'page-update',
        '--doc-id', 'doc1', '--page-id', 'page1', '--name', 'Updated', '--format', 'json',
      ])

      expect(mockClient.put).toHaveBeenCalledWith('/v3/workspaces/ws1/docs/doc1/pages/page1', { name: 'Updated' })
    })
  })
})
