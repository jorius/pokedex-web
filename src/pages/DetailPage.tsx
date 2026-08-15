// External
import type { JSX } from 'react'
import { useParams } from 'react-router'

// Components
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

// TODO(Task 6): replaced by the real detail view (artwork, stats, types, evolution chain).
export function DetailPage(): JSX.Element {
  const { idOrName } = useParams<{ idOrName: string }>()

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{idOrName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Skeleton className="size-48 rounded-lg" />
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
