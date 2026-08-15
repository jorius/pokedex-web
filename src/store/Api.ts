// External
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'

// Store
import { sessionCleared, sessionEstablished } from './AuthSlice'
import { getRefreshToken } from './RefreshTokenStorage'
import type { RootState } from './Store'
import type {
  ApiEnvelope,
  AuthCredentials,
  AuthSession,
  LocalPokemon,
  PagedMeta,
  PokemonDetail,
  PokemonListItem,
  UpdatePokemonPayload,
} from './Types'

export interface ApiErrorShape {
  status: number | string
  error: string | null
  msg: string | null
}

export interface PagedRequest {
  page: number
  pageSize: number
}

export interface PagedResult<T> {
  items: T[]
  meta: PagedMeta
}

export interface UpdateLocalRequest {
  id: string
  payload: UpdatePokemonPayload
}

function toApiError(error: FetchBaseQueryError): ApiErrorShape {
  const data = error.data as Partial<ApiEnvelope<unknown>> | undefined
  return {
    status: error.status,
    error: data?.error ?? null,
    msg: data?.msg ?? null,
  }
}

/** DELETE returns a bodyless 204 — `response.json()` would throw on an empty body, so read text first. */
async function emptyBodyResponseHandler(response: Response): Promise<unknown> {
  const text = await response.text()
  return text ? (JSON.parse(text) as unknown) : null
}

function isAuthEndpoint(args: string | FetchArgs): boolean {
  const url = typeof args === 'string' ? args : args.url
  return url.startsWith('/api/auth/')
}

/**
 * Base URL is read from the apiTarget slice on every call, so switching backends at runtime
 * (header switcher) takes effect on the very next request without recreating the store.
 * This is the standard RTK Query "dynamic base query" recipe.
 */
const dynamicBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (args, queryApi, extraOptions) => {
  const state = queryApi.getState() as RootState
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: state.apiTarget.baseUrl,
    prepareHeaders: (headers) => {
      const accessToken = (queryApi.getState() as RootState).auth.accessToken
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
      return headers
    },
  })
  return rawBaseQuery(args, queryApi, extraOptions)
}

// Module-level in-flight promise: concurrent 401s from parallel requests share ONE refresh
// attempt instead of each firing its own POST /api/auth/refresh. Reset to null once the
// attempt settles so the NEXT expiry (later) triggers a fresh refresh.
let refreshPromise: Promise<AuthSession | null> | null = null

async function performRefresh(state: RootState): Promise<AuthSession | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  // Deliberately a bare fetchBaseQuery straight to the current baseUrl — bypasses
  // dynamicBaseQuery/baseQueryWithReauth entirely so a failed refresh can never recurse
  // into another refresh attempt.
  const rawRefreshQuery = fetchBaseQuery({ baseUrl: state.apiTarget.baseUrl })
  // No prepareHeaders is configured on this instance, so the (fake) BaseQueryApi below is
  // never actually read — fetchBaseQuery only forwards it to prepareHeaders, which defaults
  // to the identity function. Only `signal` is read directly, and undefined is a valid signal.
  const fakeQueryApi = {} as Parameters<typeof rawRefreshQuery>[1]
  const result = await rawRefreshQuery({ url: '/api/auth/refresh', method: 'POST', body: { refreshToken } }, fakeQueryApi, {})

  if (result.error || !result.data) return null

  const envelope = result.data as ApiEnvelope<AuthSession>
  return envelope.data
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, queryApi, extraOptions) => {
  let result = await dynamicBaseQuery(args, queryApi, extraOptions)

  if (result.error?.status === 401 && !isAuthEndpoint(args)) {
    const state = queryApi.getState() as RootState

    refreshPromise ??= performRefresh(state).finally(() => {
      refreshPromise = null
    })
    const session = await refreshPromise

    if (session) {
      queryApi.dispatch(sessionEstablished(session))
      result = await dynamicBaseQuery(args, queryApi, extraOptions)
    } else {
      queryApi.dispatch(sessionCleared())
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Local'],
  endpoints: (builder) => ({
    browsePokemons: builder.query<PagedResult<PokemonListItem>, PagedRequest>({
      query: ({ page, pageSize }) => `/api/pokemons?page=${page}&pageSize=${pageSize}`,
      transformResponse: (response: ApiEnvelope<PokemonListItem[]>): PagedResult<PokemonListItem> => ({
        items: response.data ?? [],
        meta: response.meta as PagedMeta,
      }),
      transformErrorResponse: toApiError,
    }),

    getPokemonById: builder.query<PokemonDetail, number>({
      query: (id) => `/api/pokemons/${id}`,
      transformResponse: (response: ApiEnvelope<PokemonDetail>): PokemonDetail => response.data as PokemonDetail,
      transformErrorResponse: toApiError,
    }),

    getPokemonByName: builder.query<PokemonDetail, string>({
      query: (name) => `/api/pokemons/name/${encodeURIComponent(name)}`,
      transformResponse: (response: ApiEnvelope<PokemonDetail>): PokemonDetail => response.data as PokemonDetail,
      transformErrorResponse: toApiError,
    }),

    getLocal: builder.query<PagedResult<LocalPokemon>, PagedRequest>({
      query: ({ page, pageSize }) => `/api/pokemons/local?page=${page}&pageSize=${pageSize}`,
      transformResponse: (response: ApiEnvelope<LocalPokemon[]>): PagedResult<LocalPokemon> => ({
        items: response.data ?? [],
        meta: response.meta as PagedMeta,
      }),
      transformErrorResponse: toApiError,
      providesTags: ['Local'],
    }),

    /**
     * Captured check for one pokemon. 404 is the normal "not in your collection" answer, not a
     * failure — callers read `error.status === 404` as a state, never as something to report.
     * Tagged `Local`, so a successful sync flips it to captured without a manual refetch.
     */
    getLocalByPokeApiId: builder.query<LocalPokemon, number>({
      query: (pokeApiId) => `/api/pokemons/local/by-poke-api-id/${String(pokeApiId)}`,
      transformResponse: (response: ApiEnvelope<LocalPokemon>): LocalPokemon => response.data as LocalPokemon,
      transformErrorResponse: toApiError,
      providesTags: ['Local'],
    }),

    syncById: builder.mutation<LocalPokemon, number>({
      query: (id) => ({ url: `/api/pokemons/${id}/sync`, method: 'POST' }),
      transformResponse: (response: ApiEnvelope<LocalPokemon>): LocalPokemon => response.data as LocalPokemon,
      transformErrorResponse: toApiError,
      invalidatesTags: ['Local'],
    }),

    updateLocal: builder.mutation<LocalPokemon, UpdateLocalRequest>({
      query: ({ id, payload }) => ({ url: `/api/pokemons/local/${id}`, method: 'PUT', body: payload }),
      transformResponse: (response: ApiEnvelope<LocalPokemon>): LocalPokemon => response.data as LocalPokemon,
      transformErrorResponse: toApiError,
      invalidatesTags: ['Local'],
    }),

    deleteLocal: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/pokemons/local/${id}`, method: 'DELETE', responseHandler: emptyBodyResponseHandler }),
      transformResponse: (): void => undefined,
      transformErrorResponse: toApiError,
      invalidatesTags: ['Local'],
    }),

    register: builder.mutation<AuthSession, AuthCredentials>({
      query: (credentials) => ({ url: '/api/auth/register', method: 'POST', body: credentials }),
      transformResponse: (response: ApiEnvelope<AuthSession>): AuthSession => response.data as AuthSession,
      transformErrorResponse: toApiError,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }): Promise<void> => {
        // queryFulfilled MUST be caught here — an uncaught rejection in onQueryStarted
        // surfaces as an unhandled promise rejection even when the caller unwraps+catches.
        try {
          const { data } = await queryFulfilled
          dispatch(sessionEstablished(data))
        } catch {
          // Failure is surfaced via the mutation result — nothing to establish.
        }
      },
    }),

    login: builder.mutation<AuthSession, AuthCredentials>({
      query: (credentials) => ({ url: '/api/auth/login', method: 'POST', body: credentials }),
      transformResponse: (response: ApiEnvelope<AuthSession>): AuthSession => response.data as AuthSession,
      transformErrorResponse: toApiError,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }): Promise<void> => {
        try {
          const { data } = await queryFulfilled
          dispatch(sessionEstablished(data))
        } catch {
          // Failure is surfaced via the mutation result — nothing to establish.
        }
      },
    }),

    refreshSession: builder.mutation<AuthSession, void>({
      query: () => ({ url: '/api/auth/refresh', method: 'POST', body: { refreshToken: getRefreshToken() } }),
      transformResponse: (response: ApiEnvelope<AuthSession>): AuthSession => response.data as AuthSession,
      transformErrorResponse: toApiError,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }): Promise<void> => {
        try {
          const { data } = await queryFulfilled
          dispatch(sessionEstablished(data))
        } catch (rejection) {
          // A definitive rejection (400/401) means the stored refresh token is dead — purge it
          // so later boots don't repeat a doomed refresh round-trip. Transient failures
          // (network, 5xx) keep the token so a healthy backend can still restore the session.
          const status = (rejection as { error?: { status?: number | string } }).error?.status
          if (status === 400 || status === 401) {
            dispatch(sessionCleared())
          }
        }
      },
    }),

    // Fire-and-forget: the local session is cleared as soon as the request settles, whether
    // the server confirmed the logout or the call itself 401'd. Callers can ignore the promise.
    logoutSession: builder.mutation<void, string>({
      query: (refreshToken) => ({ url: '/api/auth/logout', method: 'POST', body: { refreshToken } }),
      transformResponse: (): void => undefined,
      transformErrorResponse: toApiError,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }): Promise<void> => {
        try {
          await queryFulfilled
        } catch {
          // Server rejection changes nothing — the local session is cleared regardless.
        } finally {
          dispatch(sessionCleared())
        }
      },
    }),
  }),
})

export const {
  useBrowsePokemonsQuery,
  useGetPokemonByIdQuery,
  useGetPokemonByNameQuery,
  useGetLocalQuery,
  useGetLocalByPokeApiIdQuery,
  useSyncByIdMutation,
  useUpdateLocalMutation,
  useDeleteLocalMutation,
  useRegisterMutation,
  useLoginMutation,
  useRefreshSessionMutation,
  useLogoutSessionMutation,
} = api
