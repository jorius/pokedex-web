// External
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

// Hooks
import { useDocumentTitle } from '../hooks/UseDocumentTitle'

// Components
import { useGetWalletQuery } from '../components/economy/EconomyApi'
import { SlotMachine } from '../components/economy/SlotMachine'
import { SpinHistoryList } from '../components/economy/SpinHistoryList'

/**
 * The Game Corner. One cabinet, one ledger.
 *
 * The wallet is read here and pushed down rather than queried inside the machine: the balance
 * decides whether the SPIN button is live, and the machine needs to control the exact moment that
 * number changes on screen (see SlotMachine — it pins the meter for the length of a spin).
 */
export function SlotsPage(): JSX.Element {
  const { t } = useTranslation()
  const { data: wallet } = useGetWalletQuery()

  useDocumentTitle(`${t('common.appName')} — ${t('slots.title')}`)

  return (
    // One narrow column, cabinet-width: a slot machine stretched across 1150px of desktop stops
    // looking like a machine, and the ledger under it belongs to the same object.
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-wide">{t('slots.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('slots.subtitle')}</p>
      </div>

      {/* A wallet that has not landed yet reads as zero credits, which parks the machine with its
          "top up at the shop" hint until the real balance arrives — never a live SPIN it cannot pay for. */}
      <SlotMachine credits={wallet?.credits ?? 0} />

      <SpinHistoryList />
    </div>
  )
}
