// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Components
import { Header } from './components/layout/Header'
import { Badge } from './components/ui/Badge'
import { Button } from './components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/Dialog'
import { Input } from './components/ui/Input'
import { Label } from './components/ui/Label'
import { Skeleton } from './components/ui/Skeleton'

function App(): JSX.Element {
  const { t } = useTranslation()

  const swatches = [
    { labelKey: 'showcase.swatchPrimary', tokenClass: 'bg-primary' },
    { labelKey: 'showcase.swatchSecondary', tokenClass: 'bg-secondary' },
    { labelKey: 'showcase.swatchAccent', tokenClass: 'bg-accent' },
    { labelKey: 'showcase.swatchMuted', tokenClass: 'bg-muted' },
    { labelKey: 'showcase.swatchDestructive', tokenClass: 'bg-destructive' },
    { labelKey: 'showcase.swatchBorder', tokenClass: 'bg-border' },
  ] as const

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header />
      {/* TODO(Task 6): temporary token showcase — replaced by real pages */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <section className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold tracking-wide">{t('showcase.title')}</h1>
          <p className="text-muted-foreground">{t('showcase.subtitle')}</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('showcase.buttonsTitle')}</CardTitle>
              <CardDescription>{t('showcase.buttonsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button>{t('showcase.variantDefault')}</Button>
                <Button variant="secondary">{t('showcase.variantSecondary')}</Button>
                <Button variant="outline">{t('showcase.variantOutline')}</Button>
                <Button variant="ghost">{t('showcase.variantGhost')}</Button>
                <Button variant="destructive">{t('showcase.variantDestructive')}</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">{t('showcase.sizeSmall')}</Button>
                <Button size="default">{t('showcase.sizeDefault')}</Button>
                <Button size="lg">{t('showcase.sizeLarge')}</Button>
                <Button size="icon" aria-label={t('showcase.iconButtonLabel')}>
                  <span aria-hidden className="size-2 rounded-full bg-current" />
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">{t('showcase.openDialog')}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('showcase.dialogTitle')}</DialogTitle>
                    <DialogDescription>{t('showcase.dialogDescription')}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button>{t('common.confirm')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('showcase.badgesTitle')}</CardTitle>
              <CardDescription>{t('showcase.badgesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{t('showcase.variantDefault')}</Badge>
                <Badge variant="secondary">{t('showcase.variantSecondary')}</Badge>
                <Badge variant="outline">{t('showcase.variantOutline')}</Badge>
                <Badge className="bg-accent text-accent-foreground border-transparent">{t('showcase.swatchAccent')}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="demo-search">{t('showcase.searchLabel')}</Label>
                <Input id="demo-search" placeholder={t('showcase.searchPlaceholder')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('showcase.loadingTitle')}</CardTitle>
              <CardDescription>{t('showcase.loadingDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('showcase.paletteTitle')}</CardTitle>
              <CardDescription>{t('showcase.paletteDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {swatches.map(({ labelKey, tokenClass }) => (
                <div key={labelKey} className="flex flex-col items-center gap-1">
                  <span className={`size-10 rounded-md border ${tokenClass}`} />
                  <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

export default App
