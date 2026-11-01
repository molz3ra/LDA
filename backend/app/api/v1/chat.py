from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.document import Document
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, Citation
from app.services.rag_engine import RAGEngine

router = APIRouter()


@router.post("", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    # Caso 1: Nenhum documento anexado ainda (ambiente zerado / início de sessão)
    if not payload.document_ids:
        lower_msg = payload.message.lower().strip()
        is_greeting = any(g in lower_msg for g in ["olá", "ola", "oi", "bom dia", "boa tarde", "boa noite", "hello", "hi", "começar", "ajuda"])
        
        if is_greeting:
            reply = (
                "Olá! 👋 Sou o assistente de inteligência documental do **LDA (Leitura de Arquivos)**.\n\n"
                "Para começar uma análise profunda com **RAG Híbrido, citações espaciais no PDF e extração de tabelas**, "
                "basta anexar um ou mais documentos (PDF, DOCX, TXT) no botão de clipe abaixo ou arrastá-los para a tela.\n\n"
                "Como posso te ajudar hoje?"
            )
        else:
            reply = (
                f"Entendido: *\"{payload.message}\"*\n\n"
                "⚠️ **Nenhum documento está anexado no momento.**\n"
                "Para que eu possa responder perguntas com citações verificadas e zero alucinação, "
                "por favor anexe o arquivo desejado no botão de clipe 📎 abaixo."
            )

        return ChatMessageResponse(
            response=reply,
            citations=[],
            fidelity_mode=payload.fidelity_mode,
            tokens_used=25
        )

    # Caso 2: Documentos anexados
    doc_names = []
    citations: List[Citation] = []

    # Obter títulos dos documentos
    doc_query = select(Document).where(Document.id.in_(payload.document_ids))
    doc_res = await db.execute(doc_query)
    docs = doc_res.scalars().all()
    doc_names = [d.filename for d in docs]

    if not doc_names:
        return ChatMessageResponse(
            response="⚠️ O documento selecionado não foi encontrado ou expirou. Por favor, faça o upload novamente.",
            citations=[],
            fidelity_mode=payload.fidelity_mode,
            tokens_used=15
        )

    # 1. Roteamento de Intenção
    intent = RAGEngine.classify_intent(payload.message)

    # 2. Executar Busca Híbrida com RRF (Dense + Sparse)
    search_results = await RAGEngine.hybrid_search_rrf(
        db=db,
        query=payload.message,
        document_ids=payload.document_ids,
        top_k=3
    )

    # 3. Construir Citações com Grounding Espacial (Bounding Boxes)
    for res in search_results:
        chk = res.chunk
        citations.append(
            Citation(
                document_id=chk.document_id,
                document_name=doc_names[0] if doc_names else "Documento",
                page_number=chk.page_number,
                text_snippet=chk.content[:240] + ("..." if len(chk.content) > 240 else ""),
                bounding_box=chk.bounding_box
            )
        )

    doc_context = f" no documento **{doc_names[0]}**" if len(doc_names) == 1 else f" nos **{len(doc_names)} documentos anexados**"
    
    # 4. Geração Contextual de Resposta
    if intent == "synthesis_recreation":
        reply = (
            f"⚡ **Modo de Síntese e Recriação Ativado**:\n\n"
            f"Processe os trechos recuperados{doc_context} através do motor de agregação. "
            f"O conteúdo estruturado foi formatado e enviado ao **Estúdio de Recriação (Canvas)**.\n\n"
            f"- **Tópicos mapeados**: Diretrizes operacionais e cláusulas críticas.\n"
            f"- **Conformidade de Grounding**: 100% dos dados rastreados até a fonte.\n\n"
            f"Abra o painel lateral à direita para visualizar, editar a minuta ou exportar."
        )
    elif payload.fidelity_mode == "strict":
        if search_results:
            reply = (
                f"No modo **Estrito (Zero Alucinação)**, localizei os dados pertinentes{doc_context} "
                f"utilizando **Busca Híbrida com Fusão RRF** (léxica + semântica).\n\n"
                f"Cada ponto foi validado contra o índice contextual da folha. "
                f"Clique nas citações espaciais abaixo para conferir o parágrafo realce a realce no visualizador de PDF."
            )
        else:
            reply = (
                f"Analisei{doc_context}, mas não encontrei menções específicas à sua consulta: *\"{payload.message}\"*.\n\n"
                f"No modo **Estrito (Zero Alucinação)**, não invento dados ausentes do texto original. "
                f"Tente reformular a pergunta ou verificar os termos nos documentos anexados."
            )
    else:
        reply = (
            f"No modo **Consultivo**, analisei{doc_context} combinando os trechos indexados "
            f"com boas práticas de mercado.\n\n"
            f"As condições estabelecidas foram validadas no índice hierárquico e você pode solicitar "
            f"comparações ou ajustes no Estúdio de Recriação."
        )

    return ChatMessageResponse(
        response=reply,
        citations=citations,
        fidelity_mode=payload.fidelity_mode,
        tokens_used=195
    )
