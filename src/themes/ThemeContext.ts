// External
import { createContext } from 'react'

export const THEMES = ['emerald', 'firered', 'bw-light', 'bw-dark'] as const

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
