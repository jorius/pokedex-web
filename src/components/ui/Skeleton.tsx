// External
import type { ComponentPropsWithRef, JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

export function Skeleton({ className, ...props }: ComponentPropsWithRef<'div'>): JSX.Element {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}
