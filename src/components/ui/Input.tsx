// External
import type { ComponentPropsWithRef, JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

export function Input({ className, ...props }: ComponentPropsWithRef<'input'>): JSX.Element {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground shadow-sm',
        'placeholder:text-muted-foreground transition-colors',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
