// External
import { useEffect, useState } from 'react'

/**
 * Trailing-edge debounce: returns `value` only after it has stopped changing for `delayMs`.
 * Each new value cancels the pending timer, so a burst of keystrokes settles exactly once —
 * which is what keeps the search field to a single request per pause.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return (): void => {
      window.clearTimeout(timerId)
    }
  }, [value, delayMs])

  return debouncedValue
}
