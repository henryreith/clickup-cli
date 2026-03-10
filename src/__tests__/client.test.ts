import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClickUpClient } from '../client.js'
import { ClickUpError } from '../errors.js'

function mockFetch(responses: Array<{ status: number; body: unknown; headers?: Record<string, string> }>) {
  let callIndex = 0
  return vi.fn(async () => {
    const resp = responses[callIndex++]!
    return {
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      statusText: resp.status === 200 ? 'OK' : 'Error',
      headers: new Headers(resp.headers ?? {}),
      json: async () => resp.body,
    } as Response
  })
}

function getCallUrl(fetchSpy: ReturnType<typeof vi.fn>, index: number): string {
  const call = fetchSpy.mock.calls[index] as unknown[]
  return call[0] as string
}

function getCallInit(fetchSpy: ReturnType<typeof vi.fn>, index: number): RequestInit {
  const call = fetchSpy.mock.calls[index] as unknown[]
  return call[1] as RequestInit
}

describe('ClickUpClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends GET request with auth header', async () => {
    const fetchSpy = mockFetch([{ status: 200, body: { id: '1' } }])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test123' })
    const result = await client.get('/user')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(getCallUrl(fetchSpy, 0)).toBe('https://api.clickup.com/api/v2/user')
    expect(getCallInit(fetchSpy, 0).headers).toEqual(
      expect.objectContaining({ Authorization: 'pk_test123' }),
    )
    expect(result).toEqual({ id: '1' })
  })

  it('sends query params on GET', async () => {
    const fetchSpy = mockFetch([{ status: 200, body: { items: [] } }])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test' })
    await client.get('/tasks', { page: '0', archived: 'false' })

    const url = getCallUrl(fetchSpy, 0)
    expect(url).toContain('page=0')
    expect(url).toContain('archived=false')
  })

  it('skips undefined query params', async () => {
    const fetchSpy = mockFetch([{ status: 200, body: {} }])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test' })
    await client.get('/tasks', { page: '0', filter: undefined })

    const url = getCallUrl(fetchSpy, 0)
    expect(url).toContain('page=0')
    expect(url).not.toContain('filter')
  })

  it('sends POST with JSON body', async () => {
    const fetchSpy = mockFetch([{ status: 200, body: { id: 'new' } }])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test' })
    await client.post('/task', { name: 'Test task' })

    const init = getCallInit(fetchSpy, 0)
    expect(init.headers).toEqual(
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    )
    expect(init.body).toBe(JSON.stringify({ name: 'Test task' }))
  })

  it('throws ClickUpError on 404', async () => {
    const fetchSpy = mockFetch([
      { status: 404, body: { err: 'Task not found', ECODE: 'ITEM_015' } },
    ])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test' })
    await expect(client.get('/task/bad')).rejects.toThrow(ClickUpError)
  })

  it('does not retry 401 errors', async () => {
    const fetchSpy = mockFetch([
      { status: 401, body: { err: 'Unauthorized' } },
    ])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test' })
    await expect(client.get('/user')).rejects.toThrow(ClickUpError)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('retries on 500 with exponential backoff', async () => {
    const fetchSpy = mockFetch([
      { status: 500, body: { err: 'Server error' } },
      { status: 500, body: { err: 'Server error' } },
      { status: 200, body: { id: '1' } },
    ])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test', retryDelay: 1 })
    const result = await client.get('/user')

    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ id: '1' })
  })

  it('throws after max retries exhausted', async () => {
    const fetchSpy = mockFetch([
      { status: 502, body: { err: 'Bad Gateway' } },
      { status: 502, body: { err: 'Bad Gateway' } },
      { status: 502, body: { err: 'Bad Gateway' } },
      { status: 502, body: { err: 'Bad Gateway' } },
    ])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test', retryDelay: 1 })
    await expect(client.get('/user')).rejects.toThrow(ClickUpError)
    expect(fetchSpy).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
  })

  it('dry-run mode does not send request', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const client = new ClickUpClient({ token: 'pk_test', dryRun: true })
    const result = await client.post('/task', { name: 'test' })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('verbose mode logs to stderr', async () => {
    const fetchSpy = mockFetch([{ status: 200, body: {} }])
    vi.stubGlobal('fetch', fetchSpy)

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const client = new ClickUpClient({ token: 'pk_test', verbose: true })
    await client.get('/user')

    const output = (stderrSpy.mock.calls as unknown[][]).map(c => c[0]).join('')
    expect(output).toContain('[GET]')
    expect(output).toContain('/user')
    expect(output).toContain('200')
  })

  it('handles rate limit headers', async () => {
    const fetchSpy = mockFetch([
      {
        status: 200,
        body: { id: '1' },
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 1),
        },
      },
    ])
    vi.stubGlobal('fetch', fetchSpy)

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const client = new ClickUpClient({ token: 'pk_test' })
    await client.get('/user')

    const output = (stderrSpy.mock.calls as unknown[][]).map(c => c[0]).join('')
    expect(output).toContain('Rate limited')
  })

  it('uses custom base URL', async () => {
    const fetchSpy = mockFetch([{ status: 200, body: {} }])
    vi.stubGlobal('fetch', fetchSpy)

    const client = new ClickUpClient({ token: 'pk_test', baseUrl: 'https://custom.api.com/v2' })
    await client.get('/test')

    expect(getCallUrl(fetchSpy, 0)).toBe('https://custom.api.com/v2/test')
  })
})
