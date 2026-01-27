from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from ..config import OPENAI_MODEL, OPENAI_TEMPERATURE


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You extract project summaries from a Korean portfolio. "
            "Return JSON only. No Markdown, no extra text. "
            "Do not hallucinate. If evidence is weak or missing, use empty strings or []."
        ),
        (
            "human",
            "다음 텍스트에서 프로젝트별로 아래 스키마를 정확히 지켜 추출하세요.\n"
            "각 항목은 반드시 다음 키를 모두 포함해야 합니다:\n"
            "{{\"name\":\"\", \"problem\":\"\", \"solution\":\"\", \"tech\":[]}}\n\n"
            "- name: 프로젝트명(명시된 경우 그대로, 없으면 핵심 키워드로 짧게)\n"
            "- problem: 해결하려던 문제/목표. 직접 문장이 없더라도 기능/대상/맥락에서 합리적으로 요약 가능하면 1문장으로 작성. 근거가 전혀 없으면 \"\".\n"
            "- solution: 사용한 접근/방법. 직접 문장이 없더라도 기능/구현/흐름에서 합리적으로 요약 가능하면 1문장으로 작성. 근거가 전혀 없으면 \"\".\n"
            "- tech: 기술 스택 문자열 배열. 언어/프레임워크/DB/클라우드/라이브러리/프로토콜 위주.\n"
            "  * \"AI\", \"딥러닝\", \"플랫폼\" 같은 추상 개념만 단독으로 넣지 말고, 구체 기술(OpenCV, CNN 등)이 있으면 그것을 우선.\n"
            "  * 중복 제거, 표기 통일(Spring Boot vs Spring 등)\n\n"
            "프로젝트 순서는 텍스트 등장 순서를 유지하세요.\n"
            "출력은 반드시 JSON 배열만 반환하세요.\n\n"
            "텍스트:\n{content}\n",
        ),
    ]
)



def build_project_summary_chain():
    llm = ChatOpenAI(model=OPENAI_MODEL, temperature=OPENAI_TEMPERATURE)
    parser = JsonOutputParser()
    chain = PROMPT | llm | parser
    return chain







