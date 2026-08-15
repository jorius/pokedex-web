// Themes
import type { Theme } from '../../themes/ThemeContext'

/**
 * The four collectible balls, one per game theme (owner's game/ball mapping):
 * emerald -> Nest Ball, firered -> Repeat Ball, bw-light -> Premier Ball, bw-dark -> Luxury Ball.
 *
 * NOTE ON COLORS: these palettes are intentionally LITERAL, game-accurate ball colors — not theme
 * tokens. A Nest Ball is leaf-green and gold no matter which theme renders it; the mark must stay
 * recognizable as its ball across themes and inside the upcoming capture animation. Everything
 * else in the UI keeps consuming tokens (`bg-primary`, `text-foreground`, ...) exclusively.
 */
export type PokeballVariant = 'nest' | 'repeat' | 'premier' | 'luxury'

export interface PokeballPalette {
  /** Upper hemisphere fill. */
  top: string
  /** Lower hemisphere fill. */
  bottom: string
  /** Horizontal band across the middle. */
  band: string
  /** Signature flourish: nest gold teeth, repeat gold stripe, premier red seam, luxury gold pinstripes. */
  accent: string
  /** Secondary detailing: nest deep-green cap, repeat black dots, premier seam shadow, luxury band edging. */
  detail: string
  /** Outer silhouette ring — keeps the mark crisp when the ball body nears the surface color. */
  outline: string
  /** Center button: outer rim ring. */
  buttonRim: string
  /** Center button: middle ring (Premier's clean red ring lives here). */
  buttonRing: string
  /** Center button: innermost core (Luxury's red center accent lives here). */
  buttonCore: string
}

/** Which ball each theme throws — exported so the capture animation (later task) reuses the mapping. */
export const THEME_POKEBALL: Record<Theme, PokeballVariant> = {
  emerald: 'nest',
  firered: 'repeat',
  'bw-light': 'premier',
  'bw-dark': 'luxury',
}

export const POKEBALL_PALETTES: Record<PokeballVariant, PokeballPalette> = {
  /** Nest Ball — deep leaf-green top, gold nest teeth, cream lower half. */
  nest: {
    top: '#2f7d45',
    bottom: '#f2e8cd',
    band: '#26332a',
    accent: '#eab63e',
    detail: '#1d5c31',
    outline: '#233024',
    buttonRim: '#233024',
    buttonRing: '#f7f1de',
    buttonCore: '#f7f1de',
  },
  /** Repeat Ball — red top, gold stripe over the band, black dot detailing, white lower half. */
  repeat: {
    top: '#d5372b',
    bottom: '#f6f5f3',
    band: '#1a181c',
    accent: '#f4b400',
    detail: '#1a181c',
    outline: '#1a181c',
    buttonRim: '#1a181c',
    buttonRing: '#ffffff',
    buttonCore: '#ffffff',
  },
  /** Premier Ball (White version) — clean white body, dark band, red ring around the button. */
  premier: {
    top: '#ffffff',
    bottom: '#eeedf1',
    band: '#43424a',
    accent: '#c93330',
    detail: '#d0cfd6',
    outline: '#4b4a52',
    buttonRim: '#43424a',
    buttonRing: '#c93330',
    buttonCore: '#ffffff',
  },
  /** Luxury Ball (Black version) — black body, gold band + pinstripe trim, red center accent. */
  luxury: {
    top: '#2b2830',
    bottom: '#1c1a20',
    band: '#d7a83f',
    accent: '#d7a83f',
    detail: '#8a6d24',
    outline: '#8a6d24',
    buttonRim: '#d7a83f',
    buttonRing: '#1c1a20',
    buttonCore: '#c23a30',
  },
}
