// External
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Route, Routes } from 'react-router'

// Auth
import { RequireAuth } from './components/auth/RequireAuth'

// Components
import { Header } from './components/layout/Header'

// Store
import { useRefreshSessionMutation } from './store/Api'
import { useAppSelector } from './store/Hooks'
import { getRefreshToken } from './store/RefreshTokenStorage'

// Pages
import { BrowsePage } from './pages/BrowsePage'
import { CollectionPage } from './pages/CollectionPage'
import { DetailPage } from './pages/DetailPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { ShopPage } from './pages/ShopPage'
import { SlotsPage } from './pages/SlotsPage'

/**
 * Session restore on app boot, cheapest path first:
 *
 *   1. A still-valid stored access token means the auth slice has ALREADY hydrated the session
 *      from it (see AccessTokenStorage) — render immediately, and crucially do NOT refresh.
 *      Refresh tokens rotate, so refreshing on every boot made rapid reloads race the rotation
 *      and get the whole token family revoked as suspected reuse.
 *   2. No usable access token but a stored refresh token → fire ONE /api/auth/refresh and hold
 *      the routes behind a minimal full-page loader until it settles: success establishes the
 *      session via the mutation's onQueryStarted, failure simply renders anonymous.
 *   3. Neither → render immediately, anonymous, zero flash.
 *
 * Mid-session expiry is unaffected: a 401 still triggers the single-flight refresh-and-retry in
 * Api.ts, which is exactly when spending a refresh token is the right move.
 */
function SessionBootstrap({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation()
  const [refreshSession] = useRefreshSessionMutation()
  // Ref (not state) so StrictMode's simulated remount cannot fire the refresh twice.
  const attemptedRef = useRef(false)
  // Read once, at mount: whether the slice restored a session from the persisted access token.
  const hasRestoredSession = useAppSelector((state) => state.auth.accessToken !== null)
  const [isRestoring, setIsRestoring] = useState<boolean>(() => !hasRestoredSession && getRefreshToken() !== null)

  useEffect(() => {
    if (!isRestoring || attemptedRef.current) return
    attemptedRef.current = true
    void refreshSession()
      .unwrap()
      .catch(() => undefined)
      .finally(() => { setIsRestoring(false) })
  }, [isRestoring, refreshSession])

  if (isRestoring) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background text-foreground">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    )
  }

  return <>{children}</>
}

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <SessionBootstrap>
        <div className="min-h-svh bg-background text-foreground">
          <Header />
          <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
            <Routes>
              <Route path="/" element={<BrowsePage />} />
              <Route path="/pokemon/:idOrName" element={<DetailPage />} />
              <Route
                path="/collection"
                element={
                  <RequireAuth>
                    <CollectionPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/shop"
                element={
                  <RequireAuth>
                    <ShopPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/slots"
                element={
                  <RequireAuth>
                    <SlotsPage />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </SessionBootstrap>
    </BrowserRouter>
  )
}

export default App
