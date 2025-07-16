# RAG Document Chat Application Specification

## 1. Executive Summary

A web-based application that enables users to interact with documents through natural language queries. The system uses RAG (Retrieval-Augmented Generation) architecture with vector embeddings and knowledge graphs for optimal document retrieval and response generation.

## 2. System Architecture

### 2.1 Core Components
- **Web Frontend**: User interface for document interaction and upload
- **REST API**: Backend services for document processing and query handling
- **Vector Database**: Storage for document embeddings
- **Graph Database**: Knowledge graph storage for category relationships
- **Document Storage**: File system or object storage for original documents
- **Background Workers**: Asynchronous document processing services

### 2.2 Technology Stack Recommendations

#### Frontend
- **Framework**: React.js or Next.js (for SSR capabilities)
- **UI Library**: Material-UI or Tailwind CSS
- **State Management**: Redux Toolkit or Zustand
- **Chat Interface**: react-chat-ui or custom implementation

#### Backend API
- **Framework**: FastAPI (Python) - excellent for ML integration
- **Alternative**: Node.js with Express (if preferring JavaScript)
- **API Documentation**: OpenAPI/Swagger (automatic with FastAPI)

#### Databases
- **Vector Database**: PostgreSQL with pgvector extension
- **Graph Database**: Neo4j or ArangoDB
- **Relational Database**: PostgreSQL (same instance, unified database)
- **Cache**: Redis (for session management and caching)

#### Document Processing & ML
- **LLM Provider**: Groq (fast inference)
  - Primary Model: Llama 3 70B (excellent multilingual support including Croatian)
  - Alternative: Mixtral 8x7B (good Croatian performance)
- **Embeddings**: 
  - Multilingual E5-large (supports 100+ languages including Croatian)
  - Alternative: BGE-M3 (multilingual embeddings)
- **Document Parsing**: 
  - LangChain document loaders
  - Unstructured.io for complex documents
  - PyPDF2 for PDFs
- **Chunking Strategy**: LangChain text splitters with overlap
- **Language Detection**: langdetect or polyglot for automatic language identification

#### Infrastructure
- **Containerization**: Docker with Docker Compose for full stack deployment
- **File Storage**: Local volume mounts or MinIO container
- **Message Queue**: Redis Queue (simpler than RabbitMQ for Docker setup)
- **Container Orchestration**: Docker Compose (development & small production), Kubernetes (large scale)

## 3. Functional Requirements

### 3.1 Document Management
- **Initial Document Loading**
  - Scan designated folder structure on startup
  - Recognize subfolders as document categories
  - Support multiple file formats (PDF, DOCX, TXT, MD)
  
- **Document Processing Pipeline**
  1. Calculate document hash (SHA-256)
  2. Compare with stored hashes to detect changes
  3. Parse modified documents only
  4. Split documents into optimal chunks (recommended: 512-1024 tokens with 10-20% overlap)
  5. Generate embeddings for each chunk
  6. Store embeddings in vector database with metadata
  7. Build/update knowledge graph for category

- **Document Upload**
  - Web interface for file upload
  - Category selection during upload
  - Automatic processing upon upload
  - Progress tracking for large documents

### 3.2 Knowledge Graph Construction
- **Per-Category Graphs**
  - Entities: Documents, chunks, concepts, topics
  - Relationships: References, similarities, hierarchies
  - Automated extraction using NLP (spaCy or similar)
  
- **Graph Usage**
  - Query expansion for better retrieval
  - Relevance scoring enhancement
  - Conceptual navigation between documents

### 3.3 Query Processing & RAG

#### Retrieval Pipeline
1. **Query Enhancement**
   - Expand query using knowledge graph
   - Generate multiple query variations
   - Extract key concepts and entities

2. **Multi-Stage Retrieval**
   - Stage 1: Vector similarity search (top 50-100 chunks)
   - Stage 2: Knowledge graph traversal for related concepts
   - Stage 3: Hybrid scoring (combine vector + graph relevance)
   - Stage 4: Re-ranking using cross-encoder model

3. **Context Assembly**
   - Select top K chunks (typically 5-10)
   - Order by relevance and diversity
   - Include document metadata

4. **Response Generation**
   - Pass context + query to LLM
   - Stream response to user
   - Cite source documents

### 3.4 Optimization Strategies

#### Vector Search Optimization
- **Indexing**: Use HNSW or IVF indexes for large-scale search
- **Dimensionality**: Balance between 768 (BERT) and 1536 (OpenAI) dimensions
- **Metadata Filtering**: Pre-filter by category before vector search
- **Hybrid Search**: Combine vector search with BM25 keyword search

#### Chunking Strategy
- **Smart Chunking**: Respect document structure (paragraphs, sections)
- **Overlap**: 10-20% overlap between chunks
- **Size**: 512-1024 tokens per chunk
- **Metadata**: Preserve section headers, page numbers

#### Caching Strategy
- Cache frequent queries and responses
- Cache embedding vectors for common phrases
- Implement TTL based on document update frequency

## 4. Non-Functional Requirements

### 4.1 Performance
- Query response time: < 3 seconds for 95th percentile
- Document processing: 10-50 pages per minute
- Concurrent users: Support 100+ simultaneous users

### 4.2 Scalability
- Horizontal scaling for API servers
- Vector database sharding for large collections
- Background worker scaling for document processing

### 4.3 Security
- Authentication: JWT tokens or OAuth2
- Authorization: Role-based access control (RBAC)
- Document encryption at rest
- API rate limiting

### 4.4 Monitoring
- Application metrics (Prometheus + Grafana)
- Error tracking (Sentry)
- Query performance analytics
- Document processing statistics

## 5. Database Schema

### 5.1 PostgreSQL Tables
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
documents (
  id UUID PRIMARY KEY,
  filename VARCHAR(255),
  category VARCHAR(100),
  file_hash VARCHAR(64),
  language VARCHAR(2), -- 'hr' or 'en'
  upload_date TIMESTAMP,
  last_processed TIMESTAMP,
  metadata JSONB
)

-- Chunks table with vector column
chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  chunk_index INTEGER,
  content TEXT,
  language VARCHAR(2),
  embedding vector(1024), -- E5-large dimension
  metadata JSONB
)

-- Categories table
categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  name_hr VARCHAR(100), -- Croatian name
  name_en VARCHAR(100), -- English name
  description TEXT,
  graph_id VARCHAR(255)
)

-- Create indexes for vector similarity search
CREATE INDEX chunks_embedding_idx ON chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 5.2 Vector Database Schema
```json
{
  "chunk_id": "chunk_uuid",
  "embedding": [0.1, 0.2, ...], // stored directly in PostgreSQL
  "metadata": {
    "document_id": "doc_uuid",
    "category": "category_name",
    "language": "hr",
    "chunk_index": 1,
    "text": "chunk content preview",
    "page": 5
  }
}
```

## 6. API Endpoints

### Document Management
- `POST /api/documents/upload` - Upload new document
- `GET /api/documents` - List all documents
- `GET /api/documents/{id}` - Get document details
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/documents/refresh` - Force document re-processing

### Query Endpoints
- `POST /api/query` - Submit query and get response
- `GET /api/query/history` - Get query history
- `POST /api/query/feedback` - Submit feedback on response

### Category Management
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category
- `GET /api/categories/{id}/graph` - Get category knowledge graph

## 7. Additional Recommendations

### 7.1 Features to Consider
1. **Query History & Analytics**: Track user queries for insights
2. **Feedback Loop**: Allow users to rate responses for improvement
3. **Document Versioning**: Track changes over time
4. **Export Functionality**: Export conversations or summaries
5. **Language Switching**: Allow users to switch UI and response language
6. **Permission System**: Control document access per user/group

### 7.2 Development Phases
1. **Phase 1**: Core RAG functionality with pgvector search
2. **Phase 2**: Multi-language support (Croatian/English)
3. **Phase 3**: Knowledge graph integration
4. **Phase 4**: Advanced retrieval optimization
5. **Phase 5**: Analytics and feedback systems

### 7.3 Testing Strategy
- Unit tests for document processing functions
- Integration tests for RAG pipeline
- Load testing for concurrent users
- Accuracy testing for retrieval quality

## 8. Docker Deployment

### 8.1 Docker Compose Configuration
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./frontend/out:/usr/share/nginx/html  # For static Next.js export
    depends_on:
      - api
      - frontend
    restart: unless-stopped
    networks:
      - ragapp_network

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: ragapp
      POSTGRES_USER: raguser
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U raguser"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ragapp_network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ragapp_network

  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["graph-data-science"]'
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    healthcheck:
      test: ["CMD", "neo4j", "status"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ragapp_network

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://raguser:${POSTGRES_PASSWORD}@postgres:5432/ragapp
      REDIS_URL: redis://redis:6379
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_PASSWORD: ${NEO4J_PASSWORD}
      GROQ_API_KEY: ${GROQ_API_KEY}
      DOCUMENTS_PATH: /app/documents
    volumes:
      - ./documents:/app/documents
      - ./backend:/app
    expose:
      - "8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    command: uvicorn main:app --host 0.0.0.0 --workers 4
    networks:
      - ragapp_network

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://raguser:${POSTGRES_PASSWORD}@postgres:5432/ragapp
      REDIS_URL: redis://redis:6379
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_PASSWORD: ${NEO4J_PASSWORD}
      GROQ_API_KEY: ${GROQ_API_KEY}
      DOCUMENTS_PATH: /app/documents
    volumes:
      - ./documents:/app/documents
      - ./backend:/app
    depends_on:
      - postgres
      - redis
      - neo4j
    command: python -m celery -A tasks worker --loglevel=info
    networks:
      - ragapp_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://nginx/api
    expose:
      - "3000"
    depends_on:
      - api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
    networks:
      - ragapp_network

volumes:
  postgres_data:
  redis_data:
  neo4j_data:
  neo4j_logs:

networks:
  ragapp_network:
    driver: bridge
```

### 8.2 Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create documents directory
RUN mkdir -p /app/documents

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 8.3 Frontend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 8.4 Environment Variables (.env)
```bash
# Database
POSTGRES_PASSWORD=your_secure_password
NEO4J_PASSWORD=your_neo4j_password

# Groq API
GROQ_API_KEY=your_groq_api_key

# Application
APP_SECRET_KEY=your_app_secret_key
JWT_SECRET_KEY=your_jwt_secret

# Language settings
DEFAULT_LANGUAGE=hr
SUPPORTED_LANGUAGES=hr,en
```

## 9. Deployment Architecture

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
              │    +      │  │  Cache   │  │  (Celery/RQ)     │
              │ pgvector  │  └──────────┘  └──────────────────┘
              └───────────┘                          │
                    │                                │
              ┌─────▼─────┐              ┌──────────▼────┐
              │   Neo4j   │              │   Document    │
              │   Graph   │              │   Storage     │
              │    DB     │              │ (Local Volume)│
              └───────────┘              └───────────────┘
                    │
              ┌─────▼─────┐
              │   Groq    │
              │    API    │
              │ (External)│
              └───────────┘
```

## 10. Multi-language Implementation Details

### 10.1 Embedding Strategy
```python
# Use multilingual embeddings
from sentence_transformers import SentenceTransformer

# E5-large supports 100+ languages including Croatian
model = SentenceTransformer('intfloat/multilingual-e5-large')

# Generate embeddings preserving language context
def generate_embedding(text, language):
    # Add language prefix for better performance
    if language == 'hr':
        text = f"query: {text}"  # Croatian
    else:
        text = f"query: {text}"  # English
    
    return model.encode(text)
```

### 10.2 Groq Integration
```python
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_response(query, context, language='hr'):
    system_prompt = {
        'hr': "Ti si AI asistent koji pomaže korisnicima pronaći informacije u dokumentima. Odgovori na hrvatskom jeziku.",
        'en': "You are an AI assistant helping users find information in documents. Respond in English."
    }
    
    response = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": system_prompt[language]},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query}"}
        ],
        temperature=0.7,
        max_tokens=2000
    )
    
    return response.choices[0].message.content
```

## 11. Nginx Reverse Proxy Configuration

### 11.1 Main Nginx Configuration (nginx/nginx.conf)
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;

    # Performance settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;  # For document uploads

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml application/atom+xml image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### 11.2 Site Configuration (nginx/conf.d/ragapp.conf)
```nginx
# Upstream definitions
upstream api_backend {
    least_conn;
    server api:8000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream frontend_app {
    server frontend:3000;
    keepalive 32;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=1r/s;

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/nginx/ssl/chain.pem;

    # API endpoints
    location /api/ {
        # Apply rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        # Proxy settings
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket support for real-time features
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Disable buffering for SSE/streaming responses
        proxy_buffering off;
        proxy_cache off;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' "$http_origin" always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Document upload endpoint with stricter limits
    location /api/documents/upload {
        limit_req zone=upload_limit burst=5 nodelay;
        client_max_body_size 200M;
        
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeout for large file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Frontend application
    location / {
        proxy_pass http://frontend_app;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Next.js hot reload (development)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files optimization
    location /_next/static/ {
        proxy_pass http://frontend_app;
        proxy_cache_valid 200 60m;
        proxy_cache_valid 404 1m;
        
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        default_type text/plain;
        return 200 "healthy\n";
    }

    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# Load balancer health check
server {
    listen 8080;
    server_name _;
    
    location /nginx-health {
        access_log off;
        default_type text/plain;
        return 200 "healthy\n";
    }
}
```

### 11.3 SSL Certificate Setup
```bash
# Using Let's Encrypt with Certbot
# Create directory structure
mkdir -p nginx/ssl

# For development (self-signed)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=HR/ST=Zagreb/L=Zagreb/O=YourOrg/CN=localhost"

# For production with Let's Encrypt
# Add certbot service to docker-compose.yml:
certbot:
  image: certbot/certbot
  volumes:
    - ./certbot/conf:/etc/letsencrypt
    - ./certbot/www:/var/www/certbot
  entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait ${!}; done;'"

# Initial certificate generation
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@domain.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com \
  -d www.your-domain.com
```

### 11.4 Production Optimizations
```nginx
# Cache configuration (add to ragapp.conf)
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;

# API response caching for read endpoints
location ~ ^/api/(documents|categories|query/history) {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_valid 404 1m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
    
    add_header X-Cache-Status $upstream_cache_status;
    
    proxy_pass http://api_backend;
    # ... other proxy settings
}

# WebSocket configuration for real-time chat
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

location /api/ws/ {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
    # WebSocket specific timeouts
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

### 11.5 Monitoring and Logging
```nginx
# Enhanced logging format (add to nginx.conf)
log_format detailed '$remote_addr - $remote_user [$time_local] '
                   '"$request" $status $body_bytes_sent '
                   '"$http_referer" "$http_user_agent" '
                   '$request_time $upstream_response_time '
                   '$pipe $upstream_cache_status';

# API access log with detailed format
location /api/ {
    access_log /var/log/nginx/api_access.log detailed;
    # ... rest of configuration
}

# Error pages
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location = /50x.html {
    root /usr/share/nginx/html;
}
```

This Nginx configuration provides:
- **SSL/TLS termination** with modern security settings
- **Load balancing** with health checks
- **Rate limiting** to prevent abuse
- **Caching** for static assets and API responses
- **WebSocket support** for real-time features
- **Security headers** for protection against common attacks
- **Optimized settings** for performance
- **Detailed logging** for monitoring and debugging