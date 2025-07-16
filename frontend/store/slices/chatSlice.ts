import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
  sources?: Array<{
    document_id: string
    filename: string
    chunk_index: number
    similarity: number
  }>
}

interface ChatState {
  messages: Message[]
  isTyping: boolean
  currentQuery: string
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  currentQuery: '',
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload
    },
    setCurrentQuery: (state, action: PayloadAction<string>) => {
      state.currentQuery = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
    updateLastMessage: (state, action: PayloadAction<Partial<Message>>) => {
      if (state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1]
        Object.assign(lastMessage, action.payload)
      }
    },
  },
})

export const {
  addMessage,
  setIsTyping,
  setCurrentQuery,
  clearMessages,
  updateLastMessage,
} = chatSlice.actions

export default chatSlice.reducer