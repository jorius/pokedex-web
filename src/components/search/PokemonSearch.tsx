// External
import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { JSX, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

// Hooks
import { useDebouncedValue } from '../../hooks/UseDebouncedValue'
import { useToast } from '../../hooks/UseToast'

// Lib
import { resolveApiErrorMessage } from '../../lib/ApiErrorMessage'
import { cn } from '../../lib/Cn'
import { formatPokedexNumber, humanizeSlug } from '../../lib/Format'

// Store
import { useGetPokemonByIdQuery, useGetPokemonByNameQuery } from '../../store/Api'
import type { ApiErrorShape } from '../../store/Api'

// Components
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

/** Long enough that a burst of keystrokes settles into ONE request, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 350

/** The backend exposes id and name lookups on separate routes — all digits means pokedex number. */
function isNumericQuery(query: string): boolean {
  return /^\d+$/.test(query)
}

/**
 * Quick-jump search over the existing id/name detail endpoints. It deliberately does NOT filter
 * the browse grid (there is no server-side list search): the panel floats over the grid as a
 * jump-to-detail affordance and the browse results underneath stay untouched.
 */
export function PokemonSearch(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [rawQuery, setRawQuery] = useState('')

  const query = rawQuery.trim().toLowerCase()
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const isNumeric = isNumericQuery(debouncedQuery)

  // Exactly one of the two runs: `skip` keeps the other unsubscribed, and both stay skipped
  // while the field is empty so an empty query never hits the network.
  const idResult = useGetPokemonByIdQuery(Number(debouncedQuery), { skip: debouncedQuery === '' || !isNumeric })
  const nameResult = useGetPokemonByNameQuery(debouncedQuery, { skip: debouncedQuery === '' || isNumeric })
  // `currentData`, never `data`: RTK Query keeps the last SUCCESSFUL payload in `data` across arg
  // changes, so a miss after a hit would keep rendering the previous Pokémon's card.
  const { currentData: match, error, isFetching } = isNumeric ? idResult : nameResult

  // Still typing (debounce pending) counts as searching — the panel must never show a stale
  // "not found" for a query the user has already moved past.
  const isPending = query !== debouncedQuery || isFetching
  const isOpen = query !== ''
  const apiError = error as ApiErrorShape | undefined
  const isMiss = !isPending && apiError?.status === 404

  // A 404 is a legitimate answer ("no such Pokémon") and stays inline. Anything else is a real
  // failure and toasts once per (query, status) so a re-render can't spam the stack.
  const lastToastKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const failure = error as ApiErrorShape | undefined
    if (!failure || failure.status === 404) return

    const toastKey = `${debouncedQuery}|${String(failure.status)}`
    if (lastToastKeyRef.current === toastKey) return

    lastToastKeyRef.current = toastKey
    showToast({ message: resolveApiErrorMessage(failure, t), variant: 'error' })
  }, [error, debouncedQuery, showToast, t])

  function clearSearch(): void {
    setRawQuery('')
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      clearSearch()
      return
    }

    if (event.key === 'Enter' && !isPending && match) {
      event.preventDefault()
      void navigate(`/pokemon/${match.pokeApiId}`)
    }
  }

  function renderPanel(): JSX.Element {
    if (isPending) {
      return (
        <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {t('search.searching')}
        </p>
      )
    }

    if (match) {
      return (
        <Link
          to={`/pokemon/${match.pokeApiId}`}
          className={cn(
            'group flex items-center gap-3 rounded-lg p-3 outline-none hover:bg-muted',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted p-1">
            {match.spriteUrl !== null ? (
              <img src={match.spriteUrl} alt="" className="size-full object-contain [image-rendering:pixelated]" />
            ) : (
              <span aria-hidden className="font-display text-2xl text-muted-foreground/50">?</span>
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-baseline gap-2">
              <span className="truncate font-display text-base font-bold capitalize">{humanizeSlug(match.name)}</span>
              <span className="font-display text-xs text-muted-foreground">{formatPokedexNumber(match.pokeApiId)}</span>
            </span>
            {match.category !== null && <span className="truncate text-xs text-muted-foreground">{match.category}</span>}
          </span>
          <span aria-hidden className="hidden shrink-0 text-xs text-muted-foreground sm:block">{t('search.hint')}</span>
        </Link>
      )
    }

    if (isMiss) {
      return <p className="p-3 text-sm text-muted-foreground">{t('search.notFound', { query: rawQuery.trim() })}</p>
    }

    // Non-404 failure — the toast above carries the message, the panel stays out of the way.
    return <p className="p-3 text-sm text-muted-foreground">{t('common.error.generic')}</p>
  }

  return (
    <div className="relative w-full sm:w-80">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={rawQuery}
          onChange={(event): void => setRawQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={t('search.label')}
          placeholder={t('search.placeholder')}
          className="pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {rawQuery !== '' && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('search.clear')}
            onClick={clearSearch}
            // Fills the field's own height on touch (h-10 field, size-10 button — it is `ghost`,
            // so nothing is drawn until it is pressed) and shrinks back inside it from lg.
            className="absolute right-0.5 top-1/2 size-10 -translate-y-1/2 text-muted-foreground lg:size-8"
          >
            <X aria-hidden />
          </Button>
        )}
      </div>
      {isOpen && (
        <div aria-live="polite" className="absolute left-0 right-0 top-full z-30 mt-2">
          <Card className="overflow-hidden border-accent/60 p-1 shadow-lg">{renderPanel()}</Card>
        </div>
      )}
    </div>
  )
}
