/**
 * Order-quantity bounds, kept out of QuantityStepper.tsx because a .tsx file that exports anything
 * other than components loses Fast Refresh (and the lint rule that guards it).
 *
 * 1..99 is the backend's own validated range — POST /api/economy/shop/buy answers 400 outside it —
 * so the stepper clamps rather than letting the server reject a click the UI allowed.
 */
export const MIN_QUANTITY = 1
export const MAX_QUANTITY = 99

/** Every path into the stepper (typing, arrow keys, the −/+ buttons) is normalised through this. */
export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_QUANTITY
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(value)))
}
