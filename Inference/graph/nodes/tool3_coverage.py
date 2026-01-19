from math import ceil
from typing import Any, Dict, List

from graph.state import CompanyGraphState


def coverage_node(state: CompanyGraphState) -> Dict[str, Any]:
    scored_projects: List[Dict[str, Any]] = state.get("scored_projects", []) or []
    supported_count = sum(
        1 for item in scored_projects if item.get("final_is_supported") is True
    )
    total_candidates = len(scored_projects)

    required_min = max(4, ceil(total_candidates * 0.4))

    coverage_assessment = (
        "sufficient" if supported_count >= required_min else "insufficient"
    )
    return {
        "coverage": {
            "coverage_assessment": coverage_assessment,
            "supported_count": supported_count,
            "required_min": required_min,
            "total_candidates": total_candidates,
        }
    }
