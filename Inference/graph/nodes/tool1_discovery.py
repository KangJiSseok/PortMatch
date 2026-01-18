from typing import Any, Dict, List

from graph.state import CompanyGraphState


def discovery_node(state: CompanyGraphState) -> Dict[str, Any]:
    company_name = (state.get("company_name") or "").strip()
    if not company_name:
        return {"project_candidates": []}

    project_candidates = [
        {
            "name": f"{company_name} 주요 서비스",
            "problem": None,
            "solution": None,
            "role": None,
            "tech": [],
            "sources": ["homepage"],
        },
        {
            "name": f"{company_name} 내부 시스템 구축",
            "problem": None,
            "solution": None,
            "role": None,
            "tech": [],
            "sources": ["press"],
        },
    ]

    return {"project_candidates": project_candidates}
