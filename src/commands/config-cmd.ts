import { Command } from 'commander'
import {
  config,
  isValidConfigKey,
  VALID_CONFIG_KEYS,
  getProfiles,
  setProfile,
  deleteProfile,
  findProfileKey,
  getActiveProfileKey,
} from '../config.js'
import type { ClickUpClient } from '../client.js'

export function registerConfigCommands(program: Command, getClient: () => ClickUpClient): void {
  const configCmd = program.command('config').description('Manage CLI configuration')

  configCmd
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Config key')
    .argument('<value>', 'Config value')
    .action((key: string, value: string) => {
      if (!isValidConfigKey(key)) {
        process.stderr.write(`Error: Unknown config key "${key}". Valid keys: ${VALID_CONFIG_KEYS.join(', ')}\n`)
        process.exit(2)
        return
      }

      if (key === 'color') {
        config.set(key, value === 'true' || value === '1')
      } else if (key === 'page_size') {
        const num = parseInt(value, 10)
        if (isNaN(num) || num <= 0) {
          process.stderr.write('Error: page_size must be a positive number.\n')
          process.exit(2)
          return
        }
        config.set(key, num)
      } else {
        config.set(key, value)
      }

      process.stdout.write(`Set ${key} = ${value}\n`)
    })

  configCmd
    .command('get')
    .description('Get a configuration value')
    .argument('<key>', 'Config key')
    .action((key: string) => {
      if (!isValidConfigKey(key)) {
        process.stderr.write(`Error: Unknown config key "${key}". Valid keys: ${VALID_CONFIG_KEYS.join(', ')}\n`)
        process.exit(2)
        return
      }

      const value = config.get(key)
      if (value === undefined) {
        process.stdout.write('(not set)\n')
      } else {
        process.stdout.write(`${value}\n`)
      }
    })

  configCmd
    .command('list')
    .description('List all configuration values')
    .action(() => {
      const store = config.store
      const keys = VALID_CONFIG_KEYS

      for (const key of keys) {
        const value = store[key]
        if (value !== undefined) {
          process.stdout.write(`${key} = ${value}\n`)
        }
      }
    })

  configCmd
    .command('reset')
    .description('Reset all configuration to defaults')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (opts: { confirm?: boolean }) => {
      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Add --confirm to proceed with this destructive action.\n')
          process.exit(2)
          return
        }

        const { confirm } = await import('@inquirer/prompts')
        const answer = await confirm({
          message: 'Reset all configuration to defaults?',
          default: false,
        })

        if (!answer) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }

      config.clear()
      process.stdout.write('Configuration reset to defaults.\n')
    })

  configCmd
    .command('path')
    .description('Print the config file path')
    .action(() => {
      process.stdout.write(config.path + '\n')
    })

  configCmd
    .command('validate')
    .description('Verify the stored token works and show current identity')
    .action(async () => {
      const client = getClient()

      let user: { username: string; email: string } | undefined
      try {
        const userData = await client.get<{ user: { username: string; email: string } }>('/user')
        user = userData.user
      } catch (err) {
        process.stderr.write(`Error: Token validation failed. Run: clickup auth login\n`)
        process.exit(3)
        return
      }

      let workspaceName = '(none)'
      let workspaceId = '(none)'
      try {
        const teamsData = await client.get<{ teams: Array<{ id: string; name: string }> }>('/team')
        const activeKey = getActiveProfileKey()
        const profiles = getProfiles()
        const activeProfile = profiles[activeKey]
        if (activeProfile?.workspace_id) {
          const match = teamsData.teams.find((t) => t.id === activeProfile.workspace_id)
          workspaceName = match?.name ?? activeProfile.workspace_name ?? activeProfile.workspace_id
          workspaceId = activeProfile.workspace_id
        } else if (teamsData.teams.length > 0) {
          workspaceName = teamsData.teams.map((t) => t.name).join(', ')
          workspaceId = teamsData.teams.map((t) => t.id).join(', ')
        }
      } catch {
        // Token valid but workspace lookup failed
      }

      process.stdout.write(`User:             ${user.username} (${user.email})\n`)
      process.stdout.write(`Active profile:   ${getActiveProfileKey()}\n`)
      process.stdout.write(`Workspace:        ${workspaceName}\n`)
      process.stdout.write(`Workspace ID:     ${workspaceId}\n`)
      process.stdout.write(`Token status:     Valid\n`)
    })

  // config profile subcommands
  const profileCmd = configCmd.command('profile').description('Manage named profiles')

  profileCmd
    .command('list')
    .description('List all profiles')
    .action(() => {
      const profiles = getProfiles()
      const activeKey = getActiveProfileKey()
      const keys = Object.keys(profiles)

      if (keys.length === 0) {
        process.stdout.write('No profiles configured. Run: clickup auth login\n')
        return
      }

      // Print table header
      const col = (s: string, w: number) => s.padEnd(w).slice(0, w)
      process.stdout.write(
        `${col('Key', 20)} ${col('Workspace Name', 30)} ${col('Nickname', 15)} ${col('Workspace ID', 16)} Active\n`,
      )
      process.stdout.write(`${'-'.repeat(20)} ${'-'.repeat(30)} ${'-'.repeat(15)} ${'-'.repeat(16)} ------\n`)

      for (const key of keys) {
        const p = profiles[key]!
        const active = key === activeKey ? '*' : ''
        process.stdout.write(
          `${col(key, 20)} ${col(p.workspace_name ?? '', 30)} ${col(p.nickname ?? '', 15)} ${col(p.workspace_id ?? '', 16)} ${active}\n`,
        )
      }
    })

  profileCmd
    .command('create')
    .description('Create an empty profile')
    .argument('<key>', 'Profile key')
    .action((key: string) => {
      const profiles = getProfiles()
      if (profiles[key]) {
        process.stderr.write(`Error: Profile "${key}" already exists.\n`)
        process.exit(2)
        return
      }
      setProfile(key, {})
      process.stdout.write(`Profile "${key}" created.\n`)
    })

  profileCmd
    .command('delete')
    .description('Delete a profile')
    .argument('<key>', 'Profile key')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (key: string, opts: { confirm?: boolean }) => {
      const profiles = getProfiles()
      if (!profiles[key]) {
        process.stderr.write(`Error: Profile "${key}" not found.\n`)
        process.exit(2)
        return
      }

      const isActive = key === getActiveProfileKey()

      if (!opts.confirm) {
        if (!process.stdin.isTTY) {
          process.stderr.write('Error: Add --confirm to delete a profile in non-interactive mode.\n')
          process.exit(2)
          return
        }
        const { confirm } = await import('@inquirer/prompts')
        const answer = await confirm({
          message: isActive
            ? `"${key}" is the active profile. Delete it?`
            : `Delete profile "${key}"?`,
          default: false,
        })
        if (!answer) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }

      deleteProfile(key)
      if (isActive) {
        config.delete('active_profile' as never)
      }
      process.stdout.write(`Profile "${key}" deleted.\n`)
    })

  profileCmd
    .command('use')
    .description('Switch the active profile')
    .argument('<key>', 'Profile key, workspace name, or nickname')
    .action((nameOrKey: string) => {
      const profiles = getProfiles()
      const resolvedKey = findProfileKey(nameOrKey)
      if (!profiles[resolvedKey]) {
        process.stderr.write(`Error: Profile "${nameOrKey}" not found.\n`)
        process.exit(2)
        return
      }
      config.set('active_profile', resolvedKey)
      process.stdout.write(`Active profile: ${resolvedKey}\n`)
    })

  profileCmd
    .command('nickname')
    .description('Set a short nickname for a profile')
    .argument('<key>', 'Profile key')
    .argument('<nickname>', 'Short nickname')
    .action((key: string, nickname: string) => {
      const profiles = getProfiles()
      const profile = profiles[key]
      if (!profile) {
        process.stderr.write(`Error: Profile "${key}" not found.\n`)
        process.exit(2)
        return
      }
      setProfile(key, { ...profile, nickname })
      process.stdout.write(`Nickname "${nickname}" set for profile "${key}".\n`)
    })
}
