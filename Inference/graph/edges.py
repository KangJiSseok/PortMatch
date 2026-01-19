from typing import Any, Dict


def has_supported_projects(state: Dict[str, Any]) -> bool:
    scored = state.get("scored_projects", [])
    for item in scored:
        if item.get("final_is_supported") is True:
            return True
    return False


def is_coverage_enough(state: Dict[str, Any]) -> bool:
    coverage = state.get("coverage", {})
    assessment = coverage.get("coverage_assessment")
    return assessment == "sufficient"
