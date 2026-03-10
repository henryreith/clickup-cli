import { describe, it, expect } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge } from '../auth.js'

describe('OAuth2 PKCE', () => {
  describe('generateCodeVerifier', () => {
    it('generates a base64url-encoded string', () => {
      const verifier = generateCodeVerifier()
      expect(verifier).toBeTruthy()
      expect(typeof verifier).toBe('string')
      // base64url characters only
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('generates unique verifiers', () => {
      const v1 = generateCodeVerifier()
      const v2 = generateCodeVerifier()
      expect(v1).not.toBe(v2)
    })

    it('generates verifiers of adequate length', () => {
      const verifier = generateCodeVerifier()
      // 48 bytes -> 64 base64url characters
      expect(verifier.length).toBe(64)
    })
  })

  describe('generateCodeChallenge', () => {
    it('generates a base64url-encoded SHA-256 hash', () => {
      const verifier = 'test-verifier-value'
      const challenge = generateCodeChallenge(verifier)
      expect(challenge).toBeTruthy()
      expect(typeof challenge).toBe('string')
      // base64url characters only
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('produces consistent output for same input', () => {
      const verifier = 'consistent-verifier'
      const c1 = generateCodeChallenge(verifier)
      const c2 = generateCodeChallenge(verifier)
      expect(c1).toBe(c2)
    })

    it('produces different output for different input', () => {
      const c1 = generateCodeChallenge('verifier-a')
      const c2 = generateCodeChallenge('verifier-b')
      expect(c1).not.toBe(c2)
    })

    it('produces a 43-character hash (SHA-256 -> base64url)', () => {
      const challenge = generateCodeChallenge('any-verifier')
      // SHA-256 = 32 bytes -> 43 base64url characters (no padding)
      expect(challenge.length).toBe(43)
    })
  })
})
