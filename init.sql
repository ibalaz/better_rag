-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    file_hash VARCHAR(64) UNIQUE,
    language VARCHAR(2) DEFAULT 'hr',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_processed TIMESTAMP,
    doc_metadata JSONB DEFAULT '{}',
    file_size BIGINT,
    file_path TEXT
);

-- Chunks table with vector column
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(2) DEFAULT 'hr',
    embedding vector(1024),
    chunk_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    name_hr VARCHAR(100),
    name_en VARCHAR(100),
    description TEXT,
    graph_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query history table
CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT NOT NULL,
    response_text TEXT,
    language VARCHAR(2) DEFAULT 'hr',
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5)
);

-- Create indexes for performance
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_language ON documents(language);
CREATE INDEX idx_documents_hash ON documents(file_hash);

CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_language ON chunks(language);

-- Vector similarity search index
CREATE INDEX chunks_embedding_idx ON chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Insert default categories based on actual document folders
INSERT INTO categories (name, name_hr, name_en, description) VALUES
('CC_AI', 'CC AI', 'CC AI', 'CC AI related documents'),
('EU_ACTS', 'EU Akti', 'EU Acts', 'European Union Acts and legislation'),
('general', 'Općenito', 'General', 'General documents and miscellaneous content');