from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class Citation(BaseModel):
    document_id: str
    document_name: str
    page_number: int
    text_snippet: str
    bounding_box: Optional[Dict[str, Any]] = None # {page, x, y, width, height}


class ChatMessageRequest(BaseModel):
    message: str
    workspace_id: Optional[str] = None
    document_ids: Optional[List[str]] = Field(default_factory=list)
    fidelity_mode: str = Field(default="strict", description="'strict' ou 'consultative'")
    target_pages: Optional[List[int]] = None


class ChatMessageResponse(BaseModel):
    response: str
    citations: List[Citation] = Field(default_factory=list)
    fidelity_mode: str
    tokens_used: Optional[int] = None

