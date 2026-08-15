// Which of an entity's two artworks is on screen, and why. Every sprite in the app — browse cards,
// detail artwork, evolution mini-cards, collection entries, the search panel, the sprite the ball
// absorbs — goes through here, so the shiny fallback rule exists exactly once.

/**
 * The shiny state of the artwork that ended up on screen.
 *
 * `fallback` is the one that matters: shiny mode is ON but this entity has no shiny artwork, so
 * the normal sprite is standing in. That happens for two legitimate reasons — a form PokeAPI has
 * no shiny art for, and a collection entry synced before the backend stored the field — and in
 * both cases the sprite must NOT be a broken image. The state is what lets the UI say so quietly
 * (see ShinyOverlay) instead of leaving the user wondering why that one looks normal.
 */
export type ShinyState = 'off' | 'shiny' | 'fallback'

/** Anything the API hands back with a pair of sprites: list item, detail, or collection entry. */
export interface ShinySpriteSource {
  spriteUrl: string | null
  shinySpriteUrl: string | null
}

export interface ResolvedSprite {
  /** The URL to render, already fallen back. Null only when the entity has no artwork at all. */
  url: string | null
  shiny: ShinyState
}

/**
 * Picks the artwork for the current view preference.
 *
 * The rule, in one place: shiny mode off renders the normal sprite; shiny mode on renders the
 * shiny one when it exists and the normal one when it does not. `url` is therefore null only when
 * the entity is missing BOTH — the case every call site already draws its "?" glyph for.
 */
export function resolveSpriteUrl(entity: ShinySpriteSource, shinyMode: boolean): ResolvedSprite {
  if (!shinyMode) return { url: entity.spriteUrl, shiny: 'off' }
  if (entity.shinySpriteUrl !== null) return { url: entity.shinySpriteUrl, shiny: 'shiny' }
  return { url: entity.spriteUrl, shiny: 'fallback' }
}
