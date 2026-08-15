// External
import { Compass } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

// Components
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'

export function NotFoundPage(): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <Card>
        <CardHeader className="items-center text-center">
          <Compass className="size-10 text-muted-foreground" aria-hidden />
          <CardTitle>{t('common.notFound.title')}</CardTitle>
          <CardDescription>{t('common.notFound.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link to="/">{t('common.notFound.cta')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
