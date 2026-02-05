from fastapi import FastAPI

from .routes.parse import router as parse_router
from .routes.embeddings import router as embeddings_router
from .routes.celery_status import router as celery_router
app = FastAPI()
app.include_router(parse_router)
app.include_router(embeddings_router)

app.include_router(celery_router)
@app.get("/health")
def health_check():
    return {"status": "ok"}