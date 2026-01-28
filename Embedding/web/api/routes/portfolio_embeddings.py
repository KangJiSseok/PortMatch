import os
import hashlib
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .common import EmbeddingsResponse, run_embeddings

router = APIRouter()


class PortfolioEmbeddingsRequest(BaseModel):
    texts: List[str]
    model: str | None = None


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


@router.post("/embeddings/portfolio")
def portfolio_embeddings(payload: PortfolioEmbeddingsRequest):
    model = (payload.model or os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")).strip()

    texts = payload.texts
    if not isinstance(texts, list) or not texts:
        raise HTTPException(status_code=400, detail="texts(array) is required")

    hashes = [sha256_hex((t or "").strip()) for t in texts]

    result: EmbeddingsResponse = run_embeddings(texts, model)
    return {
        "model": result.model,
        "dim": result.dim,
        "vectors": result.vectors,
        "embeddings": [
            {"index": i, "content_hash": hashes[i], "embedding": result.vectors[i]}
            for i in range(len(result.vectors))
        ],
    }
