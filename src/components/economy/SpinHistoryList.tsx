// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { resolveApiErrorMessage } from '../../lib/ApiErrorMessage'
import { cn } from '../../lib/Cn'

// Store
import type { ApiErrorShape } from '../../store/Api'
import type { SpinHistoryEntry, SpinOutcome } from '../../store/Types'

// Components
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import { useGetSpinHistoryQuery } from '../../store/Api'
import { formatCredits, formatSpinDate } from './EconomyFormat'
import { artworkUrl } from './SlotSymbols'

/** One screen of history. The list refreshes itself: every spin invalidates the `Spins` tag. */
const HISTORY_PAGE_SIZE = 8

/** Chip styling per outcome, mirroring the display panel so the log reads as the same machine. */
const OUTCOME_BADGE: Record<SpinOutcome, { variant: 'default' | 'secondary' | 'outline'; className?: string }> = {
  jackpot: { variant: 'default', className: 'bg-accent text-accent-foreground' },
  triple: { variant: 'default' },
  pair: { variant: 'secondary' },
  none: { variant: 'outline', className: 'text-muted-foreground' },
}

function HistoryRow({ entry }: { entry: SpinHistoryEntry }): JSX.Element {
  const { t, i18n } = useTranslation()
  const badge = OUTCOME_BADGE[entry.outcome]
  const hasPayout = entry.payout > 0

  return (
    <li className="flex items-center gap-3 border-b border-border/70 py-2 last:border-b-0">
      <span aria-hidden className="flex shrink-0 items-center gap-1">
        {entry.reels.map((pokeApiId, index) => (
          <span key={`${String(pokeApiId)}-${String(index)}`} className="grid size-8 place-items-center rounded-sm bg-muted p-0.5">
            <img src={artworkUrl(pokeApiId)} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
          </span>
        ))}
      </span>
      <Badge variant={badge.variant} className={cn('shrink-0', badge.className)}>
        {t(`slots.outcome.${entry.outcome}`)}
      </Badge>
      <span
        className={cn('ml-auto shrink-0 font-display text-sm font-bold tabular-nums', hasPayout ? 'text-success' : 'text-muted-foreground')}
      >
        {hasPayout
          ? t('slots.payoutShort', { amount: formatCredits(entry.payout, i18n.language) })
          : t('slots.costShort', { amount: formatCredits(entry.cost, i18n.language) })}
      </span>
      <time dateTime={entry.createdAt} className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:w-24">
        {formatSpinDate(entry.createdAt, i18n.language)}
      </time>
    </li>
  )
}

/**
 * The machine's ledger: the most recent pulls, newest first.
 *
 * Deliberately ONE page and no controls. This sits under a machine you are still playing, where the
 * only question it answers is "what just happened" — and every spin invalidates the tag, so paging
 * back through it would be fighting a list that reorders under your hands.
 */
export function SpinHistoryList(): JSX.Element {
  const { t } = useTranslation()
  const { data, error, isLoading } = useGetSpinHistoryQuery({ page: 1, pageSize: HISTORY_PAGE_SIZE })

  function renderBody(): JSX.Element {
    if (error) {
      return (
        <p role="alert" className="py-4 text-center text-sm text-muted-foreground">
          {resolveApiErrorMessage(error as ApiErrorShape, t)}
        </p>
      )
    }

    if (isLoading || data === undefined) {
      return (
        <div className="flex flex-col gap-2 py-2" aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      )
    }

    if (data.items.length === 0) {
      return <p className="py-6 text-center text-sm text-muted-foreground">{t('slots.history.empty')}</p>
    }

    return (
      <ul className="m-0 flex list-none flex-col p-0">
        {data.items.map((entry) => (
          <HistoryRow key={entry.id} entry={entry} />
        ))}
      </ul>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between gap-2 p-4 pb-2">
        <CardTitle className="font-display tracking-wide">{t('slots.history.title')}</CardTitle>
        {data !== undefined && data.meta.totalCount > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">{t('slots.history.total', { count: data.meta.totalCount })}</span>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3">{renderBody()}</CardContent>
    </Card>
  )
}
