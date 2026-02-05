// JobPostingsPage.tsx (수정본)
// ✅ 변경점: stackId -> stackName 표시 + 스택 필터 AND -> OR + 절대 URL 기반 스택 조회 훅 사용

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Button from '@/components/Button/Button';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';

import { useJobPostings } from '@/hooks/useJobPostings';
import { fetchJobPostingStacks } from '@/api/jobPostings';
import { useStackNames } from '@/hooks/useStackNames';
import type { JobPostingDto } from '@/types/backendJobPosting';

type Sort = 'latest' | 'deadline';
type DeadlineFilter = 'all' | 'urgent' | 'week' | 'relaxed' | 'always';
type ExperienceFilter = 'all' | 'junior' | '1+' | '3+' | '5+';

type JobPosting = {
  id: number;
  title: string;
  companyId: string; // cid
  company: string; // corpName
  stackIds: number[]; // ✅ 서버 기준
  location: string;
  deadline: string; // "D-3" / "오늘마감" / "마감"
  type: string; // jobType 라벨
  logo: string;
};

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
  if (deadline === '마감') return 10_000;
  return 9998;
}

function Divider() {
  return <div className="border-silver-mist/20 mt-5 w-full border-t" />;
}

function formatDeadlineLabel(endDate: string) {
  const end = new Date(`${endDate}T23:59:59`);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (!Number.isFinite(diffDays)) return '상시 채용';
  if (diffDays < 0) return '마감';
  if (diffDays === 0) return '오늘마감';
  return `D-${diffDays}`;
}

function jobTypeLabel(jobType: number) {
  if (jobType === 0) return '신입';
  if (jobType === 1) return '신입/경력';
  if (jobType === 2) return '경력';
  return '채용';
}

function mapDtoToUiJob(dto: JobPostingDto): JobPosting {
  return {
    id: dto.id,
    title: dto.title,
    companyId: dto.company?.cid ?? dto.cid,
    company: dto.company?.corpName ?? dto.cid,
    stackIds: dto.stackIds ?? [],
    location: dto.company?.corpAddr ?? '',
    deadline: formatDeadlineLabel(dto.endDate),
    type: jobTypeLabel(dto.jobType),
    logo: dto.company?.logo ?? '',
  };
}

// ✅ 정렬용: startDate 내림차순
function sortLatest(a: JobPosting, b: JobPosting) {
  return b.id - a.id;
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
            <div className="border-silver-mist/20 bg-pure-white rounded-xl border p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasDivider && <Divider />}
    </section>
  );
}

// -------------------- FilterPanel --------------------
type StackOption = { id: number; name: string };

type FilterPanelProps = {
  activeFilterCount: number;

  allStacks: StackOption[];
  selectedStackIds: number[];
  onToggleStack: (stackId: number) => void;

  deadlineFilter: DeadlineFilter;
  experienceFilter: ExperienceFilter;
  onChangeDeadline: (filter: DeadlineFilter) => void;
  onChangeExperience: (filter: ExperienceFilter) => void;
  onClearAll: () => void;
};

function FilterPanel({
  activeFilterCount,
  allStacks,
  selectedStackIds,
  onToggleStack,
  deadlineFilter,
  experienceFilter,
  onChangeDeadline,
  onChangeExperience,
  onClearAll,
}: FilterPanelProps) {
  const [openStacks, setOpenStacks] = useState(false);
  const [openDeadline, setOpenDeadline] = useState(false);
  const [openExperience, setOpenExperience] = useState(false);

  const selectedStacksBadge =
    selectedStackIds.length > 0 ? (
      <span className="bg-point-blue/10 text-point-blue rounded-full px-3 py-1 text-xs font-black">
        {selectedStackIds.length}
      </span>
    ) : null;

  return (
    <div className="border-silver-mist/20 bg-pure-white rounded-4xl border p-6 shadow-sm">
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
        subtitle="기술 스택을 선택하세요"
        isOpen={openStacks}
        onToggle={() => setOpenStacks((v) => !v)}
        right={selectedStacksBadge}
      >
        <div className="flex flex-wrap gap-2">
          {allStacks.map((stack) => {
            const active = selectedStackIds.includes(stack.id);
            return (
              <Button
                key={stack.id}
                variant={active ? 'dark' : 'outline'}
                size="sm"
                onClick={() => onToggleStack(stack.id)}
                className={['!rounded-xl', active ? '!shadow-sm hover:!opacity-100' : ''].join(' ')}
              >
                {stack.name}
              </Button>
            );
          })}
          {allStacks.length === 0 && (
            <p className="text-slate-gray text-xs font-bold opacity-70">스택 정보가 아직 없어요.</p>
          )}
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ companyId -> cid 로 변경
  const cid = searchParams.get('cid') ?? '';
  const companyName = searchParams.get('companyName') ?? '';

  const { data, isLoading, isError, refetch } = useJobPostings(cid || undefined);

  const SERVER_JOBS: JobPosting[] = useMemo(() => (data?.data ?? []).map(mapDtoToUiJob), [data]);

  // ✅ 화면에 등장하는 stackIds를 전부 모아서 스택 이름을 비동기로 캐싱
  const allStackIdsOnPage = useMemo(() => {
    const ids: number[] = [];
    SERVER_JOBS.forEach((j) => (j.stackIds ?? []).forEach((id) => ids.push(id)));
    return ids;
  }, [SERVER_JOBS]);

  const stackNameMap = useStackNames(allStackIdsOnPage);

  const [postingStackMap, setPostingStackMap] = useState<Record<number, string[]>>({});
  const postingStackInFlight = useRef<Set<number>>(new Set());

  const rawKeyword = searchParams.get('keyword') ?? '';
  const keyword = useMemo(() => {
    try {
      return decodeURIComponent(rawKeyword);
    } catch {
      return rawKeyword;
    }
  }, [rawKeyword]);

  const sort = (searchParams.get('sort') as Sort) ?? 'latest';

  const selectedStackIds =
    searchParams
      .get('stackIds')
      ?.split(',')
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n)) ?? [];

  const deadlineFilter = (searchParams.get('deadline') as DeadlineFilter) ?? 'all';
  const experienceFilter = (searchParams.get('experience') as ExperienceFilter) ?? 'all';

  const page = clampPage(Number(searchParams.get('page') ?? '1'));
  const PAGE_SIZE = 10;

  const listTopRef = useRef<HTMLDivElement | null>(null);

  // ✅ 서버 데이터 기반으로 스택 옵션 만들기 (id -> stackName 표시)
  const ALL_STACK_OPTIONS: StackOption[] = useMemo(() => {
    const set = new Set<number>();
    SERVER_JOBS.forEach((j) => (j.stackIds ?? []).forEach((id) => set.add(id)));
    return Array.from(set)
      .sort((a, b) => a - b)
      .map((id) => ({ id, name: stackNameMap[id] ?? `#${id}` }));
  }, [SERVER_JOBS, stackNameMap]);

  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement | null;
    if (!navbarInput) return;
    navbarInput.value = keyword ?? '';
  }, [keyword]);

  const setParams = (next: Record<string, string>) => setSearchParams(next);

  const buildParams = ({
    nextSort,
    nextStackIds,
    nextDeadline,
    nextExperience,
    nextPage,
  }: {
    nextSort?: Sort;
    nextStackIds?: number[];
    nextDeadline?: DeadlineFilter;
    nextExperience?: ExperienceFilter;
    nextPage?: number;
  }) => {
    const params: Record<string, string> = {};

    if (cid) params.cid = cid;
    if (rawKeyword) params.keyword = rawKeyword;

    params.sort = nextSort ?? sort;

    const stackIds = nextStackIds ?? selectedStackIds;
    if (stackIds.length > 0) params.stackIds = stackIds.join(',');

    const d = nextDeadline ?? deadlineFilter;
    if (d !== 'all') params.deadline = d;

    const e = nextExperience ?? experienceFilter;
    if (e !== 'all') params.experience = e;

    params.page = String(nextPage ?? page);
    return params;
  };

  const changeSort = (nextSort: Sort) => setParams(buildParams({ nextSort, nextPage: 1 }));

  const toggleStack = (stackId: number) => {
    const next = selectedStackIds.includes(stackId)
      ? selectedStackIds.filter((id) => id !== stackId)
      : [...selectedStackIds, stackId];

    setParams(buildParams({ nextStackIds: next, nextPage: 1 }));
  };

  const changeDeadlineFilter = (filter: DeadlineFilter) =>
    setParams(buildParams({ nextDeadline: filter, nextPage: 1 }));
  const changeExperienceFilter = (filter: ExperienceFilter) =>
    setParams(buildParams({ nextExperience: filter, nextPage: 1 }));

  const clearAllFilters = () => {
    const params: Record<string, string> = {};
    if (cid) params.cid = cid;
    if (rawKeyword) params.keyword = rawKeyword;

    params.sort = sort;
    params.page = '1';

    setParams(params);
  };

  const filteredSortedJobs = useMemo(() => {
    let filtered = SERVER_JOBS;

    // ✅ 회사 필터: cid 기반 (string 비교)
    if (cid) {
      filtered = filtered.filter((job) => job.companyId === cid);
    } else if (keyword) {
      const k = keyword.toLowerCase();
      filtered = filtered.filter((job) => job.title.toLowerCase().includes(k));
    }

    // ✅ 스택 필터: OR (선택한 것 중 하나라도 포함)
    if (selectedStackIds.length > 0) {
      filtered = filtered.filter((job) =>
        selectedStackIds.some((id) => (job.stackIds ?? []).includes(id)),
      );
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
      if (sort === 'latest') return sortLatest(a, b);
      return deadlineSortKey(a.deadline) - deadlineSortKey(b.deadline);
    });

    return sortedList;
  }, [SERVER_JOBS, cid, keyword, selectedStackIds, deadlineFilter, experienceFilter, sort]);

  const totalCount = filteredSortedJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const pagedJobs = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSortedJobs.slice(start, start + PAGE_SIZE);
  }, [filteredSortedJobs, page, totalPages]);

  useEffect(() => {
    const targets = pagedJobs.filter(
      (job) => (job.stackIds ?? []).length === 0 && !postingStackMap[job.id],
    );
    if (targets.length === 0) return;

    targets.forEach((job) => {
      if (postingStackInFlight.current.has(job.id)) return;
      postingStackInFlight.current.add(job.id);

      fetchJobPostingStacks(job.id)
        .then((res) => {
          const names =
            res.data
              ?.map((stack) => stack.stack_name || (stack as { stackName?: string }).stackName)
              .filter((name): name is string => typeof name === 'string' && name.length > 0) ?? [];
          if (names.length > 0) {
            setPostingStackMap((prev) => ({ ...prev, [job.id]: names }));
          }
        })
        .catch(() => {
          // ignore; fallback rendering handles empty
        })
        .finally(() => {
          postingStackInFlight.current.delete(job.id);
        });
    });
  }, [pagedJobs, postingStackMap]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStackIds.length > 0) count += 1;
    if (deadlineFilter !== 'all') count += 1;
    if (experienceFilter !== 'all') count += 1;
    return count;
  }, [selectedStackIds, deadlineFilter, experienceFilter]);

  useEffect(() => {
    if (page > totalPages) setParams(buildParams({ nextPage: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const scrollToListTop = () => listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const setPage = (nextPage: number) => {
    setParams(buildParams({ nextPage }));
    requestAnimationFrame(() => scrollToListTop());
  };

  const headerTitle = useMemo(() => {
    if (!cid && !keyword) return '전체 공고 조회';
    if (keyword) return `'${keyword}' 공고 조회`;
    if (companyName) return `${companyName} 공고 조회`;
    return '해당 기업 공고 조회';
  }, [cid, keyword, companyName]);

  return (
    <div className="bg-pure-white min-h-screen overflow-x-hidden pt-32 pb-32">
      <div className="w-full">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <div className="mb-12 flex items-end justify-between gap-6">
            <header className="border-point-blue border-l-4 pl-6">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-midnight-ink text-[42px] leading-[1.05] font-black tracking-tighter uppercase break-words"
              >
                {headerTitle}
              </motion.h1>

              <p className="text-slate-gray mt-2 text-[17px] font-semibold italic opacity-70">
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
                  className={[
                    'rounded-2xl px-8 shadow-sm',
                    sort === 'latest'
                      ? 'tracking-tighter'
                      : 'border-silver-mist/30 bg-pure-white text-slate-gray hover:bg-soft-pebble/40',
                  ].join(' ')}
                >
                  최신순
                </Button>

                <Button
                  variant={sort === 'deadline' ? 'dark' : 'outline'}
                  size="lg"
                  onClick={() => changeSort('deadline')}
                  className={[
                    'rounded-2xl px-8 shadow-sm',
                    sort === 'deadline'
                      ? 'tracking-tighter'
                      : 'border-silver-mist/30 bg-pure-white text-slate-gray hover:bg-soft-pebble/40',
                  ].join(' ')}
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
                  selectedStackIds={selectedStackIds}
                  deadlineFilter={deadlineFilter}
                  experienceFilter={experienceFilter}
                  allStacks={ALL_STACK_OPTIONS}
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
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="!rounded-xl">
                      다시 시도
                    </Button>
                  </div>
                </div>
              )}

              {!isLoading && !isError && (
                <>
                  <section className="grid gap-5">
                    <AnimatePresence mode="wait">
                      {pagedJobs.length > 0 ? (
                        pagedJobs.map((job) => {
                          const isUrgent = getUrgent(job.deadline);
                          const rawTitle = job.title ?? '';
                          const isLongTitle = rawTitle.length > 42;
                          const displayTitle = isLongTitle ? `${rawTitle.slice(0, 42)}...` : rawTitle;

                          return (
                            <motion.div
                              key={job.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              whileHover={{ y: -4 }}
                              className={[
                                'border-silver-mist/20 bg-pure-white flex cursor-pointer items-center gap-5 rounded-4xl border p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/40',
                                isUrgent ? 'ring-1 ring-red-200' : '',
                              ].join(' ')}
                              onClick={() => navigate(`/job-posts/${job.id}`)}
                            >
                              <div className="border-silver-mist/20 bg-pure-white flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border p-2">
                                {job.logo ? (
                                  <img
                                    src={job.logo}
                                    alt={job.company}
                                    className="h-full w-full object-contain"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span className="text-slate-gray text-xl font-black">
                                    {job.company?.[0] ?? '?'}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="mb-3 flex flex-wrap items-center gap-3">
                                  <span className="text-slate-gray text-xs font-black opacity-70">
                                    {job.company}
                                  </span>

                                  <span className="border-silver-mist/20 text-slate-gray rounded-xl border px-3 py-1 text-[11px] font-black tracking-tight">
                                    {job.type}
                                  </span>

                                  {isUrgent && (
                                    <span className="rounded-xl bg-red-50/70 px-3 py-1 text-[11px] font-black text-red-600">
                                      마감 임박
                                    </span>
                                  )}
                                </div>

                                <h3
                                  className="text-midnight-ink hover:text-point-blue min-h-[34px] min-w-0 break-words text-[18px] font-black leading-[1.25] tracking-tight transition-colors"
                                  style={{ wordBreak: 'keep-all' }}
                                  title={isLongTitle ? rawTitle : undefined}
                                >
                                  {displayTitle}
                                </h3>

                                {/* ✅ stackId -> stackName 표시 */}
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {(job.stackIds ?? []).length > 0
                                    ? (job.stackIds ?? []).map((id) => (
                                        <span
                                          key={`${job.id}-${id}`}
                                          className="border-silver-mist/20 bg-cloud-dancer/30 text-slate-gray rounded-full border px-3 py-1 text-[11px] font-black tracking-tight"
                                        >
                                          {stackNameMap[id] ?? `#${id}`}
                                        </span>
                                      ))
                                    : (postingStackMap[job.id] ?? []).map((name) => (
                                        <span
                                          key={`${job.id}-${name}`}
                                          className="border-silver-mist/20 bg-cloud-dancer/30 text-slate-gray rounded-full border px-3 py-1 text-[11px] font-black tracking-tight"
                                        >
                                          {name}
                                        </span>
                                      ))}
                                </div>
                              </div>

                              <div className="border-silver-mist/20 flex w-[170px] shrink-0 flex-col items-center gap-4 border-l pl-6">
                                <div className="flex flex-col items-center gap-1.5 text-center">
                                  <span className="text-slate-gray text-[11px] font-black tracking-widest uppercase opacity-50">
                                    Deadline
                                  </span>

                                  <span
                                    className={[
                                      'text-[18px] font-black tabular-nums',
                                      isUrgent ? 'text-red-600' : 'text-midnight-ink',
                                    ].join(' ')}
                                  >
                                    {job.deadline}
                                  </span>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/job-posts/${job.id}`);
                                  }}
                                  className="hover:text-point-blue rounded-2xl px-6 font-bold shadow-md hover:bg-soft-pebble/30"
                                >
                                  공고 보기
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="border-silver-mist/20 bg-pure-white rounded-4xl border border-dashed p-10"
                        >
                          <EmptyState
                            title="조건에 맞는 공고가 없습니다"
                            description="필터 조건을 변경하거나 초기화해보세요."
                            actionLabel={activeFilterCount > 0 ? '필터 초기화' : '뒤로 가기'}
                            onAction={() =>
                              activeFilterCount > 0 ? clearAllFilters() : window.history.back()
                            }
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>

                  {totalCount > 0 && (
                    <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} onChangePage={setPage} />
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
