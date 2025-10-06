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
    content: string
  }>
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ConversationState {
  conversations: Conversation[]
  activeConversationId: string | null
  currentConversation: {
    messages: Message[]
    isTyping: boolean
  }
}

const initialState: ConversationState = {
  conversations: [
    {
      id: '1',
      title: 'AI i bankarstvo',
      messages: [
        {
          id: '1-1',
          text: 'Kako mogu otvoriti račun u banci?',
          sender: 'user',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: '1-2',
          text: 'Za otvaranje računa u banci potrebno je...',
          sender: 'assistant',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
          sources: []
        }
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000)
    },
    {
      id: '2',
      title: 'GDPR regulativa',
      messages: [
        {
          id: '2-1',
          text: 'Što je GDPR?',
          sender: 'user',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          id: '2-2',
          text: 'GDPR (General Data Protection Regulation) je...',
          sender: 'assistant',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45000),
          sources: []
        }
      ],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45000)
    }
  ],
  activeConversationId: null,
  currentConversation: {
    messages: [],
    isTyping: false
  }
}

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    // Current conversation actions
    addMessageToCurrent: (state, action: PayloadAction<Message>) => {
      state.currentConversation.messages.push(action.payload)
    },
    setCurrentTyping: (state, action: PayloadAction<boolean>) => {
      state.currentConversation.isTyping = action.payload
    },
    clearCurrentConversation: (state) => {
      state.currentConversation.messages = []
      state.currentConversation.isTyping = false
    },
    
    // Conversation management actions
    createNewConversation: (state, action: PayloadAction<{ title: string }>) => {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: action.payload.title,
        messages: [...state.currentConversation.messages],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      state.conversations.unshift(newConversation)
      state.activeConversationId = newConversation.id
      state.currentConversation.messages = []
    },
    
    loadConversation: (state, action: PayloadAction<string>) => {
      const conversation = state.conversations.find(c => c.id === action.payload)
      if (conversation) {
        state.activeConversationId = action.payload
        state.currentConversation.messages = [...conversation.messages]
      }
    },
    
    saveCurrentConversation: (state, action: PayloadAction<{ title?: string }>) => {
      if (state.activeConversationId) {
        const conversation = state.conversations.find(c => c.id === state.activeConversationId)
        if (conversation) {
          conversation.messages = [...state.currentConversation.messages]
          conversation.updatedAt = new Date()
          if (action.payload.title) {
            conversation.title = action.payload.title
          }
        }
      }
    },
    
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload)
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = null
        state.currentConversation.messages = []
      }
    },
    
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload
    },
    
    updateConversationTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.id)
      if (conversation) {
        conversation.title = action.payload.title
        conversation.updatedAt = new Date()
      }
    }
  },
})

export const {
  addMessageToCurrent,
  setCurrentTyping,
  clearCurrentConversation,
  createNewConversation,
  loadConversation,
  saveCurrentConversation,
  deleteConversation,
  setActiveConversation,
  updateConversationTitle,
} = conversationSlice.actions

export default conversationSlice.reducer