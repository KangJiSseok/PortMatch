from typing import List, Optional
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from ..config import PPLX_MODEL, PPLX_BASE_URL, LLM_TEMPERATURE

router = APIRouter()


class PortfolioProject(BaseModel):
    projectName: str = Field(..., min_length=1)
    domain: str = ""
    problem: str = ""
    solution: str = ""
    tech: List[str] = Field(default_factory=list)


class CompanyProject(BaseModel):
    projectName: str = Field(..., min_length=1)
    domain: str = ""
    problem: str = ""
    solution: str = ""
    tech: List[str] = Field(default_factory=list)


class ExplanationRequest(BaseModel):
    companyName: str = Field(..., min_length=1)
    portfolio: PortfolioProject
    company: CompanyProject


class Headline(BaseModel):
    line1: str = Field(..., min_length=1)
    highlight: str = Field(..., min_length=1)
    line2: str = Field(..., min_length=1)
    line3: str = Field(..., min_length=1)


class Section(BaseModel):
    key: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    text: str = ""
    tags: List[str] = Field(default_factory=list)


class ExplanationResponse(BaseModel):
    companyName: str
    headline: Headline
    sections: List[Section]


PARSER = PydanticOutputParser(pydantic_object=ExplanationResponse)


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You write structured JSON that explains why a portfolio project matches a company project. "
            "Write in Korean, friendly and user-facing. "
            "Explain the match by domain, problem recognition, solution approach, and technology. "
            "Avoid overconfident speculation or technical certainty. "
            "Do not add new facts beyond the provided inputs. "
            "Never output null or empty fields. If a field would be empty, "
            "write a short, user-friendly sentence based only on the given inputs. "
            "Return JSON only, no Markdown, no extra text.",
        ),
        (
            "human",
            "다음은 한 지원자의 포트폴리오 프로젝트와 한 기업의 실제 프로젝트 정보이다.\n"
            "이 두 프로젝트가 왜 매칭되었는지를 도메인, 문제 인식, 해결 접근 방식, 기술 관점에서 자연어로 설명하라.\n"
            "- 사용자에게 설명하는 톤으로 작성하라.\n"
            "- 과도한 추측이나 기술적 단정은 피하라.\n\n"
            "- sections는 아래 3개 key를 반드시 포함하라: "
            "portfolioFocus, writingCheats, strategyGuide\n"
            "- writingCheats는 tags 배열만 채우고, 나머지 섹션은 text만 채워라.\n"
            "- highlight는 해시태그 1개로 작성하라(예: #문제해결).\n\n"
            "- 어떤 필드도 null/빈 문자열/빈 배열을 사용하지 말고, "
            "비어있을 것 같으면 입력 정보에서 유추 가능한 범위 내의 짧은 문장으로 채워라.\n\n"
            "- companyName은 입력값을 그대로 사용하라.\n\n"
            "[기업 정보]\n"
            "companyName: {companyName}\n\n"
            "[포트폴리오 프로젝트]\n"
            "{portfolio}\n\n"
            "[기업 프로젝트]\n"
            "{company}\n\n"
            "[출력 형식]\n"
            "{format_instructions}\n",
        ),
    ]
)


def _format_portfolio(project: PortfolioProject) -> str:
    tech = ", ".join([t for t in project.tech if t]) if project.tech else "없음"
    return (
        f"프로젝트명: {project.projectName}\n"
        f"도메인: {project.domain or '미상'}\n"
        f"문제: {project.problem or '미상'}\n"
        f"해결: {project.solution or '미상'}\n"
        f"기술: {tech}"
    )


def _format_company(project: CompanyProject, company_name: str) -> str:
    tech = ", ".join([t for t in project.tech if t]) if project.tech else "없음"
    name = company_name or "미상"
    return (
        f"기업명: {name}\n"
        f"프로젝트명: {project.projectName}\n"
        f"도메인: {project.domain or '미상'}\n"
        f"문제: {project.problem or '미상'}\n"
        f"해결: {project.solution or '미상'}\n"
        f"기술: {tech}"
    )


@router.post("/explanations/match", response_model=ExplanationResponse)
def explain_match(payload: ExplanationRequest) -> ExplanationResponse:
    pplx_key = os.getenv("PPLX_API_KEY")
    if not pplx_key:
        raise HTTPException(status_code=500, detail="PPLX_API_KEY is not set")

    llm = ChatOpenAI(
        model=PPLX_MODEL,
        temperature=LLM_TEMPERATURE,
        openai_api_key=pplx_key,
        openai_api_base=PPLX_BASE_URL,
    )
    chain = PROMPT | llm | PARSER

    try:
        result = chain.invoke(
            {
                "portfolio": _format_portfolio(payload.portfolio),
                "company": _format_company(payload.company, payload.companyName),
                "companyName": payload.companyName,
                "format_instructions": PARSER.get_format_instructions(),
            }
        )
    except Exception as exc:
        print(f"[explanation][error] {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502, detail=f"explanation failed: {type(exc).__name__}: {exc}"
        ) from exc

    if not result:
        raise HTTPException(status_code=502, detail="explanation failed: empty response")

    return result
