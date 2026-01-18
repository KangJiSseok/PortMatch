from typing import Any, Dict, Iterable, List

from graph.state import CompanyGraphState


# TODO: LLM-based validation will be added in ai-feat/validation-llm


def _has_sources(project: Dict[str, Any]) -> bool:
    sources = project.get("sources", [])
    if not isinstance(sources, Iterable) or isinstance(sources, (str, bytes, dict)):
        return bool(sources)
    return any(bool(item) for item in sources)


def _is_too_generic(name: str) -> bool:
    normalized = name.strip()
    return len(normalized) < 4


def validation_node(state: CompanyGraphState) -> Dict[str, Any]:
    project_candidates: List[Dict[str, Any]] = (
        state.get("project_candidates", []) or []
    )

    validation_opinions: List[Dict[str, Any]] = []
    for project in project_candidates:
        name = str(project.get("name", ""))
        has_sources = _has_sources(project)
        too_generic = _is_too_generic(name)

        if not has_sources:
            is_valid = False
            validation_reason = "no_sources"
        elif too_generic:
            is_valid = False
            validation_reason = "too_generic"
        else:
            is_valid = True
            validation_reason = "ok"

        opinion: Dict[str, Any] = dict(project)
        opinion.update(
            {
                "is_valid": is_valid,
                "validation_reason": validation_reason,
            }
        )
        validation_opinions.append(opinion)

    return {"validation_opinions": validation_opinions}
