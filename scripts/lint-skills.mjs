#!/usr/bin/env node
// Validates every skills/*/SKILL.md against the repo's skill conventions
// (CLAUDE.md "Schema and Skills") and the Agent Skills spec basics.
// Requires a built CLI in dist/ to verify allowed-tools patterns.

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const skillsDir = join(root, 'skills')
const distCli = join(root, 'dist', 'clickup.js')

const errors = []
const fail = (skill, msg) => errors.push(`${skill}: ${msg}`)

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return undefined
  const end = content.indexOf('\n---', 3)
  if (end === -1) return undefined
  const fm = {}
  for (const line of content.slice(4, end).split('\n')) {
    const i = line.indexOf(':')
    if (i === -1) continue
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return fm
}

// Ground truth from the built CLI
let topLevelCommands = []
let schemaResources = []
if (existsSync(distCli)) {
  const help = execFileSync('node', [distCli, '--help'], { encoding: 'utf-8' })
  const cmdSection = help.slice(help.indexOf('Commands:'))
  topLevelCommands = [...cmdSection.matchAll(/^  (\S+)/gm)].map((m) => m[1].replace(/\|.*/, ''))
  schemaResources = JSON.parse(
    execFileSync('node', [distCli, 'schema', '--format', 'json'], { encoding: 'utf-8' }),
  ).map((r) => r.resource)
} else {
  console.error('warning: dist/clickup.js not built; skipping allowed-tools verification')
}

function checkAllowedTools(skill, allowedTools) {
  for (const pattern of allowedTools.split(',').map((s) => s.trim())) {
    const m = /^Bash\(clickup(?: ([a-z-]+))?[^)]*\)$/.exec(pattern)
    if (!m) {
      if (!/^(Read|Write|Bash\()/.test(pattern)) fail(skill, `unrecognized allowed-tools entry: ${pattern}`)
      continue
    }
    const word = m[1]
    if (!word || word === '*' || topLevelCommands.length === 0) continue
    if (word === 'schema') {
      const res = /schema ([a-z-]+)/.exec(pattern)?.[1]?.replace(/\*$/, '')
      if (res && !schemaResources.some((r) => r.startsWith(res))) {
        fail(skill, `allowed-tools references unknown schema resource "${res}" in: ${pattern}`)
      }
      continue
    }
    if (!topLevelCommands.includes(word)) {
      fail(skill, `allowed-tools references unknown command "clickup ${word}" in: ${pattern}`)
    }
  }
}

const dirs = readdirSync(skillsDir).filter((d) => existsSync(join(skillsDir, d, 'SKILL.md')))

for (const dir of dirs) {
  const content = readFileSync(join(skillsDir, dir, 'SKILL.md'), 'utf-8')
  const lines = content.split('\n').length
  const fm = parseFrontmatter(content)

  if (!fm) {
    fail(dir, 'missing or malformed YAML frontmatter')
    continue
  }
  if (!fm.name) fail(dir, 'frontmatter missing "name"')
  else if (fm.name !== dir) fail(dir, `frontmatter name "${fm.name}" does not match directory name`)

  if (!fm.description) fail(dir, 'frontmatter missing "description"')
  else {
    if (fm.description.length < 50) fail(dir, 'description too short to be discoverable (min 50 chars)')
    if (!/use when/i.test(fm.description)) fail(dir, 'description must say when to use the skill ("Use when...")')
  }

  const isRoot = fm['user-invocable'] === 'false'
  const isRecipe = fm['disable-model-invocation'] === 'true' && !isRoot

  if (isRecipe) {
    if (lines > 400) fail(dir, `recipe skill is ${lines} lines (limit 400)`)
    if (fm.context !== 'fork') fail(dir, 'recipe skill must set context: fork')
    if (!fm.agent) fail(dir, 'recipe skill must set an agent')
    if (!fm['allowed-tools']) fail(dir, 'recipe skill must set allowed-tools')
    if (!content.includes('$ARGUMENTS')) fail(dir, 'recipe skill should read $ARGUMENTS for parameterized invocation')
  } else if (!isRoot) {
    if (lines > 300) fail(dir, `sub-skill is ${lines} lines (limit 300)`)
    if (!fm['allowed-tools']) fail(dir, 'sub-skill must set allowed-tools scoped to its commands')
  }

  if (fm['allowed-tools']) checkAllowedTools(dir, fm['allowed-tools'])

  if (content.includes('—')) fail(dir, 'contains an em dash (repo convention: no em dashes)')
}

// The root skill's index table must mention every skill directory
const rootSkill = readFileSync(join(skillsDir, 'clickup', 'SKILL.md'), 'utf-8')
for (const dir of dirs) {
  if (dir === 'clickup') continue
  if (!rootSkill.includes(dir)) fail('clickup', `root skill index does not mention ${dir}`)
}

if (errors.length > 0) {
  console.error(`skill lint: ${errors.length} problem(s) in ${dirs.length} skills\n`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}
console.log(`skill lint: ${dirs.length} skills OK`)
