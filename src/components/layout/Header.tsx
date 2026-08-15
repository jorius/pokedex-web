// External
import { Loader2, LogOut } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router'

// Hooks
import { useTheme } from '../../hooks/UseTheme'

// Lib
import { cn } from '../../lib/Cn'

// Store
import { useLogoutSessionMutation } from '../../store/Api'
import { sessionCleared } from '../../store/AuthSlice'
import { useAppDispatch, useAppSelector } from '../../store/Hooks'
import { getRefreshToken } from '../../store/RefreshTokenStorage'

// Themes
import { THEMES, isTheme } from '../../themes/ThemeContext'
import type { Theme } from '../../themes/ThemeContext'

// Components
import { PokeballMark } from '../brand/PokeballMark'
import { THEME_POKEBALL } from '../brand/PokeballPalettes'
import { BackendSwitcher } from './BackendSwitcher'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from '../ui/Button'
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

const NAV_LINK_CLASS = 'text-sm font-bold text-muted-foreground transition-colors hover:text-foreground'
const NAV_LINK_ACTIVE_CLASS = 'text-primary hover:text-primary'

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(NAV_LINK_CLASS, isActive && NAV_LINK_ACTIVE_CLASS)
}

export function Header(): JSX.Element {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [logoutSession, { isLoading: isLoggingOut }] = useLogoutSessionMutation()

  async function handleLogout(): Promise<void> {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      // logoutSession clears the session itself (see Api.ts onQueryStarted) whether the
      // server call succeeds or fails — the local session must not survive a logout either way.
      await logoutSession(refreshToken).unwrap().catch(() => undefined)
    } else {
      dispatch(sessionCleared())
    }
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      {/* The stripe carries the theme's SIGNATURE colour, so it must be --primary: on --accent it
          rendered emerald's gold over a green page, and the toggle right beneath it (bg-primary)
          disagreed with it in every theme. --accent is now reserved for the small ticks. */}
      <div aria-hidden className="h-1 bg-primary" />
      {/* min-h + py instead of a fixed h-14: when longer locale strings (ES) force the controls
          onto a second line the header must grow — a fixed height made the rows collide. */}
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-1">
          <span className="flex shrink-0 items-center gap-2.5">
            <PokeballMark variant={THEME_POKEBALL[theme]} size={22} />
            <span className="font-display text-xl font-bold tracking-wide text-foreground">{t('common.appName')}</span>
          </span>
          <nav className="flex items-center gap-4">
            <NavLink to="/" end className={navLinkClassName}>
              {t('nav.browse')}
            </NavLink>
            <NavLink to="/collection" className={navLinkClassName}>
              {t('nav.collection')}
            </NavLink>
          </nav>
        </div>
        {/* ml-auto (not parent justify-between) keeps the controls right-aligned even when flex-wrap
            drops them onto their own line. */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <BackendSwitcher />
          <LanguageSwitcher />
          <Select value={theme} onValueChange={(value): void => { if (isTheme(value)) setTheme(value) }}>
            {/* No leading icon of our own here (the generic palette glyph used to sit where the
                ball is now): Radix portals the SELECTED item's <ItemText> children into the
                trigger, so putting the ball inside each option renders it in the trigger too —
                one source, and the trigger can never disagree with the list. The ball is
                decorative (aria-hidden inside PokeballMark) and contributes no textContent, so
                the hidden native <option> and typeahead still see just the label; `textValue`
                states that explicitly rather than relying on the DOM fallback. */}
            <SelectTrigger aria-label={t('theme.label')} title={t(`theme.${THEME_I18N_KEYS[theme]}`)} className="w-40">
              <SelectValue />
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
          {user ? (
            <div className="flex items-center gap-2">
              <span title={t('auth.loggedInAs', { email: user.email })} className="hidden max-w-48 truncate text-sm text-muted-foreground sm:inline-block">
                {t('auth.loggedInAs', { email: user.email })}
              </span>
              <Button variant="ghost" size="sm" disabled={isLoggingOut} onClick={(): void => { void handleLogout() }}>
                {isLoggingOut ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" size="sm">
              <NavLink to="/login">{t('nav.login')}</NavLink>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
