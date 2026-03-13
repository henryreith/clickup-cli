import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { resolveWorkspaceId } from '../config.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { registerSchema } from '../schema.js'
import type { MemberListResponse } from '../types/member.js'

const MEMBER_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'username', header: 'Username', width: 20 },
  { key: 'email', header: 'Email', width: 30 },
  { key: 'initials', header: 'Initials', width: 10 },
]

function resolveMemberParent(opts: { taskId?: string; listId?: string }): { segment: string; id: string } | undefined {
  const parents: { segment: string; id: string }[] = []
  if (opts.taskId) parents.push({ segment: 'task', id: opts.taskId })
  if (opts.listId) parents.push({ segment: 'list', id: opts.listId })

  if (parents.length === 0) {
    process.stderr.write('Error: Provide one of --task-id or --list-id.\n')
    process.exit(2)
    return undefined
  }
  if (parents.length > 1) {
    process.stderr.write('Error: Provide only one of --task-id or --list-id.\n')
    process.exit(2)
    return undefined
  }
  return parents[0]!
}

registerSchema('member', 'list', 'List members with access to a task or list', [
  { flag: '--task-id', type: 'string', required: false, description: 'Task ID (provide one of --task-id or --list-id)' },
  { flag: '--list-id', type: 'string', required: false, description: 'List ID (provide one of --task-id or --list-id)' },
])

registerSchema('member', 'find', 'Find workspace member by name (fuzzy match)', [
  { flag: '--name', type: 'string', required: true, description: 'Member name to search for' },
  { flag: '--workspace-id', type: 'string', required: false, description: 'Workspace ID' },
])

registerSchema('member', 'resolve', 'Resolve member names to user IDs (pipe-friendly)', [
  { flag: '--names', type: 'string', required: true, description: 'Comma-separated member names' },
  { flag: '--workspace-id', type: 'string', required: false, description: 'Workspace ID' },
])

function getWorkspaceId(program: Command, optsId?: string): string | undefined {
  const globalOpts = program.opts()
  const workspaceId = resolveWorkspaceId(optsId ?? (globalOpts['workspaceId'] as string | undefined))
  if (!workspaceId) {
    process.stderr.write('Error: No workspace ID. Use --workspace-id or run: clickup config set workspace_id <id>\n')
    process.exit(2)
    return undefined
  }
  return workspaceId
}

type WorkspaceMember = { user: Record<string, unknown>; role: number }

function flattenMember(m: WorkspaceMember): Record<string, unknown> {
  return {
    id: m.user['id'],
    username: m.user['username'],
    email: m.user['email'],
    role: m.role,
  }
}

export function registerMemberCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const member = program.command('member').description('Manage task and list members')

  member
    .command('list')
    .description('List members of a task or list')
    .option('--task-id <id>', 'Task ID')
    .option('--list-id <id>', 'List ID')
    .action(async (opts: { taskId?: string; listId?: string }) => {
      const parent = resolveMemberParent(opts)
      if (!parent) return
      const client = getClient()
      const data = await client.get<MemberListResponse>(`/${parent.segment}/${parent.id}/member`)
      formatOutput(data.members, MEMBER_COLUMNS, getOutputOptions(program))
    })

  member
    .command('find')
    .description('Find workspace member by name (fuzzy match)')
    .requiredOption('--name <name>', 'Member name to search for')
    .option('--workspace-id <id>', 'Workspace ID')
    .action(async (opts: { name: string; workspaceId?: string }) => {
      const workspaceId = getWorkspaceId(program, opts.workspaceId)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<{ members: WorkspaceMember[] }>(`/team/${workspaceId}/member`)
      const query = opts.name.toLowerCase()
      const matches = (data.members ?? [])
        .map(flattenMember)
        .filter((m) => {
          const username = String(m['username'] ?? '').toLowerCase()
          const email = String(m['email'] ?? '').toLowerCase()
          return username.includes(query) || email.includes(query)
        })
      if (matches.length === 0) {
        process.stderr.write(`No members found matching "${opts.name}"\n`)
        process.exit(1)
        return
      }
      formatOutput(matches, MEMBER_COLUMNS, getOutputOptions(program))
    })

  member
    .command('resolve')
    .description('Resolve member names to user IDs (use --format quiet for IDs only)')
    .requiredOption('--names <names>', 'Comma-separated member names')
    .option('--workspace-id <id>', 'Workspace ID')
    .action(async (opts: { names: string; workspaceId?: string }) => {
      const workspaceId = getWorkspaceId(program, opts.workspaceId)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<{ members: WorkspaceMember[] }>(`/team/${workspaceId}/member`)
      const names = opts.names.split(',').map((n) => n.trim().toLowerCase()).filter(Boolean)
      const allMembers = (data.members ?? []).map(flattenMember)
      const resolved = names.map((query) => {
        const match = allMembers.find((m) => {
          const username = String(m['username'] ?? '').toLowerCase()
          const email = String(m['email'] ?? '').toLowerCase()
          return username.includes(query) || email.includes(query)
        })
        return match ?? { id: '', username: query, email: '(not found)', role: '' }
      })
      formatOutput(resolved, MEMBER_COLUMNS, getOutputOptions(program))
    })
}
