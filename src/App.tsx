// External
import type { JSX } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

// Auth
import { RequireAuth } from './components/auth/RequireAuth'

// Components
import { Header } from './components/layout/Header'

// Pages
import { BrowsePage } from './pages/BrowsePage'
import { CollectionPage } from './pages/CollectionPage'
import { DetailPage } from './pages/DetailPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'

function App(): JSX.Element {
  return (
    <BrowserRouter>
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
