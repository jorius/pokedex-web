// External
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export interface UseVirtualListOptions<TElement extends HTMLElement> {
  /** The CSS grid element that holds the rendered items (columns and row height are read off it). */
  containerRef: RefObject<TElement | null>
  itemCount: number
  /** Used until a real row can be measured (first paint, empty list). */
  estimatedRowHeight: number
  /** Used until the grid's computed `grid-template-columns` can be read. */
  estimatedColumnCount?: number
  overscanRows?: number
  /** False renders everything and zeroes the spacers — pagination mode keeps its plain grid. */
  enabled?: boolean
}

export interface UseVirtualListResult {
  /** Render `items.slice(startIndex, endIndex)`. */
  startIndex: number
  endIndex: number
  /** Apply as padding on the grid so the scrollbar and row offsets match the full list. */
  topSpacerHeight: number
  bottomSpacerHeight: number
  columnCount: number
  rowHeight: number
}

interface GridMetrics {
  columnCount: number
  rowHeight: number
}

interface VisibleRows {
  startRow: number
  endRow: number
}

const DEFAULT_OVERSCAN_ROWS = 2

/** Row height is measured, not assumed, so a card design change can't silently break the math. */
function measureGrid(container: HTMLElement | null, fallback: GridMetrics): GridMetrics {
  if (!container) return fallback

  const style = window.getComputedStyle(container)
  const tracks = style.gridTemplateColumns.split(' ').filter((track) => track.length > 0)
  const columnCount = tracks.length > 0 && tracks[0] !== 'none' ? tracks.length : fallback.columnCount

  const rowGap = Number.parseFloat(style.rowGap)
  const gap = Number.isFinite(rowGap) ? rowGap : 0
  const firstItem = container.firstElementChild
  const lastItem = container.lastElementChild
  if (!firstItem || !lastItem) return { columnCount, rowHeight: fallback.rowHeight }

  // Span of the rendered block divided by the rows it occupies — averages away the per-row
  // variance the grid introduces when one card in a row wraps to an extra line.
  const renderedRows = Math.max(1, Math.ceil(container.childElementCount / columnCount))
  const span = lastItem.getBoundingClientRect().bottom - firstItem.getBoundingClientRect().top
  const rowHeight = (span + gap) / renderedRows

  return { columnCount, rowHeight: rowHeight > 1 ? rowHeight : fallback.rowHeight }
}

/**
 * The grid's top never moves (the top spacer is padding INSIDE it), so the visible row band is a
 * plain function of window scroll — no scroll container, no measurement of unrendered rows.
 */
function computeRows(container: HTMLElement | null, metrics: GridMetrics, itemCount: number, overscanRows: number): VisibleRows | null {
  const rowCount = Math.ceil(itemCount / metrics.columnCount)
  if (!container || rowCount === 0 || metrics.rowHeight <= 0) return null

  const listTop = container.getBoundingClientRect().top + window.scrollY
  const viewportTop = window.scrollY
  const viewportBottom = viewportTop + window.innerHeight
  const firstVisibleRow = Math.floor((viewportTop - listTop) / metrics.rowHeight) - overscanRows
  const lastVisibleRow = Math.ceil((viewportBottom - listTop) / metrics.rowHeight) + overscanRows

  const startRow = Math.min(Math.max(firstVisibleRow, 0), rowCount)
  const endRow = Math.min(Math.max(lastVisibleRow, startRow), rowCount)

  return { startRow, endRow }
}

function sameRows(a: VisibleRows, b: VisibleRows): boolean {
  return a.startRow === b.startRow && a.endRow === b.endRow
}

/**
 * Window-scroll windowing for a responsive CSS grid. Hand-rolled on purpose: the whole job is
 * one IntersectionObserver-free scroll listener plus two padding values, which is far less code
 * than adapting a virtualization library to a grid whose column count comes from CSS
 * breakpoints — and it adds no dependency to a project that pins every version by hand.
 *
 * Known limitation: only the rendered window is in the DOM, so items scrolled out of it are not
 * in the tab order (the same trade-off every virtualized list makes).
 */
export function useVirtualList<TElement extends HTMLElement>(options: UseVirtualListOptions<TElement>): UseVirtualListResult {
  const {
    containerRef,
    itemCount,
    estimatedRowHeight,
    estimatedColumnCount = 1,
    overscanRows = DEFAULT_OVERSCAN_ROWS,
    enabled = true,
  } = options

  const [metrics, setMetrics] = useState<GridMetrics>({ columnCount: estimatedColumnCount, rowHeight: estimatedRowHeight })
  // First paint has nothing to measure, so start with a viewport's worth of rows: enough to fill
  // the screen (and give the measurer real cards to read), nowhere near the whole list.
  const [rows, setRows] = useState<VisibleRows>(() => ({ startRow: 0, endRow: Math.ceil(window.innerHeight / estimatedRowHeight) + overscanRows }))
  const frameRef = useRef<number | null>(null)

  /** Scroll path: cheap, uses the metrics already in state. */
  const syncRows = useCallback((): void => {
    const next = computeRows(containerRef.current, metrics, itemCount, overscanRows)
    if (!next) return
    setRows((previous) => (sameRows(previous, next) ? previous : next))
  }, [containerRef, itemCount, metrics, overscanRows])

  /** Layout path: remeasures first, then ranges off the fresh numbers — never off state, so it
   * cannot feed its own output back in and oscillate. */
  const measureAndSync = useCallback((): void => {
    const container = containerRef.current
    const measured = measureGrid(container, { columnCount: estimatedColumnCount, rowHeight: estimatedRowHeight })
    setMetrics((previous) =>
      previous.columnCount === measured.columnCount && Math.abs(previous.rowHeight - measured.rowHeight) < 1 ? previous : measured,
    )

    const next = computeRows(container, measured, itemCount, overscanRows)
    if (!next) return
    setRows((previous) => (sameRows(previous, next) ? previous : next))
  }, [containerRef, estimatedColumnCount, estimatedRowHeight, itemCount, overscanRows])

  // Runs on mount and after every append: the new items are already laid out, so this is the
  // moment the real row height and column count are readable.
  useLayoutEffect(() => {
    if (!enabled) return
    measureAndSync()
  }, [enabled, measureAndSync])

  useEffect(() => {
    if (!enabled) return

    function handleScroll(): void {
      // Coalesce to one recompute per frame; the range itself only changes on a row boundary,
      // so most frames end without a re-render at all.
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null
        syncRows()
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return (): void => {
      window.removeEventListener('scroll', handleScroll)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [enabled, syncRows])

  useEffect(() => {
    if (!enabled) return

    // A resize can cross a Tailwind breakpoint, which changes the column count and therefore
    // every row boundary — remeasure rather than recompute.
    function handleResize(): void {
      measureAndSync()
    }

    window.addEventListener('resize', handleResize)

    return (): void => {
      window.removeEventListener('resize', handleResize)
    }
  }, [enabled, measureAndSync])

  if (!enabled) {
    return {
      startIndex: 0,
      endIndex: itemCount,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
      columnCount: metrics.columnCount,
      rowHeight: metrics.rowHeight,
    }
  }

  const rowCount = Math.ceil(itemCount / metrics.columnCount)
  const startRow = Math.min(rows.startRow, rowCount)
  const endRow = Math.min(Math.max(rows.endRow, startRow), rowCount)

  return {
    startIndex: startRow * metrics.columnCount,
    endIndex: Math.min(endRow * metrics.columnCount, itemCount),
    topSpacerHeight: startRow * metrics.rowHeight,
    bottomSpacerHeight: Math.max(rowCount - endRow, 0) * metrics.rowHeight,
    columnCount: metrics.columnCount,
    rowHeight: metrics.rowHeight,
  }
}
