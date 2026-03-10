import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createProgram } from '../../cli.js'
import { getConfig, resetConfigInstance } from '../../config.js'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map(),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }
}

describe('auth commands', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrOutput: string
  let stdoutOutput: string

  beforeEach(() => {
    mockFetch.mockReset()
    resetConfigInstance()
    stderrOutput = ''
    stdoutOutput = ''
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      stderrOutput += String(chunk)
      return true
    })
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdoutOutput += String(chunk)
      return true
    })
  })

  afterEach(() => {
    stderrSpy.mockRestore()
    stdoutSpy.mockRestore()
    try {
      getConfig().clear()
    } catch {
      // ignore
    }
    resetConfigInstance()
  })

  describe('auth login --token', () => {
    it('validates and stores token', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          user: { username: 'testuser', email: 'test@example.com' },
        }),
      )

      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'auth', 'login', '--token', 'pk_test123'])

      expect(getConfig().get('token')).toBe('pk_test123')
      expect(stderrOutput).toContain('Authenticated as testuser')
    })

    it('rejects invalid token', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ err: 'Invalid token', ECODE: 'OAUTH_023' }, 401),
      )

      const program = createProgram()
      program.exitOverride()

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await program.parseAsync(['node', 'clickup', 'auth', 'login', '--token', 'bad_token'])
      } catch {
        // Expected
      }

      expect(getConfig().get('token')).toBeUndefined()
      expect(stderrOutput).toContain('Authentication failed')
      exitSpy.mockRestore()
    })
  })

  describe('auth logout', () => {
    it('removes stored token', async () => {
      getConfig().set('token', 'pk_stored')

      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'auth', 'logout'])

      expect(getConfig().get('token')).toBeUndefined()
      expect(stderrOutput).toContain('Token removed')
    })
  })

  describe('auth token', () => {
    it('prints stored token', async () => {
      getConfig().set('token', 'pk_mytoken')

      const program = createProgram()
      program.exitOverride()
      await program.parseAsync(['node', 'clickup', 'auth', 'token'])

      expect(stdoutOutput.trim()).toBe('pk_mytoken')
    })

    it('fails when no token', async () => {
      const program = createProgram()
      program.exitOverride()

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      try {
        await program.parseAsync(['node', 'clickup', 'auth', 'token'])
      } catch {
        // Expected
      }

      expect(stderrOutput).toContain('No authentication token found')
      exitSpy.mockRestore()
    })
  })
})
