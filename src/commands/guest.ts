import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { GuestResponse, GuestWithShared } from '../types/guest.js'

const GUEST_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'username', header: 'Username', width: 20 },
  { key: 'email', header: 'Email', width: 30 },
  { key: 'can_edit_tags', header: 'Edit Tags', width: 10 },
  { key: 'can_see_time_spent', header: 'See Time', width: 10 },
  { key: 'can_see_time_estimated', header: 'See Est.', width: 10 },
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

function parseBool(val: string | undefined): boolean | undefined {
  if (val === undefined) return undefined
  return val === 'true'
}

// Schema registrations
registerSchema('guest', 'invite', 'Invite a guest to a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--email', type: 'string', required: true, description: 'Email address to invite' },
  { flag: '--can-edit-tags', type: 'boolean', required: false, description: 'Allow editing tags' },
  { flag: '--can-see-time-spent', type: 'boolean', required: false, description: 'Allow seeing time spent' },
  { flag: '--can-see-time-estimated', type: 'boolean', required: false, description: 'Allow seeing time estimates' },
])

registerSchema('guest', 'get', 'Get a guest in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
])

registerSchema('guest', 'update', 'Update a guest in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
  { flag: '--username', type: 'string', required: false, description: 'New username' },
  { flag: '--can-edit-tags', type: 'boolean', required: false, description: 'Allow editing tags' },
  { flag: '--can-see-time-spent', type: 'boolean', required: false, description: 'Allow seeing time spent' },
  { flag: '--can-see-time-estimated', type: 'boolean', required: false, description: 'Allow seeing time estimates' },
])

registerSchema('guest', 'remove', 'Remove a guest from a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

registerSchema('guest', 'add-to-task', 'Add a guest to a task', [
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
  { flag: '--task-id', type: 'string', required: true, description: 'Task ID' },
  { flag: '--permission', type: 'string', required: true, description: 'Permission level (read, comment, edit, create)' },
])

registerSchema('guest', 'remove-from-task', 'Remove a guest from a task', [
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
  { flag: '--task-id', type: 'string', required: true, description: 'Task ID' },
])

registerSchema('guest', 'add-to-list', 'Add a guest to a list', [
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
  { flag: '--list-id', type: 'string', required: true, description: 'List ID' },
  { flag: '--permission', type: 'string', required: true, description: 'Permission level (read, comment, edit, create)' },
])

registerSchema('guest', 'remove-from-list', 'Remove a guest from a list', [
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
  { flag: '--list-id', type: 'string', required: true, description: 'List ID' },
])

registerSchema('guest', 'add-to-folder', 'Add a guest to a folder', [
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
  { flag: '--folder-id', type: 'string', required: true, description: 'Folder ID' },
  { flag: '--permission', type: 'string', required: true, description: 'Permission level (read, comment, edit, create)' },
])

registerSchema('guest', 'remove-from-folder', 'Remove a guest from a folder', [
  { flag: '<guest-id>', type: 'string', required: true, description: 'Guest ID' },
  { flag: '--folder-id', type: 'string', required: true, description: 'Folder ID' },
])

export function registerGuestCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const guest = program.command('guest').description('Manage workspace guests')

  guest
    .command('invite')
    .description('Invite a guest to a workspace')
    .requiredOption('--email <email>', 'Email address to invite')
    .option('--can-edit-tags <bool>', 'Allow editing tags')
    .option('--can-see-time-spent <bool>', 'Allow seeing time spent')
    .option('--can-see-time-estimated <bool>', 'Allow seeing time estimates')
    .action(async (opts: { email: string; canEditTags?: string; canSeeTimeSpent?: string; canSeeTimeEstimated?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = { email: opts.email }
      const canEditTags = parseBool(opts.canEditTags)
      if (canEditTags !== undefined) body['can_edit_tags'] = canEditTags
      const canSeeTimeSpent = parseBool(opts.canSeeTimeSpent)
      if (canSeeTimeSpent !== undefined) body['can_see_time_spent'] = canSeeTimeSpent
      const canSeeTimeEstimated = parseBool(opts.canSeeTimeEstimated)
      if (canSeeTimeEstimated !== undefined) body['can_see_time_estimated'] = canSeeTimeEstimated
      const data = await client.post<GuestResponse>(`/team/${workspaceId}/guest`, body)
      process.stdout.write(`Invited guest ${data.guest?.id ?? opts.email}\n`)
    })

  guest
    .command('get')
    .description('Get a guest in a workspace')
    .argument('<guest-id>', 'Guest ID')
    .action(async (guestId: string) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<GuestWithShared>(`/team/${workspaceId}/guest/${guestId}`)
      formatOutput(data.guest, GUEST_COLUMNS, getOutputOptions(program))
    })

  guest
    .command('update')
    .description('Update a guest in a workspace')
    .argument('<guest-id>', 'Guest ID')
    .option('--username <name>', 'New username')
    .option('--can-edit-tags <bool>', 'Allow editing tags')
    .option('--can-see-time-spent <bool>', 'Allow seeing time spent')
    .option('--can-see-time-estimated <bool>', 'Allow seeing time estimates')
    .action(async (guestId: string, opts: { username?: string; canEditTags?: string; canSeeTimeSpent?: string; canSeeTimeEstimated?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.username !== undefined) body['username'] = opts.username
      const canEditTags = parseBool(opts.canEditTags)
      if (canEditTags !== undefined) body['can_edit_tags'] = canEditTags
      const canSeeTimeSpent = parseBool(opts.canSeeTimeSpent)
      if (canSeeTimeSpent !== undefined) body['can_see_time_spent'] = canSeeTimeSpent
      const canSeeTimeEstimated = parseBool(opts.canSeeTimeEstimated)
      if (canSeeTimeEstimated !== undefined) body['can_see_time_estimated'] = canSeeTimeEstimated
      await client.put(`/team/${workspaceId}/guest/${guestId}`, body)
      process.stdout.write(`Updated guest ${guestId}\n`)
    })

  guest
    .command('remove')
    .description('Remove a guest from a workspace')
    .argument('<guest-id>', 'Guest ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (guestId: string, opts: { confirm?: boolean }) => {
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
        const yes = await confirm({ message: `Remove guest ${guestId} from workspace?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/team/${workspaceId}/guest/${guestId}`)
      process.stdout.write(`Removed guest ${guestId}\n`)
    })

  guest
    .command('add-to-task')
    .description('Add a guest to a task')
    .argument('<guest-id>', 'Guest ID')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--permission <level>', 'Permission level (read, comment, edit, create)')
    .action(async (guestId: string, opts: { taskId: string; permission: string }) => {
      const client = getClient()
      await client.post(`/task/${opts.taskId}/guest/${guestId}`, { permission_level: opts.permission })
      process.stdout.write(`Added guest ${guestId} to task ${opts.taskId}\n`)
    })

  guest
    .command('remove-from-task')
    .description('Remove a guest from a task')
    .argument('<guest-id>', 'Guest ID')
    .requiredOption('--task-id <id>', 'Task ID')
    .action(async (guestId: string, opts: { taskId: string }) => {
      const client = getClient()
      await client.delete(`/task/${opts.taskId}/guest/${guestId}`)
      process.stdout.write(`Removed guest ${guestId} from task ${opts.taskId}\n`)
    })

  guest
    .command('add-to-list')
    .description('Add a guest to a list')
    .argument('<guest-id>', 'Guest ID')
    .requiredOption('--list-id <id>', 'List ID')
    .requiredOption('--permission <level>', 'Permission level (read, comment, edit, create)')
    .action(async (guestId: string, opts: { listId: string; permission: string }) => {
      const client = getClient()
      await client.post(`/list/${opts.listId}/guest/${guestId}`, { permission_level: opts.permission })
      process.stdout.write(`Added guest ${guestId} to list ${opts.listId}\n`)
    })

  guest
    .command('remove-from-list')
    .description('Remove a guest from a list')
    .argument('<guest-id>', 'Guest ID')
    .requiredOption('--list-id <id>', 'List ID')
    .action(async (guestId: string, opts: { listId: string }) => {
      const client = getClient()
      await client.delete(`/list/${opts.listId}/guest/${guestId}`)
      process.stdout.write(`Removed guest ${guestId} from list ${opts.listId}\n`)
    })

  guest
    .command('add-to-folder')
    .description('Add a guest to a folder')
    .argument('<guest-id>', 'Guest ID')
    .requiredOption('--folder-id <id>', 'Folder ID')
    .requiredOption('--permission <level>', 'Permission level (read, comment, edit, create)')
    .action(async (guestId: string, opts: { folderId: string; permission: string }) => {
      const client = getClient()
      await client.post(`/folder/${opts.folderId}/guest/${guestId}`, { permission_level: opts.permission })
      process.stdout.write(`Added guest ${guestId} to folder ${opts.folderId}\n`)
    })

  guest
    .command('remove-from-folder')
    .description('Remove a guest from a folder')
    .argument('<guest-id>', 'Guest ID')
    .requiredOption('--folder-id <id>', 'Folder ID')
    .action(async (guestId: string, opts: { folderId: string }) => {
      const client = getClient()
      await client.delete(`/folder/${opts.folderId}/guest/${guestId}`)
      process.stdout.write(`Removed guest ${guestId} from folder ${opts.folderId}\n`)
    })
}
