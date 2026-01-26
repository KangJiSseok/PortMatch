# Inference

프로젝트 분석 결과를 JSON으로 반환하는 LangGraph 기반 파이프라인입니다.

## 파이프라인 개요

Tool0: 텍스트 수집 (LLM 회사 소개 생성)
- 회사명이 있을 때 `company_text`를 생성합니다.
- 데이터 수집 단계이며 프로젝트 추론은 하지 않습니다.

Tool1: 후보 앵커 생성
- 보수적인 고수준 앵커만 생성합니다.
- 필드 키는 `name`을 유지하지만 실제 프로젝트명이 아니라 앵커입니다.

Tool2: 검증 및 상세 추출
- `company_text`를 읽고 다음을 생성합니다:
  - `project_statement` (한국어 한 문장)
  - `problem` / `solution` / `tech`
  - `is_valid` (예비 판단)
- 앵커(`name`)는 덮어쓰지 않습니다.

Tool3: 유사/중복 제거
- Tool2 결과 중 `is_valid=True` 항목을 비교해 유사 프로젝트를 제외합니다.
- 중복으로 판단된 항목은 `is_valid=False`로 변경됩니다.

Tool4: 구조화 출력
- `is_valid=True`인 항목만 JSON으로 반환합니다.
- 앵커는 사용자에게 노출하지 않습니다.

## 그래프 구조

```
collect_text (Tool0)
  -> discovery (Tool1)
  -> validate (Tool2)
  -> dedup (Tool3)
  -> structure (Tool4)
  -> END
```

## 실행 방법

기본 실행 (JSON 출력):

```powershell
python main.py "(주)틸론"
```

## API

FastAPI 서버 실행:

```powershell
uvicorn web.api.app:app --reload --host 0.0.0.0 --port 8001
```

요청:

```json
POST /api/company-project-analysis
{
  "company_name": "(주)틸론"
}
```

응답:

```json
{
  "projects": [
    {
      "project_name": "string",
      "problem": "string",
      "solution": "string",
      "tech": ["string"]
    }
  ]
}
```
