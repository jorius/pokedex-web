// External
import { useEffect } from 'react'

/** Keeps document.title in sync with the active page (browse → "Pokedex", detail → "Pokedex — Name"). */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
  }, [title])
}
