import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { CommentListResponse } from '../types/comment.js'
import { registerSchema } from '../schema.js'

registerSchema('comment', 'list', 'List comments on a task, list, or view', [
  { flag: '--task-id', type: 'string', required: false, description: 'Task ID (provide one parent)' },
  { flag: '--list-id', type: 'string', required: false, description: 'List ID (provide one parent)' },
  { flag: '--view-id', type: 'string', required: false, description: 'View ID (provide one parent)' },
  { flag: '--start', type: 'string', required: false, description: 'Pagination start timestamp' },
  { flag: '--start-id', type: 'string', required: false, description: 'Pagination start comment ID' },
])

registerSchema('comment', 'create', 'Create a comment on a task, list, or view', [
  { flag: '--task-id', type: 'string', required: false, description: 'Task ID (provide one parent)' },
  { flag: '--list-id', type: 'string', required: false, description: 'List ID (provide one parent)' },
  { flag: '--view-id', type: 'string', required: false, description: 'View ID (provide one parent)' },
  { flag: '--text', type: 'string', required: true, description: 'Comment text' },
  { flag: '--assignee', type: 'string', required: false, description: 'Assignee user ID' },
  { flag: '--notify-all', type: 'boolean', required: false, description: 'Notify all watchers' },
])

registerSchema('comment', 'update', 'Update a comment', [
  { flag: '<comment-id>', type: 'string', required: true, description: 'Comment ID' },
  { flag: '--text', type: 'string', required: true, description: 'New comment text' },
  { flag: '--assignee', type: 'string', required: false, description: 'Assignee user ID' },
  { flag: '--resolved', type: 'boolean', required: false, description: 'Mark as resolved' },
])

registerSchema('comment', 'delete', 'Delete a comment', [
  { flag: '<comment-id>', type: 'string', required: true, description: 'Comment ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

registerSchema('comment', 'list-threaded', 'List threaded replies to a comment', [
  { flag: '<comment-id>', type: 'string', required: true, description: 'Comment ID' },
])

registerSchema('comment', 'reply', 'Reply to a comment (threaded)', [
  { flag: '<comment-id>', type: 'string', required: true, description: 'Comment ID' },
  { flag: '--text', type: 'string', required: true, description: 'Reply text' },
  { flag: '--assignee', type: 'string', required: false, description: 'Assignee user ID' },
  { flag: '--notify-all', type: 'boolean', required: false, description: 'Notify all watchers' },
])

const COMMENT_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'comment_text', header: 'Text', width: 40 },
  { key: 'user_name', header: 'User', width: 15 },
  { key: 'assignee_name', header: 'Assignee', width: 15 },
  { key: 'resolved', header: 'Resolved', width: 10 },
  { key: 'date', header: 'Date', width: 15 },
]

function resolveParent(opts: { taskId?: string; listId?: string; viewId?: string }): { type: string; id: string } | undefined {
  const parents: { type: string; id: string }[] = []
  if (opts.taskId) parents.push({ type: 'task', id: opts.taskId })
  if (opts.listId) parents.push({ type: 'list', id: opts.listId })
  if (opts.viewId) parents.push({ type: 'view', id: opts.viewId })

  if (parents.length === 0) {
    process.stderr.write('Error: Provide one of --task-id, --list-id, or --view-id.\n')
    process.exit(2)
    return undefined
  }
  if (parents.length > 1) {
    process.stderr.write('Error: Provide only one of --task-id, --list-id, or --view-id.\n')
    process.exit(2)
    return undefined
  }
  return parents[0]!
}

function formatComments(comments: Record<string, unknown>[]) {
  return comments.map((c) => ({
    ...c,
    user_name: (c['user'] as Record<string, unknown> | undefined)?.['username'] ?? '',
    assignee_name: (c['assignee'] as Record<string, unknown> | null | undefined)?.['username'] ?? '',
  }))
}

export function registerCommentCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const comment = program.command('comment').description('Manage comments')

  comment
    .command('list')
    .description('List comments on a task, list, or view')
    .option('--task-id <id>', 'Task ID')
    .option('--list-id <id>', 'List ID')
    .option('--view-id <id>', 'View ID')
    .option('--start <ts>', 'Pagination: start after this Unix ms timestamp')
    .option('--start-id <id>', 'Pagination: start after this comment ID')
    .action(async (opts: { taskId?: string; listId?: string; viewId?: string; start?: string; startId?: string }) => {
      const parent = resolveParent(opts)
      if (!parent) return
      const client = getClient()
      const params: Record<string, string | undefined> = {}
      if (opts.start) params['start'] = opts.start
      if (opts.startId) params['start_id'] = opts.startId
      const data = await client.get<CommentListResponse>(`/${parent.type}/${parent.id}/comment`, params)
      formatOutput(formatComments(data.comments as Record<string, unknown>[]), COMMENT_COLUMNS, getOutputOptions(program))
    })

  comment
    .command('create')
    .description('Create a comment on a task, list, or view')
    .option('--task-id <id>', 'Task ID')
    .option('--list-id <id>', 'List ID')
    .option('--view-id <id>', 'View ID')
    .requiredOption('--text <text>', 'Comment text')
    .option('--assignee <id>', 'Assignee user ID')
    .option('--notify-all', 'Notify all watchers')
    .action(async (opts: { taskId?: string; listId?: string; viewId?: string; text: string; assignee?: string; notifyAll?: boolean }) => {
      const parent = resolveParent(opts)
      if (!parent) return
      const client = getClient()
      const body: Record<string, unknown> = { comment_text: opts.text }
      if (opts.assignee !== undefined) body['assignee'] = parseInt(opts.assignee, 10)
      if (opts.notifyAll) body['notify_all'] = true
      const data = await client.post<Record<string, unknown>>(`/${parent.type}/${parent.id}/comment`, body)
      process.stdout.write(`Created comment ${data['id'] ?? ''}\n`)
    })

  comment
    .command('update')
    .description('Update a comment')
    .argument('<comment-id>', 'Comment ID')
    .requiredOption('--text <text>', 'New comment text')
    .option('--assignee <id>', 'Assignee user ID')
    .option('--resolved <bool>', 'Mark as resolved (true/false)')
    .action(async (commentId: string, opts: { text: string; assignee?: string; resolved?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = { comment_text: opts.text }
      if (opts.assignee !== undefined) body['assignee'] = parseInt(opts.assignee, 10)
      if (opts.resolved !== undefined) body['resolved'] = opts.resolved === 'true'
      await client.put(`/comment/${commentId}`, body)
      process.stdout.write(`Updated comment ${commentId}\n`)
    })

  comment
    .command('delete')
    .description('Delete a comment')
    .argument('<comment-id>', 'Comment ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (commentId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete comment ${commentId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/comment/${commentId}`)
      process.stdout.write(`Deleted comment ${commentId}\n`)
    })

  comment
    .command('list-threaded')
    .description('List threaded replies to a comment')
    .argument('<comment-id>', 'Comment ID')
    .action(async (commentId: string) => {
      const client = getClient()
      const data = await client.get<CommentListResponse>(`/comment/${commentId}/thread`)
      formatOutput(formatComments(data.comments as Record<string, unknown>[]), COMMENT_COLUMNS, getOutputOptions(program))
    })

  comment
    .command('reply')
    .description('Reply to a comment (threaded)')
    .argument('<comment-id>', 'Comment ID')
    .requiredOption('--text <text>', 'Reply text')
    .option('--assignee <id>', 'Assignee user ID')
    .option('--notify-all', 'Notify all watchers')
    .action(async (commentId: string, opts: { text: string; assignee?: string; notifyAll?: boolean }) => {
      const client = getClient()
      const body: Record<string, unknown> = { comment_text: opts.text }
      if (opts.assignee !== undefined) body['assignee'] = parseInt(opts.assignee, 10)
      if (opts.notifyAll) body['notify_all'] = true
      const data = await client.post<Record<string, unknown>>(`/comment/${commentId}/thread`, body)
      process.stdout.write(`Created reply ${data['id'] ?? ''}\n`)
    })
}
