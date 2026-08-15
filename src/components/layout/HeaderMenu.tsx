// External
import { LogIn, LogOut, Loader2, Menu, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

// Hooks
import { useTheme } from '../../hooks/UseTheme'

// Lib
import { cn } from '../../lib/Cn'

// Store
import type { AuthUser } from '../../store/Types'

// Components
import { PokeballMark } from '../brand/PokeballMark'
import { THEME_POKEBALL } from '../brand/PokeballPalettes'
import { BackendSwitcher } from './BackendSwitcher'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NAV_ITEMS } from './NavItems'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Button } from '../ui/Button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../ui/Sheet'

/** The width below which the bar collapses into this drawer — Tailwind's `xl`, in JS. */
const DESKTOP_QUERY = '(min-width: 80rem)'

/** 48px rows: the drawer IS the navigation on a phone, so every row is a comfortable thumb target. */
const ROW_CLASS = [
  'flex h-12 items-center gap-3 rounded-md px-3 text-base font-bold transition-colors',
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
].join(' ')

const ROW_IDLE_CLASS = 'text-foreground hover:bg-muted'

/** Matches the desktop bar's active link, which is `text-primary`, plus a wash the wider row can carry. */
const ROW_ACTIVE_CLASS = 'bg-primary/10 text-primary'

const SECTION_LABEL_CLASS = 'px-3 pb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground'

interface HeaderMenuProps {
  user: AuthUser | null
  isLoggingOut: boolean
  onLogout: () => void
  className?: string
}

/**
 * Everything the desktop bar shows on one row, stacked into a drawer for small screens.
 *
 * WHY A DRAWER AND NOT A DENSER BAR. The authenticated control cluster — wallet, three switchers,
 * the account block — needs ~640px beside a ~360-420px brand and nav. There is no honest way to fit
 * that on a 412px phone: the previous header simply wrapped, and at 412 it spent four rows and ~350
 * pixels (five and ~400 in Spanish) of a 915px screen before any content appeared. Collapsing to
 * `brand + wallet + menu` puts the header back to one 56px row on every width, and the things that
 * moved are the ones a phone user touches rarely (backends, language, theme, sign-out) while the
 * one they read constantly, the wallet, stays visible on the bar itself.
 *
 * Navigation rows are wrapped in `SheetClose`, so following a link closes the drawer as part of the
 * same gesture rather than leaving it hanging over the page that just loaded.
 */
export function HeaderMenu({ user, isLoggingOut, onLogout, className }: HeaderMenuProps): JSX.Element {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  // The trigger disappears at xl, but an already-open drawer is portalled and would survive the
  // resize — a panel with no way back to it. Close it as the desktop bar takes over.
  useEffect(() => {
    if (!isOpen) return undefined
    const media = window.matchMedia(DESKTOP_QUERY)
    const handleChange = (): void => { if (media.matches) setIsOpen(false) }
    handleChange()
    media.addEventListener('change', handleChange)
    return (): void => { media.removeEventListener('change', handleChange) }
  }, [isOpen])

  const items = NAV_ITEMS.filter((item) => !item.isAuthOnly || user !== null)

  function close(): void {
    setIsOpen(false)
  }

  function handleLogoutClick(): void {
    close()
    onLogout()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('nav.menu')} className={cn('size-10 shrink-0', className)}>
          <Menu aria-hidden className="size-5" />
        </Button>
      </SheetTrigger>

      {/* No description: the drawer's contents ARE its description, and Radix only warns when the
          prop is absent rather than explicitly opted out of. */}
      <SheetContent aria-describedby={undefined}>
        {/* pr-14 keeps the title clear of the close button pinned to the same corner. */}
        <div className="flex shrink-0 items-center gap-2.5 border-b px-4 py-4 pr-14">
          <PokeballMark variant={THEME_POKEBALL[theme]} size={22} />
          <SheetTitle>{t('common.appName')}</SheetTitle>
        </div>

        <nav aria-label={t('nav.navigation')} className="flex flex-col gap-1 p-3">
          <p className={SECTION_LABEL_CLASS}>{t('nav.navigation')}</p>
          {/* Closed with an onClick rather than by wrapping each row in `SheetClose asChild`:
              Radix's Slot MERGES className onto the child, and NavLink's className is a FUNCTION
              (it needs `isActive`). Slot stringified that function into the class attribute, so the
              rows silently lost every style they had — including `flex`, which left the icon
              stacked on top of its own label. Closing by hand keeps the function intact. */}
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.isExact}
                onClick={close}
                className={({ isActive }): string => cn(ROW_CLASS, isActive ? ROW_ACTIVE_CLASS : ROW_IDLE_CLASS)}
              >
                <Icon aria-hidden className="size-5 shrink-0" />
                {t(item.labelKey)}
              </NavLink>
            )
          })}
        </nav>

        <div className="flex flex-col gap-3 border-t p-3 pt-4">
          <p className={SECTION_LABEL_CLASS}>{t('nav.settings')}</p>
          {/* Labelled and full width here — the drawer has the room the bar does not, so the two
              switchers that go icon-only up there get their names back. */}
          <div className="flex flex-col gap-1.5 px-3">
            <span className="text-xs font-bold text-muted-foreground">{t('backend.label')}</span>
            <BackendSwitcher />
          </div>
          <div className="flex flex-col gap-1.5 px-3">
            <span className="text-xs font-bold text-muted-foreground">{t('language.label')}</span>
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col gap-1.5 px-3">
            <span className="text-xs font-bold text-muted-foreground">{t('theme.label')}</span>
            <ThemeSwitcher />
          </div>
        </div>

        {/* mt-auto pins the account block to the bottom of a tall drawer, where a thumb reaches. */}
        <div className="mt-auto flex flex-col gap-3 border-t p-3 pt-4">
          <p className={SECTION_LABEL_CLASS}>{t('nav.account')}</p>
          {user ? (
            <>
              <p title={t('auth.loggedInAs', { email: user.email })} className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
                <User aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
              {/* Closes as it fires: the logout redirects to Browse, and a drawer still hanging
                  over the page it landed on would have to be dismissed by hand. */}
              <Button variant="outline" disabled={isLoggingOut} onClick={handleLogoutClick} className="mx-3 h-11">
                {isLoggingOut ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden /> : <LogOut aria-hidden />}
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <Button asChild className="mx-3 h-11">
              <NavLink to="/login" onClick={close}>
                <LogIn aria-hidden />
                {t('nav.login')}
              </NavLink>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
