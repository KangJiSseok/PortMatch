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
        "- Compare project_statement, problem, solution, and tech for overlap.\n"
        "- Prefer the most specific candidate.\n"
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
        "project_statement": project.get("project_statement", ""),
        "problem": project.get("problem", ""),
        "solution": project.get("solution", ""),
        "tech": project.get("tech", []),
    }


def _compose_text(project: Dict[str, Any]) -> str:
    parts = [
        str(project.get("project_statement", "")),
        str(project.get("problem", "")),
        str(project.get("solution", "")),
    ]
    tech = project.get("tech", []) or []
    parts.extend(str(item) for item in tech)
    return " ".join(part for part in parts if part)


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


def _normalize_tech(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    normalized: List[str] = []
    for item in value:
        text = str(item).strip().lower()
        if text:
            normalized.append(text)
    return normalized


def _tech_overlap(a: List[str], b: List[str]) -> float:
    if not a or not b:
        return 0.0
    set_a = set(a)
    set_b = set(b)
    inter = set_a.intersection(set_b)
    union = set_a.union(set_b)
    return len(inter) / len(union)


def _looks_like_feature(project: Dict[str, Any]) -> bool:
    text = " ".join(
        [
            str(project.get("project_statement", "")),
            str(project.get("problem", "")),
            str(project.get("solution", "")),
            str(project.get("name", "")),
        ]
    ).lower()
    keywords = ["확장", "기능", "모듈", "플러그인", "옵션", "부가", "서브", "하위"]
    return any(keyword in text for keyword in keywords)


def _specificity_score(project: Dict[str, Any]) -> float:
    name = str(project.get("name", ""))
    statement = str(project.get("project_statement", ""))
    text = f"{name} {statement}".strip()
    if not text:
        return 0.0
    score = 0.0
    if re.search(r"\([^)]+\)", text):
        score += 2.0
    if re.search(r"[A-Za-z]{2,}", text):
        score += 1.0
    if re.search(r"[A-Za-z]+[0-9]+|[0-9]+[A-Za-z]+", text):
        score += 0.5
    generic_keywords = ["플랫폼", "솔루션", "시스템", "서비스", "관리", "플랫품", "플렛폼"]
    if any(keyword in text for keyword in generic_keywords):
        score -= 1.0
    score += min(len(text.split()), 20) / 10.0
    return score


def _embedding_keep_indices(candidates: List[Dict[str, Any]]) -> List[int]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    base_url = os.getenv("OPENAI_EMBEDDING_BASE_URL") or os.getenv("OPENAI_BASE_URL", "")
    if not api_key or not base_url:
        return []
    try:
        from web.services.openai_embeddings import embed_texts
    except Exception:
        return []

    texts = [_compose_text(project) for project in candidates]
    if not any(texts):
        return []
    model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small").strip()
    try:
        vectors = embed_texts(api_key=api_key, texts=texts, model=model)
    except Exception:
        return []
    if not vectors or len(vectors) != len(candidates):
        return []

    threshold = float(os.getenv("DEDUP_SIMILARITY_THRESHOLD", "0.80"))
    secondary_threshold = float(os.getenv("DEDUP_SIMILARITY_SECONDARY", "0.70"))
    tech_threshold = float(os.getenv("DEDUP_TECH_OVERLAP_THRESHOLD", "0.40"))
    keep: List[int] = []
    kept_vectors: List[List[float]] = []
    kept_tech: List[List[str]] = []
    kept_scores: List[float] = []
    for idx, vec in enumerate(vectors):
        is_dup = False
        candidate = candidates[idx]
        tech = _normalize_tech(candidate.get("tech", []))
        is_feature = _looks_like_feature(candidate)
        score = _specificity_score(candidate)
        for kept_idx, kept_vec in enumerate(kept_vectors):
            similarity = _cosine_similarity(vec, kept_vec)
            if similarity >= threshold:
                if score > kept_scores[kept_idx]:
                    keep[kept_idx] = idx
                    kept_vectors[kept_idx] = vec
                    kept_tech[kept_idx] = tech
                    kept_scores[kept_idx] = score
                is_dup = True
                break
            if similarity >= secondary_threshold:
                overlap = _tech_overlap(tech, kept_tech[kept_idx])
                if overlap >= tech_threshold or is_feature:
                    if score > kept_scores[kept_idx]:
                        keep[kept_idx] = idx
                        kept_vectors[kept_idx] = vec
                        kept_tech[kept_idx] = tech
                        kept_scores[kept_idx] = score
                    is_dup = True
                    break
        if not is_dup:
            keep.append(idx)
            kept_vectors.append(vec)
            kept_tech.append(tech)
            kept_scores.append(score)
    return sorted(set(keep))


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
