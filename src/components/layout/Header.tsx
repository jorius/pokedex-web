// External
import { Loader2, LogOut } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useNavigate } from 'react-router'

// Hooks
import { useTheme } from '../../hooks/UseTheme'

// Lib
import { cn } from '../../lib/Cn'

// Store
import { useLogoutSessionMutation } from '../../store/Api'
import { sessionCleared } from '../../store/AuthSlice'
import { useAppDispatch, useAppSelector } from '../../store/Hooks'
import { getRefreshToken } from '../../store/RefreshTokenStorage'

// Components
import { PokeballMark } from '../brand/PokeballMark'
import { THEME_POKEBALL } from '../brand/PokeballPalettes'
import { WalletChip } from '../economy/WalletChip'
import { BackendSwitcher } from './BackendSwitcher'
import { HeaderMenu } from './HeaderMenu'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NAV_ITEMS } from './NavItems'
import { BACKEND_TRIGGER_CLASS } from './SwitcherStyles'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Button } from '../ui/Button'

const NAV_LINK_CLASS = 'text-sm font-bold text-muted-foreground transition-colors hover:text-foreground'
const NAV_LINK_ACTIVE_CLASS = 'text-primary hover:text-primary'

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(NAV_LINK_CLASS, isActive && NAV_LINK_ACTIVE_CLASS)
}

/**
 * ONE ROW, EVERY WIDTH.
 *
 * This header used to be a `flex-wrap` row that grew a line whenever its contents stopped fitting.
 * They stopped fitting at 1440: brand+nav and the authenticated control cluster wanted ~1294px
 * (~1388 in Spanish) of a 1152px container, so the desktop header was permanently two rows deep,
 * and at 412px it was four (five in Spanish) — roughly 350-400px of a 915px phone screen spent
 * before any content. Wrapping is now off entirely; the row fits by construction on both sides of
 * one breakpoint:
 *
 *   >= xl (1280)  the full bar. The budget is met by taking the two switchers whose value the page
 *                 already states — language (the UI is IN it) and theme (the trigger IS its ball) —
 *                 down to icon triggers, and by showing the account as the bare address rather than
 *                 the "Logged in as {email}" sentence, with the sentence kept on `title`. Backend
 *                 keeps its label: live backend switching is the app's headline feature. Measured
 *                 at 1440: 1022px English / 1115px Spanish against 1152 available.
 *   <  xl         brand + wallet chip + a menu button opening HeaderMenu, which stacks the nav, all
 *                 three switchers and the account actions at full width. See that file.
 *
 * The wallet chip stays on the bar at every width rather than moving into the drawer: it is the one
 * control here that is READ rather than operated, it changes constantly (catch, shop, slots), and
 * the whole economy is meaningless if the balance costs a tap to see.
 */
export function Header(): JSX.Element {
  const { t } = useTranslation()
  const { theme } = useTheme()
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

  function handleLogoutClick(): void {
    void handleLogout()
  }

  const navItems = NAV_ITEMS.filter((item) => !item.isAuthOnly || user !== null)

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      {/* The stripe carries the theme's SIGNATURE colour, so it must be --primary: on --accent it
          rendered emerald's gold over a green page, and the toggle right beneath it (bg-primary)
          disagreed with it in every theme. --accent is now reserved for the small ticks. */}
      <div aria-hidden className="h-1 bg-primary" />
      {/* No flex-wrap and no min-h growth: the row is sized to fit at every width above, so a
          second line can only ever mean something has overflowed. */}
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-5">
        {/* The mark is the way home on a phone, where the nav links live behind the menu button. */}
        <Link
          to="/"
          aria-label={t('nav.browse')}
          className={cn(
            'flex shrink-0 items-center gap-2.5 rounded-md outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
          )}
        >
          <PokeballMark variant={THEME_POKEBALL[theme]} size={22} />
          <span className="font-display text-lg font-bold tracking-wide text-foreground sm:text-xl">{t('common.appName')}</span>
        </Link>

        <nav className="hidden items-center gap-3 xl:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.isExact} className={navLinkClassName}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* ml-auto right-aligns the controls without a parent justify-between, which would have
            stranded the nav in the middle of the row once it is hidden below xl. */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Mounted only when signed in — /api/economy/wallet is a 401 for everyone else. */}
          {user && <WalletChip />}

          <div className="hidden items-center gap-2 xl:flex">
            <BackendSwitcher className={BACKEND_TRIGGER_CLASS} />
            <LanguageSwitcher compact />
            <ThemeSwitcher compact />
            {user ? (
              <div className="flex items-center gap-2">
                {/* The address alone, not the whole sentence: "Logged in as " cost ~90px of a row
                    that had none to give, and says nothing the position in the header does not. */}
                <span title={t('auth.loggedInAs', { email: user.email })} className="max-w-28 truncate text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" disabled={isLoggingOut} onClick={handleLogoutClick}>
                  {isLoggingOut ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden /> : <LogOut aria-hidden />}
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" size="sm">
                <NavLink to="/login">{t('nav.login')}</NavLink>
              </Button>
            )}
          </div>

          <HeaderMenu user={user} isLoggingOut={isLoggingOut} onLogout={handleLogoutClick} className="xl:hidden" />
        </div>
      </div>
    </header>
  )
}
