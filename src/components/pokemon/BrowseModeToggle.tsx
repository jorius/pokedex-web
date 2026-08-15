// External
import { ChevronsDown, LayoutGrid } from 'lucide-react'
import type { ComponentType, JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Store
import { BROWSE_MODES } from '../../store/UiSlice'
import type { BrowseMode } from '../../store/UiSlice'

// Components
import { Button } from '../ui/Button'

interface BrowseModeToggleProps {
  mode: BrowseMode
  onModeChange: (mode: BrowseMode) => void
}

const MODE_LABEL_KEYS = {
  pagination: 'browseMode.pagination',
  infinite: 'browseMode.infinite',
} as const

const MODE_ICONS: Record<BrowseMode, ComponentType<{ 'aria-hidden'?: boolean }>> = {
  pagination: LayoutGrid,
  infinite: ChevronsDown,
}

/** Segmented control over the two browse modes. Real buttons, so Tab reaches it and
 * `aria-pressed` tells assistive tech which of the two is active. */
export function BrowseModeToggle({ mode, onModeChange }: BrowseModeToggleProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div role="group" aria-label={t('browseMode.label')} className="inline-flex items-center gap-0.5 rounded-md border border-input bg-card p-0.5 shadow-sm">
      {BROWSE_MODES.map((option) => {
        const Icon = MODE_ICONS[option]
        const isActive = option === mode

        return (
          <Button
            key={option}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={isActive}
            onClick={(): void => onModeChange(option)}
            className="gap-1.5"
          >
            <Icon aria-hidden />
            {t(MODE_LABEL_KEYS[option])}
          </Button>
        )
      })}
    </div>
  )
}
