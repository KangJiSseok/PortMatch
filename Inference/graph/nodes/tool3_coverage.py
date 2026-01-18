from typing import Any, Dict

from graph.state import CompanyGraphState


def coverage_node(state: CompanyGraphState) -> Dict[str, Any]:
    scored_projects = state.get("scored_projects", []) or []
    supported_count = sum(
        1 for project in scored_projects if project.get("final_is_supported") is True
    )
    required_min = 2
    coverage_assessment = (
        "sufficient" if supported_count >= required_min else "insufficient"
    )
    return {
        "coverage": {
            "coverage_assessment": coverage_assessment,
            "supported_count": supported_count,
            "required_min": required_min,
        }
    }
