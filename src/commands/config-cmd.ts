import { Command } from 'commander'
import { config, isValidConfigKey, VALID_CONFIG_KEYS } from '../config.js'

export function registerConfigCommands(program: Command): void {
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

      // Type coercion for non-string values
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
}
