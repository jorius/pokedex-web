// External
import { Loader2, Server } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Lib
import { cn } from '../../lib/Cn'

// Store
import { API_TARGETS, isApiTarget, setApiTarget } from '../../store/ApiTargetSlice'
import { useAppDispatch, useAppSelector } from '../../store/Hooks'
import type { ApiTarget } from '../../store/Types'

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'

const HEALTH_PROBE_PATH = '/api/pokemons?page=1&pageSize=1'
const HEALTH_PROBE_TIMEOUT_MS = 3000
const SWITCHED_DISMISS_MS = 4000

type ProbeState =
  | { status: 'idle' }
  | { status: 'checking'; target: ApiTarget }
  | { status: 'switched'; target: ApiTarget }
  | { status: 'unreachable'; target: ApiTarget }

/**
 * Header control for the three interchangeable backends. Switching dispatches setApiTarget
 * (a store listener resets the RTK Query cache; the session survives — shared auth secrets),
 * then fires a lightweight plain-fetch health probe against the new target so the user
 * immediately learns whether it is actually up. Deliberately NOT an RTK Query endpoint:
 * the probe is throwaway UI feedback and must never enter the query cache it just reset.
 */
export function BackendSwitcher(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const target = useAppSelector((state) => state.apiTarget.target)
  const [probe, setProbe] = useState<ProbeState>({ status: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)
  const dismissTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return (): void => {
      controllerRef.current?.abort()
      controllerRef.current = null
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current)
    }
  }, [])

  async function probeTarget(nextTarget: ApiTarget, baseUrl: string): Promise<void> {
    controllerRef.current?.abort()
    if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current)

    const controller = new AbortController()
    controllerRef.current = controller
    const timeoutId = window.setTimeout(() => { controller.abort() }, HEALTH_PROBE_TIMEOUT_MS)
    setProbe({ status: 'checking', target: nextTarget })

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

    if (reachable) {
      setProbe({ status: 'switched', target: nextTarget })
      dismissTimerRef.current = window.setTimeout(() => { setProbe({ status: 'idle' }) }, SWITCHED_DISMISS_MS)
    } else {
      setProbe({ status: 'unreachable', target: nextTarget })
    }
  }

  function handleTargetChange(value: string): void {
    if (!isApiTarget(value) || value === target) return
    dispatch(setApiTarget(value))
    const baseUrl = API_TARGETS.find((meta) => meta.target === value)?.baseUrl
    if (baseUrl) void probeTarget(value, baseUrl)
  }

  return (
    <div className="relative">
      <Select value={target} onValueChange={handleTargetChange}>
        <SelectTrigger aria-label={t('backend.label')} title={t(`backend.${target}`)} className="w-40">
          <span className="flex min-w-0 items-center gap-2">
            <Server aria-hidden className="size-4 shrink-0 text-muted-foreground" />
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
      {probe.status !== 'idle' && (
        <span
          role={probe.status === 'unreachable' ? 'alert' : 'status'}
          className={cn(
            'absolute right-0 top-full z-30 mt-2 flex w-max max-w-64 items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-sm',
            probe.status === 'unreachable' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {probe.status === 'checking' && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {t(`backend.${probe.status}`, { name: t(`backend.${probe.target}`) })}
        </span>
      )}
    </div>
  )
}
