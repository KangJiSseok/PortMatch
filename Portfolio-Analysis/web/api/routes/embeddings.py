import json
import hashlib
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Request
from langchain_openai import OpenAIEmbeddings

router = APIRouter()


def render_project_text(p: Dict[str, Any]) -> str:
    name = (p.get("name") or "").strip()
    problem = (p.get("problem") or "").strip()
    solution = (p.get("solution") or "").strip()

    tech = p.get("tech") or []
    if isinstance(tech, list):
        tech_str = ", ".join([str(t).strip() for t in tech if t is not None and str(t).strip()])
    else:
        tech_str = str(tech).strip()

    return (
        f"[프로젝트명] {name}\n"
        f"[문제] {problem}\n"
        f"[해결] {solution}\n"
        f"[기술] {tech_str}"
    ).strip()


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


@router.post("/api/embeddings/portfolio")
async def embed_portfolio_projects(request: Request):
    raw = await request.body()
    if not raw:
        raise HTTPException(status_code=400, detail="JSON body is required")

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="invalid JSON body") from exc

    projects = data.get("projects")
    model = (data.get("model") or "text-embedding-3-small").strip()

    if not isinstance(projects, list) or not projects:
        raise HTTPException(status_code=400, detail="projects(array) is required")

    texts: List[str] = []
    hashes: List[str] = []

    for p in projects:
        if not isinstance(p, dict):
            text = ""
        else:
            text = render_project_text(p)
        texts.append(text)
        hashes.append(sha256_hex(text))

    try:
        embedder = OpenAIEmbeddings(model=model)
        vectors = embedder.embed_documents(texts)  # List[List[float]]
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"embedding request failed: {exc}") from exc

    if not isinstance(vectors, list) or len(vectors) != len(texts):
        raise HTTPException(status_code=502, detail="embedding service returned invalid result")

    return {
        "model": model,
        "dim": len(vectors[0]) if vectors else None,
        "embeddings": [
            {"index": i, "content_hash": hashes[i], "embedding": vectors[i]}
            for i in range(len(vectors))
        ],
    }
