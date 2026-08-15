// External
import { createContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastOptions {
  /** Already-translated text. The toast layer never calls t() on caller content. */
  message: string
  /** Defaults to 'info'. */
  variant?: ToastVariant
  /** Overrides the variant default (see TOAST_DURATION_MS / TOAST_ERROR_DURATION_MS). */
  durationMs?: number
}

export interface ToastRecord {
  id: string
  message: string
  variant: ToastVariant
  durationMs: number
  /** True from the moment it is dismissed until the exit animation finishes and it unmounts. */
  isLeaving: boolean
}

export interface ToastContextValue {
  /** Queues a toast and returns its id (so a caller can dismiss it early). */
  showToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/** Beyond this many, the oldest is dropped — a stack taller than this covers the page it describes. */
export const TOAST_LIMIT = 4

export const TOAST_DURATION_MS = 5000

/** Errors linger: they carry a message the user may need to read twice. */
export const TOAST_ERROR_DURATION_MS = 7000

/** Must stay >= the toast-out keyframe duration in index.css, or toasts vanish mid-animation. */
export const TOAST_EXIT_MS = 180
