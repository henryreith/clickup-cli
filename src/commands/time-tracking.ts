import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { parseDate } from '../dates.js'
import type {
  TimeEntryListResponse,
  TimeEntrySingleResponse,
  RunningTimeEntryResponse,
  TimeEntryTagListResponse,
  TimeEntryHistoryResponse,
} from '../types/time-tracking.js'

const TIME_ENTRY_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'task_id', header: 'Task', width: 12 },
  { key: 'duration', header: 'Duration', width: 12 },
  { key: 'start', header: 'Start', width: 18 },
  { key: 'end', header: 'End', width: 18 },
  { key: 'description', header: 'Description', width: 25 },
  { key: 'billable', header: 'Billable', width: 10 },
  { key: 'user_name', header: 'User', width: 15 },
]

const TIME_TAG_COLUMNS: ColumnDef[] = [
  { key: 'name', header: 'Name', width: 25 },
  { key: 'creator', header: 'Creator', width: 12 },
  { key: 'status', header: 'Status', width: 12 },
]

const TIME_HISTORY_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 12 },
  { key: 'field', header: 'Field', width: 15 },
  { key: 'before', header: 'Before', width: 20 },
  { key: 'after', header: 'After', width: 20 },
  { key: 'date', header: 'Date', width: 18 },
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

function formatEntries(entries: Record<string, unknown>[]) {
  return entries.map((e) => ({
    ...e,
    task_id: (e['task'] as Record<string, unknown> | undefined)?.['id'] ?? '',
    user_name: (e['user'] as Record<string, unknown> | undefined)?.['username'] ?? '',
  }))
}

export function registerTimeTrackingCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const time = program.command('time').description('Manage time tracking')

  time
    .command('list')
    .description('List time entries (by task or workspace-wide)')
    .option('--task-id <id>', 'Task ID')
    .option('--start <date>', 'Start date (ISO 8601, relative, or Unix ms)')
    .option('--end <date>', 'End date')
    .option('--assignee <id>', 'Assignee user ID (repeatable)', collect, [])
    .action(async (opts: { taskId?: string; start?: string; end?: string; assignee: string[] }) => {
      const client = getClient()

      if (opts.taskId) {
        const data = await client.get<TimeEntryListResponse>(`/task/${opts.taskId}/time`)
        formatOutput(formatEntries(data.data as Record<string, unknown>[]), TIME_ENTRY_COLUMNS, getOutputOptions(program))
      } else {
        const workspaceId = requireWorkspaceId(program)
        if (!workspaceId) return
        const params: Record<string, string | string[] | undefined> = {}
        if (opts.start) params['start_date'] = String(parseDate(opts.start))
        if (opts.end) params['end_date'] = String(parseDate(opts.end))
        if (opts.assignee.length) params['assignee'] = opts.assignee
        const data = await client.get<TimeEntryListResponse>(`/team/${workspaceId}/time_entries`, params)
        formatOutput(formatEntries(data.data as Record<string, unknown>[]), TIME_ENTRY_COLUMNS, getOutputOptions(program))
      }
    })

  time
    .command('get')
    .description('Get a specific time entry')
    .argument('<timer-id>', 'Time entry ID')
    .action(async (timerId: string) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<TimeEntrySingleResponse>(`/team/${workspaceId}/time_entries/${timerId}`)
      formatOutput(formatEntries([data.data as Record<string, unknown>]), TIME_ENTRY_COLUMNS, getOutputOptions(program))
    })

  time
    .command('create')
    .description('Create a time entry on a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--duration <ms>', 'Duration in milliseconds')
    .requiredOption('--start <ts>', 'Start time (Unix ms or date string)')
    .option('--description <desc>', 'Description')
    .option('--assignee <id>', 'Assignee user ID')
    .option('--billable <bool>', 'Billable (true/false)')
    .option('--tag <name>', 'Tag name (repeatable)', collect, [])
    .action(async (opts: { taskId: string; duration: string; start: string; description?: string; assignee?: string; billable?: string; tag: string[] }) => {
      const client = getClient()
      const body: Record<string, unknown> = {
        duration: parseInt(opts.duration, 10),
        start: String(parseDate(opts.start)),
      }
      if (opts.description !== undefined) body['description'] = opts.description
      if (opts.assignee !== undefined) body['assignee'] = parseInt(opts.assignee, 10)
      if (opts.billable !== undefined) body['billable'] = opts.billable === 'true'
      if (opts.tag.length) body['tags'] = opts.tag.map((t) => ({ name: t }))
      const data = await client.post<TimeEntrySingleResponse>(`/task/${opts.taskId}/time`, body)
      process.stdout.write(`Created time entry ${data.data?.id ?? ''}\n`)
    })

  time
    .command('update')
    .description('Update a time entry')
    .argument('<timer-id>', 'Time entry ID')
    .option('--description <desc>', 'Description')
    .option('--duration <ms>', 'Duration in milliseconds')
    .option('--start <ts>', 'Start time (Unix ms or date string)')
    .option('--tag-action <action>', 'Tag action (add or remove)')
    .option('--tag <name>', 'Tag name (repeatable)', collect, [])
    .option('--billable <bool>', 'Billable (true/false)')
    .action(async (timerId: string, opts: { description?: string; duration?: string; start?: string; tagAction?: string; tag: string[]; billable?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.description !== undefined) body['description'] = opts.description
      if (opts.duration !== undefined) body['duration'] = parseInt(opts.duration, 10)
      if (opts.start !== undefined) body['start'] = String(parseDate(opts.start))
      if (opts.billable !== undefined) body['billable'] = opts.billable === 'true'
      if (opts.tag.length) {
        body['tags'] = opts.tag.map((t) => ({ name: t }))
        if (opts.tagAction) body['tag_action'] = opts.tagAction
      }
      await client.put(`/team/${workspaceId}/time_entries/${timerId}`, body)
      process.stdout.write(`Updated time entry ${timerId}\n`)
    })

  time
    .command('delete')
    .description('Delete a time entry')
    .argument('<timer-id>', 'Time entry ID')
    .action(async (timerId: string) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      await client.delete(`/team/${workspaceId}/time_entries/${timerId}`)
      process.stdout.write(`Deleted time entry ${timerId}\n`)
    })

  time
    .command('history')
    .description('Get time entry change history')
    .argument('<timer-id>', 'Time entry ID')
    .action(async (timerId: string) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<TimeEntryHistoryResponse>(`/team/${workspaceId}/time_entries/${timerId}/history`)
      formatOutput(data.data, TIME_HISTORY_COLUMNS, getOutputOptions(program))
    })

  time
    .command('running')
    .description('Get current running timer')
    .option('--assignee <id>', 'Assignee user ID')
    .action(async (opts: { assignee?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const params: Record<string, string | undefined> = {}
      if (opts.assignee) params['assignee'] = opts.assignee
      const data = await client.get<RunningTimeEntryResponse>(`/team/${workspaceId}/time_entries/current`, params)
      if (data.data) {
        formatOutput(formatEntries([data.data as Record<string, unknown>]), TIME_ENTRY_COLUMNS, getOutputOptions(program))
      } else {
        process.stdout.write('No running timer.\n')
      }
    })

  time
    .command('start')
    .description('Start a running timer')
    .requiredOption('--task-id <id>', 'Task ID')
    .option('--description <desc>', 'Description')
    .option('--billable <bool>', 'Billable (true/false)')
    .option('--tag <name>', 'Tag name (repeatable)', collect, [])
    .action(async (opts: { taskId: string; description?: string; billable?: string; tag: string[] }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = { tid: opts.taskId }
      if (opts.description !== undefined) body['description'] = opts.description
      if (opts.billable !== undefined) body['billable'] = opts.billable === 'true'
      if (opts.tag.length) body['tags'] = opts.tag.map((t) => ({ name: t }))
      const data = await client.post<TimeEntrySingleResponse>(`/team/${workspaceId}/time_entries/start`, body)
      process.stdout.write(`Started timer ${data.data?.id ?? ''}\n`)
    })

  time
    .command('stop')
    .description('Stop the running timer')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.post<TimeEntrySingleResponse>(`/team/${workspaceId}/time_entries/stop`)
      process.stdout.write(`Stopped timer ${data.data?.id ?? ''}\n`)
    })

  time
    .command('tags')
    .description('List time tracking tags')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<TimeEntryTagListResponse>(`/team/${workspaceId}/time_entries/tags`)
      formatOutput(data.data, TIME_TAG_COLUMNS, getOutputOptions(program))
    })

  time
    .command('add-tags')
    .description('Add tags to time entries')
    .option('--timer-id <id>', 'Time entry ID (repeatable)', collect, [])
    .option('--tag <name>', 'Tag name (repeatable)', collect, [])
    .action(async (opts: { timerId: string[]; tag: string[] }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      if (!opts.timerId.length || !opts.tag.length) {
        process.stderr.write('Error: --timer-id and --tag are required.\n')
        process.exit(2)
        return
      }
      await client.post(`/team/${workspaceId}/time_entries/tags`, {
        time_entry_ids: opts.timerId,
        tags: opts.tag.map((t) => ({ name: t })),
      })
      process.stdout.write(`Added tags to ${opts.timerId.length} time entries.\n`)
    })

  time
    .command('remove-tags')
    .description('Remove tags from time entries')
    .option('--timer-id <id>', 'Time entry ID (repeatable)', collect, [])
    .option('--tag <name>', 'Tag name (repeatable)', collect, [])
    .action(async (opts: { timerId: string[]; tag: string[] }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      if (!opts.timerId.length || !opts.tag.length) {
        process.stderr.write('Error: --timer-id and --tag are required.\n')
        process.exit(2)
        return
      }
      await client.delete(`/team/${workspaceId}/time_entries/tags`, {
        time_entry_ids: opts.timerId,
        tags: opts.tag.map((t) => ({ name: t })),
      })
      process.stdout.write(`Removed tags from ${opts.timerId.length} time entries.\n`)
    })

  time
    .command('rename-tag')
    .description('Rename a time tracking tag')
    .requiredOption('--name <name>', 'Current tag name')
    .requiredOption('--new-name <name>', 'New tag name')
    .action(async (opts: { name: string; newName: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      await client.put(`/team/${workspaceId}/time_entries/tags`, {
        name: opts.name,
        new_name: opts.newName,
      })
      process.stdout.write(`Renamed tag "${opts.name}" to "${opts.newName}"\n`)
    })
}
