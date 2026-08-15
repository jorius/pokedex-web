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

// App
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
