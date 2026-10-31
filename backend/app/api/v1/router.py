from fastapi import APIRouter
from app.api.v1 import health, documents, chat, audio, metrics

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(audio.router, prefix="/audio", tags=["Audio Briefing"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Metrics & Observability"])
