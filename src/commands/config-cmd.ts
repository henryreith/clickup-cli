import { Command } from 'commander'
import { getConfig, isValidConfigKey } from '../config.js'

export function registerConfigCommands(program: Command): void {
  const config = program.command('config').description('Manage CLI configuration')

  config
    .command('set')
    .description('Set a config value')
    .argument('<key>', 'Config key')
    .argument('<value>', 'Config value')
    .action((key: string, value: string) => {
      if (!isValidConfigKey(key)) {
        process.stderr.write(
          `Error: Unknown config key "${key}". Valid keys: token, workspace_id, output_format, color, page_size, timezone\n`,
        )
        process.exit(2)
      }

      const conf = getConfig()

      // Type coercion for specific keys
      if (key === 'color') {
        conf.set(key, value === 'true' || value === '1')
      } else if (key === 'page_size') {
        const num = parseInt(value, 10)
        if (isNaN(num) || num <= 0) {
          process.stderr.write('Error: page_size must be a positive integer\n')
          process.exit(2)
        }
        conf.set(key, num)
      } else {
        conf.set(key, value)
      }

      process.stdout.write(`Set ${key} = ${value}\n`)
    })

  config
    .command('get')
    .description('Get a config value')
    .argument('<key>', 'Config key')
    .action((key: string) => {
      if (!isValidConfigKey(key)) {
        process.stderr.write(
          `Error: Unknown config key "${key}". Valid keys: token, workspace_id, output_format, color, page_size, timezone\n`,
        )
        process.exit(2)
      }

      const value = getConfig().get(key)
      if (value === undefined) {
        process.stdout.write('(not set)\n')
      } else {
        process.stdout.write(String(value) + '\n')
      }
    })

  config
    .command('list')
    .description('Show all config values')
    .action(() => {
      const conf = getConfig()
      const store = conf.store
      const entries = Object.entries(store)
      if (entries.length === 0) {
        process.stdout.write('No config values set.\n')
        return
      }
      for (const [key, value] of entries) {
        const displayValue =
          key === 'token' && typeof value === 'string'
            ? value.slice(0, 8) + '...'
            : String(value)
        process.stdout.write(`${key} = ${displayValue}\n`)
      }
    })

  config
    .command('unset')
    .description('Remove a config value')
    .argument('<key>', 'Config key')
    .action((key: string) => {
      if (!isValidConfigKey(key)) {
        process.stderr.write(
          `Error: Unknown config key "${key}". Valid keys: token, workspace_id, output_format, color, page_size, timezone\n`,
        )
        process.exit(2)
      }
      getConfig().delete(key)
      process.stdout.write(`Unset ${key}\n`)
    })

  config
    .command('path')
    .description('Print path to config file')
    .action(() => {
      process.stdout.write(getConfig().path + '\n')
    })
}
