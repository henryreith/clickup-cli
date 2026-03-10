import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { ListListResponse } from '../types/list.js'

const LIST_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 14 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'content', header: 'Description', width: 25 },
  { key: 'task_count', header: 'Tasks', width: 10 },
  { key: 'archived', header: 'Archived', width: 10 },
]

export function registerListCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const list = program.command('list').description('Manage lists')

  list
    .command('list')
    .description('List lists in a folder')
    .requiredOption('--folder-id <id>', 'Folder ID')
    .option('--archived', 'Include archived lists')
    .action(async (opts: { folderId: string; archived?: boolean }) => {
      const client = getClient()
      const data = await client.get<ListListResponse>(`/folder/${opts.folderId}/list`, {
        archived: opts.archived ? 'true' : 'false',
      })
      formatOutput(data.lists, LIST_COLUMNS, getOutputOptions(program))
    })

  list
    .command('list-folderless')
    .description('List folderless lists in a space')
    .requiredOption('--space-id <id>', 'Space ID')
    .option('--archived', 'Include archived lists')
    .action(async (opts: { spaceId: string; archived?: boolean }) => {
      const client = getClient()
      const data = await client.get<ListListResponse>(`/space/${opts.spaceId}/list`, {
        archived: opts.archived ? 'true' : 'false',
      })
      formatOutput(data.lists, LIST_COLUMNS, getOutputOptions(program))
    })

  list
    .command('get')
    .description('Get list details')
    .argument('<list-id>', 'List ID')
    .action(async (listId: string) => {
      const client = getClient()
      const data = await client.get<Record<string, unknown>>(`/list/${listId}`)
      formatOutput(data, LIST_COLUMNS, getOutputOptions(program))
    })

  list
    .command('create')
    .description('Create a new list in a folder')
    .requiredOption('--folder-id <id>', 'Folder ID')
    .requiredOption('--name <name>', 'List name')
    .option('--content <desc>', 'List description')
    .option('--due-date <ts>', 'Due date (Unix ms)')
    .option('--priority <n>', 'Priority (1-4)', parseInt)
    .option('--status <s>', 'Default status')
    .action(async (opts: { folderId: string; name: string; content?: string; dueDate?: string; priority?: number; status?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.content !== undefined) body['content'] = opts.content
      if (opts.dueDate !== undefined) body['due_date'] = parseInt(opts.dueDate, 10)
      if (opts.priority !== undefined) body['priority'] = opts.priority
      if (opts.status !== undefined) body['status'] = opts.status
      const data = await client.post<Record<string, unknown>>(`/folder/${opts.folderId}/list`, body)
      formatOutput(data, LIST_COLUMNS, getOutputOptions(program))
    })

  list
    .command('create-folderless')
    .description('Create a folderless list in a space')
    .requiredOption('--space-id <id>', 'Space ID')
    .requiredOption('--name <name>', 'List name')
    .option('--content <desc>', 'List description')
    .action(async (opts: { spaceId: string; name: string; content?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.content !== undefined) body['content'] = opts.content
      const data = await client.post<Record<string, unknown>>(`/space/${opts.spaceId}/list`, body)
      formatOutput(data, LIST_COLUMNS, getOutputOptions(program))
    })

  list
    .command('update')
    .description('Update a list')
    .argument('<list-id>', 'List ID')
    .option('--name <name>', 'New list name')
    .option('--content <desc>', 'New description')
    .option('--due-date <ts>', 'Due date (Unix ms)')
    .option('--unset-status', 'Remove default status')
    .action(async (listId: string, opts: { name?: string; content?: string; dueDate?: string; unsetStatus?: boolean }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      if (opts.content !== undefined) body['content'] = opts.content
      if (opts.dueDate !== undefined) body['due_date'] = parseInt(opts.dueDate, 10)
      if (opts.unsetStatus) body['unset_status'] = true
      const data = await client.put<Record<string, unknown>>(`/list/${listId}`, body)
      formatOutput(data, LIST_COLUMNS, getOutputOptions(program))
    })

  list
    .command('delete')
    .description('Delete a list')
    .argument('<list-id>', 'List ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (listId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete list ${listId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/list/${listId}`)
      process.stdout.write(`Deleted list ${listId}\n`)
    })

  list
    .command('add-task')
    .description('Add a task to a list')
    .argument('<list-id>', 'List ID')
    .requiredOption('--task-id <id>', 'Task ID')
    .action(async (listId: string, opts: { taskId: string }) => {
      const client = getClient()
      await client.post(`/list/${listId}/task/${opts.taskId}`)
      process.stdout.write(`Added task ${opts.taskId} to list ${listId}\n`)
    })

  list
    .command('remove-task')
    .description('Remove a task from a list')
    .argument('<list-id>', 'List ID')
    .requiredOption('--task-id <id>', 'Task ID')
    .action(async (listId: string, opts: { taskId: string }) => {
      const client = getClient()
      await client.delete(`/list/${listId}/task/${opts.taskId}`)
      process.stdout.write(`Removed task ${opts.taskId} from list ${listId}\n`)
    })
}
