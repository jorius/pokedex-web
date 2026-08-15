// External
import { BookMarked, Dices, LayoutGrid, ShoppingCart } from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * The one list of primary destinations, read by BOTH shapes of the header: the desktop bar renders
 * it as text links, the small-screen drawer as icon rows. Keeping it here is what stops the two
 * drifting apart the next time a route is added.
 *
 * Icons exist for the drawer only. On a phone the rows are the whole navigation, and a column of
 * bare words is markedly harder to scan (and to hit) than a column of labelled icons; the desktop
 * bar deliberately stays text-only, exactly as it was.
 */
/**
 * Spelled out rather than `string` so the i18n key types (I18nTypes.d.ts) still check `t(labelKey)`
 * at the call sites — a widened key would silently opt this list out of that guarantee.
 */
export type NavLabelKey = 'nav.browse' | 'nav.collection' | 'nav.shop' | 'nav.slots'

export interface NavItem {
  to: string
  labelKey: NavLabelKey
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  /**
   * True for the economy routes. They sit behind RequireAuth, so advertising them to a visitor
   * would only promise a page that can bounce them to /login. Collection is deliberately NOT in
   * this group — it is shown to everyone, as it always has been.
   */
  isAuthOnly: boolean
  /** react-router `end` — only "/" needs it, or every route would light Browse up as active. */
  isExact?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.browse', icon: LayoutGrid, isAuthOnly: false, isExact: true },
  { to: '/collection', labelKey: 'nav.collection', icon: BookMarked, isAuthOnly: false },
  { to: '/shop', labelKey: 'nav.shop', icon: ShoppingCart, isAuthOnly: true },
  { to: '/slots', labelKey: 'nav.slots', icon: Dices, isAuthOnly: true },
]
