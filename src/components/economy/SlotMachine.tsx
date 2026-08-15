// External
import { Coins, Loader2 } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

// Hooks
import { useSpinLockedValue } from '../../hooks/UseSpinLockedValue'
import { useToast } from '../../hooks/UseToast'

// Lib
import { resolveApiErrorMessage } from '../../lib/ApiErrorMessage'
import { cn } from '../../lib/Cn'

// Store
import type { ApiErrorShape } from '../../store/Api'
import { useAppDispatch } from '../../store/Hooks'
import type { SpinResult } from '../../store/Types'
import { spinLockEngaged, spinLockReleased } from '../../store/UiSlice'

// Styles
import './SlotsMachine.css'

// Components
import { Button } from '../ui/Button'
import { useSpinSlotsMutation } from '../../store/Api'
import { formatCredits } from './EconomyFormat'
import { SlotReel } from './SlotReel'
import { SlotResultPanel } from './SlotResultPanel'
import { SPIN_COST } from './SlotSymbols'
import { useSlotSequence } from './UseSlotSequence'

/** Marquee bulbs. Enough to read as a chase, few enough to survive a 412px cabinet. */
const BULB_COUNT = 12

const REEL_COUNT = 3

interface SlotMachineProps {
  /** The caller's balance, straight from the wallet query. */
  credits: number
  /** Whether the daily bonus is claimable — only ever shown as part of the broke hint below. */
  isDailyAvailable: boolean
}

/**
 * The cabinet: marquee, three drums behind a payline, the display panel and the control deck.
 *
 * THE BALANCE IS FROZEN FOR THE LENGTH OF A SPIN. The spin mutation invalidates the Wallet tag the
 * instant the server answers, which is up to a second before the third reel stops — left alone, the
 * meter would jump by the payout while the drums were still turning and spoil its own reveal. It is
 * pinned at the pre-spin figure from the click until the last drum lands, then released, so the
 * number ticks over on exactly the beat the result appears.
 *
 * The hold is a STORE FLAG (`ui.isSpinLocked`), not local state, because this meter is not the only
 * thing rendering the balance: the header's WalletChip subscribes to the same wallet query and used
 * to give the outcome away about a second early. Engaging the lock here pins both at once; see
 * UiSlice.ts and useSpinLockedValue.
 */
export function SlotMachine({ credits, isDailyAvailable }: SlotMachineProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const dispatch = useAppDispatch()
  const [spinSlots] = useSpinSlotsMutation()

  const handleSpin = useCallback((): Promise<SpinResult> => spinSlots().unwrap(), [spinSlots])

  const handleRevealed = useCallback((spin: SpinResult): void => {
    dispatch(spinLockReleased())
    showToast({
      message: spin.payout > 0
        ? t(`slots.toast.${spin.outcome}`, { amount: formatCredits(spin.payout, i18n.language) })
        : t('slots.toast.none'),
      variant: spin.outcome === 'none' ? 'info' : 'success',
    })
  }, [dispatch, showToast, t, i18n.language])

  const handleError = useCallback((error: unknown): void => {
    dispatch(spinLockReleased())
    showToast({ message: resolveApiErrorMessage(error as ApiErrorShape, t), variant: 'error' })
  }, [dispatch, showToast, t])

  // Leaving the Game Corner mid-spin unmounts the only component that would ever release the lock,
  // which would leave the header's chip pinned for the rest of the session.
  useEffect(() => {
    return (): void => { dispatch(spinLockReleased()) }
  }, [dispatch])

  const { reels, spinningReels, result, isSpinning, start } = useSlotSequence({
    onSpin: handleSpin,
    onRevealed: handleRevealed,
    onError: handleError,
  })

  const shownCredits = useSpinLockedValue(credits)
  const canAfford = credits >= SPIN_COST
  const isJackpot = result?.outcome === 'jackpot'

  function handleClick(): void {
    // Engage BEFORE the mutation fires: the wallet query can be invalidated the moment the server
    // answers, and a lock that arrives after that has already let the payout through.
    dispatch(spinLockEngaged())
    start()
  }

  return (
    <section className="overflow-hidden rounded-lg border-2 bg-card shadow-lg">
      {/* Marquee. Same --primary the header stripe uses, so the cabinet reads as part of this
          Pokedex rather than a widget dropped into it. */}
      <div className="flex items-center justify-between gap-3 bg-primary px-4 py-2 text-primary-foreground">
        <h2 className="m-0 font-display text-base font-bold uppercase tracking-[0.25em] sm:text-lg">{t('slots.marquee')}</h2>
        <span aria-hidden className="flex shrink-0 items-center gap-1.5">
          {Array.from({ length: BULB_COUNT }, (_, index) => (
            <span
              key={index}
              className={cn('size-1.5 rounded-full bg-primary-foreground/45', isJackpot && 'slots-bulb--live')}
            />
          ))}
        </span>
      </div>

      {/* The screen: drums, payline, display panel. Held to a column narrower than the cabinet so
          the windows stay roughly square — a slot drum that is twice as wide as it is tall reads as
          a filmstrip, not a reel. */}
      <div className={cn('slots-screen relative flex flex-col gap-4 bg-muted p-3 sm:p-6', isJackpot && 'slots-flash')}>
        {/* The bezel: one recessed frame holding all three drums, so they read as one mechanism
            instead of three cards that happen to sit side by side. */}
        <div className="relative mx-auto w-full max-w-lg rounded-lg border-2 bg-background/70 p-2 shadow-inner sm:p-3">
          <div className="relative flex items-stretch gap-2 sm:gap-3">
            {Array.from({ length: REEL_COUNT }, (_, index) => (
              <SlotReel key={index} index={index} isSpinning={spinningReels[index]} value={reels[index]} />
            ))}
            {/* The payline, drawn ACROSS the three windows at symbol height — the line a machine
                pays on. It pulses while the drums turn and goes still with them. */}
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute -inset-x-1.5 top-1/2 flex -translate-y-1/2 items-center',
                isSpinning ? 'slots-payline--live' : 'opacity-60',
              )}
            >
              <span className="size-2 shrink-0 rotate-45 bg-accent" />
              <span className="h-0.5 flex-1 bg-accent/70" />
              <span className="size-2 shrink-0 rotate-45 bg-accent" />
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg">
          <SlotResultPanel result={result} isSpinning={isSpinning} />
        </div>
      </div>

      {/* Control deck. */}
      <div className="flex flex-col gap-3 border-t-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-2.5 rounded-md border-2 bg-muted px-3 py-2">
          <Coins className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('economy.credits')}</span>
            <span className="font-display text-xl font-bold tabular-nums">{formatCredits(shownCredits, i18n.language)}</span>
          </span>
        </div>

        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
          <Button
            size="lg"
            disabled={isSpinning || !canAfford}
            onClick={handleClick}
            className="h-14 w-full flex-col gap-0 px-8 sm:w-auto sm:min-w-56"
          >
            <span className="flex items-center gap-2 font-display text-lg font-bold tracking-[0.2em]">
              {isSpinning && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />}
              {isSpinning ? t('slots.spinning') : t('slots.spin')}
            </span>
            <span className="text-[11px] font-normal tracking-wide opacity-85">
              {t('slots.cost', { amount: formatCredits(SPIN_COST, i18n.language) })}
            </span>
          </Button>
          {!canAfford && (
            <p role="status" className="text-center text-xs text-destructive sm:text-right">
              {t('slots.needCredits', { amount: formatCredits(SPIN_COST, i18n.language) })}{' '}
              {/* The only way out of an empty wallet, so it gets a real tap box on a phone. */}
              <Link to="/shop" className="inline-flex min-h-10 items-center rounded-md px-1 font-bold underline xl:min-h-0 xl:px-0">
                {t('slots.goToShop')}
              </Link>
              {/* A broke player being sent to the shop should be told there is something FREE
                  waiting there — otherwise "top up" reads as "go and spend money you don't have". */}
              {isDailyAvailable && <span className="block text-muted-foreground">{t('slots.dailyReady')}</span>}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
