// External
import { HeartHandshake, Pencil, Trash2 } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

// Lib
import { cn } from '../../lib/Cn'
import { formatPokedexNumber, humanizeSlug } from '../../lib/Format'
import { resolveSpriteUrl } from '../../lib/Sprite'

// Store
import { useAppSelector } from '../../store/Hooks'
import type { LocalPokemon } from '../../store/Types'

// Components
import { ShinyOverlay } from '../pokemon/ShinyOverlay'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface CollectionEntryCardProps {
  record: LocalPokemon
  onEdit: () => void
  onRelease: () => void
  onDelete: () => void
}

/** Locale-aware capture date — mirrors CapturedBadge's formatter. A malformed timestamp falls
 * back to the raw value rather than rendering "Invalid Date". */
function formatCapturedDate(isoTimestamp: string, locale: string): string {
  const parsed = new Date(isoTimestamp)
  if (Number.isNaN(parsed.getTime())) return isoTimestamp
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(parsed)
}

/** One collection record: sprite well (mirrors PokemonCard's specimen-well look, sized down),
 * species name with an optional nickname beneath it, region/tag badges when set, a truncated
 * note, and capture date. The sprite/info area is a whole-area link to the detail page; edit and
 * delete stay siblings of that link — never nested inside it — so the buttons stay valid HTML,
 * keep their own keyboard stop, and never trigger navigation. */
export function CollectionEntryCard({ record, onEdit, onRelease, onDelete }: CollectionEntryCardProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const shinyMode = useAppSelector((state) => state.ui.shinyMode)
  // Entries synced before the backend stored shiny art have a null here, so this is the surface
  // where the fallback shows up most: the helper hands back the normal sprite and the 'fallback'
  // state, and the overlay explains it rather than the card silently looking un-shiny.
  const sprite = resolveSpriteUrl(record, shinyMode)
  const displayName = humanizeSlug(record.name)
  // The delete and release buttons' accessible names must match what their confirm dialogs will
  // say — nickname when one exists, species name otherwise.
  const entryName = record.localizedName ?? displayName

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link
        to={`/pokemon/${record.pokeApiId}`}
        className={cn(
          // Sprite BESIDE the text at every width, not stacked on a phone. Stacked, an 80px sprite
          // sat alone on its own row with 250px of empty card beside it and pushed each entry to
          // ~270px tall; side by side an entry is ~150px, so a seven-entry collection is one
          // screen-and-a-bit instead of two. `items-start` on the narrow layout keeps the sprite
          // aligned with the name rather than floating against a tall description.
          'flex min-w-0 flex-1 flex-row items-start gap-3 rounded-md outline-none transition-colors duration-200 sm:items-center sm:gap-4',
          'hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <div className="relative flex size-20 shrink-0 items-center justify-center rounded-md bg-muted p-2 sm:size-24">
          <span aria-hidden className="absolute left-1 top-1 font-display text-[10px] text-muted-foreground">
            {formatPokedexNumber(record.pokeApiId)}
          </span>
          {sprite.url !== null ? (
            <img src={sprite.url} alt={record.name} loading="lazy" className="size-full object-contain [image-rendering:pixelated]" />
          ) : (
            <span aria-hidden className="font-display text-3xl text-muted-foreground/50">?</span>
          )}
          <ShinyOverlay state={sprite.shiny} size="sm" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-bold capitalize leading-tight">{displayName}</h2>
            <Badge variant="outline" className="font-display text-xs">{formatPokedexNumber(record.pokeApiId)}</Badge>
          </div>
          {record.localizedName && <p className="text-sm text-muted-foreground">{record.localizedName}</p>}
          {(record.region || record.classificationTag) && (
            <div className="flex flex-wrap gap-1.5">
              {record.region && <Badge variant="secondary">{record.region}</Badge>}
              {record.classificationTag && <Badge variant="secondary">{record.classificationTag}</Badge>}
            </div>
          )}
          {record.description && <p className="line-clamp-2 max-w-prose text-sm text-muted-foreground">{record.description}</p>}
          <p className="text-xs text-muted-foreground">
            {t('detail.capturedOn', { date: formatCapturedDate(record.capturedAt, i18n.language) })}
          </p>
        </div>
      </Link>

      {/* Three actions now, so the row is allowed to wrap: at 412px Edit/Release/Delete sit on one
          line with room to spare, but a longer translation of any of the three must fold onto a
          second line rather than push the card wider than the phone. */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
        <Button variant="outline" size="sm" aria-label={t('collection.editAria', { name: displayName })} onClick={onEdit}>
          <Pencil aria-hidden />
          {t('common.edit')}
        </Button>
        {/* Release sits BETWEEN Edit and Delete and is styled like neither: a plain ghost, because
            it is neither the safe edit nor the destructive discard. Its own icon and its own word
            are what keep it from being mistaken for the button next to it. */}
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('collection.releaseAria', { name: entryName })}
          onClick={onRelease}
        >
          <HeartHandshake aria-hidden />
          {t('collection.release')}
        </Button>
        <Button
          variant="destructiveGhost"
          size="sm"
          aria-label={t('collection.deleteAria', { name: entryName })}
          onClick={onDelete}
        >
          <Trash2 aria-hidden />
          {t('common.delete')}
        </Button>
      </div>
    </Card>
  )
}
