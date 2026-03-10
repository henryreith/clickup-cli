import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { GroupListResponse } from '../types/group.js'

const GROUP_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 14 },
  { key: 'name', header: 'Name', width: 25 },
  { key: 'member_count', header: 'Members', width: 10 },
  { key: 'date_created', header: 'Created', width: 15 },
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

registerSchema('group', 'list', 'List user groups in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--group-id', type: 'string[]', required: false, description: 'Filter by group IDs (repeatable)' },
])

registerSchema('group', 'create', 'Create a user group', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--name', type: 'string', required: true, description: 'Group name' },
  { flag: '--member-id', type: 'integer[]', required: false, description: 'Member user IDs (repeatable)' },
])

registerSchema('group', 'update', 'Update a user group', [
  { flag: '<group-id>', type: 'string', required: true, description: 'Group ID' },
  { flag: '--name', type: 'string', required: false, description: 'New group name' },
  { flag: '--add-member', type: 'integer[]', required: false, description: 'User IDs to add (repeatable)' },
  { flag: '--remove-member', type: 'integer[]', required: false, description: 'User IDs to remove (repeatable)' },
])

registerSchema('group', 'delete', 'Delete a user group', [
  { flag: '<group-id>', type: 'string', required: true, description: 'Group ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

export function registerGroupCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const group = program.command('group').description('Manage user groups')

  group
    .command('list')
    .description('List user groups')
    .option('--group-id <id>', 'Filter by group ID (repeatable)', collect, [])
    .action(async (opts: { groupId: string[] }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const params: Record<string, string> = {}
      if (opts.groupId.length) params['group_ids'] = opts.groupId.join(',')
      const data = await client.get<GroupListResponse>(`/team/${workspaceId}/group`, params)
      const rows = data.groups.map((g) => ({
        ...g,
        member_count: Array.isArray(g.members) ? g.members.length : 0,
      }))
      formatOutput(rows, GROUP_COLUMNS, getOutputOptions(program))
    })

  group
    .command('create')
    .description('Create a user group')
    .requiredOption('--name <name>', 'Group name')
    .option('--member-id <id>', 'Member user ID (repeatable)', collect, [])
    .action(async (opts: { name: string; memberId: string[] }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.memberId.length) {
        body['members'] = opts.memberId.map((id) => ({ id: parseInt(id, 10) }))
      }
      const data = await client.post<Record<string, unknown>>(`/team/${workspaceId}/group`, body)
      process.stdout.write(`Created group ${(data as Record<string, unknown>)['id'] ?? ''}\n`)
    })

  group
    .command('update')
    .description('Update a user group')
    .argument('<group-id>', 'Group ID')
    .option('--name <name>', 'New group name')
    .option('--add-member <id>', 'User ID to add (repeatable)', collect, [])
    .option('--remove-member <id>', 'User ID to remove (repeatable)', collect, [])
    .action(async (groupId: string, opts: { name?: string; addMember: string[]; removeMember: string[] }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      const members: Record<string, unknown> = {}
      if (opts.addMember.length) members['add'] = opts.addMember.map((id) => ({ id: parseInt(id, 10) }))
      if (opts.removeMember.length) members['rem'] = opts.removeMember.map((id) => ({ id: parseInt(id, 10) }))
      if (Object.keys(members).length) body['members'] = members
      await client.put(`/group/${groupId}`, body)
      process.stdout.write(`Updated group ${groupId}\n`)
    })

  group
    .command('delete')
    .description('Delete a user group')
    .argument('<group-id>', 'Group ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (groupId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete group ${groupId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/group/${groupId}`)
      process.stdout.write(`Deleted group ${groupId}\n`)
    })
}
