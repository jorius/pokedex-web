// External
import { Palette } from 'lucide-react'
import type { JSX } from 'react'

// Hooks
import { useTheme } from '../../hooks/UseTheme'

// Themes
import { isTheme } from '../../themes/ThemeContext'
import type { Theme } from '../../themes/ThemeContext'

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'

// Labels are temporary until i18n lands in Task 3
const THEME_LABELS: Record<Theme, string> = {
  emerald: 'Emerald',
  firered: 'FireRed',
  'bw-light': 'B&W Light',
  'bw-dark': 'B&W Dark',
}

export function Header(): JSX.Element {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div aria-hidden className="h-1 bg-accent" />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="relative inline-flex size-5 items-center justify-center rounded-full border-2 border-foreground bg-primary">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-foreground" />
            <span className="relative size-1.5 rounded-full border border-foreground bg-card" />
          </span>
          <span className="font-display text-xl font-bold tracking-wide text-foreground">Pokedex</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={theme} onValueChange={(value): void => { if (isTheme(value)) setTheme(value) }}>
            <SelectTrigger aria-label="Theme" className="w-36">
              <span className="flex items-center gap-2">
                <Palette className="size-4 text-muted-foreground" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent align="end">
              {(Object.keys(THEME_LABELS) as Theme[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {THEME_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
