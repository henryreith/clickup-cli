import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { config } from '../../config.js'
import { registerSpaceCommands } from '../../commands/space.js'
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

  registerSpaceCommands(program, () => mockClient)
  return { program, mockClient }
}

describe('space commands', () => {
  beforeEach(() => {
    config.clear()
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env['CLICKUP_WORKSPACE_ID']
  })

  describe('space list', () => {
    it('calls GET /team/{id}/space with archived=false by default', async () => {
      config.set('workspace_id', '123')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        spaces: [
          { id: 's1', name: 'Engineering', private: false, color: '#000' },
          { id: 's2', name: 'Marketing', private: true, color: '#fff' },
        ],
      })

      await program.parseAsync(['node', 'clickup', 'space', 'list', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/123/space', { archived: 'false' })
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      const parsed = JSON.parse(output)
      expect(parsed).toHaveLength(2)
    })

    it('passes archived=true when --archived is set', async () => {
      config.set('workspace_id', '123')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ spaces: [] })

      await program.parseAsync(['node', 'clickup', 'space', 'list', '--archived', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/team/123/space', { archived: 'true' })
    })

    it('errors when no workspace ID is available', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'space', 'list'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('space get', () => {
    it('calls GET /space/{id}', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 's1', name: 'Engineering', private: false,
      })

      await program.parseAsync(['node', 'clickup', 'space', 'get', 's1', '--format', 'json'])

      expect(mockClient.get).toHaveBeenCalledWith('/space/s1')
    })
  })

  describe('space create', () => {
    it('calls POST /team/{id}/space with name', async () => {
      config.set('workspace_id', '123')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 's3', name: 'New Space',
      })

      await program.parseAsync(['node', 'clickup', 'space', 'create', '--name', 'New Space', '--format', 'json'])

      expect(mockClient.post).toHaveBeenCalledWith('/team/123/space', { name: 'New Space' })
    })

    it('includes multiple_assignees when flag is set', async () => {
      config.set('workspace_id', '123')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 's3', name: 'New Space' })

      await program.parseAsync(['node', 'clickup', 'space', 'create', '--name', 'New Space', '--multiple-assignees', '--format', 'json'])

      expect(mockClient.post).toHaveBeenCalledWith('/team/123/space', {
        name: 'New Space',
        multiple_assignees: true,
      })
    })

    it('parses features JSON', async () => {
      config.set('workspace_id', '123')
      const { program, mockClient } = createTestProgram()
      ;(mockClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 's3', name: 'New Space' })

      const features = '{"due_dates":{"enabled":true}}'
      await program.parseAsync(['node', 'clickup', 'space', 'create', '--name', 'New Space', '--features', features, '--format', 'json'])

      expect(mockClient.post).toHaveBeenCalledWith('/team/123/space', {
        name: 'New Space',
        features: { due_dates: { enabled: true } },
      })
    })
  })

  describe('space update', () => {
    it('calls PUT /space/{id} with updated fields', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 's1', name: 'Updated' })

      await program.parseAsync(['node', 'clickup', 'space', 'update', 's1', '--name', 'Updated', '--color', '#FF0000', '--format', 'json'])

      expect(mockClient.put).toHaveBeenCalledWith('/space/s1', {
        name: 'Updated',
        color: '#FF0000',
      })
    })
  })

  describe('space delete', () => {
    it('calls DELETE /space/{id} with --confirm', async () => {
      const { program, mockClient } = createTestProgram()
      ;(mockClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await program.parseAsync(['node', 'clickup', 'space', 'delete', 's1', '--confirm'])

      expect(mockClient.delete).toHaveBeenCalledWith('/space/s1')
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(output).toContain('Deleted space s1')
    })

    it('errors in non-TTY mode without --confirm', async () => {
      const { program } = createTestProgram()
      const originalIsTTY = process.stdin.isTTY
      Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'space', 'delete', 's1'])

      expect(exitSpy).toHaveBeenCalledWith(2)
      const errOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0]).join('')
      expect(errOutput).toContain('--confirm')
      Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
    })
  })
})
