import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingState from '@/components/States/LoadingState';
import EmptyState from '@/components/States/EmptyState';
import ErrorState from '@/components/States/ErrorState';
import { useRecommendedCompanies } from '@/hooks/useRecommendedCompanies';
import type { RecommendedCompany, SortBy } from '@/types/recommend';

function CompanyCard({ company }: { company: RecommendedCompany }) {
  const navigate = useNavigate();

  const handleSearchByCompany = () => {
    // 기업명으로 검색 결과 페이지 이동
    navigate(`/job-postings?keyword=${encodeURIComponent(company.name)}&type=company`);
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

      {/* 우측 공고 개수
      <div className="flex min-w-[110px] flex-col items-start justify-center self-end border-t border-[#f0eee9] pt-4 md:items-end md:self-center md:border-t-0 md:border-l md:pt-0 md:pl-8">
        <span className="mb-1 text-[10px] font-bold tracking-[0.1em] text-[#a3a3a3] uppercase">
          Openings
        </span>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-black text-[#1a1a1a] tabular-nums">
            {company.hiringCount}
          </span>
          <span className="text-sm font-bold text-[#1a1a1a]">건</span>
        </div>
      </div> */}
      {/* 우측 공고 개수 (버튼으로 변경) */}
      <button 
        onClick={handleSearchByCompany}
        className="flex min-w-[110px] flex-col items-start justify-center self-end border-t border-[#f0eee9] pt-4 transition-all hover:opacity-70 md:items-end md:self-center md:border-t-0 md:border-l md:pt-0 md:pl-8"
      >
        <span className="mb-1 text-[10px] font-black tracking-[0.1em] text-[#a3a3a3] uppercase group-hover:text-point-blue">
          Openings
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
  const { data: companies, isLoading, isError, refetch } = useRecommendedCompanies();

  const sortedCompanies = companies
    ? [...companies].sort((a, b) => {
        return sortBy === 'score' ? b.matchScore - a.matchScore : b.hiringCount - a.hiringCount;
      })
    : [];

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#1a1a1a] antialiased">
      <div className="mx-auto max-w-4xl px-6 py-20">
        {/* 헤더 섹션: 요청하신 문구 적용 */}
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
              <span className="border-b-2 border-[#d6d2c4] text-[#1a1a1a]">3개의 팀</span>을
              찾았습니다.
            </p>
          </div>
        </header>

        {/* 필터 및 리스트 섹션 */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0eee9] px-1 pb-5">
            <h2 className="text-xs font-black tracking-widest text-[#1a1a1a] uppercase">
              Matched Companies
            </h2>

            {/* 구글 스타일 탭 필터 */}
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

          {/* 로딩 상태 */}
          {isLoading && <LoadingState />}

          {/* 에러 상태 */}
          {isError && (
            <ErrorState
              description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
              onAction={refetch}
            />
          )}

          {/* 빈 상태 */}
          {!isLoading && !isError && sortedCompanies.length === 0 && (
            <EmptyState 
                title="추천할 기업이 없습니다"
                description="포트폴리오를 업데이트하면 AI가 더 정확한 기업을 추천해 드립니다."
                actionLabel="분석 다시 시작하기" 
                onAction={refetch} 
              />
          )}

          {/* 정상 상태: 추천 기업 리스트 */}
          {!isLoading && !isError && sortedCompanies.length > 0 && (
            <ul className="grid gap-5">
              {sortedCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </ul>
          )}
        </section>

        {/* 푸터 */}
        <footer className="mt-24 flex items-center justify-between border-t border-[#f0eee9] pt-12 text-[12px] font-bold text-[#a3a3a3]">
          <p>© 2026 PORT MATCH. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-[#1a1a1a]">Privacy</span>
            <span className="cursor-pointer hover:text-[#1a1a1a]">Terms</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default RecommendCompanyPage;
