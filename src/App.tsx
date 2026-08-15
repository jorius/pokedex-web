// External
import type { JSX } from 'react'

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
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header />
      {/* TODO(Task 6): temporary token showcase — replaced by real pages */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <section className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold tracking-wide">Theme showcase</h1>
          <p className="text-muted-foreground">Every surface below is token-driven — switch themes from the header to verify all four palettes.</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>All variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="Icon button">
                  <span aria-hidden className="size-2 rounded-full bg-current" />
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Token-driven dialog</DialogTitle>
                    <DialogDescription>Cards, overlays and focus rings all follow the active theme.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges and form controls</CardTitle>
              <CardDescription>Badge variants, input and label</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge className="bg-accent text-accent-foreground border-transparent">Accent</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="demo-search">Search</Label>
                <Input id="demo-search" placeholder="Search for a pokemon..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading state</CardTitle>
              <CardDescription>Skeleton placeholders</CardDescription>
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
              <CardTitle>Palette tokens</CardTitle>
              <CardDescription>Raw swatches of the active theme</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {[
                ['Primary', 'bg-primary'],
                ['Secondary', 'bg-secondary'],
                ['Accent', 'bg-accent'],
                ['Muted', 'bg-muted'],
                ['Destructive', 'bg-destructive'],
                ['Border', 'bg-border'],
              ].map(([name, tokenClass]) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <span className={`size-10 rounded-md border ${tokenClass}`} />
                  <span className="text-xs text-muted-foreground">{name}</span>
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
