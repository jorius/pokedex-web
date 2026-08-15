// The refresh token is the one piece of the auth session kept OUT of Redux state —
// it lives only in localStorage so a page reload can silently re-establish a session
// via /api/auth/refresh without ever putting the long-lived secret in memory-inspectable state.

const REFRESH_TOKEN_STORAGE_KEY = 'pokedex.refreshToken'

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token)
  } catch {
    // Storage unavailable — the token still lives in the fulfilled response for this request,
    // but silent refresh across reloads won't work until storage is available again.
  }
}

export function clearRefreshToken(): void {
  try {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
