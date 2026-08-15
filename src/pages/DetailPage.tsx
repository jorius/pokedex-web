// External
import { ArrowLeft, RefreshCw } from 'lucide-react'
import type { JSX, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'

// Hooks
import { useDocumentTitle } from '../hooks/UseDocumentTitle'
import { useToast } from '../hooks/UseToast'

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

/**
 * The page is a two-column grid with THREE cells, placed explicitly on lg so the source order can
 * stay the mobile reading order (artwork+name+action -> types/meta/abilities/stats/evolution ->
 * description) while the desktop layout puts the dossier column beside the artwork and drops the
 * description underneath the artwork, matching its width. Row gap is wider than the column gap:
 * the action button hangs off the artwork card's bottom edge and needs the clearance.
 */
const DETAIL_GRID_CLASS = 'grid items-start gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'

const ARTWORK_CELL_CLASS = 'relative lg:col-start-1 lg:row-start-1'

const DOSSIER_CELL_CLASS = 'flex flex-col gap-7 lg:col-start-2 lg:row-span-2 lg:row-start-1'

const DESCRIPTION_CELL_CLASS = 'p-5 lg:col-start-1 lg:row-start-2'

/** The sprite well is padded top-heavy so the name plate overlays empty space, not the creature. */
const ARTWORK_WELL_CLASS = 'flex aspect-square items-center justify-center overflow-hidden rounded-[calc(var(--radius)-1px)] bg-muted px-6 pb-12 pt-20'

const NAME_PLATE_CLASS = 'min-w-0 flex-1 rounded-md border bg-card/90 px-3 py-2 shadow-sm backdrop-blur-sm'

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
    <div className={DETAIL_GRID_CLASS} aria-hidden>
      <div className={ARTWORK_CELL_CLASS}>
        <Skeleton className="aspect-square w-full rounded-lg" />
      </div>
      <div className={DOSSIER_CELL_CLASS}>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-7 w-32" />
        <div className="flex flex-col gap-3">
          {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map((key) => (
            <Skeleton key={key} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-lg lg:col-start-1 lg:row-start-2" />
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
  const { showToast } = useToast()
  const [syncById, { isLoading: isSyncing }] = useSyncByIdMutation()

  // The sync outcome is reported by the toast layer, so the mutation's isSuccess/error are no
  // longer read here — and neither is reset(), which only existed to clear the stale inline note
  // when the evolution chain swapped the pokemon under a mounted component.
  function handleSync(): void {
    if (!isAuthenticated) {
      // Being bounced to a login form you did not ask for is disorienting — say why.
      showToast({ message: t('detail.loginToSync'), variant: 'info' })
      navigate('/login', { state: { from: location } })
      return
    }
    void syncById(detail.pokeApiId)
      .unwrap()
      .then(() => { showToast({ message: t('detail.syncSuccess'), variant: 'success' }) })
      .catch((error: unknown) => { showToast({ message: resolveApiErrorMessage(error as ApiErrorShape, t), variant: 'error' }) })
  }

  return (
    <div className={DETAIL_GRID_CLASS}>
      <Card className={ARTWORK_CELL_CLASS}>
        <div className={ARTWORK_WELL_CLASS}>
          {detail.spriteUrl !== null ? (
            <img src={detail.spriteUrl} alt={detail.name} className="size-full object-contain [image-rendering:pixelated] drop-shadow-lg" />
          ) : (
            <span aria-hidden className="font-display text-8xl text-muted-foreground/50">?</span>
          )}
        </div>

        {/* Name plate riding the top of the artwork, with the entry number outside its right edge. */}
        <div className="absolute inset-x-0 top-0 flex flex-col gap-2 p-3">
          <div className="flex items-start gap-2">
            <div className={NAME_PLATE_CLASS}>
              <h1 className="truncate font-display text-2xl font-bold capitalize leading-tight tracking-wide sm:text-3xl">{humanizeSlug(detail.name)}</h1>
            </div>
            <span aria-hidden className="shrink-0 pt-2 font-display text-lg tabular-nums text-muted-foreground sm:text-xl">
              {formatPokedexNumber(detail.pokeApiId)}
            </span>
          </div>
        </div>

        {/* The action straddles the card's bottom edge — the one control the page is really about. */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center px-4">
          <Button size="lg" className="shadow-lg" disabled={isSyncing} onClick={handleSync}>
            <RefreshCw aria-hidden className={isSyncing ? 'animate-spin' : undefined} />
            {t('detail.sync')}
          </Button>
        </div>
      </Card>

      <div className={DOSSIER_CELL_CLASS}>
        {detail.types.length > 0 && (
          <Section title={t('detail.types')}>
            <div className="flex flex-wrap gap-2">
              {detail.types.map((type) => (
                <Badge key={type} className="px-3 py-1 text-sm capitalize">{humanizeSlug(type)}</Badge>
              ))}
            </div>
          </Section>
        )}

        <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3 rounded-md border bg-muted/40 px-4 py-3">
          {detail.category !== null && <Fact label={t('browse.category')} value={detail.category} />}
          <Fact label={t('detail.height')} value={t('detail.heightValue', { value: formatTenths(detail.height) })} />
          <Fact label={t('detail.weight')} value={t('browse.weightValue', { value: formatTenths(detail.weight) })} />
        </dl>

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
            <EvolutionChain
              chain={detail.evolutionChain}
              currentName={detail.name}
              currentPokeApiId={detail.pokeApiId}
              currentSpriteUrl={detail.spriteUrl}
            />
          </Section>
        )}
      </div>

      {detail.description !== null && (
        <Card className={DESCRIPTION_CELL_CLASS}>
          <Section title={t('detail.description')}>
            <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
          </Section>
        </Card>
      )}
    </div>
  )
}

export function DetailPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useToast()
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

  // A failed page load stays an inline page state (the page has no content to show), but a failed
  // RETRY is a transient event on a page the user is already looking at — that one toasts.
  function handleRetry(): void {
    void refetch()
      .unwrap()
      .catch((retryError: unknown) => { showToast({ message: resolveApiErrorMessage(retryError as ApiErrorShape, t), variant: 'error' }) })
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
              <Button variant="outline" onClick={handleRetry}>
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
