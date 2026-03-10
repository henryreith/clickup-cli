import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'

const RELATION_COLUMNS: ColumnDef[] = [
  { key: 'task_id', header: 'Task ID', width: 14 },
  { key: 'links_to', header: 'Links To', width: 14 },
]

export function registerRelationCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const relation = program.command('relation').description('Manage task relations')

  relation
    .command('add')
    .description('Add a relation between tasks')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--links-to <id>', 'Task ID to link to')
    .action(async (opts: { taskId: string; linksTo: string }) => {
      const client = getClient()
      const data = await client.post<Record<string, unknown>>(`/task/${opts.taskId}/link/${opts.linksTo}`)
      formatOutput(data, RELATION_COLUMNS, getOutputOptions(program))
    })

  relation
    .command('remove')
    .description('Remove a relation between tasks')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--links-to <id>', 'Task ID to unlink from')
    .action(async (opts: { taskId: string; linksTo: string }) => {
      const client = getClient()
      await client.delete(`/task/${opts.taskId}/link/${opts.linksTo}`)
      process.stdout.write(`Removed relation between task ${opts.taskId} and ${opts.linksTo}\n`)
    })
}
