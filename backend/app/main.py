from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar tabelas no banco de dados se não existirem
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Aviso de inicialização de banco (pode estar conectando ao container): {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend API do LDA (Leitura de Arquivos) - RAG Multimodal & Document Intelligence",
    lifespan=lifespan
)

# Configuração de CORS para permitir acesso local do Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "LDA - Leitura de Arquivos API operacional",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

