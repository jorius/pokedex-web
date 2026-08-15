// External
import type { CSSProperties, JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

// Components
import { SLOT_POOL, artworkUrl } from './SlotSymbols'

/** Per-reel roll speeds. Three different durations stop the drums moving as one solid block. */
const REEL_SPEEDS_MS = [300, 340, 380]

/** The drum: the pool plus a repeat of its first symbol, which is what makes the loop seamless. */
const STRIP = [...SLOT_POOL, SLOT_POOL[0]]

interface SlotReelProps {
  /** Which drum this is (0..2) — picks the roll speed and names the reel for assistive tech. */
  index: number
  isSpinning: boolean
  /** The symbol showing while the drum is still. */
  value: number
}

/**
 * One drum behind glass.
 *
 * Two mutually exclusive renderings, never a crossfade: while spinning it is a translating strip of
 * the whole pool under a blur, and when it stops it is a single sprite playing the landing bounce.
 * Swapping (rather than easing the strip to a stop) is deliberate — landing a continuously
 * animating strip on an exact symbol needs the animation's phase, which CSS will not hand back,
 * and the bounce reads as a mechanical stop far more convincingly than a decelerating scroll.
 */
export function SlotReel({ index, isSpinning, value }: SlotReelProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div
      // The result is announced once, as a whole, by the outcome panel — three reels each shouting
      // their own id would be noise, so the live region ends here.
      aria-label={t('slots.reelLabel', { index: index + 1 })}
      className="slots-window relative flex-1 rounded-md border-2 bg-card shadow-inner"
    >
      {isSpinning ? (
        <div
          className="slots-strip slots-strip--spin"
          style={{ '--slots-pool': SLOT_POOL.length, '--slots-speed': `${String(REEL_SPEEDS_MS[index])}ms` } as CSSProperties}
        >
          {STRIP.map((pokeApiId, cellIndex) => (
            <div key={`${String(pokeApiId)}-${String(cellIndex)}`} className="slots-cell">
              <img src={artworkUrl(pokeApiId)} alt="" aria-hidden draggable={false} />
            </div>
          ))}
        </div>
      ) : (
        // Keyed on the value so a repeat of the same symbol still replays the landing bounce.
        <div key={value} className="slots-cell slots-face--land">
          <img src={artworkUrl(value)} alt="" aria-hidden draggable={false} />
        </div>
      )}
      {/* The glass: a highlight down the top third and a shadow into the bottom edge, so symbols
          read as sitting BEHIND a window rather than printed on the card. */}
      <div aria-hidden className={cn('pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground/10 via-transparent to-foreground/15')} />
    </div>
  )
}
