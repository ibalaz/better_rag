import { configureStore } from '@reduxjs/toolkit'
import appSlice from './slices/appSlice'
import chatSlice from './slices/chatSlice'
import documentsSlice from './slices/documentsSlice'

export const store = configureStore({
  reducer: {
    app: appSlice,
    chat: chatSlice,
    documents: documentsSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch