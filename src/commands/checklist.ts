import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { ChecklistResponse } from '../types/checklist.js'
import { registerSchema } from '../schema.js'

registerSchema('checklist', 'create', 'Create a checklist on a task', [
  { flag: '--task-id', type: 'string', required: true, description: 'Task ID' },
  { flag: '--name', type: 'string', required: true, description: 'Checklist name' },
])

registerSchema('checklist', 'update', 'Update a checklist', [
  { flag: '<checklist-id>', type: 'string', required: true, description: 'Checklist ID' },
  { flag: '--name', type: 'string', required: false, description: 'New checklist name' },
  { flag: '--position', type: 'integer', required: false, description: 'Position (0-indexed)' },
])

registerSchema('checklist', 'delete', 'Delete a checklist', [
  { flag: '<checklist-id>', type: 'string', required: true, description: 'Checklist ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

registerSchema('checklist', 'add-item', 'Add an item to a checklist', [
  { flag: '<checklist-id>', type: 'string', required: true, description: 'Checklist ID' },
  { flag: '--name', type: 'string', required: true, description: 'Item name' },
  { flag: '--assignee', type: 'string', required: false, description: 'Assignee user ID' },
  { flag: '--resolved', type: 'boolean', required: false, description: 'Mark as resolved' },
])

registerSchema('checklist', 'update-item', 'Update a checklist item', [
  { flag: '<checklist-id>', type: 'string', required: true, description: 'Checklist ID' },
  { flag: '--item-id', type: 'string', required: true, description: 'Item ID' },
  { flag: '--name', type: 'string', required: false, description: 'New item name' },
  { flag: '--resolved', type: 'boolean', required: false, description: 'Resolved status' },
  { flag: '--assignee', type: 'string', required: false, description: 'Assignee user ID' },
])

registerSchema('checklist', 'delete-item', 'Delete a checklist item', [
  { flag: '<checklist-id>', type: 'string', required: true, description: 'Checklist ID' },
  { flag: '--item-id', type: 'string', required: true, description: 'Item ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

const CHECKLIST_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'resolved', header: 'Resolved', width: 10 },
  { key: 'unresolved', header: 'Unresolved', width: 10 },
]

const CHECKLIST_ITEM_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'resolved', header: 'Resolved', width: 10 },
  { key: 'assignee', header: 'Assignee', width: 15 },
]

export function registerChecklistCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const checklist = program.command('checklist').description('Manage checklists')

  checklist
    .command('create')
    .description('Create a checklist on a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--name <name>', 'Checklist name')
    .action(async (opts: { taskId: string; name: string }) => {
      const client = getClient()
      const data = await client.post<ChecklistResponse>(`/task/${opts.taskId}/checklist`, { name: opts.name })
      formatOutput(data.checklist, CHECKLIST_COLUMNS, getOutputOptions(program))
    })

  checklist
    .command('update')
    .description('Update a checklist')
    .argument('<checklist-id>', 'Checklist ID')
    .option('--name <name>', 'New checklist name')
    .option('--position <n>', 'Position (0-indexed)', parseInt)
    .action(async (checklistId: string, opts: { name?: string; position?: number }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      if (opts.position !== undefined) body['position'] = opts.position
      const data = await client.put<ChecklistResponse>(`/checklist/${checklistId}`, body)
      formatOutput(data.checklist, CHECKLIST_COLUMNS, getOutputOptions(program))
    })

  checklist
    .command('delete')
    .description('Delete a checklist')
    .argument('<checklist-id>', 'Checklist ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (checklistId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete checklist ${checklistId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/checklist/${checklistId}`)
      process.stdout.write(`Deleted checklist ${checklistId}\n`)
    })

  checklist
    .command('add-item')
    .description('Add an item to a checklist')
    .argument('<checklist-id>', 'Checklist ID')
    .requiredOption('--name <name>', 'Item name')
    .option('--assignee <id>', 'Assignee user ID')
    .option('--resolved <bool>', 'Mark as resolved')
    .option('--parent <item-id>', 'Parent item ID')
    .action(async (checklistId: string, opts: { name: string; assignee?: string; resolved?: string; parent?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.assignee !== undefined) body['assignee'] = parseInt(opts.assignee, 10)
      if (opts.resolved !== undefined) body['resolved'] = opts.resolved === 'true'
      if (opts.parent !== undefined) body['parent'] = opts.parent
      const data = await client.post<ChecklistResponse>(`/checklist/${checklistId}/checklist_item`, body)
      formatOutput(data.checklist, CHECKLIST_COLUMNS, getOutputOptions(program))
    })

  checklist
    .command('update-item')
    .description('Update a checklist item')
    .argument('<checklist-id>', 'Checklist ID')
    .requiredOption('--item-id <id>', 'Item ID')
    .option('--name <name>', 'New item name')
    .option('--resolved <bool>', 'Mark as resolved/unresolved')
    .option('--assignee <id>', 'Assignee user ID')
    .option('--parent <item-id>', 'Parent item ID')
    .action(async (checklistId: string, opts: { itemId: string; name?: string; resolved?: string; assignee?: string; parent?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      if (opts.resolved !== undefined) body['resolved'] = opts.resolved === 'true'
      if (opts.assignee !== undefined) body['assignee'] = parseInt(opts.assignee, 10)
      if (opts.parent !== undefined) body['parent'] = opts.parent
      const data = await client.put<ChecklistResponse>(`/checklist/${checklistId}/checklist_item/${opts.itemId}`, body)
      formatOutput(data.checklist, CHECKLIST_COLUMNS, getOutputOptions(program))
    })

  checklist
    .command('delete-item')
    .description('Delete a checklist item')
    .argument('<checklist-id>', 'Checklist ID')
    .requiredOption('--item-id <id>', 'Item ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (checklistId: string, opts: { itemId: string; confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete checklist item ${opts.itemId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/checklist/${checklistId}/checklist_item/${opts.itemId}`)
      process.stdout.write(`Deleted checklist item ${opts.itemId}\n`)
    })
}
