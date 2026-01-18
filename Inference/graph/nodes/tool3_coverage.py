from typing import Any, Dict

from graph.state import CompanyGraphState


def coverage_node(state: CompanyGraphState) -> Dict[str, Any]:
    _ = state
    supported_count = 0
    required_min = 0
    coverage_assessment = "sufficient"
    return {
        "coverage": {
            "coverage_assessment": coverage_assessment,
            "supported_count": supported_count,
            "required_min": required_min,
        }
    }
