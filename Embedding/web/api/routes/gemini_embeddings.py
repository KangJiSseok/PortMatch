from typing import List, Optional
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from web.services.gemini_embeddings import embed_texts_gemini

router = APIRouter()


class GeminiEmbeddingsRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1)
    model: Optional[str] = None


class GeminiEmbeddingsResponse(BaseModel):
    model: str
    dim: int
    vectors: List[List[float]]


@router.post("/embeddings/gemini", response_model=GeminiEmbeddingsResponse)
def gemini_embeddings(payload: GeminiEmbeddingsRequest) -> GeminiEmbeddingsResponse:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GMS_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")

    resolved_model = (payload.model or "models/gemini-embedding-001").strip()
    output_dim = int(os.getenv("GEMINI_OUTPUT_DIMENSIONS", "1536"))
    texts = [(t or "").strip() for t in payload.texts]
    if not texts or any(not t for t in texts):
        raise HTTPException(status_code=400, detail="texts contains empty string")

    try:
        vectors = embed_texts_gemini(
            api_key=api_key,
            texts=texts,
            model=resolved_model,
            output_dimensionality=output_dim,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"embedding failed: {type(exc).__name__}: {exc}") from exc

    if not vectors or not vectors[0]:
        raise HTTPException(status_code=502, detail="embedding failed: empty vectors")

    return GeminiEmbeddingsResponse(model=resolved_model, dim=len(vectors[0]), vectors=vectors)
