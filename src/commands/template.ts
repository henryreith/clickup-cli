import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { TemplateListResponse } from '../types/template.js'

const TEMPLATE_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 20 },
  { key: 'name', header: 'Name', width: 40 },
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

registerSchema('template', 'list', 'List task templates in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--page', type: 'integer', required: false, description: 'Page number (starts at 0)' },
])

export function registerTemplateCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const template = program.command('template').description('Manage task templates')

  template
    .command('list')
    .description('List task templates')
    .option('--page <n>', 'Page number (starts at 0)', parseInt)
    .action(async (opts: { page?: number }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const params: Record<string, string> = {}
      if (opts.page !== undefined) params['page'] = String(opts.page)
      const data = await client.get<TemplateListResponse>(`/team/${workspaceId}/taskTemplate`, params)
      formatOutput(data.templates, TEMPLATE_COLUMNS, getOutputOptions(program))
    })
}
