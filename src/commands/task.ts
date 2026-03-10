import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { resolveWorkspaceId } from '../config.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { TaskListResponse, TaskSearchResponse, TimeInStatusResponse } from '../types/task.js'
import { registerSchema } from '../schema.js'

registerSchema('task', 'list', 'List tasks in a list', [
  { flag: '--list-id', type: 'string', required: true, description: 'List ID' },
  { flag: '--archived', type: 'boolean', required: false, description: 'Include archived tasks' },
  { flag: '--include-closed', type: 'boolean', required: false, description: 'Include closed tasks' },
  { flag: '--subtasks', type: 'boolean', required: false, description: 'Include subtasks' },
  { flag: '--page', type: 'integer', required: false, description: 'Page number (0-indexed)' },
  { flag: '--status', type: 'string[]', required: false, description: 'Filter by status (repeatable)' },
  { flag: '--assignee', type: 'string[]', required: false, description: 'Filter by assignee ID (repeatable)' },
  { flag: '--tag', type: 'string[]', required: false, description: 'Filter by tag name (repeatable)' },
  { flag: '--order-by', type: 'string', required: false, description: 'Sort field (id|created|updated|due_date)' },
  { flag: '--reverse', type: 'boolean', required: false, description: 'Reverse sort order' },
])

registerSchema('task', 'search', 'Search tasks across a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--query', type: 'string', required: false, description: 'Full-text search query' },
  { flag: '--include-closed', type: 'boolean', required: false, description: 'Include closed tasks' },
  { flag: '--status', type: 'string[]', required: false, description: 'Filter by status (repeatable)' },
  { flag: '--assignee', type: 'string[]', required: false, description: 'Filter by assignee ID (repeatable)' },
  { flag: '--tag', type: 'string[]', required: false, description: 'Filter by tag name (repeatable)' },
  { flag: '--page', type: 'integer', required: false, description: 'Page number (0-indexed)' },
])

registerSchema('task', 'get', 'Get task details', [
  { flag: '<task-id>', type: 'string', required: true, description: 'Task ID' },
  { flag: '--include-subtasks', type: 'boolean', required: false, description: 'Include subtasks' },
  { flag: '--include-markdown-description', type: 'boolean', required: false, description: 'Return description as Markdown' },
])

registerSchema('task', 'create', 'Create a new task', [
  { flag: '--list-id', type: 'string', required: true, description: 'List ID' },
  { flag: '--name', type: 'string', required: true, description: 'Task name' },
  { flag: '--description', type: 'string', required: false, description: 'Plain text description' },
  { flag: '--markdown-description', type: 'string', required: false, description: 'Markdown description' },
  { flag: '--status', type: 'string', required: false, description: 'Initial status' },
  { flag: '--priority', type: 'integer', required: false, description: 'Priority (1=urgent, 2=high, 3=normal, 4=low)' },
  { flag: '--due-date', type: 'string', required: false, description: 'Due date (Unix ms)' },
  { flag: '--start-date', type: 'string', required: false, description: 'Start date (Unix ms)' },
  { flag: '--assignee', type: 'string[]', required: false, description: 'Assignee user ID (repeatable)' },
  { flag: '--tag', type: 'string[]', required: false, description: 'Tag name (repeatable)' },
  { flag: '--time-estimate', type: 'integer', required: false, description: 'Time estimate in ms' },
  { flag: '--parent', type: 'string', required: false, description: 'Parent task ID (creates subtask)' },
])

registerSchema('task', 'update', 'Update a task', [
  { flag: '<task-id>', type: 'string', required: true, description: 'Task ID' },
  { flag: '--name', type: 'string', required: false, description: 'New task name' },
  { flag: '--description', type: 'string', required: false, description: 'New description' },
  { flag: '--status', type: 'string', required: false, description: 'New status' },
  { flag: '--priority', type: 'integer', required: false, description: 'New priority (1-4)' },
  { flag: '--due-date', type: 'string', required: false, description: 'New due date (Unix ms)' },
  { flag: '--assignee-add', type: 'string[]', required: false, description: 'Add assignee (repeatable)' },
  { flag: '--assignee-remove', type: 'string[]', required: false, description: 'Remove assignee (repeatable)' },
])

registerSchema('task', 'delete', 'Delete a task', [
  { flag: '<task-id>', type: 'string', required: true, description: 'Task ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

registerSchema('task', 'time-in-status', 'Get time spent in each status for a task', [
  { flag: '<task-id>', type: 'string', required: true, description: 'Task ID' },
])

const TASK_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'status', header: 'Status', width: 15 },
  { key: 'priority', header: 'Priority', width: 10 },
  { key: 'assignees', header: 'Assignees', width: 20 },
  { key: 'due_date', header: 'Due Date', width: 15 },
]

const TIME_IN_STATUS_COLUMNS: ColumnDef[] = [
  { key: 'status', header: 'Status', width: 20 },
  { key: 'color', header: 'Color', width: 10 },
  { key: 'total_time', header: 'Total Time', width: 20 },
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

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value])
}

function buildTaskListParams(opts: Record<string, unknown>): Record<string, string | string[] | undefined> {
  const params: Record<string, string | string[] | undefined> = {}
  if (opts.archived) params['archived'] = 'true'
  if (opts.includeClosed) params['include_closed'] = 'true'
  if (opts.subtasks) params['subtasks'] = 'true'
  if (opts.page !== undefined) params['page'] = String(opts.page)
  if (opts.orderBy) params['order_by'] = opts.orderBy as string
  if (opts.reverse) params['reverse'] = 'true'
  if (opts.dueDateGt) params['due_date_gt'] = opts.dueDateGt as string
  if (opts.dueDateLt) params['due_date_lt'] = opts.dueDateLt as string
  if (opts.dateCreatedGt) params['date_created_gt'] = opts.dateCreatedGt as string
  if (opts.dateCreatedLt) params['date_created_lt'] = opts.dateCreatedLt as string
  if (opts.dateUpdatedGt) params['date_updated_gt'] = opts.dateUpdatedGt as string
  if (opts.dateUpdatedLt) params['date_updated_lt'] = opts.dateUpdatedLt as string
  const statuses = opts.status as string[] | undefined
  if (statuses?.length) params['statuses[]'] = statuses
  const assignees = opts.assignee as string[] | undefined
  if (assignees?.length) params['assignees[]'] = assignees
  const tags = opts.tag as string[] | undefined
  if (tags?.length) params['tags[]'] = tags
  const customFields = opts.customField as string[] | undefined
  if (customFields?.length) {
    for (const cf of customFields) params['custom_fields'] = JSON.stringify(customFields.map(f => JSON.parse(f)))
  }
  return params
}

export function registerTaskCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const task = program.command('task').description('Manage tasks')

  task
    .command('list')
    .description('List tasks in a list')
    .requiredOption('--list-id <id>', 'List ID')
    .option('--archived', 'Include archived tasks')
    .option('--include-closed', 'Include tasks in closed status')
    .option('--subtasks', 'Include subtasks in results')
    .option('--page <n>', 'Page number (0-indexed)', parseInt)
    .option('--status <s>', 'Filter by status (repeatable)', collect, [])
    .option('--assignee <id>', 'Filter by assignee ID (repeatable)', collect, [])
    .option('--tag <name>', 'Filter by tag name (repeatable)', collect, [])
    .option('--due-date-gt <ts>', 'Tasks due after timestamp')
    .option('--due-date-lt <ts>', 'Tasks due before timestamp')
    .option('--date-created-gt <ts>', 'Tasks created after timestamp')
    .option('--date-created-lt <ts>', 'Tasks created before timestamp')
    .option('--date-updated-gt <ts>', 'Tasks updated after timestamp')
    .option('--date-updated-lt <ts>', 'Tasks updated before timestamp')
    .option('--custom-field <json>', 'Custom field filter as JSON (repeatable)', collect, [])
    .option('--order-by <field>', 'Sort by field (id|created|updated|due_date)')
    .option('--reverse', 'Reverse sort order')
    .action(async (opts) => {
      const client = getClient()
      const params = buildTaskListParams(opts)
      const data = await client.get<TaskListResponse>(`/list/${opts.listId}/task`, params)
      formatOutput(data.tasks, TASK_COLUMNS, getOutputOptions(program))
    })

  task
    .command('search')
    .description('Search tasks across a workspace')
    .option('--query <text>', 'Full-text search query')
    .option('--include-closed', 'Include tasks in closed status')
    .option('--subtasks', 'Include subtasks')
    .option('--page <n>', 'Page number (0-indexed)', parseInt)
    .option('--status <s>', 'Filter by status (repeatable)', collect, [])
    .option('--assignee <id>', 'Filter by assignee ID (repeatable)', collect, [])
    .option('--tag <name>', 'Filter by tag name (repeatable)', collect, [])
    .option('--priority <n>', 'Filter by priority (repeatable)', collect, [])
    .option('--list-id <id>', 'Scope to list IDs (repeatable)', collect, [])
    .option('--folder-id <id>', 'Scope to folder IDs (repeatable)', collect, [])
    .option('--space-id <id>', 'Scope to space IDs (repeatable)', collect, [])
    .option('--project-id <id>', 'Scope to project IDs (repeatable)', collect, [])
    .option('--due-date-gt <ts>', 'Tasks due after timestamp')
    .option('--due-date-lt <ts>', 'Tasks due before timestamp')
    .option('--date-created-gt <ts>', 'Tasks created after timestamp')
    .option('--date-created-lt <ts>', 'Tasks created before timestamp')
    .option('--custom-field <json>', 'Custom field filter as JSON (repeatable)', collect, [])
    .option('--order-by <field>', 'Sort by field (id|created|updated|due_date)')
    .option('--reverse', 'Reverse sort order')
    .action(async (opts) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const params: Record<string, string | string[] | undefined> = {}
      if (opts.query) params['query'] = opts.query as string
      if (opts.includeClosed) params['include_closed'] = 'true'
      if (opts.subtasks) params['subtasks'] = 'true'
      if (opts.page !== undefined) params['page'] = String(opts.page)
      if (opts.orderBy) params['order_by'] = opts.orderBy as string
      if (opts.reverse) params['reverse'] = 'true'
      if (opts.dueDateGt) params['due_date_gt'] = opts.dueDateGt as string
      if (opts.dueDateLt) params['due_date_lt'] = opts.dueDateLt as string
      if (opts.dateCreatedGt) params['date_created_gt'] = opts.dateCreatedGt as string
      if (opts.dateCreatedLt) params['date_created_lt'] = opts.dateCreatedLt as string
      const statuses = opts.status as string[]
      if (statuses.length) params['statuses[]'] = statuses
      const assignees = opts.assignee as string[]
      if (assignees.length) params['assignees[]'] = assignees
      const tags = opts.tag as string[]
      if (tags.length) params['tags[]'] = tags
      const priorities = opts.priority as string[]
      if (priorities.length) params['priorities[]'] = priorities
      const listIds = opts.listId as string[]
      if (listIds.length) params['list_ids[]'] = listIds
      const folderIds = opts.folderId as string[]
      if (folderIds.length) params['folder_ids[]'] = folderIds
      const spaceIds = opts.spaceId as string[]
      if (spaceIds.length) params['space_ids[]'] = spaceIds
      const projectIds = opts.projectId as string[]
      if (projectIds.length) params['project_ids[]'] = projectIds
      const customFields = opts.customField as string[]
      if (customFields.length) params['custom_fields'] = JSON.stringify(customFields.map(f => JSON.parse(f)))
      const data = await client.get<TaskSearchResponse>(`/team/${workspaceId}/task`, params)
      formatOutput(data.tasks, TASK_COLUMNS, getOutputOptions(program))
    })

  task
    .command('get')
    .description('Get task details')
    .argument('<task-id>', 'Task ID')
    .option('--include-subtasks', 'Include subtasks')
    .option('--include-markdown-description', 'Return description as Markdown')
    .action(async (taskId: string, opts: { includeSubtasks?: boolean; includeMarkdownDescription?: boolean }) => {
      const client = getClient()
      const params: Record<string, string | undefined> = {}
      if (opts.includeSubtasks) params['include_subtasks'] = 'true'
      if (opts.includeMarkdownDescription) params['include_markdown_description'] = 'true'
      const data = await client.get<Record<string, unknown>>(`/task/${taskId}`, params)
      formatOutput(data, TASK_COLUMNS, getOutputOptions(program))
    })

  task
    .command('create')
    .description('Create a new task')
    .requiredOption('--list-id <id>', 'List ID')
    .requiredOption('--name <name>', 'Task name')
    .option('--description <desc>', 'Plain text description')
    .option('--markdown-description <md>', 'Markdown description (overrides --description)')
    .option('--status <s>', 'Initial status')
    .option('--priority <n>', 'Priority (1=urgent, 2=high, 3=normal, 4=low)', parseInt)
    .option('--due-date <date>', 'Due date (Unix ms)')
    .option('--start-date <date>', 'Start date (Unix ms)')
    .option('--assignee <id>', 'Assignee user ID (repeatable)', collect, [])
    .option('--tag <name>', 'Tag name (repeatable)', collect, [])
    .option('--time-estimate <ms>', 'Time estimate in milliseconds', parseInt)
    .option('--notify-all', 'Notify all assignees and watchers')
    .option('--parent <task-id>', 'Parent task ID (creates subtask)')
    .option('--links-to <task-id>', 'Link to another task')
    .option('--custom-field <id=value>', 'Set custom field (repeatable)', collect, [])
    .option('--check-required-custom-fields', 'Reject if required custom fields are missing')
    .action(async (opts) => {
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.markdownDescription !== undefined) body['markdown_description'] = opts.markdownDescription
      else if (opts.description !== undefined) body['description'] = opts.description
      if (opts.status !== undefined) body['status'] = opts.status
      if (opts.priority !== undefined) body['priority'] = opts.priority
      if (opts.dueDate !== undefined) body['due_date'] = parseInt(opts.dueDate, 10)
      if (opts.startDate !== undefined) body['start_date'] = parseInt(opts.startDate, 10)
      const assignees = opts.assignee as string[]
      if (assignees.length) body['assignees'] = assignees.map((a: string) => parseInt(a, 10))
      const tags = opts.tag as string[]
      if (tags.length) body['tags'] = tags
      if (opts.timeEstimate !== undefined) body['time_estimate'] = opts.timeEstimate
      if (opts.notifyAll) body['notify_all'] = true
      if (opts.parent !== undefined) body['parent'] = opts.parent
      if (opts.linksTo !== undefined) body['links_to'] = opts.linksTo
      const customFields = opts.customField as string[]
      if (customFields.length) {
        body['custom_fields'] = customFields.map((cf: string) => {
          const eqIdx = cf.indexOf('=')
          if (eqIdx === -1) throw new Error(`Invalid custom field format: ${cf}. Expected: <id>=<value>`)
          const id = cf.slice(0, eqIdx)
          let value: unknown = cf.slice(eqIdx + 1)
          try { value = JSON.parse(value as string) } catch { /* use as string */ }
          return { id, value }
        })
      }
      if (opts.checkRequiredCustomFields) body['check_required_custom_fields'] = true
      const data = await client.post<Record<string, unknown>>(`/list/${opts.listId}/task`, body)
      formatOutput(data, TASK_COLUMNS, getOutputOptions(program))
    })

  task
    .command('update')
    .description('Update a task')
    .argument('<task-id>', 'Task ID')
    .option('--name <name>', 'New task name')
    .option('--description <desc>', 'New description')
    .option('--status <s>', 'New status')
    .option('--priority <n>', 'New priority (1-4)', parseInt)
    .option('--due-date <date>', 'New due date (Unix ms)')
    .option('--start-date <date>', 'New start date (Unix ms)')
    .option('--time-estimate <ms>', 'New time estimate in milliseconds', parseInt)
    .option('--assignee-add <id>', 'Add assignee (repeatable)', collect, [])
    .option('--assignee-remove <id>', 'Remove assignee (repeatable)', collect, [])
    .option('--archived <bool>', 'Archive or unarchive')
    .action(async (taskId: string, opts) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      if (opts.description !== undefined) body['description'] = opts.description
      if (opts.status !== undefined) body['status'] = opts.status
      if (opts.priority !== undefined) body['priority'] = opts.priority
      if (opts.dueDate !== undefined) body['due_date'] = parseInt(opts.dueDate, 10)
      if (opts.startDate !== undefined) body['start_date'] = parseInt(opts.startDate, 10)
      if (opts.timeEstimate !== undefined) body['time_estimate'] = opts.timeEstimate
      const addIds = opts.assigneeAdd as string[]
      const remIds = opts.assigneeRemove as string[]
      if (addIds.length || remIds.length) {
        body['assignees'] = {
          add: addIds.map((a: string) => parseInt(a, 10)),
          rem: remIds.map((a: string) => parseInt(a, 10)),
        }
      }
      if (opts.archived !== undefined) body['archived'] = opts.archived === 'true'
      const data = await client.put<Record<string, unknown>>(`/task/${taskId}`, body)
      formatOutput(data, TASK_COLUMNS, getOutputOptions(program))
    })

  task
    .command('delete')
    .description('Delete a task')
    .argument('<task-id>', 'Task ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (taskId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete task ${taskId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/task/${taskId}`)
      process.stdout.write(`Deleted task ${taskId}\n`)
    })

  task
    .command('time-in-status')
    .description('Get time spent in each status')
    .argument('<task-id>', 'Task ID')
    .action(async (taskId: string) => {
      const client = getClient()
      const data = await client.get<TimeInStatusResponse>(`/task/${taskId}/time_in_status`)
      const entries = data.status_history ?? []
      if (data.current_status) entries.push(data.current_status)
      formatOutput(entries, TIME_IN_STATUS_COLUMNS, getOutputOptions(program))
    })

  task
    .command('bulk-time-in-status')
    .description('Get time-in-status for multiple tasks')
    .requiredOption('--task-id <id>', 'Task ID (repeatable)', collect, [])
    .action(async (opts) => {
      const client = getClient()
      const taskIds = opts.taskId as string[]
      const results: Record<string, unknown>[] = []
      for (const id of taskIds) {
        const data = await client.get<TimeInStatusResponse>(`/task/${id}/time_in_status`)
        const entries = data.status_history ?? []
        if (data.current_status) entries.push(data.current_status)
        results.push({ task_id: id, statuses: entries })
      }
      formatOutput(results, [
        { key: 'task_id', header: 'Task ID', width: 14 },
        { key: 'statuses', header: 'Statuses', width: 50 },
      ], getOutputOptions(program))
    })
}
