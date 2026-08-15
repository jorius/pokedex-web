// Store
import { api } from '../../store/Api'

/**
 * The economy hooks, pulled off the api object instead of imported from `src/store/Api`'s named
 * exports. RTK Query's react entry point hangs a generated hook on the api for every endpoint, so
 * these are the SAME hooks the store would export — this module only gives them an import site.
 *
 * Why here and not in the store: the economy endpoints landed in Api.ts without their hooks in the
 * bottom export block, and that file is being edited concurrently by the capture work. Re-exporting
 * from a file this feature owns keeps the two streams off each other's lines. Fold these back into
 * Api.ts's export block whenever it is safe to touch it — nothing else has to change.
 */
export const {
  useGetCatalogueQuery,
  useGetWalletQuery,
  useBuyBallsMutation,
  useSpinSlotsMutation,
  useGetSpinHistoryQuery,
} = api
