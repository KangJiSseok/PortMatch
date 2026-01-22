// src/pages/CorporateMyPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';

/** ------------------ routes (프로젝트 라우트에 맞게 수정) ------------------ */
const ROUTES = {
  jobPostNew: '/jobposts/new',
  jobPostManage: '/company/jobs',
  interviewManage: '/interviews',
  // ✅ 이력서 보기 라우트(프로젝트에 맞게 변경)
  resumeView: (applicantId: number) => `/resume/${applicantId}`,
  // ✅ 공고 상세 라우트(프로젝트에 맞게 변경)
  jobPostDetail: (jobPostId: number) => `/job-posts/${jobPostId}`,
  // ⚠️ 원본 코드 유지 (필요하면 함수로 바꿔서 회사ID 넣어주세요)
  companyEdit: '/companies/${companyId}',
} as const;

/** ------------------ types ------------------ */
type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  refetch: () => void;
};

type CompanyProfileView = {
  companyName: string;
  managerName: string;
  email: string;
  website?: string;
};

type JobPostView = {
  id: number;
  postingTitle: string;
  position: string;
  createdAt: string; // ISO
  deadlineAt?: string; // ISO (optional)
};

type InterviewEvent = {
  id: number;
  title: string; // ex) 1차 면접
  scheduledAt: string; // ISO
  applicantId: number;
  candidateName: string;
  position?: string;
};

/** ------------------ utils ------------------ */
function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toYmdFromIso(iso: string) {
  return iso.slice(0, 10);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function formatYmdToKorean(ymd: string) {
  const [y, m, d] = ymd.split('-');
  return `${y}.${m}.${d}`;
}

function buildMonthCells(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const startDay = first.getDay(); // 0=일
  const start = new Date(year, monthIndex0, 1 - startDay);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
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
  if (!deadlineAt) return null;
  const left = daysUntil(deadlineAt);
  if (left < 0) return { text: '마감', tone: 'closed' as const, left };
  if (left === 0) return { text: 'D-DAY', tone: 'urgent' as const, left };
  return { text: `D-${left}`, tone: left <= 3 ? ('urgent' as const) : ('normal' as const), left };
}

/** ✅ React Query 느낌 미니 훅 */
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
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, isError, errorMessage, refetch: run };
}

/** ------------------ mock fetchers (MVP용) ------------------ */
async function fetchCompanyProfile(): Promise<CompanyProfileView> {
  await new Promise((r) => setTimeout(r, 260));
  return {
    companyName: '샘플 기업',
    managerName: '담당자',
    email: 'hr@example.com',
    website: 'https://example.com',
  };
}

async function fetchCompanyJobPosts(): Promise<JobPostView[]> {
  await new Promise((r) => setTimeout(r, 320));

  const now = new Date();
  const mk = (
    daysAgo: number,
    id: number,
    postingTitle: string,
    position: string,
    deadlineDays?: number,
  ) => {
    const created = new Date(now);
    created.setDate(now.getDate() - daysAgo);
    created.setHours(10, 0, 0, 0);

    const deadline =
      typeof deadlineDays === 'number'
        ? (() => {
            const d = new Date(now);
            d.setDate(now.getDate() + deadlineDays);
            d.setHours(23, 59, 0, 0);
            return d.toISOString();
          })()
        : undefined;

    return {
      id,
      postingTitle,
      position,
      createdAt: created.toISOString(),
      deadlineAt: deadline,
    };
  };

  return [
    mk(1, 501, '프론트엔드 개발자 채용', 'Frontend', 2),
    mk(3, 502, '백엔드 개발자 채용', 'Backend', 10),
    mk(8, 503, '데이터 엔지니어 채용', 'Data', 3),
    mk(12, 504, 'DevOps 엔지니어 채용', 'DevOps', 14),
  ];
}

async function fetchCompanyInterviews(): Promise<InterviewEvent[]> {
  await new Promise((r) => setTimeout(r, 360));
  const now = new Date();

  const mk = (
    days: number,
    h: number,
    m: number,
    id: number,
    candidateName: string,
    title: string,
    applicantId: number,
    position?: string,
  ) => {
    const d = new Date(now);
    d.setDate(now.getDate() + days);
    d.setHours(h, m, 0, 0);
    return {
      id,
      candidateName,
      title,
      scheduledAt: d.toISOString(),
      applicantId,
      position,
    };
  };

  return [
    mk(0, 14, 0, 201, '지원자 A', '1차 면접', 101, 'Frontend'),
    mk(0, 16, 0, 202, '지원자 B', '1차 면접', 102, 'Backend'),
    mk(3, 10, 30, 203, '지원자 C', '2차 면접', 103, 'Backend'),
    mk(8, 11, 0, 204, '지원자 D', '컬처핏 인터뷰', 104, 'Frontend'),
  ];
}

/** ------------------ page ------------------ */
export default function CorporateMyPage() {
  const navigate = useNavigate();

  const profileQuery = useQueryLike(fetchCompanyProfile, []);
  const jobPostQuery = useQueryLike(fetchCompanyJobPosts, []);
  const interviewQuery = useQueryLike(fetchCompanyInterviews, []);

  // ✅ 부드러운 진입(깜빡임/급전개 완화)
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    setEntered(true);
  }, []);

  const companyName = profileQuery.data?.companyName ?? '기업';
  const managerName = profileQuery.data?.managerName ?? '-';
  const companyEmail = profileQuery.data?.email ?? '-';

  // ==========================
  // ✅ Quick Filter
  // ==========================
  const [jobPostSort, setJobPostSort] = useState<'latest' | 'deadline'>('latest');
  const [interviewFilter, setInterviewFilter] = useState<'upcoming' | 'today'>('upcoming');

  // ==========================
  // ✅ 관리 바로가기 - 공고 리스트
  // ==========================
  const jobPostItems = useMemo(() => {
    const list = jobPostQuery.data ?? [];

    const sorted = [...list].sort((a, b) => {
      if (jobPostSort === 'latest') return a.createdAt > b.createdAt ? -1 : 1;

      // deadline sort: 가까운 마감이 위
      const aHas = !!a.deadlineAt;
      const bHas = !!b.deadlineAt;
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
        meta: p.deadlineAt
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

  // ==========================
  // ✅ 면접 프리뷰 리스트
  // ==========================
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
      subtitle: e.position ? e.position : companyName,
      meta: formatDateTime(e.scheduledAt),
      onClick: () => navigate(ROUTES.interviewManage),
    }));
  }, [interviewQuery.data, interviewFilter, navigate, companyName]);

  // ==========================
  // ✅ 캘린더 (고정 레이아웃: 데스크탑 버전만 유지)
  // ==========================
  const todayYmd = toYmd(new Date());

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = viewMonth.getFullYear();
  const month0 = viewMonth.getMonth();
  const thisMonthLabel = `${year}.${String(month0 + 1).padStart(2, '0')}`;
  const cells = useMemo(() => buildMonthCells(year, month0), [year, month0]);

  const [selectedDate, setSelectedDate] = useState<string>(() => todayYmd);

  const goPrevMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    setViewMonth(next);
    setSelectedDate(toYmd(next));
  };

  const goNextMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    setViewMonth(next);
    setSelectedDate(toYmd(next));
  };

  const goToday = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(toYmd(now));
  };

  useEffect(() => {
    const sd = new Date(`${selectedDate}T00:00:00`);
    if (sd.getFullYear() !== year || sd.getMonth() !== month0) {
      setSelectedDate(toYmd(new Date(year, month0, 1)));
    }
  }, [year, month0, selectedDate]);

  const interviewEvents = interviewQuery.data ?? [];
  const interviewEventMap = useMemo(() => {
    const m = new Map<string, InterviewEvent[]>();
    for (const ev of interviewEvents) {
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
  }, [interviewEvents]);

  const selectedEvents = useMemo(
    () => interviewEventMap.get(selectedDate) ?? [],
    [interviewEventMap, selectedDate],
  );

  return (
    // ✅ [해결 1 방식] 문서(body) 자체가 넓어지도록 root에 min-w 고정
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-28 pb-20">
      {/* ✅ 캔버스 고정 폭 */}
      <div
        className={[
          'mx-auto w-[1280px] space-y-10 px-6 transition-all duration-200',
          entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        ].join(' ')}
      >
        {/* ✅ 헤더 */}
        <header className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="relative p-10">
            <div className="absolute inset-0 bg-linear-to-r from-zinc-50 via-zinc-50/70 to-transparent" />
            {/* ✅ 반응형 제거: wrap 금지 */}
            <div className="relative flex flex-nowrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black tracking-[0.3em] text-zinc-400 uppercase">
                  CORPORATE DASHBOARD
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tighter">
                  {profileQuery.isLoading ? '불러오는 중…' : companyName}
                </h1>
                <p className="mt-3 text-sm font-semibold text-zinc-500">
                  {managerName} · {companyEmail}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="blue"
                  size="md"
                  className="rounded-2xl shadow-md"
                  onClick={() => navigate(ROUTES.companyEdit)}
                >
                  정보 수정
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ 관리 바로가기 (공고/면접) */}
        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">관리 바로가기</h2>
            </div>
          </div>

          {/* ✅ 반응형 제거: 무조건 2열 고정 */}
          <div className="grid grid-cols-2 gap-5">
            {/* ✅ 공고 */}
            <HubCard title="공고" onHeaderClick={() => navigate(ROUTES.jobPostManage)}>
              <div className="flex min-h-[280px] flex-1 flex-col px-6 py-6">
                {/* ✅ 퀵 필터 */}
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

            {/* ✅ 면접 */}
            <HubCard title="면접" onHeaderClick={() => navigate(ROUTES.interviewManage)}>
              <div className="flex min-h-[280px] flex-1 flex-col px-6 py-6">
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

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="dark"
                    size="sm"
                    onClick={() => navigate(ROUTES.interviewManage)}
                    className="rounded-2xl shadow-md"
                  >
                    면접 리스트로 이동
                  </Button>
                </div>
              </div>
            </HubCard>
          </div>
        </section>

        {/* ✅ 캘린더 (고정 레이아웃) */}
        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">캘린더</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">면접 일정만 모아봤어요.</p>
            </div>
          </div>

          <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black">{thisMonthLabel}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={goPrevMonth}>
                  ◀
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={goNextMonth}>
                  ▶
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={goToday}>
                  오늘
                </Button>
              </div>
            </div>

            {interviewQuery.isLoading ? (
              <CalendarSkeleton />
            ) : interviewQuery.isError ? (
              <ErrorBox
                message={interviewQuery.errorMessage ?? '면접 일정을 불러오지 못했어요.'}
                onRetry={interviewQuery.refetch}
              />
            ) : (
              <div className="grid grid-cols-[1fr_380px] gap-8">
                {/* LEFT: 달력 */}
                <div>
                  <div className="grid grid-cols-7 gap-3 text-center text-sm font-bold text-zinc-500">
                    {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-3">
                    {cells.map((d, idx) => {
                      const ymd = toYmd(d);
                      const inThisMonth = d.getMonth() === month0;
                      const isToday = ymd === todayYmd;
                      const isSelected = ymd === selectedDate;

                      const ev = interviewEventMap.get(ymd) ?? [];
                      const cnt = ev.length;

                      return (
                        <Button
                          key={`${ymd}-${idx}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDate(ymd);
                            if (!inThisMonth)
                              setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                          }}
                          className={[
                            'flex w-full flex-col items-stretch justify-start text-left',
                            'min-h-[90px] cursor-pointer rounded-2xl border p-3 transition',
                            inThisMonth
                              ? 'border-zinc-200 bg-white'
                              : 'border-zinc-200/60 bg-zinc-50',
                            'hover:bg-zinc-100/60',
                            isSelected ? 'ring-midnight-ink ring-2' : '',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={
                                inThisMonth
                                  ? 'text-midnight-ink font-extrabold'
                                  : 'font-extrabold text-zinc-400'
                              }
                            >
                              {d.getDate()}
                            </span>
                            {isToday && (
                              <span className="bg-midnight-ink rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                                TODAY
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            {cnt > 0 ? (
                              <>
                                <span className="bg-point-blue mt-0.5 h-2 w-2 rounded-full" />
                                <span className="text-xs font-black text-zinc-600">{cnt}건</span>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-zinc-400"></span>
                            )}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT: 선택한 날짜 일정 */}
                <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black">선택한 날짜 일정</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-500">
                        {formatYmdToKorean(selectedDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-1">
                    {selectedEvents.length === 0 ? (
                      <p className="text-sm font-semibold text-zinc-500">
                        이 날짜에는 면접 일정이 없어요.
                      </p>
                    ) : (
                      selectedEvents.map((e) => (
                        <div
                          key={e.id}
                          className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
                        >
                          <p className="text-midnight-ink text-sm font-black">
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-black text-zinc-700">
                              {e.title}
                            </span>
                            <span className="ml-2">{e.candidateName}</span>
                          </p>
                          <p className="mt-2 text-xs font-semibold text-zinc-500">
                            {formatDateTime(e.scheduledAt)}
                          </p>

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
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================
 *  Shared UI
 * ========================= */

function HubCard({
  title,
  onHeaderClick,
  children,
}: {
  title: string;
  onHeaderClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onHeaderClick}
        className="flex w-full cursor-pointer items-center justify-between rounded-none border-x-0 border-t-0 border-b border-zinc-100 bg-transparent px-6 py-4 text-left text-base font-black hover:bg-zinc-50"
      >
        <p className="text-midnight-ink text-base font-black">{title}</p>
        <span className="text-zinc-300">›</span>
      </Button>

      {children}
    </div>
  );
}

/**
 * ✅ 공고 Row
 * - 마감임박 배지 지원
 */
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

/**
 * ✅ 면접 Row
 * - "몇 차 면접" 강조
 */
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
        if (e.key === 'Enter' || e.key === ' ') onRowClick();
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

/**
 * ✅ 캘린더 스켈레톤 (고정 레이아웃: 데스크탑 버전만)
 */
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
            className="min-h-[78px] animate-pulse rounded-2xl border border-zinc-200 bg-white/60 p-3"
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
