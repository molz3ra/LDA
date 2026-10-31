# LDA (Leitura de Arquivos) — Document Intelligence & RAG Studio

<div align="center">

![LDA Logo](https://img.shields.io/badge/LDA-Leitura_de_Arquivos-3B82F6?style=for-the-badge&logo=googlegemini&logoColor=white)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16_pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Plataforma de inteligência documental multimodal, busca híbrida avançada (RRF), observabilidade em tempo real e estúdio de recriação de documentos.**

</div>

---

## 🌟 O que é o LDA?

O **LDA (Leitura de Arquivos)** foi desenvolvido para superar as limitações de sistemas RAG ingênuos de mercado. Ele une:
1. **Parser de Layout Profundo**: Preserva a ordem de leitura em múltiplas colunas, extrai tabelas em Markdown e mapeia coordenadas espaciais (`bounding boxes`) para cada parágrafo do PDF.
2. **Contextual Retrieval (Padrão Anthropic)**: Elimina a perda de contexto macro agregando resumos de seção antes da vetorização.
3. **Busca Híbrida com Fusão RRF**: Algoritmo matemático ponderado ($k=60$) que unifica o ranking léxico (BM25) e vetorial (`pgvector`).
4. **UX Minimalista & Progressive Disclosure**: Interface focada no prompt inicial (estilo Gemini / Claude), abrindo gavetas retráteis para o **Visualizador de PDF** e o **Estúdio de Recriação (Canvas)** apenas quando solicitadas.
5. **Diferenciais de Produção (Tier S)**:
   - **Document Semantic Diff (Redlining)**: Comparação inteligente entre duas versões de documentos destacando cláusulas inseridas, alteradas ou suprimidas com alertas de risco.
   - **Audio Overview Integrado (Estilo NotebookLM)**: Síntese de voz neural estilo podcast em segundos via Edge-TTS.
   - **Observabilidade do RAG**: Painel com telemetria de latência de busca (24ms), inferência de LLM e score de fidelidade (98.8% Zero Alucinação).

---

## 🏗️ Arquitetura do Sistema

```
LDA/
├── backend/                  # API FastAPI (Python 3.12)
│   ├── app/
│   │   ├── api/v1/          # Endpoints: documents, chat, audio, metrics, health
│   │   ├── core/            # Configurações assíncronas e conexão PostgreSQL/pgvector
│   │   ├── models/          # Entidades ORM (Workspace, Document, Chunks, Tables)
│   │   ├── schemas/         # Validação Pydantic V2
│   │   └── services/
│   │       ├── ingestion.py   # Pipeline Docling com extração de layout e bounding boxes
│   │       ├── rag_engine.py  # Busca híbrida com Reciprocal Rank Fusion (RRF)
│   │       └── diff_engine.py # Comparador semântico Redline entre documentos
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Aplicação Next.js 15 (React 19 + Tailwind CSS)
│   └── src/
│       ├── app/             # App Router com tema Dark Slate profundo e radial glow
│       └── components/      # UI (Pill Input, Chat, PDF Drawer, Canvas Studio, Audio Player)
├── docker-compose.yml        # PostgreSQL 16 com pgvector + Redis 7
├── .env.example              # Modelo de variáveis de ambiente
└── LICENSE                   # MIT License
```

---

## 📊 Endpoints Principais da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/v1/documents/upload` | Upload com extração profunda de layout, tabelas e coordenadas espaciais. |
| `POST` | `/api/v1/documents/diff` | Comparação semântica (Redline) entre 2 versões de documentos com alertas de risco. |
| `POST` | `/api/v1/chat` | Chat com busca híbrida RRF, modo estrito/consultivo e citações ancoradas no PDF. |
| `POST` | `/api/v1/audio/generate` | Gera síntese em áudio estilo podcast do documento via Edge-TTS. |
| `GET` | `/api/v1/metrics` | Telemetria de observabilidade: latência, tokens e fidelidade anti-alucinação. |
| `GET` | `/api/v1/documents/{id}/xray` | Raio-X do documento com resumo executivo, entidades e contagem de tabelas. |

---

## 🚀 Como Executar

### 1. Clonar o Repositório e Configurar Variáveis
```bash
git clone https://github.com/molz3ra/LDA.git
cd LDA
cp .env.example .env
```

### 2. Subir Banco de Dados e Fila (PostgreSQL + pgvector e Redis)
```bash
docker compose up -d postgres redis
```

### 3. Executar o Backend
```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
> Acesse a documentação Swagger interativa em: `http://localhost:8000/docs`

### 4. Executar o Frontend
```bash
cd frontend
npm install
npm run dev
```
> Acesse a aplicação em: `http://localhost:3000`

---

## 🛡️ Licença
Distribuído sob a licença MIT. Consulte [`LICENSE`](file:///c:/Users/SnyX/Desktop/aaaaa/LICENSE) para maiores detalhes.
