from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from ..config import OPENAI_MODEL, OPENAI_TEMPERATURE


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You extract project summaries from a Korean portfolio. "
            "Return JSON only. No Markdown, no extra text.",
        ),
        (
            "human",
            "다음은 포트폴리오에서 추출한 텍스트입니다.\n"
            "프로젝트별로 name, problem, solution, tech를 추출하세요.\n"
            "problem에는 프로젝트에서 해결하려던 문제/목표를 간결하게 요약하세요.\n"
            "solution에는 문제를 해결하기 위해 사용한 접근/방법을 간결하게 요약하세요.\n"
            "명시된 내용이 없으면 합리적으로 추론해도 되지만, 추론임이 드러나지 않게 간결히 작성하세요.\n"
            "정보가 전혀 없으면 빈 문자열로 두세요.\n\n"
            "tech는 문자열이 아니라 기술 스택 문자열 배열로 반환하세요. 예: [\"Spring\", \"Python\"]\n"
            "프로젝트 순서는 텍스트에 등장한 순서를 유지하세요.\n"
            "출력 형식은 반드시 JSON 배열입니다. 예:\n"
            '[{{"name":"", "problem":"", "solution":"", "tech":[]}}]\n\n'
            "텍스트:\n{content}\n",
        ),
    ]
)


def build_project_summary_chain():
    llm = ChatOpenAI(model=OPENAI_MODEL, temperature=OPENAI_TEMPERATURE)
    parser = JsonOutputParser()
    chain = PROMPT | llm | parser
    return chain
