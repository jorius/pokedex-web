// External
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

// Locales
import en from './locales/en.json'
import es from './locales/es.json'

export const LANGUAGE_STORAGE_KEY = 'pokedex.language'

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

// i18next persists the resolved language itself (localStorage key above) — Task 4's
// uiSlice must NOT duplicate this in Redux to avoid a second source of truth.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
