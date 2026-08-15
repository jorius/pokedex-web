// Hooks
import type { CapturePhase } from '../../hooks/UseCaptureSequence'

/**
 * The class the page sprite wears for the current phase. The sprite belongs to the page, not to
 * the animation layer, so the two are joined here rather than by reaching across components:
 * it flashes into the ball, stays gone while the ball wobbles, and shakes back on a break-out.
 * Keyframes live in CaptureAnimation.css (loaded with the animation component).
 */
export function captureSpriteClassName(phase: CapturePhase): string | undefined {
  switch (phase) {
    case 'absorb':
      return 'capture-sprite--absorb'
    case 'wobble':
    case 'holding':
    case 'success':
      return 'capture-sprite--held'
    case 'fail':
      return 'capture-sprite--return'
    case 'idle':
    case 'throw':
      return undefined
  }
}
