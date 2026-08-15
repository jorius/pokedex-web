// Backend DTO shapes, verified identical across the three pokedex-api services
// (dotnet, expressJs, expressTs) — see docs/superpowers/plans/2026-08-15-pokedex-web-implementation.md.

export const API_TARGET_VALUES = ['dotnet', 'expressJs', 'expressTs'] as const

export type ApiTarget = (typeof API_TARGET_VALUES)[number]

export interface PagedMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** Every backend response is wrapped in this envelope. */
export interface ApiEnvelope<T> {
  data: T | null
  error: string | null
  msg: string | null
  meta: PagedMeta | null
}

export interface PokemonAbility {
  name: string
  slot: number
  isHidden: boolean
}

export interface PokemonListItem {
  pokeApiId: number
  name: string
  spriteUrl: string | null
  /**
   * Official shiny artwork. NULL is legitimate and common: a form PokeAPI has no shiny art for,
   * and — on collection entries — a row synced before the backend started storing it. Never render
   * it directly; go through `resolveSpriteUrl` (src/lib/Sprite.ts), which owns the fallback rule.
   */
  shinySpriteUrl: string | null
  category: string | null
  weight: number
  abilities: PokemonAbility[]
}

export interface PokemonStat {
  name: string
  value: number
}

export interface PokemonDetail extends PokemonListItem {
  height: number
  description: string | null
  types: string[]
  stats: PokemonStat[]
  evolutionChain: string[]
}

export interface LocalPokemon {
  id: string
  pokeApiId: number
  name: string
  spriteUrl: string | null
  /** See PokemonListItem.shinySpriteUrl — null on every entry synced before the backend stored it. */
  shinySpriteUrl: string | null
  category: string | null
  weight: number | null
  description: string | null
  localizedName: string | null
  region: string | null
  classificationTag: string | null
  abilities: PokemonAbility[]
  /** When the caller added this entry to their collection — the "captured on" date. */
  capturedAt: string
  createdAt: string
  updatedAt: string
}

/** Whitelisted, client-editable fields on a local collection entry. */
export interface UpdatePokemonPayload {
  localizedName?: string
  region?: string
  classificationTag?: string
  description?: string
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export interface AuthCredentials {
  email: string
  password: string
}

/** Ball identifiers are a closed set defined by the backend catalogue. */
export type BallType = 'poke' | 'great' | 'ultra' | 'master'

export interface BallCatalogueEntry {
  type: BallType
  name: string
  price: number
  catchRate: number
}

export interface WalletBall {
  type: BallType
  quantity: number
}

/** `balls` always carries all four types in catalogue order, zero-quantity included. */
export interface Wallet {
  credits: number
  balls: WalletBall[]
}

/**
 * What GET /api/economy/wallet answers: the wallet plus the daily-bonus state and the safety-net
 * verdict for THIS read.
 *
 * Deliberately a separate type from `Wallet` rather than three more fields on it, because ONLY the
 * read carries them — buy, spin, daily and release all echo the bare wallet. Folding them into
 * `Wallet` would let a caller read `wallet.dailyAvailable` off a spin result and be handed
 * `undefined` where the type promised a boolean.
 */
export interface WalletStatus extends Wallet {
  dailyAvailable: boolean
  /** ISO-8601, and null exactly when `dailyAvailable` is true — nothing to count down to. */
  nextDailyAt: string | null
  /**
   * True ONLY on the read that granted the emergency balls to a broke, ball-less trainer, never on
   * the reads after it. So it is an EVENT arriving on a query, not a state to render.
   */
  safetyNetGranted: boolean
}

/** POST /api/economy/daily: the credited wallet plus the instant the bonus unlocks again. */
export interface DailyClaimResult extends Wallet {
  nextClaimAt: string
}

/** POST /api/pokemons/local/{entryId}/release: what letting the pokemon go paid, and the new purse. */
export interface ReleaseResult {
  creditsAwarded: number
  wallet: Wallet
}

export interface BuyBallsRequest {
  ballType: BallType
  quantity: number
}

export type SpinOutcome = 'jackpot' | 'triple' | 'pair' | 'none'

export interface SpinResult {
  reels: number[]
  outcome: SpinOutcome
  payout: number
  wallet: Wallet
}

export interface SpinHistoryEntry {
  id: string
  reels: number[]
  cost: number
  payout: number
  outcome: SpinOutcome
  createdAt: string
}

export interface CatchRequest {
  id: number
  ballType: BallType
}

/** `caught: false` is a normal 200 — the ball was spent and the pokemon escaped. */
export interface CatchResult {
  caught: boolean
  ballType: BallType
  remainingBalls: number
  chance: number
  /** Credits paid for a landed throw: more for a species new to the collection, 0 on an escape. */
  creditsAwarded: number
  entry: LocalPokemon | null
}
