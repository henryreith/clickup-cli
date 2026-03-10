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

registerSchema('template', 'apply-task', 'Create a task from a template', [
  { flag: '--list-id', type: 'string', required: true, description: 'List ID to create the task in' },
  { flag: '--template-id', type: 'string', required: true, description: 'Task template ID' },
  { flag: '--name', type: 'string', required: false, description: 'Override task name' },
])

registerSchema('template', 'apply-list', 'Create a list from a template', [
  { flag: '--folder-id', type: 'string', required: true, description: 'Folder ID to create the list in' },
  { flag: '--template-id', type: 'string', required: true, description: 'List template ID' },
  { flag: '--name', type: 'string', required: false, description: 'Override list name' },
])

registerSchema('template', 'apply-folder', 'Create a folder from a template', [
  { flag: '--space-id', type: 'string', required: true, description: 'Space ID to create the folder in' },
  { flag: '--template-id', type: 'string', required: true, description: 'Folder template ID' },
  { flag: '--name', type: 'string', required: false, description: 'Override folder name' },
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

  template
    .command('apply-task')
    .description('Create a task from a template')
    .requiredOption('--list-id <id>', 'List ID to create the task in')
    .requiredOption('--template-id <id>', 'Task template ID')
    .option('--name <name>', 'Override task name')
    .action(async (opts: { listId: string; templateId: string; name?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name) body['name'] = opts.name
      const data = await client.post(`/list/${opts.listId}/taskTemplate/${opts.templateId}`, body)
      formatOutput(data, TEMPLATE_COLUMNS, getOutputOptions(program))
    })

  template
    .command('apply-list')
    .description('Create a list from a template')
    .requiredOption('--folder-id <id>', 'Folder ID to create the list in')
    .requiredOption('--template-id <id>', 'List template ID')
    .option('--name <name>', 'Override list name')
    .action(async (opts: { folderId: string; templateId: string; name?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name) body['name'] = opts.name
      const data = await client.post(`/folder/${opts.folderId}/listTemplate/${opts.templateId}`, body)
      formatOutput(data, TEMPLATE_COLUMNS, getOutputOptions(program))
    })

  template
    .command('apply-folder')
    .description('Create a folder from a template')
    .requiredOption('--space-id <id>', 'Space ID to create the folder in')
    .requiredOption('--template-id <id>', 'Folder template ID')
    .option('--name <name>', 'Override folder name')
    .action(async (opts: { spaceId: string; templateId: string; name?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name) body['name'] = opts.name
      const data = await client.post(`/space/${opts.spaceId}/folderTemplate/${opts.templateId}`, body)
      formatOutput(data, TEMPLATE_COLUMNS, getOutputOptions(program))
    })
}
