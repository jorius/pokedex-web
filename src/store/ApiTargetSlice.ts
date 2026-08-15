// External
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

// Store
import { API_TARGET_VALUES } from './Types'
import type { ApiTarget } from './Types'

const API_TARGET_STORAGE_KEY = 'pokedex.apiTarget'

interface ApiTargetMeta {
  target: ApiTarget
  baseUrl: string
}

/**
 * Known service endpoints across the pokedex ecosystem. Display labels are NOT stored here —
 * each `target` value maps 1:1 to an i18n key (`backend.dotnet`, `backend.expressJs`,
 * `backend.expressTs`), resolved in components via useTranslation.
 */
export const API_TARGETS: readonly ApiTargetMeta[] = [
  { target: 'dotnet', baseUrl: 'http://localhost:5257' },
  { target: 'expressJs', baseUrl: 'http://localhost:3000' },
  { target: 'expressTs', baseUrl: 'http://localhost:3001' },
]

const DEFAULT_TARGET: ApiTarget = 'dotnet'

function isApiTarget(value: unknown): value is ApiTarget {
  return typeof value === 'string' && (API_TARGET_VALUES as readonly string[]).includes(value)
}

function baseUrlFor(target: ApiTarget): string {
  return API_TARGETS.find((meta) => meta.target === target)?.baseUrl ?? API_TARGETS[0].baseUrl
}

function targetForBaseUrl(baseUrl: string): ApiTarget | null {
  const normalized = baseUrl.replace(/\/+$/, '')
  return API_TARGETS.find((meta) => meta.baseUrl === normalized)?.target ?? null
}

function readInitialTarget(): ApiTarget {
  try {
    const stored = localStorage.getItem(API_TARGET_STORAGE_KEY)
    if (isApiTarget(stored)) return stored
  } catch {
    // Storage unavailable — fall through to the env-derived default
  }

  const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL
  if (typeof envBaseUrl === 'string') {
    const matched = targetForBaseUrl(envBaseUrl)
    if (matched) return matched
  }

  return DEFAULT_TARGET
}

export interface ApiTargetState {
  target: ApiTarget
  baseUrl: string
}

const initialTarget = readInitialTarget()

const initialState: ApiTargetState = {
  target: initialTarget,
  baseUrl: baseUrlFor(initialTarget),
}

const apiTargetSlice = createSlice({
  name: 'apiTarget',
  initialState,
  reducers: {
    setApiTarget(state, action: PayloadAction<ApiTarget>): void {
      state.target = action.payload
      state.baseUrl = baseUrlFor(action.payload)
      try {
        localStorage.setItem(API_TARGET_STORAGE_KEY, action.payload)
      } catch {
        // Storage unavailable — target still applies for this session
      }
    },
  },
})

export const { setApiTarget } = apiTargetSlice.actions
export const apiTargetReducer = apiTargetSlice.reducer
