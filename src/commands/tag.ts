import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { TagListResponse } from '../types/tag.js'

const TAG_COLUMNS: ColumnDef[] = [
  { key: 'name', header: 'Name', width: 25 },
  { key: 'tag_fg', header: 'FG Color', width: 12 },
  { key: 'tag_bg', header: 'BG Color', width: 12 },
]

export function registerTagCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const tag = program.command('tag').description('Manage tags')

  tag
    .command('list')
    .description('List tags in a space')
    .requiredOption('--space-id <id>', 'Space ID')
    .action(async (opts: { spaceId: string }) => {
      const client = getClient()
      const data = await client.get<TagListResponse>(`/space/${opts.spaceId}/tag`)
      formatOutput(data.tags, TAG_COLUMNS, getOutputOptions(program))
    })

  tag
    .command('create')
    .description('Create a tag in a space')
    .requiredOption('--space-id <id>', 'Space ID')
    .requiredOption('--name <name>', 'Tag name')
    .option('--fg-color <hex>', 'Text color (e.g. #FFFFFF)')
    .option('--bg-color <hex>', 'Background color (e.g. #8B5CF6)')
    .action(async (opts: { spaceId: string; name: string; fgColor?: string; bgColor?: string }) => {
      const client = getClient()
      const tagObj: Record<string, unknown> = { name: opts.name }
      if (opts.fgColor !== undefined) tagObj['tag_fg'] = opts.fgColor
      if (opts.bgColor !== undefined) tagObj['tag_bg'] = opts.bgColor
      await client.post(`/space/${opts.spaceId}/tag`, { tag: tagObj })
      process.stdout.write(`Created tag "${opts.name}"\n`)
    })

  tag
    .command('update')
    .description('Update a tag in a space')
    .requiredOption('--space-id <id>', 'Space ID')
    .requiredOption('--name <name>', 'Current tag name')
    .option('--new-name <name>', 'New tag name')
    .option('--fg-color <hex>', 'New text color')
    .option('--bg-color <hex>', 'New background color')
    .action(async (opts: { spaceId: string; name: string; newName?: string; fgColor?: string; bgColor?: string }) => {
      const client = getClient()
      const tagObj: Record<string, unknown> = {}
      if (opts.newName !== undefined) tagObj['name'] = opts.newName
      if (opts.fgColor !== undefined) tagObj['tag_fg'] = opts.fgColor
      if (opts.bgColor !== undefined) tagObj['tag_bg'] = opts.bgColor
      await client.put(`/space/${opts.spaceId}/tag/${encodeURIComponent(opts.name)}`, { tag: tagObj })
      process.stdout.write(`Updated tag "${opts.name}"\n`)
    })

  tag
    .command('delete')
    .description('Delete a tag from a space')
    .requiredOption('--space-id <id>', 'Space ID')
    .requiredOption('--name <name>', 'Tag name')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (opts: { spaceId: string; name: string; confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete tag "${opts.name}"?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/space/${opts.spaceId}/tag/${encodeURIComponent(opts.name)}`)
      process.stdout.write(`Deleted tag "${opts.name}"\n`)
    })

  tag
    .command('add')
    .description('Add a tag to a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--name <name>', 'Tag name')
    .action(async (opts: { taskId: string; name: string }) => {
      const client = getClient()
      await client.post(`/task/${opts.taskId}/tag/${encodeURIComponent(opts.name)}`)
      process.stdout.write(`Added tag "${opts.name}" to task ${opts.taskId}\n`)
    })

  tag
    .command('remove')
    .description('Remove a tag from a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--name <name>', 'Tag name')
    .action(async (opts: { taskId: string; name: string }) => {
      const client = getClient()
      await client.delete(`/task/${opts.taskId}/tag/${encodeURIComponent(opts.name)}`)
      process.stdout.write(`Removed tag "${opts.name}" from task ${opts.taskId}\n`)
    })
}
