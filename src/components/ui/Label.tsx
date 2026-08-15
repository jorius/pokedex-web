// External
import * as LabelPrimitive from '@radix-ui/react-label'
import type { ComponentPropsWithRef, JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

export function Label({ className, ...props }: ComponentPropsWithRef<typeof LabelPrimitive.Root>): JSX.Element {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-bold leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50', className)}
      {...props}
    />
  )
}
