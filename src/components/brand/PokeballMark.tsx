// External
import { useId } from 'react'
import type { JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

// Components
import { POKEBALL_PALETTES } from './PokeballPalettes'
import type { PokeballPalette, PokeballVariant } from './PokeballPalettes'

interface PokeballMarkProps {
  variant: PokeballVariant
  /** Rendered square size in px. The art is authored on a 24x24 grid and scales cleanly (header ~22px, capture animation ~96px). */
  size?: number
  className?: string
}

/**
 * Per-ball flourishes drawn inside the circle clip, on top of the hemispheres and band.
 * Geometry lives here (identical every render); colors come from the palette record.
 */
function renderAccents(variant: PokeballVariant, palette: PokeballPalette): JSX.Element {
  switch (variant) {
    case 'nest':
      return (
        <>
          {/* Deep leaf-green cap: a circle centered above the ball; its intersection with the clip reads as a darker crown */}
          <circle cx="12" cy="1" r="6.8" fill={palette.detail} />
          {/* Gold nest teeth: the Nest Ball's leaf-like zigzag notches across the top hemisphere */}
          <path d="M2 9.6 L5.4 6.9 L8.7 9.6 L12 6.9 L15.3 9.6 L18.6 6.9 L22 9.6 L22 10.8 L2 10.8 Z" fill={palette.accent} />
        </>
      )
    case 'repeat':
      return (
        <>
          {/* Gold stripe hugging the band — the Repeat Ball's yellow band accent */}
          <rect x="1.5" y="9.2" width="21" height="1.6" fill={palette.accent} />
          {/* Black dot pattern arcing over the top */}
          <circle cx="7.4" cy="6.3" r="1.2" fill={palette.detail} />
          <circle cx="12" cy="4.9" r="1.2" fill={palette.detail} />
          <circle cx="16.6" cy="6.3" r="1.2" fill={palette.detail} />
        </>
      )
    case 'premier':
      // Premier stays clean: only a soft seam shadow under the band; its red ring is on the button
      return <rect x="1.5" y="13.3" width="21" height="0.7" fill={palette.detail} />
    case 'luxury':
      return (
        <>
          {/* Gold pinstripe trim lines flanking the band */}
          <rect x="1.5" y="8.7" width="21" height="0.9" fill={palette.accent} />
          <rect x="1.5" y="14.4" width="21" height="0.9" fill={palette.accent} />
          {/* Darker gold edging on the band itself for depth at large sizes */}
          <rect x="1.5" y="10.7" width="21" height="0.5" fill={palette.detail} />
          <rect x="1.5" y="12.8" width="21" height="0.5" fill={palette.detail} />
        </>
      )
  }
}

/**
 * The themed brand mark: an SVG pokeball whose species and palette follow the active theme
 * (map a `Theme` through `THEME_POKEBALL`, or pass a variant directly). Hand-authored on a
 * 24x24 grid: hemispheres + band + three-layer button, plus per-ball accents from
 * `POKEBALL_PALETTES` — no external assets.
 */
export function PokeballMark({ variant, size = 24, className }: PokeballMarkProps): JSX.Element {
  // useId can emit characters (":", guillemets) that break `url(#...)` references — sanitize.
  const clipId = `pokeball-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const palette = POKEBALL_PALETTES[variant]

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={cn('shrink-0', className)} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d="M2 12a10 10 0 0 1 20 0Z" fill={palette.top} />
        <path d="M2 12a10 10 0 0 0 20 0Z" fill={palette.bottom} />
        <rect x="1" y="10.7" width="22" height="2.6" fill={palette.band} />
        {renderAccents(variant, palette)}
      </g>
      <circle cx="12" cy="12" r="3.5" fill={palette.buttonRim} />
      <circle cx="12" cy="12" r="2.5" fill={palette.buttonRing} />
      <circle cx="12" cy="12" r="1.3" fill={palette.buttonCore} />
      <circle cx="12" cy="12" r="10" fill="none" stroke={palette.outline} strokeWidth="1.5" />
    </svg>
  )
}
