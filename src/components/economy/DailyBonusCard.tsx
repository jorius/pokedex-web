// External
import { Clock, Gift, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useCountdown } from '../../hooks/UseCountdown'
import { useToast } from '../../hooks/UseToast'

// Lib
import { resolveApiErrorMessage } from '../../lib/ApiErrorMessage'
import { cn } from '../../lib/Cn'

// Store
import type { ApiErrorShape } from '../../store/Api'

// Components
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useClaimDailyMutation } from '../../store/Api'
import { formatCountdown, formatCredits } from './EconomyFormat'
import { DAILY_BONUS } from './EconomyRewards'

interface DailyBonusCardProps {
  /** The server's verdict from the wallet read, never a locally derived one. */
  isAvailable: boolean
  /** ISO-8601 unlock instant. Null exactly when `isAvailable` is true. */
  nextClaimAt: string | null
  /**
   * Re-read the wallet: this card's view of the daily state has been proven stale. Fired when a
   * running countdown reaches zero, and when a claim comes back 409.
   */
  onWalletStale: () => void
}

/**
 * The clerk's daily hand-out, sitting above the counter.
 *
 * Deliberately NOT built like the four ball cards below it: those are merchandise on a hatched
 * shelf, this is an offer being made to you. It gets the secondary tint, a primary-tinted border
 * while it is claimable and an accent pip — so the eye separates "something is waiting for me"
 * from "things I can buy" before reading a word of it.
 *
 * Two states, one card: claimable (gift, live button naming the amount) and cooling down (clock,
 * dead button, a live HH:MM:SS readout of the wait).
 */
export function DailyBonusCard({ isAvailable, nextClaimAt, onWalletStale }: DailyBonusCardProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const [claimDaily, { isLoading: isClaiming }] = useClaimDailyMutation()

  // A null target parks the hook without ever starting an interval — there is nothing to count
  // down to while the bonus is claimable.
  const remainingMs = useCountdown(isAvailable ? null : nextClaimAt)
  const hasElapsed = !isAvailable && nextClaimAt !== null && remainingMs === 0

  /*
   * The wallet was read while the bonus was still locked, so nothing on its own would ever flip
   * `isAvailable` on a page left open past the unlock: the clock would sit at 00:00:00 next to a
   * dead button until the visitor thought to reload. Ask the server again the moment it runs out.
   *
   * `hasElapsed` only transitions false -> true once per target, and the caller's handler is
   * required to be stable, so this settles after exactly one refetch rather than looping.
   */
  useEffect(() => {
    if (hasElapsed) onWalletStale()
  }, [hasElapsed, onWalletStale])

  const amount = formatCredits(DAILY_BONUS, i18n.language)

  function handleClaim(): void {
    void claimDaily()
      .unwrap()
      .then(() => { showToast({ message: t('economy.daily.claimed', { amount }), variant: 'success' }) })
      .catch((error: unknown) => {
        const apiError = error as ApiErrorShape
        showToast({ message: resolveApiErrorMessage(apiError, t), variant: 'error' })
        // A 409 ("Daily bonus already claimed") is the server's authority on the cooldown — an
        // enabled button only means THIS tab had not seen the claim the phone in your pocket made.
        // A rejected mutation fulfils nothing, so its tag invalidation never runs and the button
        // would go on offering a bonus the server has already refused; ask the wallet again. Same
        // reasoning as the 409 handling on the detail page's throw.
        if (apiError.status === 409) onWalletStale()
      })
  }

  function claimLabel(): string {
    if (!isAvailable) return t('economy.daily.claimedLabel')
    return isClaiming ? t('economy.daily.claiming') : t('economy.daily.claim', { amount })
  }

  return (
    <Card className={cn('flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5', isAvailable && 'border-primary/40 shadow-md')}>
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <span
          aria-hidden
          className={cn(
            'relative flex size-14 shrink-0 items-center justify-center rounded-full',
            isAvailable ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {isAvailable ? <Gift className="size-7" /> : <Clock className="size-7" />}
          {/* The one decorative flourish, and the token contract reserves --accent for exactly this
              kind of tick. Ringed in --card so it reads as a pip on the well, not a floating dot. */}
          {isAvailable && (
            <span className="absolute right-0 top-0 size-3 animate-pulse rounded-full border-2 border-card bg-accent motion-reduce:animate-none" />
          )}
        </span>

        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="font-display text-lg font-bold leading-tight">{t('economy.daily.title')}</h2>
          {isAvailable ? (
            <p className="text-sm text-muted-foreground">{t('economy.daily.description', { amount })}</p>
          ) : (
            /* role="timer" is read on request instead of on every tick. An aria-live region here
               would recite the clock out loud once a second for the whole 24 hours. */
            <p role="timer" className="text-sm tabular-nums text-muted-foreground">
              {t('economy.daily.nextIn', { time: formatCountdown(remainingMs) })}
            </p>
          )}
        </div>
      </div>

      <Button className="w-full shrink-0 sm:w-auto" disabled={!isAvailable || isClaiming} onClick={handleClaim}>
        {isClaiming ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Gift aria-hidden />}
        <span className="tabular-nums">{claimLabel()}</span>
      </Button>
    </Card>
  )
}
