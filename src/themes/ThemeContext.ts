// External
import { createContext } from 'react'

/**
 * Ordered by game generation so the Select reads like a shelf of cartridges:
 * Gen 3 (Emerald/Ruby/Sapphire), the Gen 3 remakes (FireRed/LeafGreen), Gen 4 (Diamond/Pearl),
 * then Gen 5 (Black & White, light and dark). The default sits first.
 *
 * Adding a theme means touching four places: this list, its token set in themes.css, its ball in
 * PokeballPalettes.ts (THEME_POKEBALL is keyed by Theme, so TypeScript will demand it), and the
 * no-flash script's array in index.html — that last one is plain JS and CANNOT be type-checked.
 */
export const THEMES = ['emerald', 'ruby', 'sapphire', 'firered', 'leafgreen', 'diamond', 'pearl', 'bw-light', 'bw-dark'] as const

export type Theme = (typeof THEMES)[number]

export const THEME_STORAGE_KEY = 'pokedex.theme'

export const DEFAULT_THEME: Theme = 'emerald'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}
