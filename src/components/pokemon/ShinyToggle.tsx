// External
import { Sparkles } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

// Components
import { Button } from '../ui/Button'

// Styles — shares the shiny keyframes with ShinyOverlay: the switch twinkles with the sprites it
// turns on, and Vite emits the stylesheet once however many components import it.
import './ShinyOverlay.css'

interface ShinyToggleProps {
  shinyMode: boolean
  onShinyModeChange: (shinyMode: boolean) => void
}

/**
 * The shiny switch. A real button carrying `aria-pressed`, so Tab reaches it, Space/Enter flip it
 * and assistive tech reads it as a two-state control rather than "Shiny, button".
 *
 * Same chrome as BrowseModeToggle beside it (bordered plate, one inset pill) so the toolbar reads
 * as one family of controls, but the ON state is --accent, not --primary: this is a decorative
 * view preference, not another browse mode, and the accent is the same ink the sparkle on every
 * sprite well uses — flip it and the toolbar and the grid light up in one colour. It is one word
 * plus an icon on purpose; the toolbar has to survive a 412px phone with the search field, the
 * browse-mode segments and the page size already in it.
 */
export function ShinyToggle({ shinyMode, onShinyModeChange }: ShinyToggleProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="inline-flex items-center rounded-md border border-input bg-card p-0.5 shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={shinyMode}
        aria-label={t('shiny.description')}
        title={t('shiny.description')}
        onClick={(): void => { onShinyModeChange(!shinyMode) }}
        className={cn('gap-1.5', shinyMode && 'bg-accent text-accent-foreground shadow-sm hover:bg-accent/85')}
      >
        <Sparkles aria-hidden className={shinyMode ? 'shiny-glint' : undefined} />
        {t('shiny.label')}
      </Button>
    </div>
  )
}
