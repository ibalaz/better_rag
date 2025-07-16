from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import os
from contextlib import asynccontextmanager

from database import engine, SessionLocal, Base
from models import Document, Chunk, Category, QueryHistory
from services.document_service import DocumentService
from services.embedding_service import EmbeddingService
from services.query_service import QueryService
from services.graph_service import GraphService
from config import settings

# Create tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting RAG Document Chat Application...")
    
    # Initialize services
    app.state.document_service = DocumentService()
    app.state.embedding_service = EmbeddingService()
    app.state.query_service = QueryService()
    app.state.graph_service = GraphService()
    
    # Scan documents folder on startup (disabled for now)
    # if os.path.exists(settings.DOCUMENTS_PATH):
    #     await app.state.document_service.scan_documents_folder()
    
    yield
    
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="RAG Document Chat API",
    description="API for RAG-based document chat application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "RAG Document Chat API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Document endpoints
@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    language: str = Form("hr")
):
    """Upload a new document"""
    try:
        result = await app.state.document_service.upload_document(file, category, language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents")
async def list_documents(db = Depends(get_db)):
    """List all documents"""
    documents = db.query(Document).all()
    return documents

@app.get("/api/documents/{document_id}")
async def get_document(document_id: str, db = Depends(get_db)):
    """Get document details"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    try:
        result = await app.state.document_service.delete_document(document_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/refresh")
async def refresh_documents():
    """Force refresh of all documents"""
    try:
        result = await app.state.document_service.scan_documents_folder()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Query endpoints
@app.post("/api/query")
async def query_documents(
    query: str = Form(...),
    language: str = Form("hr"),
    category: str = Form(None)
):
    """Submit a query and get response"""
    try:
        response = await app.state.query_service.process_query(query, language, category)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query/stream")
async def stream_query(
    query: str = Form(...),
    language: str = Form("hr"),
    category: str = Form(None)
):
    """Submit a query and get streaming response"""
    try:
        return StreamingResponse(
            app.state.query_service.stream_query(query, language, category),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/query/history")
async def get_query_history(db = Depends(get_db)):
    """Get query history"""
    history = db.query(QueryHistory).order_by(QueryHistory.created_at.desc()).limit(50).all()
    return history

@app.post("/api/query/feedback")
async def submit_feedback(
    query_id: str = Form(...),
    score: int = Form(...),
    db = Depends(get_db)
):
    """Submit feedback on a query response"""
    query = db.query(QueryHistory).filter(QueryHistory.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    query.feedback_score = score
    db.commit()
    return {"message": "Feedback submitted successfully"}

# Category endpoints
@app.get("/api/categories")
async def list_categories(db = Depends(get_db)):
    """List all categories"""
    categories = db.query(Category).all()
    return categories

@app.post("/api/categories")
async def create_category(
    name: str = Form(...),
    name_hr: str = Form(...),
    name_en: str = Form(...),
    description: str = Form(""),
    db = Depends(get_db)
):
    """Create a new category"""
    category = Category(
        name=name,
        name_hr=name_hr,
        name_en=name_en,
        description=description
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@app.get("/api/categories/{category_id}/graph")
async def get_category_graph(category_id: str):
    """Get knowledge graph for a category"""
    try:
        graph = await app.state.graph_service.get_category_graph(category_id)
        return graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)