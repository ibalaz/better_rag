import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AppState {
  language: string
  category: string | null
  loading: boolean
  error: string | null
}

const initialState: AppState = {
  language: 'hr',
  category: null,
  loading: false,
  error: null,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload
    },
    setCategory: (state, action: PayloadAction<string | null>) => {
      state.category = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setLanguage, setCategory, setLoading, setError } = appSlice.actions
export default appSlice.reducer