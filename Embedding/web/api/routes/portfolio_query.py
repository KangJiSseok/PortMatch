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
    expanded_concepts: List[str]
    embedding_model: str
    embedding_dim: int
    tech_embedding: List[float]
    keyword_embedding: List[float]
    architecture_embedding: List[float]
    unified_embedding: List[float]
    tech_missing: bool
    keyword_missing: bool
    architecture_missing: bool


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You extract structured tags from a Korean user query about portfolio experience. "
            "For explicit fields, only include what is directly stated. "
            "For expanded_concepts, infer related technologies and architectural patterns that would match the intent. "
            "Return JSON only. No Markdown.",
        ),
        (
            "human",
            "질의:\n{query}\n\n"
            "아래 기준으로 JSON을 만들어 주세요:\n"
            "- tech: 질의에 '명시된' 기술 스택/프레임워크/플랫폼/도구 명칭만 (영어 표기 선호)\n"
            "- keywords: 질의에 '명시된' 기능/주제/역량/도메인 키워드만 (짧게)\n"
            "- architecture_experience: 질의에 '명시된' 아키텍처/시스템 설계 관점의 한 문장 요약만\n"
            "- expanded_concepts: 질의의 의도와 의미적으로 연관된 기술/아키텍처 패턴/개념을 추론하여 추가 "
            "(예: '분산서버' → ['Kubernetes', 'Docker Swarm', '마이크로서비스', '로드밸런싱', '고가용성', 'scale-out'], "
            "'쿼리 최적화' → ['QueryDSL', 'JPA N+1', '인덱싱', '실행계획 분석'])\n"
            "- 각 필드는 문자열 배열\n"
            "- tech, keywords, architecture_experience는 추론/보완 금지 (질의에 명시된 것만)\n"
            "- expanded_concepts는 질의 의도에 맞는 관련 개념을 적극적으로 추론\n"
            "- 중복 제거\n"
            "출력 예시:\n"
            '{{"tech":[], "keywords":[], "architecture_experience":["단일 서버 구조를 분산 서버 구조로 확장"], '
            '"expanded_concepts":["Kubernetes", "Docker", "마이크로서비스", "로드밸런싱", "고가용성", "scale-out", "클러스터링"]}}\n',
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

    llm = ChatOpenAI(model=resolved_model, temperature=1)
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
    expanded_concepts = _normalize_list(decomposed.get("expanded_concepts"))

    tech_text = _join_or_placeholder(tech)
    keyword_text = _join_or_placeholder(keywords)
    architecture_text = _join_or_placeholder(architecture)
    
    # 통합 텍스트: 원래 쿼리 + 확장된 개념을 결합하여 의미적 매칭 향상
    all_concepts = tech + keywords + architecture + expanded_concepts
    unified_text = f"[질의] {query}\n[관련 기술/개념] {', '.join(all_concepts) if all_concepts else '정보 없음'}"

    embedding_result: EmbeddingsResponse = run_embeddings(
        [tech_text, keyword_text, architecture_text, unified_text],
        None,
    )

    return PortfolioQueryDecomposeResponse(
        query=query,
        tech=tech,
        keywords=keywords,
        architecture_experience=architecture,
        expanded_concepts=expanded_concepts,
        embedding_model=embedding_result.model,
        embedding_dim=embedding_result.dim,
        tech_embedding=embedding_result.vectors[0],
        keyword_embedding=embedding_result.vectors[1],
        architecture_embedding=embedding_result.vectors[2],
        unified_embedding=embedding_result.vectors[3],
        tech_missing=len(tech) == 0,
        keyword_missing=len(keywords) == 0,
        architecture_missing=len(architecture) == 0,
    )

