# Inference

증거 기반 회사 프로젝트 파이프라인의 추론/런타임 폴더입니다. LangGraph 뼈대와 룰 기반 스코어링만 구성해 두었고, 실제 크롤링/LLM 호출은 구현하지 않았습니다.

## 폴더 구조

- `graph/`
  - LangGraph 오케스트레이션 코드 전용.
  - `graph/state.py` : 그래프 상태(TypedDict).
  - `graph/company_graph.py` : 그래프 구성 및 노드 연결.
  - `graph/edges.py` : 조건 분기 헬퍼 함수.
  - `graph/nodes/` : 각 단계 노드 스텁.
- `web/`
  - 비즈니스 로직 계층.
  - `web/services/` : 룰 스코어러 등 결정 로직.
  - `web/schemas/` : 요청/응답 스키마.
  - `web/domain/` : 도메인 모델.
  - `web/config/` : 설정 로딩/환경 변수.
- `laboratory/`
  - 개발자별 실험 공간. (예: `laboratory/kangjiseok/`)
- `docs_cache/`
  - 문서 처리 캐시.
- `runs/`
  - 실행 결과 로그/산출물.
- `temp_files/`
  - 임시 파일.

## 실행 진입점

- `main.py`
  - `company_name`을 입력받아 그래프를 실행하고 구조화 결과를 출력합니다.

## 파이프라인 단계

- Tool1: 프로젝트 발견 (Mock)
- Tool2: LLM 검증
- Tool2.5: 룰 스코어링
- Tool3: 커버리지 체크
- Tool4: 구조화 출력

## Tool2 출력 포맷 (confidence_score 포함)

## Tool2.5 목표 및 룰셋 (MVP)

- 목표: LLM의 자연어 판단을 기계적으로 검증 가능한 결정으로 변환
- R1. evidence snippet ≥ 2 AND source 서로 다름 → +2
- R2. support_type = explicit → +2
- R3. support_type = implicit → +1
- R4. source = homepage / press / report → +1
- R5. source = job_posting only → evidence_strength ≤ medium
- R6. evidence_summary에 추정 표현 다수 → -2
- R7. project_name에 '플랫폼/서비스/시스템' 없음 → -1

### 결정 로직 예시

- score ≥ 4 → final_is_supported = true, strength = high
- score 2~3 → true, strength = medium
- score < 2 → false

## 참고

- `.venv/`, `.idea/`는 개발 환경별 설정입니다.
- `runs/`, `docs_cache/`, `temp_files/`는 폴더만 추적하고 내부 파일은 제외합니다.
- 빈 폴더 추적을 위해 `.gitkeep`을 사용합니다.
