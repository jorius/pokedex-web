// External
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

// Styles
import './index.css'

// i18n
import './i18n/I18n'

// Store
import { store } from './store/Store'

// Themes
import { ThemeProvider } from './themes/ThemeProvider'

// Components
import { ToastProvider } from './components/ui/Toast'

// App
import App from './App.tsx'

// ToastProvider sits inside ThemeProvider (toasts are token-driven, so they must render under the
// active theme) and outside the router, so a toast raised on one page survives navigation.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
