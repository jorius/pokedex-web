// External
import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

// Hooks
import { useDocumentTitle } from '../hooks/UseDocumentTitle'
import { useInfiniteScroll } from '../hooks/UseInfiniteScroll'
import { useToast } from '../hooks/UseToast'
import { useVirtualList } from '../hooks/UseVirtualList'

// Lib
import { cn } from '../lib/Cn'
import { resolveApiErrorMessage } from '../lib/ApiErrorMessage'

// Store
import { useBrowsePokemonsQuery } from '../store/Api'
import type { ApiErrorShape } from '../store/Api'
import { useAppDispatch, useAppSelector } from '../store/Hooks'
import type { PokemonListItem } from '../store/Types'
import { setBrowseMode, setPageSize } from '../store/UiSlice'
import type { BrowseMode, PageSize } from '../store/UiSlice'

// Components
import { BrowseModeToggle } from '../components/pokemon/BrowseModeToggle'
import { PageSizeSelect, PaginationControls } from '../components/pokemon/PaginationControls'
import { PokemonCard } from '../components/pokemon/PokemonCard'
import { PokemonSearch } from '../components/search/PokemonSearch'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

/** First-paint guesses only — useVirtualList measures the real grid as soon as cards exist. */
const ESTIMATED_ROW_HEIGHT = 420

const ESTIMATED_COLUMN_COUNT = 4

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
  const browseMode = useAppSelector((state) => state.ui.browseMode)
  const baseUrl = useAppSelector((state) => state.apiTarget.baseUrl)
  const isInfinite = browseMode === 'infinite'

  // Infinite mode drives its own page counter and keeps the URL clean; `?page=` belongs to
  // pagination alone, so the two never fight over the same source of truth.
  const [infinitePage, setInfinitePage] = useState(1)
  const [loadedItems, setLoadedItems] = useState<PokemonListItem[]>([])
  const [knownTotalPages, setKnownTotalPages] = useState<number | null>(null)
  const [mergedBatchKey, setMergedBatchKey] = useState<string | null>(null)

  // Accumulated pages only make sense for one (backend, batch size) pair. Resetting during
  // render — React's documented "adjust state when inputs change" pattern — means the query below
  // already sees page 1 on this very render, instead of firing a doomed request for page N.
  const accumulationKey = `${baseUrl}|${pageSize}`
  const [lastAccumulationKey, setLastAccumulationKey] = useState(accumulationKey)
  if (lastAccumulationKey !== accumulationKey) {
    setLastAccumulationKey(accumulationKey)
    setInfinitePage(1)
    setLoadedItems([])
    setKnownTotalPages(null)
    setMergedBatchKey(null)
  }

  const urlPage = parsePageParam(searchParams.get('page'))
  const page = isInfinite ? infinitePage : urlPage
  // `data` keeps the previous arg's payload while the next one loads (that is what makes the
  // pagination grid hold still and dim); `currentData` is scoped to the arg in flight, which is
  // the only safe source for accumulation — merging `data` would splice the old batch size's
  // page into the new list.
  const { data, currentData, error, isLoading, isFetching, refetch } = useBrowsePokemonsQuery({ page, pageSize })

  useDocumentTitle(t('common.appName'))

  // Same adjust-during-render pattern: each batch merges exactly once (its key is recorded in
  // state), and the merge itself dedupes by pokeApiId, so a re-delivered cache hit or a
  // StrictMode double render can never append a page twice.
  const batchKey = currentData === undefined ? null : `${accumulationKey}|${currentData.meta.page}`
  if (isInfinite && currentData !== undefined && batchKey !== mergedBatchKey) {
    const batch = currentData
    setMergedBatchKey(batchKey)
    setKnownTotalPages(batch.meta.totalPages)
    setLoadedItems((previous) => {
      const seen = new Set(previous.map((item) => item.pokeApiId))
      const additions = batch.items.filter((item) => !seen.has(item.pokeApiId))
      return additions.length === 0 ? previous : [...previous, ...additions]
    })
  }

  // A stale `?page=` left over from pagination would be a lie in infinite mode.
  useEffect(() => {
    if (!isInfinite || !searchParams.has('page')) return
    setSearchParams({}, { replace: true })
  }, [isInfinite, searchParams, setSearchParams])

  const items = isInfinite ? loadedItems : (data?.items ?? [])
  const gridRef = useRef<HTMLUListElement>(null)
  const virtual = useVirtualList({
    containerRef: gridRef,
    itemCount: items.length,
    estimatedRowHeight: ESTIMATED_ROW_HEIGHT,
    estimatedColumnCount: ESTIMATED_COLUMN_COUNT,
    enabled: isInfinite,
  })
  const visibleItems = items.slice(virtual.startIndex, virtual.endIndex)

  // A failed batch parks the sentinel instead of letting it skip the page and hammer the API.
  const hasFailedBatch = isInfinite && error !== undefined && loadedItems.length > 0
  const hasMore = isInfinite && knownTotalPages !== null && infinitePage < knownTotalPages && !hasFailedBatch
  const isEndReached = isInfinite && !isFetching && !hasFailedBatch && knownTotalPages !== null && infinitePage >= knownTotalPages

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    hasMore,
    isLoading: isFetching,
    loadedCount: loadedItems.length,
    onLoadMore: (): void => setInfinitePage((current) => current + 1),
  })

  function handlePageChange(nextPage: number): void {
    // Page 1 is the default — keep it out of the URL so the root path stays canonical.
    setSearchParams(nextPage <= 1 ? {} : { page: String(nextPage) })
    window.scrollTo({ top: 0 })
  }

  function handlePageSizeChange(nextPageSize: PageSize): void {
    dispatch(setPageSize(nextPageSize))
    setSearchParams({})
  }

  // Either direction lands on a clean page 1: infinite starts a fresh accumulation, pagination
  // gets the canonical first page rather than wherever the scroll happened to stop.
  function handleBrowseModeChange(nextMode: BrowseMode): void {
    if (nextMode === browseMode) return

    dispatch(setBrowseMode(nextMode))
    setInfinitePage(1)
    setLoadedItems([])
    setKnownTotalPages(null)
    setMergedBatchKey(null)
    setSearchParams({})
    window.scrollTo({ top: 0 })
  }

  // A failed page load stays an inline page state (there is no grid to show), but a failed RETRY
  // is a transient event on a page the user is already looking at — that one toasts.
  function handleRetry(): void {
    void refetch()
      .unwrap()
      .catch((retryError: unknown) => { showToast({ message: resolveApiErrorMessage(retryError as ApiErrorShape, t), variant: 'error' }) })
  }

  function renderContent(): JSX.Element {
    if (error && items.length === 0) {
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

    // Infinite mode judges "still loading" by the in-flight arg, so a batch-size change shows
    // skeletons rather than flashing the empty state at a list that is merely being rebuilt.
    const hasBatch = isInfinite ? currentData !== undefined : data !== undefined
    if ((isLoading || !hasBatch) && items.length === 0) {
      return (
        <div className={GRID_CLASS} aria-hidden>
          {Array.from({ length: pageSize }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-muted-foreground">{t('browse.empty')}</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <ul
        ref={gridRef}
        className={cn(GRID_CLASS, 'list-none p-0 transition-opacity', !isInfinite && isFetching && 'pointer-events-none opacity-60')}
        // Spacers are padding on the grid itself: they reserve the unrendered rows' height
        // without occupying grid cells or adding non-item children to the list.
        style={isInfinite ? { paddingTop: virtual.topSpacerHeight, paddingBottom: virtual.bottomSpacerHeight } : undefined}
      >
        {visibleItems.map((pokemon, index) => (
          <li key={pokemon.pokeApiId} aria-setsize={isInfinite ? items.length : undefined} aria-posinset={isInfinite ? virtual.startIndex + index + 1 : undefined}>
            <PokemonCard pokemon={pokemon} />
          </li>
        ))}
      </ul>
    )
  }

  function renderInfiniteFooter(): JSX.Element {
    return (
      <div className="flex flex-col items-center gap-4">
        {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
        <p role="status" className="text-sm text-muted-foreground">
          {isFetching && loadedItems.length > 0 && t('browseMode.loadingMore')}
          {isEndReached && t('browseMode.endReached')}
        </p>
        {hasFailedBatch && (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <p role="alert" className="text-sm text-muted-foreground">
                {resolveApiErrorMessage(error as ApiErrorShape, t)}
              </p>
              <Button variant="outline" onClick={handleRetry}>
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-display text-3xl font-bold tracking-wide">{t('browse.title')}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <PokemonSearch />
          <BrowseModeToggle mode={browseMode} onModeChange={handleBrowseModeChange} />
          {isInfinite && <PageSizeSelect pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />}
        </div>
      </div>
      {renderContent()}
      {isInfinite
        ? renderInfiniteFooter()
        : !error && data !== undefined && data.items.length > 0 && (
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
