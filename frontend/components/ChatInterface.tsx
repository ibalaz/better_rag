import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material'
import {
  Send as SendIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addMessageToCurrent, setCurrentTyping, clearCurrentConversation } from '../store/slices/conversationSlice'
import { queryDocuments } from '../services/api'

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const { currentConversation } = useAppSelector((state) => state.conversation)
  const { language, category } = useAppSelector((state) => state.app)
  
  const messages = currentConversation.messages
  const isTyping = currentConversation.isTyping

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const userMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user' as const,
      timestamp: new Date(),
    }

    dispatch(addMessageToCurrent(userMessage))
    dispatch(setCurrentTyping(true))
    setInput('')

    try {
      const response = await queryDocuments(input.trim(), language, category)
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'assistant' as const,
        timestamp: new Date(),
        sources: response.sources,
      }
      dispatch(addMessageToCurrent(assistantMessage))
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Došlo je do greške pri obradi vašeg upita. Molimo pokušajte ponovo.',
        sender: 'assistant' as const,
        timestamp: new Date(),
      }
      dispatch(addMessageToCurrent(errorMessage))
    } finally {
      dispatch(setCurrentTyping(false))
    }
  }

  const handleClear = () => {
    dispatch(clearCurrentConversation())
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {language === 'hr' ? 'Razgovor s dokumentima' : 'Chat with Documents'}
        </Typography>
        <IconButton 
          onClick={handleClear} 
          color="secondary"
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <ClearIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        mb: 3,
        pr: 1,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
        },
      }}>
        {messages.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            mt: 8,
            p: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 2,
            border: '1px dashed rgba(255, 255, 255, 0.2)'
          }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {language === 'hr' ? '👋 Dobrodošli!' : '👋 Welcome!'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {language === 'hr' 
                ? 'Postavite pitanje o vašim dokumentima...' 
                : 'Ask a question about your documents...'}
            </Typography>
          </Box>
        )}

        {messages.map((message) => (
          <Box key={message.id} sx={{ mb: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                backgroundColor: message.sender === 'user' 
                  ? 'rgba(25, 118, 210, 0.1)' 
                  : 'background.paper',
                border: message.sender === 'user' 
                  ? '1px solid rgba(144, 202, 249, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                ml: message.sender === 'user' ? 6 : 0,
                mr: message.sender === 'assistant' ? 6 : 0,
                borderRadius: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ 
                  backgroundColor: message.sender === 'user' ? 'primary.light' : 'secondary.main',
                  borderRadius: '50%',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {message.sender === 'user' ? 
                    <PersonIcon sx={{ color: 'white', fontSize: 20 }} /> : 
                    <BotIcon sx={{ color: 'white', fontSize: 20 }} />
                  }
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ '& p': { margin: 0, lineHeight: 1.6 } }}>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        ))}

        {isTyping && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            ml: 2,
            p: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 2,
            mr: 6
          }}>
            <Box sx={{ 
              backgroundColor: 'secondary.main',
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BotIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <CircularProgress size={20} color="secondary" />
            <Typography variant="body2" color="text.secondary">
              {language === 'hr' ? 'Tipkam...' : 'Typing...'}
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          display: 'flex', 
          gap: 2,
          p: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder={language === 'hr' ? 'Postavite pitanje...' : 'Ask a question...'}
          disabled={isTyping}
          multiline
          maxRows={4}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!input.trim() || isTyping}
          sx={{ 
            minWidth: 'auto', 
            px: 3,
            alignSelf: 'stretch'
          }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Box>
  )
}

export default ChatInterface