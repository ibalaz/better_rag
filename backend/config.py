from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://raguser:password@localhost:5432/ragapp"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_PASSWORD: str = "password"
    
    # Groq API
    GROQ_API_KEY: str = ""
    
    # Application
    APP_SECRET_KEY: str = "your-secret-key"
    JWT_SECRET_KEY: str = "your-jwt-secret"
    
    # Language settings
    DEFAULT_LANGUAGE: str = "hr"
    SUPPORTED_LANGUAGES: List[str] = ["hr", "en"]
    
    # Documents
    DOCUMENTS_PATH: str = "/app/documents"
    MAX_FILE_SIZE: int = 200 * 1024 * 1024  # 200MB
    
    # Embedding settings
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-large"
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    
    # RAG settings
    MAX_CHUNKS_PER_QUERY: int = 3
    SIMILARITY_THRESHOLD: float = 0.8
    
    class Config:
        env_file = ".env"

settings = Settings()