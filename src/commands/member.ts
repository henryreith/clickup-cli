import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
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
}
