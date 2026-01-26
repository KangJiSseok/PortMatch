import json
import os
import re
from typing import Any, Dict, List

from graph.state import CompanyGraphState


def _build_prompt() -> "ChatPromptTemplate":
    from langchain_core.prompts import ChatPromptTemplate

    system_rules = (
        "You generate POSSIBLE project or service anchors based on company text.\n"
        "Anchors represent high-level initiatives, products, platforms, or services.\n"
        "They are candidate names only, not confirmed facts.\n"
        "Rules:\n"
        "- Do NOT describe problem, solution, impact, or outcomes.\n"
        "- Do NOT invent detailed functionality or implementation specifics.\n"
        "- Use conservative, high-level naming (short noun phrases preferred).\n"
        "- Prioritize projects or services that are likely to have been active, "
        "developed, or emphasized within the last 3 years based on the company text.\n"
        "- Generate at least 4 and no more than 6 anchors, "
        "covering clearly different aspects of the business "
        "(e.g., core platform, security, collaboration, infrastructure).\n"
        "- Include at least ONE adjacent or derivative service that logically follows "
        "from the company's core business or industry context, "
        "even if it is not explicitly stated.\n"
        "- Avoid near-duplicate anchors with overlapping meanings.\n"
        "- If uncertain, use generic but reasonable terms such as "
        "\"internal platform\", \"collaboration service\", or \"core system\".\n"
        "- Do NOT claim factual certainty; all anchors are hypothetical candidates.\n"
        "Return JSON only. No prose.\n"
        "Output schema: [{{\"name\": str}}]"
    )

    return ChatPromptTemplate.from_messages(
        [
            ("system", system_rules),
            (
                "human",
                "Company name: {company_name}\n"
                "Company text:\n{company_text}",
            ),
        ]
    )



def _invoke_llm(company_name: str, company_text: str) -> str:
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
        response = chain.invoke(
            {
                "company_name": company_name,
                "company_text": company_text,
            }
        )
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
    for item in data:
        if isinstance(item, str):
            item = {"name": item}
        if not isinstance(item, dict):
            continue
        projects.append(
            {
                # "name" is a discovery anchor, not a real project name.
                "name": str(item.get("name", "")).strip(),
                "problem": None,
                "solution": None,
                "tech": [],
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
            "tech": [],
        },
        {
            # "name" is a discovery anchor, not a real project name.
            "name": f"{company_name} platform upgrade",
            "problem": None,
            "solution": None,
            "tech": [],
        },
    ]


def discovery_node(state: CompanyGraphState) -> Dict[str, Any]:
    company_name = (state.get("company_name") or "").strip()
    if not company_name:
        return {"project_candidates": []}

    company_text = str(state.get("company_text", "") or "").strip()
    raw = _invoke_llm(company_name, company_text)
    project_candidates = _parse_projects(raw)
    if not project_candidates:
        project_candidates = _fallback_projects(company_name)

    return {"project_candidates": project_candidates}
