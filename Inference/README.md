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
  - `evidence` (snippet + source)
  - `support_type` (explicit/implicit/none)
  - `evidence_summary`
  - `is_valid` (예비 판단)
- 앵커(`name`)는 덮어쓰지 않습니다.

Tool4: 구조화 출력
- `is_valid=True`인 항목만 JSON으로 반환합니다.
- 앵커는 사용자에게 노출하지 않습니다.

## 실행 방법

기본 실행 (JSON 출력):

```powershell
python main.py "(주)틸론"
```

## API

FastAPI 서버 실행:

```powershell
uvicorn web.api.app:app --reload
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
