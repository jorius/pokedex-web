// External
import { HeartHandshake, Loader2 } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useToast } from '../../hooks/UseToast'

// Lib
import { resolveApiErrorMessage } from '../../lib/ApiErrorMessage'
import { toDisplayName } from '../../lib/Format'

// Store
import { useReleaseLocalMutation } from '../../store/Api'
import type { ApiErrorShape } from '../../store/Api'
import type { LocalPokemon } from '../../store/Types'

// Components
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog'
import { formatCredits } from '../economy/EconomyFormat'
import { releaseRefund } from '../economy/EconomyRewards'

interface ReleaseConfirmDialogProps {
  record: LocalPokemon
  open: boolean
  onOpenChange: (open: boolean) => void
  onReleased: (creditsAwarded: number) => void
}

/**
 * Twin of DeleteConfirmDialog, and deliberately not a shared "confirm" component: the whole point
 * of this dialog is to be told apart from that one at a glance. Both remove the entry, only this
 * one pays for it, and the two are one button apart on the same card — so the copy names the
 * refund AND says outright how Delete differs, rather than leaving the player to infer it.
 *
 * The quoted figure is the local mirror of the server's rule (see EconomyRewards); the toast the
 * page raises afterwards reports what the server actually paid.
 */
export function ReleaseConfirmDialog({ record, open, onOpenChange, onReleased }: ReleaseConfirmDialogProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const [releaseLocal, { isLoading }] = useReleaseLocalMutation()
  // toDisplayName, not humanizeSlug: this name lands mid-sentence in prose, where CSS `capitalize`
  // (which is what the collection card leans on) cannot reach it. A nickname is used verbatim —
  // it was typed by the player, so re-casing it would be rude.
  const displayName = record.localizedName ?? toDisplayName(record.name)
  const refund = formatCredits(releaseRefund(record.pokeApiId), i18n.language)

  async function handleRelease(): Promise<void> {
    try {
      const result = await releaseLocal(record.id).unwrap()
      onReleased(result.creditsAwarded)
    } catch (error) {
      // Matches the delete dialog: the dialog stays open on failure so the player can retry or back
      // out deliberately, and the reason goes to the toast layer, which portals above it.
      showToast({ message: resolveApiErrorMessage(error as ApiErrorShape, t), variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('collection.releaseConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('collection.releaseConfirmBody', { name: displayName, amount: refund })}</DialogDescription>
        </DialogHeader>

        {/* The disambiguation, given its own block rather than appended to the description: this is
            the line that stops a mis-click on the card below becoming an irreversible surprise. */}
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t('collection.releaseConfirmVersusDelete')}
        </p>

        <DialogFooter>
          <Button variant="outline" disabled={isLoading} onClick={(): void => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          {/* Not `destructive`: releasing pays you. Colouring it like Delete would undo the whole
              distinction the copy above just drew. */}
          <Button disabled={isLoading} onClick={(): void => { void handleRelease() }}>
            {isLoading ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden /> : <HeartHandshake aria-hidden />}
            <span className="tabular-nums">{t('collection.releaseAction', { amount: refund })}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
