/**
 * Geometry shared by the three header switchers, so the desktop bar's icon rail and the drawer's
 * stacked rows stay in step when any one of them is touched.
 *
 * The desktop bar has a hard width budget: at 1440 the container is 1152px, and with the wallet
 * chip, the account block and the Spanish nav (whose labels run ~60px longer than English) the
 * three switchers cannot all be labelled dropdowns — that is precisely what pushed the row onto a
 * second line. Only the BACKEND switcher keeps its label, because live backend switching is this
 * frontend's headline feature and "which service am I talking to" has to be readable at a glance.
 * Language and theme go icon-only: the interface is already IN the current language, and the
 * active theme is already the ball on the trigger, so both labels were restating what the page
 * itself shows. Each keeps `title` + `aria-label`, so nothing is lost to a screen reader.
 */

/** Icon-only trigger. size-10 is also the minimum comfortable touch target. */
export const ICON_TRIGGER_CLASS = 'size-10 shrink-0 justify-center px-0'

/** The one labelled trigger left on the desktop bar. */
export const BACKEND_TRIGGER_CLASS = 'w-38'
