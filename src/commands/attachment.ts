import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
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

registerSchema('attachment', 'list', 'List attachments on a task', [
  { flag: '--task-id', type: 'string', required: true, description: 'Task ID' },
])

registerSchema('attachment', 'download', 'Download an attachment from a task', [
  { flag: '--task-id', type: 'string', required: true, description: 'Task ID' },
  { flag: '--attachment-id', type: 'string', required: true, description: 'Attachment ID' },
  { flag: '--output', type: 'string', required: false, description: 'Output file path (default: ./attachment-<id>-<title>)' },
])

const ATTACHMENT_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'title', header: 'Title', width: 30 },
  { key: 'url', header: 'URL', width: 40 },
  { key: 'type', header: 'Type', width: 15 },
  { key: 'size', header: 'Size', width: 10 },
]

interface Attachment {
  id: string
  title: string
  url: string
  type?: string
  size?: number
}

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

  attachment
    .command('list')
    .description('List attachments on a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .action(async (opts: { taskId: string }) => {
      const client = getClient()
      const data = await client.get<Record<string, unknown>>(`/task/${opts.taskId}`)
      const attachments = (data['attachments'] as Attachment[] | undefined) ?? []
      formatOutput(attachments, ATTACHMENT_COLUMNS, getOutputOptions(program))
    })

  attachment
    .command('download')
    .description('Download an attachment from a task')
    .requiredOption('--task-id <id>', 'Task ID')
    .requiredOption('--attachment-id <id>', 'Attachment ID')
    .option('--output <path>', 'Output file path')
    .action(async (opts: { taskId: string; attachmentId: string; output?: string }) => {
      const { default: ora } = await import('ora')
      const client = getClient()

      // Fetch task to get attachment URL
      const data = await client.get<Record<string, unknown>>(`/task/${opts.taskId}`)
      const attachments = (data['attachments'] as Attachment[] | undefined) ?? []
      const attachment = attachments.find((a) => a.id === opts.attachmentId)

      if (!attachment) {
        process.stderr.write(`Error: Attachment "${opts.attachmentId}" not found on task "${opts.taskId}".\n`)
        process.exit(4)
        return
      }

      const outputPath =
        opts.output ?? join(process.cwd(), `attachment-${attachment.id}-${attachment.title}`)

      const spinner = ora(`Downloading ${attachment.title}...`).start()

      try {
        const buffer = await client.downloadUrl(attachment.url)
        writeFileSync(outputPath, Buffer.from(buffer))
        spinner.succeed(`Downloaded to ${outputPath}`)
      } catch (err) {
        spinner.fail('Download failed')
        throw err
      }
    })
}
