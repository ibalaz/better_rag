from neo4j import GraphDatabase
from typing import Dict, Any, List
import logging
from config import settings

logger = logging.getLogger(__name__)

class GraphService:
    def __init__(self):
        self.driver = None
        self._connect()
    
    def _connect(self):
        """Connect to Neo4j database"""
        try:
            if settings.NEO4J_URI and settings.NEO4J_PASSWORD:
                self.driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=("neo4j", settings.NEO4J_PASSWORD)
                )
                logger.info("Connected to Neo4j database")
            else:
                logger.warning("Neo4j credentials not provided. Graph functionality will be limited.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
    
    def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()
    
    async def create_document_node(self, document_id: str, document_data: Dict[str, Any]):
        """Create a document node in the graph"""
        if not self.driver:
            return
        
        try:
            with self.driver.session() as session:
                session.run(
                    """
                    MERGE (d:Document {id: $document_id})
                    SET d.filename = $filename,
                        d.category = $category,
                        d.language = $language,
                        d.upload_date = $upload_date
                    """,
                    document_id=document_id,
                    filename=document_data.get("filename"),
                    category=document_data.get("category"),
                    language=document_data.get("language"),
                    upload_date=document_data.get("upload_date")
                )
                logger.info(f"Created document node: {document_id}")
        except Exception as e:
            logger.error(f"Failed to create document node: {e}")
    
    async def create_chunk_nodes(self, document_id: str, chunks: List[Dict[str, Any]]):
        """Create chunk nodes and relationships"""
        if not self.driver:
            return
        
        try:
            with self.driver.session() as session:
                for chunk in chunks:
                    session.run(
                        """
                        MATCH (d:Document {id: $document_id})
                        CREATE (c:Chunk {
                            id: $chunk_id,
                            content: $content,
                            chunk_index: $chunk_index,
                            language: $language
                        })
                        CREATE (d)-[:HAS_CHUNK]->(c)
                        """,
                        document_id=document_id,
                        chunk_id=chunk["id"],
                        content=chunk["content"][:500],  # Truncate for graph storage
                        chunk_index=chunk["chunk_index"],
                        language=chunk["language"]
                    )
                logger.info(f"Created {len(chunks)} chunk nodes for document: {document_id}")
        except Exception as e:
            logger.error(f"Failed to create chunk nodes: {e}")
    
    async def create_category_relationships(self, category: str):
        """Create category-based relationships"""
        if not self.driver:
            return
        
        try:
            with self.driver.session() as session:
                # Create category node
                session.run(
                    """
                    MERGE (cat:Category {name: $category})
                    """,
                    category=category
                )
                
                # Link documents to category
                session.run(
                    """
                    MATCH (d:Document {category: $category})
                    MATCH (cat:Category {name: $category})
                    MERGE (cat)-[:CONTAINS]->(d)
                    """,
                    category=category
                )
                
                logger.info(f"Created category relationships for: {category}")
        except Exception as e:
            logger.error(f"Failed to create category relationships: {e}")
    
    async def find_similar_documents(self, document_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Find similar documents based on graph relationships"""
        if not self.driver:
            return []
        
        try:
            with self.driver.session() as session:
                result = session.run(
                    """
                    MATCH (d1:Document {id: $document_id})-[:HAS_CHUNK]->(c1:Chunk)
                    MATCH (d2:Document)-[:HAS_CHUNK]->(c2:Chunk)
                    WHERE d1 <> d2 AND d1.category = d2.category
                    RETURN d2.id as document_id, d2.filename as filename, 
                           count(*) as similarity_score
                    ORDER BY similarity_score DESC
                    LIMIT $limit
                    """,
                    document_id=document_id,
                    limit=limit
                )
                
                similar_docs = []
                for record in result:
                    similar_docs.append({
                        "document_id": record["document_id"],
                        "filename": record["filename"],
                        "similarity_score": record["similarity_score"]
                    })
                
                return similar_docs
                
        except Exception as e:
            logger.error(f"Failed to find similar documents: {e}")
            return []
    
    async def get_category_graph(self, category_id: str) -> Dict[str, Any]:
        """Get knowledge graph for a category"""
        if not self.driver:
            return {"nodes": [], "edges": []}
        
        try:
            with self.driver.session() as session:
                # Get nodes
                nodes_result = session.run(
                    """
                    MATCH (cat:Category {name: $category})-[:CONTAINS]->(d:Document)
                    OPTIONAL MATCH (d)-[:HAS_CHUNK]->(c:Chunk)
                    RETURN d.id as doc_id, d.filename as filename, 
                           count(c) as chunk_count
                    """,
                    category=category_id
                )
                
                nodes = []
                for record in nodes_result:
                    nodes.append({
                        "id": record["doc_id"],
                        "label": record["filename"],
                        "type": "document",
                        "chunk_count": record["chunk_count"]
                    })
                
                # Get relationships
                edges_result = session.run(
                    """
                    MATCH (cat:Category {name: $category})-[:CONTAINS]->(d1:Document)
                    MATCH (cat)-[:CONTAINS]->(d2:Document)
                    WHERE d1 <> d2
                    RETURN d1.id as source, d2.id as target, 'same_category' as type
                    """,
                    category=category_id
                )
                
                edges = []
                for record in edges_result:
                    edges.append({
                        "source": record["source"],
                        "target": record["target"],
                        "type": record["type"]
                    })
                
                return {
                    "nodes": nodes,
                    "edges": edges,
                    "category": category_id
                }
                
        except Exception as e:
            logger.error(f"Failed to get category graph: {e}")
            return {"nodes": [], "edges": []}
    
    async def delete_document_graph(self, document_id: str):
        """Delete document and related nodes from graph"""
        if not self.driver:
            return
        
        try:
            with self.driver.session() as session:
                session.run(
                    """
                    MATCH (d:Document {id: $document_id})
                    OPTIONAL MATCH (d)-[:HAS_CHUNK]->(c:Chunk)
                    DETACH DELETE d, c
                    """,
                    document_id=document_id
                )
                logger.info(f"Deleted document graph: {document_id}")
        except Exception as e:
            logger.error(f"Failed to delete document graph: {e}")