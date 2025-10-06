import { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Description as DocumentIcon,
} from '@mui/icons-material'

import ChatInterface from '../components/ChatInterface'
import DocumentUpload from '../components/DocumentUpload'
import DocumentList from '../components/DocumentList'
import SourcesPanel from '../components/SourcesPanel'
import ConversationHistory from '../components/ConversationHistory'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setLanguage } from '../store/slices/appSlice'

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const dispatch = useAppDispatch()
  const { language } = useAppSelector((state) => state.app)

  const handleLanguageChange = (newLanguage: string) => {
    dispatch(setLanguage(newLanguage))
  }

  return (
    <>
      <Head>
        <title>RAG Document Chat</title>
        <meta name="description" content="Chat with your documents using AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              RAG Document Chat
            </Typography>
            
            <FormControl sx={{ minWidth: 120, mr: 2 }} size="small">
              <InputLabel id="language-select-label">Language</InputLabel>
              <Select
                labelId="language-select-label"
                value={language}
                label="Language"
                onChange={(e) => handleLanguageChange(e.target.value)}
                sx={{ 
                  color: 'white',
                  '& .MuiSelect-icon': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }
                }}
              >
                <MenuItem value="hr">Hrvatski</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 300 }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <DocumentIcon />
                </ListItemIcon>
                <ListItemText primary="Documents" />
              </ListItem>
              <Divider />
              <ListItem>
                <DocumentUpload />
              </ListItem>
              <Divider />
              <ListItem>
                <DocumentList />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
          <Grid container spacing={2}>
            {/* Conversation History - Left Panel */}
            <Grid item xs={12} md={3}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 2, 
                  height: 'calc(100vh - 150px)',
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  overflow: 'hidden'
                }}
              >
                <ConversationHistory />
              </Paper>
            </Grid>
            
            {/* Chat Interface - Center Panel */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  height: 'calc(100vh - 150px)',
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                <ChatInterface />
              </Paper>
            </Grid>
            
            {/* Sources Panel - Right Panel (Smaller) */}
            <Grid item xs={12} md={3}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 2, 
                  height: 'calc(100vh - 150px)',
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  overflow: 'auto'
                }}
              >
                <SourcesPanel />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  )
}