import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';

// Mock 데이터
const MOCK_JOBS = [
  {
    id: 1,
    title: 'Visual Display 사업부 웹 프론트엔드 개발자',
    companyId: 101,
    company: '삼성전자 (DX부문)',
    stacks: ['React', 'TypeScript', 'Next.js'],
    location: '서울 서초구/수원',
    deadline: 'D-5',
    type: '경력 3-7년',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Samsung_wordmark.svg/512px-Samsung_wordmark.svg.png',
  },
  {
    id: 2,
    title: 'Samsung Health 서비스 UI 개발 담당',
    companyId: 101,
    company: '삼성전자 (DX부문)',
    stacks: ['React', 'Tailwind', 'A11y'],
    location: '서울 강남구',
    deadline: '상시',
    type: '신입/경력',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Samsung_wordmark.svg/512px-Samsung_wordmark.svg.png',
  },
  {
    id: 3,
    title: '제조 데이터 분석 플랫폼 프론트엔드 개발',
    companyId: 102,
    company: 'SK하이닉스',
    stacks: ['Next.js', 'Redux', 'D3.js'],
    location: '경기 이천/판교',
    deadline: '오늘마감',
    type: '경력 5년↑',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/SK_Hynix_logo.svg/1024px-SK_Hynix_logo.svg.png',
  },
];

type Sort = 'latest' | 'accuracy';

function JobPostingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const companyId = searchParams.get('companyId') ?? '';
  const companyName = searchParams.get('companyName') ?? '';
  const sort = (searchParams.get('sort') as Sort) ?? 'latest';

  // Navbar의 input 값을 동기화
  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement;
    if (navbarInput && companyName) {
      navbarInput.value = companyName;
    }
  }, [companyName]);

  const changeSort = (nextSort: Sort) => {
    setSearchParams({ companyId, companyName, sort: nextSort });
  };

  // 필터링 로직: companyId 또는 companyName으로 필터링
  const jobs = useMemo(() => {
    if (companyId) {
      return MOCK_JOBS.filter((job) => job.companyId === Number(companyId));
    }
    if (companyName) {
      return MOCK_JOBS.filter((job) => job.company.includes(companyName));
    }
    return MOCK_JOBS;
  }, [companyId, companyName]);

  // 현재 보여지는 기업명 추출
  const currentCompanyName = useMemo(() => {
    return jobs.length > 0 ? jobs[0].company : companyName;
  }, [jobs, companyName]);

  const isLoading = false;
  const isError = false;

  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="mx-auto max-w-5xl px-6">
        <header className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-point-blue/30" />
            <span className="text-zinc-400 text-[11px] font-black tracking-[0.2em] uppercase">
              Job Postings
            </span>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-midnight-ink text-3xl font-black tracking-tighter md:text-4xl">
                {currentCompanyName ? `${currentCompanyName} 채용 공고` : '채용 공고 검색'}
              </h1>
              <p className="text-zinc-600 mt-2 text-lg font-medium">
                조건에 맞는 <span className="text-midnight-ink font-bold">{jobs.length}개</span>의
                공고를 찾았습니다.
              </p>
            </div>

            <div className="bg-zinc-100/50 flex gap-1 rounded-xl p-1 border border-zinc-100">
              <button
                onClick={() => changeSort('latest')}
                className={`rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all ${sort === 'latest' ? 'bg-white text-midnight-ink shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                최신순
              </button>
              <button
                onClick={() => changeSort('accuracy')}
                className={`rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all ${sort === 'accuracy' ? 'bg-white text-midnight-ink shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                정확도순
              </button>
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="py-20">
            <LoadingState />
          </div>
        )}

        {isError && (
          <div className="py-20 border-2 border-dashed border-zinc-100 rounded-4xl bg-white">
            <ErrorState description="데이터를 불러오지 못했습니다." />
          </div>
        )}

        {!isLoading && !isError && (
          <section className="grid gap-5">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="border-zinc-100 bg-white hover:border-zinc-200 flex flex-col gap-6 rounded-[28px] border p-7 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(26,26,26,0.04)] md:flex-row md:items-center"
                >
                  <div className="border-zinc-100 bg-white flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border p-2">
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<span class="text-xl font-bold text-zinc-600">${job.company[0]}</span>`;
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="text-zinc-400 text-xs font-bold">{job.company}</span>
                      <span className="bg-zinc-100 text-zinc-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
                        {job.type}
                      </span>
                    </div>
                    <h3 className="text-midnight-ink hover:text-point-blue text-xl font-bold tracking-tight transition-colors">
                      {job.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.stacks.map((stack) => (
                        <span key={stack} className="text-zinc-400 text-[11px] font-medium">
                          #{stack}
                        </span>
                      ))}
                    </div>
                    <p className="text-zinc-600 mt-3 text-sm font-medium">{job.location}</p>
                  </div>
                  <div className="border-zinc-100 flex shrink-0 flex-col items-start gap-3 border-t pt-5 md:items-end md:border-t-0 md:border-l md:pt-0 md:pl-10">
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-zinc-400 text-[10px] font-black tracking-wider uppercase">
                        Deadline
                      </span>
                      <span
                        className={`text-lg font-black ${job.deadline === '오늘마감' ? 'text-red-500' : 'text-midnight-ink'}`}
                      >
                        {job.deadline}
                      </span>
                    </div>
                    <button className="bg-midnight-ink text-white hover:bg-point-blue w-full rounded-xl px-6 py-2.5 text-xs font-black transition-colors md:w-auto">
                      공고 보기
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 border-2 border-dashed border-zinc-100 rounded-4xl bg-white">
                <EmptyState
                  title="현재 진행 중인 공고가 없습니다"
                  description={
                    companyId === '103'
                      ? 'LG전자(ThinQ)는 현재 채용 준비 중입니다. 관심 기업으로 등록하면 공고가 떴을 때 알려드릴게요!'
                      : '검색 조건에 맞는 공고가 없습니다.'
                  }
                  actionLabel="다른 추천 기업 보기"
                  onAction={() => window.history.back()}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default JobPostingsPage;