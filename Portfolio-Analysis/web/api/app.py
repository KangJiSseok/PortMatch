import logging

from fastapi import FastAPI

from .routes.parse import router as parse_router
from .routes.embeddings import router as embeddings_router

logging.basicConfig(level=logging.INFO)

app = FastAPI()
app.include_router(parse_router)
app.include_router(embeddings_router)
