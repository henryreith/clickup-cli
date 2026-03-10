import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { CustomTaskTypeListResponse } from '../types/task-type.js'

const TASK_TYPE_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'name', header: 'Name', width: 25 },
  { key: 'description', header: 'Description', width: 40 },
]

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

registerSchema('task-type', 'list', 'List custom task types in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
])

export function registerTaskTypeCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const taskType = program.command('task-type').description('Manage custom task types')

  taskType
    .command('list')
    .description('List custom task types')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<CustomTaskTypeListResponse>(`/team/${workspaceId}/custom_item`)
      formatOutput(data.custom_items, TASK_TYPE_COLUMNS, getOutputOptions(program))
    })
}
