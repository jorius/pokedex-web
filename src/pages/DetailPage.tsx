// External
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import type { JSX, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'

// Hooks
import { useDocumentTitle } from '../hooks/UseDocumentTitle'

// Lib
import { resolveApiErrorMessage } from '../lib/ApiErrorMessage'
import { formatPokedexNumber, formatTenths, humanizeSlug, toDisplayName } from '../lib/Format'

// Store
import { useGetPokemonByIdQuery, useGetPokemonByNameQuery, useSyncByIdMutation } from '../store/Api'
import type { ApiErrorShape } from '../store/Api'
import { useAppSelector } from '../store/Hooks'
import type { PokemonDetail } from '../store/Types'

// Components
import { EvolutionChain } from '../components/pokemon/EvolutionChain'
import { StatBars } from '../components/pokemon/StatBars'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

const TWO_COLUMN_CLASS = 'grid items-start gap-8 lg:grid-cols-[2fr_3fr]'

interface SectionProps {
  title: string
  children: ReactNode
}

/** Section heading with the small accent tick — echoes the brand-accent stripe under the header. */
function Section({ title, children }: SectionProps): JSX.Element {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-wide">
        <span aria-hidden className="inline-block h-4 w-1 rounded-full bg-accent" />
        {title}
      </h2>
      {children}
    </section>
  )
}

interface FactProps {
  label: string
  value: string
}

function Fact({ label, value }: FactProps): JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="m-0 font-bold">{value}</dd>
    </div>
  )
}

function DetailSkeleton(): JSX.Element {
  return (
    <div className={TWO_COLUMN_CLASS} aria-hidden>
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-9 w-44" />
        <div className="flex flex-col gap-3">
          {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map((key) => (
            <Skeleton key={key} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

interface DetailContentProps {
  detail: PokemonDetail
}

function DetailContent({ detail }: DetailContentProps): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAppSelector((state) => state.auth.accessToken !== null)
  const [syncById, { isLoading: isSyncing, isSuccess: isSynced, error: syncError, reset: resetSync }] = useSyncByIdMutation()

  // Evolution-chain navigation swaps the pokemon without unmounting — clear any stale sync note.
  useEffect(() => {
    resetSync()
  }, [detail.pokeApiId, resetSync])

  function handleSync(): void {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    void syncById(detail.pokeApiId)
  }

  return (
    <div className={TWO_COLUMN_CLASS}>
      <Card className="overflow-hidden">
        <div className="relative flex aspect-square items-center justify-center bg-muted p-8">
          <span aria-hidden className="absolute right-4 top-3 font-display text-2xl text-muted-foreground/70">
            {formatPokedexNumber(detail.pokeApiId)}
          </span>
          {detail.spriteUrl !== null ? (
            <img src={detail.spriteUrl} alt={detail.name} className="size-full object-contain [image-rendering:pixelated] drop-shadow-lg" />
          ) : (
            <span aria-hidden className="font-display text-8xl text-muted-foreground/50">?</span>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-bold capitalize tracking-wide">{humanizeSlug(detail.name)}</h1>
            <Badge variant="outline" className="font-display text-sm">{formatPokedexNumber(detail.pokeApiId)}</Badge>
          </div>
          {detail.types.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {detail.types.map((type) => (
                <Badge key={type} className="capitalize">{humanizeSlug(type)}</Badge>
              ))}
            </div>
          )}
        </div>

        <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3">
          {detail.category !== null && <Fact label={t('browse.category')} value={detail.category} />}
          <Fact label={t('detail.height')} value={t('detail.heightValue', { value: formatTenths(detail.height) })} />
          <Fact label={t('detail.weight')} value={t('browse.weightValue', { value: formatTenths(detail.weight) })} />
        </dl>

        <div className="flex flex-col gap-2">
          <Button className="self-start" disabled={isSyncing} onClick={handleSync}>
            <RefreshCw aria-hidden className={isSyncing ? 'animate-spin' : undefined} />
            {t('detail.sync')}
          </Button>
          {!isAuthenticated && <p className="text-sm text-muted-foreground">{t('detail.loginToSync')}</p>}
          {isSynced && (
            <p role="status" className="text-sm font-medium text-primary">
              {t('detail.syncSuccess')}
            </p>
          )}
          {syncError !== undefined && (
            <p role="alert" className="text-sm text-destructive">
              {resolveApiErrorMessage(syncError as ApiErrorShape, t)}
            </p>
          )}
        </div>

        {detail.description !== null && (
          <Section title={t('detail.description')}>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
          </Section>
        )}

        {detail.abilities.length > 0 && (
          <Section title={t('detail.abilities')}>
            <ul className="flex list-none flex-wrap gap-1.5 p-0">
              {detail.abilities.map((ability) => (
                <li key={ability.name}>
                  <Badge
                    variant={ability.isHidden ? 'outline' : 'secondary'}
                    title={ability.isHidden ? t('browse.hiddenAbility') : undefined}
                    className="capitalize"
                  >
                    {humanizeSlug(ability.name)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={t('detail.stats')}>
          <StatBars stats={detail.stats} />
        </Section>

        {detail.evolutionChain.length > 1 && (
          <Section title={t('detail.evolutionChain')}>
            <EvolutionChain chain={detail.evolutionChain} currentName={detail.name} />
          </Section>
        )}
      </div>
    </div>
  )
}

export function DetailPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { idOrName = '' } = useParams<{ idOrName: string }>()
  const isNumericId = /^\d+$/.test(idOrName)
  const byIdResult = useGetPokemonByIdQuery(Number(idOrName), { skip: !isNumericId })
  const byNameResult = useGetPokemonByNameQuery(idOrName, { skip: isNumericId })
  const { data, error, isLoading, refetch } = isNumericId ? byIdResult : byNameResult

  useDocumentTitle(data !== undefined ? `${t('common.appName')} — ${toDisplayName(data.name)}` : t('common.appName'))

  function handleBack(): void {
    // React Router stamps an idx on history state — 0 means this is the first in-app entry,
    // so navigate(-1) would leave the app. Fall back to browse in that case.
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (historyIndex > 0) navigate(-1)
    else navigate('/')
  }

  function renderContent(): JSX.Element {
    if (error) {
      const apiError = error as ApiErrorShape
      const isNotFound = apiError.status === 404
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <p role="alert" className="text-sm text-muted-foreground">
              {isNotFound ? t('detail.notFound') : resolveApiErrorMessage(apiError, t)}
            </p>
            {!isNotFound && (
              <Button variant="outline" onClick={(): void => { void refetch() }}>
                {t('common.retry')}
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    if (isLoading || data === undefined) return <DetailSkeleton />

    return <DetailContent detail={data} />
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="self-start" onClick={handleBack}>
        <ArrowLeft aria-hidden />
        {t('common.back')}
      </Button>
      {renderContent()}
    </div>
  )
}
