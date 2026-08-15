// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useTheme } from '../../hooks/UseTheme'

// Lib
import { cn } from '../../lib/Cn'

// Themes
import { THEMES, isTheme } from '../../themes/ThemeContext'
import type { Theme } from '../../themes/ThemeContext'

// Components
import { PokeballMark } from '../brand/PokeballMark'
import { THEME_POKEBALL } from '../brand/PokeballPalettes'
import { ICON_TRIGGER_CLASS } from './SwitcherStyles'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'

// Theme keys map 1:1 to i18n `theme.*` keys, kept in a lookup so a raw `theme` value
// (e.g. 'bw-light') resolves to its camelCase key (e.g. 'bwLight') without a switch.
// `satisfies` (not an annotation) keeps the literal value types t() needs while still failing the
// build if a theme is added to THEMES without a label here.
const THEME_I18N_KEYS = {
  emerald: 'emerald',
  ruby: 'ruby',
  sapphire: 'sapphire',
  firered: 'firered',
  leafgreen: 'leafgreen',
  diamond: 'diamond',
  pearl: 'pearl',
  'bw-light': 'bwLight',
  'bw-dark': 'bwDark',
} as const satisfies Record<Theme, string>

interface ThemeSwitcherProps {
  /**
   * Icon-only trigger — the desktop bar, where nine theme names could not be afforded on one row.
   * The drawer uses the full labelled trigger instead, because there the width is free.
   */
  compact?: boolean
  className?: string
}

/**
 * The nine-theme picker, in both of the shapes the header needs.
 *
 * Compact renders the active theme's pokeball ALONE. That is a deliberate departure from the
 * labelled trigger's mechanism (which lets Radix portal the selected `<ItemText>` — ball and name
 * together — so the trigger cannot disagree with the list): with no label to carry, the ball is
 * drawn from `THEME_POKEBALL[theme]`, the very map the list items read, so the two still cannot
 * disagree. The name that the compact trigger drops is carried by `title` and by the aria-label.
 */
export function ThemeSwitcher({ compact = false, className }: ThemeSwitcherProps): JSX.Element {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <Select value={theme} onValueChange={(value): void => { if (isTheme(value)) setTheme(value) }}>
      <SelectTrigger
        aria-label={t('theme.label')}
        title={t(`theme.${THEME_I18N_KEYS[theme]}`)}
        showChevron={!compact}
        className={cn(compact ? ICON_TRIGGER_CLASS : 'w-full', className)}
      >
        {compact ? <PokeballMark variant={THEME_POKEBALL[theme]} size={20} /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map((value) => (
          <SelectItem key={value} value={value} textValue={t(`theme.${THEME_I18N_KEYS[value]}`)}>
            <span className="flex min-w-0 items-center gap-2">
              <PokeballMark variant={THEME_POKEBALL[value]} size={17} />
              <span className="truncate">{t(`theme.${THEME_I18N_KEYS[value]}`)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
