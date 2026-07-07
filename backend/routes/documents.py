"""Documents and logs routes."""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from models.schemas import DocumentInfo, LogEntry
from rag.document_loader import DocumentLoader
from rag.pipeline import rag_pipeline
from config import settings
from services.supabase_service import supabase_service

router = APIRouter()


@router.get("/documents", response_model=List[DocumentInfo])
async def get_documents():
    try:
        loader = DocumentLoader(settings.documents_dir)
        docs = loader.get_document_list()
        return [DocumentInfo(**d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Documents error: {str(e)}")


@router.get("/logs", response_model=List[LogEntry])
async def get_logs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
):
    try:
        if search:
            records = supabase_service.search_chat_history(search)
        else:
            records = supabase_service.get_chat_history(limit=limit, offset=offset)

        logs = []
        for r in records:
            logs.append(
                LogEntry(
                    id=r.get("id", ""),
                    timestamp=r.get("created_at", ""),
                    employee_name=r.get("employee_name", ""),
                    employee_id=r.get("employee_id", ""),
                    question=r.get("question", ""),
                    response_time_ms=r.get("response_time_ms", 0),
                    confidence=r.get("confidence_score", 0),
                    feedback=r.get("feedback"),
                    flagged=r.get("flagged", False),
                )
            )
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logs error: {str(e)}")


@router.post("/documents/rebuild")
async def rebuild_vector_store():
    try:
        count = rag_pipeline.rebuild()
        return {"success": True, "message": f"Vector store rebuilt with {count} chunks"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rebuild error: {str(e)}")
