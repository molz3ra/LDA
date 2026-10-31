# LDA (Leitura de Arquivos) — Document Intelligence & RAG Studio

<div align="center">

![LDA Logo](https://img.shields.io/badge/LDA-Leitura_de_Arquivos-3B82F6?style=for-the-badge&logo=googlegemini&logoColor=white)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16_pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Plataforma de inteligência documental multimodal, busca híbrida avançada e estúdio de recriação de documentos.**

</div>

---

## 🌟 Visão Geral

O **LDA (Leitura de Arquivos)** foi projetado para superar as limitações dos sistemas de RAG tradicionais. Ele combina:
- **Parser de Layout Profundo**: Preserva a ordem de leitura, tabelas estruturadas e coordenadas espaciais (`bounding boxes`) de PDFs complexos.
- **Contextual Retrieval & Fusão RRF**: Enriquecimento de chunks e busca híbrida de alta precisão (Dense Vector + BM25 Lexical).
- **Interface Minimalista Progressiva**: Inspirada no design limpo do **Gemini / Claude**, com foco absoluto no prompt e gavetas retráteis para o visualizador de PDF e estúdio de recriação (Canvas).
- **Recriação e Síntese**: Modos de geração para transformar relatórios e contratos em resumos executivos, checklists, tabelas comparativas e briefings em áudio.

---

## 🏗️ Arquitetura

```
LDA/
├── backend/                  # API FastAPI (Python 3.12)
│   ├── app/
│   │   ├── api/v1/          # Rotas: documents, chat, health
│   │   ├── core/            # Configurações e conexão assíncrona com PostgreSQL
│   │   ├── models/          # Entidades SQLAlchemy (Workspace, Document, Chunks, Tables)
│   │   └── schemas/         # Validação de dados com Pydantic V2
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Aplicação Next.js 15 (React 19 + Tailwind CSS)
│   └── src/
│       ├── app/             # App Router com tema Dark minimalista
│       └── components/      # UI components (Pill Input, Chat, PDF Drawer, Canvas)
├── docker-compose.yml        # PostgreSQL 16 com pgvector + Redis 7
├── .env.example              # Modelo de variáveis de ambiente
└── LICENSE                   # MIT License
```

---

## 🚀 Como Executar

### 1. Clonar e Configurar Variáveis
```bash
git clone https://github.com/molz3ra/LDA.git
cd LDA
cp .env.example .env
```

### 2. Subir Infraestrutura (Postgres com pgvector & Redis)
```bash
docker compose up -d postgres redis
```

### 3. Rodar o Backend
```bash
cd backend
python -m venv .venv
# No Windows:
.venv\Scripts\activate
# No Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
> Documentação interativa da API disponível em: `http://localhost:8000/docs`

### 4. Rodar o Frontend
```bash
cd frontend
npm install
npm run dev
```
> Acesse a interface em: `http://localhost:3000`

---

## 🛡️ Licença
Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.

