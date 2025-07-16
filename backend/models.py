from sqlalchemy import Column, String, Integer, DateTime, Text, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    category = Column(String(100))
    file_hash = Column(String(64), unique=True)
    language = Column(String(2), default='hr')
    upload_date = Column(DateTime, server_default=func.now())
    last_processed = Column(DateTime)
    doc_metadata = Column(JSONB, default={})
    file_size = Column(BigInteger)
    file_path = Column(Text)
    
    # Relationship to chunks
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")

class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    language = Column(String(2), default='hr')
    embedding = Column("embedding", String)  # Will store as vector in PostgreSQL
    chunk_metadata = Column(JSONB, default={})
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship to document
    document = relationship("Document", back_populates="chunks")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    name_hr = Column(String(100))
    name_en = Column(String(100))
    description = Column(Text)
    graph_id = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

class QueryHistory(Base):
    __tablename__ = "query_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_text = Column(Text, nullable=False)
    response_text = Column(Text)
    language = Column(String(2), default='hr')
    response_time_ms = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    user_id = Column(String(255))
    feedback_score = Column(Integer)