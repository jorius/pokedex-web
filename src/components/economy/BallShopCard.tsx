// External
import { Coins, Loader2, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useToast } from '../../hooks/UseToast'

// Lib
import { resolveApiErrorMessage } from '../../lib/ApiErrorMessage'
import { cn } from '../../lib/Cn'

// Store
import type { ApiErrorShape } from '../../store/Api'
import type { BallCatalogueEntry } from '../../store/Types'

// Components
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { BallArt } from './BallArt'
import { useBuyBallsMutation } from './EconomyApi'
import { formatCatchRate, formatCredits } from './EconomyFormat'
import { MIN_QUANTITY } from './QuantityRules'
import { QuantityStepper } from './QuantityStepper'

/** The counter mat behind the ball. Built from --foreground so it reads in all nine themes. */
const COUNTER_HATCH = 'repeating-linear-gradient(135deg, color-mix(in srgb, var(--foreground) 6%, transparent) 0 5px, transparent 5px 12px)'

interface BallShopCardProps {
  entry: BallCatalogueEntry
  /** How many of THIS ball the caller already carries. */
  owned: number
  /** The caller's balance — what decides whether this order is affordable. */
  credits: number
}

/**
 * One counter slot in the mart: the ball on its shelf, what it costs, how often it holds, how many
 * you already carry, and the order you are about to place.
 *
 * The card owns its own purchase (mutation + toasts) rather than reporting up to the page. Four
 * cards, four independent orders: one pending Buy must never disable the other three, and the
 * wallet refresh is handled for everyone by the mutation's `Wallet` tag invalidation.
 */
export function BallShopCard({ entry, owned, credits }: BallShopCardProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const [quantity, setQuantity] = useState<number>(MIN_QUANTITY)
  const [buyBalls, { isLoading: isBuying }] = useBuyBallsMutation()

  const ballName = t(`economy.ballName.${entry.type}`)
  const total = entry.price * quantity
  const isAffordable = total <= credits

  function handleBuy(): void {
    void buyBalls({ ballType: entry.type, quantity })
      .unwrap()
      .then(() => {
        showToast({ message: t('shop.bought', { count: quantity, ball: ballName }), variant: 'success' })
        setQuantity(MIN_QUANTITY)
      })
      // The 409 body ("Not enough credits") is the authority on affordability — the disabled Buy
      // button is only a courtesy, and a spend from another tab can still race past it.
      .catch((error: unknown) => { showToast({ message: resolveApiErrorMessage(error as ApiErrorShape, t), variant: 'error' }) })
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* The shelf: art on a hatched counter mat, lit from above, with what you already carry
          stamped in the corner. The hatch is mixed from --foreground so it stays a texture rather
          than a colour — 6% ink on the light themes, 6% paper on the dark ones. */}
      <div className="relative flex items-center justify-center overflow-hidden bg-muted px-6 py-7">
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: COUNTER_HATCH }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-foreground/[0.06] to-transparent" />
        {/* Card-coloured halo: a spotlight on the light themes, a pool of shadow on the dark ones,
            and in both it lifts the ball off the hatch. */}
        <span aria-hidden className="absolute size-24 rounded-full bg-card/80 blur-lg" />
        <Badge variant="secondary" className="absolute right-2 top-2 tabular-nums">
          {t('economy.owned', { count: owned })}
        </Badge>
        <BallArt type={entry.type} size={72} className="relative" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold leading-tight">{ballName}</h2>
          <span className="flex shrink-0 items-center gap-1 font-display text-lg font-bold tabular-nums text-primary">
            <Coins className="size-4" aria-hidden />
            {formatCredits(entry.price, i18n.language)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
            <span>{t('economy.catchRate')}</span>
            <span className="font-bold tabular-nums text-foreground">{formatCatchRate(entry.catchRate, i18n.language)}</span>
          </p>
          {/* Decorative twin of the number above it, so the four balls can be compared at a glance. */}
          <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-border">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${String(Math.round(entry.catchRate * 100))}%` }} />
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            disabled={isBuying}
            label={t('shop.quantityOf', { ball: ballName })}
          />
          <Button
            className="w-full"
            disabled={isBuying || !isAffordable}
            onClick={handleBuy}
            title={isAffordable ? undefined : t('shop.cannotAfford')}
          >
            {isBuying ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden /> : <ShoppingCart aria-hidden />}
            <span className="tabular-nums">{t('shop.buyTotal', { amount: formatCredits(total, i18n.language) })}</span>
          </Button>
          <p className={cn('text-center text-xs text-destructive', isAffordable && 'invisible')} role={isAffordable ? undefined : 'status'}>
            {t('shop.cannotAfford')}
          </p>
        </div>
      </div>
    </Card>
  )
}
