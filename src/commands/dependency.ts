import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { registerSchema } from '../schema.js'

registerSchema('dependency', 'add', 'Add a dependency between tasks', [
  { flag: '--task-id', type: 'string', required: true, description: 'Task ID' },
  { flag: '--depends-on', type: 'string', required: false, description: 'This task depends on the given task' },
  { flag: '--dependency-of', type: 'string', required: false, description: 'This task is a dependency of the given task' },
])

registerSchema('dependency', 'remove', 'Remove a dependency between tasks', [
  { flag: '--task-id', type: 'string', required: true, description: 'Task ID' },
  { flag: '--depends-on', type: 'string', required: false, description: 'Remove depends-on relationship' },
  { flag: '--dependency-of', type: 'string', required: false, description: 'Remove dependency-of relationship' },
])

const DEPENDENCY_COLUMNS: ColumnDef[] = [
  { key: 'task_id', header: 'Task ID', width: 14 },
  { key: 'depends_on', header: 'Depends On', width: 14 },
  { key: 'dependency_of', header: 'Dependency Of', width: 14 },
]

export function registerDependencyCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const dependency = program.command('dependency').description('Manage task dependencies')

  dependency
    .command('add')
    .description('Add a dependency between tasks')
    .requiredOption('--task-id <id>', 'Task ID')
    .option('--depends-on <id>', 'This task depends on the given task')
    .option('--dependency-of <id>', 'This task is a dependency of the given task')
    .action(async (opts: { taskId: string; dependsOn?: string; dependencyOf?: string }) => {
      if (!opts.dependsOn && !opts.dependencyOf) {
        process.stderr.write('Error: Provide --depends-on or --dependency-of.\n')
        process.exit(2)
        return
      }
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.dependsOn) body['depends_on'] = opts.dependsOn
      if (opts.dependencyOf) body['dependency_of'] = opts.dependencyOf
      const data = await client.post<Record<string, unknown>>(`/task/${opts.taskId}/dependency`, body)
      formatOutput(data, DEPENDENCY_COLUMNS, getOutputOptions(program))
    })

  dependency
    .command('remove')
    .description('Remove a dependency between tasks')
    .requiredOption('--task-id <id>', 'Task ID')
    .option('--depends-on <id>', 'Remove depends-on relationship')
    .option('--dependency-of <id>', 'Remove dependency-of relationship')
    .action(async (opts: { taskId: string; dependsOn?: string; dependencyOf?: string }) => {
      if (!opts.dependsOn && !opts.dependencyOf) {
        process.stderr.write('Error: Provide --depends-on or --dependency-of.\n')
        process.exit(2)
        return
      }
      const client = getClient()
      const params: Record<string, string | undefined> = {}
      if (opts.dependsOn) params['depends_on'] = opts.dependsOn
      if (opts.dependencyOf) params['dependency_of'] = opts.dependencyOf
      await client.delete(`/task/${opts.taskId}/dependency?${new URLSearchParams(params as Record<string, string>).toString()}`)
      process.stdout.write(`Removed dependency from task ${opts.taskId}\n`)
    })
}
