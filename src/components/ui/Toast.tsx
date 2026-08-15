// External
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

// Components
import { TOAST_DURATION_MS, TOAST_ERROR_DURATION_MS, TOAST_EXIT_MS, TOAST_LIMIT, ToastContext } from './ToastContext'
import type { ToastOptions, ToastRecord, ToastVariant } from './ToastContext'

/**
 * WHY HAND-ROLLED INSTEAD OF @radix-ui/react-toast
 *
 * Radix Toast is a fine primitive, but every requirement here cuts against its grain:
 * its Root hard-codes role="status" and derives aria-live from `type`, so the "role=alert for
 * errors" rule would mean fighting the library; it owns its own swipe/hotkey (F8) model we do not
 * want; and it has no notion of a visible cap with the oldest dropping. What we actually need —
 * a portal, a list, timers, and an exit animation — is ~120 lines against React's own API, with
 * no new dependency and no version to pin. Radix stays where it earns its keep (Dialog, Select),
 * which already handle focus trapping and typeahead we would never hand-roll.
 *
 * ACCESSIBILITY MODEL: the viewport is a persistent, always-mounted landmark (`role="region"`),
 * and each toast is its own live region — role="status"/aria-live="polite" for success and info,
 * role="alert"/aria-live="assertive" for errors, so an error interrupts and a success does not.
 * aria-atomic keeps the message from being read word-by-word as the node mounts.
 */

/**
 * Per-variant token pairs; both halves of each pair are AA-verified in all nine themes.
 *
 * These use the DEDICATED status tokens (--success / --info, added alongside --destructive for
 * this system), not primary/accent. Borrowing decorative tokens looked tempting and was wrong:
 * firered's primary is red, so "success" would have been indistinguishable from "error", and
 * sapphire's accent is Kyogre crimson, so "info" rendered as a red alert. Status has to mean the
 * same thing in every theme even when the theme's own palette says otherwise.
 */
const VARIANT_STYLES: Record<ToastVariant, { bar: string; chip: string }> = {
  success: { bar: 'bg-success', chip: 'bg-success text-success-foreground' },
  error: { bar: 'bg-destructive', chip: 'bg-destructive text-destructive-foreground' },
  info: { bar: 'bg-info', chip: 'bg-info text-info-foreground' },
}

const VARIANT_ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

interface ToastCardProps {
  toast: ToastRecord
  onDismiss: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
}

function ToastCard({ toast, onDismiss, onPause, onResume }: ToastCardProps): JSX.Element {
  const { t } = useTranslation()
  const Icon = VARIANT_ICONS[toast.variant]
  const isError = toast.variant === 'error'
  const styles = VARIANT_STYLES[toast.variant]

  return (
    <li
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      // Hovering or tabbing into a toast freezes its countdown — a message must never expire
      // while the user is reading it or reaching for its close button.
      onPointerEnter={(): void => onPause(toast.id)}
      onPointerLeave={(): void => onResume(toast.id)}
      onFocusCapture={(): void => onPause(toast.id)}
      onBlurCapture={(): void => onResume(toast.id)}
      onKeyDown={(event): void => {
        if (event.key === 'Escape') onDismiss(toast.id)
      }}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-card py-3 pl-5 pr-2 text-card-foreground shadow-lg',
        toast.isLeaving ? 'animate-toast-out' : 'animate-toast-in',
        'motion-reduce:animate-none',
      )}
    >
      {/* An INSET pill, not a full-bleed edge bar: --radius swings from 0.125rem (diamond) to
          1rem (pearl), and an edge bar gets eaten by the corner rounding at the round end. */}
      <span aria-hidden className={cn('absolute inset-y-2 left-2 w-1 rounded-full', styles.bar)} />
      <span aria-hidden className={cn('mt-px grid size-6 shrink-0 place-items-center rounded-full', styles.chip)}>
        <Icon className="size-3.5" />
      </span>
      <p className="m-0 flex-1 pt-0.5 text-sm leading-snug">{toast.message}</p>
      <button
        type="button"
        aria-label={t('common.dismiss')}
        onClick={(): void => onDismiss(toast.id)}
        className={cn(
          // The dismiss is the only control on a toast and it is aimed at with a thumb — a 24px
          // icon-and-padding box was the smallest target in the app. 40px below lg, unchanged above.
          'grid size-10 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors',
          'hover:bg-muted hover:text-foreground lg:size-7',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        )}
      >
        <X className="size-4" aria-hidden />
      </button>
    </li>
  )
}

interface TimerState {
  timeoutId: number
  startedAt: number
  remainingMs: number
}

/**
 * App-wide toast host. Mount ONCE, above the router (see main.tsx); read it with `useToast`.
 * Toasts render through a portal on document.body so no page-level stacking context or
 * `overflow: hidden` can clip them, and they sit above dialogs (z-60 vs the dialog's z-50).
 */
export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timersRef = useRef<Map<string, TimerState>>(new Map())
  const exitTimersRef = useRef<Set<number>>(new Set())
  const idRef = useRef(0)

  const dismissToast = useCallback((id: string): void => {
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer.timeoutId)
      timersRef.current.delete(id)
    }
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, isLeaving: true } : toast)))
    // Unmount only after the exit animation has played. Under prefers-reduced-motion the toast
    // simply sits still for that beat, which is imperceptible.
    const exitTimeoutId = window.setTimeout(() => {
      exitTimersRef.current.delete(exitTimeoutId)
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, TOAST_EXIT_MS)
    exitTimersRef.current.add(exitTimeoutId)
  }, [])

  const startTimer = useCallback((id: string, ms: number): void => {
    const timeoutId = window.setTimeout(() => dismissToast(id), ms)
    timersRef.current.set(id, { timeoutId, startedAt: Date.now(), remainingMs: ms })
  }, [dismissToast])

  const pauseTimer = useCallback((id: string): void => {
    const timer = timersRef.current.get(id)
    if (timer === undefined) return
    window.clearTimeout(timer.timeoutId)
    timersRef.current.set(id, { ...timer, remainingMs: Math.max(0, timer.remainingMs - (Date.now() - timer.startedAt)) })
  }, [])

  const resumeTimer = useCallback((id: string): void => {
    const timer = timersRef.current.get(id)
    if (timer === undefined) return
    startTimer(id, timer.remainingMs)
  }, [startTimer])

  const showToast = useCallback((options: ToastOptions): string => {
    const variant = options.variant ?? 'info'
    const durationMs = options.durationMs ?? (variant === 'error' ? TOAST_ERROR_DURATION_MS : TOAST_DURATION_MS)
    idRef.current += 1
    const id = `toast-${idRef.current}`
    // Newest goes last so it renders nearest the bottom-left corner; past the cap the OLDEST
    // (top of the stack) is dropped, because a fresh message is always the more relevant one.
    setToasts((current) => [...current, { id, message: options.message, variant, durationMs, isLeaving: false }].slice(-TOAST_LIMIT))
    startTimer(id, durationMs)
    return id
  }, [startTimer])

  // Reconcile timers against what is actually on screen: a toast dropped by the cap never runs
  // its own dismiss path, so without this its timeout would outlive it.
  useEffect(() => {
    const liveIds = new Set(toasts.map((toast) => toast.id))
    timersRef.current.forEach((timer, id) => {
      if (liveIds.has(id)) return
      window.clearTimeout(timer.timeoutId)
      timersRef.current.delete(id)
    })
  }, [toasts])

  useEffect(() => {
    const timers = timersRef.current
    const exitTimers = exitTimersRef.current
    return (): void => {
      timers.forEach((timer) => window.clearTimeout(timer.timeoutId))
      timers.clear()
      exitTimers.forEach((timeoutId) => window.clearTimeout(timeoutId))
      exitTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <ol
          role="region"
          aria-label={t('toast.regionLabel')}
          // pointer-events-none on the column keeps the page clickable around the toasts;
          // each card turns them back on for itself.
          className="pointer-events-none fixed bottom-0 left-0 z-60 m-0 flex w-full max-w-sm list-none flex-col justify-end gap-2 p-4"
        >
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} onPause={pauseTimer} onResume={resumeTimer} />
          ))}
        </ol>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
