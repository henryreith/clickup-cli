import { Command } from 'commander'
import { config, resolveToken } from '../config.js'
import type { ClickUpClient } from '../client.js'

export function registerAuthCommands(
  program: Command,
  getClient: () => ClickUpClient,
): void {
  const auth = program.command('auth').description('Manage authentication')

  auth
    .command('login')
    .description('Authenticate with ClickUp')
    .option('--token <token>', 'Personal API token')
    .action(async (opts: { token?: string }) => {
      let token = opts.token

      if (!token) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: No token provided. Use --token <token> in non-interactive mode.\n')
          process.exit(2)
          return
        }

        const { password } = await import('@inquirer/prompts')
        token = await password({
          message: 'Enter your ClickUp API token:',
          mask: '*',
        })
      }

      if (!token) {
        process.stderr.write('Error: No token provided.\n')
        process.exit(2)
        return
      }

      // Validate token by calling GET /user
      const { ClickUpClient: ClientClass } = await import('../client.js')
      const client = new ClientClass({ token })

      try {
        const userData = await client.get<{ user: { username: string; email: string } }>('/user')
        config.set('token', token)
        process.stdout.write(`Authenticated as ${userData.user.username} (${userData.user.email})\n`)
      } catch {
        process.stderr.write('Error: Invalid token. Authentication failed.\n')
        process.exit(3)
      }
    })

  auth
    .command('logout')
    .description('Remove stored credentials')
    .action(() => {
      config.delete('token')
      process.stdout.write('Logged out. Token removed.\n')
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

      const prefix = token.slice(0, 8)
      process.stdout.write(`Token: ${prefix}...\n`)

      const workspaceId = config.get('workspace_id')
      if (workspaceId) {
        process.stdout.write(`Workspace: ${workspaceId}\n`)
      }

      // Validate token
      try {
        const client = getClient()
        const userData = await client.get<{ user: { username: string; email: string } }>('/user')
        process.stdout.write(`User: ${userData.user.username} (${userData.user.email})\n`)
        process.stdout.write('Status: Valid\n')
      } catch {
        process.stdout.write('Status: Invalid or expired\n')
      }
    })

  auth
    .command('token')
    .description('Print current token to stdout')
    .action(() => {
      const token = resolveToken()

      if (!token) {
        process.stderr.write('Error: No token found. Run: clickup auth login\n')
        process.exit(3)
        return
      }

      process.stdout.write(token + '\n')
    })
}
