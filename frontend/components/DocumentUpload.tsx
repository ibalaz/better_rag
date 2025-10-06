import React, { useState, useEffect } from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  LinearProgress,
  Alert,
} from '@mui/material'
import { CloudUpload as UploadIcon } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setUploading, setError, addDocument } from '../store/slices/documentsSlice'
import { uploadDocument, fetchCategories } from '../services/api'

const DocumentUpload: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('CC_AI')
  const [selectedLanguage, setSelectedLanguage] = useState('hr')
  const [categories, setCategories] = useState<any[]>([])
  const dispatch = useAppDispatch()
  const { uploading, error } = useAppSelector((state) => state.documents)
  const { language } = useAppSelector((state) => state.app)
  
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories()
      setCategories(cats)
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].name)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    dispatch(setUploading(true))
    dispatch(setError(null))

    try {
      const result = await uploadDocument(file, selectedCategory, selectedLanguage)
      
      // Add document to store (you might want to fetch the full document details)
      dispatch(addDocument({
        id: result.document_id,
        filename: file.name,
        category: selectedCategory,
        language: selectedLanguage,
        upload_date: new Date().toISOString(),
        file_size: file.size,
      }))

      // Show success message
      console.log('Document uploaded successfully:', result)
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Upload failed'))
    } finally {
      dispatch(setUploading(false))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {language === 'hr' ? 'Učitaj dokument' : 'Upload Document'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="category-select-label">
            {language === 'hr' ? 'Kategorija' : 'Category'}
          </InputLabel>
          <Select
            labelId="category-select-label"
            value={selectedCategory}
            label={language === 'hr' ? 'Kategorija' : 'Category'}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={uploading}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.name}>
                {language === 'hr' ? category.name_hr : category.name_en}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="language-select-label">
            {language === 'hr' ? 'Jezik dokumenta' : 'Document Language'}
          </InputLabel>
          <Select
            labelId="language-select-label"
            value={selectedLanguage}
            label={language === 'hr' ? 'Jezik dokumenta' : 'Document Language'}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={uploading}
          >
            <MenuItem value="hr">Hrvatski</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'transparent',
          '&:hover': {
            backgroundColor: uploading ? 'transparent' : 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
        <Typography variant="body1" sx={{ mb: 1 }}>
          {isDragActive
            ? language === 'hr' 
              ? 'Ispustite datoteku ovdje...' 
              : 'Drop the file here...'
            : language === 'hr'
              ? 'Povucite i ispustite datoteku ili kliknite za odabir'
              : 'Drag and drop a file or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {language === 'hr' 
            ? 'Podržani formati: PDF, DOCX, TXT, MD' 
            : 'Supported formats: PDF, DOCX, TXT, MD'}
        </Typography>
      </Box>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            {language === 'hr' ? 'Učitavanje...' : 'Uploading...'}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default DocumentUpload