import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Document {
  id: string
  filename: string
  category: string
  language: string
  upload_date: string
  file_size: number
  last_processed?: string
}

interface DocumentsState {
  documents: Document[]
  categories: string[]
  loading: boolean
  uploading: boolean
  error: string | null
}

const initialState: DocumentsState = {
  documents: [],
  categories: ['CC_AI', 'EU_ACTS', 'general'],
  loading: false,
  uploading: false,
  error: null,
}

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload
    },
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload)
    },
    removeDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload)
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.uploading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const {
  setDocuments,
  addDocument,
  removeDocument,
  setCategories,
  setLoading,
  setUploading,
  setError,
} = documentsSlice.actions

export default documentsSlice.reducer