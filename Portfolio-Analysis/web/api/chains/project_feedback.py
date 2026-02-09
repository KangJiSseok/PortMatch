from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from ..config import OPENAI_MODEL

HOLD = "구체적인 내용 보완이 필요하여 작성을 보류함"

PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "너는 한국어 포트폴리오 첨삭 전문가다. JSON만 출력한다. "
            "입력에 없는 사실은 추가하지 않는다. "
            "추론이 필요한 경우에는 사실을 만들지 말고 질문/요청 형태로 표현한다. "
            "반드시 Markdown 포맷 없이 순수 JSON 텍스트만 출력한다. "
            "Do not include any text other than the JSON object itself. "
            # ADD: 스타일 강제
            "problem/solution은 짧고 사실 기반이며, 프로젝트 간 일관된 문체로 작성한다."
        ),
        (
            "system",
            "중요 규칙(위반 금지):\n"
            "1) rewritten은 '문장 다듬기'만 한다. 의미/사실/범위를 절대 바꾸지 않는다.\n"
            "2) rewritten에서 입력에 없던 구체 요소(예: 벡터화, ETL, 단어 일치 등)를 새로 추가하지 않는다.\n"
            "3) rewritten은 가능한 한 입력 텍스트에 실제로 등장한 단어/표현을 재배열하여 작성한다(동의어 과도 사용 금지).\n"
            "4) 근거가 불명확하면 확정 서술하지 말고 feedback.questions로 물어본다.\n"
            "5) problem/solution이 존재(비어있지 않음)하면 rewritten에 HOLD를 쓰지 말고 반드시 짧게 개선한다.\n"
            f"6) HOLD('{HOLD}')는 problem/solution이 null이거나 너무 짧아(핵심 정보 부족) 최소 개선도 불가능할 때만 사용한다.\n"
            # ADD: 순서/이름/도메인 규칙 강화
            "7) 프로젝트 순서는 입력 텍스트에 등장한 순서를 유지한다.\n"
            "8) name은 실제 고유명(프로젝트명) 복사보다, 서비스가 드러나는 한 줄 설명형 이름을 우선한다.\n"
            "9) domain은 짧은 라벨(예: 채용, 커머스, 핀테크, 교육 등)로만 작성하며, 근거 없으면 null.\n"
        ),
        (
            "system",
            "[Example Interaction]\n"
            "Input Text:\n"
            "프로젝트: 블로그\n"
            "리액트로 블로그를 만들었고 파이어베이스로 배포함.\n"
            "Output JSON:\n"
            "{{\n"
            "  \"projects\": [\n"
            "    {{\n"
            "      \"name\": \"React 기반 블로그 서비스\",\n"  # ADD: 설명형 name 예시
            "      \"domain\": null,\n"
            "      \"problem\": \"블로그 서비스를 구현해야 했습니다.\",\n"  # ADD: 일관된 문체
            "      \"solution\": \"React와 Firebase를 활용해 블로그를 구현하고 배포했습니다.\",\n"
            "      \"tech\": [\"React\", \"Firebase\"],\n"
            "      \"role\": null,\n"
            "      \"metrics\": null,\n"
            "      \"feedback\": {{\n"
            "        \"missing\": [\"role\", \"metrics\"],\n"
            "        \"issues\": [\n"
            "          \"담당 역할이 명시되지 않았습니다.\",\n"
            "          \"성과가 정량화되어 있지 않습니다.\"\n"
            "        ],\n"
            "        \"questions\": [\n"
            "          \"왜 React를 선택했나요?\",\n"
            "          \"가장 어려웠던 문제와 해결 과정을 STAR로 설명해 주세요.\"\n"
            "        ],\n"
            "        \"rewritten\": {{\n"
            "          \"problem\": \"블로그 서비스를 구현해야 했습니다.\",\n"
            "          \"solution\": \"React와 Firebase를 활용해 블로그를 구현하고 배포했습니다.\"\n"
            "        }}\n"
            "      }}\n"
            "    }}\n"
            "  ]\n"
            "}}\n"
        ),
        (
            "human",
            "다음은 포트폴리오에서 추출한 텍스트이다.\n"
            "텍스트에서 프로젝트를 식별하고 프로젝트별로 아래 스키마에 맞게 정리하라.\n"
            "프로젝트 구분 기준(가능한 경우 적용):\n"
            "- '프로젝트', 'Project', '프로젝트명', '서비스명' 같은 헤더/라벨로 시작하는 섹션을 우선 분리\n"
            "- 번호/불릿으로 구분된 항목(예: 1., 2., -, •)을 프로젝트 단위로 인식\n"
            "- 프로젝트명이 명시되지 않으면 가장 대표 기능/서비스를 한 줄로 요약해 name으로 사용\n"
            "- 동일 프로젝트로 보이는 내용은 하나로 합치고, 서로 다른 프로젝트는 분리\n"
            "- 프로젝트 순서는 텍스트에 등장한 순서를 유지\n"  # ADD

            "\n출력 스키마(반드시 준수):\n"
            "- projects[].name/domain/problem/solution/tech/role/metrics\n"
            "- projects[].feedback.missing/issues/questions/rewritten(problem,solution)\n\n"

            "필드 작성 규칙:\n"
            "- name: 실제 고유명 복사보다, 서비스가 드러나는 한 줄 설명형 이름을 우선한다.\n"  # ADD
            "- domain: 짧은 라벨로만 작성하며, 근거 없으면 null.\n"  # ADD
            "- problem/solution/role/metrics는 텍스트에 근거가 있을 때만 채운다. 없으면 null.\n"
            "- tech는 텍스트에 명시된 것만 배열로 넣는다(입력에 없는 기술 추가 금지). 없으면 [].\n"  # ADD: 금지 명시 강화
            "- problem/solution은 짧고 사실 기반, 일관된 문체로 작성한다.\n"  # ADD

            "\n첨삭 규칙:\n"
            "- why_tech(기술 선택 이유)가 없으면 questions에 \"왜 <핵심 기술>을 선택했나요?\" 추가\n"
            "- 트러블슈팅/문제 해결 과정이 없으면 questions에 STAR 요청 추가\n"
            "- role이 없으면 missing에 role, issues에 역할 누락 지적\n"
            "- metrics가 없으면 missing에 metrics, issues에 성과 정량화 누락 지적\n"
            "- rewritten은 기존 문장이 있는(problem/solution) 필드만 '짧고 명확하게' 다듬는다.\n"
            "- rewritten에서 사실/범위/세부 구현을 추가하지 않는다.\n"
            "- 근거가 불명확한 부분은 확정 서술 대신 questions로 유도한다.\n"  # ADD (재강조)

            f"\nHOLD 규칙:\n"
            f"- problem 또는 solution이 null이거나, 너무 짧아(핵심이 없음) 개선이 불가능하면 해당 rewritten에 \"{HOLD}\"를 넣는다.\n"
            "- 그 외에는 HOLD 금지(반드시 개선 문장 작성).\n\n"

            "입력 텍스트:\n{content}\n"
        ),
    ]
)

def build_project_feedback_chain():
    llm = ChatOpenAI(model=OPENAI_MODEL, temperature=0)
    parser = JsonOutputParser()
    return PROMPT | llm | parser
