import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { ViewListResponse, ViewResponse, ViewTasksResponse } from '../types/view.js'

const VIEW_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'type', header: 'Type', width: 12 },
  { key: 'date_created', header: 'Created', width: 15 },
  { key: 'creator_name', header: 'Creator', width: 15 },
]

const VIEW_TASK_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'name', header: 'Name', width: 35 },
  { key: 'status_name', header: 'Status', width: 15 },
  { key: 'assignee_names', header: 'Assignees', width: 20 },
]

function resolveViewParent(
  opts: { spaceId?: string; folderId?: string; listId?: string },
  program: Command,
): { segment: string; id: string } | undefined {
  const parents: { segment: string; id: string }[] = []
  const globalWsId = program.opts()['workspaceId'] as string | undefined
  if (globalWsId) parents.push({ segment: 'team', id: globalWsId })
  if (opts.spaceId) parents.push({ segment: 'space', id: opts.spaceId })
  if (opts.folderId) parents.push({ segment: 'folder', id: opts.folderId })
  if (opts.listId) parents.push({ segment: 'list', id: opts.listId })

  if (parents.length === 0) {
    process.stderr.write('Error: Provide one of --workspace-id, --space-id, --folder-id, or --list-id.\n')
    process.exit(2)
    return undefined
  }
  if (parents.length > 1) {
    process.stderr.write('Error: Provide only one of --workspace-id, --space-id, --folder-id, or --list-id.\n')
    process.exit(2)
    return undefined
  }
  return parents[0]!
}

function formatViews(views: Record<string, unknown>[]) {
  return views.map((v) => ({
    ...v,
    creator_name: (v['creator'] as Record<string, unknown> | undefined)?.['username'] ?? '',
  }))
}

function formatViewTasks(tasks: Record<string, unknown>[]) {
  return tasks.map((t) => ({
    ...t,
    status_name: (t['status'] as Record<string, unknown> | undefined)?.['status'] ?? '',
    assignee_names: Array.isArray(t['assignees'])
      ? (t['assignees'] as Record<string, unknown>[]).map((a) => a['username'] ?? '').join(', ')
      : '',
  }))
}

export function registerViewCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const view = program.command('view').description('Manage views')

  view
    .command('list')
    .description('List views for a workspace, space, folder, or list')
    .option('--space-id <id>', 'Space ID')
    .option('--folder-id <id>', 'Folder ID')
    .option('--list-id <id>', 'List ID')
    .action(async (opts: { spaceId?: string; folderId?: string; listId?: string }) => {
      const parent = resolveViewParent(opts, program)
      if (!parent) return
      const client = getClient()
      const data = await client.get<ViewListResponse>(`/${parent.segment}/${parent.id}/view`)
      formatOutput(formatViews(data.views as Record<string, unknown>[]), VIEW_COLUMNS, getOutputOptions(program))
    })

  view
    .command('get')
    .description('Get a view')
    .argument('<view-id>', 'View ID')
    .action(async (viewId: string) => {
      const client = getClient()
      const data = await client.get<ViewResponse>(`/view/${viewId}`)
      formatOutput(formatViews([data.view as Record<string, unknown>]), VIEW_COLUMNS, getOutputOptions(program))
    })

  view
    .command('create')
    .description('Create a view')
    .option('--space-id <id>', 'Space ID')
    .option('--folder-id <id>', 'Folder ID')
    .option('--list-id <id>', 'List ID')
    .requiredOption('--name <name>', 'View name')
    .requiredOption('--type <type>', 'View type (list, board, calendar, gantt, table, timeline, activity, map, workload)')
    .action(async (opts: { spaceId?: string; folderId?: string; listId?: string; name: string; type: string }) => {
      const parent = resolveViewParent(opts, program)
      if (!parent) return
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name, type: opts.type }
      const data = await client.post<ViewResponse>(`/${parent.segment}/${parent.id}/view`, body)
      process.stdout.write(`Created view ${data.view?.id ?? ''}\n`)
    })

  view
    .command('update')
    .description('Update a view')
    .argument('<view-id>', 'View ID')
    .option('--name <name>', 'View name')
    .option('--settings <json>', 'Settings (JSON string)')
    .option('--grouping <json>', 'Grouping config (JSON string)')
    .option('--sorting <json>', 'Sorting config (JSON string)')
    .option('--filters <json>', 'Filters config (JSON string)')
    .action(async (viewId: string, opts: { name?: string; settings?: string; grouping?: string; sorting?: string; filters?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      for (const field of ['settings', 'grouping', 'sorting', 'filters'] as const) {
        if (opts[field] !== undefined) {
          try {
            body[field] = JSON.parse(opts[field]!)
          } catch {
            process.stderr.write(`Error: Invalid JSON for --${field}.\n`)
            process.exit(2)
            return
          }
        }
      }
      await client.put(`/view/${viewId}`, body)
      process.stdout.write(`Updated view ${viewId}\n`)
    })

  view
    .command('delete')
    .description('Delete a view')
    .argument('<view-id>', 'View ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (viewId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete view ${viewId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/view/${viewId}`)
      process.stdout.write(`Deleted view ${viewId}\n`)
    })

  view
    .command('tasks')
    .description('Get tasks in a view')
    .argument('<view-id>', 'View ID')
    .option('--page <n>', 'Page number (zero-indexed)')
    .action(async (viewId: string, opts: { page?: string }) => {
      const client = getClient()
      const params: Record<string, string | undefined> = {}
      if (opts.page !== undefined) params['page'] = opts.page
      const data = await client.get<ViewTasksResponse>(`/view/${viewId}/task`, params)
      formatOutput(formatViewTasks(data.tasks as Record<string, unknown>[]), VIEW_TASK_COLUMNS, getOutputOptions(program))
    })
}
