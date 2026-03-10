import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { registerSchemaCommands } from '../../commands/schema-cmd.js'
import { registerSchema, getResources } from '../../schema.js'

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

  registerSchemaCommands(program)
  return { program }
}

describe('schema commands', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('schema (no args)', () => {
    it('lists all registered resources', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'schema', '--format', 'json'])

      expect(process.stdout.write).toHaveBeenCalled()
      const resources = getResources()
      expect(resources.length).toBeGreaterThan(0)
    })
  })

  describe('schema <resource>', () => {
    it('lists actions for a known resource', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'schema', 'workspace', '--format', 'json'])

      expect(process.stdout.write).toHaveBeenCalled()
    })

    it('errors for unknown resource', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'schema', 'nonexistent', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('schema <resource>.<action>', () => {
    it('shows fields for a known resource.action in JSON format', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'schema', 'workspace.list', '--format', 'json'])

      expect(process.stdout.write).toHaveBeenCalled()
      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls
        .map((c: unknown[]) => c[0]).join('')
      const parsed = JSON.parse(output)
      expect(parsed.resource).toBe('workspace')
      expect(parsed.action).toBe('list')
      expect(parsed).toHaveProperty('required')
      expect(parsed).toHaveProperty('optional')
    })

    it('errors for unknown action', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'schema', 'workspace.nonexistent', '--format', 'json'])

      expect(exitSpy).toHaveBeenCalledWith(2)
    })
  })
})
