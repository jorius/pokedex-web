// External
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { resolveApiErrorMessage } from '../../lib/ApiErrorMessage'
import { humanizeSlug } from '../../lib/Format'

// Store
import { useUpdateLocalMutation } from '../../store/Api'
import type { ApiErrorShape } from '../../store/Api'
import type { LocalPokemon, UpdatePokemonPayload } from '../../store/Types'

// Components
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Textarea } from '../ui/Textarea'

const FIELD_MAX_LENGTH = 500

type WhitelistedField = keyof UpdatePokemonPayload

interface EditLocalDialogProps {
  record: LocalPokemon
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

interface FieldState {
  localizedName: string
  region: string
  classificationTag: string
  description: string
}

function toFieldState(record: LocalPokemon): FieldState {
  return {
    localizedName: record.localizedName ?? '',
    region: record.region ?? '',
    classificationTag: record.classificationTag ?? '',
    description: record.description ?? '',
  }
}

/** Sends ONLY fields whose value differs from the record — an untouched field is omitted
 * entirely, while a field the user clears is sent as '' so the backend applies the clear
 * explicitly. Matches the whitelisted-update contract (payload must carry >=1 field). */
function buildDiff(original: FieldState, next: FieldState): UpdatePokemonPayload {
  const diff: UpdatePokemonPayload = {}
  ;(Object.keys(original) as WhitelistedField[]).forEach((key) => {
    if (next[key] !== original[key]) diff[key] = next[key]
  })
  return diff
}

export function EditLocalDialog({ record, open, onOpenChange, onUpdated }: EditLocalDialogProps): JSX.Element {
  const { t } = useTranslation()
  const [updateLocal, { isLoading, error }] = useUpdateLocalMutation()
  const original = toFieldState(record)
  const [fields, setFields] = useState<FieldState>(original)

  const diff = buildDiff(original, fields)
  const hasChanges = Object.keys(diff).length > 0

  function handleFieldChange(key: WhitelistedField, value: string): void {
    setFields((previous) => ({ ...previous, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!hasChanges) return
    try {
      await updateLocal({ id: record.id, payload: diff }).unwrap()
      onUpdated()
    } catch {
      // Error state is surfaced via the mutation's `error` below.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('collection.editTitle')}</DialogTitle>
          <DialogDescription className="capitalize">{humanizeSlug(record.name)}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={(event): void => { void handleSubmit(event) }}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-localized-name">{t('collection.localizedName')}</Label>
            <Input
              id="edit-localized-name"
              value={fields.localizedName}
              maxLength={FIELD_MAX_LENGTH}
              onChange={(event): void => handleFieldChange('localizedName', event.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {t('collection.fieldMax', { count: fields.localizedName.length, max: FIELD_MAX_LENGTH })}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-region">{t('collection.region')}</Label>
            <Input
              id="edit-region"
              value={fields.region}
              maxLength={FIELD_MAX_LENGTH}
              onChange={(event): void => handleFieldChange('region', event.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {t('collection.fieldMax', { count: fields.region.length, max: FIELD_MAX_LENGTH })}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-classification-tag">{t('collection.classificationTag')}</Label>
            <Input
              id="edit-classification-tag"
              value={fields.classificationTag}
              maxLength={FIELD_MAX_LENGTH}
              onChange={(event): void => handleFieldChange('classificationTag', event.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {t('collection.fieldMax', { count: fields.classificationTag.length, max: FIELD_MAX_LENGTH })}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description">{t('collection.description')}</Label>
            <Textarea
              id="edit-description"
              rows={4}
              value={fields.description}
              maxLength={FIELD_MAX_LENGTH}
              onChange={(event): void => handleFieldChange('description', event.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {t('collection.fieldMax', { count: fields.description.length, max: FIELD_MAX_LENGTH })}
            </p>
          </div>

          {error !== undefined && (
            <p role="alert" className="text-sm text-destructive">
              {resolveApiErrorMessage(error as ApiErrorShape, t)}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={(): void => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!hasChanges || isLoading}>
              {isLoading && <Loader2 className="animate-spin" aria-hidden />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
