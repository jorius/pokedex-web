// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

// Lib
import { formatPokedexNumber, formatTenths, humanizeSlug } from '../../lib/Format'

// Store
import type { PokemonListItem } from '../../store/Types'

// Components
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface PokemonCardProps {
  pokemon: PokemonListItem
}

/** Whole-card link to the detail page. Sprite sits in a muted "specimen well" stamped with the
 * pokedex number — the entry-card look the game menus use — and lifts slightly on hover. */
export function PokemonCard({ pokemon }: PokemonCardProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Link
      to={`/pokemon/${pokemon.pokeApiId}`}
      className="group block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-muted/50 group-hover:shadow-md">
        <div className="relative flex aspect-square items-center justify-center bg-muted p-6">
          <span aria-hidden className="absolute left-3 top-2 font-display text-sm text-muted-foreground">
            {formatPokedexNumber(pokemon.pokeApiId)}
          </span>
          {pokemon.spriteUrl !== null ? (
            <img
              src={pokemon.spriteUrl}
              alt={pokemon.name}
              loading="lazy"
              className="size-full object-contain [image-rendering:pixelated] transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <span aria-hidden className="font-display text-6xl text-muted-foreground/50">?</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h2 className="font-display text-lg font-bold capitalize leading-tight">{humanizeSlug(pokemon.name)}</h2>
          <p className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
            {pokemon.category !== null && <span>{pokemon.category}</span>}
            <span className="ml-auto whitespace-nowrap">{t('browse.weightValue', { value: formatTenths(pokemon.weight) })}</span>
          </p>
          {pokemon.abilities.length > 0 && (
            <ul className="mt-auto flex list-none flex-wrap gap-1 p-0 pt-1">
              {pokemon.abilities.map((ability) => (
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
          )}
        </div>
      </Card>
    </Link>
  )
}
