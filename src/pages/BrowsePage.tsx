// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

// Hooks
import { useDocumentTitle } from '../hooks/UseDocumentTitle'
import { useToast } from '../hooks/UseToast'

// Lib
import { cn } from '../lib/Cn'
import { resolveApiErrorMessage } from '../lib/ApiErrorMessage'

// Store
import { useBrowsePokemonsQuery } from '../store/Api'
import type { ApiErrorShape } from '../store/Api'
import { useAppDispatch, useAppSelector } from '../store/Hooks'
import { setPageSize } from '../store/UiSlice'
import type { PageSize } from '../store/UiSlice'

// Components
import { PaginationControls } from '../components/pokemon/PaginationControls'
import { PokemonCard } from '../components/pokemon/PokemonCard'
import { PokemonSearch } from '../components/search/PokemonSearch'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

/** `?page=` is user-editable — anything that isn't a positive integer falls back to page 1. */
function parsePageParam(raw: string | null): number {
  const parsed = Number(raw ?? '1')
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1
}

function SkeletonCard(): JSX.Element {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </Card>
  )
}

export function BrowsePage(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const pageSize = useAppSelector((state) => state.ui.pageSize)
  const page = parsePageParam(searchParams.get('page'))
  const { data, error, isLoading, isFetching, refetch } = useBrowsePokemonsQuery({ page, pageSize })

  useDocumentTitle(t('common.appName'))

  function handlePageChange(nextPage: number): void {
    // Page 1 is the default — keep it out of the URL so the root path stays canonical.
    setSearchParams(nextPage <= 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0 })
  }

  function handlePageSizeChange(nextPageSize: PageSize): void {
    dispatch(setPageSize(nextPageSize))
    setSearchParams({})
  }

  // A failed page load stays an inline page state (there is no grid to show), but a failed RETRY
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
        <div className={GRID_CLASS} aria-hidden>
          {Array.from({ length: pageSize }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )
    }

    if (data.items.length === 0) {
      return (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-muted-foreground">{t('browse.empty')}</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <ul className={cn(GRID_CLASS, 'list-none p-0 transition-opacity', isFetching && 'pointer-events-none opacity-60')}>
        {data.items.map((pokemon) => (
          <li key={pokemon.pokeApiId}>
            <PokemonCard pokemon={pokemon} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold tracking-wide">{t('browse.title')}</h1>
        <PokemonSearch />
      </div>
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
    </div>
  )
}
