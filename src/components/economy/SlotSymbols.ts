/**
 * The reel pool, mirrored from the backend's own SLOT_REEL_POOL (EconomyRules): 9 common species
 * and 3 legendaries. Only the DISTINCT ids are listed — the server expresses its odds by repeating
 * entries, and repeating them here would only make the drum longer, not the picture different.
 *
 * Mirroring the real pool matters: a spin can only ever return one of these ids, so the symbols
 * flying past while the reels roll are the same symbols that can land. A pool invented for the
 * animation would show the player species the machine cannot pay out on.
 */
export const SLOT_POOL: readonly number[] = [1, 4, 7, 25, 39, 52, 54, 133, 143, 150, 151, 249]

/** Three distinct symbols, so a machine at rest never sits on a fake win. */
export const IDLE_REELS: readonly number[] = [25, 133, 143]

/** A spin costs this; the backend charges it and refuses below it (409). */
export const SPIN_COST = 100

/** PokeAPI's official artwork, addressed by id — the same source the browse grid already uses. */
export function artworkUrl(pokeApiId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${String(pokeApiId)}.png`
}
