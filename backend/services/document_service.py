import os
import hashlib
import aiofiles
from typing import List, Dict, Any
from fastapi import UploadFile
import logging
from datetime import datetime
import asyncio

from database import SessionLocal
from models import Document, Chunk
from services.text_processor import TextProcessor
from services.embedding_service import EmbeddingService
from config import settings

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.text_processor = TextProcessor()
        self.embedding_service = EmbeddingService()
    
    async def upload_document(self, file: UploadFile, category: str, language: str) -> Dict[str, Any]:
        """Upload and process a new document"""
        try:
            # Validate file
            if file.size > settings.MAX_FILE_SIZE:
                raise ValueError(f"File too large. Max size: {settings.MAX_FILE_SIZE} bytes")
            
            # Read file content
            content = await file.read()
            file_hash = hashlib.sha256(content).hexdigest()
            
            # Check if document already exists
            db = SessionLocal()
            existing_doc = db.query(Document).filter(Document.file_hash == file_hash).first()
            if existing_doc:
                db.close()
                return {"message": "Document already exists", "document_id": str(existing_doc.id)}
            
            # Save file to disk
            file_path = os.path.join(settings.DOCUMENTS_PATH, category, file.filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            # Create document record
            document = Document(
                filename=file.filename,
                category=category,
                file_hash=file_hash,
                language=language,
                file_size=file.size,
                file_path=file_path,
                doc_metadata={"original_filename": file.filename}
            )
            
            db.add(document)
            db.commit()
            db.refresh(document)
            
            # Process document asynchronously
            asyncio.create_task(self._process_document(document.id))
            
            db.close()
            return {"message": "Document uploaded successfully", "document_id": str(document.id)}
            
        except Exception as e:
            logger.error(f"Failed to upload document: {e}")
            raise
    
    async def _process_document(self, document_id: str):
        """Process document and generate embeddings"""
        try:
            db = SessionLocal()
            document = db.query(Document).filter(Document.id == document_id).first()
            
            if not document:
                logger.error(f"Document not found: {document_id}")
                return
            
            logger.info(f"Processing document: {document.filename}")
            
            # Extract text from document
            text_content = await self.text_processor.extract_text(document.file_path)
            
            # Split into chunks
            chunks = self.text_processor.split_text(text_content, document.language)
            
            # Generate embeddings for chunks
            chunk_texts = [chunk["content"] for chunk in chunks]
            embeddings = self.embedding_service.generate_embeddings_batch(chunk_texts, document.language)
            
            # Save chunks to database
            for i, (chunk_data, embedding) in enumerate(zip(chunks, embeddings)):
                chunk = Chunk(
                    document_id=document.id,
                    chunk_index=i,
                    content=chunk_data["content"],
                    language=document.language,
                    embedding=str(embedding),  # Store as string for now
                    chunk_metadata=chunk_data.get("metadata", {})
                )
                db.add(chunk)
            
            # Update document processing timestamp
            document.last_processed = datetime.utcnow()
            db.commit()
            
            logger.info(f"Document processed successfully: {document.filename} ({len(chunks)} chunks)")
            
        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}")
        finally:
            db.close()
    
    async def scan_documents_folder(self) -> Dict[str, Any]:
        """Scan documents folder and process new/modified files"""
        try:
            if not os.path.exists(settings.DOCUMENTS_PATH):
                os.makedirs(settings.DOCUMENTS_PATH)
                return {"message": "Documents folder created", "processed": 0}
            
            processed_count = 0
            db = SessionLocal()
            
            # Walk through documents folder
            for root, dirs, files in os.walk(settings.DOCUMENTS_PATH):
                category = os.path.basename(root) if root != settings.DOCUMENTS_PATH else "general"
                
                for filename in files:
                    if not self._is_supported_file(filename):
                        continue
                    
                    file_path = os.path.join(root, filename)
                    
                    # Calculate file hash
                    with open(file_path, 'rb') as f:
                        file_hash = hashlib.sha256(f.read()).hexdigest()
                    
                    # Check if document exists and is up to date
                    existing_doc = db.query(Document).filter(Document.file_hash == file_hash).first()
                    if existing_doc:
                        continue
                    
                    # Detect language
                    language = self.text_processor.detect_language(file_path)
                    
                    # Create document record
                    document = Document(
                        filename=filename,
                        category=category,
                        file_hash=file_hash,
                        language=language,
                        file_size=os.path.getsize(file_path),
                        file_path=file_path,
                        doc_metadata={"scanned": True}
                    )
                    
                    db.add(document)
                    db.commit()
                    db.refresh(document)
                    
                    # Process document
                    asyncio.create_task(self._process_document(document.id))
                    processed_count += 1
            
            db.close()
            return {"message": f"Scanned documents folder", "processed": processed_count}
            
        except Exception as e:
            logger.error(f"Failed to scan documents folder: {e}")
            raise
    
    async def delete_document(self, document_id: str) -> Dict[str, Any]:
        """Delete a document and its chunks"""
        try:
            db = SessionLocal()
            document = db.query(Document).filter(Document.id == document_id).first()
            
            if not document:
                raise ValueError("Document not found")
            
            # Delete file from disk
            if document.file_path and os.path.exists(document.file_path):
                os.remove(document.file_path)
            
            # Delete from database (chunks will be deleted due to cascade)
            db.delete(document)
            db.commit()
            db.close()
            
            return {"message": "Document deleted successfully"}
            
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            raise
    
    def _is_supported_file(self, filename: str) -> bool:
        """Check if file type is supported"""
        supported_extensions = ['.pdf', '.docx', '.txt', '.md']
        return any(filename.lower().endswith(ext) for ext in supported_extensions)