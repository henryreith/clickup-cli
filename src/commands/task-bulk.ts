import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { TimeInStatusResponse } from '../types/task.js'
import { registerSchema } from '../schema.js'
import { intArg, parseDateStrict, parseIntStrict } from '../parse.js'
import { collect, parsePriority } from './task.js'

registerSchema('task', 'bulk-update', 'Apply the same update to multiple tasks', [
  { flag: '--task-id', type: 'string[]', required: true, description: 'Task ID (repeatable)' },
  { flag: '--name', type: 'string', required: false, description: 'New task name' },
  { flag: '--description', type: 'string', required: false, description: 'New description' },
  { flag: '--status', type: 'string', required: false, description: 'New status' },
  { flag: '--priority', type: 'string', required: false, description: 'New priority (1-4 or urgent/high/normal/low)' },
])

registerSchema('task', 'bulk-delete', 'Delete multiple tasks', [
  { flag: '--task-id', type: 'string[]', required: true, description: 'Task ID (repeatable)' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

async function runConcurrent<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<(T | Error)[]> {
  const results: (T | Error)[] = new Array(tasks.length)
  let idx = 0

  async function worker() {
    while (idx < tasks.length) {
      const current = idx++
      try {
        results[current] = await tasks[current]!()
      } catch (e) {
        results[current] = e instanceof Error ? e : new Error(String(e))
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

export function registerTaskBulkCommands(
  task: Command,
  program: Command,
  getClient: () => ClickUpClient,
): void {
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

  task
    .command('bulk-update')
    .description('Apply the same update to multiple tasks')
    .requiredOption('--task-id <id>', 'Task ID (repeatable)', collect, [])
    .option('--name <name>', 'New task name')
    .option('--description <desc>', 'New description')
    .option('--status <s>', 'New status')
    .option('--priority <n>', 'New priority (1-4 or urgent/high/normal/low)')
    .option('--due-date <date>', 'New due date (Unix ms)')
    .option('--start-date <date>', 'New start date (Unix ms)')
    .option('--time-estimate <ms>', 'New time estimate in milliseconds', intArg('--time-estimate'))
    .option('--assignee-add <id>', 'Add assignee (repeatable)', collect, [])
    .option('--assignee-remove <id>', 'Remove assignee (repeatable)', collect, [])
    .action(async (opts) => {
      const client = getClient()
      const taskIds = opts.taskId as string[]

      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      if (opts.description !== undefined) body['description'] = opts.description
      if (opts.status !== undefined) body['status'] = opts.status
      if (opts.priority !== undefined) body['priority'] = parsePriority(opts.priority as string)
      if (opts.dueDate !== undefined) body['due_date'] = parseDateStrict(opts.dueDate, '--due-date')
      if (opts.startDate !== undefined) body['start_date'] = parseDateStrict(opts.startDate, '--start-date')
      if (opts.timeEstimate !== undefined) body['time_estimate'] = opts.timeEstimate
      const addIds = opts.assigneeAdd as string[]
      const remIds = opts.assigneeRemove as string[]
      if (addIds.length || remIds.length) {
        body['assignees'] = {
          add: addIds.map((a: string) => parseIntStrict(a, '--assignee-add')),
          rem: remIds.map((a: string) => parseIntStrict(a, '--assignee-remove')),
        }
      }

      const tasks = taskIds.map((id) => async () => {
        const data = await client.put<Record<string, unknown>>(`/task/${id}`, body)
        return { task_id: id, name: data['name'] as string, result: 'ok' }
      })

      const results = await runConcurrent(tasks, 3)
      const rows = results.map((r, i) =>
        r instanceof Error
          ? { task_id: taskIds[i], name: '', result: r.message }
          : r,
      )

      formatOutput(rows, [
        { key: 'task_id', header: 'Task ID', width: 14 },
        { key: 'name', header: 'Name', width: 30 },
        { key: 'result', header: 'Result', width: 20 },
      ], getOutputOptions(program))
    })

  task
    .command('bulk-delete')
    .description('Delete multiple tasks')
    .requiredOption('--task-id <id>', 'Task ID (repeatable)', collect, [])
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (opts) => {
      const client = getClient()
      const taskIds = opts.taskId as string[]

      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to bulk delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete ${taskIds.length} task(s)?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }

      const tasks = taskIds.map((id) => async () => {
        await client.delete(`/task/${id}`)
        return { task_id: id, result: 'deleted' }
      })

      const results = await runConcurrent(tasks, 3)
      const rows = results.map((r, i) =>
        r instanceof Error
          ? { task_id: taskIds[i], result: r.message }
          : r,
      )

      formatOutput(rows, [
        { key: 'task_id', header: 'Task ID', width: 14 },
        { key: 'result', header: 'Result', width: 20 },
      ], getOutputOptions(program))
    })
}
