// External
import { Loader2 } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { resolveApiErrorMessage } from '../../lib/ApiErrorMessage'
import { humanizeSlug } from '../../lib/Format'

// Store
import { useDeleteLocalMutation } from '../../store/Api'
import type { ApiErrorShape } from '../../store/Api'
import type { LocalPokemon } from '../../store/Types'

// Components
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog'

interface DeleteConfirmDialogProps {
  record: LocalPokemon
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteConfirmDialog({ record, open, onOpenChange, onDeleted }: DeleteConfirmDialogProps): JSX.Element {
  const { t } = useTranslation()
  const [deleteLocal, { isLoading, error }] = useDeleteLocalMutation()
  const displayName = record.localizedName ?? humanizeSlug(record.name)

  async function handleDelete(): Promise<void> {
    try {
      await deleteLocal(record.id).unwrap()
      onDeleted()
    } catch {
      // Error state is surfaced via the mutation's `error` below.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('collection.deleteConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('collection.deleteConfirmBody', { name: displayName })}</DialogDescription>
        </DialogHeader>

        {error !== undefined && (
          <p role="alert" className="text-sm text-destructive">
            {resolveApiErrorMessage(error as ApiErrorShape, t)}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={isLoading} onClick={(): void => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" disabled={isLoading} onClick={(): void => { void handleDelete() }}>
            {isLoading && <Loader2 className="animate-spin" aria-hidden />}
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
