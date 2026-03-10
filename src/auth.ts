import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import { config } from './config.js'

const CLICKUP_AUTHORIZE_URL = 'https://app.clickup.com/api'
const CLICKUP_TOKEN_URL = 'https://api.clickup.com/api/v2/oauth/token'
const CALLBACK_PORT = 9876
const CALLBACK_PATH = '/callback'
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`

function generateCodeVerifier(): string {
  return randomBytes(48).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

function buildAuthorizeUrl(clientId: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${CLICKUP_AUTHORIZE_URL}?${params.toString()}`
}

async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  codeVerifier: string,
): Promise<string> {
  const response = await fetch(CLICKUP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Token exchange failed (${response.status}): ${body}`)
  }

  const data = (await response.json()) as Record<string, unknown>
  const token = data['access_token']
  if (typeof token !== 'string' || !token) {
    throw new Error('No access_token in token exchange response')
  }
  return token
}

function waitForCallback(server: Server): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close()
      reject(new Error('OAuth callback timed out after 120 seconds'))
    }, 120_000)

    server.on('request', (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? '/', `http://localhost:${CALLBACK_PORT}`)

      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end('<html><body><h1>Authentication failed</h1><p>You can close this tab.</p></body></html>')
        clearTimeout(timeout)
        server.close()
        reject(new Error(`OAuth error: ${error}`))
        return
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' })
        res.end('<html><body><h1>Missing code</h1><p>No authorization code received.</p></body></html>')
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('<html><body><h1>Authenticated</h1><p>You can close this tab and return to the terminal.</p></body></html>')
      clearTimeout(timeout)
      server.close()
      resolve(code)
    })
  })
}

async function openBrowser(url: string): Promise<void> {
  const { platform } = process
  let command: string

  if (platform === 'darwin') {
    command = 'open'
  } else if (platform === 'win32') {
    command = 'start'
  } else {
    command = 'xdg-open'
  }

  const { exec } = await import('node:child_process')
  return new Promise((resolve) => {
    exec(`${command} "${url}"`, () => {
      resolve()
    })
  })
}

export async function oauthLogin(): Promise<string> {
  const clientId = process.env['CLICKUP_CLIENT_ID']
  const clientSecret = process.env['CLICKUP_CLIENT_SECRET']

  if (!clientId) {
    process.stderr.write('Error: CLICKUP_CLIENT_ID environment variable is required for OAuth.\n')
    process.exit(2)
    throw new Error('unreachable')
  }

  if (!clientSecret) {
    process.stderr.write('Error: CLICKUP_CLIENT_SECRET environment variable is required for OAuth.\n')
    process.exit(2)
    throw new Error('unreachable')
  }

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.listen(CALLBACK_PORT, () => resolve())
    server.on('error', reject)
  })

  const authorizeUrl = buildAuthorizeUrl(clientId, codeChallenge)
  process.stderr.write(`Opening browser for authentication...\n`)
  process.stderr.write(`If the browser does not open, visit:\n${authorizeUrl}\n`)

  await openBrowser(authorizeUrl)

  const code = await waitForCallback(server)
  process.stderr.write('Exchanging code for token...\n')

  const token = await exchangeCodeForToken(code, clientId, clientSecret, codeVerifier)
  config.set('token', token)

  return token
}

export { generateCodeVerifier, generateCodeChallenge }
