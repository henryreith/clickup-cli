import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import type { GoalListResponse, GoalResponse, KeyResultResponse } from '../types/goal.js'
import { registerSchema } from '../schema.js'

registerSchema('goal', 'list', 'List goals in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--include-completed', type: 'boolean', required: false, description: 'Include completed goals' },
])

registerSchema('goal', 'get', 'Get a goal', [
  { flag: '<goal-id>', type: 'string', required: true, description: 'Goal ID' },
])

registerSchema('goal', 'create', 'Create a goal', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--name', type: 'string', required: true, description: 'Goal name' },
  { flag: '--due-date', type: 'string', required: false, description: 'Due date (Unix ms)' },
  { flag: '--description', type: 'string', required: false, description: 'Description' },
  { flag: '--multiple-owners', type: 'boolean', required: false, description: 'Allow multiple owners' },
  { flag: '--owner', type: 'string[]', required: false, description: 'Owner user ID (repeatable)' },
  { flag: '--color', type: 'string', required: false, description: 'Color hex code' },
])

registerSchema('goal', 'update', 'Update a goal', [
  { flag: '<goal-id>', type: 'string', required: true, description: 'Goal ID' },
  { flag: '--name', type: 'string', required: false, description: 'Goal name' },
  { flag: '--due-date', type: 'string', required: false, description: 'Due date (Unix ms)' },
  { flag: '--description', type: 'string', required: false, description: 'Description' },
  { flag: '--color', type: 'string', required: false, description: 'Color hex code' },
])

registerSchema('goal', 'delete', 'Delete a goal', [
  { flag: '<goal-id>', type: 'string', required: true, description: 'Goal ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

registerSchema('goal', 'add-key-result', 'Add a key result to a goal', [
  { flag: '<goal-id>', type: 'string', required: true, description: 'Goal ID' },
  { flag: '--name', type: 'string', required: true, description: 'Key result name' },
  { flag: '--type', type: 'string', required: true, description: 'Type (number, currency, boolean, percentage, automatic)' },
  { flag: '--steps-start', type: 'string', required: false, description: 'Starting value' },
  { flag: '--steps-end', type: 'string', required: false, description: 'Target value' },
  { flag: '--unit', type: 'string', required: false, description: 'Unit label' },
])

registerSchema('goal', 'update-key-result', 'Update a key result', [
  { flag: '<key-result-id>', type: 'string', required: true, description: 'Key result ID' },
  { flag: '--name', type: 'string', required: false, description: 'Key result name' },
  { flag: '--steps-current', type: 'string', required: false, description: 'Current value' },
  { flag: '--note', type: 'string', required: false, description: 'Progress note' },
])

registerSchema('goal', 'delete-key-result', 'Delete a key result', [
  { flag: '<key-result-id>', type: 'string', required: true, description: 'Key result ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

const GOAL_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'description', header: 'Description', width: 25 },
  { key: 'due_date', header: 'Due Date', width: 15 },
  { key: 'color', header: 'Color', width: 10 },
  { key: 'percent_completed', header: '% Done', width: 8 },
  { key: 'owner_names', header: 'Owners', width: 20 },
]

const KEY_RESULT_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'name', header: 'Name', width: 25 },
  { key: 'type', header: 'Type', width: 12 },
  { key: 'steps_start', header: 'Start', width: 10 },
  { key: 'steps_end', header: 'End', width: 10 },
  { key: 'steps_current', header: 'Current', width: 10 },
  { key: 'unit', header: 'Unit', width: 10 },
  { key: 'percent_completed', header: '% Done', width: 8 },
]

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value])
}

function requireWorkspaceId(program: Command): string | undefined {
  const globalOpts = program.opts()
  const workspaceId = resolveWorkspaceId(globalOpts['workspaceId'] as string | undefined)
  if (!workspaceId) {
    process.stderr.write('Error: No workspace ID. Use --workspace-id or run: clickup config set workspace_id <id>\n')
    process.exit(2)
    return undefined
  }
  return workspaceId
}

function formatGoals(goals: Record<string, unknown>[]) {
  return goals.map((g) => ({
    ...g,
    owner_names: Array.isArray(g['owners'])
      ? (g['owners'] as Record<string, unknown>[]).map((o) => o['username'] ?? '').join(', ')
      : '',
  }))
}

export function registerGoalCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const goal = program.command('goal').description('Manage goals')

  goal
    .command('list')
    .description('List goals')
    .option('--include-completed', 'Include completed goals')
    .action(async (opts: { includeCompleted?: boolean }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const params: Record<string, string | undefined> = {}
      if (opts.includeCompleted) params['include_completed'] = 'true'
      const data = await client.get<GoalListResponse>(`/team/${workspaceId}/goal`, params)
      formatOutput(formatGoals(data.goals as Record<string, unknown>[]), GOAL_COLUMNS, getOutputOptions(program))
    })

  goal
    .command('get')
    .description('Get a goal')
    .argument('<goal-id>', 'Goal ID')
    .action(async (goalId: string) => {
      const client = getClient()
      const data = await client.get<GoalResponse>(`/goal/${goalId}`)
      formatOutput(formatGoals([data.goal as Record<string, unknown>]), GOAL_COLUMNS, getOutputOptions(program))
    })

  goal
    .command('create')
    .description('Create a goal')
    .requiredOption('--name <name>', 'Goal name')
    .option('--due-date <date>', 'Due date (Unix ms)')
    .option('--description <desc>', 'Description')
    .option('--multiple-owners', 'Allow multiple owners')
    .option('--owner <id>', 'Owner user ID (repeatable)', collect, [])
    .option('--color <color>', 'Color hex code')
    .action(async (opts: { name: string; dueDate?: string; description?: string; multipleOwners?: boolean; owner: string[]; color?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.dueDate !== undefined) body['due_date'] = opts.dueDate
      if (opts.description !== undefined) body['description'] = opts.description
      if (opts.multipleOwners) body['multiple_owners'] = true
      if (opts.owner.length) body['owners'] = opts.owner.map((id) => parseInt(id, 10))
      if (opts.color !== undefined) body['color'] = opts.color
      const data = await client.post<GoalResponse>(`/team/${workspaceId}/goal`, body)
      process.stdout.write(`Created goal ${data.goal?.id ?? ''}\n`)
    })

  goal
    .command('update')
    .description('Update a goal')
    .argument('<goal-id>', 'Goal ID')
    .option('--name <name>', 'Goal name')
    .option('--due-date <date>', 'Due date (Unix ms)')
    .option('--description <desc>', 'Description')
    .option('--color <color>', 'Color hex code')
    .action(async (goalId: string, opts: { name?: string; dueDate?: string; description?: string; color?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      if (opts.dueDate !== undefined) body['due_date'] = opts.dueDate
      if (opts.description !== undefined) body['description'] = opts.description
      if (opts.color !== undefined) body['color'] = opts.color
      await client.put(`/goal/${goalId}`, body)
      process.stdout.write(`Updated goal ${goalId}\n`)
    })

  goal
    .command('delete')
    .description('Delete a goal')
    .argument('<goal-id>', 'Goal ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (goalId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete goal ${goalId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/goal/${goalId}`)
      process.stdout.write(`Deleted goal ${goalId}\n`)
    })

  goal
    .command('add-key-result')
    .description('Add a key result to a goal')
    .argument('<goal-id>', 'Goal ID')
    .requiredOption('--name <name>', 'Key result name')
    .requiredOption('--type <type>', 'Type (number, currency, boolean, percentage, automatic)')
    .option('--steps-start <n>', 'Starting value')
    .option('--steps-end <n>', 'Target value')
    .option('--unit <unit>', 'Unit label')
    .option('--task-ids <id>', 'Task ID (repeatable, for automatic type)', collect, [])
    .option('--list-ids <id>', 'List ID (repeatable, for automatic type)', collect, [])
    .action(async (goalId: string, opts: { name: string; type: string; stepsStart?: string; stepsEnd?: string; unit?: string; taskIds: string[]; listIds: string[] }) => {
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name, type: opts.type }
      if (opts.stepsStart !== undefined) body['steps_start'] = parseFloat(opts.stepsStart)
      if (opts.stepsEnd !== undefined) body['steps_end'] = parseFloat(opts.stepsEnd)
      if (opts.unit !== undefined) body['unit'] = opts.unit
      if (opts.taskIds.length) body['task_ids'] = opts.taskIds
      if (opts.listIds.length) body['list_ids'] = opts.listIds
      const data = await client.post<KeyResultResponse>(`/goal/${goalId}/key_result`, body)
      process.stdout.write(`Created key result ${data.key_result?.id ?? ''}\n`)
    })

  goal
    .command('update-key-result')
    .description('Update a key result')
    .argument('<key-result-id>', 'Key result ID')
    .option('--name <name>', 'Key result name')
    .option('--steps-current <n>', 'Current value')
    .option('--note <note>', 'Progress note')
    .action(async (keyResultId: string, opts: { name?: string; stepsCurrent?: string; note?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      if (opts.stepsCurrent !== undefined) body['steps_current'] = parseFloat(opts.stepsCurrent)
      if (opts.note !== undefined) body['note'] = opts.note
      await client.put(`/key_result/${keyResultId}`, body)
      process.stdout.write(`Updated key result ${keyResultId}\n`)
    })

  goal
    .command('delete-key-result')
    .description('Delete a key result')
    .argument('<key-result-id>', 'Key result ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (keyResultId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete key result ${keyResultId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/key_result/${keyResultId}`)
      process.stdout.write(`Deleted key result ${keyResultId}\n`)
    })
}
