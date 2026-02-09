import os
from typing import Any, Dict, List, Tuple

from graph.state import CompanyGraphState


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

    threshold = float(os.getenv("DEDUP_WEIGHTED_THRESHOLD", "0.55"))
    weight_name = float(os.getenv("DEDUP_WEIGHT_NAME", "0.7"))
    weight_problem = float(os.getenv("DEDUP_WEIGHT_PROBLEM", "1.4"))
    weight_solution = float(os.getenv("DEDUP_WEIGHT_SOLUTION", "1.1"))
    keep: List[int] = []
    kept_indices: List[int] = []
    for idx in range(len(candidates)):
        is_dup = False
        for kept_idx in kept_indices:
            score = _weighted_similarity_score(
                field_vectors,
                idx,
                kept_idx,
                weight_name,
                weight_problem,
                weight_solution,
            )
            if score >= threshold:
                is_dup = True
                break
        if not is_dup:
            keep.append(idx)
            kept_indices.append(idx)
    return keep


def _weighted_similarity_score(
    field_vectors: Dict[int, Dict[str, List[float]]],
    current_idx: int,
    kept_idx: int,
    weight_name: float,
    weight_problem: float,
    weight_solution: float,
) -> float:
    current_fields = field_vectors.get(current_idx, {})
    kept_fields = field_vectors.get(kept_idx, {})
    name_similarity = _field_similarity(current_fields, kept_fields, "project_name")
    problem_similarity = _field_similarity(current_fields, kept_fields, "problem")
    solution_similarity = _field_similarity(current_fields, kept_fields, "solution")
    return (
        (name_similarity * weight_name)
        * (problem_similarity * weight_problem)
        * (solution_similarity * weight_solution)
    )


def _field_similarity(
    current_fields: Dict[str, List[float]],
    kept_fields: Dict[str, List[float]],
    field: str,
) -> float:
    if field not in current_fields or field not in kept_fields:
        return 0.0
    return _cosine_similarity(current_fields[field], kept_fields[field])


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
