// External
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

// Store
import { api } from './Api'
import { apiTargetReducer, setApiTarget } from './ApiTargetSlice'
import { authReducer } from './AuthSlice'
import { uiReducer } from './UiSlice'

const listenerMiddleware = createListenerMiddleware()

listenerMiddleware.startListening({
  actionCreator: setApiTarget,
  effect: (_action, listenerApi): void => {
    // Switching the target backend resets cached queries (different data source) but
    // deliberately keeps the auth session — the three services share auth secrets, so an
    // existing token stays valid across targets. Per the plan's binding store design.
    listenerApi.dispatch(api.util.resetApiState())
  },
})

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    apiTarget: apiTargetReducer,
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(api.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
