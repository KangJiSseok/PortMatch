import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button/Button';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';

type Sort = 'latest' | 'deadline';
type DeadlineFilter = 'all' | 'urgent' | 'week' | 'relaxed' | 'always';
type ExperienceFilter = 'all' | 'junior' | '1+' | '3+' | '5+';

type JobPosting = {
  id: number;
  title: string;
  companyId: number;
  company: string;
  stacks: string[];
  location: string; // ✅ 데이터는 유지 (추후 필요할 수 있어서)
  deadline: string;
  type: string;
  logo: string;
};

// -------------------- mock --------------------
const COMPANIES = [
  {
    companyId: 101,
    company: '삼성전자 (DX부문)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Samsung_wordmark.svg/512px-Samsung_wordmark.svg.png',
  },
  {
    companyId: 102,
    company: 'SK하이닉스',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/SK_Hynix_logo.svg/1024px-SK_Hynix_logo.svg.png',
  },
  {
    companyId: 103,
    company: 'LG전자 (ThinQ)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/LG_logo_%282015%29.svg/512px-LG_logo_%282015%29.svg.png',
  },
  {
    companyId: 104,
    company: '네이버',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Naver_Logotype.svg/512px-Naver_Logotype.svg.png',
  },
  {
    companyId: 105,
    company: '카카오',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Kakao_logo.svg/512px-Kakao_logo.svg.png',
  },
] as const;

const TITLE_POOL = [
  '커머스 프론트엔드 개발자 (React)',
  'B2B Admin 대시보드 UI 개발',
  '디자인 시스템 구축 및 컴포넌트 개발',
  '웹 접근성(A11y) 개선 담당',
  '검색/필터 UX 고도화 프론트 개발',
  '실시간 데이터 시각화 대시보드 개발',
  'Next.js 기반 SSR 서비스 고도화',
  'TypeScript 리팩토링 & 품질 개선',
  '성능 최적화(렌더링/번들) 담당',
  '모바일 웹 UI/UX 개선 담당',
] as const;

const STACK_POOL = [
  'React',
  'TypeScript',
  'Next.js',
  'Tailwind',
  'Redux',
  'Zustand',
  'React Query',
  'A11y',
  'D3.js',
  'Framer Motion',
  'Vite',
] as const;

const LOCATION_POOL = [
  '서울 강남구',
  '서울 서초구',
  '서울 성수/판교',
  '경기 판교',
  '경기 이천/판교',
  '부산 해운대구',
  '대구 수성구',
] as const;

const TYPE_POOL = [
  '신입',
  '신입/경력',
  '경력 1-3년',
  '경력 3-5년',
  '경력 3-7년',
  '경력 5년↑',
] as const;
const DEADLINE_POOL = [
  '오늘마감',
  '상시',
  'D-1',
  'D-2',
  'D-3',
  'D-5',
  'D-7',
  'D-10',
  'D-14',
] as const;

function buildMockJobs(total: number): JobPosting[] {
  const jobs: JobPosting[] = [];
  let id = 1;

  for (let i = 0; i < total; i += 1) {
    const company = COMPANIES[i % COMPANIES.length];
    const title = TITLE_POOL[i % TITLE_POOL.length];
    const location = LOCATION_POOL[(i * 3) % LOCATION_POOL.length];
    const type = TYPE_POOL[(i * 5) % TYPE_POOL.length];
    const deadline = DEADLINE_POOL[(i * 7) % DEADLINE_POOL.length];

    const stackCount = 2 + ((i * 11) % 3);
    const stacks = Array.from(
      { length: stackCount },
      (_, k) => STACK_POOL[(i + k * 2) % STACK_POOL.length],
    );

    jobs.push({
      id,
      title: `${company.company.split(' ')[0]} · ${title}`,
      companyId: company.companyId,
      company: company.company,
      stacks,
      location,
      deadline,
      type,
      logo: company.logo,
    });

    id += 1;
  }

  return jobs;
}

const MOCK_JOBS: JobPosting[] = buildMockJobs(80);
const ALL_STACKS = Array.from(new Set(MOCK_JOBS.flatMap((job) => job.stacks))).sort();

// -------------------- icons --------------------
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

const ChevronDown = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUp = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

// -------------------- utils --------------------
function clampPage(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.floor(n);
}

function parseDday(deadline: string) {
  if (deadline === '오늘마감') return 0;
  if (deadline.startsWith('D-')) {
    const n = Number(deadline.slice(2));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function getUrgent(deadline: string) {
  if (deadline === '오늘마감') return true;
  const n = parseDday(deadline);
  return n !== null && n <= 3;
}

function deadlineSortKey(deadline: string) {
  if (deadline === '오늘마감') return 0;
  if (deadline.startsWith('D-')) {
    const n = Number(deadline.slice(2));
    if (Number.isFinite(n)) return n;
  }
  if (deadline === '상시') return 9999;
  return 9998;
}

// ✅ divider 통일
function Divider() {
  return <div className="border-silver-mist/70 mt-5 w-full border-t" />;
}

// -------------------- CollapsibleSection --------------------
type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasDivider?: boolean;
};

function CollapsibleSection({
  title,
  subtitle,
  right,
  isOpen,
  onToggle,
  children,
  hasDivider = true,
}: CollapsibleSectionProps) {
  return (
    <section className="py-5">
      <button
        type="button"
        onClick={onToggle}
        className="mb-3 flex w-full items-end justify-between gap-4 rounded-xl p-2 text-left"
      >
        <div className="min-w-0">
          <h3 className="text-midnight-ink text-base font-black tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-slate-gray mt-1 text-xs font-bold italic opacity-60">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {right}
          <span className="text-slate-gray">{isOpen ? <ChevronUp /> : <ChevronDown />}</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-silver-mist/70 bg-pure-white rounded-xl border p-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasDivider && <Divider />}
    </section>
  );
}

// -------------------- FilterPanel --------------------
type FilterPanelProps = {
  activeFilterCount: number;
  selectedStacks: string[];
  deadlineFilter: DeadlineFilter;
  experienceFilter: ExperienceFilter;
  allStacks: string[];
  onToggleStack: (stack: string) => void;
  onChangeDeadline: (filter: DeadlineFilter) => void;
  onChangeExperience: (filter: ExperienceFilter) => void;
  onClearAll: () => void;
};

function FilterPanel({
  activeFilterCount,
  selectedStacks,
  deadlineFilter,
  experienceFilter,
  allStacks,
  onToggleStack,
  onChangeDeadline,
  onChangeExperience,
  onClearAll,
}: FilterPanelProps) {
  // ✅ “그냥 다 접어줘”
  const [openStacks, setOpenStacks] = useState(false);
  const [openDeadline, setOpenDeadline] = useState(false);
  const [openExperience, setOpenExperience] = useState(false);

  // ✅ (회색 동그라미) 오른쪽 배지 제거 요청 반영: deadline/experience 배지는 제거됨
  const selectedStacksBadge =
    selectedStacks.length > 0 ? (
      <span className="bg-point-blue/10 text-point-blue rounded-full px-3 py-1 text-xs font-black">
        {selectedStacks.length}
      </span>
    ) : null;

  return (
    <div className="border-silver-mist bg-pure-white rounded-4xl border p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-midnight-ink flex items-center gap-2 text-lg font-black tracking-tight">
          <FilterIcon />
          필터
        </h2>

        {activeFilterCount > 0 && (
          <span className="bg-point-blue text-pure-white flex h-6 w-6 items-center justify-center rounded-full text-xs font-black">
            {activeFilterCount}
          </span>
        )}
      </div>

      <CollapsibleSection
        title="기술 스택"
        subtitle="기술 키워드를 선택하세요."
        isOpen={openStacks}
        onToggle={() => setOpenStacks((v) => !v)}
        right={selectedStacksBadge}
      >
        <div className="flex flex-wrap gap-2">
          {allStacks.map((stack) => {
            const active = selectedStacks.includes(stack);
            return (
              <Button
                key={stack}
                variant={active ? 'dark' : 'outline'}
                size="sm"
                onClick={() => onToggleStack(stack)}
                className={['!rounded-xl', active ? '!shadow-sm hover:!opacity-100' : ''].join(' ')}
              >
                {stack}
              </Button>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="마감 기한"
        subtitle="공고 마감 타이밍으로 필터링해요."
        isOpen={openDeadline}
        onToggle={() => setOpenDeadline((v) => !v)}
      >
        <div className="flex flex-col gap-2">
          {[
            { value: 'all' as const, label: '전체' },
            { value: 'urgent' as const, label: '마감 임박 (3일 이내)' },
            { value: 'week' as const, label: '이번 주 마감 (4~7일)' },
            { value: 'relaxed' as const, label: '여유 있음 (8일 이상)' },
            { value: 'always' as const, label: '상시 채용' },
          ].map((option) => {
            const active = deadlineFilter === option.value;
            return (
              <Button
                key={option.value}
                variant={active ? 'dark' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => onChangeDeadline(option.value)}
                className={[
                  '!justify-start !rounded-xl',
                  active ? '!shadow-sm hover:!opacity-100' : '',
                ].join(' ')}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="경력"
        subtitle="경력 범위를 선택하세요."
        isOpen={openExperience}
        onToggle={() => setOpenExperience((v) => !v)}
        hasDivider={false}
      >
        <div className="flex flex-col gap-2">
          {[
            { value: 'all' as const, label: '전체' },
            { value: 'junior' as const, label: '신입' },
            { value: '1+' as const, label: '1년 이상' },
            { value: '3+' as const, label: '3년 이상' },
            { value: '5+' as const, label: '5년 이상' },
          ].map((option) => {
            const active = experienceFilter === option.value;
            return (
              <Button
                key={option.value}
                variant={active ? 'dark' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => onChangeExperience(option.value)}
                className={[
                  '!justify-start !rounded-xl',
                  active ? '!shadow-sm hover:!opacity-100' : '',
                ].join(' ')}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </CollapsibleSection>

      {activeFilterCount > 0 && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            icon={<CloseIcon />}
            onClick={onClearAll}
            className="!text-slate-gray hover:!text-midnight-ink !rounded-xl"
          >
            모든 필터 초기화
          </Button>
        </div>
      )}
    </div>
  );
}

// -------------------- Pagination --------------------
type PaginationProps = {
  page: number;
  totalPages: number;
  onChangePage: (next: number) => void;
};

function Pagination({ page, totalPages, onChangePage }: PaginationProps) {
  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const set = new Set<number>();
    set.add(1);
    set.add(totalPages);
    [page - 1, page, page + 1].forEach((p) => {
      if (p >= 1 && p <= totalPages) set.add(p);
    });

    return Array.from(set).sort((a, b) => a - b);
  }, [page, totalPages]);

  const withDots: Array<number | 'dots'> = [];
  for (let i = 0; i < pages.length; i += 1) {
    const cur = pages[i];
    const prev = pages[i - 1];
    if (prev && cur - prev >= 2) withDots.push('dots');
    withDots.push(cur);
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        className="!rounded-xl"
        aria-disabled={page <= 1}
        onClick={() => {
          if (page > 1) onChangePage(page - 1);
        }}
      >
        이전
      </Button>

      <nav className="flex items-center gap-3" aria-label="pagination">
        {withDots.map((p, idx) =>
          p === 'dots' ? (
            <span key={`dots-${idx}`} className="text-slate-gray px-1 text-sm font-bold opacity-50">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChangePage(p)}
              className={[
                'px-1 text-sm font-black transition-colors',
                p === page
                  ? 'text-midnight-ink underline underline-offset-4'
                  : 'text-slate-gray hover:text-midnight-ink',
              ].join(' ')}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
      </nav>

      <Button
        variant="outline"
        size="sm"
        className="!rounded-xl"
        aria-disabled={page >= totalPages}
        onClick={() => {
          if (page < totalPages) onChangePage(page + 1);
        }}
      >
        다음
      </Button>
    </div>
  );
}

// -------------------- Page --------------------
function JobPostingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const companyId = searchParams.get('companyId') ?? '';
  const rawKeyword = searchParams.get('keyword') ?? '';
  const keyword = useMemo(() => {
    try {
      return decodeURIComponent(rawKeyword);
    } catch {
      return rawKeyword;
    }
  }, [rawKeyword]);

  const sort = (searchParams.get('sort') as Sort) ?? 'latest';

  const selectedStacks = searchParams.get('stacks')?.split(',').filter(Boolean) ?? [];
  const deadlineFilter = (searchParams.get('deadline') as DeadlineFilter) ?? 'all';
  const experienceFilter = (searchParams.get('experience') as ExperienceFilter) ?? 'all';

  const page = clampPage(Number(searchParams.get('page') ?? '1'));
  const PAGE_SIZE = 10;

  const listTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement | null;
    if (!navbarInput) return;
    navbarInput.value = keyword ?? '';
  }, [keyword]);

  const setParams = (next: Record<string, string>) => setSearchParams(next);

  const buildParams = ({
    nextSort,
    nextStacks,
    nextDeadline,
    nextExperience,
    nextPage,
  }: {
    nextSort?: Sort;
    nextStacks?: string[];
    nextDeadline?: DeadlineFilter;
    nextExperience?: ExperienceFilter;
    nextPage?: number;
  }) => {
    const params: Record<string, string> = {};
    if (companyId) params.companyId = companyId;
    if (rawKeyword) params.keyword = rawKeyword;

    params.sort = nextSort ?? sort;

    const stacks = nextStacks ?? selectedStacks;
    if (stacks.length > 0) params.stacks = stacks.join(',');

    const d = nextDeadline ?? deadlineFilter;
    if (d !== 'all') params.deadline = d;

    const e = nextExperience ?? experienceFilter;
    if (e !== 'all') params.experience = e;

    params.page = String(nextPage ?? page);
    return params;
  };

  const changeSort = (nextSort: Sort) => setParams(buildParams({ nextSort, nextPage: 1 }));

  const toggleStack = (stack: string) => {
    const newStacks = selectedStacks.includes(stack)
      ? selectedStacks.filter((s) => s !== stack)
      : [...selectedStacks, stack];
    setParams(buildParams({ nextStacks: newStacks, nextPage: 1 }));
  };

  const changeDeadlineFilter = (filter: DeadlineFilter) =>
    setParams(buildParams({ nextDeadline: filter, nextPage: 1 }));
  const changeExperienceFilter = (filter: ExperienceFilter) =>
    setParams(buildParams({ nextExperience: filter, nextPage: 1 }));

  const clearAllFilters = () => {
    const params: Record<string, string> = {};
    if (companyId) params.companyId = companyId;
    if (rawKeyword) params.keyword = rawKeyword;
    params.sort = sort;
    params.page = '1';
    setParams(params);
  };

  const filteredSortedJobs = useMemo(() => {
    let filtered = MOCK_JOBS;

    if (companyId) filtered = filtered.filter((job) => job.companyId === Number(companyId));
    else if (keyword) {
      const k = keyword.toLowerCase();
      filtered = filtered.filter((job) => job.title.toLowerCase().includes(k));
    }

    if (selectedStacks.length > 0) {
      filtered = filtered.filter((job) => selectedStacks.some((s) => job.stacks.includes(s)));
    }

    if (deadlineFilter !== 'all') {
      filtered = filtered.filter((job) => {
        const d = job.deadline;
        const n = parseDday(d);

        if (deadlineFilter === 'always') return d === '상시';
        if (deadlineFilter === 'urgent')
          return d === '오늘마감' || (n !== null && n >= 1 && n <= 3);
        if (deadlineFilter === 'week') return n !== null && n >= 4 && n <= 7;
        if (deadlineFilter === 'relaxed') return n !== null && n >= 8;
        return true;
      });
    }

    if (experienceFilter !== 'all') {
      filtered = filtered.filter((job) => {
        const type = job.type;
        if (experienceFilter === 'junior') return type.includes('신입');
        if (experienceFilter === '1+')
          return type.includes('경력') || /[1-9]년/.test(type) || type.includes('5년↑');
        if (experienceFilter === '3+') return /[3-9]년/.test(type) || type.includes('5년↑');
        if (experienceFilter === '5+') return /[5-9]년/.test(type) || type.includes('5년↑');
        return true;
      });
    }

    const sortedList = [...filtered].sort((a, b) => {
      if (sort === 'latest') return b.id - a.id;
      return deadlineSortKey(a.deadline) - deadlineSortKey(b.deadline);
    });

    return sortedList;
  }, [companyId, keyword, selectedStacks, deadlineFilter, experienceFilter, sort]);

  const totalCount = filteredSortedJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const pagedJobs = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSortedJobs.slice(start, start + PAGE_SIZE);
  }, [filteredSortedJobs, page, totalPages]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStacks.length > 0) count++;
    if (deadlineFilter !== 'all') count++;
    if (experienceFilter !== 'all') count++;
    return count;
  }, [selectedStacks, deadlineFilter, experienceFilter]);

  useEffect(() => {
    if (page > totalPages) setParams(buildParams({ nextPage: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const scrollToListTop = () =>
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const setPage = (nextPage: number) => {
    setParams(buildParams({ nextPage }));
    requestAnimationFrame(() => scrollToListTop());
  };

  const isLoading = false;
  const isError = false;

  const headerTitle = useMemo(() => {
    if (!companyId && !keyword) return '전체 공고 조회';
    if (keyword) return `'${keyword}' 공고 조회`;
    return '해당 기업 공고 조회';
  }, [companyId, keyword]);

  return (
    <div className="bg-pure-white min-h-screen overflow-x-auto pt-32 pb-32">
      <div className="min-w-[1200px]">
        <div className="mx-auto w-[1200px] px-6">
          <div className="mb-12 flex items-end justify-between gap-6">
            <header className="border-point-blue border-l-4 pl-6">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
              >
                {headerTitle}
              </motion.h1>

              <p className="text-slate-gray mt-2 text-lg font-bold italic opacity-60">
                조건에 맞는{' '}
                <span className="relative inline-block">
                  <span className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-sm bg-yellow-200/80" />
                  <span className="text-midnight-ink px-1 font-black">{totalCount}개</span>
                </span>
                의 공고를 찾았습니다.
              </p>
            </header>

            <div className="flex items-center gap-3">
              <div className="flex gap-3">
                <Button
                  variant={sort === 'latest' ? 'dark' : 'outline'}
                  size="lg"
                  onClick={() => changeSort('latest')}
                  className="rounded-2xl px-8 font-bold shadow-xl"
                >
                  최신순
                </Button>

                <Button
                  variant={sort === 'deadline' ? 'dark' : 'outline'}
                  size="lg"
                  onClick={() => changeSort('deadline')}
                  className="rounded-2xl px-8 font-bold shadow-xl"
                >
                  마감일순
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            <aside className="w-72 shrink-0">
              <div className="sticky top-32">
                <FilterPanel
                  activeFilterCount={activeFilterCount}
                  selectedStacks={selectedStacks}
                  deadlineFilter={deadlineFilter}
                  experienceFilter={experienceFilter}
                  allStacks={ALL_STACKS}
                  onToggleStack={toggleStack}
                  onChangeDeadline={changeDeadlineFilter}
                  onChangeExperience={changeExperienceFilter}
                  onClearAll={clearAllFilters}
                />
              </div>
            </aside>

            <main className="min-w-0 flex-1">
              <div ref={listTopRef} />

              {isLoading && (
                <div className="py-20">
                  <LoadingState />
                </div>
              )}

              {isError && (
                <div className="bg-pure-white rounded-4xl border-2 border-dashed border-zinc-100 py-20">
                  <ErrorState description="데이터를 불러오지 못했습니다." />
                </div>
              )}

              {!isLoading && !isError && (
                <>
                  <section className="grid gap-5">
                    {pagedJobs.length > 0 ? (
                      pagedJobs.map((job) => {
                        const isUrgent = getUrgent(job.deadline);

                        return (
                          <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -4 }}
                            className={[
                              'border-silver-mist bg-pure-white flex items-center gap-6 rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50',
                              isUrgent ? 'ring-1 ring-red-200' : '',
                            ].join(' ')}
                          >
                            <div className="border-silver-mist bg-pure-white flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border p-2">
                              <img
                                src={job.logo}
                                alt={job.company}
                                className="h-full w-full object-contain"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  if (target.parentElement) {
                                    target.parentElement.innerHTML = `<span class="text-xl font-black text-slate-gray">${job.company[0]}</span>`;
                                  }
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-4 flex flex-wrap items-center gap-3">
                                <span className="text-slate-gray text-xs font-black opacity-70">
                                  {job.company}
                                </span>

                                <span className="border-silver-mist bg-cloud-dancer text-slate-gray rounded-xl border px-3 py-1 text-[11px] font-black tracking-tight">
                                  {job.type}
                                </span>

                                {isUrgent && (
                                  <span className="rounded-xl bg-red-50 px-3 py-1 text-[11px] font-black text-red-600">
                                    마감 임박
                                  </span>
                                )}
                              </div>

                              <h3 className="text-midnight-ink hover:text-point-blue truncate text-2xl font-black tracking-tight transition-colors">
                                {job.title}
                              </h3>

                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {job.stacks.map((stack) => (
                                  <span
                                    key={stack}
                                    className="text-slate-gray text-[11px] font-bold opacity-70"
                                  >
                                    #{stack}
                                  </span>
                                ))}
                              </div>

                              {/* ✅ 지역 표시 제거 */}
                              {/* <p className="text-slate-gray mt-4 text-sm font-bold opacity-80">{job.location}</p> */}
                            </div>

                            <div className="border-silver-mist flex w-[170px] shrink-0 flex-col items-center gap-4 border-l pl-6">
                              <div className="flex flex-col items-center text-center">
                                <span className="text-slate-gray text-[11px] font-black tracking-widest uppercase opacity-50">
                                  Deadline
                                </span>

                                <span
                                  className={[
                                    'text-2xl font-black tabular-nums',
                                    isUrgent ? 'text-red-600' : 'text-midnight-ink',
                                  ].join(' ')}
                                >
                                  {job.deadline}
                                </span>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:text-point-blue rounded-2xl px-6 font-bold shadow-md hover:bg-slate-50"
                              >
                                공고 보기
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="border-silver-mist bg-pure-white rounded-4xl border border-dashed p-10">
                        <EmptyState
                          title="조건에 맞는 공고가 없습니다"
                          description="필터 조건을 변경하거나 초기화해보세요."
                          actionLabel={
                            activeFilterCount > 0 ? '필터 초기화' : '다른 추천 기업 보기'
                          }
                          onAction={() =>
                            activeFilterCount > 0 ? clearAllFilters() : window.history.back()
                          }
                        />
                      </div>
                    )}
                  </section>

                  {totalCount > 0 && (
                    <Pagination
                      page={Math.min(page, totalPages)}
                      totalPages={totalPages}
                      onChangePage={setPage}
                    />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobPostingsPage;
