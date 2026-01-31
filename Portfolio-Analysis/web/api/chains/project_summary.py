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
            "프로젝트별로 name, domain, problem, solution, tech, architecture_experience, keywords를 추출하세요.\n"
            "name은 실제 프로젝트명 대신, 어떤 서비스인지 드러나는 한 줄 설명형 이름으로 작성하세요.\n"
            "예: \"AI 기반 도메인 적합성 서비스\", \"실시간 재고 예측 대시보드\"\n"
            "domain은 프로젝트 도메인을 짧은 라벨로 작성하세요(예: 의료, 헬스케어, 교육, 보안, 핀테크, 커머스 등).\n"
            "근거가 없으면 빈 문자열로 두세요.\n"
            "problem은 한 문장 한국어로 실제 문제/목표를 간결히 요약하세요.\n"
            "solution은 한 문장 한국어로 문제 해결 방법을 요약하되, 사용 기술을 명시하고\n"
            "가능하면 \"~을 활용하여 ~ 구현/개발\" 형태로 작성하세요.\n"
            "명시된 내용이 없으면 합리적으로 추론해도 되지만, 추론임이 드러나지 않게 간결히 작성하세요.\n"
            "정보가 전혀 없으면 빈 문자열로 두세요.\n\n"
            "tech는 문자열이 아니라 기술 스택 문자열 배열로 반환하세요. 예: [\"Spring\", \"Python\"]\n"
            "tech는 기술명만 짧게 적고, 프레임워크/라이브러리/플랫폼 위주로 구성하세요.\n"
            "tech는 가능한 한 영어 표기로 통일하세요.\n"
            "architecture_experience는 문자열 배열로 반환하세요.\n"
            "architecture_experience는 특정 기술명이 아니라,\n"
            "프로젝트에서 드러난 설계적 선택과 시스템적 문제 해결을\n"
            "아키텍처 관점의 짧은 키워드로 추상화한 결과입니다.\n"
            "예: 분산 처리, 수평 확장, 고가용성, 캐시 계층, 이벤트 기반, CQRS, 파이프라인, 메시지 큐, 배치 처리, 장애 격리 등\n"
            "포트폴리오에 직접적인 표현이 없더라도,\n"
            "사용 기술, 해결한 문제, 처리 방식이 명확하다면\n"
            "그 의미를 보수적으로 추론하여 포함할 수 있습니다.\n"
            "architecture_experience는 과도하게 일반적인 단어(예: 최적화, 성능향상)만 단독으로 쓰지 마세요.\n\n"
            "keywords는 문자열 배열로 반환하세요.\n"
            "keywords는 problem/solution/tech/architecture_experience로 명확히 분류하기 애매한\n"
            "프로젝트의 핵심 역량/특징/기능/주제 키워드를 담습니다.\n"
            "예: Real-time Data Comparison, Contextual Understanding of Domains, NLP Parsing, 추천, 개인화, 검색, 도메인 적합성, 사용자 행동 분석 등\n"
            "keywords는 최대한 짧고, 중복/동의어는 제거하세요.\n"
            "프로젝트 순서는 텍스트에 등장한 순서를 유지하세요.\n"
            "출력 형식은 반드시 JSON 배열입니다. 예:\n"
            '[{{"name":"", "domain":"", "problem":"", "solution":"", "tech":[], "architecture_experience":[], "keywords":[]}}]\n\n'
            "텍스트:\n{content}\n",
        ),
    ]
)



def build_project_summary_chain():
    llm = ChatOpenAI(model=OPENAI_MODEL, temperature=OPENAI_TEMPERATURE)
    parser = JsonOutputParser()
    chain = PROMPT | llm | parser
    return chain







