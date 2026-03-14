import { readFileSync } from 'node:fs'
import { Command } from 'commander'
import {
  config,
  resolveToken,
  getProfiles,
  setProfile,
  getActiveProfileKey,
  slugifyWorkspaceName,
} from '../config.js'
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
    .option('--token-file <path>', 'Read token from this file path')
    .option('--oauth', 'Use OAuth2 PKCE browser flow (requires CLICKUP_CLIENT_ID and CLICKUP_CLIENT_SECRET)')
    .action(async (opts: { token?: string; tokenFile?: string; oauth?: boolean }) => {
      if (opts.oauth) {
        const { oauthLogin } = await import('../auth.js')
        const token = await oauthLogin()

        const { ClickUpClient: ClientClass } = await import('../client.js')
        const client = new ClientClass({ token })
        try {
          const userData = await client.get<{ user: { username: string; email: string } }>('/user')
          process.stdout.write(`Authenticated as ${userData.user.username} (${userData.user.email})\n`)
        } catch {
          process.stderr.write('Warning: Token obtained but validation failed.\n')
        }
        return
      }

      let token = opts.token

      // --token-file support
      if (!token && opts.tokenFile) {
        try {
          token = readFileSync(opts.tokenFile, 'utf8').trim()
        } catch {
          process.stderr.write(`Error: Could not read token file: ${opts.tokenFile}\n`)
          process.exit(2)
          return
        }
      }

      if (!token) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: No token provided. Use --token <token>, --token-file <path>, or --oauth in non-interactive mode.\n')
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

        // Store in active profile
        const profileKey = getActiveProfileKey()
        const profiles = getProfiles()
        const existing = profiles[profileKey] ?? {}
        setProfile(profileKey, { ...existing, token })

        process.stdout.write(`Authenticated as ${userData.user.username} (${userData.user.email})\n`)

        // Hint about workspace setup if no workspace configured
        const profile = getProfiles()[profileKey]
        if (!profile?.workspace_id) {
          process.stdout.write('Run: clickup workspace setup -- to configure your workspace.\n')
        }
      } catch {
        process.stderr.write('Error: Invalid token. Authentication failed.\n')
        process.exit(3)
      }
    })

  auth
    .command('logout')
    .description('Remove stored credentials')
    .action(() => {
      const profileKey = getActiveProfileKey()
      const profiles = getProfiles()
      const existing = profiles[profileKey]
      if (existing) {
        const { token: _removed, ...profileWithoutToken } = existing
        setProfile(profileKey, profileWithoutToken)
      }
      // Also clear legacy flat key
      config.delete('token' as never)
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

      const profileKey = getActiveProfileKey()
      process.stdout.write(`Profile: ${profileKey}\n`)

      const profiles = getProfiles()
      const activeProfile = profiles[profileKey]
      if (activeProfile?.workspace_id) {
        process.stdout.write(`Workspace: ${activeProfile.workspace_name ?? activeProfile.workspace_id}\n`)
      } else {
        const legacyId = config.get('workspace_id') as string | undefined
        if (legacyId) process.stdout.write(`Workspace: ${legacyId}\n`)
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
