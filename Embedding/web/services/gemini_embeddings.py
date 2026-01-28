import json
import os
import urllib.request
import urllib.error
from typing import List
import re


def _extract_embedding_values(payload: dict) -> List[float]:
    embedding = payload.get("embedding") if isinstance(payload, dict) else None
    if isinstance(embedding, dict):
        values = embedding.get("values")
        if isinstance(values, list):
            return values
    return []


def _parse_json_body(body: str) -> dict:
    try:
        return json.loads(body) if body else {}
    except json.JSONDecodeError:
        if not body:
            raise
        trimmed = body.strip()
        try:
            decoder = json.JSONDecoder()
            obj, _ = decoder.raw_decode(trimmed)
            if isinstance(obj, dict):
                return obj
            if isinstance(obj, list):
                return {"embedding": {"values": obj}}
        except json.JSONDecodeError:
            pass

        # Handle SSE-style "data: {json}" lines.
        lines = [line.strip() for line in body.splitlines() if line.strip()]
        for line in reversed(lines):
            if line.startswith("data:"):
                candidate = line[len("data:") :].strip()
            else:
                candidate = line
            if "{" in candidate and "}" in candidate:
                start = candidate.find("{")
                end = candidate.rfind("}")
                snippet = candidate[start : end + 1]
                try:
                    return json.loads(snippet)
                except json.JSONDecodeError:
                    continue

        start = trimmed.find("{")
        end = trimmed.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = trimmed[start : end + 1]
            return json.loads(snippet)

        # Fallback: numeric-only payload (no quotes), parse as values.
        if '"' not in trimmed:
            nums = re.findall(
                r"-?(?:\d+\.\d+|\.\d+|\d+)(?:[eE][+-]?\d+)?",
                trimmed,
            )
            if nums:
                return {"embedding": {"values": [float(n) for n in nums]}}
        raise


def _debug_value_count(label: str, body: str, expected: int) -> None:
    nums = re.findall(
        r"-?(?:\d+\.\d+|\.\d+|\d+)(?:[eE][+-]?\d+)?",
        body,
    )
    head = body[:300].replace("\n", "\\n")
    tail = body[-300:].replace("\n", "\\n")
    print(f"[embeddings][debug] {label} numbers={len(nums)} expected={expected}")
    print(f"[embeddings][debug] head={head}")
    print(f"[embeddings][debug] tail={tail}")


def _recover_values_from_body(body: str, expected: int) -> List[float]:
    cleaned = (
        body.replace("[", " ")
        .replace("]", " ")
        .replace("{", " ")
        .replace("}", " ")
        .replace(":", " ")
    )
    tokens = re.split(r"[\s,]+", cleaned)
    values: List[float] = []
    for tok in tokens:
        if not tok:
            continue
        low = tok.lower()
        if low in ("nan",):
            values.append(float("nan"))
            continue
        if low in ("inf", "infinity"):
            values.append(float("inf"))
            continue
        if low in ("-inf", "-infinity"):
            values.append(float("-inf"))
            continue
        try:
            values.append(float(tok))
        except ValueError:
            continue
    if expected and len(values) == expected:
        return values
    return []


def embed_texts_gemini(
    api_key: str,
    texts: List[str],
    model: str = "models/gemini-embedding-001",
    output_dimensionality: int = 1536,
    timeout_seconds: int = 30,
) -> List[List[float]]:
    if not isinstance(texts, list) or not texts:
        raise ValueError("texts must be a non-empty list")

    base_url = os.getenv(
        "GEMINI_BASE_URL",
        "https://generativelanguage.googleapis.com",
    ).rstrip("/")
    model_path = model.strip()
    if not model_path.startswith("models/"):
        model_path = f"models/{model_path}"
    endpoint = f"{base_url}/v1beta/{model_path}:embedContent"

    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json",
    }

    vectors: List[List[float]] = []
    for text in texts:
        payload = {
            "model": model,
            "content": {"parts": [{"text": text}]},
        }
        if output_dimensionality:
            payload["outputDimensionality"] = output_dimensionality
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
                body = resp.read().decode("utf-8")
                try:
                    data = _parse_json_body(body)
                except json.JSONDecodeError as exc:
                    raise RuntimeError(f"Invalid JSON response: {body}") from exc
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8") if exc.fp else ""
            raise RuntimeError(f"HTTP {exc.code} {exc.reason}: {err_body}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"URL error: {exc.reason}") from exc

        values = _extract_embedding_values(data)
        if not values:
            raise RuntimeError("embedding response missing values")
        if output_dimensionality and len(values) != output_dimensionality:
            recovered = _recover_values_from_body(body, output_dimensionality)
            if recovered:
                values = recovered
            else:
                _debug_value_count("length_mismatch", body, output_dimensionality)
                raise RuntimeError(
                    f"unexpected vector length: {len(values)} (expected {output_dimensionality})"
                )
        vectors.append(values)

    return vectors


def embed_texts(
    api_key: str,
    texts: List[str],
    model: str = "models/gemini-embedding-001",
    output_dimensionality: int = 1536,
    timeout_seconds: int = 30,
) -> List[List[float]]:
    return embed_texts_gemini(
        api_key=api_key,
        texts=texts,
        model=model,
        output_dimensionality=output_dimensionality,
        timeout_seconds=timeout_seconds,
    )
