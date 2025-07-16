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

The application is fully functional with a complete Material-UI interface featuring enhanced visual design. The frontend includes:

- **Complete Chat Interface**: Full-featured chat with document Q&A and improved visual styling
- **Document Management**: Upload, list, and delete documents via sidebar
- **Multi-language Support**: Switch between Croatian and English
- **Enhanced UI Design**: Modern interface with Material-UI elevation, custom borders, and refined spacing
- **Responsive Design**: Material-UI components with polished theming and visual hierarchy
- **Real-time Features**: Streaming responses and live document processing

**Note**: The application is production-ready with all core features implemented and a polished user interface.

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
   
   **Note**: Categories are currently hardcoded in the frontend. To add new categories, you need to:
   1. Create the folder in the `documents/` directory
   2. Update the categories array in `frontend/store/slices/documentsSlice.ts`
   3. Update the categories array in `frontend/components/DocumentUpload.tsx`
   4. Automatic scanning on startup is currently disabled. After adding files to the documents folder, trigger processing by:
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

### Supported Languages

- Croatian (`hr`)
- English (`en`)

### Supported Document Formats

- PDF (`.pdf`)
- Word Documents (`.docx`)
- Text Files (`.txt`)
- Markdown (`.md`)

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

### Database Setup

The PostgreSQL database with pgvector extension is automatically configured. The schema includes:

- `documents`: Document metadata
- `chunks`: Text chunks with embeddings
- `categories`: Document categories
- `query_history`: Query and response history

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/documents/refresh` - Refresh document index

### Query
- `POST /api/query` - Submit query
- `POST /api/query/stream` - Stream query response
- `GET /api/query/history` - Get query history
- `POST /api/query/feedback` - Submit feedback

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/{id}/graph` - Get category graph

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