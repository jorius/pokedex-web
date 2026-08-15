// External
import { ArrowLeft, RefreshCw } from 'lucide-react'
import type { JSX, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'

// Hooks
import { useCaptureSequence } from '../hooks/UseCaptureSequence'
import { useDocumentTitle } from '../hooks/UseDocumentTitle'
import { useTheme } from '../hooks/UseTheme'
import { useToast } from '../hooks/UseToast'

// Lib
import { resolveApiErrorMessage } from '../lib/ApiErrorMessage'
import { cn } from '../lib/Cn'
import { formatPokedexNumber, formatTenths, humanizeSlug, toDisplayName } from '../lib/Format'

// Store
import { useGetLocalByPokeApiIdQuery, useGetPokemonByIdQuery, useGetPokemonByNameQuery, useSyncByIdMutation } from '../store/Api'
import type { ApiErrorShape } from '../store/Api'
import { useAppSelector } from '../store/Hooks'
import type { PokemonDetail } from '../store/Types'

// Components
import { PokeballMark } from '../components/brand/PokeballMark'
import { THEME_POKEBALL } from '../components/brand/PokeballPalettes'
import { CaptureAnimation } from '../components/capture/CaptureAnimation'
import { captureSpriteClassName } from '../components/capture/CaptureSprite'
import { CapturedBadge } from '../components/capture/CapturedBadge'
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
 *
 * `auto 1fr` rows matter: the dossier column spans both rows, and without a flexible second track
 * its extra height would be split between them — pushing the description away from the artwork on
 * long pages. The flexible row absorbs it instead, so the description always sits right below.
 */
const DETAIL_GRID_CLASS = 'grid items-start gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-[auto_1fr]'

const ARTWORK_CELL_CLASS = 'relative lg:col-start-1 lg:row-start-1'

const DOSSIER_CELL_CLASS = 'flex flex-col gap-7 lg:col-start-2 lg:row-span-2 lg:row-start-1'

const DESCRIPTION_CELL_CLASS = 'p-5 lg:col-start-1 lg:row-start-2'

/** The sprite well is padded top-heavy so the name plate overlays empty space, not the creature.
 * `relative` anchors the capture stage, which covers exactly this box. */
const ARTWORK_WELL_CLASS = 'relative flex aspect-square items-center justify-center overflow-hidden rounded-[calc(var(--radius)-1px)] bg-muted px-6 pb-12 pt-20'

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
  const { theme } = useTheme()
  const isAuthenticated = useAppSelector((state) => state.auth.accessToken !== null)
  const { showToast } = useToast()
  const [syncById, { isLoading: isSyncing }] = useSyncByIdMutation()
  // The captured check answers 404 when this pokemon is not in the caller's collection — that is
  // a STATE, not a failure, so only `data` is read and nothing about it is ever toasted. The
  // endpoint provides the 'Local' tag, so a successful catch flips it without a manual refetch.
  const { data: capturedEntry } = useGetLocalByPokeApiIdQuery(detail.pokeApiId, { skip: !isAuthenticated })

  /** A broken-out pokemon is a story beat: prefer the server's account of it, fall back to flavor. */
  function resolveCatchFailureMessage(error: unknown): string {
    const apiError = error as ApiErrorShape
    if (typeof apiError.status === 'string') return t('common.error.network')
    return apiError.msg ?? t('detail.catchFailed')
  }

  const capture = useCaptureSequence({
    // TODO(C6): the ball comes from the picker once it lands; the default keeps parity with the API.
    onCapture: () => syncById({ id: detail.pokeApiId, ballType: 'poke' }).unwrap(),
    onSuccess: () => { showToast({ message: t('detail.catchSuccess', { name: toDisplayName(detail.name) }), variant: 'success' }) },
    onFailure: (error: unknown) => { showToast({ message: resolveCatchFailureMessage(error), variant: 'error' }) },
  })

  // The captured state is held back until the throw resolves: the invalidated query can answer
  // mid-wobble, and the badge showing up before the ball stops would give the outcome away.
  const capturedAt = capture.isCatching ? undefined : capturedEntry?.capturedAt
  const isCaptured = capturedAt !== undefined
  const spriteClassName = captureSpriteClassName(capture.phase)

  // Re-syncing an entry you already own refreshes its base data — no throw, just the sync toast.
  function handleResync(): void {
    void syncById({ id: detail.pokeApiId, ballType: 'poke' })
      .unwrap()
      .then(() => { showToast({ message: t('detail.syncSuccess'), variant: 'success' }) })
      .catch((error: unknown) => { showToast({ message: resolveApiErrorMessage(error as ApiErrorShape, t), variant: 'error' }) })
  }

  function handleAction(): void {
    if (!isAuthenticated) {
      // Being bounced to a login form you did not ask for is disorienting — say why.
      showToast({ message: t('detail.loginToSync'), variant: 'info' })
      navigate('/login', { state: { from: location } })
      return
    }
    if (isCaptured) {
      handleResync()
      return
    }
    capture.start()
  }

  function actionLabel(): string {
    if (capture.isCatching) return t('detail.catching')
    if (isCaptured) return t('detail.resync')
    return t('detail.catch')
  }

  return (
    <div className={DETAIL_GRID_CLASS}>
      <Card className={ARTWORK_CELL_CLASS}>
        <div className={ARTWORK_WELL_CLASS}>
          {detail.spriteUrl !== null ? (
            // The opacity transition is what brings the sprite back after a capture: the phase
            // classes only take it away, and a hard pop-in at the end of the throw reads as a bug.
            <img
              src={detail.spriteUrl}
              alt={detail.name}
              className={cn('size-full object-contain [image-rendering:pixelated] drop-shadow-lg transition-opacity duration-300', spriteClassName)}
            />
          ) : (
            <span aria-hidden className={cn('font-display text-8xl text-muted-foreground/50', spriteClassName)}>?</span>
          )}
          <CaptureAnimation phase={capture.phase} />
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
          {capturedAt !== undefined && <CapturedBadge capturedAt={capturedAt} />}
        </div>

        {/* The action straddles the card's bottom edge — the one control the page is really about. */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center px-4">
          <Button
            size="lg"
            variant={isCaptured ? 'secondary' : 'default'}
            className="shadow-lg"
            disabled={capture.isCatching || isSyncing}
            onClick={handleAction}
          >
            {isCaptured ? (
              <RefreshCw aria-hidden className={isSyncing ? 'animate-spin' : undefined} />
            ) : (
              // The button throws the same ball the animation does — the active theme's.
              <PokeballMark variant={THEME_POKEBALL[theme]} className={capture.isCatching ? 'animate-spin' : undefined} />
            )}
            {actionLabel()}
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

    // Keyed by entry: following an evolution card mid-throw swaps the pokemon under a mounted
    // component, and remounting is what guarantees the capture sequence starts clean (timers
    // cleared, phase back to idle) instead of finishing a throw aimed at the previous one.
    return <DetailContent key={data.pokeApiId} detail={data} />
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
