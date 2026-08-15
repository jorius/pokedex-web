// External
import { Loader2 } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useToast } from '../../hooks/UseToast'

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
  const { showToast } = useToast()
  const [deleteLocal, { isLoading }] = useDeleteLocalMutation()
  const displayName = record.localizedName ?? humanizeSlug(record.name)

  async function handleDelete(): Promise<void> {
    try {
      await deleteLocal(record.id).unwrap()
      onDeleted()
    } catch (error) {
      // The dialog stays open on failure so the user can retry or cancel deliberately; the
      // reason why goes to the toast layer, which portals above the dialog.
      showToast({ message: resolveApiErrorMessage(error as ApiErrorShape, t), variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('collection.deleteConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('collection.deleteConfirmBody', { name: displayName })}</DialogDescription>
        </DialogHeader>

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
