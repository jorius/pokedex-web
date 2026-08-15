// External
import { useContext } from 'react'

// Themes
import { ThemeContext } from '../themes/ThemeContext'
import type { ThemeContextValue } from '../themes/ThemeContext'

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
