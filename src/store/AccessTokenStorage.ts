// Store
import type { AuthUser } from './Types'

/**
 * The access token is persisted next to the refresh token so a page reload can restore the
 * session WITHOUT spending a refresh token.
 *
 * Why this matters: refresh tokens rotate — each use revokes the old one, and reuse detection
 * revokes the whole family as suspected theft. If a reload interrupted an in-flight refresh
 * (server rotated, response lost), the next boot would present an already-revoked token and
 * the backend would correctly kill the session. Rapid reloads on a phone made that a routine
 * occurrence. Keeping the still-valid access token means boot usually needs no refresh at all,
 * so the rotation window is never entered. The backend's reuse detection is untouched.
 *
 * Tradeoff: this puts the access token at rest in localStorage. That is the same exposure class
 * as the refresh token already stored there (and the refresh token is the more powerful of the
 * two, being long-lived and exchangeable), so it widens nothing meaningfully. Accepted for this
 * project; a deployment that cared would move both to httpOnly cookies.
 */

const ACCESS_TOKEN_STORAGE_KEY = 'pokedex.accessToken'

/**
 * Treat a token that is about to expire as already expired. Covers clock skew between phone and
 * server plus the flight time of the first authenticated request, so boot never hydrates a
 * session that 401s a moment later.
 */
const EXPIRY_SAFETY_MARGIN_MS = 30_000

export interface RestoredSession {
  user: AuthUser
  accessToken: string
}

interface AccessTokenClaims {
  /** Subject — the user id. */
  sub: string
  email: string
  /** Expiry, seconds since epoch (JWT `exp`). */
  exp: number
}

/**
 * Decode one base64url JWT segment. Hand-rolled rather than pulling in a jwt library: this is
 * a read of a token we already hold, never a verification — the backend remains the only thing
 * that validates the signature, and a forged token would simply 401 on first use.
 */
function decodeBase64UrlSegment(segment: string): string | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    // Not valid base64url, or not decodable as UTF-8.
    return null
  }
}

/** Returns null for anything that is not a JWT carrying the three claims the session needs. */
function readClaims(token: string): AccessTokenClaims | null {
  const segments = token.split('.')
  if (segments.length !== 3) return null

  const payloadJson = decodeBase64UrlSegment(segments[1] ?? '')
  if (payloadJson === null) return null

  let payload: unknown
  try {
    payload = JSON.parse(payloadJson)
  } catch {
    return null
  }
  if (typeof payload !== 'object' || payload === null) return null

  const { sub, email, exp } = payload as Record<string, unknown>
  if (typeof sub !== 'string' || sub.length === 0) return null
  if (typeof email !== 'string' || email.length === 0) return null
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return null

  return { sub, email, exp }
}

/**
 * The stored session, but only while it is still comfortably valid. Returns null when there is
 * no token, when it is unreadable, or when it is inside the expiry safety margin — in every one
 * of those cases the caller should fall back to the silent-refresh path.
 */
export function getRestorableSession(): RestoredSession | null {
  let token: string | null = null
  try {
    token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
  if (token === null) return null

  const claims = readClaims(token)
  if (claims === null) {
    // Corrupt or truncated — drop it so every later boot doesn't re-parse the same garbage.
    clearAccessToken()
    return null
  }

  const remainingMs = claims.exp * 1000 - Date.now()
  if (remainingMs < EXPIRY_SAFETY_MARGIN_MS) return null

  return { user: { id: claims.sub, email: claims.email }, accessToken: token }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
  } catch {
    // Storage unavailable — the session still works for this page life, it just won't survive
    // a reload without spending a refresh token.
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
