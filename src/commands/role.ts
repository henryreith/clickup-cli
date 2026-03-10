import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { RoleListResponse } from '../types/role.js'

const ROLE_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'name', header: 'Name', width: 25 },
  { key: 'custom', header: 'Custom', width: 8 },
  { key: 'members_count', header: 'Members', width: 10 },
  { key: 'date_created', header: 'Created', width: 15 },
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

registerSchema('role', 'list', 'List custom roles in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
])

export function registerRoleCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const role = program.command('role').description('Manage custom roles')

  role
    .command('list')
    .description('List custom roles')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<RoleListResponse>(`/team/${workspaceId}/customroles`)
      formatOutput(data.custom_roles, ROLE_COLUMNS, getOutputOptions(program))
    })
}
