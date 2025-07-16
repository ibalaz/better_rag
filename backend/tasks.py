from celery import Celery
import os
from config import settings

# Create Celery app
celery_app = Celery(
    "ragapp",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["tasks"]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

@celery_app.task(bind=True)
def process_document_task(self, document_id: str):
    """Celery task to process document"""
    try:
        from services.document_service import DocumentService
        import asyncio
        
        # Create document service
        doc_service = DocumentService()
        
        # Process document
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(doc_service._process_document(document_id))
        loop.close()
        
        return {"status": "success", "document_id": document_id}
        
    except Exception as e:
        self.retry(countdown=60, max_retries=3)
        return {"status": "error", "error": str(e)}

@celery_app.task(bind=True)
def scan_documents_task(self):
    """Celery task to scan documents folder"""
    try:
        from services.document_service import DocumentService
        import asyncio
        
        # Create document service
        doc_service = DocumentService()
        
        # Scan documents
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(doc_service.scan_documents_folder())
        loop.close()
        
        return result
        
    except Exception as e:
        self.retry(countdown=60, max_retries=3)
        return {"status": "error", "error": str(e)}

@celery_app.task
def update_embeddings_task():
    """Celery task to update embeddings for all documents"""
    try:
        from database import SessionLocal
        from models import Document
        import asyncio
        
        db = SessionLocal()
        documents = db.query(Document).filter(Document.last_processed.is_(None)).all()
        
        from services.document_service import DocumentService
        doc_service = DocumentService()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        for document in documents:
            loop.run_until_complete(doc_service._process_document(str(document.id)))
        
        loop.close()
        db.close()
        
        return {"status": "success", "processed": len(documents)}
        
    except Exception as e:
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    celery_app.start()