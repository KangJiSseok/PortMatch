import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button/Button';
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
type DeadlineFilter = 'all' | 'urgent' | 'relaxed' | 'always';
type ExperienceFilter = 'all' | 'junior' | '1+' | '3+' | '5+';
// ⭐ 타입 변경: '1-3' | '3-5' | '5+' → '1+' | '3+' | '5+'

// 모든 기술 스택 추출
const ALL_STACKS = Array.from(new Set(MOCK_JOBS.flatMap((job) => job.stacks))).sort();

// 아이콘 컴포넌트들
const FilterIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function JobPostingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const companyId = searchParams.get('companyId') ?? '';
  const companyName = searchParams.get('companyName') ?? '';
  const sort = (searchParams.get('sort') as Sort) ?? 'latest';

  // 필터 상태
  const selectedStacks = searchParams.get('stacks')?.split(',').filter(Boolean) ?? [];
  const deadlineFilter = (searchParams.get('deadline') as DeadlineFilter) ?? 'all';
  const experienceFilter = (searchParams.get('experience') as ExperienceFilter) ?? 'all';

  // Navbar의 input 값을 동기화
  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement;
    if (navbarInput && companyName) {
      navbarInput.value = companyName;
    }
  }, [companyName]);

  const changeSort = (nextSort: Sort) => {
    const params: Record<string, string> = { sort: nextSort };
    if (companyId) params.companyId = companyId;
    if (companyName) params.companyName = companyName;
    if (selectedStacks.length > 0) params.stacks = selectedStacks.join(',');
    if (deadlineFilter !== 'all') params.deadline = deadlineFilter;
    if (experienceFilter !== 'all') params.experience = experienceFilter;
    setSearchParams(params);
  };

  const toggleStack = (stack: string) => {
    const newStacks = selectedStacks.includes(stack)
      ? selectedStacks.filter((s) => s !== stack)
      : [...selectedStacks, stack];

    const params: Record<string, string> = { sort };
    if (companyId) params.companyId = companyId;
    if (companyName) params.companyName = companyName;
    if (newStacks.length > 0) params.stacks = newStacks.join(',');
    if (deadlineFilter !== 'all') params.deadline = deadlineFilter;
    if (experienceFilter !== 'all') params.experience = experienceFilter;
    setSearchParams(params);
  };

  const changeDeadlineFilter = (filter: DeadlineFilter) => {
    const params: Record<string, string> = { sort };
    if (companyId) params.companyId = companyId;
    if (companyName) params.companyName = companyName;
    if (selectedStacks.length > 0) params.stacks = selectedStacks.join(',');
    if (filter !== 'all') params.deadline = filter;
    if (experienceFilter !== 'all') params.experience = experienceFilter;
    setSearchParams(params);
  };

  const changeExperienceFilter = (filter: ExperienceFilter) => {
    const params: Record<string, string> = { sort };
    if (companyId) params.companyId = companyId;
    if (companyName) params.companyName = companyName;
    if (selectedStacks.length > 0) params.stacks = selectedStacks.join(',');
    if (deadlineFilter !== 'all') params.deadline = deadlineFilter;
    if (filter !== 'all') params.experience = filter;
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    const params: Record<string, string> = { sort };
    if (companyId) params.companyId = companyId;
    if (companyName) params.companyName = companyName;
    setSearchParams(params);
  };

  // 필터링 로직
  const jobs = useMemo(() => {
    let filtered = MOCK_JOBS;

    // 기업 필터링
    if (companyId) {
      filtered = filtered.filter((job) => job.companyId === Number(companyId));
    } else if (companyName) {
      filtered = filtered.filter((job) => job.company.includes(companyName));
    }

    // 기술 스택 필터링
    if (selectedStacks.length > 0) {
      filtered = filtered.filter((job) =>
        selectedStacks.some((stack) => job.stacks.includes(stack))
      );
    }

    // 마감 임박도 필터링
    if (deadlineFilter !== 'all') {
      filtered = filtered.filter((job) => {
        if (deadlineFilter === 'urgent') {
          return job.deadline.startsWith('D-') && parseInt(job.deadline.slice(2)) <= 3;
        }
        if (deadlineFilter === 'relaxed') {
          return job.deadline.startsWith('D-') && parseInt(job.deadline.slice(2)) > 3;
        }
        if (deadlineFilter === 'always') {
          return job.deadline === '상시';
        }
        return true;
      });
    }

    // ⭐ 경력 필터링 로직 수정
    if (experienceFilter !== 'all') {
      filtered = filtered.filter((job) => {
        const type = job.type;
        
        if (experienceFilter === 'junior') {
          // 신입만
          return type.includes('신입');
        }
        
        if (experienceFilter === '1+') {
          // 1년 이상: "경력", "1년", "2년", "3년" 등 포함 (신입 제외)
          return type.includes('경력') && !type.includes('신입만');
        }
        
        if (experienceFilter === '3+') {
          // 3년 이상: 3, 4, 5, 6, 7, 8, 9년 포함
          return /[3-9]년/.test(type);
        }
        
        if (experienceFilter === '5+') {
          // 5년 이상: 5, 6, 7, 8, 9년 포함 또는 "5년↑"
          return /[5-9]년/.test(type) || type.includes('5년↑');
        }
        
        return true;
      });
    }

    return filtered;
  }, [companyId, companyName, selectedStacks, deadlineFilter, experienceFilter]);

  // 현재 보여지는 기업명 추출
  const currentCompanyName = useMemo(() => {
    return jobs.length > 0 ? jobs[0].company : companyName;
  }, [jobs, companyName]);

  // 활성화된 필터 개수
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStacks.length > 0) count++;
    if (deadlineFilter !== 'all') count++;
    if (experienceFilter !== 'all') count++;
    return count;
  }, [selectedStacks, deadlineFilter, experienceFilter]);

  const isLoading = false;
  const isError = false;

  // 필터 컴포넌트
  const FilterPanel = () => (
    <div className="bg-white border border-zinc-100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-midnight-ink text-lg font-black flex items-center gap-2">
          <FilterIcon />
          필터
        </h2>
        {activeFilterCount > 0 && (
          <span className="bg-point-blue text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-black">
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* 기술 스택 필터 */}
      <div className="mb-6 pb-6 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-midnight-ink text-sm font-bold">기술 스택</h3>
          {selectedStacks.length > 0 && (
            <span className="text-point-blue text-xs font-bold">{selectedStacks.length}개</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_STACKS.map((stack) => (
            <Button
              key={stack}
              variant="filter-chip"
              size="sm"
              isActive={selectedStacks.includes(stack)}
              onClick={() => toggleStack(stack)}
              className="!rounded-lg"
            >
              {stack}
            </Button>
          ))}
        </div>
      </div>

      {/* 마감 임박도 필터 */}
      <div className="mb-6 pb-6 border-b border-zinc-100">
        <h3 className="text-midnight-ink text-sm font-bold mb-3">마감 기한</h3>
        <div className="flex flex-col gap-2">
          {[
            { value: 'all' as const, label: '전체' },
            { value: 'urgent' as const, label: '급한 공고 (D-3)' },
            { value: 'relaxed' as const, label: '여유있는 공고' },
            { value: 'always' as const, label: '상시 채용' },
          ].map((option) => (
            <Button
              key={option.value}
              variant="light"
              size="sm"
              fullWidth
              onClick={() => changeDeadlineFilter(option.value)}
              className={`!justify-start !rounded-lg ${
                deadlineFilter === option.value
                  ? '!bg-midnight-ink !text-white !shadow-sm'
                  : '!bg-zinc-50 !text-zinc-600 hover:!bg-zinc-100'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ⭐ 경력 필터 - 라벨 수정 */}
      <div className="mb-6">
        <h3 className="text-midnight-ink text-sm font-bold mb-3">경력</h3>
        <div className="flex flex-col gap-2">
          {[
            { value: 'all' as const, label: '전체' },
            { value: 'junior' as const, label: '신입' },
            { value: '1+' as const, label: '1년 이상' },
            { value: '3+' as const, label: '3년 이상' },
            { value: '5+' as const, label: '5년 이상' },
          ].map((option) => (
            <Button
              key={option.value}
              variant="light"
              size="sm"
              fullWidth
              onClick={() => changeExperienceFilter(option.value)}
              className={`!justify-start !rounded-lg ${
                experienceFilter === option.value
                  ? '!bg-midnight-ink !text-white !shadow-sm'
                  : '!bg-zinc-50 !text-zinc-600 hover:!bg-zinc-100'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 필터 초기화 */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          fullWidth
          icon={<CloseIcon />}
          onClick={clearAllFilters}
          className="!text-zinc-500 hover:!text-midnight-ink !rounded-lg"
        >
          모든 필터 초기화
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="mx-auto w-[1200px] px-6">
        {/* 헤더 */}
        <header className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-point-blue/30" />
            <span className="text-zinc-400 text-[11px] font-black tracking-[0.2em] uppercase">
              Job Postings
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-midnight-ink text-3xl font-black tracking-tighter md:text-4xl">
                {currentCompanyName ? `${currentCompanyName} 채용 공고` : '채용 공고 검색'}
              </h1>
              <p className="text-zinc-600 mt-2 text-lg font-medium">
                조건에 맞는 <span className="text-midnight-ink font-bold">{jobs.length}개</span>의 공고를
                찾았습니다.
              </p>
            </div>

            <div className="flex gap-2 items-center">
              {/* 모바일 필터 버튼 */}
              <Button
                variant="filter"
                size="sm"
                icon={<FilterIcon />}
                badge={activeFilterCount > 0 ? activeFilterCount : undefined}
                isActive={activeFilterCount > 0}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden"
              >
                필터
              </Button>

              {/* 정렬 */}
              <div className="bg-zinc-100/50 flex gap-1 rounded-xl p-1 border border-zinc-100">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => changeSort('latest')}
                  className={`!px-4 !py-1.5 !text-[11px] !rounded-lg ${
                    sort === 'latest'
                      ? '!bg-white !text-midnight-ink !shadow-sm !border-transparent'
                      : '!bg-transparent !text-zinc-400 hover:!text-zinc-600 !border-transparent'
                  }`}
                >
                  최신순
                </Button>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => changeSort('accuracy')}
                  className={`!px-4 !py-1.5 !text-[11px] !rounded-lg ${
                    sort === 'accuracy'
                      ? '!bg-white !text-midnight-ink !shadow-sm !border-transparent'
                      : '!bg-transparent !text-zinc-400 hover:!text-zinc-600 !border-transparent'
                  }`}
                >
                  정확도순
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* 모바일 필터 패널 */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-8 lg:hidden"
            >
              <FilterPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 콘텐츠 */}
        <div className="flex gap-6 lg:gap-8">
          {/* 데스크톱 필터 사이드바 */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <div className="sticky top-32">
              <FilterPanel />
            </div>
          </aside>

          {/* 공고 리스트 */}
          <main className="flex-1 min-w-0">
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
                            className={`text-lg font-black ${
                              job.deadline === '오늘마감' ? 'text-red-500' : 'text-midnight-ink'
                            }`}
                          >
                            {job.deadline}
                          </span>
                        </div>
                        <Button
                          variant="dark"
                          size="sm"
                          className="!w-full md:!w-auto hover:!bg-point-blue !rounded-xl !px-6 !py-2.5"
                        >
                          공고 보기
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 border-2 border-dashed border-zinc-100 rounded-4xl bg-white">
                    <EmptyState
                      title="조건에 맞는 공고가 없습니다"
                      description="필터 조건을 변경하거나 초기화해보세요."
                      actionLabel={activeFilterCount > 0 ? '필터 초기화' : '다른 추천 기업 보기'}
                      onAction={() =>
                        activeFilterCount > 0 ? clearAllFilters() : window.history.back()
                      }
                    />
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default JobPostingsPage;