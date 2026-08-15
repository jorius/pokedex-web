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
    case 'friend':
      // No dark crown here (Nest has one): leaving the bright leaf green uncovered is what keeps
      // the two green balls apart at 22px — Friend reads light, Nest reads dark.
      return (
        <>
          {/* ONE bold gold chevron, the opposite of Nest's four-tooth zigzag */}
          <path d="M1.5 8.2 L12 4 L22.5 8.2 L22.5 10.6 L12 6.4 L1.5 10.6 Z" fill={palette.accent} />
          {/* Deep-green underline holding the chevron off the band */}
          <rect x="1.5" y="10.2" width="21" height="0.6" fill={palette.detail} />
        </>
      )
    case 'level':
      return (
        <>
          {/* Two thin gold meter bars, the short one on top — the Level Ball's gauge. Thin on
              purpose: fatter bars turn the magma red into a sunset gradient. */}
          <rect x="6.4" y="5.6" width="11.2" height="1.1" fill={palette.accent} />
          <rect x="3.8" y="8" width="16.4" height="1.1" fill={palette.accent} />
          {/* Dark seam under the band so the magma red never bleeds into the white lower half */}
          <rect x="1.5" y="13.3" width="21" height="0.8" fill={palette.detail} />
        </>
      )
    case 'dive':
      return (
        <>
          {/* Deep-water shading over the crown */}
          <circle cx="12" cy="0.8" r="6.2" fill={palette.detail} />
          {/* The swell: a light-blue wave rolling across the upper hemisphere into the band */}
          <path d="M2 8.8 C5.2 6.2 8.4 6.2 12 8.2 C15.6 10.2 18.8 8.6 22 6.6 L22 10.8 L2 10.8 Z" fill={palette.accent} />
        </>
      )
    case 'net':
      // Two diagonal families, 6 units apart, confined above the band — a mesh, not a moire:
      // any tighter and the lattice turns to mud at the header's 22px.
      return (
        <g stroke={palette.accent} strokeWidth="0.9" strokeLinecap="round" fill="none">
          <path d="M1 10.6 L10 1.6" />
          <path d="M7 10.6 L16 1.6" />
          <path d="M13 10.6 L22 1.6" />
          <path d="M23 10.6 L14 1.6" />
          <path d="M17 10.6 L8 1.6" />
          <path d="M11 10.6 L2 1.6" />
        </g>
      )
    case 'heal':
      return (
        <>
          {/* Gold trim framing the rose band, top and bottom */}
          <rect x="1.5" y="9.4" width="21" height="0.9" fill={palette.accent} />
          <rect x="1.5" y="13.7" width="21" height="0.9" fill={palette.accent} />
          {/* The two rose tabs riding the pink dome */}
          <circle cx="6.6" cy="6.6" r="1.5" fill={palette.detail} />
          <circle cx="17.4" cy="6.6" r="1.5" fill={palette.detail} />
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
