import json
import os
import re
from typing import Any, Dict, List

from graph.state import CompanyGraphState


def _build_prompt() -> "ChatPromptTemplate":
    from langchain_core.prompts import ChatPromptTemplate

    system_rules = (
        "You are generating POSSIBLE project names only.\n"
        "Rules:\n"
        "- Do NOT describe problem, solution, role, or impact.\n"
        "- Do NOT invent detailed functionality.\n"
        "- Project names must be high-level and conservative.\n"
        "- If unsure, use generic terms like \"core product\" or \"internal system\".\n"
        "- Sources must be limited to [\"homepage\", \"press\", \"job_posting\"].\n"
        "Return JSON only. No prose.\n"
        "Output schema: [{{\"name\": str, \"sources\": [str]}}]"
    )
    return ChatPromptTemplate.from_messages(
        [
            ("system", system_rules),
            ("human", "Company name: {company_name}"),
        ]
    )


def _invoke_llm(company_name: str) -> str:
    model_name = os.getenv("PPLX_MODEL") or os.getenv("OPENAI_MODEL", "sonar-pro")
    api_key = os.getenv("PPLX_API_KEY", "")
    base_url = os.getenv("PPLX_BASE_URL", "https://api.perplexity.ai")
    if not api_key:
        return ""
    try:
        os.environ["OPENAI_API_KEY"] = api_key
        os.environ["OPENAI_BASE_URL"] = base_url
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model=model_name, temperature=0.2)
        prompt = _build_prompt()
        chain = prompt | llm
        response = chain.invoke({"company_name": company_name})
        return getattr(response, "content", str(response))
    except Exception:
        return ""


def _extract_json(text: str) -> str:
    if not text:
        return ""
    fenced = re.search(r"```json\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()
    block = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    if block:
        return block.group(1).strip()
    return text.strip()


def _parse_projects(text: str) -> List[Dict[str, Any]]:
    payload = _extract_json(text)
    if not payload:
        return []
    try:
        data = json.loads(payload)
    except Exception:
        return []

    if isinstance(data, dict):
        data = data.get("projects") or data.get("project_candidates") or []

    if not isinstance(data, list):
        return []

    projects: List[Dict[str, Any]] = []
    allowed_sources = {"homepage", "press", "job_posting"}
    for item in data:
        if isinstance(item, str):
            item = {"name": item}
        if not isinstance(item, dict):
            continue
        raw_sources = item.get("sources") if isinstance(item.get("sources"), list) else []
        sources = [str(src) for src in raw_sources if str(src) in allowed_sources]
        if not sources:
            sources = ["homepage"]
        projects.append(
            {
                # "name" is a discovery anchor, not a real project name.
                "name": str(item.get("name", "")).strip(),
                "problem": None,
                "solution": None,
                "role": None,
                "tech": [],
                "sources": sources,
            }
        )
    return projects


def _fallback_projects(company_name: str) -> List[Dict[str, Any]]:
    return [
        {
            # "name" is a discovery anchor, not a real project name.
            "name": f"{company_name} core product",
            "problem": None,
            "solution": None,
            "role": None,
            "tech": [],
            "sources": ["homepage"],
        },
        {
            # "name" is a discovery anchor, not a real project name.
            "name": f"{company_name} platform upgrade",
            "problem": None,
            "solution": None,
            "role": None,
            "tech": [],
            "sources": ["press"],
        },
    ]


def discovery_node(state: CompanyGraphState) -> Dict[str, Any]:
    company_name = (state.get("company_name") or "").strip()
    if not company_name:
        return {"project_candidates": []}

    raw = _invoke_llm(company_name)
    project_candidates = _parse_projects(raw)
    if not project_candidates:
        project_candidates = _fallback_projects(company_name)

    return {"project_candidates": project_candidates}
