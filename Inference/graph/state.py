from typing import Any, Dict, List, TypedDict


class CompanyGraphState(TypedDict, total=False):
    company_name: str
    company_text: str
    source_type: str
    source_types: List[str]
    sources: List[Dict[str, Any]]
    project_candidates: List[Dict[str, Any]]
    validation_opinions: List[Dict[str, Any]]
    structured_projects: List[Dict[str, Any]]
    exclude_project_names: List[str]
    retry_count: int
    should_retry: bool
    initial_project_count: int
