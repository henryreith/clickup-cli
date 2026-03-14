import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { TemplateListResponse, ApplyTaskResponse, ApplyListResponse, ApplyFolderResponse } from '../types/template.js'

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

registerSchema('template', 'apply-task', 'Create a task from a task template', [
  { flag: '--list-id', type: 'string', required: true, description: 'List to create the task in' },
  { flag: '--template-id', type: 'string', required: true, description: 'Template ID to apply' },
  { flag: '--name', type: 'string', required: false, description: 'Override the template name' },
])

registerSchema('template', 'apply-list', 'Create a list from a list template', [
  { flag: '--template-id', type: 'string', required: true, description: 'Template ID to apply' },
  { flag: '--folder-id', type: 'string', required: false, description: 'Folder to create the list in (use this or --space-id)' },
  { flag: '--space-id', type: 'string', required: false, description: 'Space to create the list in (use this or --folder-id)' },
  { flag: '--name', type: 'string', required: false, description: 'Override the template name' },
])

registerSchema('template', 'apply-folder', 'Create a folder from a folder template', [
  { flag: '--space-id', type: 'string', required: true, description: 'Space to create the folder in' },
  { flag: '--template-id', type: 'string', required: true, description: 'Template ID to apply' },
  { flag: '--name', type: 'string', required: false, description: 'Override the template name' },
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
    .description('Create a task from a task template')
    .requiredOption('--list-id <id>', 'List to create the task in')
    .requiredOption('--template-id <id>', 'Template ID to apply')
    .option('--name <name>', 'Override the template name')
    .action(async (opts: { listId: string; templateId: string; name?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      const data = await client.post<ApplyTaskResponse>(
        `/list/${opts.listId}/taskTemplate/${opts.templateId}`,
        body,
      )
      formatOutput([data], TEMPLATE_COLUMNS, getOutputOptions(program))
    })

  template
    .command('apply-list')
    .description('Create a list from a list template')
    .requiredOption('--template-id <id>', 'Template ID to apply')
    .option('--folder-id <id>', 'Folder to create the list in')
    .option('--space-id <id>', 'Space to create the list in (folderless)')
    .option('--name <name>', 'Override the template name')
    .action(async (opts: { templateId: string; folderId?: string; spaceId?: string; name?: string }) => {
      if (!opts.folderId && !opts.spaceId) {
        process.stderr.write('Error: Provide either --folder-id or --space-id\n')
        process.exit(2)
        return
      }
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      const path = opts.folderId
        ? `/folder/${opts.folderId}/listTemplate/${opts.templateId}`
        : `/space/${opts.spaceId}/listTemplate/${opts.templateId}`
      const data = await client.post<ApplyListResponse>(path, body)
      formatOutput([data], TEMPLATE_COLUMNS, getOutputOptions(program))
    })

  template
    .command('apply-folder')
    .description('Create a folder from a folder template')
    .requiredOption('--space-id <id>', 'Space to create the folder in')
    .requiredOption('--template-id <id>', 'Template ID to apply')
    .option('--name <name>', 'Override the template name')
    .action(async (opts: { spaceId: string; templateId: string; name?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      const data = await client.post<ApplyFolderResponse>(
        `/space/${opts.spaceId}/folderTemplate/${opts.templateId}`,
        body,
      )
      formatOutput([data], TEMPLATE_COLUMNS, getOutputOptions(program))
    })
}
