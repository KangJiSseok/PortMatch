from fastapi import APIRouter

from .gemini_embeddings import (
    GeminiEmbeddingsRequest,
    GeminiEmbeddingsResponse,
    run_embeddings,
)

router = APIRouter()


@router.post("/embeddings/company", response_model=GeminiEmbeddingsResponse)
def company_embeddings(payload: GeminiEmbeddingsRequest) -> GeminiEmbeddingsResponse:
    return run_embeddings(payload.texts, payload.model)
