import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.document import Document, DocumentChunk, ExtractedTable
from app.schemas.document import DocumentResponse, DocumentDetailResponse, DocumentXRayResponse
from app.services.ingestion import DocumentIngestionService

router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    workspace_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith((".pdf", ".txt", ".md", ".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo não suportado. Envie arquivos PDF, TXT, MD ou DOCX."
        )

    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename

    # Gravar arquivo em disco
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo no disco: {str(e)}")

    file_size = file_path.stat().st_size

    # Executar pipeline de Ingestão e Document Intelligence
    try:
        ingestion = await DocumentIngestionService.process_document(str(file_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha na extração do documento: {str(e)}")

    # Criar registro principal do documento
    doc = Document(
        id=doc_id,
        workspace_id=workspace_id,
        filename=file.filename,
        file_path=str(file_path),
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/pdf",
        status="ready",
        page_count=ingestion.page_count,
        summary=ingestion.summary,
        meta_info={
            "entities": ingestion.entities,
            "key_topics": ingestion.key_topics,
            "tables_count": len(ingestion.tables)
        }
    )
    db.add(doc)

    # Persistir tabelas detectadas
    for tbl in ingestion.tables:
        table_record = ExtractedTable(
            id=str(uuid.uuid4()),
            document_id=doc_id,
            page_number=tbl["page_number"],
            title=tbl.get("title", "Tabela Detectada"),
            markdown_content=tbl["markdown_content"],
            raw_data=tbl.get("raw_data", [])
        )
        db.add(table_record)

    # Persistir chunks hierárquicos com bounding boxes
    for chk in ingestion.chunks:
        chunk_record = DocumentChunk(
            id=str(uuid.uuid4()),
            document_id=doc_id,
            chunk_index=chk["chunk_index"],
            page_number=chk["page_number"],
            content=chk["content"],
            context_header=chk.get("context_header"),
            bounding_box=chk.get("bounding_box")
        )
        db.add(chunk_record)

    await db.commit()
    await db.refresh(doc)

    return doc


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    workspace_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).order_by(Document.created_at.desc())
    if workspace_id:
        query = query.where(Document.workspace_id == workspace_id)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).options(selectinload(Document.tables)).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return doc


@router.get("/{document_id}/xray", response_model=DocumentXRayResponse)
async def get_document_xray(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).options(selectinload(Document.tables)).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    meta = doc.meta_info or {}
    entities = meta.get("entities", {})
    key_topics = meta.get("key_topics", [])

    return DocumentXRayResponse(
        document_id=doc.id,
        filename=doc.filename,
        page_count=doc.page_count,
        status=doc.status,
        summary=doc.summary,
        entities=entities,
        key_topics=key_topics,
        tables_count=len(doc.tables) if doc.tables else 0
    )


@router.get("/{document_id}/file")
async def download_document_file(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado")

    return FileResponse(
        path=doc.file_path,
        media_type=doc.mime_type,
        filename=doc.filename
    )
