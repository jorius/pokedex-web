// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Components
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

// TODO(Task 6): replaced by the real paginated grid — this is a token-driven loading placeholder.
const PLACEHOLDER_CARD_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

export function BrowsePage(): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold tracking-wide">{t('browse.title')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_CARD_KEYS.map((key) => (
          <Card key={key}>
            <CardHeader className="items-center">
              <Skeleton className="size-20 rounded-full" />
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
