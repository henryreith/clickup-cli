import Conf from 'conf'

export interface ClickUpConfig {
  token?: string
  workspace_id?: string
  output_format?: string
  color?: boolean
  page_size?: number
  timezone?: string
}

const CONFIG_KEYS = [
  'token',
  'workspace_id',
  'output_format',
  'color',
  'page_size',
  'timezone',
] as const

export type ConfigKey = (typeof CONFIG_KEYS)[number]

let configInstance: Conf<ClickUpConfig> | undefined

export function getConfig(): Conf<ClickUpConfig> {
  if (!configInstance) {
    configInstance = new Conf<ClickUpConfig>({
      projectName: 'clickup-cli',
      defaults: {
        output_format: 'table',
        color: true,
        page_size: 100,
      },
    })
  }
  return configInstance
}

export function resetConfigInstance(): void {
  configInstance = undefined
}

export function isValidConfigKey(key: string): key is ConfigKey {
  return (CONFIG_KEYS as readonly string[]).includes(key)
}

export function resolveToken(flagValue?: string): string | undefined {
  if (flagValue) return flagValue
  const envValue = process.env.CLICKUP_API_TOKEN
  if (envValue) return envValue
  return getConfig().get('token')
}

export function resolveWorkspaceId(flagValue?: string): string | undefined {
  if (flagValue) return flagValue
  const envValue = process.env.CLICKUP_WORKSPACE_ID
  if (envValue) return envValue
  return getConfig().get('workspace_id')
}

export function resolveOutputFormat(flagValue?: string): string {
  if (flagValue) return flagValue
  const envValue = process.env.CLICKUP_OUTPUT_FORMAT
  if (envValue) return envValue
  const configValue = getConfig().get('output_format')
  if (configValue) return configValue
  // Auto-detect: json when not a TTY
  if (!process.stdout.isTTY) return 'json'
  return 'table'
}

export function resolveColor(flagValue?: boolean): boolean {
  if (flagValue !== undefined) return flagValue
  const envValue = process.env.CLICKUP_COLOR
  if (envValue !== undefined) return envValue !== 'false' && envValue !== '0'
  return getConfig().get('color') ?? true
}

export function resolvePageSize(flagValue?: string): number {
  if (flagValue) return parseInt(flagValue, 10)
  const envValue = process.env.CLICKUP_PAGE_SIZE
  if (envValue) return parseInt(envValue, 10)
  return getConfig().get('page_size') ?? 100
}

export function resolveTimezone(flagValue?: string): string | undefined {
  if (flagValue) return flagValue
  const envValue = process.env.CLICKUP_TIMEZONE
  if (envValue) return envValue
  return getConfig().get('timezone')
}
