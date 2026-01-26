import json
import os
import re
from typing import Any, Dict, List

from graph.state import CompanyGraphState


def _build_prompt() -> "ChatPromptTemplate":
    from langchain_core.prompts import ChatPromptTemplate

    system_rules = (
        "You validate candidate anchors against company text.\n"
        "Rules:\n"
        "- Candidate anchors are NOT real project names.\n"
        "- If company_text is empty, you MAY infer cautiously from the anchors.\n"
        "- Do NOT add new candidates that are not provided.\n"
        "- Do NOT invent detailed functionality.\n"
        "- Avoid near-duplicate outputs across candidates; do not reuse the same problem/solution text.\n"
        "- If two candidates overlap heavily, make them distinct or mark the weaker one is_valid=false.\n"
        "- If the candidate describes market expansion, partnerships, or general business strategy rather than a project,\n"
        "  mark is_valid=false.\n"
        "- project_statement must be a single Korean sentence.\n"
        "- problem must describe a real-world issue, limitation, or challenge faced by users or the domain.\n"
        "- problem should focus on the situation or need, not on technical implementation details.\n"
        "- solution must be a single Korean sentence describing how the problem was addressed.\n"
        "- solution must explicitly mention the technologies used and what was implemented, "
        "using patterns like \"~을 활용하여 ~ 구현/개발\".\n"
        "- tech must be a list of short strings (technology names only).\n"
        "- If support is weak, use cautious wording like \"...수행한 것으로 보입니다.\".\n"
        "- Preserve the input order.\n"
        "Return JSON only. No prose.\n"
        "Examples (for style only, do not copy verbatim):\n"
        "problem: ALS 환자가 의사 표현을 하기 어려운 상황\n"
        "solution: OpenCV와 Deep Learning을 활용하여 얼굴 인식 및 안구 마우스 기반 입력 시스템을 개발\n"
        "Output schema:\n"
        "[{{"
        "\"project_statement\": str,"
        "\"problem\": str,"
        "\"solution\": str,"
        "\"tech\": [str],"
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
        llm_item = parsed[idx] if idx < len(parsed) else {}
        project_statement = str(llm_item.get("project_statement", "")).strip()
        problem = str(llm_item.get("problem", "")).strip()
        solution = str(llm_item.get("solution", "")).strip()
        tech = _normalize_tech(llm_item.get("tech"))
        is_valid = bool(llm_item.get("is_valid", False))

        if not company_text:
            if project_statement:
                is_valid = True

        if not project_statement:
            project_statement = _default_statement(anchor_name)

        opinion: Dict[str, Any] = dict(project)
        opinion.update(
            {
                "is_valid": is_valid,
                # Tool2 provides the real, human-readable statement.
                "project_statement": project_statement,
                "problem": problem,
                "solution": solution,
                "tech": tech,
            }
        )
        validation_opinions.append(opinion)

    return {"validation_opinions": validation_opinions}
