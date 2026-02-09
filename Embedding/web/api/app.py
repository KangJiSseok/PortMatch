from dotenv import load_dotenv
from fastapi import FastAPI

from .routes.company_embeddings import router as company_embeddings_router
from .routes.job_posting_embeddings import router as job_posting_embeddings_router
from .routes.portfolio_embeddings import router as portfolio_embeddings_router
from .routes.gemini_embeddings import router as gemini_embeddings_router
from .routes.portfolio_query import router as portfolio_query_router

load_dotenv()

app = FastAPI(title="Embedding API")
app.include_router(company_embeddings_router)
app.include_router(job_posting_embeddings_router)
app.include_router(portfolio_embeddings_router)
app.include_router(gemini_embeddings_router)
app.include_router(portfolio_query_router)
