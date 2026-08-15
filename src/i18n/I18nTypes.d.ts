// Locales
import type en from './locales/en.json'

// Module augmentation: types t() keys/interpolation args against the English resource
// so a typo'd or missing key is a compile error, not a runtime fallback string.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
