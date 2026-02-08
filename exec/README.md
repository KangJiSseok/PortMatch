# S14P11D205 프로젝트 개발 및 배포 매뉴얼

## 목차
1. [개발환경](#1-개발환경)
2. [환경변수](#2-환경변수)
3. [빌드 및 배포](#3-빌드-및-배포)

---

## 1. 개발환경
### 1.1. Frontend (Web / React)
* **Runtime**: Node.js 20 (Docker `node:20-alpine`)
* **Framework**: Vite 7 + React 19 + TypeScript
* **UI/State/ETC**: `@tanstack/react-query`, `zustand`, `react-router-dom`, `tailwindcss`, `framer-motion`, `lucide-react`, `firebase`, `openvidu-browser`, `peerjs`

### 1.2. Backend (Java / Spring Boot)
* **Java**: Eclipse Temurin 21
* **Framework**: Spring Boot 3.5.9
* **Build Tool**: Gradle (Wrapper)
* **Key Dependencies**: Spring Web/Security/JPA/Validation, QueryDSL 5.1.0, AWS SDK S3 2.25.28, Flyway, Swagger (springdoc 2.6.0), OpenVidu Java Client 2.30.0, Prometheus (micrometer)

### 1.3. AI/LLM Services (Python / FastAPI)
* **Runtime**: Python 3.12-slim (Inference/Embedding/Portfolio/Explanation)
* **Framework**: FastAPI 0.111.0, Uvicorn 0.40.0
* **LangChain Stack**: `langchain`, `langchain-core`, `langgraph`, `langchain-openai`
* **Services**: `portfolio-analysis` (8000), `inference` (8001), `embedding` (8002), `explanation-llm` (8003)

### 1.4. Crawler (Python)
* **Runtime**: Python 3.11-slim
* **Deps**: `requests`, `SQLAlchemy`, `psycopg2-binary`, `langchain`

### 1.5. Database & Infra
* **PostgreSQL**: pgvector/pgvector:pg17
* **PeerJS**: peerjs/peerjs-server
* **Monitoring**: Prometheus, Grafana
* **Web Server**: Nginx 1.25 (Frontend 정적 배포)

### 1.6. IDE & Tools
* IntelliJ, VS Code
* GitLab CI/CD
* Docker / Docker Compose

---

## 2. 환경변수
> 실제 값은 `.env` 파일로 관리하며, 아래는 **키 목록**입니다.

### 2.1. Frontend (Vite)
* `VITE_API_BASE_URL` - 프론트에서 호출할 백엔드 API 기본 URL (로컬 예: `/api` 또는 `http://localhost:8102`)
* `VITE_SERVICE_NAME` - 서비스 표시명/타이틀 (로컬 예: `PortMatch`)
* `VITE_OPENVIDU_PUBLIC_URL` - OpenVidu 공개 접속 URL (사용 시, 로컬 예: `http://localhost:4443`)
* `VITE_FIREBASE_API_KEY` - Firebase 클라이언트 API 키
* `VITE_FIREBASE_AUTH_DOMAIN` - Firebase 인증 도메인 (예: `xxxx.firebaseapp.com`)
* `VITE_FIREBASE_PROJECT_ID` - Firebase 프로젝트 ID
* `VITE_FIREBASE_STORAGE_BUCKET` - Firebase 스토리지 버킷 (예: `xxxx.appspot.com`)
* `VITE_FIREBASE_MESSAGING_SENDER_ID` - FCM Sender ID
* `VITE_FIREBASE_APP_ID` - Firebase 앱 ID
* `VITE_FIREBASE_MEASUREMENT_ID` - GA4 Measurement ID (사용 시)

### 2.2. Backend / AI 공통 (`.env`)
* **DB**
* `POSTGRES_DB` - DB 이름 (로컬 예: `portmatch`)
* `POSTGRES_USER` - DB 사용자 (로컬 예: `portmatch`)
* `POSTGRES_PASSWORD` - DB 비밀번호 (로컬 예: `portmatch`)
* `DB_HOST` - DB 호스트(서비스명/주소) (로컬 예: `db`)
* `DB_PORT` - DB 포트 (로컬 예: `5432`)
* `SPRING_DATASOURCE_URL` - Spring JDBC URL (로컬 예: `jdbc:postgresql://db:5432/portmatch`)
* `SPRING_DATASOURCE_USERNAME` - Spring DB 사용자 (로컬 예: `portmatch`)
* `SPRING_DATASOURCE_PASSWORD` - Spring DB 비밀번호 (로컬 예: `portmatch`)
* **JPA/로그**
* `SPRING_FLYWAY_ENABLED` - Flyway 마이그레이션 사용 여부 (로컬 예: `false`)
* `SPRING_JPA_HIBERNATE_DDL_AUTO` - JPA 스키마 생성 전략 (로컬 예: `none`)
* `JPA_SHOW_SQL` - SQL 로그 출력 여부 (로컬 예: `false`)
* `HIBERNATE_FORMAT_SQL` - SQL 포맷팅 여부 (로컬 예: `false`)
* **AWS**
* `AWS_S3_BUCKET` - S3 버킷명 (로컬 예: `portmatch`)
* `AWS_REGION` - 리전 (로컬 예: `ap-northeast-2`)
* `AWS_ACCESS_KEY` - 액세스 키
* `AWS_SECRET_KEY` - 시크릿 키
* **LLM/Embedding**
* `OPENAI_API_KEY` - OpenAI API 키
* `OPENAI_MODEL` - OpenAI 모델명 (로컬 예: `gpt-4.1-mini`)
* `OPENAI_TEMPERATURE` - OpenAI temperature (로컬 예: `0.2`)
* `GEMINI_API_KEY` - Gemini API 키
* `GEMINI_EMBEDDING_MODEL` - Gemini 임베딩 모델 (로컬 예: `models/gemini-embedding-001`)
* `GEMINI_OUTPUT_DIMENSIONS` - Gemini 임베딩 차원 (로컬 예: `1536`)
* `GEMINI_BASE_URL` - Gemini API Base URL (로컬 예: `https://generativelanguage.googleapis.com`)
* `PPLX_API_KEY` - Perplexity API 키
* `PPLX_MODEL` - Perplexity 모델 (로컬 예: `sonar`)
* `PPLX_BASE_URL` - Perplexity API Base URL (로컬 예: `https://api.perplexity.ai`)
* **Internal Services**
* `PORTFOLIO_ANALYSIS_URL` - 포트폴리오 분석 서비스 URL (로컬 예: `http://portfolio-analysis:8000`)
* `COMPANY_PROJECT_ANALYSIS_URL` - 회사/프로젝트 분석 서비스 URL (로컬 예: `http://inference:8001`)
* `EMBEDDING_URL` - 임베딩 서비스 URL (로컬 예: `http://embedding:8002`)
* `EXPLANATION_URL` - 설명 LLM 서비스 URL (로컬 예: `http://explanation-llm:8003`)
* `MINERU_ENDPOINT` - MinerU 파일 파싱 엔드포인트 (로컬 예: `http://mineru-api:8000/file_parse`)
* **Observability**
* `GF_SECURITY_ADMIN_USER` - Grafana 관리자 계정 (로컬 예: `port`)
* `GF_SECURITY_ADMIN_PASSWORD` - Grafana 관리자 비밀번호 (로컬 예: `match`)

---


## 3. 빌드 및 배포

### 3.1. 로컬/실행용 (docker-compose.exec.yml)
```bash
# 네트워크 생성 (1회)
docker network create portmatch-shared-network

# 실행 (빌드 포함)
docker compose -f docker-compose.exec.yml up -d --build

# 상태/로그
docker compose -f docker-compose.exec.yml ps
docker compose -f docker-compose.exec.yml logs -f
```

---

## 4. 더미데이터 로딩
`DB/portmatch_data_only.sql`을 PostgreSQL에 주입하는 방법입니다.

### 4.1. 로컬/exec 환경 (docker-compose.exec.yml)
```bash
docker exec -i portmatch-db psql -U portmatch -d portmatch < DB/portmatch_data_only.sql
```

---

## 5. 로컬 실행 엔드포인트 (docker-compose.exec.yml)
`.env` 기준으로 로컬에서 접근 가능한 주요 엔드포인트입니다.

### 5.1. Frontend
* Web: `http://localhost`

### 5.2. Backend (Spring)
* API: `http://localhost:8102`
* 내부 연동용: `http://backend:8080`

### 5.3. AI/LLM Services
* Portfolio Analysis: `http://localhost:8103` (컨테이너 `portfolio-analysis:8000`)
* Inference: `http://localhost:8104` (컨테이너 `inference:8001`)
* Embedding: `http://localhost:8105` (컨테이너 `embedding:8002`)
* Explanation LLM: `http://localhost:8106` (컨테이너 `explanation-llm:8003`)
* MinerU: `http://localhost:8000` (컨테이너 `mineru-api:8000`)

### 5.4. Realtime / Signaling
* PeerJS Server: `http://localhost:9000`

### 5.5. Monitoring
* Prometheus: `http://localhost:8050`
* Grafana: `http://localhost:8051` (초기 계정은 `.env`의 `GF_SECURITY_ADMIN_USER`, `GF_SECURITY_ADMIN_PASSWORD`)

### 5.6. Database (로컬 접근용)
* PostgreSQL: `localhost:8100` (DB `portmatch`, User `portmatch`)

### 5.7. Frontend 환경변수 참고
* `VITE_API_BASE_URL=/api` (Nginx 프록시 사용)
* `VITE_SERVICE_NAME=PortMatch`


---


## 6. 시연 시나리오

1. 메인 화면 진입 및 서비스 소개
![1](image/1.png)
2. 대시보드 진입
![2](image/2.png)
3. 포트폴리오 분석하기
![3](image/3.png)
4. 포트폴리오 분석 시작
![4](image/4.png)
5. 분석 결과 조회
![5](image/5.png)
6. 추천 기업 확인하기
![6](image/6.png)
7. 합격 전략 리포트 1
![7](image/7.png)
8. 합격 전략 리포트 2
![8](image/8.png)
9. 추천 공고 확인하기
![9](image/9.png)
10. 상세 분석 결과
![10](image/10.png)

### 개인
---
1. 공고 확인
![1](image/11.png)
2. 공고 지원(개인)
![2](image/12.png)
3. 공고 지원 완료(개인)
![3](image/13.png)
4. 면접 제안 확인(개인)
![4](image/14.png)
5. 면접 일정 확인(개인)
![5](image/15.png)
6. 면접 일정 확인(개인)
![6](image/16.png)
7. 면접 룸 로비
![7](image/17.png)
8. 면접 화면(개인)
![8](image/18.png)

### 기업
--- 

1. 공고 목록 확인(기업)
![1](image/19.png)
2. 공고 지원자 확인(기업)
![2](image/20.png)
3. 면접 일정(기업)
![3](image/21.png)
4. 면접 일정 보내기(기업)
![4](image/22.png)
5. 면접 제안(기업)
![5](image/23.png)
6. 요청 수락 확인(기업)
![6](image/24.png)
7. 면접 룸 로비
![7](image/25.png)
8. 면접 화면(기업)
![8](image/26.png)
9. 면접 종료(기업)
![9](image/27.png)

### 서비스
1. 메인 화면
![1](image/28.png)
2. 전체 공고 조회
![2](image/29.png)
3. 스피치 타이머
![3](image/30.png)
4. 실수령액 계산기
![4](image/31.png)
5. 협업 일정 관리
![5](image/32.png)
6. 글로벌 단위변환기
![6](image/33.png)
7. 면접 예상 질문
![7](image/34.png)
8. 면접 예상 질문 작성 템플릿
![8](image/35.png)
9. 포트폴리오 첨삭
![9](image/36.png)
