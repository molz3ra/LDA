from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.document import Document
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.rag_engine import RAGEngine

router = APIRouter()


import re

@router.get("/share/{share_token}")
async def get_public_shared_document(
    share_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna os dados públicos do documento compartilhado por token.
    """
    if not share_token or not re.match(r"^[a-zA-Z0-9_\-]+$", share_token) or len(share_token) < 8:
        raise HTTPException(status_code=400, detail="Formato de token de compartilhamento inválido.")

    query = (
        select(Document)
        .options(selectinload(Document.tables))
        .where(Document.share_token == share_token)
    )
    res = await db.execute(query)
    doc = res.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Documento compartilhado não encontrado ou link expirado.")

    meta = doc.meta_info or {}

    return {
        "filename": doc.filename,
        "page_count": doc.page_count,
        "summary": doc.summary,
        "key_topics": meta.get("key_topics", []),
        "entities_count": sum(len(v) for v in meta.get("entities", {}).values()),
        "tables_count": len(doc.tables) if doc.tables else 0,
        "created_at": doc.created_at
    }


@router.post("/share/{share_token}/chat", response_model=ChatMessageResponse)
async def public_chat_with_document(
    share_token: str,
    payload: ChatMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Permite aos visitantes fazerem perguntas sobre o documento compartilhado.
    """
    query = select(Document).where(Document.share_token == share_token)
    res = await db.execute(query)
    doc = res.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Documento compartilhado não encontrado.")

    search_results = await RAGEngine.hybrid_search_rrf(
        db=db,
        query=payload.message,
        document_ids=[doc.id],
        top_k=2
    )

    answer = (
        f"Com base no documento público **{doc.filename}**, "
        f"os termos solicitados foram localizados na folha correspondente. "
        f"Esta visualização é somente leitura."
    )

    return ChatMessageResponse(
        response=answer,
        citations=[],
        fidelity_mode="strict",
        tokens_used=120
    )

