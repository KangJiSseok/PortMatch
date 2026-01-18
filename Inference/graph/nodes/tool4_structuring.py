from typing import Any, Dict, Iterable, List

from graph.state import CompanyGraphState


def _format_tech(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, Iterable) and not isinstance(value, (str, bytes, dict)):
        return ", ".join(str(item) for item in value if item is not None)
    return str(value)


def _format_project(project: Dict[str, Any]) -> str:
    name = project.get("name", "")
    problem = project.get("problem", "")
    solution = project.get("solution", "")
    role = project.get("role", "")
    tech = _format_tech(project.get("tech"))
    lines = [
        f"[프로젝트명] {name}",
        f"[문제] {problem}",
        f"[해결] {solution}",
        f"[역할] {role}",
        f"[기술] {tech}",
    ]
    return "\n".join(lines)


def structuring_node(state: CompanyGraphState) -> Dict[str, Any]:
    scored_projects: List[Dict[str, Any]] = state.get("scored_projects", []) or []
    supported_projects = [
        project
        for project in scored_projects
        if project.get("final_is_supported") is True
    ]
    formatted_blocks = [_format_project(project) for project in supported_projects]
    structured_output = "\n\n".join(formatted_blocks)
    return {"structured_projects": structured_output}
