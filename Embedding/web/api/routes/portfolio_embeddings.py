import os
import hashlib
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .gemini_embeddings import EmbeddingsResponse, run_embeddings

router = APIRouter()


class PortfolioEmbeddingsRequest(BaseModel):
    texts: List[str]
    model: str | None = None


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


@router.post("/embeddings/portfolio")
def portfolio_embeddings(payload: PortfolioEmbeddingsRequest):
    requested_model = (payload.model or "").strip()
    model = (requested_model or os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")).strip()
    if requested_model:
        print(f"[embeddings] requested_model={requested_model} resolved_model={model}")

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


@router.post("/embeddings/portfolio-tags")
def portfolio_tag_embeddings(payload: PortfolioEmbeddingsRequest):
    requested_model = (payload.model or "").strip()
    model = (requested_model or os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")).strip()
    if requested_model:
        print(f"[embeddings] requested_model={requested_model} resolved_model={model}")

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
