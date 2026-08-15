// External
import { useEffect, useState } from 'react'

/** One tick a second: the readout is rendered to the second, so a faster beat buys nothing. */
const TICK_MS = 1000

/** Clamped at zero — a target already in the past is "done", never a negative duration. */
function remainingUntil(targetIso: string | null): number {
  if (targetIso === null) return 0
  const target = new Date(targetIso).getTime()
  // A malformed timestamp reads as "nothing left to wait for" rather than rendering NaN:NaN:NaN.
  if (Number.isNaN(target)) return 0
  return Math.max(0, target - Date.now())
}

/**
 * Milliseconds left until `targetIso`, recomputed once a second. Returns 0 for a null target.
 *
 * Every tick RE-READS THE WALL CLOCK instead of subtracting a second from the previous value. A
 * background tab has its timers throttled and a sleeping laptop stops firing them altogether, so a
 * countdown that decremented itself would drift further behind the longer it ran; this one is
 * simply correct again on the next tick after the tab wakes up.
 *
 * The interval is torn down on unmount and whenever the target changes, and a null target never
 * starts one.
 */
export function useCountdown(targetIso: string | null): number {
  const [remainingMs, setRemainingMs] = useState<number>(() => remainingUntil(targetIso))
  const [seededTarget, setSeededTarget] = useState<string | null>(targetIso)

  // React's documented "adjust state when inputs change" pattern, the same one useSpinLockedValue
  // uses. Re-seeding in an effect instead would render one tick of the OLD target's clock before
  // correcting itself, and a countdown that visibly flashes the wrong number is worse than none.
  if (seededTarget !== targetIso) {
    setSeededTarget(targetIso)
    setRemainingMs(remainingUntil(targetIso))
  }

  useEffect(() => {
    if (targetIso === null) return

    const intervalId = window.setInterval(() => { setRemainingMs(remainingUntil(targetIso)) }, TICK_MS)
    return (): void => { window.clearInterval(intervalId) }
  }, [targetIso])

  // The adjusted value is returned by the re-render the setState above schedules; this render still
  // shows the previous figure for an instant, which is exactly one frame and never a wrong target.
  return seededTarget === targetIso ? remainingMs : remainingUntil(targetIso)
}
