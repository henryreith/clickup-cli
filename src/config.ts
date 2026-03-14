import { readFileSync } from 'node:fs'
import Conf from 'conf'

export interface ProfileConfig {
  token?: string
  workspace_id?: string
  workspace_name?: string
  nickname?: string
}

export interface ConfigSchema {
  // Legacy flat keys (backward compat)
  token?: string
  workspace_id?: string
  // Global settings
  output_format?: string
  color?: boolean
  page_size?: number
  timezone?: string
  active_profile?: string
  profiles?: Record<string, ProfileConfig>
}

const CONFIG_KEYS = ['output_format', 'color', 'page_size', 'timezone', 'active_profile'] as const
// Legacy keys still settable via config set for backward compat
const ALL_CONFIG_KEYS = ['token', 'workspace_id', 'output_format', 'color', 'page_size', 'timezone', 'active_profile'] as const

export type ConfigKey = (typeof ALL_CONFIG_KEYS)[number]

export function isValidConfigKey(key: string): key is ConfigKey {
  return (ALL_CONFIG_KEYS as readonly string[]).includes(key)
}

export const VALID_CONFIG_KEYS = ALL_CONFIG_KEYS

export const config = new Conf<ConfigSchema>({
  projectName: 'clickup-cli',
  schema: {
    token: { type: 'string' },
    workspace_id: { type: 'string' },
    output_format: { type: 'string', enum: ['table', 'json', 'csv', 'tsv', 'quiet', 'id'] },
    color: { type: 'boolean', default: true },
    page_size: { type: 'number', default: 100 },
    timezone: { type: 'string' },
    active_profile: { type: 'string' },
    profiles: { type: 'object' },
  },
})

// Module-level profile override set from --profile global flag
let _profileOverride: string | undefined

export function setProfileOverride(nameOrKey: string | undefined): void {
  _profileOverride = nameOrKey ? findProfileKey(nameOrKey) : undefined
}

export function getActiveProfileKey(): string {
  if (_profileOverride) return _profileOverride
  const active = config.get('active_profile') as string | undefined
  return active ?? 'default'
}

export function getProfiles(): Record<string, ProfileConfig> {
  const stored = config.get('profiles') as Record<string, ProfileConfig> | undefined
  return stored ?? {}
}

export function getProfile(key: string): ProfileConfig | undefined {
  return getProfiles()[key]
}

export function setProfile(key: string, profile: ProfileConfig): void {
  const profiles = getProfiles()
  profiles[key] = profile
  config.set('profiles', profiles)
}

export function deleteProfile(key: string): void {
  const profiles = getProfiles()
  delete profiles[key]
  config.set('profiles', profiles)
}

export function slugifyWorkspaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function findProfileKey(nameOrKey: string): string {
  const profiles = getProfiles()
  // 1. Exact key match
  if (profiles[nameOrKey] !== undefined) return nameOrKey
  // 2. Exact workspace_name or nickname match (case-insensitive)
  const lower = nameOrKey.toLowerCase()
  for (const [key, profile] of Object.entries(profiles)) {
    if (profile.workspace_name?.toLowerCase() === lower) return key
    if (profile.nickname?.toLowerCase() === lower) return key
  }
  // 3. Substring match
  for (const [key, profile] of Object.entries(profiles)) {
    if (profile.workspace_name?.toLowerCase().includes(lower)) return key
    if (profile.nickname?.toLowerCase().includes(lower)) return key
  }
  // Return as-is -- caller handles missing profile gracefully
  return nameOrKey
}

// Migrate legacy flat token/workspace_id to profiles.default
export function migrateConfig(): void {
  const legacyToken = config.get('token') as string | undefined
  const legacyWorkspaceId = config.get('workspace_id') as string | undefined
  if (!legacyToken && !legacyWorkspaceId) return

  const profiles = getProfiles()
  if (!profiles['default']) {
    const defaultProfile: ProfileConfig = {}
    if (legacyToken) defaultProfile.token = legacyToken
    if (legacyWorkspaceId) defaultProfile.workspace_id = legacyWorkspaceId
    setProfile('default', defaultProfile)
    config.delete('token' as keyof ConfigSchema)
    config.delete('workspace_id' as keyof ConfigSchema)
  }
}

// Run migration on first import
try {
  migrateConfig()
} catch {
  // Never break existing functionality due to migration errors
}

export function resolveToken(flagValue?: string, tokenFilePath?: string): string | undefined {
  // 1. --token flag
  if (flagValue) return flagValue
  // 2. --token-file
  if (tokenFilePath) {
    try {
      const content = readFileSync(tokenFilePath, 'utf8').trim()
      if (content) return content
    } catch {
      // fall through
    }
  }
  // 3. CLICKUP_API_TOKEN env
  const envVal = process.env['CLICKUP_API_TOKEN']
  if (envVal) return envVal
  // 4. Active profile
  const profileKey = getActiveProfileKey()
  const profiles = getProfiles()
  const activeProfile = profiles[profileKey]
  if (activeProfile?.token) return activeProfile.token
  // 5. Legacy flat token (if migration didn't run)
  const legacyToken = config.get('token') as string | undefined
  if (legacyToken) return legacyToken
  return undefined
}

export function resolveWorkspaceId(flagValue?: string): string | undefined {
  // 1. --workspace-id flag
  if (flagValue) return flagValue
  // 2. CLICKUP_WORKSPACE_ID env
  const envVal = process.env['CLICKUP_WORKSPACE_ID']
  if (envVal) return envVal
  // 3. Active profile
  const profileKey = getActiveProfileKey()
  const profiles = getProfiles()
  const activeProfile = profiles[profileKey]
  if (activeProfile?.workspace_id) return activeProfile.workspace_id
  // 4. Single-workspace auto-select
  const withWorkspace = Object.values(profiles).filter((p) => p.workspace_id)
  if (withWorkspace.length === 1) return withWorkspace[0]!.workspace_id
  // 5. Legacy flat workspace_id
  const legacyId = config.get('workspace_id') as string | undefined
  if (legacyId) return legacyId
  return undefined
}

export function resolveOutputFormat(flagValue?: string): string {
  if (flagValue) return flagValue
  const envVal = process.env['CLICKUP_OUTPUT_FORMAT']
  if (envVal) return envVal
  const stored = config.get('output_format')
  if (stored) return stored
  return process.stdout.isTTY ? 'table' : 'json'
}

export function resolveColor(flagValue?: boolean): boolean {
  if (flagValue !== undefined) return flagValue
  const envVal = process.env['CLICKUP_COLOR']
  if (envVal !== undefined) return envVal !== 'false' && envVal !== '0'
  const stored = config.get('color')
  if (typeof stored === 'boolean') return stored
  return true
}

export function resolvePageSize(flagValue?: number): number {
  if (flagValue !== undefined) return flagValue
  const envVal = process.env['CLICKUP_PAGE_SIZE']
  if (envVal !== undefined) {
    const num = parseInt(envVal, 10)
    if (!isNaN(num)) return num
  }
  const stored = config.get('page_size')
  if (typeof stored === 'number') return stored
  return 100
}

export function resolveTimezone(flagValue?: string): string | undefined {
  if (flagValue) return flagValue
  const envVal = process.env['CLICKUP_TIMEZONE']
  if (envVal) return envVal
  const stored = config.get('timezone')
  if (typeof stored === 'string') return stored
  return undefined
}
