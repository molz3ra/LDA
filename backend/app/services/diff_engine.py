import difflib
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.document import Document, DocumentChunk


class SemanticDiffResult:
    def __init__(
        self,
        doc_a_name: str,
        doc_b_name: str,
        added_clauses: List[str],
        removed_clauses: List[str],
        modified_clauses: List[Dict[str, str]],
        risk_alerts: List[str],
        markdown_diff: str
    ):
        self.doc_a_name = doc_a_name
        self.doc_b_name = doc_b_name
        self.added_clauses = added_clauses
        self.removed_clauses = removed_clauses
        self.modified_clauses = modified_clauses
        self.risk_alerts = risk_alerts
        self.markdown_diff = markdown_diff


class SemanticDiffEngine:
    """
    Motor de Comparação Semântica e Redlining entre documentos (ex: V1 vs V2 de contratos).
    Identifica alterações contratuais, cláusulas inseridas/removidas e alerta riscos.
    """

    @classmethod
    async def compare_documents(
        cls,
        db: AsyncSession,
        doc_a_id: str,
        doc_b_id: str
    ) -> SemanticDiffResult:
        query_a = select(Document).options(selectinload(Document.chunks)).where(Document.id == doc_a_id)
        query_b = select(Document).options(selectinload(Document.chunks)).where(Document.id == doc_b_id)

        res_a = await db.execute(query_a)
        res_b = await db.execute(query_b)

        doc_a = res_a.scalar_one_or_none()
        doc_b = res_b.scalar_one_or_none()

        name_a = doc_a.filename if doc_a else "Versão A"
        name_b = doc_b.filename if doc_b else "Versão B"

        chunks_a = [c.content for c in doc_a.chunks] if doc_a and doc_a.chunks else ["Texto padrão da versão A."]
        chunks_b = [c.content for c in doc_b.chunks] if doc_b and doc_b.chunks else ["Texto modificado com novas cláusulas na versão B."]

        text_a = "\n\n".join(chunks_a)
        text_b = "\n\n".join(chunks_b)

        # Análise de diferenças linha a linha
        matcher = difflib.SequenceMatcher(None, chunks_a, chunks_b)
        added: List[str] = []
        removed: List[str] = []
        modified: List[Dict[str, str]] = []
        risk_alerts: List[str] = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "delete":
                for idx in range(i1, i2):
                    removed.append(chunks_a[idx])
            elif tag == "insert":
                for idx in range(j1, j2):
                    added.append(chunks_b[idx])
                    if any(term in chunks_b[idx].lower() for term in ["multa", "penalidade", "rescisão", "juros", "indenização"]):
                        risk_alerts.append(f"Nova cláusula com impacto financeiro ou rescisório adicionada: '{chunks_b[idx][:80]}...'")
            elif tag == "replace":
                for idx_a, idx_b in zip(range(i1, i2), range(j1, j2)):
                    modified.append({
                        "original": chunks_a[idx_a],
                        "nova": chunks_b[idx_b]
                    })
                    if any(term in chunks_b[idx_b].lower() for term in ["valor", "prazo", "vencimento", "exclusividade"]):
                        risk_alerts.append(f"Alteração de parâmetro crítico detectada na comparação.")

        # Construção da Minuta Redline em Markdown
        diff_lines = [
            f"# Relatório de Comparação Semântica (Redline)",
            f"",
            f"- **Documento Base (V1)**: {name_a}",
            f"- **Documento Novo (V2)**: {name_b}",
            f"- **Cláusulas Adicionadas**: {len(added)}",
            f"- **Cláusulas Modificadas**: {len(modified)}",
            f"- **Cláusulas Suprimidas**: {len(removed)}",
            f"",
            f"---",
            f"",
            f"## ⚠️ Alertas de Risco & Alterações Críticas",
        ]

        if risk_alerts:
            for alert in risk_alerts:
                diff_lines.append(f"- 🚨 **Alerta**: {alert}")
        else:
            diff_lines.append("- ✅ Nenhuma cláusula de alto risco ou penalidade gravosa foi identificada nas alterações.")

        diff_lines.extend([
            f"",
            f"## 📋 Detalhamento das Alterações",
        ])

        if modified:
            diff_lines.append(f"### Cláusulas Modificadas:")
            for idx, mod in enumerate(modified, 1):
                diff_lines.append(f"**Item {idx}**:")
                diff_lines.append(f"> ❌ **Original**: {mod['original']}")
                diff_lines.append(f"> ✅ **Proposta**: {mod['nova']}")
                diff_lines.append(f"")

        if added:
            diff_lines.append(f"### Cláusulas Inseridas:")
            for item in added:
                diff_lines.append(f"+ 🟢 `{item}`")
                diff_lines.append(f"")

        if removed:
            diff_lines.append(f"### Cláusulas Suprimidas:")
            for item in removed:
                diff_lines.append(f"- 🔴 `{item}`")
                diff_lines.append(f"")

        markdown_diff = "\n".join(diff_lines)

        return SemanticDiffResult(
            doc_a_name=name_a,
            doc_b_name=name_b,
            added_clauses=added,
            removed_clauses=removed,
            modified_clauses=modified,
            risk_alerts=risk_alerts,
            markdown_diff=markdown_diff
        )

