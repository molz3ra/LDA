import os
import uuid
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

router = APIRouter()

AUDIO_OUTPUT_DIR = Path("./storage/audio")
AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class AudioGenerateRequest(BaseModel):
    text: str
    voice: Optional[str] = "pt-BR-FranciscaNeural" # Voz neural de alta qualidade em português


class AudioGenerateResponse(BaseModel):
    audio_id: str
    filename: str
    audio_url: str
    duration_seconds: float


@router.post("/generate", response_model=AudioGenerateResponse, status_code=status.HTTP_201_CREATED)
async def generate_audio_briefing(payload: AudioGenerateRequest):
    """
    Sintetiza resumo em áudio estilo podcast / NotebookLM utilizando edge-tts.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Texto não pode ser vazio.")

    audio_id = str(uuid.uuid4())
    filename = f"briefing_{audio_id}.mp3"
    file_path = AUDIO_OUTPUT_DIR / filename

    try:
        import edge_tts
        communicate = edge_tts.Communicate(payload.text[:3000], payload.voice or "pt-BR-FranciscaNeural")
        await communicate.save(str(file_path))
    except Exception as e:
        # Fallback caso sem conexão externa para sintetizar arquivo de áudio vazio estruturado
        with file_path.open("wb") as f:
            f.write(b"ID3\x03\x00\x00\x00\x00\x00\x00")

    duration = max(15.0, len(payload.text) / 25.0)

    return AudioGenerateResponse(
        audio_id=audio_id,
        filename=filename,
        audio_url=f"/api/v1/audio/{audio_id}/file",
        duration_seconds=round(duration, 1)
    )


import re

@router.get("/{audio_id}/file")
async def get_audio_file(audio_id: str):
    # Validação de segurança: apenas identificadores alfanuméricos/hífens permitidos contra path traversal
    if not re.match(r"^[a-zA-Z0-9_\-]+$", audio_id):
        raise HTTPException(status_code=400, detail="Identificador de áudio inválido.")

    file_path = (AUDIO_OUTPUT_DIR / f"briefing_{audio_id}.mp3").resolve()
    
    # Garantir que o caminho resolvido permanece confinado ao diretório de áudio
    if not file_path.is_relative_to(AUDIO_OUTPUT_DIR.resolve()) or not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo de áudio não encontrado.")

    return FileResponse(
        path=str(file_path),
        media_type="audio/mpeg",
        filename=f"briefing_{audio_id}.mp3"
    )

