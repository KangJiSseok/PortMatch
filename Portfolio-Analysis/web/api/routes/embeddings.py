import json
import hashlib
import os
from typing import Any, Dict, List

import requests
from fastapi import APIRouter, HTTPException, Request

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


def _normalize_model(model: str) -> str:
    cleaned = (model or "").strip()
    if not cleaned:
        raise ValueError("model must be a non-empty string")
    if cleaned.startswith("models/"):
        return cleaned
    return f"models/{cleaned}"


def _gemini_embed_documents(texts: List[str], model: str) -> List[List[float]]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    base_url = os.getenv("GEMINI_BASE_URL")
    if not base_url:
        raise RuntimeError("GEMINI_BASE_URL is not set")

    model_name = _normalize_model(model)
    url = f"{base_url.rstrip('/')}/v1beta/{model_name}:batchEmbedContents"
    print(f"[gemini] base_url={base_url} model={model_name} url={url} texts={len(texts)}")
    output_dim = int(os.getenv("GEMINI_OUTPUT_DIMENSIONS", "1536"))
    requests_payload = []
    for text in texts:
        req = {
            "model": model_name,
            "content": {"parts": [{"text": text}]},
        }
        if output_dim:
            req["outputDimensionality"] = output_dim
        requests_payload.append(req)
    payload = {"requests": requests_payload}
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers, timeout=30)
    if response.status_code >= 400:
        body_preview = response.text[:1000] if response.text else ""
        print(f"[gemini] error status={response.status_code} body={body_preview}")
        raise RuntimeError(f"Gemini embeddings request failed: {response.status_code} {response.text}")

    data = response.json()
    embeddings = data.get("embeddings")
    if not isinstance(embeddings, list):
        raise RuntimeError("Gemini embeddings response missing embeddings list")

    vectors: List[List[float]] = []
    for embedding in embeddings:
        values = embedding.get("values")
        if not isinstance(values, list):
            raise RuntimeError("Gemini embeddings response missing values")
        vectors.append(values)

    return vectors


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
    requested_model = (data.get("model") or "").strip()
    model = (requested_model or os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")).strip()
    if requested_model:
        print(f"[embeddings] requested_model={requested_model} resolved_model={model}")

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
        vectors = _gemini_embed_documents(texts=texts, model=model)  # List[List[float]]
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
