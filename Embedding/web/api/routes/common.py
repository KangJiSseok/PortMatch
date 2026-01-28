from typing import List, Optional
import os

from fastapi import HTTPException
from pydantic import BaseModel, Field

from web.services.gemini_embeddings import embed_texts


class EmbeddingsRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1)
    model: Optional[str] = None


class EmbeddingsResponse(BaseModel):
    model: str
    dim: int
    vectors: List[List[float]]


def run_embeddings(texts: List[str], model: Optional[str]) -> EmbeddingsResponse:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")

    requested_model = (model or "").strip()
    resolved_model = (requested_model or os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")).strip()
    print(
        f"[embeddings] requested_model={requested_model or None} "
        f"resolved_model={resolved_model} texts={len(texts)}"
    )

    normalized = [(t or "").strip() for t in texts]
    if not normalized or any(not t for t in normalized):
        raise HTTPException(status_code=400, detail="texts contains empty string")

    try:
        vectors = embed_texts(api_key=gemini_key, texts=normalized, model=resolved_model)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"embedding failed: {type(exc).__name__}: {exc}") from exc

    if not vectors or not vectors[0]:
        raise HTTPException(status_code=502, detail="embedding failed: empty vectors")

    return EmbeddingsResponse(model=resolved_model, dim=len(vectors[0]), vectors=vectors)

