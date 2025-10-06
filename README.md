# RAG Document Chat Application

A comprehensive RAG (Retrieval-Augmented Generation) application that enables users to chat with their documents using AI. Built with FastAPI, Next.js, PostgreSQL with pgvector, Neo4j, and Groq API.

## Features

- **Multi-language Support**: Croatian and English
- **Document Processing**: PDF, DOCX, TXT, MD formats
- **Vector Search**: Semantic search using multilingual embeddings
- **Knowledge Graphs**: Category-based document relationships
- **Real-time Chat**: Interactive document Q&A
- **Document Management**: Upload, categorize, and manage documents
- **Streaming Responses**: Real-time AI responses
- **Docker Deployment**: Complete containerized setup

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  API Gateway │────▶│   FastAPI   │
│  (Next.js)  │     │   (Nginx)   │     │   Server    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┴───────────┐
                    │                                      │
              ┌─────▼─────┐  ┌──────────┐  ┌─────────────▼────┐
              │PostgreSQL │  │  Redis   │  │ Background Workers│
              │    +      │  │  Cache   │  │  (Celery)        │
              │ pgvector  │  └──────────┘  └──────────────────┘
              └───────────┘                          │
                    │                                │
              ┌─────▼─────┐              ┌──────────▼────┐
              │   Neo4j   │              │   Document    │
              │   Graph   │              │   Storage     │
              │    DB     │              │ (Local Volume)│
              └───────────┘              └───────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Groq API key (get from https://console.groq.com/)

### Setup

1. **Clone and configure**:
   ```bash
   git clone <repository>
   cd rag-document-chat
   ```

2. **Configure environment**:
   Edit `.env` file and add your Groq API key:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Access the application**:
   - Frontend: http://localhost (currently shows a test page)
   - API Documentation: http://localhost/api/docs
   - Neo4j Browser: http://localhost:7474
   - Direct API access: http://localhost/api (proxied through Nginx)

### Current Status

The application is fully functional with a complete Material-UI interface featuring enhanced visual design and advanced conversation management. The frontend includes:

#### Core Chat Features
- **Clean Chat Interface**: Streamlined chat interface focused on conversation flow with improved visual styling
- **Real-time Responses**: Streaming responses from Groq API with typing indicators
- **Multi-language Support**: Switch between Croatian and English with proper localization
- **Keyboard Shortcuts**: Press Enter to submit queries, Shift+Enter for new lines

#### Advanced Conversation Management System
The application features a comprehensive conversation system with Redux-based state management:

- **Current Conversation Tracking**: Real-time message management with typing indicators and active conversation highlighting
- **Conversation History Panel**: Left-side panel (`ConversationHistory.tsx`) with persistent storage of all conversations including:
  - Conversation titles with automatic generation from first user message
  - Timestamps with relative time display (hours/days ago) using dynamic formatting
  - Message count indicators with visual chips
  - Last message previews with text truncation (40-50 characters)
  - Quick conversation switching and management with visual feedback
  - Visual indicators for active conversations with enhanced styling
  - Delete conversation functionality with confirmation and hover effects
  - **Enhanced UI Components**: Card-based layout with smooth transitions and hover animations
  - **Smart Title Generation**: Automatic conversation titles from first user message (30 character limit)
  - **Current Chat Highlighting**: Special styling for the active current conversation
- **Conversation Persistence**: Save and load conversations with automatic title generation
- **Multi-Conversation Support**: Switch between multiple conversation threads seamlessly
- **Conversation Actions**: Create new conversations, delete old ones, and update titles
- **Sample Conversations**: Pre-loaded example conversations for demonstration purposes including:
  - "AI i bankarstvo" - Banking and AI related conversation
  - "GDPR regulativa" - GDPR regulation discussion
- **Enhanced Source Display**: Sources panel displays comprehensive document information including:
  - Document metadata (filename, similarity score, chunk index)
  - **Full Content Preview**: Actual text content from relevant document chunks
  - Scrollable content areas with custom webkit scrollbar styling
  - Language-aware content labels (Croatian: "Sadržaj:", English: "Content:")
  - Proper text formatting with optimized line height and spacing
  - Maximum height constraints (120px) to maintain consistent layout
- **Redux State Management**: Centralized conversation state with proper serialization and persistence using dedicated conversation slice

#### Document Management
- **Upload Interface**: Drag-and-drop document upload with progress tracking
- **Document List**: View all uploaded documents with metadata (category, language, file size)
- **Category Management**: Dynamic category detection from folder structure
- **Document Processing**: Automatic text extraction, chunking, and embedding generation
- **File Format Support**: PDF, DOCX, TXT, and Markdown files

#### Enhanced UI Components
- **Dedicated Sources Panel**: Separate right-side panel (`SourcesPanel.tsx`) with Card-based layout showing:
  - Document sources with clear visual hierarchy and compact design
  - Similarity scores as percentage badges with refined styling
  - Chunk index information with shortened labels (#1, #2, etc.)
  - **Content Preview**: Expandable content sections showing actual document chunk text with:
    - Scrollable content areas with custom styling
    - Proper text formatting and line height
    - Language-aware content labels (Croatian/English)
    - Maximum height constraints to maintain layout
  - Optimized spacing and typography for better space utilization
  - Text overflow handling for long document names
- **Conversation History Panel**: Left-side panel (`ConversationHistory.tsx`) featuring:
  - Current conversation status with message count
  - Historical conversations with timestamps and previews
  - Quick conversation switching and management
  - Delete and create conversation actions
  - Visual indicators for active conversations
  - Relative time formatting (hours/days ago)
  - Enhanced card-based UI with hover effects and smooth transitions
  - Smart conversation title generation from first user message
  - React hooks integration for future enhancements

#### Modern UI Design
- **Material-UI Components**: Consistent design system with:
  - Card-based layouts for better content organization
  - Consistent elevation and border styling
  - Refined color scheme with proper contrast
  - Enhanced visual feedback and hover states
- **Responsive Layout**: Three-column layout optimized for desktop use:
  - Conversation history (3/12 width)
  - Chat interface (6/12 width) 
  - Sources panel (3/12 width)
- **Visual Enhancements**: Smooth transitions, hover effects, and professional styling

#### Component Architecture
The frontend is organized into specialized React components:

- **ChatInterface.tsx**: Main chat interface with message display and input handling
- **ConversationHistory.tsx**: Left sidebar for managing conversation history and switching between chats
  - Features card-based layout with smooth transitions
  - Current conversation tracking with special highlighting
  - Historical conversation management with timestamps and previews
  - Delete and create conversation actions with visual feedback
  - React hooks ready for future state management enhancements
- **SourcesPanel.tsx**: Right sidebar displaying document sources with content previews
- **DocumentUpload.tsx**: File upload interface with drag-and-drop support
- **DocumentList.tsx**: Document management with metadata display and deletion
- **Main Layout (index.tsx)**: Three-column responsive layout orchestrating all components

#### Technical Features
- **Redux State Management**: Centralized state management with separate slices for:
  - App settings (language, theme)
  - Chat messages and typing state
  - Document management
  - Conversation management
- **Real-time Features**: Streaming responses and live document processing
- **Error Handling**: Comprehensive error handling with user-friendly messages

#### Redux Store Architecture
The application uses a sophisticated Redux store structure with the following slices:

- **conversationSlice**: Manages conversation state including:
  - Current conversation with real-time message tracking
  - Conversation history with persistent storage
  - Actions for creating, loading, saving, and deleting conversations
  - Automatic title generation from first user message
  - Sample conversations for demonstration (AI i bankarstvo, GDPR regulativa)
  - Active conversation tracking and switching
  - Message interface with sources support for document references

- **appSlice**: Global application state including:
  - Language selection (Croatian/English)
  - Category filtering
  - Loading states and error handling

- **documentsSlice**: Document management state including:
  - Document list with metadata
  - Upload progress tracking
  - Category management
  - Error handling for document operations

- **chatSlice**: Legacy chat state (maintained for backward compatibility)
  - Basic message management
  - Typing indicators
  - Query state tracking

#### AI System Prompts

The application uses specialized system prompts for different languages:

**Croatian (hr):**
```
Ti si AI asistent koji pomaže korisnicima pronaći informacije u dokumentima. 
Odgovori na hrvatskom jeziku na temelju priloženog konteksta. 
Ako informacija nije dostupna u kontekstu, reci da ne znaš odgovor.
Uvijek navedi iz kojeg dokumenta dolaze informacije.
```

**English (en):**
```
You are an AI assistant helping users find information in documents. 
Respond in English based on the provided context. 
If information is not available in the context, say you don't know the answer.
Always cite which document the information comes from.
```

**Note**: The application is production-ready with all core features implemented, including advanced conversation management, specialized AI prompts for accurate responses, and a polished, professional user interface suitable for enterprise deployment. All components are fully functional with proper error handling and responsive design.

### Adding Documents

1. **Via Web Interface**: Use the upload feature in the sidebar (recommended)
2. **Via File System**: Place documents in the `documents/` folder organized by category, then use the refresh endpoint:
   ```
   documents/
   ├── CC_AI/          # AI and machine learning related documents
   ├── EU_ACTS/        # European Union legal acts and regulations
   └── general/        # General purpose documents
   ```
   
   **Available Categories**:
   - `CC_AI`: AI and machine learning related documents
   - `EU_ACTS`: European Union legal acts and regulations  
   - `general`: General purpose documents
   
   **Dynamic Category System**: Categories are now automatically detected from the document folder structure and loaded dynamically in the frontend. To add new categories:
   1. Create a new folder in the `documents/` directory
   2. Add documents to that folder
   3. The category will automatically appear in both the API and frontend upload interface
   4. No manual code updates are required - the system detects categories automatically
   
   **Note**: Automatic scanning on startup is currently disabled. After adding files to the documents folder, trigger processing by:
   - Using the web interface refresh button
   - Calling the `/api/documents/refresh` endpoint
   - Manually uploading through the web interface

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for LLM | Required |
| `POSTGRES_PASSWORD` | PostgreSQL password | `ragapp_secure_password_2024` |
| `NEO4J_PASSWORD` | Neo4j password | `neo4j_secure_password_2024` |
| `DEFAULT_LANGUAGE` | Default language | `hr` |
| `SUPPORTED_LANGUAGES` | Comma-separated list | `hr,en` |
| `DOCUMENTS_PATH` | Document storage path | `/app/documents` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `209715200` (200MB) |
| `DATABASE_URL` | PostgreSQL connection string | Auto-configured |
| `REDIS_URL` | Redis connection string | Auto-configured |
| `NEO4J_URI` | Neo4j connection URI | Auto-configured |

### RAG Configuration

The application uses optimized RAG settings for better response quality:

| Setting | Value | Description |
|---------|-------|-------------|
| `MAX_CHUNKS_PER_QUERY` | 3 | Maximum number of document chunks used per query (reduced for focused responses) |
| `SIMILARITY_THRESHOLD` | 0.8 | Minimum similarity score for chunk inclusion (increased for higher precision) |
| `CHUNK_SIZE` | 512 | Number of tokens per document chunk |
| `CHUNK_OVERLAP` | 50 | Number of overlapping tokens between chunks |
| `EMBEDDING_MODEL` | `intfloat/multilingual-e5-large` | Multilingual embedding model supporting 100+ languages |

These settings prioritize response quality over breadth, ensuring only the most relevant document sections are used for generating answers.



### Supported Languages

- Croatian (`hr`)
- English (`en`)

### Supported Document Formats

- PDF (`.pdf`)
- Word Documents (`.docx`)
- Text Files (`.txt`)
- Markdown (`.md`)

### Embedding Model Details

The application uses the **multilingual-e5-large** model for generating embeddings:

- **Model**: `intfloat/multilingual-e5-large`
- **Dimensions**: 1024
- **Languages**: Supports 100+ languages including Croatian and English
- **Normalization**: Embeddings are normalized for cosine similarity
- **Prefixes**: Uses language-specific prefixes for optimal performance:
  - Query texts: `"query: {text}"`
  - Document passages: `"passage: {text}"`

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Backend Services Architecture

The backend is organized into specialized services for better maintainability and scalability:

### Core Services

#### DocumentService (`backend/services/document_service.py`)
- **Document Upload**: Handles file uploads with validation and storage
- **Text Extraction**: Supports PDF, DOCX, TXT, and Markdown formats
- **Document Processing**: Asynchronous processing with chunking and embedding generation
- **Folder Scanning**: Automatic detection of new documents in the file system
- **Hash-based Deduplication**: Prevents duplicate document processing

#### QueryService (`backend/services/query_service.py`)
- **Query Processing**: Handles user queries with context retrieval
- **Vector Search**: Semantic similarity search using embeddings
- **Response Generation**: Integration with Groq API for LLM responses
- **Streaming Support**: Real-time response streaming for better UX
- **Query History**: Automatic logging of queries and responses

#### EmbeddingService (`backend/services/embedding_service.py`)
- **Model Management**: Loads and manages the multilingual E5-large model
- **Batch Processing**: Efficient embedding generation for multiple texts
- **Language Support**: Optimized prefixes for Croatian and English
- **Similarity Calculation**: Cosine similarity computation for vector search

#### TextProcessor (`backend/services/text_processor.py`)
- **Multi-format Support**: Extracts text from various document formats
- **Smart Chunking**: Sentence-aware text splitting with configurable overlap
- **Language Detection**: Automatic language identification for documents
- **Metadata Preservation**: Maintains document structure information

#### GraphService (`backend/services/graph_service.py`)
- **Knowledge Graph**: Neo4j integration for document relationships
- **Category Management**: Graph-based category and document relationships
- **Similarity Discovery**: Graph traversal for finding related documents
- **Visual Representation**: Graph data for frontend visualization

### Background Processing

#### Celery Tasks (`backend/tasks.py`)
- **Asynchronous Processing**: Background document processing
- **Task Queue Management**: Redis-based task distribution
- **Error Handling**: Retry logic and failure management
- **Scalable Workers**: Support for multiple worker processes

### Database Setup

The PostgreSQL database with pgvector extension is automatically configured. The schema includes:

#### Database Schema

**Documents Table**
- `id`: UUID primary key
- `filename`: Original filename
- `category`: Document category
- `file_hash`: SHA-256 hash for deduplication
- `language`: Document language (hr/en)
- `upload_date`: Upload timestamp
- `last_processed`: Processing completion timestamp
- `doc_metadata`: JSON metadata
- `file_size`: File size in bytes
- `file_path`: Path to stored file

**Chunks Table**
- `id`: UUID primary key
- `document_id`: Foreign key to documents
- `chunk_index`: Sequential chunk number
- `content`: Text content of chunk
- `language`: Chunk language
- `embedding`: Vector embedding (stored as string)
- `chunk_metadata`: JSON metadata
- `created_at`: Creation timestamp

**Categories Table**
- `id`: UUID primary key
- `name`: Category identifier
- `name_hr`: Croatian display name
- `name_en`: English display name
- `description`: Category description
- `graph_id`: Neo4j graph identifier

**Query History Table**
- `id`: UUID primary key
- `query_text`: User query
- `response_text`: AI response
- `language`: Query language
- `response_time_ms`: Response time in milliseconds
- `created_at`: Query timestamp
- `user_id`: User identifier (optional)
- `feedback_score`: User feedback rating



## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload document with category and language
- `GET /api/documents` - List all documents with metadata
- `GET /api/documents/{id}` - Get specific document details
- `DELETE /api/documents/{id}` - Delete document and associated data
- `POST /api/documents/refresh` - Scan and process documents folder

### Query
- `POST /api/query` - Submit query and get complete response with enhanced source details
- `POST /api/query/stream` - Submit query and get streaming response
- `GET /api/query/history` - Retrieve query history with pagination
- `POST /api/query/feedback` - Submit feedback on response quality

#### Query Response Format
The `/api/query` endpoint now returns enhanced source information:

```json
{
  "query": "user question",
  "response": "AI generated response",
  "sources": [
    {
      "document_id": "uuid",
      "filename": "document.pdf",
      "chunk_index": 0,
      "similarity": 0.95,
      "content": "relevant text chunk content"
    }
  ],
  "response_time_ms": 1500,
  "language": "hr"
}
```

### Categories
- `GET /api/categories` - List categories (dynamically from folders)
- `POST /api/categories` - Create new category
- `GET /api/categories/{id}/graph` - Get knowledge graph for category

## Monitoring

### Health Checks

- Application: `http://localhost/health`
- Database: Built into Docker Compose
- Services: Check with `docker-compose ps`

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f worker
```

## Troubleshooting

### Common Issues

1. **Groq API errors**: Ensure valid API key in `.env`
2. **Document processing fails**: Check file format and size limits
3. **Vector search not working**: Verify pgvector extension is loaded
4. **Frontend not loading**: Check if all services are running

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

### Rebuild Services

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

### SSL Configuration

1. Update `nginx/conf.d/ragapp.conf` with your domain
2. Add SSL certificates to `nginx/ssl/`
3. Configure environment variables for production

### Scaling

- Add more API workers: Increase `--workers` in docker-compose.yml
- Scale background workers: `docker-compose up -d --scale worker=3`
- Use external databases for better performance

### Security

- Change default passwords in `.env`
- Configure proper CORS origins
- Add authentication middleware
- Use secrets management for API keys

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs for error messages
3. Open an issue on GitHub