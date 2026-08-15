// External
import { ArrowLeft, RefreshCw, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

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
import { useGetCatalogueQuery, useGetLocalByPokeApiIdQuery, useGetWalletQuery, useGetPokemonByIdQuery, useGetPokemonByNameQuery, useSyncByIdMutation } from '../store/Api'
import type { ApiErrorShape } from '../store/Api'
import { useAppSelector } from '../store/Hooks'
import type { BallType, CatchResult, PokemonDetail } from '../store/Types'

// Components
import { PokeballMark } from '../components/brand/PokeballMark'
import { THEME_POKEBALL } from '../components/brand/PokeballPalettes'
import { ballArtVariant, cheapestOwned, findOption, toBallOptions } from '../components/capture/BallOptions'
import { BallPicker } from '../components/capture/BallPicker'
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

/**
 * Capped and centred while the page is a single column. Left uncapped, the square well simply
 * matched the container: at 768 that is a 736px artwork card, over 1000px tall with the action
 * button, which pushed the entire dossier past the fold on a portrait tablet. The cap lifts at lg,
 * where the two-column grid sizes the cell instead. It never binds on a phone (max-w-md is wider
 * than a 412px column), so nothing about the phone layout depends on it.
 */
const ARTWORK_CELL_CLASS = 'relative mx-auto w-full max-w-md lg:col-start-1 lg:row-start-1 lg:mx-0 lg:max-w-none'

const DOSSIER_CELL_CLASS = 'flex flex-col gap-7 lg:col-start-2 lg:row-span-2 lg:row-start-1'

const DESCRIPTION_CELL_CLASS = 'p-5 lg:col-start-1 lg:row-start-2'

/**
 * The sprite well is padded top-heavy so the name plate overlays empty space, not the creature.
 * `relative` anchors the capture stage, which covers exactly this box.
 *
 * PHONES GET A TALLER WELL. On a square well the bottom padding is the only clearance the ball
 * belt has, and at 412px that left the belt sitting 62px into the sprite's own box — fine for a
 * wide creature that letterboxes anyway, but it cut the tail off a tall one (Onix, Dragonite).
 * Below `sm` the well is 4:5 instead, which buys enough height to push the bottom padding past the
 * belt entirely: the sprite box comes out slightly LARGER than it was (275px vs 250px at 412) and
 * nothing overlaps it. From `sm` up the square well and its original padding are untouched.
 */
const ARTWORK_WELL_CLASS = [
  'relative flex aspect-4/5 items-center justify-center overflow-hidden rounded-[calc(var(--radius)-1px)] bg-muted',
  'px-4 pb-30 pt-20 sm:aspect-square sm:px-6 sm:pb-12',
].join(' ')

const NAME_PLATE_CLASS = 'min-w-0 flex-1 rounded-md border bg-card/90 px-3 py-2 shadow-sm backdrop-blur-sm'

/**
 * The belt rides the well's bottom padding — above the action button that straddles the card edge,
 * below the sprite's own box — so the picker never covers the pokemon it is aimed at.
 */
const BALL_PICKER_CELL_CLASS = 'absolute inset-x-0 bottom-8 flex justify-center px-4'

/** Where the picker opens before the wallet answers; it then moves to the cheapest ball owned. */
const STARTER_BALL: BallType = 'poke'

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

  // The wallet IS the belt's counter: every throw invalidates the 'Wallet' tag, so the counts here
  // redraw themselves the moment a ball is spent — nothing is tracked locally. Both hooks are read
  // off the api object because Api.ts's named-export block covers the pokemon endpoints only and
  // that file belongs to a concurrent change; these are the very hooks it would export.
  const { data: wallet, refetch: refetchWallet } = useGetWalletQuery(undefined, { skip: !isAuthenticated })
  const { data: catalogue } = useGetCatalogueQuery(undefined, { skip: !isAuthenticated })

  const ballOptions = useMemo(() => toBallOptions(wallet, catalogue), [wallet, catalogue])
  // Only an EXPLICIT pick is stored; what is actually on deck is derived below. That way the belt
  // needs no effect to follow the wallet — it simply falls back to the cheapest ball with stock
  // whenever the picked type is unset (first render, before the wallet answers) or has run dry.
  const [pickedBall, setPickedBall] = useState<BallType | null>(null)
  // The ball a throw left the hand with, frozen for as long as that throw is on screen — see below.
  const [ballInFlight, setBallInFlight] = useState<BallType | null>(null)
  // What the SERVER said the odds were, per ball, for THIS pokemon. The catalogue rate is only the
  // ball's own number — a per-pokemon rarity multiplier is applied on top of it, server-side — so
  // the first throw with a ball replaces the estimate with the real figure. See BallPicker.
  const [serverChances, setServerChances] = useState<Partial<Record<BallType, number>>>({})

  const pickedOption = pickedBall === null ? undefined : findOption(ballOptions, pickedBall)
  const cheapestOption = cheapestOwned(ballOptions)
  const readyOption = pickedOption !== undefined && pickedOption.quantity > 0 ? pickedOption : cheapestOption
  /** The ball the NEXT throw will spend. */
  const readyBall = readyOption?.type ?? pickedBall ?? STARTER_BALL
  const hasBallToThrow = cheapestOption !== undefined
  const themeBall = THEME_POKEBALL[theme]

  function rememberChance(result: CatchResult): void {
    setServerChances((previous) => ({ ...previous, [result.ballType]: result.chance }))
  }

  /** A REJECTED throw — the request never produced a roll. An escape is not this. */
  function reportThrowError(error: unknown): void {
    const apiError = error as ApiErrorShape
    showToast({ message: resolveApiErrorMessage(apiError, t), variant: 'error' })
    // 409 ("No Poké Ball left") fulfils nothing, so the mutation's tag invalidation never runs and
    // the belt would keep advertising stock the server just refused. Ask the wallet again.
    if (apiError.status === 409) void refetchWallet()
  }

  const capture = useCaptureSequence({
    onCapture: async (): Promise<boolean> => {
      const result = await syncById({ id: detail.pokeApiId, ballType: readyBall }).unwrap()
      rememberChance(result)
      return result.caught
    },
    onCaught: () => { showToast({ message: t('detail.catchSuccess', { name: toDisplayName(detail.name) }), variant: 'success' }) },
    // Not a failure — the ball was spent, the server rolled, and the pokemon won the roll.
    onEscaped: () => { showToast({ message: t('detail.catchFailed'), variant: 'info' }) },
    onError: reportThrowError,
  })

  // The captured state is held back until the throw resolves: the invalidated query can answer
  // mid-wobble, and the badge showing up before the ball stops would give the outcome away.
  const capturedAt = capture.isCatching ? undefined : capturedEntry?.capturedAt
  const isCaptured = capturedAt !== undefined
  const spriteClassName = captureSpriteClassName(capture.phase)

  // For as long as a throw is ON SCREEN (mid-flight, or holding its result) the belt shows the ball
  // that was thrown, not the one that is next. The wallet answers mid-wobble, and spending the last
  // Master Ball would otherwise turn it into a Poké Ball in mid-air and jump the belt a rung.
  const isThrowOnScreen = capture.isCatching || capture.phase !== 'idle'
  const selectedBall = isThrowOnScreen && ballInFlight !== null ? ballInFlight : readyBall
  const selectedOption = findOption(ballOptions, selectedBall)
  // No wallet to pick from (anonymous, or a backend without the economy endpoints) keeps the
  // pre-picker behaviour: the throw is drawn with the active theme's own ball.
  const thrownBall = ballOptions.length === 0 ? themeBall : ballArtVariant(selectedBall, themeBall)

  /**
   * Re-syncing an entry you already own is ANOTHER THROW as far as the server is concerned:
   * PokemonsService.attemptCatch consumes the ball, rolls the odds, and only rewrites the entry
   * when the roll lands. So this is not a free refresh — the button names the ball it spends, and
   * a lost roll is reported as the escape it is (the collection entry simply stays as it was).
   */
  function handleResync(): void {
    void syncById({ id: detail.pokeApiId, ballType: readyBall })
      .unwrap()
      .then((result) => {
        rememberChance(result)
        if (result.caught) showToast({ message: t('detail.syncSuccess'), variant: 'success' })
        else showToast({ message: t('detail.catchFailed'), variant: 'info' })
      })
      .catch(reportThrowError)
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
    setBallInFlight(readyBall)
    capture.start()
  }

  function actionLabel(): string {
    if (capture.isCatching) return t('detail.catching')
    if (isCaptured) return t('detail.resync')
    return t('detail.catch')
  }

  /** An empty bag: the throw is replaced by the only thing that can fix it. */
  function renderRestockLink(): JSX.Element {
    return (
      // Solid, not secondary — with the whole belt greyed out this is the only thing left to do.
      <Button asChild size="lg" className="shadow-lg">
        <Link to="/shop">
          <ShoppingCart aria-hidden />
          {t('nav.shop')}
        </Link>
      </Button>
    )
  }

  function renderThrowButton(): JSX.Element {
    const label = actionLabel()
    return (
      <Button
        size="lg"
        variant={isCaptured ? 'secondary' : 'default'}
        className="shadow-lg"
        disabled={capture.isCatching || isSyncing}
        // The ball on deck is art in the button; screen readers get it named instead.
        aria-label={selectedOption === undefined || selectedOption.name === '' ? undefined : `${label} · ${selectedOption.name}`}
        onClick={handleAction}
      >
        {isCaptured ? (
          <RefreshCw aria-hidden className={isSyncing ? 'animate-spin' : undefined} />
        ) : (
          // The button throws the ball the belt has on deck — the same one the animation draws.
          <PokeballMark variant={thrownBall} className={capture.isCatching ? 'animate-spin' : undefined} />
        )}
        {label}
        {isCaptured && ballOptions.length > 0 && (
          // A re-sync costs a ball on the server, so the price tag is part of the button rather
          // than a surprise subtraction in the bag afterwards.
          <span aria-hidden className="flex items-center gap-1 border-l border-secondary-foreground/25 pl-2 text-xs font-bold tabular-nums">
            <PokeballMark variant={thrownBall} />
            ×1
          </span>
        )}
      </Button>
    )
  }

  /** Every action on this card spends a ball, so an empty bag replaces all of them. */
  function renderAction(): JSX.Element {
    const canRestock = isAuthenticated && ballOptions.length > 0 && !hasBallToThrow
    return canRestock ? renderRestockLink() : renderThrowButton()
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
          <CaptureAnimation phase={capture.phase} variant={thrownBall} />
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

        {/* The belt: what is on deck, what is left of it, and what it is worth against this
            pokemon. Anonymous visitors get no belt — there is no bag to draw from. */}
        {isAuthenticated && ballOptions.length > 0 && (
          <div className={BALL_PICKER_CELL_CLASS}>
            <BallPicker
              options={ballOptions}
              selected={selectedBall}
              confirmedChance={serverChances[selectedBall] ?? null}
              disabled={capture.isCatching || isSyncing}
              fallbackVariant={themeBall}
              onSelect={setPickedBall}
            />
          </div>
        )}

        {/* The action straddles the card's bottom edge — the one control the page is really about. */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-1/2 justify-center px-4">
          {renderAction()}
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
