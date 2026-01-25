from typing import List, Optional
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from web.services.openai_embeddings import embed_texts

router = APIRouter()


class EmbeddingsRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1)
    model: Optional[str] = None


class EmbeddingsResponse(BaseModel):
    model: str
    dim: int
    vectors: List[List[float]]


@router.post("/embeddings", response_model=EmbeddingsResponse)
def embeddings(payload: EmbeddingsRequest) -> EmbeddingsResponse:
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")

    model = (payload.model or os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")).strip()

    texts = [(t or "").strip() for t in payload.texts]
    if any(not t for t in texts):
        raise HTTPException(status_code=400, detail="texts contains empty string")

    try:
        vectors = embed_texts(api_key=openai_key, texts=texts, model=model)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"embedding failed: {type(exc).__name__}: {exc}") from exc

    if not vectors or not vectors[0]:
        raise HTTPException(status_code=502, detail="embedding failed: empty vectors")

    return EmbeddingsResponse(model=model, dim=len(vectors[0]), vectors=vectors)
