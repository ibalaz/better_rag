import React, { useEffect } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Delete as DeleteIcon, Description as DocumentIcon } from '@mui/icons-material'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setDocuments, setLoading, setError, removeDocument } from '../store/slices/documentsSlice'
import { fetchDocuments, deleteDocument } from '../services/api'

const DocumentList: React.FC = () => {
  const dispatch = useAppDispatch()
  const { documents, loading, error } = useAppSelector((state) => state.documents)
  const { language } = useAppSelector((state) => state.app)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const docs = await fetchDocuments()
      dispatch(setDocuments(docs))
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to load documents'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm(language === 'hr' ? 'Jeste li sigurni da želite obrisati ovaj dokument?' : 'Are you sure you want to delete this document?')) {
      return
    }

    try {
      await deleteDocument(documentId)
      dispatch(removeDocument(documentId))
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to delete document'))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'hr' ? 'hr-HR' : 'en-US')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {language === 'hr' ? 'Dokumenti' : 'Documents'} ({documents.length})
      </Typography>

      {documents.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
          {language === 'hr' ? 'Nema učitanih dokumenata' : 'No documents uploaded'}
        </Typography>
      ) : (
        <List>
          {documents.map((document) => (
            <ListItem key={document.id} divider>
              <DocumentIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={document.filename}
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip label={document.category} size="small" />
                      <Chip label={document.language.toUpperCase()} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(document.file_size)} • {formatDate(document.upload_date)}
                      {document.last_processed && (
                        <> • {language === 'hr' ? 'Obrađeno' : 'Processed'}</>
                      )}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(document.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}

export default DocumentList