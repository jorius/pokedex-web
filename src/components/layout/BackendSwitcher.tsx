// External
import { Loader2, Server } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useToast } from '../../hooks/UseToast'

// Store
import { API_TARGETS, isApiTarget, setApiTarget } from '../../store/ApiTargetSlice'
import { useAppDispatch, useAppSelector } from '../../store/Hooks'
import type { ApiTarget } from '../../store/Types'

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'

const HEALTH_PROBE_PATH = '/api/pokemons?page=1&pageSize=1'
const HEALTH_PROBE_TIMEOUT_MS = 3000

/**
 * Header control for the three interchangeable backends. Switching dispatches setApiTarget
 * (a store listener resets the RTK Query cache; the session survives — shared auth secrets),
 * then fires a lightweight plain-fetch health probe against the new target so the user
 * immediately learns whether it is actually up. Deliberately NOT an RTK Query endpoint:
 * the probe is throwaway UI feedback and must never enter the query cache it just reset.
 *
 * The probe RESULT is a transient event, so it toasts (B3) instead of the pill this used to
 * render. Only the in-flight state stays local, as a spinner in place of the trigger's icon —
 * a toast that says "checking..." and is immediately replaced by its own outcome is noise.
 */
export function BackendSwitcher(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { showToast } = useToast()
  const target = useAppSelector((state) => state.apiTarget.target)
  const [checkingTarget, setCheckingTarget] = useState<ApiTarget | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return (): void => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [])

  async function probeTarget(nextTarget: ApiTarget, baseUrl: string): Promise<void> {
    controllerRef.current?.abort()

    const controller = new AbortController()
    controllerRef.current = controller
    const timeoutId = window.setTimeout(() => { controller.abort() }, HEALTH_PROBE_TIMEOUT_MS)
    setCheckingTarget(nextTarget)

    let reachable = false
    try {
      const response = await fetch(`${baseUrl}${HEALTH_PROBE_PATH}`, { signal: controller.signal })
      reachable = response.ok
    } catch {
      reachable = false
    } finally {
      window.clearTimeout(timeoutId)
    }

    // A newer switch (or unmount) superseded this probe — its outcome no longer matters.
    if (controllerRef.current !== controller) return

    setCheckingTarget(null)
    const name = t(`backend.${nextTarget}`)
    showToast(
      reachable
        ? { message: t('backend.switched', { name }), variant: 'success' }
        : { message: t('backend.unreachable', { name }), variant: 'error' },
    )
  }

  function handleTargetChange(value: string): void {
    if (!isApiTarget(value) || value === target) return
    dispatch(setApiTarget(value))
    const baseUrl = API_TARGETS.find((meta) => meta.target === value)?.baseUrl
    if (baseUrl) void probeTarget(value, baseUrl)
  }

  return (
    <div>
      <Select value={target} onValueChange={handleTargetChange}>
        <SelectTrigger aria-label={t('backend.label')} title={t(`backend.${target}`)} className="w-40">
          <span className="flex min-w-0 items-center gap-2">
            {checkingTarget !== null ? (
              <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" />
            ) : (
              <Server aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            )}
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent align="end">
          {API_TARGETS.map((meta) => (
            <SelectItem key={meta.target} value={meta.target}>
              {t(`backend.${meta.target}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* The spinner is decorative; the in-flight state still has to reach a screen reader. The
          region is always mounted (an empty one) — a live region that appears WITH its text is
          unreliably announced. */}
      <span role="status" className="sr-only">
        {checkingTarget !== null ? t('backend.checking', { name: t(`backend.${checkingTarget}`) }) : ''}
      </span>
    </div>
  )
}
