import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  IconButton,
  Divider,
  Chip,
} from '@mui/material'
import {
  Chat as ChatIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material'

import { useAppSelector, useAppDispatch } from '../store/hooks'
import {
  createNewConversation,
  loadConversation,
  deleteConversation,
  setActiveConversation,
} from '../store/slices/conversationSlice'

const ConversationHistory: React.FC = () => {
  const dispatch = useAppDispatch()
  const { language } = useAppSelector((state) => state.app)
  const { conversations, activeConversationId, currentConversation } = useAppSelector((state) => state.conversation)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const formatTimestamp = (timestamp: Date) => {
    // Use static format during SSR to prevent hydration mismatch
    if (!isHydrated) {
      return timestamp.toLocaleDateString(language === 'hr' ? 'hr-HR' : 'en-US')
    }

    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return language === 'hr' ? `${days}d` : `${days}d`
    } else if (hours > 0) {
      return language === 'hr' ? `${hours}h` : `${hours}h`
    } else {
      return language === 'hr' ? 'Sada' : 'Now'
    }
  }

  const handleNewConversation = () => {
    if (currentConversation.messages.length > 0) {
      // Generate title from first user message
      const firstUserMessage = currentConversation.messages.find(m => m.sender === 'user')
      const title = firstUserMessage 
        ? firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '')
        : (language === 'hr' ? 'Novi razgovor' : 'New conversation')
      
      dispatch(createNewConversation({ title }))
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId === 'current') {
      dispatch(setActiveConversation(null))
    } else {
      dispatch(setActiveConversation(conversationId))
      dispatch(loadConversation(conversationId))
    }
  }

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(deleteConversation(conversationId))
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {language === 'hr' ? '💬 Razgovori' : '💬 Conversations'}
        </Typography>
        <IconButton 
          size="small" 
          onClick={handleNewConversation}
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Current Conversation */}
      <Card 
        elevation={2}
        sx={{ 
          mb: 2,
          backgroundColor: activeConversationId === null 
            ? 'rgba(25, 118, 210, 0.15)' 
            : 'rgba(255, 255, 255, 0.05)',
          border: activeConversationId === null
            ? '1px solid rgba(25, 118, 210, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.12)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => handleSelectConversation('current')}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ChatIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
              {language === 'hr' ? 'Trenutni razgovor' : 'Current Chat'}
            </Typography>
            <Chip 
              label={currentConversation.messages.length} 
              size="small" 
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'text.secondary',
                fontSize: '0.7rem'
              }} 
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {currentConversation.messages.length > 0 
              ? currentConversation.messages[currentConversation.messages.length - 1]?.text.substring(0, 50) + '...'
              : (language === 'hr' ? 'Započnite razgovor...' : 'Start a conversation...')
            }
          </Typography>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Conversation History */}
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
        {language === 'hr' ? 'Povijest' : 'History'}
      </Typography>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ p: 0 }}>
          {conversations.map((conversation) => (
            <ListItem 
              key={conversation.id} 
              sx={{ px: 0, py: 1 }}
            >
              <Card 
                elevation={1}
                sx={{ 
                  width: '100%',
                  backgroundColor: activeConversationId === conversation.id 
                    ? 'rgba(25, 118, 210, 0.1)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: activeConversationId === conversation.id
                    ? '1px solid rgba(25, 118, 210, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    transform: 'translateY(-1px)'
                  }
                }}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {conversation.title}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      sx={{ 
                        opacity: 0.6,
                        '&:hover': { opacity: 1, color: 'error.main' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'block', 
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {conversation.messages.length > 0 
                      ? conversation.messages[conversation.messages.length - 1]?.text.substring(0, 40) + '...'
                      : (language === 'hr' ? 'Prazan razgovor' : 'Empty conversation')
                    }
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(conversation.updatedAt)}
                      </Typography>
                    </Box>
                    <Chip 
                      label={conversation.messages.length} 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'text.secondary',
                        fontSize: '0.65rem',
                        height: '18px'
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )
}

export default ConversationHistory