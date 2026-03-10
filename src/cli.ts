import { Command } from 'commander'
import { ClickUpClient } from './client.js'
import { resolveToken, resolveOutputFormat } from './config.js'
import { ClickUpError, EXIT_AUTH_FAILURE, EXIT_GENERAL } from './errors.js'
import { registerAuthCommands } from './commands/auth-cmd.js'
import { registerConfigCommands } from './commands/config-cmd.js'

export function createProgram(): Command {
  const program = new Command()

  program
    .name('clickup')
    .description('Comprehensive CLI for the ClickUp API v2')
    .version('0.1.0')
    .option('--token <token>', 'Override auth token for this invocation')
    .option('--workspace-id <id>', 'Override default workspace')
    .option('--format <format>', 'Output format (table|json|csv|tsv|quiet|id)')
    .option('--no-color', 'Disable colors')
    .option('--verbose', 'Show request URL, method, status, timing')
    .option('--dry-run', 'Print what would be sent, do not execute')
    .option('--debug', 'Full debug output')

  // Auth commands do not require a token
  registerAuthCommands(program)
  registerConfigCommands(program)

  // Hook: create client for commands that need it
  program.hook('preAction', (_thisCommand, actionCommand) => {
    const opts = program.opts()

    // Skip client creation for auth and config commands
    // Walk up parent chain to find the top-level subcommand
    let cmd: Command = actionCommand
    while (cmd.parent && cmd.parent !== program) {
      cmd = cmd.parent
    }
    const topLevelName = cmd.name()
    if (topLevelName === 'auth' || topLevelName === 'config') return

    const token = resolveToken(opts.token)
    if (!token) {
      process.stderr.write('No authentication token found. Run: clickup auth login\n')
      process.exit(EXIT_AUTH_FAILURE)
    }

    const client = new ClickUpClient({
      token,
      verbose: opts.verbose,
      debug: opts.debug,
      dryRun: opts.dryRun,
    })

    // Attach client to the program for commands to use
    ;(program as unknown as Record<string, unknown>).__client = client
  })

  return program
}

export function getClient(program: Command): ClickUpClient {
  return (program as unknown as Record<string, unknown>).__client as ClickUpClient
}

export async function run(argv?: string[]): Promise<void> {
  const program = createProgram()

  program.exitOverride()

  try {
    await program.parseAsync(argv ?? process.argv)
  } catch (error) {
    if (error instanceof ClickUpError) {
      process.stderr.write(`Error: ${error.message}\n`)
      process.exit(error.exitCode)
    }
    // Commander exit override throws on --help / --version
    if (
      error instanceof Error &&
      'exitCode' in error &&
      (error as { exitCode: number }).exitCode === 0
    ) {
      process.exit(0)
    }
    if (error instanceof Error) {
      process.stderr.write(`Error: ${error.message}\n`)
    }
    process.exit(EXIT_GENERAL)
  }
}
