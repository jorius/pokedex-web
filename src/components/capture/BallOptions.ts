// Store
import type { BallCatalogueEntry, BallType, Wallet } from '../../store/Types'

// Components
import { POKEBALL_PALETTES } from '../brand/PokeballPalettes'
import type { PokeballVariant } from '../brand/PokeballPalettes'

/** One rung of the picker's ladder: a ball's catalogue identity joined to what the wallet holds. */
export interface BallOption {
  type: BallType
  /** Server-provided display name ("Poké Ball"). Ball names are DATA, never hard-coded UI copy. */
  name: string
  /** The ball's own base rate (0..1), BEFORE the server's per-pokemon rarity multiplier. */
  catchRate: number
  quantity: number
}

/**
 * Joins the catalogue (identity + price order) to the wallet (stock).
 *
 * The catalogue is the source of ORDER — cheapest first is part of the backend contract, and the
 * picker renders that order as a visible ladder. A wallet that arrives without a catalogue still
 * renders: names and odds simply stay empty, so a failed catalogue request degrades the hint
 * rather than the ability to throw. No wallet at all (anonymous, or a backend without the economy
 * endpoints) yields an empty list, which is the picker's "don't render" signal.
 */
export function toBallOptions(wallet: Wallet | undefined, catalogue: BallCatalogueEntry[] | undefined): BallOption[] {
  if (wallet === undefined) return []

  const quantityOf = (type: BallType): number => wallet.balls.find((ball) => ball.type === type)?.quantity ?? 0

  if (catalogue !== undefined && catalogue.length > 0) {
    return catalogue.map((entry) => ({ type: entry.type, name: entry.name, catchRate: entry.catchRate, quantity: quantityOf(entry.type) }))
  }

  return wallet.balls.map((ball) => ({ type: ball.type, name: '', catchRate: 0, quantity: ball.quantity }))
}

/** The cheapest ball with stock — the list is already cheapest-first, so this is a find(). */
export function cheapestOwned(options: BallOption[]): BallOption | undefined {
  return options.find((option) => option.quantity > 0)
}

export function findOption(options: BallOption[], type: BallType): BallOption | undefined {
  return options.find((option) => option.type === type)
}

/**
 * The art a shop ball is drawn with. The four catalogue balls (poke/great/ultra/master) arrive in
 * the palette set from a parallel change; whenever one has no palette of its own the caller's
 * fallback (the active theme's ball) is drawn instead, so the picker never renders a hole. The
 * check is against the record itself rather than a hard-coded list, which is what lets real art
 * take over the moment it exists.
 */
export function ballArtVariant(ballType: BallType, fallback: PokeballVariant): PokeballVariant {
  // The `unknown` bridge keeps this compiling whether or not the two unions currently overlap.
  const candidate = ballType as unknown as PokeballVariant
  return Object.hasOwn(POKEBALL_PALETTES, candidate) ? candidate : fallback
}
