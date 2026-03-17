from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl, Field

class DocumentBase(BaseModel):
    title: str
    filename: str
    file_size: int
    content_type: str = "application/pdf"

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    chunk_count: int = 0
    status: str = "processed"  # processed, error, processing

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    document_ids: Optional[List[str]] = None  # If None, search all available
    history: Optional[List[dict]] = None # List of {role: user/assistant, content: str}

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    session_id: Optional[str] = None

class ChatMessageSchema(BaseModel):
    role: str
    content: str
    sources: List[str] = []
    created_at: datetime

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    messages: List[ChatMessageSchema] = Field(default_factory=list)
    updated_at: datetime
    
class SessionRenameRequest(BaseModel):
    title: str
    
class NoteCreate(BaseModel):
    title: str
    content: str
    
class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

class PodcastRequest(BaseModel):
    document_ids: List[str]
    session_id: Optional[str] = None

class PodcastResponse(BaseModel):
    audio_url: str
    script: List[dict] # List of {speaker: str, text: str}
    session_id: Optional[str] = None

class InfographicRequest(BaseModel):
    document_ids: List[str]
    session_id: Optional[str] = None
    style: Optional[str] = "clean and professional"

class InfographicResponse(BaseModel):
    image_url: str
    summary_data: dict
    session_id: Optional[str] = None
