// External
import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import type { JSX } from 'react'
import { Link } from 'react-router'

// Lib
import { cn } from '../../lib/Cn'
import { formatPokedexNumber, humanizeSlug } from '../../lib/Format'

// Store
import { useGetPokemonByNameQuery } from '../../store/Api'

// Components
import { Skeleton } from '../ui/Skeleton'

/** Sprite + number for one stage. Null while the stage's own detail request is still in flight. */
interface StageIdentity {
  pokeApiId: number
  spriteUrl: string | null
}

const STAGE_CLASS = [
  'flex w-[5.25rem] flex-col items-center gap-1.5 rounded-md border bg-card p-2 text-center sm:w-24',
  'transition-all duration-200',
].join(' ')

const STAGE_LINK_CLASS = [
  'outline-none hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
].join(' ')

/** The stage the page is already showing: accent border + the underline tick, and no link. */
const STAGE_CURRENT_CLASS = 'border-accent bg-accent/10'

interface StageBodyProps {
  name: string
  identity: StageIdentity | null
  isLoading: boolean
  isCurrent: boolean
}

function StageBody({ name, identity, isLoading, isCurrent }: StageBodyProps): JSX.Element {
  // A stage whose own request is still running shows a pulse; one that resolved without a sprite
  // (or failed outright) falls back to the same "?" glyph the browse and detail wells use.
  function renderWell(): JSX.Element {
    if (identity === null) {
      if (isLoading) return <Skeleton className="size-full rounded-sm bg-foreground/10" />
      return <span aria-hidden className="font-display text-2xl text-muted-foreground/60">?</span>
    }
    if (identity.spriteUrl === null) return <span aria-hidden className="font-display text-2xl text-muted-foreground/60">?</span>
    return <img src={identity.spriteUrl} alt="" loading="lazy" className="size-full object-contain [image-rendering:pixelated]" />
  }

  return (
    <>
      <div className="flex aspect-square w-full items-center justify-center rounded-sm bg-muted p-1">{renderWell()}</div>
      <span className={cn('font-display text-xs font-bold capitalize leading-tight', isCurrent ? 'text-foreground' : 'text-muted-foreground')}>
        {humanizeSlug(name)}
      </span>
      <span className="font-display text-[10px] tabular-nums text-muted-foreground/80">
        {identity !== null ? formatPokedexNumber(identity.pokeApiId) : '#---'}
      </span>
      {/* Always rendered so every card is the same height — only the current one is inked. */}
      <span aria-hidden className={cn('h-0.5 w-8 rounded-full', isCurrent ? 'bg-accent' : 'bg-transparent')} />
    </>
  )
}

interface EvolutionStageProps {
  name: string
  /** Non-null only for the stage the page already loaded — its presence skips the extra request. */
  known: StageIdentity | null
}

/**
 * One mini-card. The chain arrives as bare names, so every OTHER stage resolves its sprite and
 * number through the existing by-name detail query: one component per stage keeps the hook call
 * unconditional, RTK Query caches the response, and clicking through then lands on a warm cache.
 */
function EvolutionStage({ name, known }: EvolutionStageProps): JSX.Element {
  const isCurrent = known !== null
  const { data, isLoading } = useGetPokemonByNameQuery(name, { skip: isCurrent })
  const identity = known ?? (data !== undefined ? { pokeApiId: data.pokeApiId, spriteUrl: data.spriteUrl } : null)

  if (isCurrent) {
    return (
      <div aria-current="true" className={cn(STAGE_CLASS, STAGE_CURRENT_CLASS)}>
        <StageBody name={name} identity={identity} isLoading={false} isCurrent />
      </div>
    )
  }

  return (
    <Link to={`/pokemon/${name}`} className={cn(STAGE_CLASS, STAGE_LINK_CLASS)}>
      <StageBody name={name} identity={identity} isLoading={isLoading} isCurrent={false} />
    </Link>
  )
}

interface EvolutionChainProps {
  chain: string[]
  currentName: string
  currentPokeApiId: number
  currentSpriteUrl: string | null
}

/** The evolution line as a row of mini-cards (sprite, name, number) joined by chevrons. The
 * current stage is marked and inert; the rest link to their own detail page. Single-entry
 * chains render nothing. */
export function EvolutionChain({ chain, currentName, currentPokeApiId, currentSpriteUrl }: EvolutionChainProps): JSX.Element | null {
  if (chain.length < 2) return null

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-3">
      {chain.map((name, index) => (
        <Fragment key={name}>
          {index > 0 && <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground/70" />}
          <EvolutionStage name={name} known={name === currentName ? { pokeApiId: currentPokeApiId, spriteUrl: currentSpriteUrl } : null} />
        </Fragment>
      ))}
    </div>
  )
}
