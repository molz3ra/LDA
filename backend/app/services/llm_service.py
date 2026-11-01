import os
import httpx
from typing import List, Optional
from app.core.config import settings


class LLMService:
    """
    Integração direta com o Google Gemini API para geração de respostas fundamentadas (Grounded RAG).
    Utiliza fallbacks graduais de modelos Flash (gemini-3.5-flash, gemini-3.7-flash, gemini-3.8-flash).
    """

    CANDIDATE_MODELS = [
        "gemini-3.5-flash",
        "gemini-3.7-flash",
        "gemini-3.8-flash"
    ]

    @classmethod
    async def generate_rag_answer(
        cls,
        query: str,
        context_chunks: List[str],
        doc_names: List[str],
        fidelity_mode: str = "strict"
    ) -> Optional[str]:
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        docs_label = ", ".join(doc_names) if doc_names else "Documento anexado"

        system_instruction = (
            "Você é o motor de inteligência documental do LDA (Leitura de Arquivos).\n"
            f"Modo de operação: {fidelity_mode.upper()} ({'Zero Alucinação com aderência estrita ao texto' if fidelity_mode == 'strict' else 'Consultivo e Analítico'}).\n\n"
            "Diretrizes obrigatórias:\n"
            "1. Responda em Português do Brasil com clareza, formatação Markdown rica e profissional.\n"
            "2. Baseie sua resposta estritamente nas evidências dos trechos fornecidos.\n"
            "3. Se houver valores, datas, nomes ou cláusulas, mencione-os explicitamente com precisão.\n"
            "4. Se a resposta não estiver nos trechos fornecidos, informe que a informação não foi localizada nos documentos indexados sem inventar dados."
        )

        prompt_body = f"Documentos analisados: {docs_label}\n\n"
        prompt_body += "Trechos recuperados pelo RAG Híbrido (RRF k=60):\n"
        for i, chk in enumerate(context_chunks, 1):
            prompt_body += f"\n[Trecho {i}]:\n{chk}\n"

        prompt_body += f"\nPergunta do usuário: {query}\n\nResposta fundamentada:"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_body}
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [
                    {"text": system_instruction}
                ]
            },
            "generationConfig": {
                "temperature": 0.2 if fidelity_mode == "strict" else 0.5,
                "maxOutputTokens": 800
            }
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            for model_name in cls.CANDIDATE_MODELS:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                try:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
                except Exception:
                    continue

        return None
