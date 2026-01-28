from typing import List
import os

import requests


def _normalize_model(model: str) -> str:
    cleaned = (model or "").strip()
    if not cleaned:
        raise ValueError("model must be a non-empty string")
    if cleaned.startswith("models/"):
        return cleaned
    return f"models/{cleaned}"


def embed_texts(api_key: str, texts: List[str], model: str = "gemini-embedding-001") -> List[List[float]]:
    if not isinstance(texts, list) or not texts:
        raise ValueError("texts must be a non-empty list")

    base_url = os.getenv("GEMINI_BASE_URL")
    if not base_url:
        raise RuntimeError("GEMINI_BASE_URL is not set")

    model_name = _normalize_model(model)
    url = f"{base_url.rstrip('/')}/v1beta/{model_name}:batchEmbedContents"
    print(f"[gemini] base_url={base_url} model={model_name} url={url} texts={len(texts)}")
    payload = {
        "requests": [
            {
                "model": model_name,
                "content": {"parts": [{"text": text}]},
            }
            for text in texts
        ]
    }
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
