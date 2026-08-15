// Shared client-side validation, mirrored loosely against the backend's own checks so a user
// never submits a request the API is guaranteed to reject on format grounds alone.

// A permissive, widely-used email shape check (local@domain.tld) — not a full RFC 5322
// validator, matching the "same regex family" used across the pokedex backends.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 8

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH
}
