"""Analytics and stats routes."""

from fastapi import APIRouter, HTTPException

from models.schemas import AnalyticsResponse, StatsResponse
from services.analytics_engine import AnalyticsEngine

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    try:
        stats = AnalyticsEngine.compute_stats()
        return StatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats error: {str(e)}")


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics():
    try:
        analytics = AnalyticsEngine.compute_analytics()
        return AnalyticsResponse(**analytics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")
