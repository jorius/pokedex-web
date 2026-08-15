// External
import type { JSX } from 'react'

// Store
import type { BallType } from '../../store/Types'

// Components
import { PokeballMark } from '../brand/PokeballMark'
import type { PokeballVariant } from '../brand/PokeballPalettes'

/**
 * Catalogue ball type -> brand mark variant. The two vocabularies happen to spell the four shop
 * balls the same way, but they are different domains (a backend catalogue key vs. a piece of art),
 * so the bridge is explicit: if the backend ever renames a type, this map is the single line that
 * has to change and TypeScript points straight at it.
 */
const BALL_VARIANTS: Record<BallType, PokeballVariant> = {
  poke: 'poke',
  great: 'great',
  ultra: 'ultra',
  master: 'master',
}

interface BallArtProps {
  type: BallType
  /** Rendered square size in px — the mark is authored on a 24x24 grid and scales cleanly. */
  size?: number
  className?: string
}

export function BallArt({ type, size = 24, className }: BallArtProps): JSX.Element {
  return <PokeballMark variant={BALL_VARIANTS[type]} size={size} className={className} />
}
