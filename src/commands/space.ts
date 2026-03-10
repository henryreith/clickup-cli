import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { resolveWorkspaceId } from '../config.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { SpaceListResponse } from '../types/space.js'
import { registerSchema } from '../schema.js'

registerSchema('space', 'list', 'List spaces in a workspace', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--archived', type: 'boolean', required: false, description: 'Include archived spaces' },
])

registerSchema('space', 'get', 'Get space details', [
  { flag: '<space-id>', type: 'string', required: true, description: 'Space ID' },
])

registerSchema('space', 'create', 'Create a new space', [
  { flag: '--workspace-id', type: 'string', required: true, description: 'Workspace ID' },
  { flag: '--name', type: 'string', required: true, description: 'Space name' },
  { flag: '--multiple-assignees', type: 'boolean', required: false, description: 'Enable multiple assignees' },
  { flag: '--features', type: 'string', required: false, description: 'Feature flags as JSON' },
])

registerSchema('space', 'update', 'Update a space', [
  { flag: '<space-id>', type: 'string', required: true, description: 'Space ID' },
  { flag: '--name', type: 'string', required: false, description: 'New space name' },
  { flag: '--color', type: 'string', required: false, description: 'Space color' },
  { flag: '--private', type: 'boolean', required: false, description: 'Make space private or public' },
])

registerSchema('space', 'delete', 'Delete a space', [
  { flag: '<space-id>', type: 'string', required: true, description: 'Space ID' },
  { flag: '--confirm', type: 'boolean', required: false, description: 'Skip confirmation prompt' },
])

const SPACE_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 14 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'private', header: 'Private', width: 10 },
  { key: 'color', header: 'Color', width: 10 },
  { key: 'multiple_assignees', header: 'Multi-Assign', width: 14 },
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

export function registerSpaceCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const space = program.command('space').description('Manage spaces')

  space
    .command('list')
    .description('List spaces in a workspace')
    .option('--archived', 'Include archived spaces')
    .action(async (opts: { archived?: boolean }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<SpaceListResponse>(`/team/${workspaceId}/space`, {
        archived: opts.archived ? 'true' : 'false',
      })
      formatOutput(data.spaces, SPACE_COLUMNS, getOutputOptions(program))
    })

  space
    .command('get')
    .description('Get space details')
    .argument('<space-id>', 'Space ID')
    .action(async (spaceId: string) => {
      const client = getClient()
      const data = await client.get<Record<string, unknown>>(`/space/${spaceId}`)
      formatOutput(data, SPACE_COLUMNS, getOutputOptions(program))
    })

  space
    .command('create')
    .description('Create a new space')
    .requiredOption('--name <name>', 'Space name')
    .option('--multiple-assignees', 'Enable multiple assignees')
    .option('--features <json>', 'Feature flags as JSON')
    .action(async (opts: { name: string; multipleAssignees?: boolean; features?: string }) => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const body: Record<string, unknown> = { name: opts.name }
      if (opts.multipleAssignees !== undefined) {
        body['multiple_assignees'] = opts.multipleAssignees
      }
      if (opts.features) {
        body['features'] = JSON.parse(opts.features)
      }
      const data = await client.post<Record<string, unknown>>(`/team/${workspaceId}/space`, body)
      formatOutput(data, SPACE_COLUMNS, getOutputOptions(program))
    })

  space
    .command('update')
    .description('Update a space')
    .argument('<space-id>', 'Space ID')
    .option('--name <name>', 'New space name')
    .option('--color <hex>', 'Space color')
    .option('--private <bool>', 'Make space private or public')
    .action(async (spaceId: string, opts: { name?: string; color?: string; private?: string }) => {
      const client = getClient()
      const body: Record<string, unknown> = {}
      if (opts.name !== undefined) body['name'] = opts.name
      if (opts.color !== undefined) body['color'] = opts.color
      if (opts.private !== undefined) body['admin_can_manage'] = opts.private === 'true'
      const data = await client.put<Record<string, unknown>>(`/space/${spaceId}`, body)
      formatOutput(data, SPACE_COLUMNS, getOutputOptions(program))
    })

  space
    .command('delete')
    .description('Delete a space')
    .argument('<space-id>', 'Space ID')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (spaceId: string, opts: { confirm?: boolean }) => {
      const client = getClient()
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Use --confirm to delete in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const yes = await confirm({ message: `Delete space ${spaceId}?` })
        if (!yes) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }
      await client.delete(`/space/${spaceId}`)
      process.stdout.write(`Deleted space ${spaceId}\n`)
    })
}
