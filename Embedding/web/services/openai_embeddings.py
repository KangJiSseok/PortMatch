from typing import List
import os

from openai import OpenAI


def embed_texts(api_key: str, texts: List[str], model: str = "text-embedding-3-small") -> List[List[float]]:
    if not isinstance(texts, list) or not texts:
        raise ValueError("texts must be a non-empty list")

    base_url = os.getenv("OPENAI_BASE_URL")
    if not base_url:
        raise RuntimeError("OPENAI_BASE_URL is not set")

    client = OpenAI(api_key=api_key, base_url=base_url)
    res = client.embeddings.create(model=model, input=texts)
    return [d.embedding for d in res.data]
