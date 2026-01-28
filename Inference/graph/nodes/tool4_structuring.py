from typing import Any, Dict, Iterable, List

from graph.state import CompanyGraphState


def _format_tech(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, Iterable) and not isinstance(value, (str, bytes, dict)):
        return ", ".join(str(item) for item in value if item is not None)
    return str(value)


def _format_project(project: Dict[str, Any]) -> str:
    # Use the real project statement; do not expose the discovery anchor.
    name = project.get("project_statement", "") or "정보 없음"
    problem = project.get("problem", "") or "정보 없음"
    solution = project.get("solution", "") or "정보 없음"
    tech = _format_tech(project.get("tech")) or "정보 없음"
    lines = [
        f"[프로젝트명] {name}",
        f"[문제] {problem}",
        f"[해결] {solution}",
        f"[기술] {tech}",
    ]
    return "\n".join(lines)


def structuring_node(state: CompanyGraphState) -> Dict[str, Any]:
    validation_opinions: List[Dict[str, Any]] = (
        state.get("validation_opinions", []) or []
    )
    supported_projects = [
        project for project in validation_opinions if project.get("is_valid") is True
    ]
    structured_output = [
        {
            "project_name": project.get("project_statement", "") or "정보 없음",
            "problem": project.get("problem", "") or "정보 없음",
            "solution": project.get("solution", "") or "정보 없음",
            "tech": project.get("tech", []) or [],
            "source_type": project.get("source_type", "") or "Unknown",
            "source_is_valid": bool(project.get("source_is_valid", False)),
        }
        for project in supported_projects
    ]
    return {"structured_projects": structured_output}
