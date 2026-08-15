// External
import type { ComponentPropsWithRef, JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

export function Input({ className, ...props }: ComponentPropsWithRef<'input'>): JSX.Element {
  return (
    <input
      className={cn(
        // 40px and 16px text below xl: a taller field to tap, and a font size at or above 16px,
        // which is the threshold under which mobile Safari zooms the page on focus. Both revert to
        // the original h-9/text-sm from xl up, so desktop density is unchanged.
        'flex h-10 w-full rounded-md border border-input bg-card px-3 py-1 text-base text-foreground shadow-sm xl:h-9 xl:text-sm',
        'placeholder:text-muted-foreground transition-colors',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
