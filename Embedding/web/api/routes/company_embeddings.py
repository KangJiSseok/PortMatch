from fastapi import APIRouter

from .gemini_embeddings import EmbeddingsRequest, EmbeddingsResponse, run_embeddings

router = APIRouter()


@router.post("/embeddings/company", response_model=EmbeddingsResponse)
def company_embeddings(payload: EmbeddingsRequest) -> EmbeddingsResponse:
    return run_embeddings(payload.texts, payload.model)
