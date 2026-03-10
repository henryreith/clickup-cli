import { Command } from 'commander'
import { formatOutput, type ColumnDef } from '../output.js'
import { getOutputOptions } from '../cli.js'
import { getResources, getActions, getFields } from '../schema.js'

const RESOURCE_COLUMNS: ColumnDef[] = [
  { key: 'resource', header: 'Resource', width: 20 },
  { key: 'actions', header: 'Actions', width: 50 },
]

const ACTION_COLUMNS: ColumnDef[] = [
  { key: 'action', header: 'Action', width: 15 },
  { key: 'description', header: 'Description', width: 50 },
]

const FIELD_COLUMNS: ColumnDef[] = [
  { key: 'flag', header: 'Flag', width: 25 },
  { key: 'type', header: 'Type', width: 12 },
  { key: 'required_label', header: 'Required', width: 10 },
  { key: 'description', header: 'Description', width: 40 },
]

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function registerSchemaCommands(program: Command): void {
  program
    .command('schema')
    .description('Discover available resources, actions, and fields')
    .argument('[query]', 'Resource or resource.action (e.g. "task" or "task.create")')
    .action((query?: string) => {
      const outputOpts = getOutputOptions(program)

      if (!query) {
        const resources = getResources()
        const rows = resources.map((r) => {
          const actions = getActions(r)
          return {
            resource: r,
            actions: actions ? actions.map((a) => a.action).join(', ') : '',
          }
        })
        formatOutput(rows, RESOURCE_COLUMNS, outputOpts)
        return
      }

      const dotIndex = query.indexOf('.')
      if (dotIndex === -1) {
        const actions = getActions(query)
        if (!actions) {
          process.stderr.write(`Error: Unknown resource "${query}". Run: clickup schema\n`)
          process.exit(2)
          return
        }
        formatOutput(actions, ACTION_COLUMNS, outputOpts)
        return
      }

      const resource = query.slice(0, dotIndex)
      const action = query.slice(dotIndex + 1)
      const actionDef = getFields(resource, action)
      if (!actionDef) {
        process.stderr.write(`Error: Unknown action "${query}". Run: clickup schema ${resource}\n`)
        process.exit(2)
        return
      }

      const format = outputOpts.format ?? (process.stdout.isTTY ? 'table' : 'json')

      if (format === 'json') {
        const jsonOutput = {
          resource,
          action,
          required: actionDef.fields.filter((f) => f.required).map(({ flag, type, description }) => ({ flag, type, description })),
          optional: actionDef.fields.filter((f) => !f.required).map(({ flag, type, description }) => ({ flag, type, description })),
        }
        process.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n')
        return
      }

      process.stdout.write(`${capitalize(resource)} > ${capitalize(action)}\n\n`)
      const rows = actionDef.fields.map((f) => ({
        ...f,
        required_label: f.required ? 'yes' : '',
      }))
      formatOutput(rows, FIELD_COLUMNS, outputOpts)
    })
}
