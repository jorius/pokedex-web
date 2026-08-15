// External
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithRef, JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold cursor-pointer',
    'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/85',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85',
        outline: 'border border-border bg-transparent text-foreground shadow-sm hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/85',
        destructiveGhost: 'text-destructive hover:bg-destructive/10',
      },
      /**
       * TOUCH FIRST, DESKTOP AT `lg`. Every size is one step taller below 1024px and drops to its
       * original desktop height from `lg` up, so a phone and a tablet get targets a thumb can
       * actually hit while the 1440 layout is byte-for-byte what it was. `lg` (not a
       * `pointer: coarse` query) is the breakpoint because it is deterministic: a touchscreen
       * laptop or a desktop browser in device-emulation would otherwise silently pick a different
       * geometry than the one these layouts were measured against.
       *
       * `icon` matters most: size-9 is 36px, and it is what the pagination arrows, the search
       * clear button and the shop's +/- steppers are built from — the smallest controls in the app.
       */
      size: {
        // `sm` reaches the full 40px below lg rather than stopping at 36: it is what the
        // collection's Edit/Delete, the detail Back and the browse-mode segments are built from,
        // and those are primary actions on their own surfaces. Below lg the sizes are told apart
        // by padding and text size instead of height; above lg they are exactly as they were.
        sm: 'h-10 px-3 text-xs lg:h-8',
        default: 'h-10 px-4 lg:h-9',
        lg: 'h-11 px-6 lg:h-10',
        icon: 'size-10 lg:size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps extends ComponentPropsWithRef<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps): JSX.Element {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} type={asChild ? type : (type ?? 'button')} {...props} />
}
