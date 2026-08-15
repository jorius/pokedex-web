// External
import type { TFunction } from 'i18next'

// Store
import type { ApiErrorShape } from '../store/Api'

/**
 * RTK Query's `FetchBaseQueryError.status` is a number for HTTP responses and one of a small
 * set of string codes (FETCH_ERROR, PARSING_ERROR, TIMEOUT_ERROR, CUSTOM_ERROR) when the
 * request never reached the server — a string status therefore means a network failure, not
 * an application error the backend reported via `msg`.
 */
export function resolveApiErrorMessage(error: ApiErrorShape, t: TFunction): string {
  if (typeof error.status === 'string') return t('common.error.network')
  return error.msg ?? t('common.error.generic')
}
