import { Command } from 'commander'
import { getConfig, resolveToken } from '../config.js'
import { ClickUpClient } from '../client.js'
import { ClickUpError } from '../errors.js'

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Manage authentication')

  auth
    .command('login')
    .description('Authenticate with ClickUp')
    .option('--token <token>', 'Personal API token')
    .action(async (opts, cmd) => {
      // Check both local option and parent's global --token option
      let token = opts.token ?? cmd.parent?.parent?.opts()?.token

      if (!token) {
        if (process.stdin.isTTY) {
          const { password } = await import('@inquirer/prompts')
          token = await password({
            message: 'Enter your ClickUp API token:',
          })
        } else {
          process.stderr.write(
            'Error: --token is required in non-interactive mode\n',
          )
          process.exit(2)
        }
      }

      if (!token) {
        process.stderr.write('Error: No token provided\n')
        process.exit(2)
      }

      // Validate token by calling GET /user
      process.stderr.write('Validating token...\n')
      const client = new ClickUpClient({ token })
      try {
        const result = await client.get<{ user: { username: string; email: string } }>('/user')
        getConfig().set('token', token)
        process.stderr.write(
          `Authenticated as ${result.user.username} (${result.user.email})\n`,
        )
        process.stderr.write('Token saved to config.\n')
      } catch (error) {
        if (error instanceof ClickUpError) {
          process.stderr.write(`Authentication failed: ${error.message}\n`)
          process.exit(3)
        }
        throw error
      }
    })

  auth
    .command('logout')
    .description('Remove stored authentication token')
    .action(() => {
      const config = getConfig()
      config.delete('token')
      process.stderr.write('Token removed from config.\n')
    })

  auth
    .command('status')
    .description('Show current authentication state')
    .action(async () => {
      const token = resolveToken()

      if (!token) {
        process.stdout.write('Not authenticated. Run: clickup auth login\n')
        return
      }

      const source = process.env.CLICKUP_API_TOKEN
        ? 'environment variable'
        : getConfig().get('token')
          ? 'stored config'
          : 'unknown'

      const prefix = token.slice(0, 8) + '...'
      process.stdout.write(`Token: ${prefix}\n`)
      process.stdout.write(`Source: ${source}\n`)

      // Try to fetch user info
      try {
        const client = new ClickUpClient({ token })
        const result = await client.get<{ user: { username: string; email: string; id: number } }>('/user')
        process.stdout.write(`User: ${result.user.username}\n`)
        process.stdout.write(`Email: ${result.user.email}\n`)
        process.stdout.write(`User ID: ${result.user.id}\n`)
      } catch {
        process.stdout.write('Could not fetch user info (token may be invalid)\n')
      }
    })

  auth
    .command('token')
    .description('Print current token to stdout')
    .action(() => {
      const token = resolveToken()
      if (!token) {
        process.stderr.write('No authentication token found. Run: clickup auth login\n')
        process.exit(3)
      }
      process.stdout.write(token + '\n')
    })
}
