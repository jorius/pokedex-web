// External
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

// Theme lives in ThemeProvider and language lives in i18next — see their own persistence.
// uiSlice carries ONLY browse-surface preferences (page size, browse mode), per the plan's
// binding store design.
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
}

const initialState: UiState = {
  pageSize: readInitialPageSize(),
  browseMode: readInitialBrowseMode(),
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
  },
})

export const { setPageSize, setBrowseMode } = uiSlice.actions
export const uiReducer = uiSlice.reducer
