"""Feedback route: allow HR/employees to rate AI responses."""

from fastapi import APIRouter, HTTPException

from models.schemas import FeedbackRequest, FeedbackResponse
from services.supabase_service import supabase_service

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest):
    try:
        result = supabase_service.update_feedback(
            request.chat_id,
            request.feedback,
            request.flagged,
            request.notes,
        )
        if not result:
            raise HTTPException(status_code=404, detail="Chat record not found")
        return FeedbackResponse(
            success=True,
            message=f"Feedback '{request.feedback}' recorded for chat {request.chat_id}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {str(e)}")
