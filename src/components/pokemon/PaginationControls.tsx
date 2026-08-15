// External
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Store
import { PAGE_SIZES, isPageSize } from '../../store/UiSlice'
import type { PageSize } from '../../store/UiSlice'

// Components
import { Button } from '../ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'

interface PageSizeSelectProps {
  pageSize: PageSize
  onPageSizeChange: (pageSize: PageSize) => void
}

/** Page-size Select on its own: pagination uses it as "per page", infinite scroll reuses it as
 * the batch size, so both modes share one control instead of two that drift apart. */
export function PageSizeSelect({ pageSize, onPageSizeChange }: PageSizeSelectProps): JSX.Element {
  const { t } = useTranslation()

  function handlePageSizeChange(value: string): void {
    const parsed = Number(value)
    if (isPageSize(parsed)) onPageSizeChange(parsed)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('browse.pageSize')}</span>
      <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
        <SelectTrigger aria-label={t('browse.pageSize')} className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface PaginationControlsProps {
  page: number
  totalPages: number
  pageSize: PageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
}

/** Prev/next pager plus the page-size Select. Presentational — the owner wires page state
 * (URL) and page size (uiSlice); reused by Browse now and Collection later. */
export function PaginationControls({ page, totalPages, pageSize, onPageChange, onPageSizeChange }: PaginationControlsProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <PageSizeSelect pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" aria-label={t('browse.previous')} disabled={page <= 1} onClick={(): void => onPageChange(page - 1)}>
          <ChevronLeft aria-hidden />
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          {t('browse.page')} <span className="font-bold text-foreground">{page}</span> {t('browse.of')} <span className="font-bold text-foreground">{totalPages}</span>
        </span>
        <Button variant="outline" size="icon" aria-label={t('browse.next')} disabled={page >= totalPages} onClick={(): void => onPageChange(page + 1)}>
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  )
}
