export class ClickUpError extends Error {
  readonly status: number
  readonly ecode: string | undefined
  readonly body: unknown

  constructor(message: string, status: number, ecode: string | undefined, body: unknown) {
    super(message)
    this.name = 'ClickUpError'
    this.status = status
    this.ecode = ecode
    this.body = body
  }
}

const ECODE_MESSAGES: Record<string, string> = {
  OAUTH_023: 'Invalid or expired token. Run: clickup auth login',
  OAUTH_024: 'Token does not have permission for this action.',
  ITEM_015: 'Task not found. Check the task ID.',
  TEAM_015: 'Workspace not found. Check the workspace ID or run: clickup config set workspace_id <id>',
}

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Authentication failed. Run: clickup auth login',
  403: 'Permission denied. Check your access level in ClickUp.',
  404: 'Resource not found. Verify the ID.',
  429: 'Rate limited. Retrying automatically...',
}

export function parseApiError(responseBody: unknown, status: number): ClickUpError {
  let message = `API request failed with status ${status}`
  let ecode: string | undefined

  if (responseBody && typeof responseBody === 'object') {
    const body = responseBody as Record<string, unknown>
    if (typeof body['ECODE'] === 'string') {
      ecode = body['ECODE']
    }
    if (typeof body['err'] === 'string') {
      message = body['err']
    }
  }

  if (ecode && ECODE_MESSAGES[ecode]) {
    message = ECODE_MESSAGES[ecode]!
  } else if (!ecode && STATUS_MESSAGES[status]) {
    message = STATUS_MESSAGES[status]!
  }

  return new ClickUpError(message, status, ecode, responseBody)
}

export function mapToExitCode(error: unknown): number {
  if (!(error instanceof ClickUpError)) {
    return 1
  }

  switch (error.status) {
    case 401:
      return 3
    case 403:
      return 5
    case 404:
      return 4
    case 429:
      return 6
    default:
      if (error.status >= 500) return 1
      return 1
  }
}

export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGS: 2,
  AUTH_FAILURE: 3,
  NOT_FOUND: 4,
  PERMISSION_DENIED: 5,
  RATE_LIMITED: 6,
  NETWORK_ERROR: 7,
} as const
