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
