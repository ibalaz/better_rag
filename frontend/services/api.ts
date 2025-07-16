import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      // Redirect to login if needed
    }
    return Promise.reject(error)
  }
)

// Document API
export const fetchDocuments = async () => {
  const response = await api.get('/documents')
  return response.data
}

export const uploadDocument = async (file: File, category: string, language: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  formData.append('language', language)

  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const deleteDocument = async (documentId: string) => {
  const response = await api.delete(`/documents/${documentId}`)
  return response.data
}

export const refreshDocuments = async () => {
  const response = await api.post('/documents/refresh')
  return response.data
}

// Query API
export const queryDocuments = async (query: string, language: string, category?: string | null) => {
  const formData = new FormData()
  formData.append('query', query)
  formData.append('language', language)
  if (category) {
    formData.append('category', category)
  }

  const response = await api.post('/query', formData)
  return response.data
}

export const getQueryHistory = async () => {
  const response = await api.get('/query/history')
  return response.data
}

export const submitFeedback = async (queryId: string, score: number) => {
  const formData = new FormData()
  formData.append('query_id', queryId)
  formData.append('score', score.toString())

  const response = await api.post('/query/feedback', formData)
  return response.data
}

// Categories API
export const fetchCategories = async () => {
  const response = await api.get('/categories')
  return response.data
}

export const createCategory = async (name: string, nameHr: string, nameEn: string, description: string) => {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('name_hr', nameHr)
  formData.append('name_en', nameEn)
  formData.append('description', description)

  const response = await api.post('/categories', formData)
  return response.data
}

export const getCategoryGraph = async (categoryId: string) => {
  const response = await api.get(`/categories/${categoryId}/graph`)
  return response.data
}

export default api