import { Command } from 'commander'
import { ClickUpClient, type ClickUpClientOptions } from './client.js'
import { ClickUpError, mapToExitCode, EXIT_CODES } from './errors.js'
import { resolveToken, resolveOutputFormat } from './config.js'
import type { OutputOptions } from './output.js'
import { registerAuthCommands } from './commands/auth-cmd.js'
import { registerConfigCommands } from './commands/config-cmd.js'

const VERSION = '0.1.0'

export function createProgram(): Command {
  const program = new Command()

  program
    .name('clickup')
    .description('ClickUp CLI - Manage ClickUp workspaces from the terminal')
    .version(VERSION)
    .option('--token <token>', 'API token')
    .option('--workspace-id <id>', 'Workspace ID')
    .option('--format <format>', 'Output format (table|json|csv|tsv|quiet|id)')
    .option('--no-color', 'Disable colors')
    .option('--no-header', 'Omit column headers')
    .option('--fields <fields>', 'Show only specified fields (comma-separated)')
    .option('--filter <filter>', 'Client-side filter (key=value)')
    .option('--sort <sort>', 'Sort by field (field[:asc|:desc])')
    .option('--limit <n>', 'Limit results', parseInt)
    .option('--verbose', 'Show request details')
    .option('--debug', 'Full debug output')
    .option('--dry-run', 'Print what would be sent without executing')

  return program
}

function createClient(program: Command): ClickUpClient {
  const globalOpts = program.opts()
  const token = resolveToken(globalOpts['token'] as string | undefined)

  if (!token) {
    process.stderr.write('Error: No API token found. Run: clickup auth login\n')
    process.exit(EXIT_CODES.AUTH_FAILURE)
  }

  const clientOpts: ClickUpClientOptions = { token }
  if (globalOpts['verbose']) clientOpts.verbose = true
  if (globalOpts['debug']) clientOpts.debug = true
  if (globalOpts['dryRun']) clientOpts.dryRun = true

  return new ClickUpClient(clientOpts)
}

export function getOutputOptions(program: Command): OutputOptions {
  const opts = program.opts()
  const result: OutputOptions = {
    format: resolveOutputFormat(opts['format'] as string | undefined),
    noHeader: opts['header'] === false,
    noColor: opts['color'] === false,
  }
  const fields = opts['fields'] as string | undefined
  if (fields) result.fields = fields
  const sort = opts['sort'] as string | undefined
  if (sort) result.sort = sort
  const limit = opts['limit'] as number | undefined
  if (limit !== undefined) result.limit = limit
  const filter = opts['filter'] as string | undefined
  if (filter) result.filter = filter
  return result
}

export function run(): void {
  const program = createProgram()

  registerAuthCommands(program, () => createClient(program))
  registerConfigCommands(program)

  program.parseAsync(process.argv).catch((error: unknown) => {
    if (error instanceof ClickUpError) {
      process.stderr.write(`Error: ${error.message}\n`)
      process.exit(mapToExitCode(error))
    }

    if (error instanceof Error) {
      process.stderr.write(`Error: ${error.message}\n`)
    } else {
      process.stderr.write(`Error: ${String(error)}\n`)
    }

    process.exit(EXIT_CODES.GENERAL_ERROR)
  })
}
