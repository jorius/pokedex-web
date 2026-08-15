// External
import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import type { JSX } from 'react'
import { Link } from 'react-router'

// Lib
import { humanizeSlug } from '../../lib/Format'

interface EvolutionChainProps {
  chain: string[]
  currentName: string
}

/** Evolution line as name → name → name. The current pokemon is highlighted (not a link);
 * the rest link to their detail page by name. Single-entry chains render nothing. */
export function EvolutionChain({ chain, currentName }: EvolutionChainProps): JSX.Element | null {
  if (chain.length < 2) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chain.map((name, index) => (
        <Fragment key={name}>
          {index > 0 && <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
          {name === currentName ? (
            <span aria-current="true" className="font-medium capitalize text-primary">
              {humanizeSlug(name)}
            </span>
          ) : (
            <Link
              to={`/pokemon/${name}`}
              className={[
                'rounded-sm capitalize text-muted-foreground underline-offset-4 outline-none transition-colors',
                'hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring',
              ].join(' ')}
            >
              {humanizeSlug(name)}
            </Link>
          )}
        </Fragment>
      ))}
    </div>
  )
}
