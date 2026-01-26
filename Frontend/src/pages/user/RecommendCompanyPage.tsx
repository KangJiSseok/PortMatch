import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/Button/Button';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import { useRecommendedCompanies } from '@/hooks/useRecommendedCompanies';
import type { RecommendedCompany, SortBy } from '@/types/recommendCompany';

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
  const hasOpenings = company.hiringCount > 0;

  const handleSearchByCompany = () => {
    if (!hasOpenings) return;
    navigate(
      `/job-postings?companyId=${company.companyId}&companyName=${encodeURIComponent(company.name)}`,
    );
  };

  return (
    <motion.li
      whileHover={{ y: -4 }}
      className="group border-silver-mist bg-pure-white flex min-w-full flex-col items-center justify-between gap-6 rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50 md:flex-row md:items-center"
    >
      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-midnight-ink text-2xl font-black tracking-tight">
            {company.name}
          </h3>

          <div className="flex gap-1.5">
            {company.stacks.map((stack) => (
              <span
                key={stack}
                className="border-silver-mist bg-cloud-dancer text-slate-gray rounded-full border px-3 py-1 text-[11px] font-black tracking-tight"
              >
                {stack}
              </span>
            ))}
          </div>
        </div>

        <p className="text-slate-gray text-base leading-relaxed opacity-80 md:max-w-[90%]">
          {company.reason}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-10">
        <Button
          variant="outline"
          onClick={handleSearchByCompany}
          aria-disabled={!hasOpenings}
          className={[
            'group/btn no-title-hover h-28 w-28 rounded-2xl border-2 transition-all',
            hasOpenings
              ? 'text-midnight-ink hover:text-point-blue hover:bg-slate-50 cursor-pointer'
              : 'text-slate-gray cursor-default opacity-60 hover:bg-transparent',
          ].join(' ')}
        >
          {/* ✅ 버튼 내부 기준을 항상 중앙으로 */}
          <div className="flex h-full flex-col items-center justify-center gap-1">
            {hasOpenings ? (
              <>
                <span className="whitespace-nowrap text-[15px] font-black tracking-[0.2em] uppercase opacity-60">
                  모집 중
                </span>

                <span className="text-2xl font-black tabular-nums">
                  {company.hiringCount.toString().padStart(2, '0')}
                </span>

                <span className="text-[11px] font-black tracking-widest uppercase opacity-50">
                  OPENINGS
                </span>
              </>
            ) : (
              <>
                <span className="whitespace-nowrap text-sm font-black">
                  공고 없음
                </span>
                <span className="text-lg font-black opacity-50">-</span>
              </>
            )}
          </div>
        </Button>

        <div className="bg-cloud-dancer hidden h-12 w-px md:block" />
      </div>
    </motion.li>
  );
}

function RecommendCompanyPage() {
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const { data: apiData, isLoading, isError, refetch } = useRecommendedCompanies();
  const companies = apiData || MOCK_COMPANIES;

  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement | null;
    if (navbarInput) navbarInput.value = '';
  }, []);

  const sortedCompanies = [...companies].sort((a, b) =>
    sortBy === 'score' ? b.matchScore - a.matchScore : b.hiringCount - a.hiringCount,
  );

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Recommended Companies
          </motion.h1>

          <p className="text-slate-gray mt-2 text-lg font-bold italic opacity-50">
            데이터로 분석한 최적의 커리어 매칭입니다.
          </p>
        </header>

        <section className="space-y-8">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <div>
                <h2 className="text-midnight-ink text-2xl font-black uppercase">
                  추천 기업 목록
                </h2>
                <p className="text-slate-gray mt-1 text-sm font-bold italic opacity-40">
                  추천 점수와 공고 수 기준으로 정렬할 수 있어요.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant={sortBy === 'score' ? 'dark' : 'outline'}
                size="lg"
                onClick={() => setSortBy('score')}
                className="rounded-2xl px-8 font-bold shadow-xl"
              >
                추천 점수 순
              </Button>

              <Button
                variant={sortBy === 'hiring' ? 'dark' : 'outline'}
                size="lg"
                onClick={() => setSortBy('hiring')}
                className="rounded-2xl px-8 font-bold shadow-xl"
              >
                공고 많은 순
              </Button>
            </div>
          </div>

          {isLoading && <LoadingState />}
          {isError && <ErrorState description="데이터를 불러오지 못했습니다." onAction={refetch} />}

          {!isLoading && !isError && (
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6">
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
