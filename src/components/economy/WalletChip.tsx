// External
import { Coins } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

// Hooks
import { useSpinLockedValue } from '../../hooks/UseSpinLockedValue'

// Lib
import { cn } from '../../lib/Cn'

// Components
import { PokeballMark } from '../brand/PokeballMark'
import { useGetWalletQuery } from '../../store/Api'
import { formatCredits, totalBalls } from './EconomyFormat'

/**
 * The header's purse: credits on the left of a hairline divider, balls carried on the right, the
 * whole pill a link to the shop (where both numbers are spent).
 *
 * Render it ONLY for an authenticated visitor — /api/economy/wallet is a 401 otherwise, and the
 * query would fire on every anonymous page load.
 *
 * Sizing is deliberate: h-9 matches the header's Select triggers so the chip sits on the same
 * baseline as the controls beside it, and tabular-nums stops the pill resizing every time a
 * purchase or a spin changes the balance.
 *
 * THE CHIP MUST NOT SCOOP THE SLOT MACHINE. The spin mutation invalidates the 'Wallet' tag when
 * the server answers, roughly a second before the third reel lands, so left alone this chip would
 * post the payout while the drums were still turning. `useSpinLockedValue` holds whatever the
 * wallet said at the moment the spin was paid for until the cabinet has finished its reveal; see
 * `ui.isSpinLocked` in UiSlice.ts for the whole mechanism.
 */
export function WalletChip(): JSX.Element | null {
  const { t, i18n } = useTranslation()
  const { data: liveWallet, isLoading } = useGetWalletQuery()
  const wallet = useSpinLockedValue(liveWallet)

  // No skeleton here: the header is the one place a placeholder would shift the whole layout on
  // every boot. The chip simply appears once the wallet lands.
  if ((isLoading && wallet === undefined) || wallet === undefined) return null

  const credits = formatCredits(wallet.credits, i18n.language)
  const balls = formatCredits(totalBalls(wallet), i18n.language)

  return (
    <Link
      to="/shop"
      title={t('economy.walletTitle')}
      aria-label={t('economy.walletAria', { credits, balls })}
      className={cn(
        // h-10 below xl (a tappable link to the shop), h-9 from xl up so it keeps sitting on the
        // same baseline as the desktop bar's Select triggers.
        'flex h-10 shrink-0 items-center gap-2 rounded-md border border-input bg-card px-2.5 text-sm font-bold text-foreground shadow-sm xl:h-9 xl:px-3',
        'transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <span aria-hidden className="flex items-center gap-1.5">
        <Coins className="size-4 shrink-0 text-muted-foreground" />
        <span className="tabular-nums">{credits}</span>
      </span>
      <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
      <span aria-hidden className="flex items-center gap-1.5">
        <PokeballMark variant="poke" size={16} />
        <span className="tabular-nums">{balls}</span>
      </span>
    </Link>
  )
}
