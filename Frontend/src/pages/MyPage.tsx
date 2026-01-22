// src/pages/MyPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/Button/Button';

import {
  type InterviewSessionView,
  type ScrapView,
  type NotificationItem,
  fetchMyInterviewViews,
  fetchMyUpcomingInterviewViews,
  fetchMyScrapViews,
  fetchMyNotifications,
} from '../api/mockData';

const ROUTES = {
  resume: '/resumes/me',
  interviewList: '/interviews',
  scrapList: '/scraps',
  profileEdit: '/profile/edit',
} as const;

type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  refetch: () => void;
};

function toYmdFromIso(iso: string) {
  return iso.slice(0, 10);
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

/**
 * ✅ ScrapView에서 공고 id 꺼내기
 * - 프로젝트마다 필드명이 다를 수 있어서 후보들을 다 검사
 * - id를 못 찾으면 null
 */
function getJobPostIdFromScrap(s: ScrapView): number | null {
  const any = s as unknown as Partial<{
    id: number | string;
    jobPostId: number | string;
    job_post_id: number | string;
    postingId: number | string;
    posting_id: number | string;
    jobPostingId: number | string;
    job_posting_id: number | string;
    jobPost_id: number | string;
  }>;

  const raw =
    any.jobPostId ??
    any.job_post_id ??
    any.jobPost_id ??
    any.postingId ??
    any.posting_id ??
    any.jobPostingId ??
    any.job_posting_id ??
    any.id;

  const n = typeof raw === 'string' ? Number(raw) : raw;

  if (typeof n === 'number' && Number.isFinite(n)) return n;
  return null;
}

export default function MyPage() {
  const navigate = useNavigate();

  // ✅ 알림 모달
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // ✅ 스크랩 모달
  const [isScrapOpen, setIsScrapOpen] = useState(false);

  // ✅ 데이터
  const interviewQuery = useQueryLike<InterviewSessionView[]>(() => fetchMyInterviewViews(), []);
  const upcomingQuery = useQueryLike<InterviewSessionView[]>(
    () => fetchMyUpcomingInterviewViews(2),
    [],
  );
  const scrapQuery = useQueryLike<ScrapView[]>(() => fetchMyScrapViews(), []);
  const notiQuery = useQueryLike<NotificationItem[]>(() => fetchMyNotifications(), []);

  const unreadCount = (notiQuery.data ?? []).filter((n) => !n.read).length;

  // ==========================
  // ✅ 캘린더
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

  // ✅ 인터뷰 이벤트 맵
  const interviewViews = interviewQuery.data ?? [];
  const interviewEventMap = useMemo(() => {
    const m = new Map<string, InterviewSessionView[]>();
    for (const iv of interviewViews) {
      const ymd = toYmdFromIso(iv.scheduledAt);
      const list = m.get(ymd) ?? [];
      list.push(iv);
      m.set(ymd, list);
    }
    for (const [k, list] of m.entries()) {
      list.sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1));
      m.set(k, list);
    }
    return m;
  }, [interviewViews]);

  const selectedInterviews = useMemo(
    () => interviewEventMap.get(selectedDate) ?? [],
    [interviewEventMap, selectedDate],
  );

  // ==========================
  // ✅ 관리 카드(3개)
  // ==========================
  const upcomingCount = (upcomingQuery.data ?? []).length;
  const scrapCount = (scrapQuery.data ?? []).length;

  // 이력서 최신 수정(일단 고정)
  const resumeLastEdited = '2026.01.18 09:15';

  // 면접/스크랩: 카드 내부 리스트
  const interviewItems = (upcomingQuery.data ?? []).slice(0, 3).map((i) => ({
    key: i.interview_id,
    title: i.postingTitle,
    subtitle: i.companyName,
    meta: formatDateTime(i.scheduledAt),
    onClick: () => navigate(ROUTES.interviewList),
  }));

  // ✅ 스크랩 카드의 3개 미리보기는 "상세로 이동" (가능하면)
  //    id 못 찾으면 모달 열기
  const scrapItems = (scrapQuery.data ?? []).slice(0, 3).map((s, idx) => {
    const jobPostId = getJobPostIdFromScrap(s);
    return {
      key: (s as unknown as { id?: number | string }).id ?? `${s.companyName}-${idx}`,
      title: s.postingTitle,
      subtitle: s.companyName,
      meta: '',
      onClick: () => {
        if (jobPostId) navigate(`/job-posts/${jobPostId}`);
        else setIsScrapOpen(true);
      },
    };
  });

  // ✅ 스크랩 모달에서 전체 목록 클릭 이동용
  const scrapAllItems = useMemo(() => {
    const list = scrapQuery.data ?? [];
    return list.map((s, idx) => {
      const jobPostId = getJobPostIdFromScrap(s);
      return {
        key:
          (s as unknown as { id?: number | string }).id ??
          `${s.companyName}-${s.postingTitle}-${idx}`,
        title: s.postingTitle,
        subtitle: s.companyName,
        jobPostId,
        onClick: () => {
          if (!jobPostId) {
            alert('공고 id가 없어서 상세 페이지로 이동할 수 없어요. (mockData 필드 확인 필요)');
            return;
          }
          setIsScrapOpen(false);
          navigate(`/job-posts/${jobPostId}`);
        },
      };
    });
  }, [scrapQuery.data, navigate]);

  // ✅ MyPage 컴포넌트 안, return 위쪽에 추가
  const monthEventDays = useMemo(() => {
    const days: Array<{ ymd: string; events: InterviewSessionView[] }> = [];
    const seen = new Set<string>();

    for (const d of cells) {
      const ymd = toYmd(d);
      if (seen.has(ymd)) continue;
      seen.add(ymd);

      const inThisMonth = d.getMonth() === month0;
      if (!inThisMonth) continue;

      const ev = interviewEventMap.get(ymd) ?? [];
      if (ev.length > 0) days.push({ ymd, events: ev });
    }

    days.sort((a, b) => a.ymd.localeCompare(b.ymd));
    return days;
  }, [cells, interviewEventMap, month0]);

  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-28 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        {/* ✅ 헤더 */}
        <header className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="relative p-8 md:p-10">
            <div className="absolute inset-0 bg-linear-to-r from-zinc-50 via-zinc-50/70 to-transparent" />
            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black tracking-[0.3em] text-zinc-400 uppercase">
                  PERSONAL DASHBOARD
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tighter">My Page</h1>
                <p className="mt-2 text-sm font-semibold text-zinc-500">
                  이력서 · 면접 · 스크랩을 한 곳에서 관리해요.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-pure-white rounded-2xl"
                  onClick={() => {
                    if (notiQuery.isError) notiQuery.refetch();
                    setIsNotiOpen(true);
                  }}
                >
                  알림 {unreadCount > 0 ? `(${unreadCount})` : ''}
                </Button>

                <Button
                  variant="blue"
                  size="md"
                  className="rounded-2xl"
                  onClick={() => navigate(ROUTES.profileEdit)}
                >
                  회원 정보 수정
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ 관리 바로가기 (3개) */}
        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">관리 바로가기</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                자주 쓰는 기능은 여기서 바로 이동해요.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* 이력서 */}
            <HubCard title="이력서" onHeaderClick={() => navigate(ROUTES.resume)}>
              <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center px-6 py-10">
                <div className="bg-cloud-dancer text-midnight-ink grid h-14 w-14 place-items-center rounded-2xl">
                  <IconUser />
                </div>

                <div className="mt-5 text-center">
                  <p className="text-midnight-ink text-lg font-black">최근 수정</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-500">{resumeLastEdited}</p>
                </div>
              </div>
            </HubCard>

            {/* 면접 */}
            <HubCard title="면접" onHeaderClick={() => navigate(ROUTES.interviewList)}>
              <div className="flex min-h-[280px] flex-1 flex-col px-6 py-6">
                <div className="flex-1">
                  {upcomingQuery.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <ListSkeleton />
                    </div>
                  ) : upcomingQuery.isError ? (
                    <div className="flex h-full items-center justify-center">
                      <InlineError
                        message={upcomingQuery.errorMessage ?? '면접 정보를 불러오지 못했어요.'}
                        onRetry={upcomingQuery.refetch}
                      />
                    </div>
                  ) : upcomingCount === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <EmptyHint text="예정된 면접이 없어요." />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {interviewItems.map((it) => (
                        <ListRow
                          key={String(it.key)}
                          thumb={<InitialThumb text={it.subtitle} />}
                          title={it.title}
                          subtitle={it.subtitle}
                          meta={it.meta}
                          onClick={it.onClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </HubCard>

            {/* ✅ 스크랩: 헤더 클릭은 모달 전체 보기 */}
            <HubCard
              title="스크랩한 공고"
              onHeaderClick={() => {
                if (scrapQuery.isError) scrapQuery.refetch();
                setIsScrapOpen(true);
              }}
            >
              <div className="flex min-h-[280px] flex-1 flex-col px-6 py-6">
                <div className="flex-1">
                  {scrapQuery.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <ListSkeleton />
                    </div>
                  ) : scrapQuery.isError ? (
                    <div className="flex h-full items-center justify-center">
                      <InlineError
                        message={scrapQuery.errorMessage ?? '스크랩을 불러오지 못했어요.'}
                        onRetry={scrapQuery.refetch}
                      />
                    </div>
                  ) : scrapCount === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <EmptyHint text="스크랩한 공고가 없어요." />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scrapItems.map((it) => (
                        <ListRow
                          key={String(it.key)}
                          thumb={<InitialThumb text={it.subtitle} />}
                          title={it.title}
                          subtitle={it.subtitle}
                          meta={it.meta}
                          onClick={it.onClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </HubCard>
          </div>
        </section>

        {/* ✅ 캘린더 */}
        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">캘린더</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">면접 일정만 모아봤어요.</p>
            </div>
          </div>

          <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black">{thisMonthLabel}</p>
              </div>

              {/* ✅ sm → md */}
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="md" onClick={goPrevMonth}>
                  ◀
                </Button>
                <Button type="button" variant="outline" size="md" onClick={goNextMonth}>
                  ▶
                </Button>
                <Button type="button" variant="outline" size="md" onClick={goToday}>
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
              <>
                {/* ✅ Mobile: 리스트형 캘린더 */}
                <div className="sm:hidden">
                  <div className="space-y-3">
                    {monthEventDays.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-100 bg-white p-6 text-center">
                        <p className="text-sm font-semibold text-zinc-500">
                          이번 달에는 면접 일정이 없어요.
                        </p>
                      </div>
                    ) : (
                      monthEventDays.map(({ ymd, events }) => (
                        <Button
                          key={ymd}
                          type="button"
                          variant="outline"
                          size="md"
                          onClick={() => setSelectedDate(ymd)}
                          className={[
                            'w-full rounded-2xl border p-4 text-left',
                            ymd === selectedDate ? 'ring-midnight-ink ring-2' : '',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black">{formatYmdToKorean(ymd)}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {events.slice(0, 2).map((e) => (
                                  <span
                                    key={e.interview_id}
                                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700"
                                  >
                                    {formatDateTime(e.scheduledAt).slice(-5)} · {e.companyName}
                                  </span>
                                ))}
                                {events.length > 2 ? (
                                  <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-[11px] font-bold text-zinc-500">
                                    +{events.length - 2}건
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <span className="bg-point-blue/10 text-point-blue shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black">
                              {events.length}건
                            </span>
                          </div>
                        </Button>
                      ))
                    )}

                    {/* ✅ 선택한 날짜 상세 */}
                    <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
                      <p className="text-base font-black">선택한 날짜</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-500">
                        {formatYmdToKorean(selectedDate)}
                      </p>

                      <div className="mt-4 space-y-2">
                        {selectedInterviews.length === 0 ? (
                          <p className="text-sm font-semibold text-zinc-500">
                            이 날짜에는 면접 일정이 없어요.
                          </p>
                        ) : (
                          selectedInterviews.map((e) => {
                            const startMs = new Date(e.scheduledAt).getTime();
                            const nowMs = Date.now();

                            const JOIN_BEFORE_MIN = 30;
                            const JOIN_AFTER_HOURS = 2;

                            const isToday = toYmdFromIso(e.scheduledAt) === todayYmd;
                            const joinable =
                              isToday &&
                              nowMs >= startMs - JOIN_BEFORE_MIN * 60 * 1000 &&
                              nowMs <= startMs + JOIN_AFTER_HOURS * 60 * 60 * 1000;

                            const isPast = nowMs > startMs + JOIN_AFTER_HOURS * 60 * 60 * 1000;
                            const minutesToStart = Math.ceil((startMs - nowMs) / (60 * 1000));

                            let btnText = '입장';
                            let helperText: string | null = null;
                            let disabled = false;

                            if (isPast) {
                              btnText = '종료';
                              disabled = true;
                            } else if (!isToday) {
                              btnText = '예정';
                              disabled = true;
                            } else if (joinable) {
                              btnText = '입장';
                              helperText = '입장 가능';
                            } else {
                              btnText = '대기';
                              disabled = true;
                              helperText =
                                minutesToStart > 0
                                  ? `시작 ${minutesToStart}분 전 · 시작 30분 전부터 입장 가능`
                                  : '곧 시작돼요.';
                            }

                            return (
                              <div
                                key={e.interview_id}
                                className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
                              >
                                <p className="text-midnight-ink text-sm font-black">
                                  {e.companyName} - {e.postingTitle}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-zinc-500">
                                  {formatDateTime(e.scheduledAt)}
                                </p>

                                {helperText && (
                                  <p className="mt-2 text-xs font-semibold text-zinc-500">
                                    {helperText}
                                  </p>
                                )}

                                <div className="mt-3 flex justify-end">
                                  <Button
                                    type="button"
                                    variant={disabled ? 'outline' : 'dark'}
                                    size="md"
                                    disabled={disabled}
                                    className={disabled ? 'cursor-not-allowed opacity-50' : ''}
                                    onClick={() => {
                                      if (disabled) return;
                                      navigate(`/interviews/${e.interview_id}/lobby`);
                                    }}
                                  >
                                    {btnText}
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ Desktop: 달력 LEFT + 선택 일정 RIGHT */}
                <div className="hidden sm:block">
                  <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
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
                              size="md"
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

                              {/* ✅ 동그라미 1개 + 건수 */}
                              <div className="mt-3 flex items-center justify-between">
                                {cnt > 0 ? (
                                  <>
                                    <span className="bg-point-blue mt-0.5 h-2 w-2 rounded-full" />
                                    <span className="text-xs font-black text-zinc-600">
                                      {cnt}건
                                    </span>
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
                        {selectedInterviews.length === 0 ? (
                          <p className="text-sm font-semibold text-zinc-500">
                            이 날짜에는 면접 일정이 없어요.
                          </p>
                        ) : (
                          selectedInterviews.map((e) => {
                            const startMs = new Date(e.scheduledAt).getTime();
                            const nowMs = Date.now();

                            const JOIN_BEFORE_MIN = 30;
                            const JOIN_AFTER_HOURS = 2;

                            const isToday = toYmdFromIso(e.scheduledAt) === todayYmd;
                            const joinable =
                              isToday &&
                              nowMs >= startMs - JOIN_BEFORE_MIN * 60 * 1000 &&
                              nowMs <= startMs + JOIN_AFTER_HOURS * 60 * 60 * 1000;

                            const isPast = nowMs > startMs + JOIN_AFTER_HOURS * 60 * 60 * 1000;
                            const minutesToStart = Math.ceil((startMs - nowMs) / (60 * 1000));

                            let btnText = '입장';
                            let helperText: string | null = null;
                            let disabled = false;

                            if (isPast) {
                              btnText = '종료';
                              disabled = true;
                            } else if (!isToday) {
                              btnText = '예정';
                              disabled = true;
                            } else if (joinable) {
                              btnText = '입장';
                              helperText = '입장 가능';
                            } else {
                              btnText = '대기';
                              disabled = true;
                              helperText =
                                minutesToStart > 0
                                  ? `시작 ${minutesToStart}분 전 · 시작 30분 전부터 입장 가능`
                                  : '곧 시작돼요.';
                            }

                            return (
                              <div
                                key={e.interview_id}
                                className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
                              >
                                <p className="text-midnight-ink text-sm font-black">
                                  {e.companyName} - {e.postingTitle}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-zinc-500">
                                  {formatDateTime(e.scheduledAt)}
                                </p>

                                {helperText && (
                                  <p className="mt-2 text-xs font-semibold text-zinc-500">
                                    {helperText}
                                  </p>
                                )}

                                <div className="mt-3 flex justify-end">
                                  <Button
                                    type="button"
                                    variant={disabled ? 'outline' : 'dark'}
                                    size="md"
                                    disabled={disabled}
                                    className={disabled ? 'cursor-not-allowed opacity-50' : ''}
                                    onClick={() => {
                                      if (disabled) return;
                                      navigate(`/interviews/${e.interview_id}/lobby`);
                                    }}
                                  >
                                    {btnText}
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ✅ 알림 모달 */}
      <NotificationModal open={isNotiOpen} onClose={() => setIsNotiOpen(false)} title="알림">
        {notiQuery.isLoading ? (
          <div className="space-y-3">
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
          </div>
        ) : notiQuery.isError ? (
          <div className="rounded-xl border border-zinc-100 bg-white p-4">
            <p className="text-midnight-ink text-sm font-black">알림을 불러오지 못했어요</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {notiQuery.errorMessage ?? '잠시 후 다시 시도해 주세요.'}
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="dark" size="sm" onClick={notiQuery.refetch}>
                다시 시도
              </Button>
            </div>
          </div>
        ) : (notiQuery.data ?? []).length === 0 ? (
          <div className="bg-cloud-dancer/25 rounded-xl p-6 text-center">
            <p className="text-midnight-ink text-sm font-black">알림이 없어요</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">조용해서 좋다… 💤</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(notiQuery.data ?? []).map((n) => (
              <div key={n.id} className="rounded-xl border border-zinc-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-midnight-ink text-sm font-semibold">{n.message}</p>
                  {!n.read && <span className="bg-point-blue mt-1 h-2 w-2 shrink-0 rounded-full" />}
                </div>
                <p className="mt-2 text-xs font-semibold text-zinc-500">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </NotificationModal>

      {/* ✅ 스크랩 전체 모달 */}
      <NotificationModal
        open={isScrapOpen}
        onClose={() => setIsScrapOpen(false)}
        title="스크랩한 공고"
      >
        {scrapQuery.isLoading ? (
          <div className="space-y-3">
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
          </div>
        ) : scrapQuery.isError ? (
          <div className="rounded-xl border border-zinc-100 bg-white p-4">
            <p className="text-midnight-ink text-sm font-black">스크랩을 불러오지 못했어요</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {scrapQuery.errorMessage ?? '잠시 후 다시 시도해 주세요.'}
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="dark" size="sm" onClick={scrapQuery.refetch}>
                다시 시도
              </Button>
            </div>
          </div>
        ) : (scrapQuery.data ?? []).length === 0 ? (
          <div className="bg-cloud-dancer/25 rounded-xl p-6 text-center">
            <p className="text-midnight-ink text-sm font-black">스크랩한 공고가 없어요</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              마음에 드는 공고를 찜해보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <p className="text-xs font-semibold text-zinc-500">총 {scrapAllItems.length}개</p>
            </div>

            <div className="space-y-2">
              {scrapAllItems.map((it) => (
                <ListRow
                  key={String(it.key)}
                  thumb={<InitialThumb text={it.subtitle} />}
                  title={it.title}
                  subtitle={it.subtitle}
                  meta={it.jobPostId ? '' : '상세 이동 불가'}
                  onClick={it.onClick}
                />
              ))}
            </div>
          </div>
        )}
      </NotificationModal>
    </div>
  );
}

/* =========================
 *  Manage Card Parts
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
        className="flex w-full items-center justify-between rounded-none border-x-0 border-t-0 border-b border-zinc-100 bg-transparent px-6 py-4 text-left text-base font-black hover:bg-zinc-50"
      >
        <p className="text-midnight-ink text-base font-black">{title}</p>
        <span className="text-zinc-300">›</span>
      </Button>

      {children}
    </div>
  );
}

function ListRow({
  thumb,
  title,
  subtitle,
  meta,
  onClick,
}: {
  thumb: ReactNode;
  title: string;
  subtitle: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="group flex w-full items-center justify-start gap-4 rounded-2xl border-0 bg-transparent p-3 text-left transition hover:bg-zinc-50"
    >
      <div className="shrink-0">{thumb}</div>

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

      <span className="shrink-0 text-zinc-200 transition-colors group-hover:text-zinc-400">›</span>
    </Button>
  );
}

function InitialThumb({ text }: { text: string }) {
  const letter = (text?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <div className="bg-cloud-dancer text-midnight-ink grid h-18 w-28 place-items-center overflow-hidden rounded-2xl">
      <span className="text-lg font-black">{letter}</span>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl p-3">
          <div className="bg-cloud-dancer/60 h-18 w-28 animate-pulse rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200/60" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200/40" />
          </div>
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

/* =========================
 *  Calendar + Modal
 * ========================= */

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

function NotificationModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="close modal"
        onClick={onClose}
        className="bg-midnight-ink/40 absolute inset-0 h-full w-full rounded-none border-0 p-0 backdrop-blur-[2px]"
      >
        <span className="sr-only">close</span>
      </Button>

      <div className="absolute top-1/2 left-1/2 w-[92vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <div>
              <p className="text-midnight-ink text-lg font-black">{title}</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                필요한 것만 빠르게 확인하세요.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-midnight-ink rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-black transition hover:bg-zinc-50"
            >
              닫기
            </Button>
          </div>

          <div className="max-h-[70vh] overflow-auto px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* =========================
 *  Icons
 * ========================= */

function IconUser() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
