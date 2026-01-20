import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '@/components/States/LoadingState';
import EmptyState from '@/components/States/EmptyState';
import ErrorState from '@/components/States/ErrorState';
import { useRecommendedCompanies } from '@/hooks/useRecommendedCompanies';
import type { RecommendedCompany, SortBy } from '@/types/recommend';

// 기업 정보를 별도 상수로 분리 (실제로는 API에서 오겠지만, 테스트를 위해 정리)
const MOCK_COMPANIES: RecommendedCompany[] = [
  {
    id: 101,
    companyId: 101,
    name: '삼성전자 (DX부문)',
    reason: '글로벌 서비스의 복잡한 UI를 체계적으로 관리하기 위해 React/TypeScript 숙련도가 필수적인데, 유저님의 컴포넌트 설계 능력이 삼성닷컴 및 내부 시스템 고도화 프로젝트에 최적화되어 있습니다.',
    hiringCount: 2,
    stacks: ['React', 'TypeScript', 'Tailwind'],
    matchScore: 98,
  },
  {
    id: 102,
    companyId: 102,
    name: 'SK하이닉스',
    reason: '반도체 공정 모니터링 시스템의 실시간 데이터 시각화가 중요한 과제입니다. 유저님이 프로젝트에서 보여준 대규모 상태 관리(Redux)와 대시보드 UI 최적화 경험이 현업에 즉시 투입 가능한 수준입니다.',
    hiringCount: 1,
    stacks: ['Next.js', 'Redux', 'Framer Motion'],
    matchScore: 92,
  },
  {
    id: 103,
    companyId: 103,
    name: 'LG전자 (ThinQ)',
    reason: 'LG ThinQ 앱의 대규모 트래픽 처리와 IoT 기기 연동 데이터 파이프라인 구축을 위해 Node.js 및 AWS 역량이 강조됩니다. 유저님의 백엔드 트러블슈팅 경험이 서비스 안정성에 큰 기여를 할 것으로 보입니다.',
    hiringCount: 0,
    stacks: ['Python', 'Node.js', 'AWS'],
    matchScore: 89,
  },
];

function CompanyCard({ company }: { company: RecommendedCompany }) {
  const navigate = useNavigate();

  const handleSearchByCompany = () => {
    // 💡 중요: 기업명(keyword)과 고유 ID인 companyId를 쿼리스트링으로 넘깁니다.
    navigate(`/job-postings?companyId=${company.companyId}&companyName=${encodeURIComponent(company.name)}`);
  };

  return (
    <li className="group flex flex-col gap-5 rounded-[28px] border border-[#f0eee9] bg-white p-7 transition-all duration-300 hover:border-[#d6d2c4] hover:shadow-[0_10px_40px_rgba(0,0,0,0.03)] md:flex-row md:items-center">
      <div className="flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold tracking-tight text-[#1a1a1a]">{company.name}</h3>
          <div className="ml-1 flex gap-1.5">
            {company.stacks.map((stack) => (
              <span
                key={stack}
                className="rounded-full bg-[#f0eee9] px-2.5 py-0.5 text-[10px] font-bold text-[#4a4a4a]"
              >
                {stack}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[14.5px] leading-relaxed text-[#4a4a4a] md:max-w-[95%]">
          {company.reason}
        </p>
      </div>

      {/* 우측 공고 개수 버튼: 클릭 시 해당 기업 공고로 이동 */}
<button 
  onClick={handleSearchByCompany}
  className="flex min-w-[110px] cursor-pointer flex-col items-center justify-center self-end border-t border-[#f0eee9] pt-4 transition-all hover:opacity-70 md:self-center md:border-t-0 md:border-l md:pt-0 md:pl-8"
>
  <span className="mb-1 text-[10px] font-black tracking-[0.1em] text-[#a3a3a3] uppercase group-hover:text-point-blue">
    공고 수
  </span>
  <div className="flex items-baseline gap-0.5">
    <span className="text-2xl font-black text-[#1a1a1a] tabular-nums group-hover:text-point-blue">
      {company.hiringCount}
    </span>
    <span className="text-sm font-bold text-[#1a1a1a]">건</span>
    <svg className="ml-1 h-3 w-3 text-point-blue opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
</button>
    </li>
  );
}

function RecommendCompanyPage() {
  const [sortBy, setSortBy] = useState<SortBy>('score');
  
  // 원래는 useRecommendedCompanies()를 쓰지만, 지금은 데이터 정리를 위해 Mock을 바로 사용합니다.
  const { data: apiData, isLoading, isError, refetch } = useRecommendedCompanies();
  
  // API 데이터가 오기 전까지는 우리가 정리한 MOCK_COMPANIES를 사용하도록 설정
  const companies = apiData || MOCK_COMPANIES;

  const sortedCompanies = [...companies].sort((a, b) => {
    return sortBy === 'score' ? b.matchScore - a.matchScore : b.hiringCount - a.hiringCount;
  });

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#1a1a1a] antialiased">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <header className="mb-16">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-[#d6d2c4]"></div>
            <span className="text-[11px] font-black tracking-[0.2em] text-[#a3a3a3] uppercase">
              Port Match AI Analysis
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a] md:text-5xl">
            추천 기업 리스트
          </h1>
          <div className="mt-6 space-y-1">
            <p className="text-lg font-bold text-[#4a4a4a]">
              데이터로 분석한 최적의 커리어 매칭입니다.
            </p>
            <p className="text-lg font-medium text-[#a3a3a3]">
              귀하의 역량이 가장 빛날 수 있는{' '}
              <span className="border-b-2 border-[#d6d2c4] text-[#1a1a1a]">3개의 팀</span>을 찾았습니다.
            </p>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0eee9] px-1 pb-5">
            <h2 className="text-xs font-black tracking-widest text-[#1a1a1a] uppercase">
              Matched Companies
            </h2>
            <div className="flex gap-1 rounded-xl bg-[#f0eee9]/50 p-1">
              <button
                onClick={() => setSortBy('score')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${sortBy === 'score' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#a3a3a3] hover:text-[#4a4a4a]'}`}
              >
                추천 점수 순
              </button>
              <button
                onClick={() => setSortBy('hiring')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${sortBy === 'hiring' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#a3a3a3] hover:text-[#4a4a4a]'}`}
              >
                공고 많은 순
              </button>
            </div>
          </div>

          {isLoading && <LoadingState />}
          {isError && <ErrorState description="데이터를 불러오지 못했습니다." onAction={refetch} />}

          {!isLoading && !isError && sortedCompanies.length > 0 && (
            <ul className="grid gap-5">
              {sortedCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default RecommendCompanyPage;