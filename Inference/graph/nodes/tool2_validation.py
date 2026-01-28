import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from graph.state import CompanyGraphState


def _build_prompt() -> "ChatPromptTemplate":
    from langchain_core.prompts import ChatPromptTemplate

    system_rules = (
        "You validate candidate anchors against company text.\n"
        "Rules:\n"
        "- Candidate anchors are NOT real project names.\n"
        "- If company_text is empty, you MAY infer cautiously from the anchors.\n"
        "- If multiple candidates refer to the same service/platform, merge them into one.\n"
        "- Remove near-duplicates with only minor wording differences.\n"
        "- support_type must be one of: explicit, implicit, none.\n"
        "- evidence.source must be one of: homepage, press, report, job_posting.\n"
        "- project_statement must be a single Korean sentence.\n"
        "- domain must be a short Korean category label.\n"
        "- problem/solution must be short Korean phrases.\n"
        "- tech must be a list of short, concrete technology terms (e.g., Spring Boot, Node.js, React, Python, AWS, PostgreSQL, Kafka).\n"
        "- Do NOT include abstract domain words like \"매칭\", \"플랫폼\", \"서비스\", \"AI 코칭\", \"재능 거래\".\n"
        "- If no concrete tech is evidenced, return an empty list.\n"
        "- If evidence is weak, use cautious wording like "
        "\"...수행한 것으로 보입니다.\".\n"
        "Return JSON only. No prose.\n"
        "Output schema:\n"
        "[{{"
        "\"project_statement\": str,"
        "\"domain\": str,"
        "\"problem\": str,"
        "\"solution\": str,"
        "\"tech\": [str],"
        "\"source_type\": str,"
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


def _default_statement(anchor_name: str) -> str:
    if not anchor_name:
        return "프로젝트를 수행한 것으로 보입니다."
    return f"{anchor_name} 관련 프로젝트를 수행한 것으로 보입니다."

def _normalize_tech(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    tech_list = []
    for item in value:
        text = str(item).strip()
        if text:
            tech_list.append(text)
    return tech_list


_ALLOWED_SOURCE_TYPES = [
    "Official Company Website",
    "Official Recruitment / Job Posting Pages",
    "Trusted News Articles",
    "Regulatory Filings & Financial Disclosures",
    "Official Product / Service Pages",
    "Official Social Media Channels",
    "Patents & Academic Publications",
]


def _normalize_source_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def _classify_source_type(value: str) -> str:
    text = _normalize_source_text(value)
    if not text:
        return ""

    direct_map = {
        "official company website": "Official Company Website",
        "company website": "Official Company Website",
        "corporate website": "Official Company Website",
        "official recruitment / job posting pages": "Official Recruitment / Job Posting Pages",
        "official recruitment pages": "Official Recruitment / Job Posting Pages",
        "job posting pages": "Official Recruitment / Job Posting Pages",
        "trusted news articles": "Trusted News Articles",
        "news articles": "Trusted News Articles",
        "regulatory filings & financial disclosures": "Regulatory Filings & Financial Disclosures",
        "regulatory filings": "Regulatory Filings & Financial Disclosures",
        "financial disclosures": "Regulatory Filings & Financial Disclosures",
        "official product / service pages": "Official Product / Service Pages",
        "product pages": "Official Product / Service Pages",
        "service pages": "Official Product / Service Pages",
        "official social media channels": "Official Social Media Channels",
        "social media": "Official Social Media Channels",
        "patents & academic publications": "Patents & Academic Publications",
        "patents": "Patents & Academic Publications",
        "academic publications": "Patents & Academic Publications",
    }
    if text in direct_map:
        return direct_map[text]

    if "recruit" in text or "job" in text or "career" in text:
        return "Official Recruitment / Job Posting Pages"
    if "news" in text or "press" in text or "media" in text:
        return "Trusted News Articles"
    if "regulatory" in text or "filing" in text or "disclosure" in text:
        return "Regulatory Filings & Financial Disclosures"
    if "product" in text or "service" in text or "pricing" in text:
        return "Official Product / Service Pages"
    if "social" in text or "linkedin" in text or "x.com" in text or "twitter" in text:
        return "Official Social Media Channels"
    if "patent" in text or "paper" in text or "publication" in text or "journal" in text:
        return "Patents & Academic Publications"
    if "official" in text or "company" in text or "corporate" in text:
        return "Official Company Website"
    return ""


def _extract_item_source_types(item: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    raw_types: List[str] = []
    for key in ("source_type", "sourceType", "source_types", "sourceTypes"):
        value = item.get(key)
        if isinstance(value, list):
            raw_types.extend(str(entry) for entry in value if entry is not None)
        elif isinstance(value, str):
            raw_types.append(value)

    normalized_raw = []
    for value in raw_types:
        text = str(value).strip()
        if text and text not in normalized_raw:
            normalized_raw.append(text)

    canonical: List[str] = []
    unknown: List[str] = []
    for value in normalized_raw:
        classified = _classify_source_type(value)
        if classified and classified not in canonical:
            canonical.append(classified)
        elif not classified and value not in unknown:
            unknown.append(value)

    return canonical, unknown


def _extract_source_types(state: CompanyGraphState) -> Tuple[List[str], List[str]]:
    raw_types: List[str] = []
    single_type = state.get("source_type")
    if isinstance(single_type, str):
        raw_types.append(single_type)

    source_types = state.get("source_types")
    if isinstance(source_types, list):
        raw_types.extend(str(item) for item in source_types if item is not None)

    sources = state.get("sources")
    if isinstance(sources, list):
        for item in sources:
            if isinstance(item, str):
                raw_types.append(item)
                continue
            if not isinstance(item, dict):
                continue
            for key in (
                "type",
                "source_type",
                "sourceType",
                "category",
                "source_category",
                "sourceCategory",
            ):
                value = item.get(key)
                if isinstance(value, str) and value.strip():
                    raw_types.append(value)

    normalized_raw = []
    for value in raw_types:
        text = str(value).strip()
        if text and text not in normalized_raw:
            normalized_raw.append(text)

    canonical: List[str] = []
    unknown: List[str] = []
    for value in normalized_raw:
        classified = _classify_source_type(value)
        if classified and classified not in canonical:
            canonical.append(classified)
        elif not classified:
            unknown.append(value)

    return canonical, unknown


def _pick_primary_source_type(values: List[str]) -> str:
    if not values:
        return "Unknown"
    priority = {name: idx for idx, name in enumerate(_ALLOWED_SOURCE_TYPES)}
    return sorted(values, key=lambda item: priority.get(item, len(priority)))[0]


def validation_node(state: CompanyGraphState) -> Dict[str, Any]:
    project_candidates: List[Dict[str, Any]] = (
        state.get("project_candidates", []) or []
    )
    company_text = str(state.get("company_text", "") or "").strip()
    llm_output = _invoke_llm(company_text, project_candidates)
    parsed = _parse_llm_output(llm_output)
    canonical_sources, unknown_sources = _extract_source_types(state)
    require_source_validation = (
        str(os.getenv("REQUIRE_SOURCE_VALIDATION", "true")).strip().lower()
        in {"1", "true", "yes", "y"}
    )

    validation_opinions: List[Dict[str, Any]] = []
    for idx, project in enumerate(project_candidates):
        # "name" is treated as a candidate anchor from Tool1.
        anchor_name = str(project.get("name", ""))
        llm_item = parsed[idx] if idx < len(parsed) else {}
        project_statement = str(llm_item.get("project_statement", "")).strip()
        domain = str(llm_item.get("domain", "")).strip()
        problem = str(llm_item.get("problem", "")).strip()
        solution = str(llm_item.get("solution", "")).strip()
        tech = _normalize_tech(llm_item.get("tech"))
        is_valid = bool(llm_item.get("is_valid", False))
        item_sources, item_unknown = _extract_item_source_types(llm_item)
        candidate_sources = item_sources if item_sources else canonical_sources
        candidate_unknown = item_unknown if item_sources else unknown_sources
        source_is_valid = bool(candidate_sources)
        primary_source = _pick_primary_source_type(candidate_sources)

        if not company_text:
            if project_statement:
                is_valid = True

        if not project_statement or not problem or not solution or not tech:
            is_valid = False

        if require_source_validation and not source_is_valid:
            is_valid = False

        if not project_statement:
            project_statement = _default_statement(anchor_name)

        opinion: Dict[str, Any] = dict(project)
        opinion.update(
            {
                "is_valid": is_valid,
                "source_type": primary_source,
                "source_is_valid": source_is_valid,
                "source_unknown": candidate_unknown,
                # Tool2 provides the real, human-readable statement.
                "project_statement": project_statement,
                "domain": domain,
                "problem": problem,
                "solution": solution,
                "tech": tech,
            }
        )
        validation_opinions.append(opinion)

    existing_opinions: List[Dict[str, Any]] = state.get("validation_opinions", []) or []
    if existing_opinions:
        return {"validation_opinions": existing_opinions + validation_opinions}
    return {"validation_opinions": validation_opinions}
