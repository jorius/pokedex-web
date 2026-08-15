// External
import { Languages } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// i18n
import { SUPPORTED_LANGUAGES } from '../../i18n/I18n'
import type { SupportedLanguage } from '../../i18n/I18n'

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

export function LanguageSwitcher(): JSX.Element {
  const { t, i18n } = useTranslation()
  const current = isSupportedLanguage(i18n.language) ? i18n.language : 'en'

  return (
    <Select
      value={current}
      onValueChange={(value): void => {
        if (isSupportedLanguage(value)) void i18n.changeLanguage(value)
      }}
    >
      <SelectTrigger aria-label={t('language.label')} title={t(`language.${current}`)} className="w-32">
        <span className="flex min-w-0 items-center gap-2">
          <Languages aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LANGUAGES.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`language.${value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
