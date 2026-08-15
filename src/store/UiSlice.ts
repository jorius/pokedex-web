// External
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

// Theme lives in ThemeProvider and language lives in i18next — see their own persistence.
// uiSlice carries the browse-surface preferences (page size, browse mode) per the plan's binding
// store design, plus ONE piece of cross-surface presentation state: the spin lock below.
export const PAGE_SIZES = [10, 20, 50] as const

export type PageSize = (typeof PAGE_SIZES)[number]

export const BROWSE_MODES = ['pagination', 'infinite'] as const

export type BrowseMode = (typeof BROWSE_MODES)[number]

const PAGE_SIZE_STORAGE_KEY = 'pokedex.pageSize'

const BROWSE_MODE_STORAGE_KEY = 'pokedex.browseMode'

const DEFAULT_PAGE_SIZE: PageSize = 20

const DEFAULT_BROWSE_MODE: BrowseMode = 'pagination'

export function isPageSize(value: unknown): value is PageSize {
  return typeof value === 'number' && (PAGE_SIZES as readonly number[]).includes(value)
}

export function isBrowseMode(value: unknown): value is BrowseMode {
  return typeof value === 'string' && (BROWSE_MODES as readonly string[]).includes(value)
}

function readInitialPageSize(): PageSize {
  try {
    const stored = localStorage.getItem(PAGE_SIZE_STORAGE_KEY)
    const parsed = stored === null ? null : Number(stored)
    if (isPageSize(parsed)) return parsed
  } catch {
    // Storage unavailable — fall through to the default
  }

  return DEFAULT_PAGE_SIZE
}

function readInitialBrowseMode(): BrowseMode {
  try {
    const stored = localStorage.getItem(BROWSE_MODE_STORAGE_KEY)
    if (isBrowseMode(stored)) return stored
  } catch {
    // Storage unavailable — fall through to the default
  }

  return DEFAULT_BROWSE_MODE
}

export interface UiState {
  pageSize: PageSize
  browseMode: BrowseMode
  /**
   * True from the moment a slots spin is paid for until the third reel has landed and the result
   * is on screen.
   *
   * WHY THIS IS GLOBAL. The spin mutation invalidates the 'Wallet' tag as soon as the SERVER
   * answers — up to a second before the last drum stops. Every subscriber of the wallet query
   * therefore learns the payout early, and the header's WalletChip used to redraw with the new
   * balance while the reels were still turning: the chip spoiled the cabinet's own reveal. The
   * cabinet could freeze its own meter (it did, with local state) but it cannot reach a component
   * mounted in the header, so the hold has to live somewhere both can read. It is presentation
   * state, not server state, so it belongs here rather than in the API cache.
   *
   * Deliberately NOT persisted: a spin cannot outlive the page it was started on, and a lock
   * restored from storage would freeze the chip forever.
   *
   * Read it through `useSpinLockedValue` (src/hooks/UseSpinLockedValue.ts) rather than directly —
   * that hook is what turns the flag into "keep showing the pre-spin figure".
   */
  isSpinLocked: boolean
}

const initialState: UiState = {
  pageSize: readInitialPageSize(),
  browseMode: readInitialBrowseMode(),
  isSpinLocked: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setPageSize(state, action: PayloadAction<PageSize>): void {
      state.pageSize = action.payload
      try {
        localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(action.payload))
      } catch {
        // Storage unavailable — page size still applies for this session
      }
    },

    setBrowseMode(state, action: PayloadAction<BrowseMode>): void {
      state.browseMode = action.payload
      try {
        localStorage.setItem(BROWSE_MODE_STORAGE_KEY, action.payload)
      } catch {
        // Storage unavailable — browse mode still applies for this session
      }
    },

    /** Dispatch on the SPIN click, before the mutation fires — the lock must already be on when
     *  the invalidated wallet query comes back. */
    spinLockEngaged(state): void {
      state.isSpinLocked = true
    },

    /** Dispatch when the last reel has landed (or the throw failed), and on the cabinet's own
     *  unmount — navigating away mid-spin must never leave the header pinned. */
    spinLockReleased(state): void {
      state.isSpinLocked = false
    },
  },
})

export const { setPageSize, setBrowseMode, spinLockEngaged, spinLockReleased } = uiSlice.actions
export const uiReducer = uiSlice.reducer
