import { Command } from 'commander'
import { z } from 'zod'
import type { ClickUpClient } from '../client.js'
import { resolveWorkspaceId } from '../config.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { registerSchema } from '../schema.js'

const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  member_count: z.number().optional(),
})

type Channel = z.infer<typeof ChannelSchema>

const CHANNEL_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'name', header: 'Name', width: 35 },
  { key: 'type', header: 'Type', width: 12 },
  { key: 'member_count', header: 'Members', width: 10 },
]

registerSchema('chat', 'channels', 'List chat channels in workspace', [
  { flag: '--workspace-id', type: 'string', required: false, description: 'Workspace ID' },
])

registerSchema('chat', 'send', 'Send a message to a chat channel', [
  { flag: '--channel-id', type: 'string', required: true, description: 'Channel ID' },
  { flag: '--message', type: 'string', required: true, description: 'Message text' },
  { flag: '--workspace-id', type: 'string', required: false, description: 'Workspace ID' },
])

export function registerChatCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const chat = program.command('chat').description('Manage chat channels and messages')

  chat
    .command('channels')
    .description('List chat channels in workspace')
    .option('--workspace-id <id>', 'Workspace ID')
    .action(async (opts: { workspaceId?: string }) => {
      const globalOpts = program.opts()
      const workspaceId = resolveWorkspaceId(opts.workspaceId ?? (globalOpts['workspaceId'] as string | undefined))
      if (!workspaceId) {
        process.stderr.write('Error: No workspace ID. Use --workspace-id or run: clickup config set workspace_id <id>\n')
        process.exit(2)
        return
      }
      const client = getClient()
      const data = await client.get<{ channels?: Channel[] } | Channel[]>(`/team/${workspaceId}/channel`)
      const rows = Array.isArray(data) ? data : ((data as { channels?: Channel[] }).channels ?? [])
      formatOutput(rows, CHANNEL_COLUMNS, getOutputOptions(program))
    })

  chat
    .command('send')
    .description('Send a message to a chat channel')
    .requiredOption('--channel-id <id>', 'Channel ID')
    .requiredOption('--message <text>', 'Message text')
    .option('--workspace-id <id>', 'Workspace ID')
    .action(async (opts: { channelId: string; message: string; workspaceId?: string }) => {
      const globalOpts = program.opts()
      const workspaceId = resolveWorkspaceId(opts.workspaceId ?? (globalOpts['workspaceId'] as string | undefined))
      if (!workspaceId) {
        process.stderr.write('Error: No workspace ID. Use --workspace-id or run: clickup config set workspace_id <id>\n')
        process.exit(2)
        return
      }
      const client = getClient()
      const result = await client.post<Record<string, unknown>>(
        `/team/${workspaceId}/channel/${opts.channelId}/message`,
        { content: opts.message },
      )
      formatOutput(result, [
        { key: 'id', header: 'Message ID', width: 24 },
        { key: 'content', header: 'Content', width: 50 },
      ], getOutputOptions(program))
    })
}
