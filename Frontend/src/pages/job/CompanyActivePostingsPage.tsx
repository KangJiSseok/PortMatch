import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Button from '@/components/Button/Button';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';

import { fetchActiveJobPostingsByCompany, fetchJobPostingStacks } from '@/api/jobPostings';
import { useStackNames } from '@/hooks/useStackNames';
import type { JobPostingDto } from '@/types/backendJobPosting';

type JobPosting = {
  id: number;
  title: string;
  companyId: string;
  company: string;
  stackIds: number[];
  location: string;
  deadline: string;
  type: string;
  logo: string;
};

type DeadlineFilter = 'all' | 'urgent' | 'week' | 'relaxed' | 'always';
type ExperienceFilter = 'all' | 'junior' | '1+' | '3+' | '5+';

type StackOption = { id: number; name: string };

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

function Divider() {
  return <div className="border-silver-mist/20 mt-5 w-full border-t" />;
}

function parseDday(deadline: string) {
  if (deadline === '오늘마감') return 0;
  if (deadline.startsWith('D-')) {
    const n = Number(deadline.slice(2));
    if (Number.isFinite(n)) return n;
  }
  return null;
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

function getUrgent(deadline: string) {
  if (deadline === '오늘마감') return true;
  if (deadline.startsWith('D-')) {
    const n = Number(deadline.slice(2));
    return Number.isFinite(n) && n <= 3;
  }
  return false;
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

export default function CompanyActivePostingsPage() {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedStackIds, setSelectedStackIds] = useState<number[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>('all');

  const [postingStackMap, setPostingStackMap] = useState<Record<number, string[]>>({});
  const postingStackInFlight = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!cid) {
      setJobs([]);
      setIsLoading(false);
      setIsError(true);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsError(false);

    fetchActiveJobPostingsByCompany(cid)
      .then((res) => {
        if (cancelled) return;
        const mapped = (res?.data ?? []).map(mapDtoToUiJob);
        setJobs(mapped);
      })
      .catch(() => {
        if (cancelled) return;
        setIsError(true);
        setJobs([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cid]);

  const companyInfo = useMemo(() => {
    if (jobs.length === 0) return null;
    const first = jobs[0];
    return {
      name: first.company,
      logo: first.logo,
      location: first.location,
    };
  }, [jobs]);

  const allStackIdsOnPage = useMemo(() => {
    const ids: number[] = [];
    jobs.forEach((j) => (j.stackIds ?? []).forEach((id) => ids.push(id)));
    return ids;
  }, [jobs]);

  const stackNameMap = useStackNames(allStackIdsOnPage);

  const ALL_STACK_OPTIONS: StackOption[] = useMemo(() => {
    const set = new Set<number>();
    jobs.forEach((j) => (j.stackIds ?? []).forEach((id) => set.add(id)));
    return Array.from(set)
      .sort((a, b) => a - b)
      .map((id) => ({ id, name: stackNameMap[id] ?? `#${id}` }));
  }, [jobs, stackNameMap]);

  useEffect(() => {
    const targets = jobs.filter((job) => (job.stackIds ?? []).length === 0 && !postingStackMap[job.id]);
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
          // ignore
        })
        .finally(() => {
          postingStackInFlight.current.delete(job.id);
        });
    });
  }, [jobs, postingStackMap]);

  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (selectedStackIds.length > 0) {
      filtered = filtered.filter((job) =>
        selectedStackIds.some((id) => (job.stackIds ?? []).includes(id)),
      );
    }

    if (deadlineFilter !== 'all') {
      filtered = filtered.filter((job) => {
        const d = job.deadline;
        const n = parseDday(d);

        if (deadlineFilter === 'always') return d === '상시 채용';
        if (deadlineFilter === 'urgent') return d === '오늘마감' || (n !== null && n >= 1 && n <= 3);
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

    return filtered;
  }, [jobs, selectedStackIds, deadlineFilter, experienceFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStackIds.length > 0) count += 1;
    if (deadlineFilter !== 'all') count += 1;
    if (experienceFilter !== 'all') count += 1;
    return count;
  }, [selectedStackIds, deadlineFilter, experienceFilter]);

  const toggleStack = (stackId: number) => {
    setSelectedStackIds((prev) =>
      prev.includes(stackId) ? prev.filter((id) => id !== stackId) : [...prev, stackId],
    );
  };

  const clearAllFilters = () => {
    setSelectedStackIds([]);
    setDeadlineFilter('all');
    setExperienceFilter('all');
  };

  return (
    <div className="bg-pure-white min-h-screen overflow-x-hidden pt-32 pb-32">
      <div className="mx-auto w-full max-w-[1100px] px-6">
        <header className="mb-10 flex flex-col gap-6 border-l-4 border-point-blue pl-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="text-midnight-ink text-[38px] font-black tracking-tight">
                {companyInfo?.name ?? '기업 공고'}
              </h1>
              <p className="text-slate-gray mt-2 text-[15px] font-semibold italic opacity-70">
                진행 중 공고 {jobs.length}건
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/job-postings')}
                className="!rounded-xl"
              >
                전체 공고로
              </Button>
            </div>
          </div>

          {companyInfo && (
            <div className="border-silver-mist/20 bg-pure-white flex items-center gap-4 rounded-3xl border p-4 shadow-sm">
              <div className="border-silver-mist/20 bg-pure-white flex h-14 w-14 items-center justify-center rounded-2xl border p-2">
                {companyInfo.logo ? (
                  <img
                    src={companyInfo.logo}
                    alt={companyInfo.name}
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-slate-gray text-lg font-black">
                    {companyInfo.name?.[0] ?? '?'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-midnight-ink text-[16px] font-black">{companyInfo.name}</p>
                {companyInfo.location && (
                  <p className="text-slate-gray text-[12px] font-semibold">{companyInfo.location}</p>
                )}
              </div>
            </div>
          )}
        </header>

        {isLoading && (
          <div className="py-20">
            <LoadingState />
          </div>
        )}

        {isError && !isLoading && (
          <div className="bg-pure-white rounded-4xl border-2 border-dashed border-zinc-100 py-20">
            <ErrorState description="진행 중 공고를 불러오지 못했습니다." />
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="!rounded-xl">
                다시 시도
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
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
                  onChangeDeadline={setDeadlineFilter}
                  onChangeExperience={setExperienceFilter}
                  onClearAll={clearAllFilters}
                />
              </div>
            </aside>

            <section className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => {
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
                    description="필터를 변경하거나 초기화해보세요."
                    actionLabel={activeFilterCount > 0 ? '필터 초기화' : '전체 공고로'}
                    onAction={() => (activeFilterCount > 0 ? clearAllFilters() : navigate('/job-postings'))}
                  />
                </motion.div>
              )}
              </AnimatePresence>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
