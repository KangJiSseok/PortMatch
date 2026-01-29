from typing import Any

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from graph.company_graph import build_graph
from graph.state import CompanyGraphState
from web.schemas.company_project_analysis import (
    CompanyProjectAnalysisRequest,
    CompanyProjectAnalysisResponse,
)


from web.services.gemini_embeddings import embed_texts

# load_dotenv()

load_dotenv()

app = FastAPI(title="Inference API")


@app.post(
    "/api/company-project-analysis", response_model=CompanyProjectAnalysisResponse
)
def get_structured_projects(
    payload: CompanyProjectAnalysisRequest,
) -> CompanyProjectAnalysisResponse:
    company_name = payload.company_name.strip()
    if not company_name:
        raise HTTPException(status_code=400, detail="company_name is required")

    graph = build_graph()
    initial_state: CompanyGraphState = {"company_name": company_name}
    result: Any = graph.invoke(initial_state)
    structured = result.get("structured_projects", [])
    if not isinstance(structured, list):
        structured = []
    return CompanyProjectAnalysisResponse(projects=structured)

# embedding
# ----- ?ë² ??(Spring???ì¤??ë§ë¤?´ì ?¬ê¸°???ì§) -----
class EmbeddingsRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1)
    model: Optional[str] = None


class EmbeddingsResponse(BaseModel):
    model: str
    dim: int
    vectors: List[List[float]]


@app.post("/embeddings", response_model=EmbeddingsResponse)
def embeddings(payload: EmbeddingsRequest) -> EmbeddingsResponse:
    # ========== ?ë²ê¹?==========
    print("=" * 60)
    print("?µ EMBEDDINGS REQUEST RECEIVED")
    print(f"Payload: {payload}")
    print(f"Texts: {payload.texts}")
    print(f"Model: {payload.model}")
    print("=" * 60)
    # ============================

    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")

    model = (payload.model or os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")).strip()
    output_dim = int(os.getenv("GEMINI_OUTPUT_DIMENSIONS", "1536"))

    texts = [(t or "").strip() for t in payload.texts]
    if any(not t for t in texts):
        raise HTTPException(status_code=400, detail="texts contains empty string")

    try:
        print(f"?¢ Calling Gemini API with model: {model}")
        vectors = embed_texts(
            api_key=gemini_key,
            texts=texts,
            model=model,
            output_dimensionality=output_dim,
        )
        print(f"?¢ Success! Got {len(vectors)} vectors")
    except Exception as e:
        print(f"?´ Gemini API Error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail=f"embedding failed: {type(e).__name__}: {e}")

    if not vectors or not vectors[0]:
        raise HTTPException(status_code=502, detail="embedding failed: empty vectors")

    return EmbeddingsResponse(model=model, dim=len(vectors[0]), vectors=vectors)


# @app.get("/test-api-key")
# def test_api_key():
#     api_key = os.getenv("GEMINI_API_KEY")
#
#     if not api_key:
#         return {"status": "error", "message": "API key not found"}
#
#     try:
#         client = Gemini(api_key=api_key)
#         res = client.embeddings.create(
#             model="text-embedding-ada-002",
#             input=["test"]
#         )
#         return {
#             "status": "success",
#             "message": "API key works!",
#             "dimension": len(res.data[0].embedding)
#         }
#     except Exception as e:
#         return {
#             "status": "error",
#             "message": str(e),
#             "error_type": type(e).__name__
#         }
#
#


