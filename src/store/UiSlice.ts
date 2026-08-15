// External
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

// Theme lives in ThemeProvider and language lives in i18next — see their own persistence.
// uiSlice carries ONLY pageSize, per the plan's binding store design.
export const PAGE_SIZES = [10, 20, 50] as const

export type PageSize = (typeof PAGE_SIZES)[number]

const PAGE_SIZE_STORAGE_KEY = 'pokedex.pageSize'

const DEFAULT_PAGE_SIZE: PageSize = 20

export function isPageSize(value: unknown): value is PageSize {
  return typeof value === 'number' && (PAGE_SIZES as readonly number[]).includes(value)
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

export interface UiState {
  pageSize: PageSize
}

const initialState: UiState = {
  pageSize: readInitialPageSize(),
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
  },
})

export const { setPageSize } = uiSlice.actions
export const uiReducer = uiSlice.reducer
