import hashlib
import json
import os
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from .gemini_embeddings import EmbeddingsResponse, run_embeddings

router = APIRouter()


class JobPostingEmbeddingRequest(BaseModel):
    content: str = Field(..., min_length=1)
    model: Optional[str] = None
    embedding_model: Optional[str] = None


class JobPostingEmbeddingResponse(BaseModel):
    name: str
    domain: str
    problem: str
    solution: str
    tech: List[str]
    architecture_experience: List[str]
    keywords: List[str]
    content: str
    content_hash: str
    embedding_model: str
    embedding_dim: int
    name_embedding: List[float]
    domain_embedding: List[float]
    problem_embedding: List[float]
    solution_embedding: List[float]
    tech_embedding: List[float]
    architecture_embedding: List[float]
    keywords_embedding: List[float]
    problem_missing: bool
    solution_missing: bool
    tech_missing: bool
    architecture_missing: bool


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert at analyzing Korean job postings. "
            "Extract structured information from job posting details. "
            "Focus on what the company does and what skills/experience they need. "
            "Return JSON only. No Markdown, no extra text."
        ),
        (
            "human",
            "다음은 채용공고의 상세 정보입니다.\n"
            "이 공고에서 name, domain, problem, solution, tech, architecture_experience, keywords를 추출하세요.\n\n"
            
            "name은 이 포지션에서 개발/담당하게 될 서비스나 시스템을 한 줄로 설명하세요.\n"
            "예: \"AI 기반 통합 모니터링 플랫폼\", \"B2B SaaS 인력관리 솔루션\"\n\n"
            
            "domain은 프로젝트가 속한 산업/문제 영역을 나타내는 짧은 라벨로 작성하세요.\n"
            "산업 도메인, 기술 중심 서비스, 플랫폼 유형, 문제 영역 모두 가능합니다..\n"
            "예시에 한정되지 않으며, 프로젝트 내용에 가장 적합한 도메인을 자유롭게 정의하세요.\n"
            "예시 : 의료, 헬스케어, 교육, 보안, 핀테크, 커머스, HR, SaaS, 개발자도구, AI, 데이터, 추천시스템, 검색, 인프라, DevOps 등\n"
            
            "problem은 이 회사/서비스가 해결하려는 문제를 한 문장으로 요약하세요.\n"
            "주요업무나 회사 소개에서 힌트를 얻으세요.\n\n"
            
            "solution은 그 문제를 어떻게 해결하는지 한 문장으로 요약하세요.\n"
            "가능하면 핵심 기술이나 접근 방식을 포함하세요.\n\n"
            
            "tech는 자격요건/우대사항에서 언급된 기술 스택을 문자열 배열로 반환하세요.\n"
            "프레임워크, 라이브러리, 플랫폼, 도구 위주로 영어 표기 통일.\n"
            "예: [\"Spring Boot\", \"JPA\", \"Kubernetes\", \"PostgreSQL\"]\n\n"
            
            "architecture_experience는 자격요건에서 요구하는 아키텍처/시스템 설계 경험을 배열로 반환하세요.\n"
            "각 항목은 한 문장으로 작성하세요.\n"
            "예: [\"MSA 설계 및 운영 경험\", \"대규모 트래픽 성능 최적화\", \"멀티클라우드 환경 구축\"]\n\n"
            
            "keywords는 위 항목에 포함되지 않은 핵심 역량/특징/주제 키워드를 배열로 반환하세요.\n"
            "예: [\"실시간 처리\", \"데이터 수집\", \"SaaS\", \"글로벌 확장\"]\n\n"
            
            "혜택 및 복지, 채용 전형 등 직무와 관련 없는 내용은 무시하세요.\n"
            "정보가 없는 필드는 빈 문자열 또는 빈 배열로 두세요.\n\n"
            
            "출력 형식은 반드시 JSON 객체입니다. 예:\n"
            '{{\"name\":\"\", \"domain\":\"\", \"problem\":\"\", \"solution\":\"\", \"tech\":[], \"architecture_experience\":[], \"keywords\":[]}}\n\n'
            
            "채용공고 상세:\n{content}\n"
        ),
    ]
)


def _normalize_list(value) -> List[str]:
    if not isinstance(value, list):
        return []
    return [str(v).strip() for v in value if v is not None and str(v).strip()]


def _build_field_text(label: str, value: str) -> str:
    if not value or value.strip() == "":
        return f"[{label}] 정보 없음"
    return f"[{label}] {value.strip()}"


def _parse_job_posting(content: str, model: Optional[str]) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")

    resolved_model = (model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")).strip()
    if not resolved_model:
        raise HTTPException(status_code=500, detail="OPENAI_MODEL is not set")

    temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.2"))
    llm = ChatOpenAI(model=resolved_model, temperature=temperature)
    parser = JsonOutputParser()
    chain = PROMPT | llm | parser
    result = chain.invoke({"content": content})
    return result if isinstance(result, dict) else {}


@router.post("/embeddings/job-posting", response_model=JobPostingEmbeddingResponse)
def job_posting_embeddings(payload: JobPostingEmbeddingRequest) -> JobPostingEmbeddingResponse:
    content = (payload.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="content is required")

    parsed = _parse_job_posting(content, payload.model)
    name = str(parsed.get("name") or "").strip()
    domain = str(parsed.get("domain") or "").strip()
    problem = str(parsed.get("problem") or "").strip()
    solution = str(parsed.get("solution") or "").strip()
    tech = _normalize_list(parsed.get("tech"))
    architecture = _normalize_list(parsed.get("architecture_experience"))
    keywords = _normalize_list(parsed.get("keywords"))

    parsed_payload = {
        "name": name,
        "domain": domain,
        "problem": problem,
        "solution": solution,
        "tech": tech,
        "architecture_experience": architecture,
        "keywords": keywords,
    }
    content_json = json.dumps(parsed_payload, ensure_ascii=False)
    content_hash = hashlib.sha256(content_json.encode("utf-8")).hexdigest()

    tech_str = ", ".join(tech) if tech else "정보 없음"
    architecture_str = "; ".join(architecture) if architecture else "정보 없음"
    keywords_str = ", ".join(keywords) if keywords else "정보 없음"

    texts = [
        _build_field_text("project", name),
        _build_field_text("domain", domain),
        _build_field_text("problem", problem),
        _build_field_text("solution", solution),
        _build_field_text("tech", tech_str),
        _build_field_text("architecture", architecture_str),
        _build_field_text("keywords", keywords_str),
    ]

    embedding_result: EmbeddingsResponse = run_embeddings(
        texts,
        payload.embedding_model,
    )

    if not embedding_result.vectors or len(embedding_result.vectors) != 7:
        raise HTTPException(status_code=502, detail="embedding failed: vector size mismatch")

    return JobPostingEmbeddingResponse(
        name=name,
        domain=domain,
        problem=problem,
        solution=solution,
        tech=tech,
        architecture_experience=architecture,
        keywords=keywords,
        content=content_json,
        content_hash=content_hash,
        embedding_model=embedding_result.model,
        embedding_dim=embedding_result.dim,
        name_embedding=embedding_result.vectors[0],
        domain_embedding=embedding_result.vectors[1],
        problem_embedding=embedding_result.vectors[2],
        solution_embedding=embedding_result.vectors[3],
        tech_embedding=embedding_result.vectors[4],
        architecture_embedding=embedding_result.vectors[5],
        keywords_embedding=embedding_result.vectors[6],
        problem_missing=problem == "",
        solution_missing=solution == "",
        tech_missing=len(tech) == 0,
        architecture_missing=len(architecture) == 0,
    )
