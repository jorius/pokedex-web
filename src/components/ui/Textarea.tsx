// External
import type { ComponentPropsWithRef, JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

export function Textarea({ className, ...props }: ComponentPropsWithRef<'textarea'>): JSX.Element {
  return (
    <textarea
      className={cn(
        // text-base below xl for the same no-zoom-on-focus reason as Input.
        'flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground shadow-sm xl:text-sm',
        'placeholder:text-muted-foreground transition-colors resize-y',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
