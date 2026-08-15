// External
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ComponentPropsWithRef, JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

/**
 * An edge-anchored dialog — the drawer the small-screen header opens.
 *
 * Built on the SAME Radix Dialog primitive as Dialog.tsx rather than hand-rolled, because
 * everything a nav drawer must get right is exactly what that primitive already does: focus trap,
 * Escape, `aria-modal`, scroll lock on the body behind it, and inert background content. Only the
 * geometry differs — Dialog.tsx centres a card, this pins a full-height panel to an edge — so the
 * two are separate wrappers over one primitive instead of one wrapper with a mode flag.
 *
 * The panel is `h-dvh`, not `h-svh` or `h-full`: on Android Chrome the address bar collapses on
 * scroll, and dvh is the unit that tracks that, so the drawer never ends up shorter than the
 * viewport it covers.
 */
export function Sheet(props: ComponentProps<typeof DialogPrimitive.Root>): JSX.Element {
  return <DialogPrimitive.Root {...props} />
}

export function SheetTrigger(props: ComponentPropsWithRef<typeof DialogPrimitive.Trigger>): JSX.Element {
  return <DialogPrimitive.Trigger {...props} />
}

export function SheetClose(props: ComponentPropsWithRef<typeof DialogPrimitive.Close>): JSX.Element {
  return <DialogPrimitive.Close {...props} />
}

export function SheetTitle({ className, ...props }: ComponentPropsWithRef<typeof DialogPrimitive.Title>): JSX.Element {
  return <DialogPrimitive.Title className={cn('font-display text-lg font-bold tracking-wide', className)} {...props} />
}

export function SheetDescription({ className, ...props }: ComponentPropsWithRef<typeof DialogPrimitive.Description>): JSX.Element {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function SheetContent({ className, children, ...props }: ComponentPropsWithRef<typeof DialogPrimitive.Content>): JSX.Element {
  // Same reasoning as DialogContent: ui primitives stay i18n-free except for the close button's
  // accessible name, which would otherwise hard-code English into every sheet.
  const { t } = useTranslation()

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in motion-reduce:animate-none" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(21rem,88vw)] flex-col overflow-y-auto overscroll-contain',
          'border-l bg-card text-card-foreground shadow-2xl',
          'data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            // A 40px hit area on a control that lives under a thumb — the icon stays 16px.
            'absolute right-3 top-3 grid size-10 place-items-center rounded-md text-muted-foreground transition-colors',
            'hover:bg-muted hover:text-foreground cursor-pointer',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none',
          )}
        >
          <X className="size-5" aria-hidden />
          <span className="sr-only">{t('common.close')}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
