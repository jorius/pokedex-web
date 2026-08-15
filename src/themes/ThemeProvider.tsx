// External
import { useCallback, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'

// Themes
import { DEFAULT_THEME, THEME_STORAGE_KEY, ThemeContext, isTheme } from './ThemeContext'
import type { Theme } from './ThemeContext'

/**
 * Owns the app theme end to end: React state + <html data-theme> attribute + localStorage.
 *
 * Decision (deviation from the plan's uiSlice sketch): theme state lives HERE permanently,
 * not in Redux. The no-flash script in index.html and this provider are already the two
 * halves of theme persistence; mirroring the value into uiSlice would create a second
 * source of truth for no benefit. uiSlice keeps pageSize (and language only if i18next
 * does not persist it itself).
 */
interface ThemeProviderProps {
  children: ReactNode
}

function readInitialTheme(): Theme {
  // The no-flash script in index.html sets this before React mounts
  const fromDom = document.documentElement.dataset.theme
  if (isTheme(fromDom)) return fromDom

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    // Storage unavailable — fall through to the default
  }

  return DEFAULT_THEME
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme)

  const setTheme = useCallback((next: Theme): void => {
    setThemeState(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage unavailable — theme still applies for this session
    }
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
