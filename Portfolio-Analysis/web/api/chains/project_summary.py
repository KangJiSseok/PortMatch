from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from ..config import OPENAI_MODEL, OPENAI_TEMPERATURE


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You extract project summaries from a Korean portfolio. "
            "Keep problem/solution short and factual in a consistent style. "
            "Return JSON only. No Markdown, no extra text.",
        ),
        (
            "human",
            "다음은 포트폴리오에서 추출한 텍스트입니다.\n"
            "프로젝트별로 name, problem, solution, tech를 추출하세요.\n"
            "problem은 한 문장 한국어로 실제 문제/목표를 간결히 요약하세요.\n"
            "solution은 한 문장 한국어로 문제 해결 방법을 요약하되, 사용 기술을 명시하고\n"
            "가능하면 \"~을 활용하여 ~ 구현/개발\" 형태로 작성하세요.\n"
            "명시된 내용이 없으면 합리적으로 추론해도 되지만, 추론임이 드러나지 않게 간결히 작성하세요.\n"
            "정보가 전혀 없으면 빈 문자열로 두세요.\n\n"
            "tech는 문자열이 아니라 기술 스택 문자열 배열로 반환하세요. 예: [\"Spring\", \"Python\"]\n"
            "tech는 기술명만 짧게 적고, 프레임워크/라이브러리/플랫폼 위주로 구성하세요.\n"
            "tech는 가능한 한 영어 표기로 통일하세요.\n"
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
