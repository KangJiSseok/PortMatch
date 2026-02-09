import json
from langchain_core.runnables import RunnableLambda


def _normalize_items(payload: object) -> list[object]:
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            return []
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("content_list", "content", "data", "result", "items"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
            if key == "content_list" and isinstance(value, str):
                try:
                    parsed = json.loads(value)
                except json.JSONDecodeError:
                    parsed = None
                if isinstance(parsed, list):
                    return parsed
        nested = payload.get("content")
        if isinstance(nested, dict):
            nested_list = nested.get("content_list")
            if isinstance(nested_list, list):
                return nested_list
            if isinstance(nested_list, str):
                try:
                    parsed = json.loads(nested_list)
                except json.JSONDecodeError:
                    parsed = None
                if isinstance(parsed, list):
                    return parsed
        results = payload.get("results")
        if isinstance(results, dict):
            document = results.get("document")
            if isinstance(document, dict):
                doc_list = document.get("content_list")
                if isinstance(doc_list, list):
                    return doc_list
                if isinstance(doc_list, str):
                    try:
                        parsed = json.loads(doc_list)
                    except json.JSONDecodeError:
                        parsed = None
                    if isinstance(parsed, list):
                        return parsed
    return []


def _extract_text_nodes(payload: object) -> list[str]:
    texts: list[str] = []
    items = _normalize_items(payload)
    for item in items:
        if isinstance(item, dict) and item.get("type") == "text":
            text = item.get("text")
            if text:
                texts.append(text)
    return texts


# Keep as a chain so an LLM step can be appended later.
TEXT_EXTRACTION_CHAIN = RunnableLambda(_extract_text_nodes)
