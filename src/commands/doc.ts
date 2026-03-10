import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { resolveWorkspaceId } from '../config.js'
import { registerSchema } from '../schema.js'
import type { DocListResponse, Doc, PageListResponse, Page } from '../types/doc.js'

const DOC_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 15 },
  { key: 'name', header: 'Name', width: 35 },
  { key: 'date_created', header: 'Created', width: 15 },
  { key: 'date_updated', header: 'Updated', width: 15 },
]

const PAGE_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 15 },
  { key: 'name', header: 'Name', width: 35 },
  { key: 'parent_page', header: 'Parent', width: 15 },
  { key: 'date_created', header: 'Created', width: 15 },
]

registerSchema('doc', 'list', 'List docs in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
])

registerSchema('doc', 'get', 'Get a doc by ID', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--doc-id', type: 'string', required: true, description: 'Doc ID' },
])

registerSchema('doc', 'create', 'Create a doc', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--name', type: 'string', required: true, description: 'Doc name' },
  { flag: '--parent-id', type: 'string', required: false, description: 'Parent ID (space, folder, list, or task)' },
  { flag: '--parent-type', type: 'number', required: false, description: 'Parent type (4=space, 5=folder, 6=list, 7=task)' },
  { flag: '--visibility', type: 'string', required: false, description: 'Visibility (private, workspace)' },
])

registerSchema('doc', 'update', 'Update a doc', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--doc-id', type: 'string', required: true, description: 'Doc ID' },
  { flag: '--name', type: 'string', required: false, description: 'New doc name' },
])

registerSchema('doc', 'delete', 'Delete a doc', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--doc-id', type: 'string', required: true, description: 'Doc ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

registerSchema('doc', 'search', 'Search docs in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--query', type: 'string', required: true, description: 'Search query' },
])

registerSchema('doc', 'pages', 'List pages in a doc', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--doc-id', type: 'string', required: true, description: 'Doc ID' },
])

registerSchema('doc', 'page-get', 'Get a page from a doc', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--doc-id', type: 'string', required: true, description: 'Doc ID' },
  { flag: '--page-id', type: 'string', required: true, description: 'Page ID' },
])

registerSchema('doc', 'page-create', 'Create a page in a doc', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--doc-id', type: 'string', required: true, description: 'Doc ID' },
  { flag: '--name', type: 'string', required: true, description: 'Page name' },
  { flag: '--content', type: 'string', required: false, description: 'Page content (markdown)' },
  { flag: '--parent-page-id', type: 'string', required: false, description: 'Parent page ID' },
])

registerSchema('doc', 'page-update', 'Update a page in a doc', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--doc-id', type: 'string', required: true, description: 'Doc ID' },
  { flag: '--page-id', type: 'string', required: true, description: 'Page ID' },
  { flag: '--name', type: 'string', required: false, description: 'New page name' },
  { flag: '--content', type: 'string', required: false, description: 'New page content (markdown)' },
])

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

export function registerDocCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const doc = program.command('doc').description('Manage docs and pages')

  doc
    .command('list')
    .description('List docs in a workspace')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<DocListResponse>(`/v3/workspaces/${workspaceId}/docs`)
      formatOutput(data.docs, DOC_COLUMNS, getOutputOptions(program))
    })

  doc
    .command('get')
    .description('Get a doc by ID')
    .requiredOption('--doc-id <id>', 'Doc ID')
    .action(async (opts: { docId: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<Doc>(`/v3/workspaces/${workspaceId}/docs/${opts.docId}`)
      formatOutput(data, DOC_COLUMNS, getOutputOptions(program))
    })

  doc
    .command('create')
    .description('Create a doc')
    .requiredOption('--name <name>', 'Doc name')
    .option('--parent-id <id>', 'Parent ID')
    .option('--parent-type <type>', 'Parent type (4=space, 5=folder, 6=list, 7=task)', parseInt)
    .option('--visibility <visibility>', 'Visibility (private, workspace)')
    .action(async (opts: { name: string; parentId?: string; parentType?: number; visibility?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.parentId) {
        body['parent'] = { id: opts.parentId, type: opts.parentType ?? 4 }
      }
      if (opts.visibility) body['visibility'] = opts.visibility
      const data = await client.post<Doc>(`/v3/workspaces/${workspaceId}/docs`, body)
      formatOutput(data, DOC_COLUMNS, getOutputOptions(program))
    })

  doc
    .command('update')
    .description('Update a doc')
    .requiredOption('--doc-id <id>', 'Doc ID')
    .option('--name <name>', 'New name')
    .action(async (opts: { docId: string; name?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name) body['name'] = opts.name
      const data = await client.put<Doc>(`/v3/workspaces/${workspaceId}/docs/${opts.docId}`, body)
      formatOutput(data, DOC_COLUMNS, getOutputOptions(program))
    })

  doc
    .command('delete')
    .description('Delete a doc')
    .requiredOption('--doc-id <id>', 'Doc ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (opts: { docId: string; confirm?: boolean }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return

      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete doc ${opts.docId}?` })
        if (!yes) {
          process.stderr.write('Cancelled.\n')
          return
        }
      }

      const client = getClient()
      await client.delete(`/v3/workspaces/${workspaceId}/docs/${opts.docId}`)
      process.stdout.write(`Doc ${opts.docId} deleted.\n`)
    })

  doc
    .command('search')
    .description('Search docs in a workspace')
    .requiredOption('--query <text>', 'Search query')
    .action(async (opts: { query: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<DocListResponse>(`/v3/workspaces/${workspaceId}/docs`, {
        query: opts.query,
      })
      formatOutput(data.docs, DOC_COLUMNS, getOutputOptions(program))
    })

  doc
    .command('pages')
    .description('List pages in a doc')
    .requiredOption('--doc-id <id>', 'Doc ID')
    .action(async (opts: { docId: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<PageListResponse>(
        `/v3/workspaces/${workspaceId}/docs/${opts.docId}/pages`,
      )
      formatOutput(data.pages, PAGE_COLUMNS, getOutputOptions(program))
    })

  doc
    .command('page-get')
    .description('Get a page from a doc')
    .requiredOption('--doc-id <id>', 'Doc ID')
    .requiredOption('--page-id <id>', 'Page ID')
    .action(async (opts: { docId: string; pageId: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<Page>(
        `/v3/workspaces/${workspaceId}/docs/${opts.docId}/pages/${opts.pageId}`,
      )
      formatOutput(data, PAGE_COLUMNS, getOutputOptions(program))
    })

  doc
    .command('page-create')
    .description('Create a page in a doc')
    .requiredOption('--doc-id <id>', 'Doc ID')
    .requiredOption('--name <name>', 'Page name')
    .option('--content <text>', 'Page content (markdown)')
    .option('--parent-page-id <id>', 'Parent page ID')
    .action(async (opts: { docId: string; name: string; content?: string; parentPageId?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.content) body['content'] = opts.content
      if (opts.parentPageId) body['parent_page'] = opts.parentPageId
      const data = await client.post<Page>(
        `/v3/workspaces/${workspaceId}/docs/${opts.docId}/pages`,
        body,
      )
      formatOutput(data, PAGE_COLUMNS, getOutputOptions(program))
    })

  doc
    .command('page-update')
    .description('Update a page in a doc')
    .requiredOption('--doc-id <id>', 'Doc ID')
    .requiredOption('--page-id <id>', 'Page ID')
    .option('--name <name>', 'New name')
    .option('--content <text>', 'New content (markdown)')
    .action(async (opts: { docId: string; pageId: string; name?: string; content?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name) body['name'] = opts.name
      if (opts.content) body['content'] = opts.content
      const data = await client.put<Page>(
        `/v3/workspaces/${workspaceId}/docs/${opts.docId}/pages/${opts.pageId}`,
        body,
      )
      formatOutput(data, PAGE_COLUMNS, getOutputOptions(program))
    })
}
