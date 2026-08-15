// External
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useToast } from './UseToast'

// Components
import { SAFETY_NET_BALL_GRANT } from '../components/economy/EconomyRewards'

/**
 * Announces the anti-softlock grant — a trainer with no credits and no balls is handed five Poké
 * Balls automatically — exactly once.
 *
 * `safetyNetGranted` is an EVENT that happens to arrive on a query result, not a state to render:
 * the server sets it true only on the read that actually handed the balls over, and every read
 * after that reports false. The catch is that the granting response then SITS IN THE RTK QUERY
 * CACHE, so a hook that simply reacted to the value being true would re-announce the grant on any
 * re-render, and again on every remount for as long as that response stayed cached.
 *
 * Firing on the false -> true transition instead makes both cases silent, and costs one ref.
 */
export function useSafetyNetToast(wasGranted: boolean | undefined): void {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const previousRef = useRef<boolean>(false)

  useEffect(() => {
    const isGranted = wasGranted === true
    const hasJustBeenGranted = isGranted && !previousRef.current
    previousRef.current = isGranted
    if (!hasJustBeenGranted) return

    showToast({ message: t('economy.safetyNet', { count: SAFETY_NET_BALL_GRANT }), variant: 'info' })
  }, [wasGranted, showToast, t])
}
