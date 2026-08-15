// External
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ComponentPropsWithRef, JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

export function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>): JSX.Element {
  return <DialogPrimitive.Root {...props} />
}

export function DialogTrigger(props: ComponentPropsWithRef<typeof DialogPrimitive.Trigger>): JSX.Element {
  return <DialogPrimitive.Trigger {...props} />
}

export function DialogPortal(props: ComponentProps<typeof DialogPrimitive.Portal>): JSX.Element {
  return <DialogPrimitive.Portal {...props} />
}

export function DialogClose(props: ComponentPropsWithRef<typeof DialogPrimitive.Close>): JSX.Element {
  return <DialogPrimitive.Close {...props} />
}

export function DialogOverlay({ className, ...props }: ComponentPropsWithRef<typeof DialogPrimitive.Overlay>): JSX.Element {
  return (
    <DialogPrimitive.Overlay
      className={cn('fixed inset-0 z-50 bg-overlay', className)}
      {...props}
    />
  )
}

export function DialogContent({ className, children, ...props }: ComponentPropsWithRef<typeof DialogPrimitive.Content>): JSX.Element {
  // ui primitives normally stay i18n-free, but the close button's accessible name lives
  // here and must be translated — a hard-coded English string would leak into every dialog.
  const { t } = useTranslation()
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-card p-6 text-card-foreground shadow-lg rounded-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4 rounded-sm opacity-60 transition-opacity hover:opacity-100 cursor-pointer',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none',
          )}
        >
          <X className="size-4" />
          <span className="sr-only">{t('common.close')}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function DialogHeader({ className, ...props }: ComponentPropsWithRef<'div'>): JSX.Element {
  return <div className={cn('flex flex-col gap-1.5 text-center sm:text-left', className)} {...props} />
}

export function DialogFooter({ className, ...props }: ComponentPropsWithRef<'div'>): JSX.Element {
  return <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

export function DialogTitle({ className, ...props }: ComponentPropsWithRef<typeof DialogPrimitive.Title>): JSX.Element {
  return <DialogPrimitive.Title className={cn('text-lg font-bold leading-none tracking-tight', className)} {...props} />
}

export function DialogDescription({ className, ...props }: ComponentPropsWithRef<typeof DialogPrimitive.Description>): JSX.Element {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}
