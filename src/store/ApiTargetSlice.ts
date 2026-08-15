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
 * Fixed port per backend across the pokedex ecosystem. Ports are the stable part of a
 * target's identity — the host is not, so it is derived at runtime (see `apiHost`).
 */
const API_TARGET_PORTS: Readonly<Record<ApiTarget, number>> = {
  dotnet: 5257,
  expressJs: 3000,
  expressTs: 3001,
}

const FALLBACK_HOST = 'localhost'

/**
 * Host the backends are reached on: whatever host the app itself was loaded from. Opening
 * the app at http://localhost:5173 targets localhost backends; opening it at
 * http://192.168.0.254:5173 from a phone on the LAN targets 192.168.0.254 backends — the
 * same bundle, no rebuild. Falls back to localhost when there is no DOM (SSR, tests).
 */
function apiHost(): string {
  const hostname = typeof window === 'undefined' ? '' : window.location.hostname
  return hostname === '' ? FALLBACK_HOST : hostname
}

/**
 * Known service endpoints across the pokedex ecosystem. Display labels are NOT stored here —
 * each `target` value maps 1:1 to an i18n key (`backend.dotnet`, `backend.expressJs`,
 * `backend.expressTs`), resolved in components via useTranslation.
 *
 * Base URLs are host-derived and computed once at module load: the page's host cannot change
 * without a reload, which re-evaluates this module.
 */
export const API_TARGETS: readonly ApiTargetMeta[] = API_TARGET_VALUES.map((target) => ({
  target,
  baseUrl: `http://${apiHost()}:${API_TARGET_PORTS[target]}`,
}))

const DEFAULT_TARGET: ApiTarget = 'dotnet'

export function isApiTarget(value: unknown): value is ApiTarget {
  return typeof value === 'string' && (API_TARGET_VALUES as readonly string[]).includes(value)
}

function baseUrlFor(target: ApiTarget): string {
  return API_TARGETS.find((meta) => meta.target === target)?.baseUrl ?? API_TARGETS[0].baseUrl
}

/**
 * Resolves a base URL to its target by PORT only — the host is deliberately ignored. A value
 * pinned to `http://localhost:3001` (in `.env`, or persisted by an older build) therefore
 * still selects the expressTs target when the app is loaded over the LAN, and the actual
 * host used for requests always comes from `apiHost()`.
 */
function targetForBaseUrl(baseUrl: string): ApiTarget | null {
  let port: string
  try {
    port = new URL(baseUrl.trim()).port
  } catch {
    return null
  }

  if (port === '') return null
  return API_TARGET_VALUES.find((target) => String(API_TARGET_PORTS[target]) === port) ?? null
}

/**
 * Reads the persisted switcher choice, migrating the legacy shape on the way.
 *
 * The stored value is a TARGET KEY (`dotnet` | `expressJs` | `expressTs`), never an absolute
 * URL — a URL would pin a host and defeat host derivation. Older builds may have stored a
 * URL: map it back to a target by port and rewrite the key. Anything unrecognizable is stale
 * and gets dropped so the caller falls through to the env/default path.
 */
function readStoredTarget(): ApiTarget | null {
  let stored: string | null
  try {
    stored = localStorage.getItem(API_TARGET_STORAGE_KEY)
  } catch {
    // Storage unavailable — nothing persisted to honour
    return null
  }

  if (stored === null) return null
  if (isApiTarget(stored)) return stored

  const migrated = targetForBaseUrl(stored)
  try {
    if (migrated === null) localStorage.removeItem(API_TARGET_STORAGE_KEY)
    else localStorage.setItem(API_TARGET_STORAGE_KEY, migrated)
  } catch {
    // Storage turned unavailable mid-flight — the migrated value still applies this session
  }

  return migrated
}

/**
 * Precedence: persisted switcher choice > `VITE_API_BASE_URL` (matched by port) > `dotnet`.
 * None of these decide the HOST — that is always the host the app was loaded from.
 */
function readInitialTarget(): ApiTarget {
  const stored = readStoredTarget()
  if (stored !== null) return stored

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
