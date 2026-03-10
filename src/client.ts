import { createReadStream } from 'node:fs'
import { basename } from 'node:path'
import { ClickUpError, parseApiError, isRetryable, EXIT_RATE_LIMITED, EXIT_NETWORK_ERROR } from './errors.js'

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
    this.baseUrl = options.baseUrl ?? 'https://api.clickup.com/api/v2'
    this.maxRetries = options.maxRetries ?? 3
    this.retryDelay = options.retryDelay ?? 1000
    this.timeout = options.timeout ?? 30000
    this.verbose = options.verbose ?? false
    this.debug = options.debug ?? false
    this.dryRun = options.dryRun ?? false
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, { params })
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body })
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body })
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  async upload<T>(path: string, filePath: string, filename?: string): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const name = filename ?? basename(filePath)

    if (this.dryRun) {
      this.logDryRun('POST', url, `[multipart upload: ${name}]`)
      return {} as T
    }

    const fileStream = createReadStream(filePath)
    const formData = new FormData()
    const chunks: Buffer[] = []
    for await (const chunk of fileStream) {
      chunks.push(Buffer.from(chunk as Buffer))
    }
    const blob = new Blob([Buffer.concat(chunks)])
    formData.append('attachment', blob, name)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const start = Date.now()
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: this.token,
        },
        body: formData,
        signal: controller.signal,
      })
      const elapsed = Date.now() - start

      if (this.verbose || this.debug) {
        this.logRequest('POST', path, response.status, elapsed)
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw parseApiError(response.status, errorBody)
      }

      return (await response.json()) as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async request<T>(
    method: string,
    path: string,
    options?: { params?: Record<string, string>; body?: unknown },
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`
    if (options?.params) {
      const filtered = Object.fromEntries(
        Object.entries(options.params).filter(([, v]) => v !== undefined && v !== ''),
      )
      if (Object.keys(filtered).length > 0) {
        url += `?${new URLSearchParams(filtered).toString()}`
      }
    }

    if (this.dryRun) {
      this.logDryRun(method, url, options?.body)
      return {} as T
    }

    const headers: Record<string, string> = {
      Authorization: this.token,
    }
    if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    let lastError: Error | undefined

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1)
        if (this.verbose || this.debug) {
          process.stderr.write(`Retrying in ${delay}ms (attempt ${attempt + 1})...\n`)
        }
        await this.sleep(delay)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      try {
        const start = Date.now()
        const response = await fetch(url, {
          method,
          headers,
          body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        })
        const elapsed = Date.now() - start

        if (this.verbose || this.debug) {
          this.logRequest(method, path, response.status, elapsed)
        }

        if (this.debug) {
          const debugHeaders = Object.fromEntries(response.headers.entries())
          process.stderr.write(`  Response headers: ${JSON.stringify(debugHeaders, null, 2)}\n`)
        }

        // Handle rate limiting
        const remaining = response.headers.get('X-RateLimit-Remaining')
        const reset = response.headers.get('X-RateLimit-Reset')

        if (response.status === 429 && reset) {
          const resetTime = parseInt(reset, 10) * 1000
          const waitMs = Math.max(resetTime - Date.now(), 1000)
          process.stderr.write(`Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s...\n`)
          await this.sleep(waitMs)
          continue
        }

        if (remaining === '0' && reset) {
          const resetTime = parseInt(reset, 10) * 1000
          const waitMs = Math.max(resetTime - Date.now(), 0)
          if (waitMs > 0) {
            process.stderr.write(`Rate limit approaching. Waiting ${Math.ceil(waitMs / 1000)}s...\n`)
            await this.sleep(waitMs)
          }
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))

          if (this.debug) {
            process.stderr.write(`  Response body: ${JSON.stringify(errorBody, null, 2)}\n`)
          }

          const error = parseApiError(response.status, errorBody)

          if (isRetryable(response.status) && attempt < this.maxRetries) {
            lastError = error
            continue
          }

          throw error
        }

        const text = await response.text()

        if (this.debug && text) {
          process.stderr.write(`  Response body: ${text}\n`)
        }

        if (!text) {
          return {} as T
        }

        return JSON.parse(text) as T
      } catch (error) {
        if (error instanceof ClickUpError) {
          throw error
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          lastError = new ClickUpError({
            message: `Request timed out after ${this.timeout}ms`,
            status: 0,
          })
        } else if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
          lastError = new ClickUpError({
            message: `Network error: ${error.message}`,
            status: 0,
          })
          Object.defineProperty(lastError, 'exitCode', { value: EXIT_NETWORK_ERROR })
        } else {
          throw error
        }

        if (attempt >= this.maxRetries) {
          throw lastError
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    throw lastError ?? new ClickUpError({
      message: 'Max retries exceeded',
      status: 0,
    })
  }

  private logRequest(method: string, path: string, status: number, elapsed: number): void {
    const statusText = status >= 400 ? `${status} ERROR` : `${status} OK`
    process.stderr.write(`[${method}] ${path} ${statusText} (${elapsed}ms)\n`)
  }

  private logDryRun(method: string, url: string, body?: unknown): void {
    process.stderr.write(`[DRY RUN] ${method} ${url}\n`)
    process.stderr.write(`  Authorization: <redacted>\n`)
    if (body !== undefined) {
      process.stderr.write(`  Body: ${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}\n`)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
