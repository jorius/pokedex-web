// External
import { Sparkles } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'
import type { ShinyState } from '../../lib/Sprite'

// Styles — keyframes for this treatment only, kept out of the global stylesheet.
import './ShinyOverlay.css'

/** Matched to the well it sits in: a 56px search thumb up to a browse card's specimen well. */
type ShinyOverlaySize = 'sm' | 'md'

const CORNER_CLASS: Record<ShinyOverlaySize, string> = {
  sm: 'right-1 top-1 size-3.5',
  md: 'right-1.5 top-1.5 size-4.5',
}

interface ShinyMarkProps {
  /** Straight from `resolveSpriteUrl` — 'off' renders nothing at all. */
  state: ShinyState
  className?: string
}

/**
 * The glyph itself, unpositioned, for surfaces that have their own place to put it (the detail
 * page hangs it in the name plate, where the artwork's own corners are already spoken for).
 *
 * Two glyphs in one: a live sparkle when shiny artwork is on screen, and a struck-through sparkle
 * in muted ink when there ISN'T any and the normal sprite is standing in. The second is the whole
 * point of the fallback — the sprite must never be a broken image (see resolveSpriteUrl), so this
 * is what answers "why is this one not shiny?", on hover and to a screen reader, without a badge
 * shouting over the artwork.
 */
export function ShinyMark({ state, className }: ShinyMarkProps): JSX.Element | null {
  const { t } = useTranslation()

  if (state === 'off') return null

  if (state === 'fallback') {
    return (
      <span
        role="img"
        aria-label={t('shiny.noArtwork')}
        title={t('shiny.noArtwork')}
        className={cn('relative inline-flex text-muted-foreground/70', className)}
      >
        <Sparkles aria-hidden className="size-full" />
        {/* The "no such thing" slash, drawn rather than iconified — lucide has no struck sparkle. */}
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rotate-45 rounded-full bg-muted-foreground/80" />
      </span>
    )
  }

  return <Sparkles aria-hidden className={cn('shiny-glint text-accent drop-shadow-sm', className)} />
}

interface ShinyOverlayProps {
  state: ShinyState
  size?: ShinyOverlaySize
  /**
   * Draw the corner glyph. Off for wells whose corners are covered by something else — the caller
   * then places a <ShinyMark> of its own so the state is still announced somewhere.
   */
  mark?: boolean
}

/**
 * The shiny treatment over a sprite well: a slow accent shine sweeping the frame plus the mark in
 * the corner, so a shiny grid is obvious at a glance rather than a "did that always look like
 * that?". Absolutely positioned — the well it goes in must be `relative`.
 *
 * The shine is pure decoration and stays aria-hidden; only the fallback mark is ever announced.
 * A well showing the normal sprite because there is no shiny art gets NO shine, just the mark:
 * lighting up artwork that is not actually shiny would be the misleading half of the feature.
 */
export function ShinyOverlay({ state, size = 'md', mark = true }: ShinyOverlayProps): JSX.Element | null {
  if (state === 'off') return null

  return (
    <>
      {state === 'shiny' && <span aria-hidden className="shiny-sheen" />}
      {mark && <ShinyMark state={state} className={cn('absolute', CORNER_CLASS[size])} />}
    </>
  )
}
