"""Health check route."""

from fastapi import APIRouter

from models.schemas import HealthResponse
from config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    services_status = {
        "openrouter": bool(settings.openrouter_api_key),
        "supabase": bool(settings.supabase_url and settings.supabase_service_role_key),
        "vector_store": True,
    }

    all_healthy = all(services_status.values())
    status = "healthy" if all_healthy else "degraded"

    return HealthResponse(
        status=status,
        version="1.0.0",
        services=services_status,
    )
