import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { registerSkillCommands } from '../../commands/skill-cmd.js'

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

  registerSkillCommands(program)
  return { program }
}

describe('skill commands', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('skill list', () => {
    it('lists all skills in JSON format', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'skill', 'list', '--format', 'json'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string
      const parsed = JSON.parse(output)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBeGreaterThan(0)

      // Root skill should be first
      const root = parsed.find((s: { name: string }) => s.name === 'clickup')
      expect(root).toBeTruthy()
      expect(root.type).toBe('root')
    })

    it('includes sub-skills and recipes', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'skill', 'list', '--format', 'json'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string
      const parsed = JSON.parse(output) as Array<{ type: string }>
      const types = new Set(parsed.map((s) => s.type))
      expect(types.has('root')).toBe(true)
      expect(types.has('sub-skill')).toBe(true)
      expect(types.has('recipe')).toBe(true)
    })
  })

  describe('skill show', () => {
    it('outputs SKILL.md content for the root skill', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'skill', 'show', 'clickup', '--format', 'table'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string
      expect(output).toContain('---')
      expect(output).toContain('name: clickup')
    })

    it('outputs JSON metadata with --format json', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'skill', 'show', 'clickup', '--format', 'json'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string
      const parsed = JSON.parse(output)
      expect(parsed.name).toBe('clickup')
      expect(parsed.type).toBe('root')
      expect(parsed.frontmatter).toBeTruthy()
    })

    it('errors for unknown skill', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'skill', 'show', 'nonexistent-skill'])

      expect(exitSpy).toHaveBeenCalledWith(4)
    })
  })

  describe('skill path', () => {
    it('prints the path to a skill directory', async () => {
      const { program } = createTestProgram()

      await program.parseAsync(['node', 'clickup', 'skill', 'path', 'clickup-tasks'])

      const output = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string
      expect(output.trim()).toContain('skills/clickup-tasks')
    })

    it('errors for unknown skill', async () => {
      const { program } = createTestProgram()
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await program.parseAsync(['node', 'clickup', 'skill', 'path', 'nonexistent-skill'])

      expect(exitSpy).toHaveBeenCalledWith(4)
    })
  })
})
