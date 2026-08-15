// Store
import type { Wallet } from '../../store/Types'

/**
 * Credits and ball counts are money-shaped numbers: they need thousands separators, and the
 * separator is locale-specific (10,000 in en, 10.000 in es). Intl.NumberFormat is passed the
 * ACTIVE i18n language rather than the browser's, so the number agrees with the words around it
 * when a visitor overrides the language in the header.
 */
export function formatCredits(value: number, language: string): string {
  return new Intl.NumberFormat(language).format(value)
}

/** Catch rate arrives as a 0..1 fraction; the shop renders it as the percentage a player thinks in. */
export function formatCatchRate(catchRate: number, language: string): string {
  return new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 }).format(catchRate)
}

/** Every ball in the bag, whatever its type — what the header chip counts. */
export function totalBalls(wallet: Wallet | undefined): number {
  return wallet?.balls.reduce((total, ball) => total + ball.quantity, 0) ?? 0
}

/** Quantity of ONE type, tolerating a wallet that has not loaded yet. */
export function ballQuantity(wallet: Wallet | undefined, type: string): number {
  return wallet?.balls.find((ball) => ball.type === type)?.quantity ?? 0
}

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600

/**
 * A remaining duration as a fixed HH:MM:SS clock — what the daily bonus counts down on.
 *
 * Zero-padded and fixed-width on purpose: the claim control shows this once a second, and an
 * unpadded readout would resize the button on every tick. Deliberately NOT run through Intl either.
 * This is a timer readout rather than a date, every supported locale reads 23:59:14 the same way,
 * and the daily cooldown never reaches three digits of hours.
 *
 * Rounded UP, so a target 500ms away still reads 00:00:01 and the clock shows all zeroes only once
 * the wait is genuinely over.
 */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / MS_PER_SECOND))
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

/**
 * Spin history timestamps. Same-day spins (the common case while playing) read as a clock time and
 * older ones as a short date — a full ISO stamp on every row is noise nobody scans.
 */
export function formatSpinDate(isoDate: string, language: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  const isToday = new Date().toDateString() === date.toDateString()
  return isToday
    ? new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(date)
    : new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}
