from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    filename: str
    file_size_bytes: int
    mime_type: str = "application/pdf"


class DocumentCreate(DocumentBase):
    workspace_id: Optional[str] = None


class ExtractedTableResponse(BaseModel):
    id: str
    page_number: int
    title: Optional[str] = None
    markdown_content: str
    raw_data: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True


class DocumentResponse(DocumentBase):
    id: str
    workspace_id: Optional[str] = None
    status: str
    page_count: int
    summary: Optional[str] = None
    meta_info: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    tables: List[ExtractedTableResponse] = []


class DocumentXRayResponse(BaseModel):
    document_id: str
    filename: str
    page_count: int
    status: str
    summary: Optional[str] = None
    entities: Dict[str, List[str]] = Field(default_factory=dict)
    key_topics: List[str] = Field(default_factory=list)
    tables_count: int = 0


class DocumentDiffRequest(BaseModel):
    doc_a_id: str
    doc_b_id: str


class DocumentDiffResponse(BaseModel):
    doc_a_name: str
    doc_b_name: str
    added_clauses_count: int
    removed_clauses_count: int
    modified_clauses_count: int
    risk_alerts: List[str] = []
    markdown_diff: str
