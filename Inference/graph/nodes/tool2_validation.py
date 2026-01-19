import json
import os
import re
from typing import Any, Dict, Iterable, List

from graph.state import CompanyGraphState


def _has_sources(project: Dict[str, Any]) -> bool:
    sources = project.get("sources", [])
    if not isinstance(sources, Iterable) or isinstance(sources, (str, bytes, dict)):
        return bool(sources)
    return any(bool(item) for item in sources)


def _build_prompt() -> "ChatPromptTemplate":
    from langchain_core.prompts import ChatPromptTemplate

    system_rules = (
        "You validate candidate anchors against company text and extract evidence.\n"
        "Rules:\n"
        "- Candidate anchors are NOT real project names.\n"
        "- If company_text is empty, you MAY infer cautiously from the anchors.\n"
        "- support_type must be one of: explicit, implicit, none.\n"
        "- evidence.source must be one of: homepage, press, report, job_posting.\n"
        "- project_statement must be a single Korean sentence.\n"
        "- If evidence is weak, use cautious wording like "
        "\"...수행한 것으로 보입니다.\".\n"
        "Return JSON only. No prose.\n"
        "Output schema:\n"
        "[{{"
        "\"project_statement\": str,"
        "\"evidence\": [{{\"snippet\": str, \"source\": str}}],"
        "\"support_type\": str,"
        "\"evidence_summary\": str,"
        "\"is_valid\": bool"
        "}}]"
    )

    return ChatPromptTemplate.from_messages(
        [
            ("system", system_rules),
            ("human", "Company text:\n{company_text}\n\nCandidates:\n{candidates_json}"),
        ]
    )



def _invoke_llm(company_text: str, candidates: List[Dict[str, Any]]) -> str:
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
                "company_text": company_text,
                "candidates_json": json.dumps(candidates, ensure_ascii=False),
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


def _parse_llm_output(text: str) -> List[Dict[str, Any]]:
    payload = _extract_json(text)
    if not payload:
        return []
    try:
        data = json.loads(payload)
    except Exception:
        return []
    if isinstance(data, dict):
        data = data.get("results") or data.get("validation_opinions") or []
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def _default_statement(anchor_name: str, support_type: str) -> str:
    if not anchor_name:
        return "프로젝트를 수행한 것으로 보입니다."
    if support_type == "explicit":
        return f"{anchor_name} 관련 프로젝트를 진행했었다."
    return f"{anchor_name} 관련 프로젝트를 수행한 것으로 보입니다."


def _normalize_support_type(value: Any) -> str:
    if value in {"explicit", "implicit", "none"}:
        return value
    return "none"


def _normalize_evidence(evidence: Any) -> List[Dict[str, str]]:
    allowed_sources = {"homepage", "press", "report", "job_posting"}
    if not isinstance(evidence, list):
        return []
    normalized: List[Dict[str, str]] = []
    for item in evidence:
        if not isinstance(item, dict):
            continue
        snippet = str(item.get("snippet", "")).strip()
        source = str(item.get("source", "")).strip()
        if not snippet or source not in allowed_sources:
            continue
        normalized.append({"snippet": snippet, "source": source})
    return normalized


def validation_node(state: CompanyGraphState) -> Dict[str, Any]:
    project_candidates: List[Dict[str, Any]] = (
        state.get("project_candidates", []) or []
    )
    company_text = str(state.get("company_text", "") or "").strip()
    llm_output = _invoke_llm(company_text, project_candidates)
    parsed = _parse_llm_output(llm_output)

    validation_opinions: List[Dict[str, Any]] = []
    for idx, project in enumerate(project_candidates):
        # "name" is treated as a candidate anchor from Tool1.
        anchor_name = str(project.get("name", ""))
        has_sources = _has_sources(project)

        llm_item = parsed[idx] if idx < len(parsed) else {}
        support_type = _normalize_support_type(llm_item.get("support_type"))
        evidence = _normalize_evidence(llm_item.get("evidence"))
        project_statement = str(llm_item.get("project_statement", "")).strip()
        evidence_summary = str(llm_item.get("evidence_summary", "")).strip()
        is_valid = bool(llm_item.get("is_valid", False))

        if not company_text:
            evidence = []
            if support_type == "explicit":
                support_type = "implicit"
            if not evidence_summary:
                evidence_summary = "company_text_empty_inferred"
            if project_statement:
                is_valid = True

        if not project_statement:
            project_statement = _default_statement(anchor_name, support_type)

        if support_type == "none":
            validation_reason = "no_evidence"
        elif not has_sources:
            validation_reason = "no_sources"
        else:
            validation_reason = "ok"

        opinion: Dict[str, Any] = dict(project)
        opinion.update(
            {
                "is_valid": is_valid,
                "validation_reason": validation_reason,
                # Tool2 provides the real, human-readable statement.
                "project_statement": project_statement,
                "evidence": evidence,
                "support_type": support_type,
                "evidence_summary": evidence_summary,
            }
        )
        validation_opinions.append(opinion)

    return {"validation_opinions": validation_opinions}
