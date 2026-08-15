// External
import { useId } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

// Store
import type { BallType } from '../../store/Types'

// Components
import { PokeballMark } from '../brand/PokeballMark'
import type { PokeballVariant } from '../brand/PokeballPalettes'
import { ballArtVariant, findOption } from './BallOptions'
import type { BallOption } from './BallOptions'

/**
 * The belt plate. Deliberately built from the same parts as the name plate riding the top of the
 * artwork (bordered, translucent card surface, backdrop blur) so the two read as one family of
 * overlays on the sprite well: identity on top, ammunition at the bottom.
 */
const PLATE_CLASS = 'flex flex-col items-center gap-1.5 rounded-md border bg-card/90 px-2.5 py-2 shadow-sm backdrop-blur-sm'

const CHIP_CLASS = [
  // min-h-10 below lg: these chips choose the ball the whole page is about, and at 30px they were
  // the smallest primary control in the app. They drop back to the original compact height at lg.
  'flex min-h-10 cursor-pointer items-center gap-1 rounded-md border px-2 py-1 transition-colors lg:min-h-0 lg:px-1.5',
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card',
  'disabled:cursor-not-allowed',
].join(' ')

/** Three tiers, so the ladder is legible at a glance: on deck, in the bag, not owned. */
const CHIP_SELECTED_CLASS = 'border-primary bg-primary/15 text-foreground'

const CHIP_OWNED_CLASS = 'border-border/70 bg-muted/50 text-muted-foreground opacity-80 hover:bg-muted hover:opacity-100'

const CHIP_EMPTY_CLASS = 'border-dashed border-border/60 bg-transparent text-muted-foreground/60 opacity-50 grayscale'

const BALL_ART_SIZE = 20

function chipToneClass(isSelected: boolean, isEmpty: boolean): string {
  if (isSelected) return CHIP_SELECTED_CLASS
  return isEmpty ? CHIP_EMPTY_CLASS : CHIP_OWNED_CLASS
}

interface BallPickerProps {
  /** Catalogue order, cheapest first — rendered as-is. */
  options: BallOption[]
  selected: BallType
  /**
   * The chance the SERVER reported for the selected ball against this pokemon, learned from a
   * throw that already happened. Null until then, when the catalogue's base rate stands in.
   */
  confirmedChance: number | null
  disabled: boolean
  /** Art for balls whose own palette has not landed yet — the active theme's ball. */
  fallbackVariant: PokeballVariant
  onSelect: (ballType: BallType) => void
  className?: string
}

/**
 * Ball picker for the detail page's throw.
 *
 * The odds line is deliberately MODEST: the server multiplies the ball's base rate by a per-pokemon
 * rarity factor this client cannot compute, so before any throw the line shows the ball's own rate
 * marked as an approximation ("Poké Ball · ~40%") — an upper bound the real chance can only sit
 * under. Once a throw comes back, the server's own `chance` for that ball replaces the estimate and
 * the tilde drops, so the number on screen can never contradict the one the server rolled against.
 */
export function BallPicker({ options, selected, confirmedChance, disabled, fallbackVariant, onSelect, className }: BallPickerProps): JSX.Element | null {
  const { i18n } = useTranslation()
  const hintId = useId()

  if (options.length === 0) return null

  const active = findOption(options, selected)
  const percent = (value: number): string => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 0 }).format(value)
  // No catalogue (its request failed) means no name and no rate to quote — the chips still work.
  const hint = active === undefined || active.name === '' ? null : `${active.name} · ${confirmedChance === null ? `~${percent(active.catchRate)}` : percent(confirmedChance)}`

  return (
    <div className={cn(PLATE_CLASS, className)}>
      <div role="group" aria-labelledby={hint === null ? undefined : hintId} className="flex items-center justify-center gap-1.5">
        {options.map((option) => {
          const isSelected = option.type === selected
          const isEmpty = option.quantity === 0
          return (
            <button
              key={option.type}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${option.name === '' ? option.type : option.name} ×${String(option.quantity)}`}
              disabled={disabled || isEmpty}
              onClick={() => { onSelect(option.type) }}
              className={cn(CHIP_CLASS, chipToneClass(isSelected, isEmpty))}
            >
              <PokeballMark variant={ballArtVariant(option.type, fallbackVariant)} size={BALL_ART_SIZE} />
              <span aria-hidden className="text-[11px] font-bold leading-none tabular-nums">×{option.quantity}</span>
            </button>
          )
        })}
      </div>
      {hint !== null && <p id={hintId} className="m-0 text-center text-[11px] font-bold leading-tight text-muted-foreground">{hint}</p>}
    </div>
  )
}
