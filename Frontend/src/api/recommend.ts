import type { RecommendedCompany } from '@/types/recommend';

/**
 * Mock 데이터 (개발용)
 * - 실제 API 연동 전까지 사용
 * - 백엔드 API 준비되면 제거
 */
export const mockCompanies: RecommendedCompany[] = [
  {
    id: 101,
    companyId: 101,
    name: '삼성전자 (DX부문)',
    reason:
      '글로벌 서비스의 복잡한 UI/UX를 다루기 위해 React와 TypeScript 숙련도가 필수적인데, 유저님의 컴포넌트 설계 역량이 삼성닷컴 및 내부 시스템 고도화에 적합하다고 판단되어 추천합니다.',
    hiringCount: 2,
    stacks: ['React', 'TypeScript', 'Tailwind'],
    matchScore: 98,
  },
  {
    id: 102,
    companyId: 102,
    name: 'SK하이닉스',
    reason:
      '반도체 공정 모니터링 시스템의 실시간 데이터 시각화가 중요한 과제입니다. 유저님이 보유한 Next.js 및 상태 관리(Redux) 경험이 대규모 대시보드 성능 최적화에 큰 기여를 할 수 있습니다.',
    hiringCount: 1,
    stacks: ['Next.js', 'Redux', 'Framer Motion'],
    matchScore: 92,
  },
  {
    id: 103,
    companyId: 103,
    name: 'LG전자 (ThinQ)',
    reason:
      'ThinQ 앱의 대규모 트래픽 처리와 클라우드 기반 IoT 데이터 파이프라인 구축을 위해 Node.js 및 AWS 역량이 필요합니다. 유저님의 트러블슈팅 경험이 플랫폼 안정성에 적합합니다.',
    hiringCount: 0,
    stacks: ['Python', 'Node.js', 'AWS'],
    matchScore: 89,
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
