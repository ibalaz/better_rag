import json
import time
from typing import List, Dict, Any, AsyncGenerator
import logging
from groq import Groq
import asyncio

from database import SessionLocal
from models import Document, Chunk, QueryHistory
from services.embedding_service import EmbeddingService
from config import settings

logger = logging.getLogger(__name__)

class QueryService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        
        if not self.groq_client:
            logger.warning("Groq API key not provided. Query functionality will be limited.")
    
    async def process_query(self, query: str, language: str = "hr", category: str = None) -> Dict[str, Any]:
        """Process a query and return response"""
        start_time = time.time()
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_service.generate_embedding(query, language)
            
            # Retrieve relevant chunks
            relevant_chunks = await self._retrieve_chunks(query_embedding, language, category)
            
            # Generate response using Groq
            response = await self._generate_response(query, relevant_chunks, language)
            
            # Save query history
            response_time = int((time.time() - start_time) * 1000)
            await self._save_query_history(query, response, language, response_time)
            
            return {
                "query": query,
                "response": response,
                "sources": [
                    {
                        "document_id": str(chunk["document_id"]),
                        "filename": chunk["filename"],
                        "chunk_index": chunk["chunk_index"],
                        "similarity": chunk["similarity"]
                    }
                    for chunk in relevant_chunks
                ],
                "response_time_ms": response_time,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"Failed to process query: {e}")
            raise
    
    async def stream_query(self, query: str, language: str = "hr", category: str = None) -> AsyncGenerator[str, None]:
        """Process query and stream response"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_service.generate_embedding(query, language)
            
            # Retrieve relevant chunks
            relevant_chunks = await self._retrieve_chunks(query_embedding, language, category)
            
            # Stream response using Groq
            async for chunk in self._stream_response(query, relevant_chunks, language):
                yield chunk
                
        except Exception as e:
            logger.error(f"Failed to stream query: {e}")
            yield f"Error: {str(e)}"
    
    async def _retrieve_chunks(self, query_embedding: List[float], language: str, category: str = None) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks using vector similarity"""
        try:
            db = SessionLocal()
            
            # Build query
            query_builder = db.query(Chunk, Document).join(Document)
            
            # Filter by language
            query_builder = query_builder.filter(Chunk.language == language)
            
            # Filter by category if specified
            if category:
                query_builder = query_builder.filter(Document.category == category)
            
            # Get all chunks (in production, use vector similarity search)
            results = query_builder.all()
            
            # Calculate similarities (simplified version)
            chunk_similarities = []
            for chunk, document in results:
                if chunk.embedding:
                    try:
                        # Parse embedding from string (in production, use proper vector operations)
                        chunk_embedding = json.loads(chunk.embedding.replace("'", '"'))
                        similarity = self.embedding_service.calculate_similarity(query_embedding, chunk_embedding)
                        
                        if similarity >= settings.SIMILARITY_THRESHOLD:
                            chunk_similarities.append({
                                "chunk_id": str(chunk.id),
                                "document_id": str(document.id),
                                "filename": document.filename,
                                "content": chunk.content,
                                "chunk_index": chunk.chunk_index,
                                "similarity": similarity,
                                "metadata": chunk.chunk_metadata
                            })
                    except Exception as e:
                        logger.warning(f"Failed to parse embedding for chunk {chunk.id}: {e}")
                        continue
            
            # Sort by similarity and return top chunks
            chunk_similarities.sort(key=lambda x: x["similarity"], reverse=True)
            db.close()
            
            return chunk_similarities[:settings.MAX_CHUNKS_PER_QUERY]
            
        except Exception as e:
            logger.error(f"Failed to retrieve chunks: {e}")
            return []
    
    async def _generate_response(self, query: str, chunks: List[Dict[str, Any]], language: str) -> str:
        """Generate response using Groq"""
        if not self.groq_client:
            return "Groq API not configured. Please provide a valid API key."
        
        try:
            # Prepare context from chunks
            context = "\n\n".join([
                f"Dokument: {chunk['filename']}\nSadržaj: {chunk['content']}"
                for chunk in chunks
            ])
            
            # System prompts
            system_prompts = {
                'hr': """Ti si AI asistent koji pomaže korisnicima pronaći informacije u dokumentima. 
                Odgovori na hrvatskom jeziku na temelju priloženog konteksta. 
                Ako informacija nije dostupna u kontekstu, reci da ne znaš odgovor.
                Uvijek navedi iz kojeg dokumenta dolaze informacije.""",
                'en': """You are an AI assistant helping users find information in documents. 
                Respond in English based on the provided context. 
                If information is not available in the context, say you don't know the answer.
                Always cite which document the information comes from."""
            }
            
            # Generate response
            response = self.groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": system_prompts.get(language, system_prompts['hr'])},
                    {"role": "user", "content": f"Kontekst:\n{context}\n\nPitanje: {query}"}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Failed to generate response with Groq: {e}")
            return f"Greška pri generiranju odgovora: {str(e)}"
    
    async def _stream_response(self, query: str, chunks: List[Dict[str, Any]], language: str) -> AsyncGenerator[str, None]:
        """Stream response using Groq"""
        if not self.groq_client:
            yield "Groq API not configured. Please provide a valid API key."
            return
        
        try:
            # Prepare context from chunks
            context = "\n\n".join([
                f"Dokument: {chunk['filename']}\nSadržaj: {chunk['content']}"
                for chunk in chunks
            ])
            
            # System prompts
            system_prompts = {
                'hr': """Ti si AI asistent koji pomaže korisnicima pronaći informacije u dokumentima. 
                Odgovori na hrvatskom jeziku na temelju priloženog konteksta. 
                Ako informacija nije dostupna u kontekstu, reci da ne znaš odgovor.
                Uvijek navedi iz kojeg dokumenta dolaze informacije.""",
                'en': """You are an AI assistant helping users find information in documents. 
                Respond in English based on the provided context. 
                If information is not available in the context, say you don't know the answer.
                Always cite which document the information comes from."""
            }
            
            # Stream response
            stream = self.groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": system_prompts.get(language, system_prompts['hr'])},
                    {"role": "user", "content": f"Kontekst:\n{context}\n\nPitanje: {query}"}
                ],
                temperature=0.7,
                max_tokens=2000,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Failed to stream response with Groq: {e}")
            yield f"Greška pri generiranju odgovora: {str(e)}"
    
    async def _save_query_history(self, query: str, response: str, language: str, response_time: int):
        """Save query to history"""
        try:
            db = SessionLocal()
            
            history = QueryHistory(
                query_text=query,
                response_text=response,
                language=language,
                response_time_ms=response_time
            )
            
            db.add(history)
            db.commit()
            db.close()
            
        except Exception as e:
            logger.error(f"Failed to save query history: {e}")