// External
import { Check } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Styles — shares the capture stylesheet for its arrival animation.
import './CaptureAnimation.css'

/** Locale-aware capture date. A malformed timestamp falls back to the raw value rather than
 * rendering "Invalid Date". */
function formatCapturedDate(isoTimestamp: string, locale: string): string {
  const parsed = new Date(isoTimestamp)
  if (Number.isNaN(parsed.getTime())) return isoTimestamp
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(parsed)
}

interface CapturedBadgeProps {
  /** ISO timestamp from the caller's collection entry. */
  capturedAt: string
}

/** "Captured" plate that sits under the name plate once the pokemon is in the caller's
 * collection. Solid-ish surface because it overlays the artwork. */
export function CapturedBadge({ capturedAt }: CapturedBadgeProps): JSX.Element {
  const { t, i18n } = useTranslation()

  return (
    <div className="capture-badge-in w-fit rounded-md border border-success/50 bg-card/90 px-2.5 py-1 shadow-sm backdrop-blur-sm motion-reduce:animate-none">
      <p className="m-0 flex items-center gap-1.5 text-xs font-bold text-success">
        <Check aria-hidden className="size-3.5" />
        {t('detail.captured')}
      </p>
      <p className="m-0 text-[11px] leading-tight text-muted-foreground">{t('detail.capturedOn', { date: formatCapturedDate(capturedAt, i18n.language) })}</p>
    </div>
  )
}
