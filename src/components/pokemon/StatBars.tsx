// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { humanizeSlug } from '../../lib/Format'

// Store
import type { PokemonStat } from '../../store/Types'

/** PokeAPI base-stat ceiling used to scale the bars (255 is the historical max, Blissey's HP). */
const MAX_BASE_STAT = 255

// Stat slugs map 1:1 to i18n `stats.*` keys; the lookup keeps t() statically typed while the
// humanized slug covers any stat name the backend might add later.
const STAT_I18N_KEYS = {
  hp: 'stats.hp',
  attack: 'stats.attack',
  defense: 'stats.defense',
  'special-attack': 'stats.special-attack',
  'special-defense': 'stats.special-defense',
  speed: 'stats.speed',
} as const

function isKnownStat(name: string): name is keyof typeof STAT_I18N_KEYS {
  return name in STAT_I18N_KEYS
}

interface StatBarsProps {
  stats: PokemonStat[]
}

/** Six base stats as label + value + horizontal bar. The visible label/value pair carries the
 * semantics, so the bar itself is purely decorative (aria-hidden). */
export function StatBars({ stats }: StatBarsProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2.5">
      {stats.map((stat) => (
        <div key={stat.name} className="grid grid-cols-[7.5rem_2.25rem_1fr] items-center gap-3">
          <span className="text-sm capitalize text-muted-foreground">{isKnownStat(stat.name) ? t(STAT_I18N_KEYS[stat.name]) : humanizeSlug(stat.name)}</span>
          <span className="text-right text-sm font-bold tabular-nums">{stat.value}</span>
          <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${String(Math.min(100, (stat.value / MAX_BASE_STAT) * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
