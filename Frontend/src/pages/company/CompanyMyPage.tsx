import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import axios from 'axios';
import Button from '../../components/Button/Button';

import CalendarPanel from '../../components/Calendar/CalendarPanel';
import CalendarScheduleList from '../../components/Calendar/CalendarScheduleList';
import {
  formatDateTime,
  formatYmdToKorean,
  toYmd,
  toYmdFromIso,
} from '../../components/Calendar/calendarUtils';

const ROUTES = {
  jobPostManage: '/company/jobs',
  interviewManage: '/interviews',
  resumeView: (applicantId: number) => `/resume/${applicantId}`,
  jobPostDetail: (jobPostId: number) => `/job-posts/${jobPostId}`,
  companyEdit: (companyId: string) => `/companies/${companyId}/edit`,
  companyDetail: (companyId: string) => `/companies/${companyId}`,
} as const;

type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  refetch: () => void;
};

type UserProfileData = {
  userId: number;
  email: string;
  name: string;
  role: string;
  cid?: string;
  companyName?: string;
  managerName?: string;
};

// ✅ 추가: 기업 상세 정보 타입 정의
interface CompanyDetailData {
  cid: string;
  corpName: string;
  totPsncnt: string;
  busiSize: string;
  yrSalesAmt: string;
  corpAddr: string;
  homePg: string;
  busiCont: string;
  logo: string;
}

type JobPostView = {
  id: number;
  postingTitle: string;
  position: string;
  createdAt: string;
  deadlineAt?: string;
  companyName?: string;
};

type InterviewEvent = {
  id: number;
  title: string;
  scheduledAt: string;
  applicantId: number;
  candidateName: string;
  position?: string;
};

interface JobPostApiItem {
  id: number;
  title: string;
  active: number;
  startDate: string;
  endDate: string;
  vcnt: number;
  cid: string;
  detail: string;
  jobType: number;
  stackIds: number[];
  company: {
    cid: string;
    corpName: string;
    totPsncnt: string;
    busiSize: string;
    yrSalesAmt: string;
    corpAddr: string;
    homePg: string;
    busiCont: string;
    logo: string;
  };
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function daysUntil(iso: string) {
  const now = startOfDay(new Date()).getTime();
  const target = startOfDay(new Date(iso)).getTime();
  const diff = target - now;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ddayLabel(deadlineAt?: string) {
  if (!deadlineAt || deadlineAt === '상시채용') {
    return { text: '상시채용', tone: 'always' as const, left: 999 };
  }
  const left = daysUntil(deadlineAt);
  if (left < 0) return { text: '마감', tone: 'closed' as const, left };
  if (left === 0) return { text: 'D-DAY', tone: 'urgent' as const, left };
  return { text: `D-${left}`, tone: left <= 3 ? ('urgent' as const) : ('normal' as const), left };
}

function formatScheduleHint(startIso: string) {
  const now = new Date();
  const start = new Date(startIso);

  const nowMs = now.getTime();
  const startMs = start.getTime();

  if (startMs <= nowMs) return null;

  const todayYmd = toYmd(now);
  const startYmd = toYmd(start);

  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const start0 = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const dayDiff = Math.round((start0 - today0) / (24 * 60 * 60 * 1000));

  if (startYmd === todayYmd) {
    const diffMin = Math.ceil((startMs - nowMs) / (60 * 1000));
    if (diffMin <= 0) return null;

    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;

    if (h <= 0) return `${m}분 전`;
    if (m === 0) return `${h}시간 전`;
    return `${h}시간 ${m}분 전`;
  }

  if (dayDiff > 0) return `D-${dayDiff}`;

  return null;
}

function useQueryLike<T>(fetcher: () => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const run = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(undefined);

    try {
      const res = await fetcher();
      setData(res);
    } catch (err) {
      setData(null);
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, isError, errorMessage, refetch: run };
}

async function fetchMyProfile(): Promise<UserProfileData> {
  const response = await axios.get('/api/auth/me');
  const result = response.data;

  if (!result.status) {
    throw new Error(result.message || '사용자 정보를 불러오지 못했습니다.');
  }

  const { data } = result;
  return {
    userId: data.userId,
    email: data.email,
    name: data.name,
    role: data.role,
    cid: data.cid,
    managerName: data.name,
    companyName: '',
  };
}

// ✅ 추가: 기업 상세 정보 조회 API 함수
async function fetchCompanyDetail(cid?: string): Promise<CompanyDetailData | null> {
  if (!cid) return null;

  const response = await axios.get(`/api/companies/${cid}`);
  const result = response.data;

  if (!result.status) {
    throw new Error(result.message || '기업 정보를 불러오지 못했습니다.');
  }

  return result.data;
}

async function fetchCompanyJobPosts(cid?: string): Promise<JobPostView[]> {
  if (!cid) return [];

  const response = await axios.get(`/api/job-postings/company/${cid}`);
  const result = response.data;

  if (!result.status) {
    throw new Error(result.message || '공고 목록을 불러오지 못했습니다.');
  }

  return result.data.map((item: JobPostApiItem) => {
    let detailText = item.detail;
    try {
      const parsed = JSON.parse(item.detail);
      if (parsed && typeof parsed === 'object' && parsed.requirement_text) {
        detailText = parsed.requirement_text;
      }
    } catch {
      detailText = item.detail;
    }

    return {
      id: item.id,
      postingTitle: item.title,
      position: detailText.length > 20 ? detailText.substring(0, 20) + '...' : detailText,
      createdAt: item.startDate,
      deadlineAt: item.endDate,
      companyName: item.company?.corpName,
    };
  });
}

async function fetchCompanyInterviews(): Promise<InterviewEvent[]> {
  await new Promise((r) => setTimeout(r, 360));

  const now = new Date();
  const year = now.getFullYear();
  const month0 = now.getMonth();
  const start = new Date(year, month0, now.getDate(), 0, 0, 0, 0);
  const end = new Date(year, month0 + 1, 0, 23, 59, 59, 999);

  const slots = [
    { h: 9, m: 0, title: '1차 면접' },
    { h: 10, m: 30, title: '실무 면접' },
    { h: 13, m: 0, title: '2차 면접' },
  ] as const;
  const candidateBase = ['지원자 A', '지원자 B', '지원자 C', '지원자 D', '지원자 E'];
  const positions = ['Frontend', 'Backend', 'Data', 'DevOps', 'AI'];
  let id = 201;
  let applicantId = 101;
  const out: InterviewEvent[] = [];

  for (
    let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    d.getTime() <= end.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dailyCount = (d.getDate() % 2) + 1;
    for (let i = 0; i < dailyCount; i++) {
      const s = slots[i % slots.length];
      const when = new Date(d.getFullYear(), d.getMonth(), d.getDate(), s.h, s.m, 0, 0);
      out.push({
        id: id++,
        title: s.title,
        scheduledAt: when.toISOString(),
        applicantId: applicantId++,
        candidateName: `${candidateBase[i]}`,
        position: positions[d.getDate() % positions.length],
      });
    }
  }
  return out;
}

export default function CompanyMyPage() {
  const navigate = useNavigate();
  const profileQuery = useQueryLike(fetchMyProfile, []);
  const myCid = profileQuery.data?.cid;

  // ✅ 추가: CID를 기반으로 기업 상세 정보 직접 조회
  const companyQuery = useQueryLike(() => fetchCompanyDetail(myCid), [myCid]);
  const jobPostQuery = useQueryLike(() => fetchCompanyJobPosts(myCid), [myCid]);
  const interviewQuery = useQueryLike(fetchCompanyInterviews, []);

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setEntered(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  // ✅ 수정됨: 기업 정보를 companyQuery에서 1순위로 가져옴
  const displayCompanyName =
    companyQuery.data?.corpName ??
    jobPostQuery.data?.[0]?.companyName ??
    profileQuery.data?.companyName ??
    '기업명 로딩중...';

  const managerName = profileQuery.data?.managerName ?? '-';
  const email = profileQuery.data?.email ?? '-';
  const [jobPostSort, setJobPostSort] = useState<'latest' | 'deadline'>('latest');
  const [interviewFilter, setInterviewFilter] = useState<'upcoming' | 'today'>('upcoming');

  const jobPostItems = useMemo(() => {
    const list = jobPostQuery.data ?? [];

    const sorted = [...list].sort((a, b) => {
      if (jobPostSort === 'latest') return a.createdAt > b.createdAt ? -1 : 1;
      const aHas = !!a.deadlineAt && a.deadlineAt !== '상시채용';
      const bHas = !!b.deadlineAt && b.deadlineAt !== '상시채용';
      if (aHas && bHas) return a.deadlineAt! < b.deadlineAt! ? -1 : 1;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return a.createdAt > b.createdAt ? -1 : 1;
    });

    return sorted.slice(0, 4).map((p) => {
      const dday = ddayLabel(p.deadlineAt);
      return {
        key: p.id,
        title: p.postingTitle,
        subtitle: p.position,
        meta:
          p.deadlineAt && p.deadlineAt !== '상시채용'
            ? `마감 ${formatDateTime(p.deadlineAt)}`
            : `등록 ${formatDateTime(p.createdAt)}`,
        badge: dday ? (
          <span
            className={[
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black',
              dday.tone === 'urgent'
                ? 'bg-red-50 text-red-600'
                : dday.tone === 'closed'
                  ? 'bg-zinc-100 text-zinc-500'
                  : dday.tone === 'always'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-zinc-100 text-zinc-600',
            ].join(' ')}
          >
            {dday.tone === 'urgent' ? `마감임박 ${dday.text}` : dday.text}
          </span>
        ) : null,
        onClick: () => navigate(ROUTES.jobPostDetail(p.id)),
      };
    });
  }, [jobPostQuery.data, jobPostSort, navigate]);

  const interviewPreviewItems = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const today = toYmd(now);

    const base = (interviewQuery.data ?? [])
      .filter((e) => new Date(e.scheduledAt).getTime() >= nowMs)
      .sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1));

    const filtered =
      interviewFilter === 'today'
        ? base.filter((e) => toYmdFromIso(e.scheduledAt) === today)
        : base;

    return filtered.slice(0, 3).map((e) => ({
      key: e.id,
      applicantId: e.applicantId,
      candidateName: e.candidateName,
      stageTitle: e.title,
      subtitle: e.position ? e.position : displayCompanyName,
      meta: formatDateTime(e.scheduledAt),
      onClick: () => navigate(ROUTES.interviewManage),
    }));
  }, [interviewQuery.data, interviewFilter, navigate, displayCompanyName]);

  const todayYmd = toYmd(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => todayYmd);

  const interviewEventMap = useMemo(() => {
    const events = interviewQuery.data ?? [];
    const m = new Map<string, InterviewEvent[]>();
    for (const ev of events) {
      const ymd = toYmdFromIso(ev.scheduledAt);
      const list = m.get(ymd) ?? [];
      list.push(ev);
      m.set(ymd, list);
    }
    for (const [k, list] of m.entries()) {
      list.sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1));
      m.set(k, list);
    }
    return m;
  }, [interviewQuery.data]);

  const selectedEvents = useMemo(
    () => interviewEventMap.get(selectedDate) ?? [],
    [interviewEventMap, selectedDate],
  );

  return (
    <div className="text-midnight-ink min-h-screen min-w-7xl bg-white pt-28 pb-20">
      <div
        className={[
          'mx-auto w-7xl space-y-10 px-6 transition-all duration-200',
          entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        ].join(' ')}
      >
        <header className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="relative p-10">
            <div className="absolute inset-0 bg-linear-to-r from-zinc-50 via-zinc-50/70 to-transparent" />
            <div className="relative flex flex-nowrap items-center justify-between gap-5">
              <div>
                <p className="text-xs font-black tracking-[0.3em] text-zinc-400 uppercase">
                  CORPORATE DASHBOARD
                </p>
                <h1
                  className="mt-2 cursor-pointer text-4xl font-black tracking-wide transition-colors hover:text-blue-600/80"
                  onClick={() => myCid && navigate(ROUTES.companyDetail(myCid))}
                >
                  {companyQuery.isLoading && profileQuery.isLoading
                    ? '불러오는 중…'
                    : displayCompanyName}
                </h1>
                <p className="mt-3 text-sm font-semibold text-zinc-500">
                  {managerName} · {email}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="blue"
                  size="md"
                  className="h-12 rounded-2xl px-6 text-[15px] shadow-md transition-transform active:scale-95"
                  onClick={() => myCid && navigate(ROUTES.companyEdit(myCid))}
                >
                  정보 수정
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">관리 바로가기</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <HubCard title="공고" onClick={() => navigate(ROUTES.jobPostManage)}>
              <div className="flex min-h-70 flex-1 flex-col px-6 py-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={jobPostSort === 'latest' ? 'dark' : 'outline'}
                      className="rounded-xl"
                      onClick={() => setJobPostSort('latest')}
                    >
                      최신
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={jobPostSort === 'deadline' ? 'dark' : 'outline'}
                      className="rounded-xl"
                      onClick={() => setJobPostSort('deadline')}
                    >
                      마감임박
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => navigate(ROUTES.jobPostManage)}
                  >
                    공고 관리
                  </Button>
                </div>

                <div className="flex-1">
                  {jobPostQuery.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <ListSkeletonCompact rows={4} />
                    </div>
                  ) : jobPostQuery.isError ? (
                    <div className="flex h-full items-center justify-center">
                      <InlineError
                        message={jobPostQuery.errorMessage ?? '공고를 불러오지 못했어요.'}
                        onRetry={jobPostQuery.refetch}
                      />
                    </div>
                  ) : (jobPostQuery.data ?? []).length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <EmptyHint text="등록된 공고가 없어요." />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {jobPostItems.map((it) => (
                        <ListRowNoThumb
                          key={String(it.key)}
                          title={it.title}
                          subtitle={it.subtitle}
                          meta={it.meta}
                          badge={it.badge}
                          onClick={it.onClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </HubCard>

            <HubCard title="면접" onClick={() => navigate(ROUTES.interviewManage)}>
              <div className="flex min-h-70 flex-1 flex-col px-6 py-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={interviewFilter === 'upcoming' ? 'dark' : 'outline'}
                      className="rounded-xl"
                      onClick={() => setInterviewFilter('upcoming')}
                    >
                      다가오는
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={interviewFilter === 'today' ? 'dark' : 'outline'}
                      className="rounded-xl"
                      onClick={() => setInterviewFilter('today')}
                    >
                      오늘
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  {interviewQuery.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <ListSkeletonCompact rows={3} />
                    </div>
                  ) : interviewQuery.isError ? (
                    <div className="flex h-full items-center justify-center">
                      <InlineError
                        message={interviewQuery.errorMessage ?? '면접 정보를 불러오지 못했어요.'}
                        onRetry={interviewQuery.refetch}
                      />
                    </div>
                  ) : interviewPreviewItems.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <EmptyHint text="표시할 면접이 없어요." />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {interviewPreviewItems.map((it) => (
                        <ListRowInterviewWithResume
                          key={String(it.key)}
                          candidateName={it.candidateName}
                          stageTitle={it.stageTitle}
                          subtitle={it.subtitle}
                          meta={it.meta}
                          onRowClick={it.onClick}
                          onResumeClick={() => navigate(ROUTES.resumeView(it.applicantId))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </HubCard>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">캘린더</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">면접 일정만 모아봤어요.</p>
            </div>
          </div>

          <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-8 shadow-sm">
            {interviewQuery.isLoading ? (
              <CalendarSkeleton />
            ) : interviewQuery.isError ? (
              <ErrorBox
                message={interviewQuery.errorMessage ?? '면접 일정을 불러오지 못했어요.'}
                onRetry={interviewQuery.refetch}
              />
            ) : (
              <div className="grid grid-cols-[1fr_380px] gap-8">
                <CalendarPanel
                  viewMonth={viewMonth}
                  selectedDate={selectedDate}
                  todayYmd={todayYmd}
                  onSelectDate={setSelectedDate}
                  onChangeViewMonth={setViewMonth}
                  getEventCount={(ymd) => interviewEventMap.get(ymd)?.length ?? 0}
                />

                <CalendarScheduleList<InterviewEvent>
                  title="선택한 날짜 일정"
                  subtitle={formatYmdToKorean(selectedDate)}
                  items={selectedEvents}
                  emptyText="이 날짜에는 면접 일정이 없어요."
                  renderItem={(e) => {
                    const hint = formatScheduleHint(e.scheduledAt);
                    return (
                      <div key={e.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                        <p className="text-midnight-ink text-sm font-black">
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-black text-zinc-700">
                            {e.title}
                          </span>
                          <span className="ml-2">{e.candidateName}</span>
                        </p>
                        <p className="mt-2 text-xs font-semibold text-zinc-500">
                          {formatDateTime(e.scheduledAt)} <span className="text-zinc-300">·</span>{' '}
                          {hint}
                        </p>
                        {e.position ? (
                          <p className="mt-1 text-xs font-semibold text-zinc-500">{e.position}</p>
                        ) : null}
                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(ROUTES.resumeView(e.applicantId))}
                          >
                            이력서 보기
                          </Button>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function HubCard({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const shouldIgnoreCardClick = (target: EventTarget | null, currentTarget: HTMLElement) => {
    if (!(target instanceof HTMLElement)) return false;

    const interactive = target.closest(
      'button, a, input, select, textarea, [data-stop-card-click="true"]',
    );
    if (interactive) return true;

    const roleButton = target.closest('[role="button"]');
    if (roleButton && roleButton !== currentTarget) return true;

    return false;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (shouldIgnoreCardClick(e.target, e.currentTarget)) return;
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.currentTarget !== e.target) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        'group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition',
        'hover:ring-midnight-ink/20 hover:-translate-y-0.5 hover:shadow-md hover:ring-2',
        'focus:ring-midnight-ink/30 focus:ring-2 focus:outline-none',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div className="min-w-0">
          <p className="text-midnight-ink truncate text-base font-black">{title}</p>
        </div>
        <ChevronRight className="text-zinc-300" size={18} aria-hidden />
      </div>

      {children}
    </div>
  );
}

function ListRowNoThumb({
  title,
  subtitle,
  meta,
  badge,
  onClick,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  badge?: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl border-0 bg-transparent p-3 text-left transition hover:bg-zinc-50"
    >
      <div className="min-w-0 flex-1">
        <p className="text-midnight-ink line-clamp-2 text-sm font-black">{title}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="truncate text-xs font-semibold text-zinc-500">{subtitle}</p>
          {meta ? (
            <>
              <span className="text-zinc-300">·</span>
              <p className="truncate text-xs font-semibold text-zinc-500">{meta}</p>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {badge}
        <span className="text-zinc-200 transition-colors group-hover:text-zinc-400">›</span>
      </div>
    </Button>
  );
}

function ListRowInterviewWithResume({
  candidateName,
  stageTitle,
  subtitle,
  meta,
  onRowClick,
  onResumeClick,
}: {
  candidateName: string;
  stageTitle: string;
  subtitle: string;
  meta?: string;
  onRowClick: () => void;
  onResumeClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onRowClick();
        if (e.key === ' ') {
          e.preventDefault();
          onRowClick();
        }
      }}
      className="group w-full cursor-pointer rounded-2xl p-3 text-left transition hover:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-midnight-ink line-clamp-2 text-sm font-black">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-black text-zinc-700">
              {stageTitle}
            </span>
            <span className="ml-2">{candidateName}</span>
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="truncate text-xs font-semibold text-zinc-500">{subtitle}</p>
            {meta ? (
              <>
                <span className="text-zinc-300">·</span>
                <p className="truncate text-xs font-semibold text-zinc-500">{meta}</p>
              </>
            ) : null}
          </div>
        </div>

        <div className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              onResumeClick();
            }}
          >
            이력서 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

function ListSkeletonCompact({ rows = 3 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl p-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200/60" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-200/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="bg-cloud-dancer/25 rounded-2xl p-6 text-center">
      <p className="text-sm font-semibold text-zinc-500">{text}</p>
    </div>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4">
      <p className="text-midnight-ink text-sm font-black">불러오기 실패</p>
      <p className="mt-1 text-sm font-semibold text-zinc-500">{message}</p>
      <div className="mt-3 flex justify-end">
        <Button variant="dark" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-7 gap-3 text-center text-sm font-bold text-zinc-500">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-3">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="min-h-19.5 animate-pulse rounded-2xl border border-zinc-200 bg-white/60 p-3"
          >
            <div className="h-4 w-8 rounded bg-zinc-200/70" />
            <div className="mt-3 h-3 w-20 rounded bg-zinc-200/50" />
            <div className="mt-2 h-3 w-16 rounded bg-zinc-200/40" />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded bg-zinc-200/60" />
        <div className="mt-4 space-y-2">
          <div className="h-16 animate-pulse rounded-xl bg-zinc-200/30" />
          <div className="h-16 animate-pulse rounded-xl bg-zinc-200/30" />
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <p className="text-midnight-ink text-sm font-black">데이터를 불러오지 못했어요</p>
      <p className="mt-2 text-sm font-semibold text-zinc-500">{message}</p>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="dark" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    </div>
  );
}
