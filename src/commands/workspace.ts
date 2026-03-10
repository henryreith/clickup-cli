import { Command } from 'commander'
import type { ClickUpClient } from '../client.js'
import { resolveWorkspaceId } from '../config.js'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import type { WorkspaceListResponse, Seats, Plan } from '../types/workspace.js'

const WORKSPACE_COLUMNS: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 14 },
  { key: 'name', header: 'Name', width: 30 },
  { key: 'color', header: 'Color', width: 10 },
  { key: 'member_count', header: 'Members', width: 10 },
]

const SEAT_COLUMNS: ColumnDef[] = [
  { key: 'type', header: 'Type', width: 12 },
  { key: 'filled', header: 'Filled', width: 10 },
  { key: 'total', header: 'Total', width: 10 },
  { key: 'empty', header: 'Empty', width: 10 },
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

export function registerWorkspaceCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const workspace = program.command('workspace').description('Manage workspaces')

  workspace
    .command('list')
    .description('List all workspaces')
    .action(async () => {
      const client = getClient()
      const data = await client.get<WorkspaceListResponse>('/team')
      const rows = data.teams.map((t) => ({
        ...t,
        member_count: t.members?.length ?? 0,
      }))
      formatOutput(rows, WORKSPACE_COLUMNS, getOutputOptions(program))
    })

  workspace
    .command('get')
    .description('Get workspace details')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<{ team: Record<string, unknown> }>(`/team/${workspaceId}`)
      const row = {
        ...data.team,
        member_count: Array.isArray(data.team['members']) ? (data.team['members'] as unknown[]).length : 0,
      }
      formatOutput(row, WORKSPACE_COLUMNS, getOutputOptions(program))
    })

  workspace
    .command('seats')
    .description('Show seat usage')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<Seats>(`/team/${workspaceId}/seats`)
      const rows = []
      if (data.members) {
        rows.push({
          type: 'Members',
          filled: data.members.filled_members_count ?? 0,
          total: data.members.total_member_seats ?? 0,
          empty: data.members.empty_member_seats ?? 0,
        })
      }
      if (data.guests) {
        rows.push({
          type: 'Guests',
          filled: data.guests.filled_guest_count ?? 0,
          total: data.guests.total_guest_seats ?? 0,
          empty: data.guests.empty_guest_seats ?? 0,
        })
      }
      formatOutput(rows, SEAT_COLUMNS, getOutputOptions(program))
    })

  workspace
    .command('plan')
    .description('Show current billing plan')
    .action(async () => {
      const workspaceId = requireWorkspaceId(program)
      if (!workspaceId) return
      const client = getClient()
      const data = await client.get<Plan>(`/team/${workspaceId}/plan`)
      formatOutput(data, [
        { key: 'plan_id', header: 'Plan ID', width: 12 },
        { key: 'plan_name', header: 'Plan', width: 30 },
      ], getOutputOptions(program))
    })
}
