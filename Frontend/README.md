# 🚀 Port Match - Frontend

이력서 및 포트폴리오 텍스트 분석을 통해 지원자에게 맞춤형 공고 추천을, 기업에게는 인재 필터링 기능을 제공하는 양방향 채용 매칭 플랫폼 **Port Match**의 프론트엔드 저장소입니다.

## 📅 개발 기간
* 2026.01.05 ~ 2026.02.09

## 🛠 Tech Stack
* **Framework:** React 19.2 (Vite)
* **Language:** TypeScript
* **Styling:** Tailwind CSS 4.1
* **Data Fetching:** React Query, Axios
* **Animation:** AOS (Animate On Scroll)

---

## ⚙️ 시작하기 (Getting Started)

레포지토리를 클론한 후 아래 절차에 따라 로컬 환경을 설정해 주세요.

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정 (Critical)
보안을 위해 실제 API 주소가 담긴 `.env` 파일은 Git에 포함되지 않습니다. 루트 디렉토리에 있는 `.env.example` 파일을 복사하여 `.env` 파일을 생성해야 정상적인 통신이 가능합니다.

1. 프로젝트 루트에 `.env` 파일을 새로 생성합니다.
2. `.env.example`의 내용을 복사하여 `.env` 파일에 붙여넣습니다.
3. 현재 개발 단계에 맞는 백엔드 API 주소(`VITE_API_BASE_URL`)를 입력합니다.

### 3. 로컬 서버 실행
```bash
npm run dev
```

---

## 📁 폴더 구조 (Directory Structure)

일관성 있는 협업을 위해 아래와 같은 구조로 폴더 역할을 분담합니다.

| 폴더명 | 역할 설명 |
| :--- | :--- |
| **src/api** | Axios 인스턴스 설정 및 백엔드 서버와의 통신 함수를 관리합니다. |
| **src/components** | 공통 버튼, 모달 등 여러 페이지에서 재사용되는 UI 컴포넌트를 위치시킵니다. |
| **src/hooks** | 커스텀 훅 및 React Query 로직(useQuery, useMutation)을 관리합니다. |
| **src/pages** | 인트로, 로그인, 메인 등 라우팅의 단위가 되는 개별 페이지 컴포넌트입니다. |
| **src/routes** | react-router-dom을 사용한 전체 페이지 경로 설정을 관리합니다. |
| **src/types** | 데이터 모델링을 위한 TypeScript Interface 및 공통 타입을 정의합니다. |
| **src/utils** | 날짜 포맷팅, 정규식 검사 등 재사용 가능한 순수 자바스크립트 함수를 저장합니다. |
| **src/store** | 전역 상태 관리가 필요한 경우 관련 로직을 관리합니다. |

---

## 🎨 개발 컨벤션 (Convention)

### 1. 코드 스타일 (Prettier)
* 본 프로젝트는 코드 스타일 통일을 위해 `.prettierrc` 설정을 따릅니다.
* **VS Code 설정:** `Editor: Format On Save` 기능을 반드시 활성화해 주세요.
* Tailwind CSS 클래스는 플러그인을 통해 저장 시 자동으로 권장 순서에 따라 정렬됩니다.

### 2. 스타일링 가이드
* 모든 UI 구현은 **Tailwind CSS 4.1** 사용을 원칙으로 합니다.
* 기본 생성된 `App.css`는 사용하지 않으며, 전역 스타일은 `index.css`에서 통합 관리합니다.

### 3. Git 커밋 컨벤션 (Commit Message Strategy)
모든 커밋은 아래 형식을 준수하며, 최대한 자주 커밋하고 이슈 번호를 연결합니다.

**형식:** `타입: 변경 사항 요약 (이슈 번호)`

| 타입 | 설명 |
| :--- | :--- |
| **feat** | 새로운 기능 추가, 성능 개선 |
| **fix** | 버그 수정 |
| **refactor** | 코드 리팩토링 (기능 변경 없음) |
| **style** | 코드 스타일 변경 (공백, 세미콜론 등 스타일링 관련) |
| **docs** | 문서 수정 (README, 주석 등) |
| **test** | 테스트 코드 추가/수정 |
| **chore** | 빌드 설정, 패키지 매니저 수정 (코드 변경 없음) |
| **ci** | CI/CD 관련 변경 |
| **build** | 빌드 관련 수정 |
| **revert** | 이전 커밋 되돌리기 |

**커밋 예시:**
```bash
git commit -m "feat: 회원가입 기능 추가 (#43)"
git commit -m "fix: 로그인 버그 수정 (비밀번호 검증 오류)"
git commit -m "refactor: UserService 리팩토링 (메서드 분리)"
```

---

## 🌿 브랜치 전략
본 프로젝트는 정의된 Git Flow 전략을 따릅니다.
* **기능 개발:** `fe-feat/기능명` 브랜치를 생성하여 작업합니다.
* **병합 절차:** 작업 완료 후 `develop` 브랜치로 **Merge Request(MR)**를 생성하고 리더의 코드 리뷰 및 승인을 거쳐 병합합니다.