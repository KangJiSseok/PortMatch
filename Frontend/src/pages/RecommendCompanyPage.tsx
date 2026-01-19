import React, { useState } from 'react';

type RecommendedCompany = {
  id: number;
  name: string;
  reason: string;
  hiringCount: number;
  stacks: string[];
  matchScore: number; // 정렬을 위한 가상의 추천 점수
};

const mockCompanies: RecommendedCompany[] = [
  {
    id: 1,
    name: '네오랩스',
    reason: 'React/TypeScript 기반 프론트 경험이 있고, 협업 커뮤니케이션 키워드가 강하게 잡혀서 추천했어요.',
    hiringCount: 12,
    stacks: ['React', 'TypeScript', 'Tailwind'],
    matchScore: 98,
  },
  {
    id: 2,
    name: '포트웨이브',
    reason: '프로젝트에서 API 연동과 상태 관리 경험이 강조되어 있고, 사용자 중심 UI 개선 경험이 보여요.',
    hiringCount: 7,
    stacks: ['Next.js', 'Redux', 'Framer Motion'],
    matchScore: 85,
  },
  {
    id: 3,
    name: '클라우드코어',
    reason: '데이터 파이프라인/크롤링 관련 관심사가 있고, 문제 해결 방식(트러블슈팅)이 잘 드러나서 매칭됐어요.',
    hiringCount: 19,
    stacks: ['Python', 'Node.js', 'AWS'],
    matchScore: 92,
  },
];

function CompanyCard({ company }: { company: RecommendedCompany }) {
  return (
    <li className="group flex flex-col gap-5 rounded-[28px] border border-[#f0eee9] bg-white p-7 transition-all duration-300 hover:border-[#d6d2c4] hover:shadow-[0_10px_40px_rgba(0,0,0,0.03)] md:flex-row md:items-center">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="text-xl font-bold text-[#1a1a1a] tracking-tight">{company.name}</h3>
          <div className="flex gap-1.5 ml-1">
            {company.stacks.map((stack) => (
              <span key={stack} className="rounded-full bg-[#f0eee9] px-2.5 py-0.5 text-[10px] font-bold text-[#4a4a4a]">
                {stack}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[14.5px] leading-relaxed text-[#4a4a4a] md:max-w-[95%]">
          {company.reason}
        </p>
      </div>

      {/* 우측 공고 개수 */}
      <div className="flex flex-col items-start md:items-end justify-center min-w-[110px] self-end md:self-center border-t md:border-t-0 md:border-l border-[#f0eee9] pt-4 md:pt-0 md:pl-8">
        <span className="text-[10px] font-bold text-[#a3a3a3] uppercase tracking-[0.1em] mb-1">Openings</span>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-black text-[#1a1a1a] tabular-nums">{company.hiringCount}</span>
          <span className="text-sm font-bold text-[#1a1a1a]">건</span>
        </div>
      </div>
    </li>
  );
}

function RecommendCompanyPage() {
  const [sortBy, setSortBy] = useState<'score' | 'hiring'>('score');

  const sortedCompanies = [...mockCompanies].sort((a, b) => {
    return sortBy === 'score' ? b.matchScore - a.matchScore : b.hiringCount - a.hiringCount;
  });

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans antialiased text-[#1a1a1a]">
      <div className="mx-auto max-w-4xl px-6 py-20">
        
        {/* 헤더 섹션: 요청하신 문구 적용 */}
        <header className="mb-16">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-1 w-6 bg-[#d6d2c4] rounded-full"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a3a3a3]">Port Match AI Analysis</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[#1a1a1a] md:text-5xl">
            추천 기업 리스트
          </h1>
          <div className="mt-6 space-y-1">
            <p className="text-lg font-bold text-[#4a4a4a]">데이터로 분석한 최적의 커리어 매칭입니다.</p>
            <p className="text-lg font-medium text-[#a3a3a3]">
              귀하의 역량이 가장 빛날 수 있는 <span className="text-[#1a1a1a] border-b-2 border-[#d6d2c4]">3개의 팀</span>을 찾았습니다.
            </p>
          </div>
        </header>

        {/* 필터 및 리스트 섹션 */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0eee9] pb-5 px-1">
            <h2 className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest">Matched Companies</h2>
            
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
          
          <ul className="grid gap-5">
            {sortedCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </ul>
        </section>

        {/* 푸터 */}
        <footer className="mt-24 border-t border-[#f0eee9] pt-12 flex justify-between items-center text-[12px] font-bold text-[#a3a3a3]">
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