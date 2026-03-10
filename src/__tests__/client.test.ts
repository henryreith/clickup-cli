import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClickUpClient } from '../client.js'
import { ClickUpError } from '../errors.js'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map(Object.entries(headers)),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }
}

describe('ClickUpClient', () => {
  let client: ClickUpClient

  beforeEach(() => {
    mockFetch.mockReset()
    client = new ClickUpClient({
      token: 'pk_test_token',
      retryDelay: 10, // Fast retries for tests
      timeout: 5000,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('get', () => {
    it('sends GET request with auth header', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ teams: [] }))

      const result = await client.get<{ teams: unknown[] }>('/team')

      expect(result.teams).toEqual([])
      expect(mockFetch).toHaveBeenCalledOnce()
      const [url, opts] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.clickup.com/api/v2/team')
      expect(opts.method).toBe('GET')
      expect(opts.headers.Authorization).toBe('pk_test_token')
    })

    it('appends query params', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }))

      await client.get('/tasks', { page: '0', archived: 'true' })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('page=0')
      expect(url).toContain('archived=true')
    })

    it('filters out empty query params', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }))

      await client.get('/tasks', { page: '0', empty: '' })

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('page=0')
      expect(url).not.toContain('empty')
    })
  })

  describe('post', () => {
    it('sends POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: '123' }, 201))

      const result = await client.post<{ id: string }>('/task', { name: 'Test' })

      expect(result.id).toBe('123')
      const [, opts] = mockFetch.mock.calls[0]
      expect(opts.method).toBe('POST')
      expect(opts.headers['Content-Type']).toBe('application/json')
      expect(opts.body).toBe(JSON.stringify({ name: 'Test' }))
    })
  })

  describe('put', () => {
    it('sends PUT request', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}))

      await client.put('/task/123', { name: 'Updated' })

      const [, opts] = mockFetch.mock.calls[0]
      expect(opts.method).toBe('PUT')
    })
  })

  describe('delete', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}))

      await client.delete('/task/123')

      const [, opts] = mockFetch.mock.calls[0]
      expect(opts.method).toBe('DELETE')
    })
  })

  describe('retry logic', () => {
    it('retries on 500 errors', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ err: 'Server error' }, 500))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))

      const result = await client.get<{ ok: boolean }>('/test')

      expect(result.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('throws after max retries on persistent 500', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ err: 'Server error' }, 500))

      await expect(client.get('/test')).rejects.toThrow(ClickUpError)
      expect(mockFetch).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    })

    it('does not retry on 400 errors', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ err: 'Bad request', ECODE: 'ITEM_015' }, 400),
      )

      await expect(client.get('/test')).rejects.toThrow(ClickUpError)
      expect(mockFetch).toHaveBeenCalledOnce()
    })

    it('does not retry on 404 errors', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ err: 'Not found' }, 404))

      await expect(client.get('/test')).rejects.toThrow(ClickUpError)
      expect(mockFetch).toHaveBeenCalledOnce()
    })
  })

  describe('dry run', () => {
    it('does not send request in dry-run mode', async () => {
      const dryClient = new ClickUpClient({
        token: 'pk_test',
        dryRun: true,
      })

      const result = await dryClient.get<Record<string, unknown>>('/test')

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toEqual({})
    })
  })

  describe('error parsing', () => {
    it('parses ClickUp error response', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ err: 'Token invalid', ECODE: 'OAUTH_023' }, 401),
      )

      try {
        await client.get('/test')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ClickUpError)
        const clickUpError = error as ClickUpError
        expect(clickUpError.status).toBe(401)
        expect(clickUpError.ecode).toBe('OAUTH_023')
      }
    })
  })

  describe('empty response', () => {
    it('handles empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.reject(new Error('no json')),
        text: () => Promise.resolve(''),
      })

      const result = await client.delete<Record<string, unknown>>('/task/123')
      expect(result).toEqual({})
    })
  })
})
