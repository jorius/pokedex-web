// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Components
import { Card, CardContent } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

// TODO(Task 7): replaced by the real collection table with edit/delete dialogs.
export function CollectionPage(): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold tracking-wide">{t('collection.title')}</h1>
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  )
}
