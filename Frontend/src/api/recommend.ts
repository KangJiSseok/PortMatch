import type { RecommendedCompany } from '@/types/recommend';

/**
 * Mock 데이터 (개발용)
 * - 실제 API 연동 전까지 사용
 * - 백엔드 API 준비되면 제거
 */
const mockCompanies: RecommendedCompany[] = [
  {
    id: 1,
    name: '네오랩스',
    reason:
      'React/TypeScript 기반 프론트 경험이 있고, 협업 커뮤니케이션 키워드가 강하게 잡혀서 추천했어요.',
    hiringCount: 12,
    stacks: ['React', 'TypeScript', 'Tailwind'],
    matchScore: 98,
  },
  {
    id: 2,
    name: '포트웨이브',
    reason:
      '프로젝트에서 API 연동과 상태 관리 경험이 강조되어 있고, 사용자 중심 UI 개선 경험이 보여요.',
    hiringCount: 7,
    stacks: ['Next.js', 'Redux', 'Framer Motion'],
    matchScore: 85,
  },
  {
    id: 3,
    name: '클라우드코어',
    reason:
      '데이터 파이프라인/크롤링 관련 관심사가 있고, 문제 해결 방식(트러블슈팅)이 잘 드러나서 매칭됐어요.',
    hiringCount: 19,
    stacks: ['Python', 'Node.js', 'AWS'],
    matchScore: 92,
  },
];

/**
 * 추천 기업 목록 조회 API
 *
 * @returns 추천 기업 배열
 *
 * @todo 백엔드 API 엔드포인트 URL 설정
 * @todo 인증 토큰 헤더 추가 (필요 시)
 * @todo 에러 핸들링 강화
 *
 * @example
 * ```ts
 * // 실제 API 연동 시 아래와 같이 수정
 * const response = await fetch('/api/v1/recommend/companies', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * const data: RecommendedCompaniesResponse = await response.json();
 * return data.data; // 또는 data (응답 구조에 따라)
 * ```
 */
export async function fetchRecommendedCompanies(): Promise<RecommendedCompany[]> {
  // TODO: 실제 API 호출로 교체
  // const response = await fetch(`${API_BASE_URL}/recommend/companies`);
  // if (!response.ok) throw new Error('Failed to fetch recommended companies');
  // const data: RecommendedCompaniesResponse = await response.json();
  // return data.data; // 또는 data (응답 구조에 따라)

  // Mock 응답 (개발용)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockCompanies);
    }, 800); // 네트워크 지연 시뮬레이션
  });
}

/**
 * 기업별 상세 추천 사유 조회 API (선택적)
 *
 * @param companyId - 기업 ID
 * @returns 상세 추천 정보
 *
 * @example
 * ```ts
 * const detail = await fetchCompanyRecommendDetail(1);
 * ```
 */
export async function fetchCompanyRecommendDetail(companyId: number): Promise<RecommendedCompany | null> {
  // TODO: 실제 API 호출로 교체
  // const response = await fetch(`${API_BASE_URL}/recommend/companies/${companyId}`);
  // if (!response.ok) return null;
  // return response.json();

  // Mock 응답 (개발용)
  return new Promise((resolve) => {
    setTimeout(() => {
      const company = mockCompanies.find((c) => c.id === companyId);
      resolve(company || null);
    }, 300);
  });
}
