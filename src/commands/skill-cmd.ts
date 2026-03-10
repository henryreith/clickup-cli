import { Command } from 'commander'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { registerSchema } from '../schema.js'

const SKILL_COLUMNS: ColumnDef[] = [
  { key: 'name', header: 'Name', width: 28 },
  { key: 'type', header: 'Type', width: 10 },
  { key: 'description', header: 'Description', width: 55 },
]

registerSchema('skill', 'list', 'List all available skills', [])

registerSchema('skill', 'show', 'Show a skill by name', [
  { flag: '<name>', type: 'string', required: true, description: 'Skill name' },
])

registerSchema('skill', 'path', 'Print the file system path to a skill directory', [
  { flag: '<name>', type: 'string', required: true, description: 'Skill name' },
])

interface SkillMeta {
  name: string
  description: string
  type: string
  path: string
  frontmatter: Record<string, string>
}

function findSkillsDir(): string | undefined {
  // Check relative to this file (bundled in dist/)
  const thisDir = dirname(fileURLToPath(import.meta.url))
  const bundledDir = join(thisDir, '..', 'skills')
  if (existsSync(bundledDir)) return bundledDir

  // Check project root (development mode)
  const projectDir = join(thisDir, '..', '..', 'skills')
  if (existsSync(projectDir)) return projectDir

  return undefined
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const fm: Record<string, string> = {}

  if (!content.startsWith('---')) {
    return { frontmatter: fm, body: content }
  }

  const endIndex = content.indexOf('\n---', 3)
  if (endIndex === -1) {
    return { frontmatter: fm, body: content }
  }

  const yamlBlock = content.slice(4, endIndex)
  for (const line of yamlBlock.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()
    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key) fm[key] = value
  }

  const body = content.slice(endIndex + 4).trimStart()
  return { frontmatter: fm, body }
}

function classifySkill(fm: Record<string, string>): string {
  if (fm['user-invocable'] === 'false') return 'root'
  if (fm['disable-model-invocation'] === 'true') return 'recipe'
  return 'sub-skill'
}

function loadSkills(skillsDir: string): SkillMeta[] {
  const skills: SkillMeta[] = []
  let entries: string[]

  try {
    entries = readdirSync(skillsDir)
  } catch {
    return skills
  }

  for (const entry of entries) {
    const skillFile = join(skillsDir, entry, 'SKILL.md')
    if (!existsSync(skillFile)) continue

    try {
      const content = readFileSync(skillFile, 'utf-8')
      const { frontmatter } = parseFrontmatter(content)
      skills.push({
        name: frontmatter['name'] || entry,
        description: (frontmatter['description'] || '').slice(0, 100),
        type: classifySkill(frontmatter),
        path: join(skillsDir, entry),
        frontmatter,
      })
    } catch {
      // Skip unreadable skill files
    }
  }

  return skills.sort((a, b) => {
    const typeOrder: Record<string, number> = { root: 0, 'sub-skill': 1, recipe: 2 }
    const aOrder = typeOrder[a.type] ?? 3
    const bOrder = typeOrder[b.type] ?? 3
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })
}

function findSkill(skillsDir: string, name: string): { skillDir: string; content: string } | undefined {
  const skillDir = join(skillsDir, name)
  const skillFile = join(skillDir, 'SKILL.md')
  if (!existsSync(skillFile)) return undefined

  try {
    const content = readFileSync(skillFile, 'utf-8')
    return { skillDir, content }
  } catch {
    return undefined
  }
}

export function registerSkillCommands(program: Command): void {
  const skill = program.command('skill').description('Manage and inspect agent skills')

  skill
    .command('list')
    .description('List all available skills')
    .action(() => {
      const skillsDir = findSkillsDir()
      if (!skillsDir) {
        process.stderr.write('Error: Skills directory not found.\n')
        process.exit(4)
        return
      }

      const skills = loadSkills(skillsDir)
      formatOutput(skills, SKILL_COLUMNS, getOutputOptions(program))
    })

  skill
    .command('show')
    .description('Output SKILL.md content to stdout')
    .argument('<name>', 'Skill name')
    .action((name: string) => {
      const skillsDir = findSkillsDir()
      if (!skillsDir) {
        process.stderr.write('Error: Skills directory not found.\n')
        process.exit(4)
        return
      }

      const result = findSkill(skillsDir, name)
      if (!result) {
        process.stderr.write(`Error: Skill "${name}" not found. Run: clickup skill list\n`)
        process.exit(4)
        return
      }

      const outputOpts = getOutputOptions(program)
      const format = outputOpts.format ?? (process.stdout.isTTY ? 'table' : 'json')

      if (format === 'json') {
        const { frontmatter } = parseFrontmatter(result.content)
        const output = {
          name: frontmatter['name'] || name,
          description: frontmatter['description'] || '',
          type: classifySkill(frontmatter),
          path: result.skillDir,
          frontmatter,
        }
        process.stdout.write(JSON.stringify(output, null, 2) + '\n')
        return
      }

      process.stdout.write(result.content)
      if (!result.content.endsWith('\n')) {
        process.stdout.write('\n')
      }
    })

  skill
    .command('path')
    .description('Print file system path to a skill directory')
    .argument('<name>', 'Skill name')
    .action((name: string) => {
      const skillsDir = findSkillsDir()
      if (!skillsDir) {
        process.stderr.write('Error: Skills directory not found.\n')
        process.exit(4)
        return
      }

      const result = findSkill(skillsDir, name)
      if (!result) {
        process.stderr.write(`Error: Skill "${name}" not found. Run: clickup skill list\n`)
        process.exit(4)
        return
      }

      process.stdout.write(result.skillDir + '\n')
    })
}
