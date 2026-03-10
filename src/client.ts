import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { ClickUpError, parseApiError } from './errors.js'

export interface ClickUpClientOptions {
  token: string
  baseUrl?: string
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  verbose?: boolean
  debug?: boolean
  dryRun?: boolean
}

const DEFAULT_BASE_URL = 'https://api.clickup.com/api/v2'
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000
const DEFAULT_TIMEOUT = 30000

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422])

export class ClickUpClient {
  private readonly token: string
  private readonly baseUrl: string
  private readonly maxRetries: number
  private readonly retryDelay: number
  private readonly timeout: number
  private readonly verbose: boolean
  private readonly debug: boolean
  private readonly dryRun: boolean

  constructor(options: ClickUpClientOptions) {
    this.token = options.token
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
    this.retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
    this.verbose = options.verbose ?? false
    this.debug = options.debug ?? false
    this.dryRun = options.dryRun ?? false
  }

  async get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    return this.request<T>('GET', path, undefined, params)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  async upload<T>(path: string, filePath: string, filename?: string): Promise<T> {
    const fileBuffer = readFileSync(filePath)
    const resolvedFilename = filename ?? basename(filePath)
    const formData = new FormData()
    formData.append('attachment', new Blob([fileBuffer]), resolvedFilename)

    const url = `${this.baseUrl}${path}`

    if (this.dryRun) {
      this.logDryRun('POST', url, '[multipart form data]')
      return {} as T
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: this.token },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await this.safeJson(response)
        throw parseApiError(body, response.status)
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof ClickUpError) throw error
      throw new ClickUpError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        undefined,
        undefined,
      )
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | undefined>,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`

    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.set(key, value)
        }
      }
      const qs = searchParams.toString()
      if (qs) url = `${url}?${qs}`
    }

    if (this.dryRun) {
      this.logDryRun(method, url, body)
      return {} as T
    }

    let lastError: ClickUpError | undefined

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1)
        if (this.verbose || this.debug) {
          process.stderr.write(`Retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries + 1})...\n`)
        }
        await this.sleep(delay)
      }

      const start = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      try {
        const headers: Record<string, string> = {
          Authorization: this.token,
        }

        if (body !== undefined) {
          headers['Content-Type'] = 'application/json'
        }

        if (this.debug) {
          const redactedHeaders = { ...headers, Authorization: '<redacted>' }
          process.stderr.write(`[${method}] ${url}\nHeaders: ${JSON.stringify(redactedHeaders)}\n`)
          if (body !== undefined) {
            process.stderr.write(`Body: ${JSON.stringify(body, null, 2)}\n`)
          }
        }

        const fetchInit: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        }
        if (body !== undefined) {
          fetchInit.body = JSON.stringify(body)
        }

        const response = await fetch(url, fetchInit)

        clearTimeout(timeoutId)
        const elapsed = Date.now() - start

        if (this.verbose || this.debug) {
          process.stderr.write(`[${method}] ${path} ${response.status} ${response.statusText} (${elapsed}ms)\n`)
        }

        // Check rate limit headers
        const remaining = response.headers.get('X-RateLimit-Remaining')
        const reset = response.headers.get('X-RateLimit-Reset')
        if (remaining === '0' && reset) {
          const resetTime = parseInt(reset, 10) * 1000
          const waitMs = Math.max(0, resetTime - Date.now())
          if (waitMs > 0) {
            process.stderr.write(`Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s...\n`)
            await this.sleep(waitMs)
          }
        }

        if (!response.ok) {
          const responseBody = await this.safeJson(response)
          const error = parseApiError(responseBody, response.status)

          if (this.debug) {
            process.stderr.write(`Error response: ${JSON.stringify(responseBody, null, 2)}\n`)
          }

          if (NON_RETRYABLE_STATUSES.has(response.status)) {
            throw error
          }

          if (RETRYABLE_STATUSES.has(response.status) && attempt < this.maxRetries) {
            lastError = error
            continue
          }

          throw error
        }

        const responseData = await this.safeJson(response)

        if (this.debug) {
          process.stderr.write(`Response: ${JSON.stringify(responseData, null, 2)}\n`)
        }

        return responseData as T
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof ClickUpError) {
          if (NON_RETRYABLE_STATUSES.has(error.status)) throw error
          if (attempt >= this.maxRetries) throw error
          lastError = error
          continue
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new ClickUpError('Request timed out', 0, undefined, undefined)
        }

        throw new ClickUpError(
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          0,
          undefined,
          undefined,
        )
      }
    }

    throw lastError ?? new ClickUpError('Request failed after retries', 0, undefined, undefined)
  }

  private logDryRun(method: string, url: string, body: unknown): void {
    process.stderr.write(`[DRY RUN] ${method} ${url}\n`)
    if (body !== undefined && body !== '[multipart form data]') {
      process.stderr.write(`Body: ${JSON.stringify(body, null, 2)}\n`)
    }
    if (body === '[multipart form data]') {
      process.stderr.write(`Body: ${body}\n`)
    }
  }

  private async safeJson(response: Response): Promise<unknown> {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
