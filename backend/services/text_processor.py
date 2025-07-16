import os
from typing import List, Dict, Any
import logging
from langdetect import detect
import PyPDF2
from docx import Document as DocxDocument
import markdown
from config import settings

logger = logging.getLogger(__name__)

class TextProcessor:
    def __init__(self):
        pass
    
    async def extract_text(self, file_path: str) -> str:
        """Extract text from various file formats"""
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                return self._extract_from_pdf(file_path)
            elif file_extension == '.docx':
                return self._extract_from_docx(file_path)
            elif file_extension == '.txt':
                return self._extract_from_txt(file_path)
            elif file_extension == '.md':
                return self._extract_from_markdown(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
                
        except Exception as e:
            logger.error(f"Failed to extract text from {file_path}: {e}")
            raise
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {e}")
            raise
        return text.strip()
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            logger.error(f"Failed to extract text from DOCX {file_path}: {e}")
            raise
        return text.strip()
    
    def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
        except UnicodeDecodeError:
            # Try with different encoding
            with open(file_path, 'r', encoding='latin-1') as file:
                text = file.read()
        except Exception as e:
            logger.error(f"Failed to extract text from TXT {file_path}: {e}")
            raise
        return text.strip()
    
    def _extract_from_markdown(self, file_path: str) -> str:
        """Extract text from Markdown file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                md_content = file.read()
            
            # Convert markdown to plain text
            html = markdown.markdown(md_content)
            # Simple HTML tag removal (for basic conversion)
            import re
            text = re.sub('<[^<]+?>', '', html)
        except Exception as e:
            logger.error(f"Failed to extract text from Markdown {file_path}: {e}")
            raise
        return text.strip()
    
    def split_text(self, text: str, language: str = "hr") -> List[Dict[str, Any]]:
        """Split text into chunks with overlap"""
        try:
            # Simple sentence-based splitting for now
            sentences = self._split_into_sentences(text)
            chunks = []
            
            current_chunk = ""
            current_length = 0
            chunk_index = 0
            
            for sentence in sentences:
                sentence_length = len(sentence.split())
                
                # If adding this sentence would exceed chunk size, save current chunk
                if current_length + sentence_length > settings.CHUNK_SIZE and current_chunk:
                    chunks.append({
                        "content": current_chunk.strip(),
                        "metadata": {
                            "chunk_index": chunk_index,
                            "word_count": current_length,
                            "language": language
                        }
                    })
                    
                    # Start new chunk with overlap
                    overlap_sentences = self._get_overlap_sentences(current_chunk, settings.CHUNK_OVERLAP)
                    current_chunk = overlap_sentences + " " + sentence
                    current_length = len(current_chunk.split())
                    chunk_index += 1
                else:
                    current_chunk += " " + sentence if current_chunk else sentence
                    current_length += sentence_length
            
            # Add the last chunk
            if current_chunk.strip():
                chunks.append({
                    "content": current_chunk.strip(),
                    "metadata": {
                        "chunk_index": chunk_index,
                        "word_count": current_length,
                        "language": language
                    }
                })
            
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to split text: {e}")
            raise
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting (can be improved with spaCy)
        import re
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _get_overlap_sentences(self, text: str, overlap_words: int) -> str:
        """Get last N words for overlap"""
        words = text.split()
        if len(words) <= overlap_words:
            return text
        return " ".join(words[-overlap_words:])
    
    def detect_language(self, file_path: str) -> str:
        """Detect language of the document"""
        try:
            # Extract a sample of text for language detection
            text = ""
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()[:1000]  # First 1000 characters
            elif file_extension == '.pdf':
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    if len(pdf_reader.pages) > 0:
                        text = pdf_reader.pages[0].extract_text()[:1000]
            
            if text.strip():
                detected_lang = detect(text)
                # Map detected language to supported languages
                if detected_lang in ['hr', 'sr', 'bs']:  # Croatian, Serbian, Bosnian
                    return 'hr'
                elif detected_lang in ['en']:
                    return 'en'
                else:
                    return settings.DEFAULT_LANGUAGE
            
        except Exception as e:
            logger.warning(f"Failed to detect language for {file_path}: {e}")
        
        return settings.DEFAULT_LANGUAGE