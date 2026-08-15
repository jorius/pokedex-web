// External
import { useCallback, useEffect, useRef, useState } from 'react'

// Store
import type { SpinResult } from '../../store/Types'

// Components
import { IDLE_REELS } from './SlotSymbols'

/** How long the drums turn before the first one is allowed to stop, however fast the server was. */
const MIN_SPIN_MS = 700

/** Gap between one drum stopping and the next — left, middle, right. */
const STAGGER_MS = 400

function prefersReducedMotion(): boolean {
  // Read per spin, not at mount: flipping the OS setting mid-session takes effect on the next pull.
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface SlotSequenceOptions {
  /** Fires the spin. Resolves with the server's result, rejects with the API error shape. */
  onSpin: () => Promise<SpinResult>
  /** Called once the LAST drum has stopped — the moment the outcome becomes public. */
  onRevealed: (result: SpinResult) => void
  onError: (error: unknown) => void
}

export interface SlotSequence {
  /** What each drum is showing right now; entries land one at a time, left to right. */
  reels: number[]
  /** Per-drum roll state — the stagger lives here. */
  spinningReels: boolean[]
  /** The revealed outcome, or null while idle or mid-spin. */
  result: SpinResult | null
  /** True from the click until the last drum stops. Drives the button and freezes the balance. */
  isSpinning: boolean
  start: () => void
}

/**
 * Drives the three drums and the spin request as ONE sequence.
 *
 * The request goes out with the drums, so a fast network still gets a full roll and a slow one
 * never freezes the machine. The reels then stop LEFT TO RIGHT, one every STAGGER_MS, and the
 * outcome is only announced when the third lands — the stagger is the whole drama of a slot
 * machine, and revealing the result before the last reel stops throws it away.
 *
 * Under `prefers-reduced-motion: reduce` there is no roll and no stagger: the drums show the
 * result and the panel appears with it, in one step.
 */
export function useSlotSequence({ onSpin, onRevealed, onError }: SlotSequenceOptions): SlotSequence {
  const [reels, setReels] = useState<number[]>([...IDLE_REELS])
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false])
  const [result, setResult] = useState<SpinResult | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)

  const timersRef = useRef<number[]>([])
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    const timers = timersRef.current
    return (): void => {
      isMountedRef.current = false
      timers.forEach((id) => window.clearTimeout(id))
      timers.length = 0
    }
  }, [])

  const schedule = useCallback((delayMs: number, action: () => void): void => {
    const id = window.setTimeout(() => {
      if (isMountedRef.current) action()
    }, delayMs)
    timersRef.current.push(id)
  }, [])

  const start = useCallback((): void => {
    if (isSpinning) return
    setIsSpinning(true)
    setResult(null)

    const isReduced = prefersReducedMotion()
    if (!isReduced) setSpinningReels([true, true, true])
    const startedAt = Date.now()

    // Stops drum `index` on the value the server rolled for it.
    function land(index: number, spin: SpinResult): void {
      setSpinningReels((current) => current.map((value, position) => (position === index ? false : value)))
      setReels((current) => current.map((value, position) => (position === index ? spin.reels[index] : value)))
    }

    void onSpin()
      .then((spin) => {
        if (!isMountedRef.current) return

        if (isReduced) {
          setSpinningReels([false, false, false])
          setReels([...spin.reels])
          setResult(spin)
          setIsSpinning(false)
          onRevealed(spin)
          return
        }

        // Whatever is left of the minimum roll — a 30ms response must not produce a 30ms spin.
        const remainder = Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt))
        schedule(remainder, () => land(0, spin))
        schedule(remainder + STAGGER_MS, () => land(1, spin))
        schedule(remainder + STAGGER_MS * 2, () => {
          land(2, spin)
          setResult(spin)
          setIsSpinning(false)
          onRevealed(spin)
        })
      })
      .catch((error: unknown) => {
        if (!isMountedRef.current) return
        // A refused spin (409, network) stops the drums where they are — no result, no stagger.
        setSpinningReels([false, false, false])
        setIsSpinning(false)
        onError(error)
      })
  }, [isSpinning, onSpin, onRevealed, onError, schedule])

  return { reels, spinningReels, result, isSpinning, start }
}
