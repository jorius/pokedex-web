// External
import type { ComponentPropsWithRef, JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

export function Card({ className, ...props }: ComponentPropsWithRef<'div'>): JSX.Element {
  return <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />
}

export function CardHeader({ className, ...props }: ComponentPropsWithRef<'div'>): JSX.Element {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentPropsWithRef<'h3'>): JSX.Element {
  return <h3 className={cn('text-lg font-bold leading-none tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentPropsWithRef<'p'>): JSX.Element {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentPropsWithRef<'div'>): JSX.Element {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentPropsWithRef<'div'>): JSX.Element {
  return <div className={cn('flex items-center gap-2 p-6 pt-0', className)} {...props} />
}
