import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerTemplateCommands } from '../../commands/template.js'
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

  registerTemplateCommands(program, () => mockClient)
  return { program, mockClient }
}

const FIXTURE_TEMPLATES = {
  templates: [
    { id: 'tmpl_001', name: 'Bug Report Template' },
  ],
}

const FIXTURE_APPLIED = { id: 'tmpl_001', name: 'Bug Report Template' }

describe('template commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('template list', () => {
    it('calls GET /team/{id}/taskTemplate with workspace ID', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_TEMPLATES)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'template', 'list', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/taskTemplate', {})
    })

    it('sends page query param', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_TEMPLATES)

      await program.parseAsync(['node', 'clickup', '--workspace-id', 'ws1', 'template', 'list', '--page', '2', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/ws1/taskTemplate', { page: '2' })
    })

    it('errors without workspace ID', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'template', 'list', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('template apply-task', () => {
    it('calls POST /list/{id}/taskTemplate/{id} with empty body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_APPLIED)

      await program.parseAsync([
        'node', 'clickup', 'template', 'apply-task',
        '--list-id', 'list_001',
        '--template-id', 'tmpl_001',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/list/list_001/taskTemplate/tmpl_001', {})
    })

    it('includes name in body when --name is provided', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_APPLIED)

      await program.parseAsync([
        'node', 'clickup', 'template', 'apply-task',
        '--list-id', 'list_001',
        '--template-id', 'tmpl_001',
        '--name', 'My Task',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/list/list_001/taskTemplate/tmpl_001', { name: 'My Task' })
    })
  })

  describe('template apply-list', () => {
    it('calls POST /folder/{id}/listTemplate/{id} when --folder-id is provided', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_APPLIED)

      await program.parseAsync([
        'node', 'clickup', 'template', 'apply-list',
        '--template-id', 'tmpl_001',
        '--folder-id', 'folder_001',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/folder/folder_001/listTemplate/tmpl_001', {})
    })

    it('calls POST /space/{id}/listTemplate/{id} when --space-id is provided', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_APPLIED)

      await program.parseAsync([
        'node', 'clickup', 'template', 'apply-list',
        '--template-id', 'tmpl_001',
        '--space-id', 'space_001',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/space/space_001/listTemplate/tmpl_001', {})
    })

    it('exits with code 2 when neither --folder-id nor --space-id is provided', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync([
        'node', 'clickup', 'template', 'apply-list',
        '--template-id', 'tmpl_001',
        '--format', 'json',
      ])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('template apply-folder', () => {
    it('calls POST /space/{id}/folderTemplate/{id} with empty body', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_APPLIED)

      await program.parseAsync([
        'node', 'clickup', 'template', 'apply-folder',
        '--space-id', 'space_001',
        '--template-id', 'tmpl_001',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/space/space_001/folderTemplate/tmpl_001', {})
    })

    it('includes name in body when --name is provided', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(FIXTURE_APPLIED)

      await program.parseAsync([
        'node', 'clickup', 'template', 'apply-folder',
        '--space-id', 'space_001',
        '--template-id', 'tmpl_001',
        '--name', 'My Folder',
        '--format', 'json',
      ])

      expect(mockClient.post).toHaveBeenCalledWith('/space/space_001/folderTemplate/tmpl_001', { name: 'My Folder' })
    })
  })
})
