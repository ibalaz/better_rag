import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  Divider,
} from '@mui/material'
import { Description as DocumentIcon } from '@mui/icons-material'

import { useAppSelector } from '../store/hooks'

const SourcesPanel: React.FC = () => {
  const { currentConversation } = useAppSelector((state) => state.conversation)
  const { language } = useAppSelector((state) => state.app)

  // Get sources from the last assistant message
  const lastAssistantMessage = currentConversation.messages
    .filter(msg => msg.sender === 'assistant')
    .pop()

  const sources = lastAssistantMessage?.sources || []



  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main', fontSize: '1rem' }}>
        {language === 'hr' ? '📚 Izvori' : '📚 Sources'}
      </Typography>

      {sources.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          mt: 2,
          p: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 2,
          border: '1px dashed rgba(255, 255, 255, 0.2)'
        }}>
          <DocumentIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {language === 'hr'
              ? 'Postavite pitanje da vidite izvore'
              : 'Ask a question to see sources'}
          </Typography>

        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List sx={{ p: 0 }}>
            {sources.map((source, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <Card
                    elevation={1}
                    sx={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DocumentIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flexGrow: 1
                          }}
                        >
                          {source.filename}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                        <Chip
                          label={`${Math.round(source.similarity * 100)}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: '20px' }}
                        />
                        <Chip
                          label={`#${source.chunk_index + 1}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.65rem',
                            height: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          }}
                        />
                      </Box>

                      {source.content && (
                        <Box sx={{
                          mt: 1,
                          p: 1.5,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 1,
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          maxHeight: '120px',
                          overflow: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '4px',
                          },
                          '&::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '2px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            borderRadius: '2px',
                          },
                        }}>
                          <Typography variant="caption" sx={{
                            display: 'block',
                            mb: 0.5,
                            fontWeight: 600,
                            color: 'primary.main',
                            fontSize: '0.65rem'
                          }}>
                            {language === 'hr' ? 'Sadržaj:' : 'Content:'}
                          </Typography>
                          <Typography variant="body2" sx={{
                            fontSize: '0.7rem',
                            lineHeight: 1.3,
                            color: 'text.primary'
                          }}>
                            {source.content}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </ListItem>
                {index < sources.length - 1 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Box>
  )
}

export default SourcesPanel