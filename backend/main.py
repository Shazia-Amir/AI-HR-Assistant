"""FastAPI main application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routes.chat import router as chat_router
from routes.feedback import router as feedback_router
from routes.analytics import router as analytics_router
from routes.documents import router as documents_router
from routes.health import router as health_router
from rag.pipeline import rag_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI HR Assistant Backend...")
    try:
        rag_pipeline.initialize()
        logger.info("RAG pipeline initialized successfully.")
    except Exception as e:
        logger.warning(f"RAG pipeline initialization deferred: {e}")
    yield
    logger.info("Shutting down AI HR Assistant Backend...")


app = FastAPI(
    title="AI HR Assistant API",
    description="Production-ready RAG-powered HR assistant with analytics dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

_cors_origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    # allow_credentials requires explicit origins (not "*")
    allow_credentials=("*" not in _cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    response = await call_next(request)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


app.include_router(health_router, tags=["Health"])
app.include_router(chat_router, tags=["Chat"])
app.include_router(feedback_router, tags=["Feedback"])
app.include_router(analytics_router, tags=["Analytics"])
app.include_router(documents_router, tags=["Documents"])


@app.get("/")
async def root():
    return {
        "name": "AI HR Assistant API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
