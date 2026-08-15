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
 *
 * THE FOUR SHOP BALLS (poke/great/ultra/master) are a SECOND family, added for the economy: they
 * are the ball TYPES the backend catalogue sells and the player throws, not theme mascots, so no
 * theme maps to them (THEME_POKEBALL stays a nine-entry record) and they are addressed by
 * `BallType` instead — see src/components/economy/BallArt.tsx. Their art is the canonical game
 * art rather than an invented flourish, because the shop is where a player must recognise what
 * they are buying at a glance: plain red poke, blue-and-red great with its white bands, the
 * black-and-yellow ultra H, and the purple master with its pink M.
 */
export type PokeballVariant =
  | 'nest' | 'repeat' | 'premier' | 'luxury' | 'friend' | 'level' | 'dive' | 'net' | 'heal'
  | 'poke' | 'great' | 'ultra' | 'master'

export interface PokeballPalette {
  /** Upper hemisphere fill. */
  top: string
  /** Lower hemisphere fill. */
  bottom: string
  /** Horizontal band across the middle. */
  band: string
  /** Signature flourish: nest gold teeth, repeat gold stripe, premier red seam, luxury gold pinstripes,
   * friend gold chevron, level gold meter bars, dive light-blue swell, net black mesh, heal gold trim,
   * poke specular gloss, great white bands, ultra yellow H, master pink M. */
  accent: string
  /** Secondary detailing: nest deep-green cap, repeat black dots, premier seam shadow, luxury band edging,
   * friend crown shading, level dark seam, dive deep-water crown, net silver rim, heal rose tabs,
   * poke seam shadow, great red crown, ultra gold shadow, master gold trim. */
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
  /** Poké Ball (shop, 200cr / 40%) — THE ball: scarlet dome, white shell, black band. Its only
   * flourish is a specular gloss, which is also what separates it from the other two red balls:
   * repeat carries a gold stripe and level a pair of gold meter bars. */
  poke: {
    top: '#e3372b',
    bottom: '#f6f5f3',
    band: '#1a181c',
    accent: '#f58a80',
    detail: '#dbd7d2',
    outline: '#1a181c',
    buttonRim: '#1a181c',
    buttonRing: '#ffffff',
    buttonCore: '#ffffff',
  },
  /** Great Ball (shop, 600cr / 60%) — cobalt dome under a red crown, the two white bands sweeping
   * up the sides, white shell. */
  great: {
    top: '#2f6fd0',
    bottom: '#f6f5f3',
    band: '#1a181c',
    accent: '#ffffff',
    detail: '#d3362c',
    outline: '#1a181c',
    buttonRim: '#1a181c',
    buttonRing: '#ffffff',
    buttonCore: '#ffffff',
  },
  /** Ultra Ball (shop, 1200cr / 80%) — black dome stamped with the yellow H, white shell. */
  ultra: {
    top: '#26252b',
    bottom: '#f6f5f3',
    band: '#1a181c',
    accent: '#f5c518',
    detail: '#b98f0c',
    outline: '#1a181c',
    buttonRim: '#1a181c',
    buttonRing: '#ffffff',
    buttonCore: '#f5c518',
  },
  /** Master Ball (shop, 5000cr / 100%) — royal purple dome with the pink M between its two studs,
   * gold trim above the band and around the button: the guaranteed catch should look expensive. */
  master: {
    top: '#6b3ba6',
    bottom: '#f4f0f8',
    band: '#1c1726',
    accent: '#ef5fa8',
    detail: '#dcb44a',
    outline: '#1c1726',
    buttonRim: '#dcb44a',
    buttonRing: '#f4f0f8',
    buttonCore: '#ef5fa8',
  },
}
