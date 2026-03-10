import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { CustomFieldListResponse } from '../types/custom-field.js'

const FIELD_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'name', header: 'Name', width: 25 },
  { key: 'type', header: 'Type', width: 15 },
  { key: 'required', header: 'Required', width: 10 },
  { key: 'date_created', header: 'Created', width: 15 },
]

export function registerFieldCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const field = program.command('field').description('Manage custom fields')

  field
    .command('list')
    .description('List custom fields (provide one ID flag)')
    .option('--list-id <id>', 'List ID')
    .option('--folder-id <id>', 'Folder ID')
    .option('--space-id <id>', 'Space ID')
    .action(async (opts: { listId?: string; folderId?: string; spaceId?: string }) => {
      const client = getClient()
      const globalWorkspaceId = program.opts()['workspaceId'] as string | undefined
      let endpoint: string
      if (opts.listId) {
        endpoint = `/list/${opts.listId}/field`
      } else if (opts.folderId) {
        endpoint = `/folder/${opts.folderId}/field`
      } else if (opts.spaceId) {
        endpoint = `/space/${opts.spaceId}/field`
      } else if (globalWorkspaceId) {
        endpoint = `/team/${globalWorkspaceId}/field`
      } else {
        process.stderr.write('Error: Provide one of --list-id, --folder-id, --space-id, or --workspace-id.\n')
        process.exit(2)
        return
      }
      const data = await client.get<CustomFieldListResponse>(endpoint)
      formatOutput(data.fields, FIELD_COLUMNS, getOutputOptions(program))
    })

  field
    .command('set')
    .description('Set a custom field value on a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--field-id <fid>', 'Field ID')
    .requiredOption('--value <value>', 'Field value')
    .action(async (opts: { taskId: string; fieldId: string; value: string }) => {
      const client = getClient()
      let parsedValue: unknown = opts.value
      try { parsedValue = JSON.parse(opts.value) } catch { /* use as string */ }
      const data = await client.post<Record<string, unknown>>(`/task/${opts.taskId}/field/${opts.fieldId}`, { value: parsedValue })
      formatOutput(data, FIELD_COLUMNS, getOutputOptions(program))
    })

  field
    .command('remove')
    .description('Remove a custom field value from a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--field-id <fid>', 'Field ID')
    .action(async (opts: { taskId: string; fieldId: string }) => {
      const client = getClient()
      await client.delete(`/task/${opts.taskId}/field/${opts.fieldId}`)
      process.stdout.write(`Removed field ${opts.fieldId} from task ${opts.taskId}\n`)
    })
}
