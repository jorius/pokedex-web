// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

// Lib
import { formatPokedexNumber, formatTenths, humanizeSlug } from '../../lib/Format'
import { resolveSpriteUrl } from '../../lib/Sprite'

// Store
import { useAppSelector } from '../../store/Hooks'
import type { PokemonListItem } from '../../store/Types'

// Components
import { ShinyOverlay } from './ShinyOverlay'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface PokemonCardProps {
  pokemon: PokemonListItem
}

/** Whole-card link to the detail page. Sprite sits in a muted "specimen well" stamped with the
 * pokedex number — the entry-card look the game menus use — and lifts slightly on hover. Which of
 * the two artworks the well holds is the shiny preference's call; the well itself is decorated to
 * match (ShinyOverlay). */
export function PokemonCard({ pokemon }: PokemonCardProps): JSX.Element {
  const { t } = useTranslation()
  const shinyMode = useAppSelector((state) => state.ui.shinyMode)
  const sprite = resolveSpriteUrl(pokemon, shinyMode)

  return (
    <Link
      to={`/pokemon/${pokemon.pokeApiId}`}
      className="group block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-muted/50 group-hover:shadow-md">
        {/* Tighter well padding on the narrow two-column phone grid, so the sprite keeps its size
            when the card itself is only ~186px wide. */}
        <div className="relative flex aspect-square items-center justify-center bg-muted p-3 sm:p-6">
          <span aria-hidden className="absolute left-2 top-1.5 font-display text-xs text-muted-foreground sm:left-3 sm:top-2 sm:text-sm">
            {formatPokedexNumber(pokemon.pokeApiId)}
          </span>
          {sprite.url !== null ? (
            <img
              src={sprite.url}
              alt={pokemon.name}
              loading="lazy"
              className="size-full object-contain [image-rendering:pixelated] transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <span aria-hidden className="font-display text-6xl text-muted-foreground/50">?</span>
          )}
          <ShinyOverlay state={sprite.shiny} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <h2 className="font-display text-base font-bold capitalize leading-tight sm:text-lg">{humanizeSlug(pokemon.name)}</h2>
          {/* Wraps instead of squeezing: at two columns on a phone the category and the weight do
              not both fit on one line, and a category clipped to "Seed Poké…" says nothing. */}
          <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-muted-foreground">
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
