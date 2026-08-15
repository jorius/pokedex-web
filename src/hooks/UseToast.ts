// External
import { useContext } from 'react'

// Components
import { ToastContext } from '../components/ui/ToastContext'
import type { ToastContextValue } from '../components/ui/ToastContext'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
