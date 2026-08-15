// External
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export interface UseInfiniteScrollOptions {
  /** False stops the observer entirely — the last page is loaded, nothing left to fetch. */
  hasMore: boolean
  /** True while a page is in flight, so an intersection can't queue a second fetch. */
  isLoading: boolean
  /**
   * Number of items loaded so far. It re-arms the observer after every batch — a batch served
   * from the RTK Query cache never flips `isLoading`, so without this the one-shot observer
   * would fire once and then sit disconnected forever.
   */
  loadedCount?: number
  onLoadMore: () => void
  /** How far below the viewport the sentinel starts counting as visible. */
  rootMargin?: string
}

/** A viewport height's worth of runway: the next batch lands before the user hits the bottom. */
const DEFAULT_ROOT_MARGIN = '600px'

/**
 * Attach the returned ref to a zero-height sentinel below the list. The observer only exists
 * while there is more to load and nothing is in flight, so `onLoadMore` cannot double-fire:
 * the first intersection disconnects immediately, and the effect re-subscribes (re-observing the
 * sentinel, which fires again if it is still on screen) once the batch has landed.
 */
export function useInfiniteScroll<TElement extends Element>(options: UseInfiniteScrollOptions): RefObject<TElement | null> {
  const { hasMore, isLoading, loadedCount = 0, onLoadMore, rootMargin = DEFAULT_ROOT_MARGIN } = options
  const sentinelRef = useRef<TElement | null>(null)

  // The callback usually changes identity every render; keeping it in a ref means the observer
  // is torn down only when the guards actually change, not on every parent render.
  const onLoadMoreRef = useRef(onLoadMore)
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        onLoadMoreRef.current()
      },
      { rootMargin },
    )

    observer.observe(sentinel)

    return (): void => {
      observer.disconnect()
    }
  }, [hasMore, isLoading, loadedCount, rootMargin])

  return sentinelRef
}
