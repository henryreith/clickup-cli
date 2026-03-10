import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { InviteUserResponse, GetUserResponse } from '../types/user.js'

const USER_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'username', header: 'Username', width: 20 },
  { key: 'email', header: 'Email', width: 30 },
  { key: 'role', header: 'Role', width: 8 },
  { key: 'custom_role_id', header: 'Custom Role', width: 14 },
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

registerSchema('user', 'invite', 'Invite a user to a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--email', type: 'string', required: true, description: 'Email address to invite' },
  { flag: '--admin', type: 'boolean', required: false, description: 'Make the user an admin' },
])

registerSchema('user', 'get', 'Get a user in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '<user-id>', type: 'string', required: true, description: 'User ID' },
])

registerSchema('user', 'update', 'Update a user in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '<user-id>', type: 'string', required: true, description: 'User ID' },
  { flag: '--username', type: 'string', required: false, description: 'New username' },
  { flag: '--admin', type: 'boolean', required: false, description: 'Set admin status' },
  { flag: '--custom-role-id', type: 'integer', required: false, description: 'Custom role ID' },
])

registerSchema('user', 'remove', 'Remove a user from a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '<user-id>', type: 'string', required: true, description: 'User ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

export function registerUserCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const user = program.command('user').description('Manage workspace users')

  user
    .command('invite')
    .description('Invite a user to a workspace')
    .requiredOption('--email <email>', 'Email address to invite')
    .option('--admin <bool>', 'Make the user an admin')
    .action(async (opts: { email: string; admin?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = { email: opts.email }
      if (opts.admin !== undefined) body['admin'] = opts.admin === 'true'
      const data = await client.post<InviteUserResponse>(`/team/${workspaceId}/user`, body)
      process.stdout.write(`Invited ${opts.email} to workspace ${data.team?.id ?? workspaceId}\n`)
    })

  user
    .command('get')
    .description('Get a user in a workspace')
    .argument('<user-id>', 'User ID')
    .action(async (userId: string) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<GetUserResponse>(`/team/${workspaceId}/user/${userId}`)
      const userObj = data.member?.user ?? data.member
      formatOutput(userObj, USER_COLUMNS, getOutputOptions(program))
    })

  user
    .command('update')
    .description('Update a user in a workspace')
    .argument('<user-id>', 'User ID')
    .option('--username <name>', 'New username')
    .option('--admin <bool>', 'Set admin status')
    .option('--custom-role-id <id>', 'Custom role ID')
    .action(async (userId: string, opts: { username?: string; admin?: string; customRoleId?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.username !== undefined) body['username'] = opts.username
      if (opts.admin !== undefined) body['admin'] = opts.admin === 'true'
      if (opts.customRoleId !== undefined) body['custom_role_id'] = parseInt(opts.customRoleId, 10)
      await client.put(`/team/${workspaceId}/user/${userId}`, body)
      process.stdout.write(`Updated user ${userId}\n`)
    })

  user
    .command('remove')
    .description('Remove a user from a workspace')
    .argument('<user-id>', 'User ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (userId: string, opts: { confirm?: boolean }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to remove in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Remove user ${userId} from workspace?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/team/${workspaceId}/user/${userId}`)
      process.stdout.write(`Removed user ${userId}\n`)
    })
}
