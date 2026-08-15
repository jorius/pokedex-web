// External
import { useEffect, useRef, useState } from 'react'

/**
 * Where the throw is in its arc. The animation component maps each phase to a keyframe set;
 * 'idle' renders nothing at all, which is also the only phase a reduced-motion run ever sees.
 */
export type CapturePhase = 'idle' | 'throw' | 'absorb' | 'wobble' | 'holding' | 'success' | 'fail'

/** Ball arcs in from below the card. */
const THROW_MS = 600

/** Sprite flashes and shrinks into the ball. */
const ABSORB_MS = 250

/** Drop to the card floor plus the three-shake wobble. */
const WOBBLE_MS = 1200

/** How long the success burst / break-out stays before the stage clears. */
const RESULT_HOLD_MS = 1500

/**
 * Cap on how long the outcome waits for a slow request AFTER the wobble has played out. Past it
 * the ball parks in a slow holding sway instead of shaking forever, and the real result lands
 * whenever the request finally settles.
 */
const REQUEST_GRACE_MS = 4000

type CaptureOutcome = { ok: true } | { ok: false; error: unknown }

export interface CaptureSequenceOptions {
  /** Fires the capture request. Resolves on success, rejects with the API error shape. */
  onCapture: () => Promise<unknown>
  onSuccess: () => void
  onFailure: (error: unknown) => void
}

export interface CaptureSequence {
  phase: CapturePhase
  /** True from the click until the outcome is known — drives the disabled/"Catching…" button. */
  isCatching: boolean
  start: () => void
}

function prefersReducedMotion(): boolean {
  // Read at throw time, not at mount: an OS-level change mid-session takes effect on the next throw.
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Drives the throw animation and the capture request as ONE sequence.
 *
 * The request starts in parallel with the ball leaving the hand, so a fast network still gets a
 * full throw and a slow one never blocks the visuals. The outcome is revealed once BOTH the wobble
 * has finished and the request has settled (see REQUEST_GRACE_MS for the slow-request escape).
 * Under `prefers-reduced-motion: reduce` the animation is skipped entirely — the phase never
 * leaves 'idle' and only the result callbacks fire.
 */
export function useCaptureSequence({ onCapture, onSuccess, onFailure }: CaptureSequenceOptions): CaptureSequence {
  const [phase, setPhase] = useState<CapturePhase>('idle')
  const [isCatching, setIsCatching] = useState(false)
  const timersRef = useRef<number[]>([])
  // Bumped by every start AND by unmount, so any awaited step from an older run (or from a
  // component that is already gone) bails instead of calling setState.
  const runIdRef = useRef(0)
  const isRunningRef = useRef(false)

  useEffect(() => () => {
    runIdRef.current += 1
    timersRef.current.forEach((id) => { clearTimeout(id) })
    timersRef.current = []
  }, [])

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      timersRef.current.push(window.setTimeout(resolve, ms))
    })
  }

  function clearTimers(): void {
    timersRef.current.forEach((id) => { clearTimeout(id) })
    timersRef.current = []
  }

  /** Reports the outcome and reopens the button. The result visual keeps playing after this. */
  function settle(outcome: CaptureOutcome): void {
    if (outcome.ok) onSuccess()
    else onFailure(outcome.error)
    isRunningRef.current = false
    setIsCatching(false)
  }

  async function run(runId: number): Promise<void> {
    // Settle-shaped so the promise is never left rejected while the animation plays out.
    const settled: Promise<CaptureOutcome> = onCapture().then(
      () => ({ ok: true }),
      (error: unknown) => ({ ok: false, error }),
    )

    if (prefersReducedMotion()) {
      const outcome = await settled
      if (runId !== runIdRef.current) return
      settle(outcome)
      return
    }

    setPhase('throw')
    await wait(THROW_MS)
    if (runId !== runIdRef.current) return

    setPhase('absorb')
    await wait(ABSORB_MS)
    if (runId !== runIdRef.current) return

    setPhase('wobble')
    await wait(WOBBLE_MS)
    if (runId !== runIdRef.current) return

    // Already settled during the throw? This resolves immediately. Otherwise the ball waits,
    // and past the grace window it drops into the holding sway until the request answers.
    let outcome = await Promise.race([settled, wait(REQUEST_GRACE_MS).then((): null => null)])
    if (runId !== runIdRef.current) return

    if (outcome === null) {
      setPhase('holding')
      outcome = await settled
      if (runId !== runIdRef.current) return
    }

    clearTimers()
    setPhase(outcome.ok ? 'success' : 'fail')
    settle(outcome)

    await wait(RESULT_HOLD_MS)
    if (runId !== runIdRef.current) return
    setPhase('idle')
  }

  function start(): void {
    // Double-click guard that does not depend on the button's disabled state having rendered yet.
    if (isRunningRef.current) return
    isRunningRef.current = true
    setIsCatching(true)

    const runId = runIdRef.current + 1
    runIdRef.current = runId
    // Only an unexpected throw lands here (request rejections are folded into the outcome) —
    // and only the CURRENT run may reopen the button, or a stale run would unlock a live one.
    void run(runId).catch(() => {
      if (runId !== runIdRef.current) return
      isRunningRef.current = false
      setIsCatching(false)
      setPhase('idle')
    })
  }

  return { phase, isCatching, start }
}
