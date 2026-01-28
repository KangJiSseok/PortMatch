import os
from typing import Any, Dict

from graph.state import CompanyGraphState


def _build_prompt() -> "ChatPromptTemplate":
    from langchain_core.prompts import ChatPromptTemplate

    system_rules = (
        "You generate a plain-text company description.\n"
        "Rules:\n"
        "- Do NOT add markdown or bullet points.\n"
        "- Do NOT mention projects explicitly.\n"
        "- Do NOT include founding year or company history.\n"
        "- Do NOT include headquarters or office locations.\n"
        "- Do NOT include revenue, sales figures, financial performance, or valuation.\n"
        "- Do NOT include executives, ownership, or company size.\n"
        "- Focus on what the company does, products, platforms, systems, services.\n"
        "- Prefer concise, high-level descriptions over exhaustive details.\n"
        "- Include only widely known product/service names or technical terms.\n"
        "- If not clearly known, omit rather than guess.\n"
        "- Keep it to 3-5 sentences.\n"
        "Return plain text only."
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


def text_collection_node(state: CompanyGraphState) -> Dict[str, Any]:
    # Data ingestion only: generate or accept raw company text.
    company_text = str(state.get("company_text", "") or "").strip()
    if company_text:
        return {"company_text": company_text}

    company_name = str(state.get("company_name", "") or "").strip()
    if not company_name:
        return {"company_text": ""}

    generated = _invoke_llm(company_name)
    return {"company_text": str(generated or "").strip()}
