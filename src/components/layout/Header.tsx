// External
import { Palette } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useTheme } from '../../hooks/UseTheme'

// Themes
import { THEMES, isTheme } from '../../themes/ThemeContext'

// Components
import { LanguageSwitcher } from './LanguageSwitcher'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'

// Theme keys map 1:1 to i18n `theme.*` keys, kept in a lookup so a raw `theme` value
// (e.g. 'bw-light') resolves to its camelCase key (e.g. 'bwLight') without a switch.
const THEME_I18N_KEYS = {
  emerald: 'emerald',
  firered: 'firered',
  'bw-light': 'bwLight',
  'bw-dark': 'bwDark',
} as const

export function Header(): JSX.Element {
  const { t } = useTranslation()
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
          <span className="font-display text-xl font-bold tracking-wide text-foreground">{t('common.appName')}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Select value={theme} onValueChange={(value): void => { if (isTheme(value)) setTheme(value) }}>
            <SelectTrigger aria-label={t('theme.label')} className="w-36">
              <span className="flex items-center gap-2">
                <Palette className="size-4 text-muted-foreground" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent align="end">
              {THEMES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`theme.${THEME_I18N_KEYS[value]}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
