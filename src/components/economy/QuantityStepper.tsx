// External
import { Minus, Plus } from 'lucide-react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

// Components
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { MAX_QUANTITY, MIN_QUANTITY, clampQuantity } from './QuantityRules'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  /** Names what is being counted for screen readers — "Quantity of Ultra Ball", not a bare "Quantity". */
  label: string
}

/**
 * −/+ around a typed field. The field is a real number input so buying 25 balls is one keystroke
 * rather than 24 clicks, and every path through it (typing, arrows, the buttons) funnels through
 * `clampQuantity`.
 *
 * An empty field is allowed WHILE typing — clearing it to type "12" would otherwise fight the user
 * by snapping to 1 on the first keystroke — and is normalised on blur.
 */
export function QuantityStepper({ value, onChange, disabled = false, label }: QuantityStepperProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label={t('shop.decrease')}
        disabled={disabled || value <= MIN_QUANTITY}
        onClick={(): void => onChange(clampQuantity(value - 1))}
      >
        <Minus aria-hidden />
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        min={MIN_QUANTITY}
        max={MAX_QUANTITY}
        step={1}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event): void => {
          if (event.target.value === '') return
          onChange(clampQuantity(Number(event.target.value)))
        }}
        onBlur={(event): void => onChange(clampQuantity(Number(event.target.value)))}
        // Native spinners are suppressed: −/+ are already there, and the browser's own arrows
        // appear on hover right where the value is, which reads as a second, competing control.
        className={cn(
          'w-16 text-center font-bold tabular-nums',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        )}
      />
      <Button
        variant="outline"
        size="icon"
        aria-label={t('shop.increase')}
        disabled={disabled || value >= MAX_QUANTITY}
        onClick={(): void => onChange(clampQuantity(value + 1))}
      >
        <Plus aria-hidden />
      </Button>
    </div>
  )
}
