from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.api.deps import get_current_user
from app.modules.knowledge.schemas import DocumentResponse, ChatRequest, ChatResponse, ChatSessionResponse, SessionRenameRequest, NoteCreate, NoteResponse, PodcastRequest, PodcastResponse, InfographicRequest, InfographicResponse
from app.modules.knowledge.service import knowledge_service, KnowledgeService
from app.modules.knowledge.models import KnowledgeDocument

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    doc = await knowledge_service.ingest_document(file, current_user)
    return doc.to_dict()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    return await knowledge_service.chat(request, current_user)

@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    current_user = Depends(get_current_user)
):
    docs = await knowledge_service.list_documents(current_user)
    return [d.to_dict() for d in docs]

@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user = Depends(get_current_user)
):
    await knowledge_service.delete_document(doc_id, current_user)
    return {"status": "deleted"}

@router.get("/chat/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions(
    current_user = Depends(get_current_user)
):
    return await knowledge_service.list_chat_sessions(current_user)

@router.get("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    current_user = Depends(get_current_user)
):
    return await knowledge_service.get_chat_session(session_id, current_user)

@router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user = Depends(get_current_user)
):
    await knowledge_service.delete_chat_session(session_id, current_user)
    return {"status": "deleted"}

@router.put("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
async def rename_chat_session(
    session_id: str,
    request: SessionRenameRequest,
    current_user = Depends(get_current_user)
):
    return await knowledge_service.rename_chat_session(session_id, request.title, current_user)

# --- Notes Endpoints ---

@router.get("/notes", response_model=List[NoteResponse])
async def list_notes(
    current_user = Depends(get_current_user)
):
    return await knowledge_service.list_notes(current_user)

@router.post("/notes", response_model=NoteResponse)
async def create_note(
    data: NoteCreate,
    current_user = Depends(get_current_user)
):
    return await knowledge_service.create_note(data, current_user)

@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: str,
    current_user = Depends(get_current_user)
):
    await knowledge_service.delete_note(note_id, current_user)
    return {"status": "deleted"}

@router.post("/podcast", response_model=PodcastResponse)
async def generate_podcast(
    request: PodcastRequest,
    current_user = Depends(get_current_user)
):
    return await knowledge_service.generate_audio_overview(request.document_ids, current_user, request.session_id)

@router.post("/infographic", response_model=InfographicResponse)
async def generate_infographic(
    request: InfographicRequest,
    current_user = Depends(get_current_user)
):
    return await knowledge_service.generate_infographic(request, current_user)

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    text = await knowledge_service.transcribe_audio(file, current_user)
    return {"text": text}
