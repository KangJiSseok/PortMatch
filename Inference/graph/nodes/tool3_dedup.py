import json
import os
import re
from typing import Any, Dict, List, Tuple

from graph.state import CompanyGraphState


def _build_prompt() -> "ChatPromptTemplate":
    from langchain_core.prompts import ChatPromptTemplate

    system_rules = (
        "You remove duplicate or overlapping projects.\n"
        "Rules:\n"
        "- The input list contains only candidates already marked is_valid=true.\n"
        "- If multiple candidates describe substantially the same project, keep only ONE.\n"
        "- Treat naming variations as duplicates (e.g., \"AI OCR 솔루션\" vs \"AI OCR Engine\").\n"
        "- Compare project_statement, problem, solution for overlap. Ignore tech.\n"
        "- Treat feature/module expansions as duplicates of their parent platform.\n"
        "- Preserve input order when selecting representatives.\n"
        "- If overlaps are minimal, keep all items; never drop below 1 item overall.\n"
        "Return JSON only. No prose.\n"
        "Output schema: {{\"keep_indices\": [int]}}"
    )

    return ChatPromptTemplate.from_messages(
        [
            ("system", system_rules),
            ("human", "Candidates:\n{candidates_json}"),
        ]
    )


def _invoke_llm(candidates: List[Dict[str, Any]]) -> str:
    model_name = os.getenv("PPLX_MODEL") or os.getenv("OPENAI_MODEL", "sonar-pro")
    api_key = os.getenv("PPLX_API_KEY", "")
    base_url = os.getenv("PPLX_BASE_URL", "https://api.perplexity.ai")
    if not api_key:
        return ""
    try:
        os.environ["OPENAI_API_KEY"] = api_key
        os.environ["OPENAI_BASE_URL"] = base_url
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model=model_name, temperature=0.0)
        prompt = _build_prompt()
        chain = prompt | llm
        response = chain.invoke(
            {
                "candidates_json": json.dumps(candidates, ensure_ascii=False),
            }
        )
        return getattr(response, "content", str(response))
    except Exception:
        return ""


def _extract_json(text: str) -> str:
    if not text:
        return ""
    fenced = re.search(r"```json\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()
    block = re.search(r"(\{.*\})", text, re.DOTALL)
    if block:
        return block.group(1).strip()
    return text.strip()


def _parse_keep_indices(text: str, size: int) -> List[int]:
    payload = _extract_json(text)
    if not payload:
        return []
    try:
        data = json.loads(payload)
    except Exception:
        return []
    if isinstance(data, dict):
        keep = data.get("keep_indices", [])
    elif isinstance(data, list):
        keep = data
    else:
        return []
    if not isinstance(keep, list):
        return []
    normalized: List[int] = []
    for item in keep:
        try:
            idx = int(item)
        except Exception:
            continue
        if 0 <= idx < size and idx not in normalized:
            normalized.append(idx)
    return normalized


def _build_candidate_payload(project: Dict[str, Any], local_index: int) -> Dict[str, Any]:
    return {
        "index": local_index,
        "name": project.get("name", ""),
        "project_statement": project.get("project_statement", ""),
        "problem": project.get("problem", ""),
        "solution": project.get("solution", ""),
    }


def _project_name_text(project: Dict[str, Any]) -> str:
    statement = str(project.get("project_statement", "")).strip()
    if statement:
        return statement
    return str(project.get("name", "")).strip()


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for x, y in zip(a, b):
        dot += x * y
        norm_a += x * x
        norm_b += y * y
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / ((norm_a ** 0.5) * (norm_b ** 0.5))


def _embedding_keep_indices(candidates: List[Dict[str, Any]]) -> List[int]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    base_url = os.getenv("OPENAI_EMBEDDING_BASE_URL") or os.getenv("OPENAI_BASE_URL", "")
    if not api_key or not base_url:
        return []
    try:
        from web.services.openai_embeddings import embed_texts
    except Exception:
        return []

    model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small").strip()
    field_items: List[Tuple[int, str, str]] = []
    for idx, project in enumerate(candidates):
        name_text = _project_name_text(project)
        problem = str(project.get("problem", "")).strip()
        solution = str(project.get("solution", "")).strip()
        if name_text:
            field_items.append((idx, "project_name", name_text))
        if problem:
            field_items.append((idx, "problem", problem))
        if solution:
            field_items.append((idx, "solution", solution))

    if not field_items:
        return []

    texts = [item[2] for item in field_items]
    try:
        vectors = embed_texts(api_key=api_key, texts=texts, model=model)
    except Exception:
        return []
    if not vectors or len(vectors) != len(field_items):
        return []

    field_vectors: Dict[int, Dict[str, List[float]]] = {}
    for (idx, field, _), vec in zip(field_items, vectors):
        field_vectors.setdefault(idx, {})[field] = vec

    threshold = float(os.getenv("DEDUP_SIMILARITY_THRESHOLD", "0.80"))
    keep: List[int] = []
    kept_indices: List[int] = []
    for idx in range(len(candidates)):
        is_dup = False
        for kept_idx in kept_indices:
            if _fields_similar(field_vectors, idx, kept_idx, threshold):
                is_dup = True
                break
        if not is_dup:
            keep.append(idx)
            kept_indices.append(idx)
    return keep


def _fields_similar(
    field_vectors: Dict[int, Dict[str, List[float]]],
    current_idx: int,
    kept_idx: int,
    threshold: float,
) -> bool:
    current_fields = field_vectors.get(current_idx, {})
    kept_fields = field_vectors.get(kept_idx, {})
    for field in ("project_name", "problem", "solution"):
        if field not in current_fields or field not in kept_fields:
            continue
        similarity = _cosine_similarity(current_fields[field], kept_fields[field])
        if similarity >= threshold:
            return True
    return False


def _split_valid_projects(
    validation_opinions: List[Dict[str, Any]],
) -> Tuple[List[Tuple[int, Dict[str, Any]]], List[Dict[str, Any]]]:
    valid_pairs: List[Tuple[int, Dict[str, Any]]] = []
    others: List[Dict[str, Any]] = []
    for idx, project in enumerate(validation_opinions):
        if project.get("is_valid") is True:
            valid_pairs.append((idx, project))
        else:
            others.append(project)
    return valid_pairs, others


def dedup_node(state: CompanyGraphState) -> Dict[str, Any]:
    validation_opinions: List[Dict[str, Any]] = (
        state.get("validation_opinions", []) or []
    )
    valid_pairs, _ = _split_valid_projects(validation_opinions)
    if len(valid_pairs) < 2:
        return {"validation_opinions": validation_opinions}

    candidates = [
        _build_candidate_payload(project, local_index)
        for local_index, (_, project) in enumerate(valid_pairs)
    ]
    keep_indices = _embedding_keep_indices(candidates)
    if not keep_indices:
        raw = _invoke_llm(candidates)
        keep_indices = _parse_keep_indices(raw, len(candidates))
        if not keep_indices:
            return {"validation_opinions": validation_opinions}

    keep_set = set(keep_indices)
    updated = list(validation_opinions)
    for local_index, (global_index, project) in enumerate(valid_pairs):
        if local_index in keep_set:
            continue
        updated_project = dict(project)
        updated_project["is_valid"] = False
        updated[global_index] = updated_project

    return {"validation_opinions": updated}
