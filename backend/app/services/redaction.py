import re
from typing import Dict, Any, List, Tuple


class RedactionService:
    """
    Serviço determinístico de anonimização e conformidade com a LGPD / GDPR.
    Identifica e mascara dados pessoais sem custo de IA.
    """

    PATTERNS: Dict[str, Tuple[re.Pattern, str]] = {
        "cpf": (
            re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b"),
            "███.███.███-██"
        ),
        "cnpj": (
            re.compile(r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b"),
            "██.███.███/████-██"
        ),
        "email": (
            re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
            "████████@anonimizado.com"
        ),
        "telefone": (
            re.compile(r"(?:\(?\d{2}\)?\s*)?(?:9\d{4}|\d{4})[-.\s]?\d{4}\b"),
            "(██) 9████-████"
        ),
        "cartao": (
            re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"),
            "████-████-████-████"
        ),
        "rg": (
            re.compile(r"\b\d{1,2}\.\d{3}\.\d{3}-[0-9X|x]\b"),
            "██.███.███-█"
        )
    }

    @classmethod
    def redact_text(cls, text: str) -> Dict[str, Any]:
        """
        Substitui todas as ocorrências de dados sensíveis por tarjas pretas (███)
        e retorna estatísticas de redação.
        """
        redacted_text = text
        stats: Dict[str, int] = {}
        masked_items: List[Dict[str, str]] = []

        for category, (pattern, mask) in cls.PATTERNS.items():
            matches = pattern.findall(redacted_text)
            if matches:
                stats[category] = len(matches)
                for match in set(matches):
                    masked_items.append({"category": category, "original": match, "masked": mask})
                redacted_text = pattern.sub(mask, redacted_text)

        return {
            "redacted_text": redacted_text,
            "total_redactions": sum(stats.values()),
            "stats_by_category": stats,
            "masked_items": masked_items
        }

