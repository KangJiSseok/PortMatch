// src/pages/MyPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button/Button';

import CalendarPanel from '../../components/Calendar/CalendarPanel';
import CalendarScheduleList from '../../components/Calendar/CalendarScheduleList';
import {
  formatDateTime,
  formatScheduleHint,
  formatYmdToKorean,
  toYmd,
  toYmdFromIso,
} from '../../components/Calendar/calendarUtils';

import {
  type InterviewSessionView,
  type ScrapView,
  type NotificationItem,
  fetchMyInterviewViews,
  fetchMyUpcomingInterviewViews,
  fetchMyScrapViews,
  fetchMyNotifications,
} from '../../api/myPage';

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

type PreviewRow = {
  key: string | number;
  title: string;
  subtitle: string;
  meta?: string;
};

type ScrapModalItem = {
  order: number; // ✅ 원본 순서(최근 느낌)
  key: string | number;
  title: string; // postingTitle
  subtitle: string; // companyName
  jobPostId: number | null;
  onClick: () => void;
};

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

function padToFixedSlots<T>(rows: T[], size: number): (T | null)[] {
  const out: (T | null)[] = rows.slice(0, size);
  while (out.length < size) out.push(null);
  return out;
}

function resolveNotificationRoute(n: NotificationItem): string | null {
  const any = n as unknown as Partial<{
    route: string;
    path: string;
    href: string;
    url: string;
    jobPostId: number | string;
    postingId: number | string;
    job_post_id: number | string;
    interviewId: number | string;
    interview_id: number | string;
    type: string;
    targetId: number | string;
  }>;

  const direct =
    any.route ?? any.path ?? (typeof any.href === 'string' ? any.href : undefined) ?? any.url;

  if (typeof direct === 'string' && direct.startsWith('/')) return direct;

  const jobIdRaw =
    any.jobPostId ??
    any.postingId ??
    any.job_post_id ??
    (any.type === 'JOB_POST' ? any.targetId : undefined);
  const jobId = typeof jobIdRaw === 'string' ? Number(jobIdRaw) : jobIdRaw;
  if (typeof jobId === 'number' && Number.isFinite(jobId)) return `/job-posts/${jobId}`;

  const ivRaw =
    any.interviewId ?? any.interview_id ?? (any.type === 'INTERVIEW' ? any.targetId : undefined);
  const ivId = typeof ivRaw === 'string' ? Number(ivRaw) : ivRaw;
  if (typeof ivId === 'number' && Number.isFinite(ivId)) return `/interviews/${ivId}/lobby`;

  return null;
}

function normalizeText(s: string) {
  return s.trim().toLowerCase();
}

export default function MyPage() {
  const navigate = useNavigate();

  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isScrapOpen, setIsScrapOpen] = useState(false);

  const interviewQuery = useQueryLike<InterviewSessionView[]>(() => fetchMyInterviewViews(), []);
  const upcomingQuery = useQueryLike<InterviewSessionView[]>(
    () => fetchMyUpcomingInterviewViews(2),
    [],
  );
  const scrapQuery = useQueryLike<ScrapView[]>(() => fetchMyScrapViews(), []);
  const notiQuery = useQueryLike<NotificationItem[]>(() => fetchMyNotifications(), []);

  // ✅ 알림 삭제/읽음 로컬 처리
  const [notiItems, setNotiItems] = useState<NotificationItem[]>([]);
  useEffect(() => {
    if (notiQuery.data) setNotiItems(notiQuery.data);
  }, [notiQuery.data]);

  const unreadCount = (notiItems ?? []).filter((n) => !n.read).length;

  const handleNotiDelete = (id: number) => {
    setNotiItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleNotiClick = (n: NotificationItem) => {
    setNotiItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));

    const route = resolveNotificationRoute(n);
    if (route) {
      setIsNotiOpen(false);
      navigate(route);
    }
  };

  // ==========================
  // ✅ 캘린더 상태 (컴포넌트로 분리)
  // ==========================
  const todayYmd = toYmd(new Date());

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => todayYmd);

  // ✅ 인터뷰 이벤트 맵(YYYY-MM-DD -> Interview[])
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
  // ✅ 관리 카드(3개) - “고정 3슬롯 + 빈칸은 빈칸”
  // ==========================
  const resumeLastEdited = '2026.01.18 09:15';

  const interviewPreviewSlots = useMemo(() => {
    const rows: PreviewRow[] = (upcomingQuery.data ?? []).slice(0, 3).map((i) => ({
      key: i.interview_id,
      title: i.postingTitle,
      subtitle: i.companyName,
      meta: formatDateTime(i.scheduledAt),
    }));
    return padToFixedSlots(rows, 3);
  }, [upcomingQuery.data]);

  const scrapPreviewSlots = useMemo(() => {
    const rows: PreviewRow[] = (scrapQuery.data ?? []).slice(0, 3).map((s, idx) => ({
      key: (s as unknown as { id?: number | string }).id ?? `${s.companyName}-${idx}`,
      title: s.postingTitle,
      subtitle: s.companyName,
      meta: '',
    }));
    return padToFixedSlots(rows, 3);
  }, [scrapQuery.data]);

  // ✅ 스크랩 모달: 원본 아이템 + 클릭 이동
  const scrapAllItems = useMemo<ScrapModalItem[]>(() => {
    const list = scrapQuery.data ?? [];
    return list.map((s, idx) => {
      const jobPostId = getJobPostIdFromScrap(s);
      return {
        order: idx, // ✅ 원본(최근 느낌) 정렬용
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

  // ==========================
  // ✅ 스크랩 모달: 검색 + 정렬
  // ==========================
  const [scrapSort, setScrapSort] = useState<'recent' | 'company' | 'title'>('company');
  const [scrapSearch, setScrapSearch] = useState('');

  const filteredSortedScraps = useMemo(() => {
    const q = normalizeText(scrapSearch);
    const filtered = q
      ? scrapAllItems.filter((it) => {
          const a = normalizeText(it.title);
          const b = normalizeText(it.subtitle);
          return a.includes(q) || b.includes(q);
        })
      : scrapAllItems;

    const sorted = [...filtered].sort((a, b) => {
      if (scrapSort === 'recent') return a.order - b.order;

      if (scrapSort === 'title') {
        const t = a.title.localeCompare(b.title, 'ko');
        if (t !== 0) return t;
        return a.subtitle.localeCompare(b.subtitle, 'ko');
      }

      // company
      const c = a.subtitle.localeCompare(b.subtitle, 'ko');
      if (c !== 0) return c;
      return a.title.localeCompare(b.title, 'ko');
    });

    return sorted;
  }, [scrapAllItems, scrapSearch, scrapSort]);

  const companyCount = useMemo(() => {
    const set = new Set(filteredSortedScraps.map((x) => x.subtitle));
    return set.size;
  }, [filteredSortedScraps]);

  return (
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-28 pb-20">
      <div className="mx-auto w-[1280px] space-y-10 px-6">
        {/* ✅ 헤더 */}
        <header className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="relative p-10">
            <div className="absolute inset-0 bg-linear-to-r from-zinc-50 via-zinc-50/70 to-transparent" />
            <div className="relative flex flex-nowrap items-start justify-between gap-5">
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

        {/* ✅ 관리 바로가기 */}
        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">관리 바로가기</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                자주 쓰는 기능은 여기서 바로 이동해요.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* ✅ 이력서 (카드 전체 클릭) */}
            <HubCard title="이력서" onClick={() => navigate(ROUTES.resume)}>
              <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center px-6 py-10">
                <div className="bg-cloud-dancer text-midnight-ink grid h-14 w-14 place-items-center rounded-2xl transition group-hover:scale-[1.04]">
                  <IconUser />
                </div>

                <div className="mt-5 text-center">
                  <p className="text-midnight-ink text-lg font-black">최근 수정</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-500">{resumeLastEdited}</p>
                </div>

                <div className="mt-6">
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700 opacity-0 transition group-hover:opacity-100">
                    자세히 보기 <span className="text-zinc-400">›</span>
                  </span>
                </div>
              </div>
            </HubCard>

            {/* ✅ 면접 (카드 전체 클릭) */}
            <HubCard title="면접" onClick={() => navigate(ROUTES.interviewList)}>
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
                  ) : (
                    <div className="space-y-3">
                      {interviewPreviewSlots.map((it, idx) =>
                        it ? (
                          <ListRowStatic
                            key={String(it.key)}
                            title={it.title}
                            subtitle={it.subtitle}
                            meta={it.meta}
                          />
                        ) : (
                          <EmptySlotRow key={`iv-empty-${idx}`} />
                        ),
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700 opacity-0 transition group-hover:opacity-100">
                    전체 보기 <span className="text-zinc-400">›</span>
                  </span>
                </div>
              </div>
            </HubCard>

            {/* ✅ 스크랩한 공고 (카드 전체 클릭 → 모달 오픈) */}
            <HubCard
              title="스크랩한 공고"
              onClick={() => {
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
                  ) : (
                    <div className="space-y-3">
                      {scrapPreviewSlots.map((it, idx) =>
                        it ? (
                          <ListRowStatic
                            key={String(it.key)}
                            title={it.title}
                            subtitle={it.subtitle}
                            meta={it.meta}
                          />
                        ) : (
                          <EmptySlotRow key={`scrap-empty-${idx}`} />
                        ),
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700 opacity-0 transition group-hover:opacity-100">
                    전체 보기 <span className="text-zinc-400">›</span>
                  </span>
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

                <CalendarScheduleList<InterviewSessionView>
                  title="선택한 날짜 일정"
                  subtitle={formatYmdToKorean(selectedDate)}
                  items={selectedInterviews}
                  emptyText="이 날짜에는 면접 일정이 없어요."
                  renderItem={(e) => {
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

                    let btnText = '입장';
                    let helperText: string | null = null;
                    let disabled = false;

                    if (isPast) {
                      btnText = '종료';
                      disabled = true;
                    } else if (joinable) {
                      btnText = '입장';
                      helperText = '입장 가능';
                    } else {
                      btnText = isToday ? '대기' : '예정';
                      disabled = true;

                      const hint = formatScheduleHint(e.scheduledAt);
                      helperText = isToday ? `${hint} · 시작 30분 전부터 입장 가능` : hint;
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
                          <p className="mt-2 text-xs font-semibold text-zinc-500">{helperText}</p>
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
                  }}
                />
              </div>
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
        ) : (notiItems ?? []).length === 0 ? (
          <div className="bg-cloud-dancer/25 rounded-xl p-6 text-center">
            <p className="text-midnight-ink text-sm font-black">알림이 없어요</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">조용해서 좋다… 💤</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(notiItems ?? []).map((n) => {
              const route = resolveNotificationRoute(n);
              return (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotiClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleNotiClick(n);
                  }}
                  className="cursor-pointer rounded-xl border border-zinc-100 bg-white p-4 transition hover:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-midnight-ink text-sm font-semibold">{n.message}</p>
                      <p className="mt-2 text-xs font-semibold text-zinc-500">
                        {formatDateTime(n.createdAt)}
                      </p>
                      {route ? (
                        <p className="mt-1 text-[11px] font-semibold text-zinc-400">
                          클릭하면 관련 페이지로 이동
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <span className="bg-point-blue mt-1 h-2 w-2 shrink-0 rounded-full" />
                      )}
                      <Button
                        type="button"
                        variant="close"
                        size="sm"
                        aria-label="delete notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotiDelete(n.id);
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </NotificationModal>

      {/* ✅ 스크랩 전체 모달 (그룹핑 X / 정렬+검색 O) */}
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
          <div className="space-y-4">
            {/* ✅ 상단 툴바(정렬/검색) - 스크롤해도 위에 붙어있게 */}
            <div className="sticky top-0 z-10 -mx-6 border-b border-zinc-100 bg-white/95 px-6 pt-2 pb-4 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-500">
                    총 {filteredSortedScraps.length}개 · {companyCount}개 회사
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={scrapSort === 'recent' ? 'dark' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setScrapSort('recent')}
                  >
                    최근
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={scrapSort === 'company' ? 'dark' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setScrapSort('company')}
                  >
                    회사순
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={scrapSort === 'title' ? 'dark' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setScrapSort('title')}
                  >
                    공고명
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <input
                  value={scrapSearch}
                  onChange={(e) => setScrapSearch(e.target.value)}
                  placeholder="회사/공고명 검색"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 transition outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
                />
              </div>
            </div>

            {/* ✅ 리스트 */}
            {filteredSortedScraps.length === 0 ? (
              <div className="bg-cloud-dancer/25 rounded-2xl p-6 text-center">
                <p className="text-midnight-ink text-sm font-black">검색 결과가 없어요</p>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  다른 키워드로 다시 찾아보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSortedScraps.map((it) => (
                  <ScrapListRow
                    key={String(it.key)}
                    title={it.title}
                    company={it.subtitle}
                    disabled={!it.jobPostId}
                    onClick={it.onClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </NotificationModal>
    </div>
  );
}

/* =========================
 *  Manage Card Parts
 * ========================= */

/**
 * ✅ 1안: 카드 전체 클릭
 * - hover/focus가 확실하게 보이도록 강화
 * - 헤더 버튼 제거(중첩 클릭 지옥 방지)
 */
function HubCard({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
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
      </div>

      {children}
    </div>
  );
}

/** ✅ 미리보기(면접/스크랩 카드)는 클릭 이동 없음(카드가 클릭이니까) */
function ListRowStatic({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle: string;
  meta?: string;
}) {
  return (
    <div className="flex w-full items-center rounded-2xl bg-transparent p-3">
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
    </div>
  );
}

/** ✅ 빈 슬롯: 문구 없이 “빈칸 느낌”만 */
function EmptySlotRow() {
  return (
    <div
      aria-hidden
      className="h-[56px] w-full rounded-2xl border border-dashed border-zinc-200 bg-zinc-50"
    />
  );
}

function ListSkeleton() {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl p-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200/60" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200/40" />
          </div>
          <div className="ml-4 h-4 w-4 animate-pulse rounded bg-zinc-200/40" />
        </div>
      ))}
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

    const prev = {
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      htmlOverflow: document.documentElement.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
    };

    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.addEventListener('keydown', onKeyDown);

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    return () => {
      document.removeEventListener('keydown', onKeyDown);

      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.position = prev.bodyPosition;
      document.body.style.top = prev.bodyTop;
      document.body.style.left = prev.bodyLeft;
      document.body.style.right = prev.bodyRight;
      document.body.style.width = prev.bodyWidth;
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.body.style.paddingRight = prev.bodyPaddingRight;

      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* ✅ 오버레이: Button 쓰지 말고 div로 깔아버리기 (100% 딤 보장) */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* ✅ 모달 카드 */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-[92vw] max-w-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between  border-zinc-100 px-6 py-4">
            <p className="text-midnight-ink text-lg font-black">{title}</p>

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

          {/* ✅ 스크롤 영역 */}
          <div className="max-h-[70vh] overflow-auto [overscroll-behavior:contain] px-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
 *  Scrap Modal Row
 * ========================= */

function ScrapListRow({
  title,
  company,
  disabled,
  onClick,
}: {
  title: string;
  company: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      className={[
        'w-full rounded-2xl border border-zinc-100 bg-white p-4 text-left shadow-sm transition',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-[1px] hover:shadow-md',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-midnight-ink line-clamp-2 text-sm font-black">{title}</p>
          <p className="mt-2 text-xs font-semibold text-zinc-500">{company}</p>

          {disabled ? (
            <p className="mt-2 text-[11px] font-semibold text-zinc-400">상세 이동 불가</p>
          ) : null}
        </div>

        <div className="shrink-0 pt-1">
          <span className="text-zinc-300">›</span>
        </div>
      </div>
    </button>
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
