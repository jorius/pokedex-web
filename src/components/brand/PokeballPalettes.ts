// Themes
import type { Theme } from '../../themes/ThemeContext'

/**
 * The nine collectible balls, one per game theme (owner's game/ball mapping):
 * emerald -> Nest, firered -> Repeat, bw-light -> Premier, bw-dark -> Luxury,
 * leafgreen -> Friend, ruby -> Level, sapphire -> Dive, diamond -> Net, pearl -> Heal.
 *
 * NOTE ON COLORS: these palettes are intentionally LITERAL, game-accurate ball colors — not theme
 * tokens. A Nest Ball is leaf-green and gold no matter which theme renders it; the mark must stay
 * recognizable as its ball across themes and inside the upcoming capture animation. Everything
 * else in the UI keeps consuming tokens (`bg-primary`, `text-foreground`, ...) exclusively.
 *
 * Each ball also has to survive the header at 22px, where only ONE strong idea per ball reads:
 * nest = zigzag teeth, friend = single gold chevron, repeat = dot arc, level = stacked gold bars,
 * dive = light-blue swell, net = black mesh, heal = gold band trim, premier = bare white,
 * luxury = gold pinstripes. Balls that share a hue (nest/friend green, repeat/level red) are
 * separated further by band and button treatment so they never read as the same mark.
 */
export type PokeballVariant = 'nest' | 'repeat' | 'premier' | 'luxury' | 'friend' | 'level' | 'dive' | 'net' | 'heal'

export interface PokeballPalette {
  /** Upper hemisphere fill. */
  top: string
  /** Lower hemisphere fill. */
  bottom: string
  /** Horizontal band across the middle. */
  band: string
  /** Signature flourish: nest gold teeth, repeat gold stripe, premier red seam, luxury gold pinstripes,
   * friend gold chevron, level gold meter bars, dive light-blue swell, net black mesh, heal gold trim. */
  accent: string
  /** Secondary detailing: nest deep-green cap, repeat black dots, premier seam shadow, luxury band edging,
   * friend crown shading, level dark seam, dive deep-water crown, net silver rim, heal rose tabs. */
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
  ruby: 'level',
  sapphire: 'dive',
  firered: 'repeat',
  leafgreen: 'friend',
  diamond: 'net',
  pearl: 'heal',
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
  /** Friend Ball (LeafGreen) — bright leaf-green dome, single gold chevron, gold-ringed button, cream lower. */
  friend: {
    top: '#57a83f',
    bottom: '#f4efd8',
    band: '#2b3324',
    accent: '#f0c33c',
    detail: '#2f6b2a',
    outline: '#26361f',
    buttonRim: '#f0c33c',
    buttonRing: '#2b3324',
    buttonCore: '#f4efd8',
  },
  /** Level Ball (Ruby) — magma-red top, two stacked gold meter bars, dark seam, white lower. */
  level: {
    top: '#e2542a',
    bottom: '#f4f2ee',
    band: '#1b1a1e',
    accent: '#f2b323',
    detail: '#8c2f14',
    outline: '#1b1a1e',
    buttonRim: '#1b1a1e',
    buttonRing: '#f2b323',
    buttonCore: '#ffffff',
  },
  /** Dive Ball (Sapphire) — deep-water blue crown, light-blue swell, black band, ice-blue lower. */
  dive: {
    top: '#1466b5',
    bottom: '#a9dcf2',
    band: '#121417',
    accent: '#6fcdf0',
    detail: '#0d4c88',
    outline: '#123a5e',
    buttonRim: '#121417',
    buttonRing: '#d8f2fb',
    buttonCore: '#6fcdf0',
  },
  /** Net Ball (Diamond) — teal-blue top under a black mesh, black band, silver lower and rim. */
  net: {
    top: '#2a8cad',
    bottom: '#dfe6ea',
    band: '#15181c',
    accent: '#1b2126',
    detail: '#b9c4cc',
    outline: '#1c3a45',
    buttonRim: '#b9c4cc',
    buttonRing: '#f2f6f8',
    buttonCore: '#2a8cad',
  },
  /** Heal Ball (Pearl) — pink top with rose tabs, rose band framed in gold, white lower. */
  heal: {
    top: '#f295bd',
    bottom: '#fdfbfd',
    band: '#cf4266',
    accent: '#eec24a',
    detail: '#d9527c',
    outline: '#b8476a',
    buttonRim: '#cf4266',
    buttonRing: '#fdfbfd',
    buttonCore: '#eec24a',
  },
}
