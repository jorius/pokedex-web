// External
import type { JSX, ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

// Store
import { useAppSelector } from '../../store/Hooks'

interface RequireAuthProps {
  children: ReactNode
}

/** Route guard: unauthenticated visitors are bounced to /login, which reads `state.from` to
 * return them to the page they wanted once they sign in. */
export function RequireAuth({ children }: RequireAuthProps): JSX.Element {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
