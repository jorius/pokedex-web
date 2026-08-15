// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

// Store
import type { SpinOutcome, SpinResult } from '../../store/Types'

// Components
import { formatCredits } from './EconomyFormat'
import { SPIN_COST } from './SlotSymbols'

/**
 * One style per outcome, and they are meant to be told apart across the room.
 *
 * Every pair is a theme's own AA-verified fill/foreground couple, which is why the jackpot borrows
 * --accent rather than inventing a gold: accent is the one token every theme reserves for its
 * signature partner colour (emerald's brass, sapphire's Kyogre crimson, pearl's Palkia violet), so
 * the biggest win in the game arrives in the loudest colour the active theme actually owns.
 */
const OUTCOME_STYLES: Record<SpinOutcome, string> = {
  jackpot: 'border-accent bg-accent text-accent-foreground slots-shine',
  triple: 'border-primary bg-primary text-primary-foreground',
  pair: 'border-success bg-success text-success-foreground',
  none: 'border-border bg-card text-muted-foreground',
}

interface SlotResultPanelProps {
  result: SpinResult | null
  isSpinning: boolean
}

/**
 * The machine's display panel. It is ALWAYS mounted — idle it reads the price of a pull, mid-spin
 * it reads as rolling, and on a result it becomes the win banner. A panel that appeared only on a
 * result would shove the reels up the page on every spin.
 */
export function SlotResultPanel({ result, isSpinning }: SlotResultPanelProps): JSX.Element {
  const { t, i18n } = useTranslation()

  if (isSpinning || result === null) {
    return (
      <div
        role="status"
        className="flex min-h-[4.5rem] items-center justify-center rounded-md border-2 border-dashed border-border bg-card px-4 py-3 text-center"
      >
        <p className="font-display text-sm tracking-wider text-muted-foreground">
          {isSpinning ? t('slots.rolling') : t('slots.idleHint', { amount: formatCredits(SPIN_COST, i18n.language) })}
        </p>
      </div>
    )
  }

  const isJackpot = result.outcome === 'jackpot'

  return (
    <div
      role="status"
      aria-live="polite"
      // Keyed on the outcome AND the reels so two jackpots in a row still replay the arrival.
      key={`${result.outcome}-${result.reels.join('-')}`}
      className={cn(
        'slots-panel--pop relative flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border-2 px-4 py-3 text-center',
        OUTCOME_STYLES[result.outcome],
      )}
    >
      {/* Rays are the jackpot's alone. Mixed from currentColor, so they are always a tint of the
          panel's own text colour and can never fight the theme. */}
      {isJackpot && <span aria-hidden className="slots-rays absolute inset-0 overflow-hidden" />}
      <p className={cn('relative m-0 font-display font-bold tracking-widest', isJackpot ? 'text-2xl sm:text-3xl' : 'text-xl')}>
        {t(`slots.outcome.${result.outcome}`)}
      </p>
      <p className="relative m-0 text-xs opacity-90">
        {result.payout > 0
          ? t('slots.payout', { amount: formatCredits(result.payout, i18n.language) })
          : t('slots.spent', { amount: formatCredits(SPIN_COST, i18n.language) })}
      </p>
    </div>
  )
}
