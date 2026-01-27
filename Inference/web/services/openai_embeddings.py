from typing import List, Optional
import os
from openai import OpenAI
import inspect


def embed_texts(api_key: str, texts: List[str], model: str = "text-embedding-3-small") -> List[List[float]]:
    print("=== DEBUG START ===")
    print("embed_texts file :", inspect.getsourcefile(embed_texts))
    print("pid              :", os.getpid())
    print("OPENAI_BASE_URL  :", os.getenv("OPENAI_BASE_URL"))
    print("PPLX_BASE_URL    :", os.getenv("PPLX_BASE_URL"))
    print("=== DEBUG END ===")
    if not isinstance(texts, list) or not texts:
        raise ValueError("texts must be a non-empty list")

    base_url = os.getenv("OPENAI_EMBEDDING_BASE_URL") or os.getenv("OPENAI_BASE_URL")
    if not base_url:
        raise RuntimeError("OPENAI_EMBEDDING_BASE_URL or OPENAI_BASE_URL is not set")

    print(f"base_url: {base_url}")

    # if base_url:
    client = OpenAI(api_key=api_key, base_url=base_url)

    res = client.embeddings.create(model=model, input=texts)
    return [d.embedding for d in res.data]
