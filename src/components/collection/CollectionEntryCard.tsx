// External
import { Pencil, Trash2 } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

// Lib
import { cn } from '../../lib/Cn'
import { formatPokedexNumber, humanizeSlug } from '../../lib/Format'

// Store
import type { LocalPokemon } from '../../store/Types'

// Components
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface CollectionEntryCardProps {
  record: LocalPokemon
  onEdit: () => void
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
export function CollectionEntryCard({ record, onEdit, onDelete }: CollectionEntryCardProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const displayName = humanizeSlug(record.name)
  // The delete button's accessible name must match what DeleteConfirmDialog's body will
  // say — nickname when one exists, species name otherwise.
  const deleteName = record.localizedName ?? displayName

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link
        to={`/pokemon/${record.pokeApiId}`}
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-4 rounded-md outline-none transition-colors duration-200 sm:flex-row sm:items-center',
          'hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <div className="relative flex size-20 shrink-0 items-center justify-center rounded-md bg-muted p-2 sm:size-24">
          <span aria-hidden className="absolute left-1 top-1 font-display text-[10px] text-muted-foreground">
            {formatPokedexNumber(record.pokeApiId)}
          </span>
          {record.spriteUrl !== null ? (
            <img src={record.spriteUrl} alt={record.name} loading="lazy" className="size-full object-contain [image-rendering:pixelated]" />
          ) : (
            <span aria-hidden className="font-display text-3xl text-muted-foreground/50">?</span>
          )}
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

      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
        <Button variant="outline" size="sm" aria-label={t('collection.editAria', { name: displayName })} onClick={onEdit}>
          <Pencil aria-hidden />
          {t('common.edit')}
        </Button>
        <Button
          variant="destructiveGhost"
          size="sm"
          aria-label={t('collection.deleteAria', { name: deleteName })}
          onClick={onDelete}
        >
          <Trash2 aria-hidden />
          {t('common.delete')}
        </Button>
      </div>
    </Card>
  )
}
