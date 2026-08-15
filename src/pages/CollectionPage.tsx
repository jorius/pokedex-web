// External
import { useState } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

// Hooks
import { useDocumentTitle } from '../hooks/UseDocumentTitle'
import { useToast } from '../hooks/UseToast'

// Lib
import { resolveApiErrorMessage } from '../lib/ApiErrorMessage'
import { cn } from '../lib/Cn'
import { toDisplayName } from '../lib/Format'

// Store
import { useGetLocalQuery } from '../store/Api'
import type { ApiErrorShape } from '../store/Api'
import { useAppDispatch, useAppSelector } from '../store/Hooks'
import type { LocalPokemon } from '../store/Types'
import { setPageSize } from '../store/UiSlice'
import type { PageSize } from '../store/UiSlice'

// Components
import { CollectionEntryCard } from '../components/collection/CollectionEntryCard'
import { DeleteConfirmDialog } from '../components/collection/DeleteConfirmDialog'
import { EditLocalDialog } from '../components/collection/EditLocalDialog'
import { ReleaseConfirmDialog } from '../components/collection/ReleaseConfirmDialog'
import { formatCredits } from '../components/economy/EconomyFormat'
import { PaginationControls } from '../components/pokemon/PaginationControls'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

/** `?page=` is user-editable — anything that isn't a positive integer falls back to page 1. */
function parsePageParam(raw: string | null): number {
  const parsed = Number(raw ?? '1')
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1
}

function SkeletonRow(): JSX.Element {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Skeleton className="size-20 shrink-0 rounded-md sm:size-24" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  )
}

export function CollectionPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const pageSize = useAppSelector((state) => state.ui.pageSize)
  const page = parsePageParam(searchParams.get('page'))
  const { data, error, isLoading, isFetching, refetch } = useGetLocalQuery({ page, pageSize })

  const [editingRecord, setEditingRecord] = useState<LocalPokemon | null>(null)
  const [releasingRecord, setReleasingRecord] = useState<LocalPokemon | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<LocalPokemon | null>(null)

  useDocumentTitle(`${t('common.appName')} — ${t('collection.title')}`)

  function handlePageChange(nextPage: number): void {
    // Page 1 is the default — keep it out of the URL so the route stays canonical.
    setSearchParams(nextPage <= 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0 })
  }

  function handlePageSizeChange(nextPageSize: PageSize): void {
    dispatch(setPageSize(nextPageSize))
    setSearchParams({})
  }

  function handleUpdated(): void {
    setEditingRecord(null)
    showToast({ message: t('collection.updated'), variant: 'success' })
  }

  // Removing the last record on a page beyond the first leaves it empty — step back a page instead
  // of showing a dead end. Shared by delete and release, which both take an entry off the page.
  function stepBackIfPageEmptied(): void {
    if (data !== undefined && data.items.length === 1 && page > 1) {
      handlePageChange(page - 1)
    }
  }

  function handleDeleted(): void {
    setDeletingRecord(null)
    showToast({ message: t('collection.deleted'), variant: 'success' })
    stepBackIfPageEmptied()
  }

  /**
   * The refund is read from the RESPONSE rather than recomputed here, so the figure the player is
   * congratulated with is the one the server actually paid — the legendary bonus included, and
   * without this page needing to know which species earn it.
   */
  function handleReleased(creditsAwarded: number): void {
    // Read before clearing: the toast names the entry, and the state is about to be gone. Same
    // title-casing as the dialog that just asked, so the two sentences agree.
    const name = releasingRecord === null ? '' : releasingRecord.localizedName ?? toDisplayName(releasingRecord.name)
    setReleasingRecord(null)
    showToast({ message: t('collection.released', { name, amount: formatCredits(creditsAwarded, i18n.language) }), variant: 'success' })
    stepBackIfPageEmptied()
  }

  // A failed page load stays an inline page state (there is no list to show), but a failed RETRY
  // is a transient event on a page the user is already looking at — that one toasts.
  function handleRetry(): void {
    void refetch()
      .unwrap()
      .catch((retryError: unknown) => { showToast({ message: resolveApiErrorMessage(retryError as ApiErrorShape, t), variant: 'error' }) })
  }

  function renderContent(): JSX.Element {
    if (error) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <p role="alert" className="text-sm text-muted-foreground">
              {resolveApiErrorMessage(error as ApiErrorShape, t)}
            </p>
            <Button variant="outline" onClick={handleRetry}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (isLoading || !data) {
      return (
        <div className="flex flex-col gap-4" aria-hidden>
          {Array.from({ length: Math.min(pageSize, 5) }, (_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      )
    }

    if (data.items.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-muted-foreground">{t('collection.empty')}</p>
            <Button asChild variant="outline">
              <Link to="/">{t('collection.emptyCta')}</Link>
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <ul className={cn('flex list-none flex-col gap-4 p-0 transition-opacity', isFetching && 'pointer-events-none opacity-60')}>
        {data.items.map((record) => (
          <li key={record.id}>
            <CollectionEntryCard
              record={record}
              onEdit={(): void => setEditingRecord(record)}
              onRelease={(): void => setReleasingRecord(record)}
              onDelete={(): void => setDeletingRecord(record)}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold tracking-wide">{t('collection.title')}</h1>

      {renderContent()}

      {!error && data !== undefined && data.items.length > 0 && (
        <PaginationControls
          page={page}
          totalPages={data.meta.totalPages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {editingRecord !== null && (
        <EditLocalDialog
          record={editingRecord}
          open
          onOpenChange={(next): void => { if (!next) setEditingRecord(null) }}
          onUpdated={handleUpdated}
        />
      )}
      {releasingRecord !== null && (
        <ReleaseConfirmDialog
          record={releasingRecord}
          open
          onOpenChange={(next): void => { if (!next) setReleasingRecord(null) }}
          onReleased={handleReleased}
        />
      )}
      {deletingRecord !== null && (
        <DeleteConfirmDialog
          record={deletingRecord}
          open
          onOpenChange={(next): void => { if (!next) setDeletingRecord(null) }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
