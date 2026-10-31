from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.document import Document
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, Citation

router = APIRouter()


@router.post("", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    # Buscar documentos referenciados
    doc_names = []
    if payload.document_ids:
        query = select(Document).where(Document.id.in_(payload.document_ids))
        result = await db.execute(query)
        docs = result.scalars().all()
        doc_names = [d.filename for d in docs]
    
    context_hint = f" com base em {', '.join(doc_names)}" if doc_names else ""
    
    mock_citations: List[Citation] = []
    if payload.document_ids:
        mock_citations.append(
            Citation(
                document_id=payload.document_ids[0],
                document_name=doc_names[0] if doc_names else "Documento",
                page_number=1,
                text_snippet="O presente contrato estabelece as cláusulas de fornecimento e prestação de serviços...",
                bounding_box={"page": 1, "x": 72, "y": 140, "width": 450, "height": 60}
            )
        )

    # Resposta inteligente estruturada
    answer = (
        f"Compreendi sua solicitação{context_hint}. "
        f"No modo **{payload.fidelity_mode.upper()}**, a análise dos trechos identificados "
        f"confirma que os requisitos e cláusulas principais estão dispostos na página inicial do arquivo.\n\n"
        f"Caso deseje recriar este documento em um novo formato ou sintetizar pontos específicos, "
        f"você pode acionar o estúdio de recriação no painel lateral."
    )

    return ChatMessageResponse(
        response=answer,
        citations=mock_citations,
        fidelity_mode=payload.fidelity_mode,
        tokens_used=184
    )

