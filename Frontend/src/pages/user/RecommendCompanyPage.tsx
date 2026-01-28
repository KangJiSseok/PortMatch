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
    id: 1,
    companyId: 1001,
    name: '삼성전자',
    hiringCount: 3,
    stacks: [],
    matchScore: 98,
    reason: '...',
  },
  {
    id: 2,
    companyId: 1002,
    name: '네이버',
    hiringCount: 2,
    stacks: [],
    matchScore: 92,
    reason: '...',
  },
  {
    id: 3,
    companyId: 1003,
    name: '카카오',
    hiringCount: 2,
    stacks: [],
    matchScore: 89,
    reason: '...',
  },
];

function CompanyCard({ company }: { company: RecommendedCompany }) {
  const navigate = useNavigate();
  const hasOpenings = company.hiringCount > 0;

  const handleSearchByCompany = () => {
    if (!hasOpenings) return;
    navigate(
      `/job-postings?cid=${company.companyId}&companyName=${encodeURIComponent(company.name)}`,
    );
  };

  return (
    <motion.li
      whileHover={{ y: -4 }}
      className="group border-silver-mist bg-pure-white flex min-w-full flex-col items-center justify-between gap-6 rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50 md:flex-row md:items-center"
    >
      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-midnight-ink text-2xl font-black tracking-tight">{company.name}</h3>

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
              ? 'text-midnight-ink hover:text-point-blue cursor-pointer hover:bg-slate-50'
              : 'text-slate-gray cursor-default opacity-60 hover:bg-transparent',
          ].join(' ')}
        >
          {/* ✅ 버튼 내부 기준을 항상 중앙으로 */}
          <div className="flex h-full flex-col items-center justify-center gap-1">
            {hasOpenings ? (
              <>
                <span className="text-[15px] font-black tracking-[0.2em] whitespace-nowrap uppercase opacity-60">
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
                <span className="text-sm font-black whitespace-nowrap">공고 없음</span>
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
  const companies = apiData || MOCK_COMPANIES; // mock 사용 할때는 apiData 제거 !!!

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
                <h2 className="text-midnight-ink text-2xl font-black uppercase">추천 기업 목록</h2>
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
