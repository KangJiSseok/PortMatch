import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';
import { useRecommendedCompanies } from '@/hooks/useRecommendedCompanies';
import type { RecommendedCompany, SortBy } from '@/types/recommend';

const MOCK_COMPANIES: RecommendedCompany[] = [
  {
    id: 101,
    companyId: 101,
    name: '삼성전자 (DX부문)',
    reason:
      '글로벌 서비스의 복잡한 UI를 체계적으로 관리하기 위해 React/TypeScript 숙련도가 필수적인데, 유저님의 컴포넌트 설계 능력이 삼성닷컴 및 내부 시스템 고도화 프로젝트에 최적화되어 있습니다.',
    hiringCount: 2,
    stacks: ['React', 'TypeScript', 'Tailwind'],
    matchScore: 98,
  },
  {
    id: 102,
    companyId: 102,
    name: 'SK하이닉스',
    reason:
      '반도체 공정 모니터링 시스템의 실시간 데이터 시각화가 중요한 과제입니다. 유저님이 프로젝트에서 보여준 대규모 상태 관리(Redux)와 대시보드 UI 최적화 경험이 현업에 즉시 투입 가능한 수준입니다.',
    hiringCount: 1,
    stacks: ['Next.js', 'Redux', 'Framer Motion'],
    matchScore: 92,
  },
  {
    id: 103,
    companyId: 103,
    name: 'LG전자 (ThinQ)',
    reason:
      'LG ThinQ 앱의 대규모 트래픽 처리와 IoT 기기 연동 데이터 파이프라인 구축을 위해 Node.js 및 AWS 역량이 강조됩니다. 유저님의 백엔드 트러블슈팅 경험이 서비스 안정성에 큰 기여를 할 것으로 보입니다.',
    hiringCount: 0,
    stacks: ['Python', 'Node.js', 'AWS'],
    matchScore: 89,
  },
];

function CompanyCard({ company }: { company: RecommendedCompany }) {
  const navigate = useNavigate();

  const handleSearchByCompany = () => {
    navigate(
      `/job-postings?companyId=${company.companyId}&companyName=${encodeURIComponent(company.name)}`,
    );
  };

  return (
    <motion.li
      whileHover={{ y: -4 }}
      className="group flex flex-col gap-6 rounded-4xl border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md md:flex-row md:items-center"
    >
      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-midnight-ink text-2xl font-black tracking-tight">{company.name}</h3>
          <div className="flex gap-1.5">
            {company.stacks.map((stack) => (
              <span
                key={stack}
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-500"
              >
                {stack}
              </span>
            ))}
          </div>
        </div>
        <p className="text-base leading-relaxed text-zinc-600 md:max-w-[90%]">{company.reason}</p>
      </div>

      <button
        onClick={handleSearchByCompany}
        className="flex min-w-[140px] cursor-pointer flex-col items-center justify-center self-end border-t border-zinc-50 pt-6 transition-all md:self-center md:border-t-0 md:border-l md:pt-0 md:pl-10"
      >
        <span className="group-hover:text-point-blue mb-1 text-[11px] font-black tracking-[0.2em] text-zinc-400 uppercase">
          Open Positions
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-midnight-ink group-hover:text-point-blue text-3xl font-black tabular-nums transition-colors">
            {company.hiringCount}
          </span>
          <span className="text-midnight-ink text-sm font-bold">건</span>
          <svg
            className="text-point-blue ml-2 h-5 w-5 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </motion.li>
  );
}

function RecommendCompanyPage() {
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const { data: apiData, isLoading, isError, refetch } = useRecommendedCompanies();
  const companies = apiData || MOCK_COMPANIES;

  // Navbar의 검색어 초기화
  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement;
    if (navbarInput) {
      navbarInput.value = '';
    }
  }, []);

  const sortedCompanies = [...companies].sort((a, b) => {
    return sortBy === 'score' ? b.matchScore - a.matchScore : b.hiringCount - a.hiringCount;
  });

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-point-blue/30 h-1 w-8 rounded-full"></div>
            <span className="text-xs font-black tracking-[0.3em] text-zinc-400 uppercase">
              Port Match AI Analysis
            </span>
          </div>
          <h1 className="text-midnight-ink mb-8 text-4xl font-black tracking-tighter md:text-5xl lg:text-6xl">
            추천 기업 리스트
          </h1>
          <div className="space-y-2">
            <p className="text-xl font-bold text-zinc-600">
              데이터로 분석한 최적의 커리어 매칭입니다.
            </p>
            <p className="text-xl font-medium text-zinc-400">
              귀하의 역량이 가장 빛날 수 있는{' '}
              <span className="text-midnight-ink relative inline-block">
                3개의 팀
                <span className="bg-point-blue/10 absolute bottom-1 left-0 -z-10 h-2 w-full" />
              </span>
              을 찾았습니다.
            </p>
          </div>
        </header>

        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
            <h2 className="text-midnight-ink text-sm font-black tracking-widest uppercase">
              Matched Companies
            </h2>
            <div className="flex gap-1 rounded-2xl border border-zinc-100 bg-zinc-100/50 p-1.5">
              <button
                onClick={() => setSortBy('score')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  sortBy === 'score'
                    ? 'text-midnight-ink bg-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                추천 점수 순
              </button>
              <button
                onClick={() => setSortBy('hiring')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  sortBy === 'hiring'
                    ? 'text-midnight-ink bg-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                공고 많은 순
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="py-20">
              <LoadingState />
            </div>
          )}
          {isError && (
            <div className="rounded-4xl border-2 border-dashed border-zinc-100 bg-white py-20">
              <ErrorState description="데이터를 불러오지 못했습니다." onAction={refetch} />
            </div>
          )}

          {!isLoading && !isError && sortedCompanies.length === 0 && (
            <div className="rounded-4xl border-2 border-dashed border-zinc-100 bg-white py-20">
              <EmptyState
                title="추천 기업이 없습니다"
                description="아직 매칭되는 기업을 찾지 못했습니다. 포트폴리오를 업데이트하면 더 많은 추천을 받을 수 있습니다."
              />
            </div>
          )}

          {!isLoading && !isError && sortedCompanies.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6"
            >
              {sortedCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </motion.ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default RecommendCompanyPage;
