# Documents Folder

This folder is where your documents will be stored and processed by the RAG system.

## Structure

Organize your documents in subfolders by category:

```
documents/
├── CC_AI/              # AI and machine learning related documents
│   ├── ai_research.pdf
│   └── ml_guide.txt
├── EU_ACTS/            # European Union legal acts and regulations
│   ├── gdpr_regulation.pdf
│   └── ai_act.docx
└── general/            # General purpose documents
    ├── document1.pdf
    └── document2.txt
```

## Supported Formats

- PDF (.pdf)
- Word Documents (.docx)
- Text Files (.txt)
- Markdown Files (.md)

## Language Support

The system automatically detects document language and supports:
- Croatian (hr)
- English (en)

## Processing

Documents are automatically processed when:
1. The application starts up (scans this folder)
2. Files are uploaded through the web interface
3. Manual refresh is triggered

Each document is:
1. Parsed and text extracted
2. Split into chunks
3. Converted to embeddings
4. Stored in the vector database
5. Added to the knowledge graph