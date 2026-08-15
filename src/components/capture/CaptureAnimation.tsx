// External
import type { CSSProperties, JSX } from 'react'

// Hooks
import { useTheme } from '../../hooks/UseTheme'
import type { CapturePhase } from '../../hooks/UseCaptureSequence'

// Lib
import { cn } from '../../lib/Cn'

// Components
import { PokeballMark } from '../brand/PokeballMark'
import { THEME_POKEBALL } from '../brand/PokeballPalettes'
import type { PokeballVariant } from '../brand/PokeballPalettes'

// Styles — keyframes for this sequence only, kept out of the global stylesheet.
import './CaptureAnimation.css'

/** Seven sparks, deliberately not evenly divisible into a neat cross — a burst, not a star. */
const SPARK_ANGLES = [0, 52, 104, 156, 208, 260, 312]

/** Nominal size; the stylesheet scales the mark to the responsive `--capture-ball` box. */
const BALL_SIZE = 72

interface CaptureAnimationProps {
  phase: CapturePhase
  /**
   * The ball being thrown — the one picked on the belt. Omitted (no wallet to pick from, or a
   * ball whose own art has not landed yet) it falls back to the ACTIVE THEME'S ball, which is
   * what every throw used before the picker existed.
   */
  variant?: PokeballVariant
}

/**
 * The throw, drawn with the ball that was actually picked. Purely decorative and
 * pointer-transparent: the outcome is announced by the toast and the captured badge, so this whole
 * layer is aria-hidden and never blocks the page.
 *
 * Renders nothing at all in the 'idle' phase — which is the only phase a reduced-motion run has.
 */
export function CaptureAnimation({ phase, variant: thrownVariant }: CaptureAnimationProps): JSX.Element | null {
  const { theme } = useTheme()
  const variant = thrownVariant ?? THEME_POKEBALL[theme]

  if (phase === 'idle') return null

  const isFlashing = phase === 'absorb' || phase === 'success'

  return (
    <div className="capture-stage" aria-hidden>
      {isFlashing && <span className={cn('capture-flash', phase === 'absorb' ? 'capture-flash--absorb' : 'capture-flash--success')} />}

      <div className="capture-anchor">
        <div className={cn('capture-ball', `capture-ball--${phase}`)}>
          {phase === 'fail' ? (
            // Two clipped copies of the same mark: the ball splitting along its band.
            <>
              <span className="capture-ball-half capture-ball-half--top">
                <PokeballMark variant={variant} size={BALL_SIZE} />
              </span>
              <span className="capture-ball-half capture-ball-half--bottom">
                <PokeballMark variant={variant} size={BALL_SIZE} />
              </span>
            </>
          ) : (
            <div className="capture-ball-body">
              <PokeballMark variant={variant} size={BALL_SIZE} />
            </div>
          )}

          {phase === 'success' && (
            <>
              <span className="capture-burst" />
              {SPARK_ANGLES.map((angle) => (
                <span key={angle} className="capture-spark" style={{ '--capture-angle': `${String(angle)}deg` } as CSSProperties} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
