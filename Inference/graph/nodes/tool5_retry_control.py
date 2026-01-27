from typing import Any, Dict, List

from graph.state import CompanyGraphState


def _collect_exclusions(validation_opinions: List[Dict[str, Any]]) -> List[str]:
    exclusions: List[str] = []
    for project in validation_opinions:
        statement = str(project.get("project_statement", "") or "").strip()
        name = str(project.get("name", "") or "").strip()
        for value in (statement, name):
            if value and value not in exclusions:
                exclusions.append(value)
    return exclusions


def retry_control_node(state: CompanyGraphState) -> Dict[str, Any]:
    structured_projects: List[Dict[str, Any]] = (
        state.get("structured_projects", []) or []
    )
    retry_count = int(state.get("retry_count", 0) or 0)
    should_retry = len(structured_projects) <= 3 and retry_count < 2

    updates: Dict[str, Any] = {"should_retry": should_retry}
    if should_retry:
        validation_opinions: List[Dict[str, Any]] = (
            state.get("validation_opinions", []) or []
        )
        updates["exclude_project_names"] = _collect_exclusions(validation_opinions)
        updates["retry_count"] = retry_count + 1
    else:
        updates["exclude_project_names"] = []
    return updates
