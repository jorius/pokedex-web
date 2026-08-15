// External
import { useState } from 'react'

// Store
import { useAppSelector } from '../store/Hooks'

/**
 * Holds a wallet-derived value still for the length of a slots spin.
 *
 * The spin mutation invalidates the 'Wallet' tag the instant the server answers, which is up to a
 * second before the third reel lands. Anything rendering the balance therefore learns the payout
 * early — the header's WalletChip was announcing the win while the drums were still turning. This
 * hook is the single mechanism both the chip and the cabinet's own meter use: while
 * `ui.isSpinLocked` is set they keep rendering the figure captured at the click, and they tick over
 * together on the beat the result appears.
 *
 * The capture uses React's documented "adjust state when inputs change" pattern (the same one
 * BrowsePage uses to reset accumulation): the render in which the lock flips to true still sees the
 * PRE-spin value, so that is the one recorded. No effect is involved, which matters — an effect
 * would run a frame late, i.e. potentially after the invalidated query had already delivered.
 */
export function useSpinLockedValue<T>(value: T): T {
  const isSpinLocked = useAppSelector((state) => state.ui.isSpinLocked)
  const [held, setHeld] = useState<T>(value)
  const [wasLocked, setWasLocked] = useState(isSpinLocked)

  const isRisingEdge = isSpinLocked && !wasLocked
  if (wasLocked !== isSpinLocked) {
    setWasLocked(isSpinLocked)
    // Only the rising edge captures. Releasing needs no bookkeeping: the live value takes over
    // below, and holding a stale copy after the lock lifts is exactly the bug being fixed.
    if (isSpinLocked) setHeld(value)
  }

  // On the rising edge `value` IS the figure being captured, so it is also what this render
  // shows — no dependence on the queued setHeld having landed yet.
  return isSpinLocked && !isRisingEdge ? held : value
}
