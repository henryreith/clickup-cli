import Conf from 'conf'

export interface ConfigSchema {
  token?: string
  workspace_id?: string
  output_format?: string
  color?: boolean
  page_size?: number
  timezone?: string
}

const CONFIG_KEYS = ['token', 'workspace_id', 'output_format', 'color', 'page_size', 'timezone'] as const

export type ConfigKey = (typeof CONFIG_KEYS)[number]

export function isValidConfigKey(key: string): key is ConfigKey {
  return (CONFIG_KEYS as readonly string[]).includes(key)
}

export const VALID_CONFIG_KEYS = CONFIG_KEYS

export const config = new Conf<ConfigSchema>({
  projectName: 'clickup-cli',
  schema: {
    token: { type: 'string' },
    workspace_id: { type: 'string' },
    output_format: { type: 'string', enum: ['table', 'json', 'csv', 'tsv', 'quiet', 'id'] },
    color: { type: 'boolean', default: true },
    page_size: { type: 'number', default: 100 },
    timezone: { type: 'string' },
  },
})

const ENV_MAP: Record<ConfigKey, string> = {
  token: 'CLICKUP_API_TOKEN',
  workspace_id: 'CLICKUP_WORKSPACE_ID',
  output_format: 'CLICKUP_OUTPUT_FORMAT',
  color: 'CLICKUP_COLOR',
  page_size: 'CLICKUP_PAGE_SIZE',
  timezone: 'CLICKUP_TIMEZONE',
}

function resolveString(key: ConfigKey, flagValue: string | undefined): string | undefined {
  if (flagValue !== undefined) return flagValue
  const envVal = process.env[ENV_MAP[key]]
  if (envVal !== undefined) return envVal
  const stored = config.get(key)
  if (typeof stored === 'string') return stored
  return undefined
}

export function resolveToken(flagValue?: string): string | undefined {
  return resolveString('token', flagValue)
}

export function resolveWorkspaceId(flagValue?: string): string | undefined {
  return resolveString('workspace_id', flagValue)
}

export function resolveOutputFormat(flagValue?: string): string {
  const val = resolveString('output_format', flagValue)
  if (val) return val
  return process.stdout.isTTY ? 'table' : 'json'
}

export function resolveColor(flagValue?: boolean): boolean {
  if (flagValue !== undefined) return flagValue
  const envVal = process.env[ENV_MAP.color]
  if (envVal !== undefined) return envVal !== 'false' && envVal !== '0'
  const stored = config.get('color')
  if (typeof stored === 'boolean') return stored
  return true
}

export function resolvePageSize(flagValue?: number): number {
  if (flagValue !== undefined) return flagValue
  const envVal = process.env[ENV_MAP.page_size]
  if (envVal !== undefined) {
    const num = parseInt(envVal, 10)
    if (!isNaN(num)) return num
  }
  const stored = config.get('page_size')
  if (typeof stored === 'number') return stored
  return 100
}

export function resolveTimezone(flagValue?: string): string | undefined {
  return resolveString('timezone', flagValue)
}
