// External
import { Coins } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useDocumentTitle } from '../hooks/UseDocumentTitle'
import { useToast } from '../hooks/UseToast'

// Lib
import { resolveApiErrorMessage } from '../lib/ApiErrorMessage'

// Store
import type { ApiErrorShape } from '../store/Api'

// Components
import { BallShopCard } from '../components/economy/BallShopCard'
import { useGetCatalogueQuery, useGetWalletQuery } from '../components/economy/EconomyApi'
import { ballQuantity, formatCredits } from '../components/economy/EconomyFormat'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

/** Catalogue length is fixed at four, so the loading state can mirror the real grid exactly. */
const CATALOGUE_SIZE = 4

function SkeletonCard(): JSX.Element {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-center bg-muted px-6 py-7">
        <Skeleton className="size-[72px] rounded-full" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </Card>
  )
}

/**
 * The mart. Four balls on the counter and the till reading your balance — the only two things a
 * player needs to decide what to buy.
 *
 * The catalogue is public but the wallet is not, so the two queries are treated differently: a
 * catalogue failure has no shelf to draw and becomes an inline retry, while a wallet that has not
 * landed yet simply reads as zero credits (every Buy stays disabled) and rights itself the moment
 * it arrives.
 */
export function ShopPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const { data: catalogue, error, isLoading, refetch } = useGetCatalogueQuery()
  const { data: wallet } = useGetWalletQuery()

  useDocumentTitle(`${t('common.appName')} — ${t('shop.title')}`)

  function handleRetry(): void {
    void refetch()
      .unwrap()
      .catch((retryError: unknown) => { showToast({ message: resolveApiErrorMessage(retryError as ApiErrorShape, t), variant: 'error' }) })
  }

  function renderContent(): JSX.Element {
    if (error) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <p role="alert" className="text-sm text-muted-foreground">
              {resolveApiErrorMessage(error as ApiErrorShape, t)}
            </p>
            <Button variant="outline" onClick={handleRetry}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (isLoading || catalogue === undefined) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
          {Array.from({ length: CATALOGUE_SIZE }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )
    }

    return (
      <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {catalogue.map((entry) => (
          <li key={entry.type}>
            <BallShopCard entry={entry} owned={ballQuantity(wallet, entry.type)} credits={wallet?.credits ?? 0} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold tracking-wide">{t('shop.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('shop.subtitle')}</p>
        </div>
        {/* The till. Loud on purpose — every decision on this page is made against this number. */}
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2 shadow-sm">
          <Coins className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{t('economy.credits')}</span>
            <span className="font-display text-xl font-bold tabular-nums">{formatCredits(wallet?.credits ?? 0, i18n.language)}</span>
          </span>
        </div>
      </div>

      {renderContent()}
    </div>
  )
}
