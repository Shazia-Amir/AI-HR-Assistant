"""Chat route: RAG-powered Q&A with streaming support."""

import json
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest, ChatResponse, SourceDocument
from rag.pipeline import rag_pipeline
from services.supabase_service import supabase_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        answer, sources, confidence, response_time_ms = await rag_pipeline.answer(
            request.question
        )

        chat_id = str(uuid.uuid4())
        source_docs = [SourceDocument(**s) for s in sources]

        record = {
            "id": chat_id,
            "employee_name": request.employee_name,
            "employee_id": request.employee_id,
            "question": request.question,
            "ai_response": answer,
            "retrieved_context": " ".join(s["content"] for s in sources),
            "source_documents": sources,
            "confidence_score": confidence,
            "feedback": None,
            "flagged": False,
            "response_time_ms": response_time_ms,
        }

        try:
            supabase_service.insert_chat_record(record)
            supabase_service.upsert_employee(request.employee_name, request.employee_id)
        except Exception:
            pass

        return ChatResponse(
            id=chat_id,
            answer=answer,
            confidence=confidence,
            sources=source_docs,
            response_time_ms=response_time_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    try:
        sources, confidence, retrieval_time_ms, stream = await rag_pipeline.stream_answer(
            request.question
        )

        chat_id = str(uuid.uuid4())
        full_answer_parts: list[str] = []

        async def generate() -> AsyncGenerator[str, None]:
            try:
                yield f"data: {json.dumps({'type': 'metadata', 'chat_id': chat_id, 'confidence': confidence, 'sources': sources, 'retrieval_time_ms': retrieval_time_ms})}\n\n"

                async for chunk in stream:
                    full_answer_parts.append(chunk)
                    yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"

                full_answer = "".join(full_answer_parts)

                record = {
                    "id": chat_id,
                    "employee_name": request.employee_name,
                    "employee_id": request.employee_id,
                    "question": request.question,
                    "ai_response": full_answer,
                    "retrieved_context": " ".join(s["content"] for s in sources),
                    "source_documents": sources,
                    "confidence_score": confidence,
                    "feedback": None,
                    "flagged": False,
                    "response_time_ms": retrieval_time_ms,
                }

                try:
                    supabase_service.insert_chat_record(record)
                    supabase_service.upsert_employee(request.employee_name, request.employee_id)
                except Exception:
                    pass

                yield f"data: {json.dumps({'type': 'done', 'chat_id': chat_id})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stream error: {str(e)}")
