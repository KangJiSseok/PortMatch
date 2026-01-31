import os
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from .gemini_embeddings import EmbeddingsResponse, run_embeddings

router = APIRouter()


class PortfolioQueryDecomposeRequest(BaseModel):
    query: str = Field(..., min_length=1)
    model: Optional[str] = None


class PortfolioQueryDecomposeResponse(BaseModel):
    query: str
    tech: List[str]
    keywords: List[str]
    architecture_experience: List[str]
    embedding_model: str
    embedding_dim: int
    tech_embedding: List[float]
    keyword_embedding: List[float]
    architecture_embedding: List[float]
    tech_missing: bool
    keyword_missing: bool
    architecture_missing: bool


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You extract structured tags from a Korean user query about portfolio experience. "
            "Return JSON only. No Markdown.",
        ),
        (
            "human",
            "질의:\n{query}\n\n"
            "아래 기준으로 JSON을 만들어 주세요:\n"
            "- tech: 기술 스택/프레임워크/플랫폼/도구 명칭 (영어 표기 선호)\n"
            "- keywords: 기능/주제/역량/도메인 키워드 (짧게)\n"
            "- architecture_experience: 아키텍처/시스템 설계 관점 키워드 (짧게)\n"
            "- 각 필드는 문자열 배열\n"
            "- 추론은 보수적으로, 중복/동의어 제거\n"
            "출력 예시:\n"
            '{{"tech":["Kafka"], "keywords":["실시간 분석"], "architecture_experience":["분산 처리","수평 확장"]}}\n',
        ),
    ]
)


def _normalize_list(value) -> List[str]:
    if not isinstance(value, list):
        return []
    return [str(v).strip() for v in value if v is not None and str(v).strip()]


def _join_or_placeholder(items: List[str]) -> str:
    return ", ".join(items) if items else "정보 없음"


def _decompose_query(query: str, model: Optional[str]) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")

    resolved_model = (model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")).strip()
    if not resolved_model:
        raise HTTPException(status_code=500, detail="OPENAI_MODEL is not set")

    llm = ChatOpenAI(model=resolved_model, temperature=0.2)
    parser = JsonOutputParser()
    chain = PROMPT | llm | parser
    result = chain.invoke({"query": query})
    return result if isinstance(result, dict) else {}


@router.post(
    "/embeddings/portfolio-query",
    response_model=PortfolioQueryDecomposeResponse,
)
def portfolio_query_embeddings(payload: PortfolioQueryDecomposeRequest):
    query = (payload.query or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    decomposed = _decompose_query(query, payload.model)
    tech = _normalize_list(decomposed.get("tech"))
    keywords = _normalize_list(decomposed.get("keywords"))
    architecture = _normalize_list(decomposed.get("architecture_experience"))

    tech_text = _join_or_placeholder(tech)
    keyword_text = _join_or_placeholder(keywords)
    architecture_text = _join_or_placeholder(architecture)

    embedding_result: EmbeddingsResponse = run_embeddings(
        [tech_text, keyword_text, architecture_text],
        None,
    )

    return PortfolioQueryDecomposeResponse(
        query=query,
        tech=tech,
        keywords=keywords,
        architecture_experience=architecture,
        embedding_model=embedding_result.model,
        embedding_dim=embedding_result.dim,
        tech_embedding=embedding_result.vectors[0],
        keyword_embedding=embedding_result.vectors[1],
        architecture_embedding=embedding_result.vectors[2],
        tech_missing=len(tech) == 0,
        keyword_missing=len(keywords) == 0,
        architecture_missing=len(architecture) == 0,
    )
