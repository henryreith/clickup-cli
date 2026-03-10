import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import type { WebhookListResponse, WebhookResponse } from '../types/webhook.js'
import { registerSchema } from '../schema.js'

registerSchema('webhook', 'list', 'List webhooks in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
])

registerSchema('webhook', 'create', 'Create a webhook', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--endpoint', type: 'string', required: true, description: 'Webhook endpoint URL' },
  { flag: '--event', type: 'string[]', required: false, description: 'Event to subscribe to (repeatable)' },
  { flag: '--space-id', type: 'string', required: false, description: 'Scope to space' },
  { flag: '--folder-id', type: 'string', required: false, description: 'Scope to folder' },
  { flag: '--list-id', type: 'string', required: false, description: 'Scope to list' },
  { flag: '--task-id', type: 'string', required: false, description: 'Scope to task' },
])

registerSchema('webhook', 'update', 'Update a webhook', [
  { flag: '<webhook-id>', type: 'string', required: true, description: 'Webhook ID' },
  { flag: '--endpoint', type: 'string', required: false, description: 'New endpoint URL' },
  { flag: '--event', type: 'string[]', required: false, description: 'Events (repeatable, replaces existing)' },
  { flag: '--status', type: 'string', required: false, description: 'Status (active or inactive)' },
])

registerSchema('webhook', 'delete', 'Delete a webhook', [
  { flag: '<webhook-id>', type: 'string', required: true, description: 'Webhook ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

registerSchema('webhook', 'events', 'List available webhook event types', [])

const WEBHOOK_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'endpoint', header: 'Endpoint', width: 40 },
  { key: 'events_count', header: 'Events', width: 8 },
  { key: 'health_status', header: 'Health', width: 10 },
]

const WEBHOOK_EVENTS = [
  'taskCreated', 'taskUpdated', 'taskDeleted',
  'taskPriorityUpdated', 'taskStatusUpdated', 'taskAssigneeUpdated',
  'taskDueDateUpdated', 'taskTagUpdated', 'taskMoved',
  'taskCommentPosted', 'taskCommentUpdated',
  'taskTimeEstimateUpdated', 'taskTimeTrackedUpdated',
  'listCreated', 'listUpdated', 'listDeleted',
  'folderCreated', 'folderUpdated', 'folderDeleted',
  'spaceCreated', 'spaceUpdated', 'spaceDeleted',
  'goalCreated', 'goalUpdated', 'goalDeleted',
  'goalKeyResultCreated', 'goalKeyResultUpdated', 'goalKeyResultDeleted',
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

function formatWebhooks(webhooks: Record<string, unknown>[]) {
  return webhooks.map((w) => ({
    ...w,
    events_count: Array.isArray(w['events']) ? (w['events'] as unknown[]).length : 0,
    health_status: (w['health'] as Record<string, unknown> | undefined)?.['status'] ?? 'unknown',
  }))
}

export function registerWebhookCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const webhook = program.command('webhook').description('Manage webhooks')

  webhook
    .command('list')
    .description('List webhooks')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<WebhookListResponse>(`/team/${workspaceId}/webhook`)
      formatOutput(formatWebhooks(data.webhooks as Record<string, unknown>[]), WEBHOOK_COLUMNS, getOutputOptions(program))
    })

  webhook
    .command('create')
    .description('Create a webhook')
    .requiredOption('--endpoint <url>', 'Webhook endpoint URL')
    .option('--event <event>', 'Event to subscribe to (repeatable)', collect, [])
    .option('--space-id <id>', 'Scope to space')
    .option('--folder-id <id>', 'Scope to folder')
    .option('--list-id <id>', 'Scope to list')
    .option('--task-id <id>', 'Scope to task')
    .action(async (opts: { endpoint: string; event: string[]; spaceId?: string; folderId?: string; listId?: string; taskId?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = {
        endpoint: opts.endpoint,
        events: opts.event,
      }
      if (opts.spaceId !== undefined) body['space_id'] = opts.spaceId
      if (opts.folderId !== undefined) body['folder_id'] = opts.folderId
      if (opts.listId !== undefined) body['list_id'] = opts.listId
      if (opts.taskId !== undefined) body['task_id'] = opts.taskId
      const data = await client.post<WebhookResponse>(`/team/${workspaceId}/webhook`, body)
      process.stdout.write(`Created webhook ${data.id ?? ''}\n`)
    })

  webhook
    .command('update')
    .description('Update a webhook')
    .argument('<webhook-id>', 'Webhook ID')
    .option('--endpoint <url>', 'New endpoint URL')
    .option('--event <event>', 'Event to subscribe to (repeatable, replaces existing)', collect, [])
    .option('--status <status>', 'Status (active or inactive)')
    .action(async (webhookId: string, opts: { endpoint?: string; event: string[]; status?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.endpoint !== undefined) body['endpoint'] = opts.endpoint
      if (opts.event.length) body['events'] = opts.event
      if (opts.status !== undefined) body['status'] = opts.status
      await client.put(`/webhook/${webhookId}`, body)
      process.stdout.write(`Updated webhook ${webhookId}\n`)
    })

  webhook
    .command('delete')
    .description('Delete a webhook')
    .argument('<webhook-id>', 'Webhook ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (webhookId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete webhook ${webhookId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/webhook/${webhookId}`)
      process.stdout.write(`Deleted webhook ${webhookId}\n`)
    })

  webhook
    .command('events')
    .description('List available webhook event types')
    .action(() => {
      const rows = WEBHOOK_EVENTS.map((e) => ({ event: e }))
      formatOutput(rows, [{ key: 'event', header: 'Event', width: 35 }], getOutputOptions(program))
    })
}
