import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { SharedHierarchyResponse } from '../types/shared-hierarchy.js'

const TASK_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'type', header: 'Type', width: 8 },
]

registerSchema('shared-hierarchy', 'get', 'Get items shared with the authenticated user', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
])

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

export function registerSharedHierarchyCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const sharedHierarchy = program.command('shared-hierarchy').description('Manage shared hierarchy')

  sharedHierarchy
    .command('get')
    .description('Get tasks, lists, and folders shared with the authenticated user')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<SharedHierarchyResponse>(`/team/${workspaceId}/shared`)

      const outputOpts = getOutputOptions(program)
      const format = outputOpts.format ?? (process.stdout.isTTY ? 'table' : 'json')

      if (format === 'json') {
        process.stdout.write(JSON.stringify(data.shared, null, 2) + '\n')
        return
      }

      const rows: Array<{ id: string; name: string; type: string }> = []
      for (const task of data.shared.tasks ?? []) {
        rows.push({ id: task.id, name: task.name, type: 'task' })
      }
      for (const list of data.shared.lists ?? []) {
        rows.push({ id: list.id, name: list.name, type: 'list' })
      }
      for (const folder of data.shared.folders ?? []) {
        rows.push({ id: folder.id, name: folder.name, type: 'folder' })
      }

      formatOutput(rows, TASK_COLUMNS, outputOpts)
    })
}
