from datetime import datetime
from typing import Optional, List, ClassVar, Dict, Any
from pydantic import Field, BaseModel
from app.odm.document import Document

class KnowledgeDocument(Document):
    """
    Knowledge document for RAG-based chat.
    Stores extracted text chunks from uploaded PDFs.
    """
    __collection_name__ = "knowledge_documents"

    title: str
    filename: str
    file_size: int
    content_type: str = "application/pdf"
    storage_path: str  # Path where file is stored (local)
    chunk_count: int = 0
    chunks: List[str] = Field(default_factory=list)  # Extracted text chunks
    status: str = "pending" # pending, processing, processed, error
    error_message: Optional[str] = None
    
    # User ownership
    user_id: str

class KnowledgeChatMessage(BaseModel):
    role: str  # user or assistant
    content: str
    sources: Optional[List[str]] = Field(default_factory=list)
    infographic_data: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class KnowledgeChatSession(Document):
    """
    Groups messages together into a single chat experience.
    """
    __collection_name__: ClassVar[str] = "knowledge_chat_sessions"
    
    title: str = Field(default="New Chat")
    user_id: str
    messages: List[KnowledgeChatMessage] = Field(default_factory=list)

class KnowledgeNote(Document):
    """
    A saved note or pinned artifact created by the user from Notebook queries.
    """
    __collection_name__: ClassVar[str] = "knowledge_notes"
    
    title: str
    content: str
    user_id: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
