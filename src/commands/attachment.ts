import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { registerSchema } from '../schema.js'

registerSchema('attachment', 'upload', 'Upload a file to a task', [
  { flag: '--task-id', type: 'string', required: true, description: 'Task ID' },
  { flag: '--file', type: 'string', required: true, description: 'Local file path' },
  { flag: '--filename', type: 'string', required: false, description: 'Override display filename' },
])

const ATTACHMENT_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'title', header: 'Title', width: 30 },
  { key: 'url', header: 'URL', width: 40 },
  { key: 'type', header: 'Type', width: 15 },
  { key: 'size', header: 'Size', width: 10 },
]

export function registerAttachmentCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const attachment = program.command('attachment').description('Manage attachments')

  attachment
    .command('upload')
    .description('Upload a file to a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--file <path>', 'Local file path')
    .option('--filename <name>', 'Override display filename')
    .action(async (opts: { taskId: string; file: string; filename?: string }) => {
      const client = getClient()
      const data = await client.upload<Record<string, unknown>>(`/task/${opts.taskId}/attachment`, opts.file, opts.filename)
      formatOutput(data, ATTACHMENT_COLUMNS, getOutputOptions(program))
    })
}
