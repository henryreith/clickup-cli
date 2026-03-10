import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { FolderListResponse } from '../types/folder.js'

const FOLDER_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 14 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'task_count', header: 'Tasks', width: 10 },
  { key: 'archived', header: 'Archived', width: 10 },
]

export function registerFolderCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const folder = program.command('folder').description('Manage folders')

  folder
    .command('list')
    .description('List folders in a space')
    .requiredOption('--space-id <id>', 'Space ID')
    .option('--archived', 'Include archived folders')
    .action(async (opts: { spaceId: string; archived?: boolean }) => {
      const client = getClient()
      const data = await client.get<FolderListResponse>(`/space/${opts.spaceId}/folder`, {
        archived: opts.archived ? 'true' : 'false',
      })
      formatOutput(data.folders, FOLDER_COLUMNS, getOutputOptions(program))
    })

  folder
    .command('get')
    .description('Get folder details')
    .argument('<folder-id>', 'Folder ID')
    .action(async (folderId: string) => {
      const client = getClient()
      const data = await client.get<Record<string, unknown>>(`/folder/${folderId}`)
      formatOutput(data, FOLDER_COLUMNS, getOutputOptions(program))
    })

  folder
    .command('create')
    .description('Create a new folder')
    .requiredOption('--space-id <id>', 'Space ID')
    .requiredOption('--name <name>', 'Folder name')
    .action(async (opts: { spaceId: string; name: string }) => {
      const client = getClient()
      const data = await client.post<Record<string, unknown>>(`/space/${opts.spaceId}/folder`, {
        name: opts.name,
      })
      formatOutput(data, FOLDER_COLUMNS, getOutputOptions(program))
    })

  folder
    .command('update')
    .description('Update a folder')
    .argument('<folder-id>', 'Folder ID')
    .option('--name <name>', 'New folder name')
    .action(async (folderId: string, opts: { name?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      const data = await client.put<Record<string, unknown>>(`/folder/${folderId}`, body)
      formatOutput(data, FOLDER_COLUMNS, getOutputOptions(program))
    })

  folder
    .command('delete')
    .description('Delete a folder')
    .argument('<folder-id>', 'Folder ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (folderId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete folder ${folderId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/folder/${folderId}`)
      process.stdout.write(`Deleted folder ${folderId}\n`)
    })
}
