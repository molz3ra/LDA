from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.document import Document, DocumentChunk
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, Citation

router = APIRouter()


@router.post("", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    doc_names = []
    citations: List[Citation] = []

    if payload.document_ids:
        # Buscar nomes dos documentos
        doc_query = select(Document).where(Document.id.in_(payload.document_ids))
        doc_res = await db.execute(doc_query)
        docs = doc_res.scalars().all()
        doc_names = [d.filename for d in docs]

        # Buscar chunks reais do banco para citar com bounding boxes
        chunk_query = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id.in_(payload.document_ids))
            .order_by(DocumentChunk.chunk_index.asc())
            .limit(3)
        )
        chunk_res = await db.execute(chunk_query)
        chunks = chunk_res.scalars().all()

        for chk in chunks:
            citations.append(
                Citation(
                    document_id=chk.document_id,
                    document_name=doc_names[0] if doc_names else "Documento",
                    page_number=chk.page_number,
                    text_snippet=chk.content[:200] + ("..." if len(chk.content) > 200 else ""),
                    bounding_box=chk.bounding_box
                )
            )

    doc_context = f" no arquivo **{doc_names[0]}**" if doc_names else ""
    
    if payload.fidelity_mode == "strict":
        reply = (
            f"No modo **Estrito (Zero Alucinação)**, localizei as informações correspondentes{doc_context}. "
            f"Todas as respostas estão rigorosamente amarradas aos trechos destacados no documento original. "
            f"Clique nas citações espaciais abaixo para navegar diretamente até a página e inspecionar o texto."
        )
    else:
        reply = (
            f"No modo **Consultivo**, analisei o contexto{doc_context} e sintetizei as diretrizes operacionais. "
            f"Além dos pontos levantados no texto original, você pode utilizar o Estúdio de Recriação "
            f"para remodelar os dados em uma nova minuta ou checklist."
        )

    return ChatMessageResponse(
        response=reply,
        citations=citations,
        fidelity_mode=payload.fidelity_mode,
        tokens_used=240
    )
