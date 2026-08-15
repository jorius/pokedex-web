// External
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { ComponentProps, ComponentPropsWithRef, JSX } from 'react'

// Lib
import { cn } from '../../lib/Cn'

export function Select(props: ComponentProps<typeof SelectPrimitive.Root>): JSX.Element {
  return <SelectPrimitive.Root {...props} />
}

export function SelectGroup(props: ComponentPropsWithRef<typeof SelectPrimitive.Group>): JSX.Element {
  return <SelectPrimitive.Group {...props} />
}

export function SelectValue({ className, ...props }: ComponentPropsWithRef<typeof SelectPrimitive.Value>): JSX.Element {
  // min-w-0 lets the value shrink inside its flex row so truncate can ellipsize instead of
  // pushing the trigger (or the whole header row) wider when a locale has longer labels.
  return <SelectPrimitive.Value className={cn('min-w-0 truncate', className)} {...props} />
}

interface SelectTriggerProps extends ComponentPropsWithRef<typeof SelectPrimitive.Trigger> {
  /**
   * Set false for an icon-only trigger, where the caret would crowd out the icon it sits beside.
   * The trigger still announces itself as a combobox, so the affordance is not carried by the
   * caret alone — only its picture is dropped.
   */
  showChevron?: boolean
}

export function SelectTrigger({ className, children, showChevron = true, ...props }: SelectTriggerProps): JSX.Element {
  // Deliberately NO `[&>span]:line-clamp-1` here: line-clamp forces `display: -webkit-box`
  // onto every direct span child with higher specificity than `.flex`, which silently broke the
  // switchers' icon+label rows (icon stacked above the text). Overflow is handled by
  // SelectValue's own `truncate` instead.
  return (
    <SelectPrimitive.Trigger
      className={cn(
        // 40px below xl for touch, back to the desktop h-9 from xl up — same contract as Button.
        'flex h-10 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm xl:h-9',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-colors',
        className,
      )}
      {...props}
    >
      {children}
      {showChevron && (
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ className, children, position = 'popper', ...props }: ComponentPropsWithRef<typeof SelectPrimitive.Content>): JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-card text-card-foreground shadow-md',
          position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
          <ChevronUp className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport
          className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
          <ChevronDown className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectLabel({ className, ...props }: ComponentPropsWithRef<typeof SelectPrimitive.Label>): JSX.Element {
  return <SelectPrimitive.Label className={cn('px-2 py-1.5 text-xs font-bold text-muted-foreground', className)} {...props} />
}

export function SelectItem({ className, children, ...props }: ComponentPropsWithRef<typeof SelectPrimitive.Item>): JSX.Element {
  return (
    <SelectPrimitive.Item
      className={cn(
        // Roomier rows below xl: the theme list is nine entries deep and is scrolled and tapped
        // with a thumb on a phone.
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2.5 pl-2 pr-8 text-sm outline-none xl:py-1.5',
        'focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export function SelectSeparator({ className, ...props }: ComponentPropsWithRef<typeof SelectPrimitive.Separator>): JSX.Element {
  return <SelectPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}
