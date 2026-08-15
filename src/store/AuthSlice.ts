// External
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

// Store
import { clearAccessToken, getRestorableSession, setAccessToken } from './AccessTokenStorage'
import { clearRefreshToken, setRefreshToken } from './RefreshTokenStorage'
import type { AuthSession, AuthUser } from './Types'

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
}

/**
 * Boot straight into the persisted session when the stored access token is still valid, so a
 * reload costs no /api/auth/refresh at all. See AccessTokenStorage for why that matters against
 * rotating refresh tokens. Falls back to a null session, which is SessionBootstrap's cue to try
 * the silent refresh instead.
 */
const restored = getRestorableSession()

const initialState: AuthState = {
  user: restored?.user ?? null,
  accessToken: restored?.accessToken ?? null,
}

/**
 * Pure session state container. Deliberately does NOT import from Api.ts.
 *
 * The RTK Query api layer (Api.ts) dispatches `sessionEstablished`/`sessionCleared` itself
 * (via onQueryStarted on login/register/refreshSession/logoutSession, and from the reauth
 * flow) rather than this slice reaching into the api's endpoints via addMatcher. That keeps
 * the dependency strictly one-directional (Api.ts -> AuthSlice.ts) and avoids a circular
 * import between the two modules — Api.ts needs AuthState synchronously to type its base
 * query, and a reverse import here (to build `api.endpoints.login.matchFulfilled` matchers)
 * would risk a TDZ failure depending on which module a caller happens to import first.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEstablished(state, action: PayloadAction<AuthSession>): void {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      setAccessToken(action.payload.accessToken)
      setRefreshToken(action.payload.refreshToken)
    },
    sessionCleared(state): void {
      state.user = null
      state.accessToken = null
      clearAccessToken()
      clearRefreshToken()
    },
  },
})

export const { sessionEstablished, sessionCleared } = authSlice.actions
export const authReducer = authSlice.reducer
