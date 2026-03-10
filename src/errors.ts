export const EXIT_SUCCESS = 0
export const EXIT_GENERAL = 1
export const EXIT_INVALID_ARGS = 2
export const EXIT_AUTH_FAILURE = 3
export const EXIT_NOT_FOUND = 4
export const EXIT_PERMISSION_DENIED = 5
export const EXIT_RATE_LIMITED = 6
export const EXIT_NETWORK_ERROR = 7

export class ClickUpError extends Error {
  public readonly status: number
  public readonly ecode: string | undefined
  public readonly body: unknown
  public readonly exitCode: number

  constructor(options: {
    message: string
    status: number
    ecode?: string
    body?: unknown
  }) {
    super(options.message)
    this.name = 'ClickUpError'
    this.status = options.status
    this.ecode = options.ecode
    this.body = options.body
    this.exitCode = mapToExitCode(options.status, options.ecode)
  }
}

const ECODE_MESSAGES: Record<string, string> = {
  OAUTH_023: 'Invalid or expired token. Run: clickup auth login',
  OAUTH_024: 'Token does not have permission for this action.',
  ITEM_015: 'Task not found. Check the task ID.',
  TEAM_015:
    'Workspace not found. Check the workspace ID or run: clickup config set workspace_id <id>',
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Authentication failed. Run: clickup auth login',
  403: 'Permission denied. Check your access level in ClickUp.',
  404: 'Resource not found. Verify the ID.',
  429: 'Rate limited. Retrying automatically...',
}

export function getUserFriendlyMessage(
  status: number,
  ecode?: string,
  rawMessage?: string,
): string {
  if (ecode && ECODE_MESSAGES[ecode]) {
    return ECODE_MESSAGES[ecode]
  }
  if (STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status]
  }
  if (rawMessage) {
    return rawMessage
  }
  if (status >= 500) {
    return 'ClickUp server error. Retrying...'
  }
  return `Request failed with status ${status}`
}

export function parseApiError(
  status: number,
  body: unknown,
): ClickUpError {
  let message = ''
  let ecode: string | undefined

  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>
    if (typeof obj.err === 'string') {
      message = obj.err
    }
    if (typeof obj.ECODE === 'string') {
      ecode = obj.ECODE
    }
  }

  const friendlyMessage = getUserFriendlyMessage(status, ecode, message)

  return new ClickUpError({
    message: friendlyMessage,
    status,
    ecode,
    body,
  })
}

export function mapToExitCode(
  status: number,
  ecode?: string,
): number {
  if (ecode === 'OAUTH_023' || ecode === 'OAUTH_024' || status === 401) {
    return EXIT_AUTH_FAILURE
  }
  if (status === 403) {
    return EXIT_PERMISSION_DENIED
  }
  if (ecode === 'ITEM_015' || ecode === 'TEAM_015' || status === 404) {
    return EXIT_NOT_FOUND
  }
  if (status === 429) {
    return EXIT_RATE_LIMITED
  }
  if (status >= 500) {
    return EXIT_GENERAL
  }
  return EXIT_GENERAL
}

export function isRetryable(status: number): boolean {
  return status === 429 || status >= 500
}

export function isClientError(status: number): boolean {
  return status >= 400 && status < 500 && status !== 429
}
