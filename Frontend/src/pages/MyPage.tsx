import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/Button/Button';

import {
  type InterviewSessionView,
  type ScrapView,
  type PortfolioReport,
  type NotificationItem,
  fetchMyInterviewViews,
  fetchMyUpcomingInterviewViews,
  fetchMyScrapViews,
  fetchMyPortfolioReport,
  fetchMyNotifications,
} from '../api/mockData';

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
  // 6주(42칸) 달력
  const first = new Date(year, monthIndex0, 1);
  const startDay = first.getDay(); // 0=일
  const start = new Date(year, monthIndex0, 1 - startDay);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
}

/**
 * ✅ React Query 느낌 “상태 UI” 미니 훅
 * - fetcher만 갈아끼우면 API 연동 시에도 그대로 사용 가능
 */
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

export default function MyPage() {
  const navigate = useNavigate();
  const [showNoti, setShowNoti] = useState(false);

  // ✅ 상태 UI: 각 데이터는 fetch* 로 받아옴 (MyPage에 더미 직접 안 둠)
  const interviewQuery = useQueryLike<InterviewSessionView[]>(() => fetchMyInterviewViews(), []);
  const upcomingQuery = useQueryLike<InterviewSessionView[]>(
    () => fetchMyUpcomingInterviewViews(2),
    [],
  );
  const scrapQuery = useQueryLike<ScrapView[]>(() => fetchMyScrapViews(), []);
  const portfolioQuery = useQueryLike<PortfolioReport>(() => fetchMyPortfolioReport(), []);
  const notiQuery = useQueryLike<NotificationItem[]>(() => fetchMyNotifications(), []);

  const unreadCount = (notiQuery.data ?? []).filter((n) => !n.read).length;

  // ==========================
  // ✅ 캘린더: "진짜 오늘" + "월 이동 가능"
  // ==========================
  const todayYmd = toYmd(new Date());

  // 현재 보고 있는 달 (해당 월 1일로 고정)
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = viewMonth.getFullYear();
  const month0 = viewMonth.getMonth();
  const thisMonthLabel = `${year}.${String(month0 + 1).padStart(2, '0')}`;
  const cells = useMemo(() => buildMonthCells(year, month0), [year, month0]);

  // 선택 날짜는 기본 "오늘"
  const [selectedDate, setSelectedDate] = useState<string>(() => todayYmd);

  // 월 이동
  const goPrevMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    setViewMonth(next);
    setSelectedDate(toYmd(next)); // 그 달 1일 선택
  };

  const goNextMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    setViewMonth(next);
    setSelectedDate(toYmd(next)); // 그 달 1일 선택
  };

  const goToday = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(toYmd(now));
  };

  // ✅ 월이 바뀌었는데 selectedDate가 다른 달이면 -> 해당 달 1일로 정리
  useEffect(() => {
    const sd = new Date(`${selectedDate}T00:00:00`);
    if (sd.getFullYear() !== year || sd.getMonth() !== month0) {
      setSelectedDate(toYmd(new Date(year, month0, 1)));
    }
  }, [year, month0, selectedDate]);

  // ==========================
  // ✅ 인터뷰 이벤트 맵 (캘린더 찍기용)
  // ==========================
  const interviewViews = interviewQuery.data ?? [];

  const interviewEventMap = useMemo(() => {
    const m = new Map<string, InterviewSessionView[]>();
    for (const iv of interviewViews) {
      const ymd = toYmdFromIso(iv.scheduledAt);
      const list = m.get(ymd) ?? [];
      list.push(iv);
      m.set(ymd, list);
    }
    // 같은 날짜 내 정렬
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

  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">My Page</h1>
        <p className="text-slate-gray mt-2">개인 대시보드</p>
      </header>

      <div className="mt-10 space-y-10">
        {/* 01. Quick Actions */}
        <section className="space-y-6">
          <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
            01. Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* 스크랩 */}
            <PreviewCard
              title="기업 스크랩 목록"
              subtitle={
                scrapQuery.isLoading
                  ? '불러오는 중...'
                  : scrapQuery.isError
                    ? '불러오기 실패'
                    : `총 ${(scrapQuery.data ?? []).length}개`
              }
              lines={
                scrapQuery.isLoading
                  ? ['• 스크랩 목록을 불러오고 있어요...']
                  : scrapQuery.isError
                    ? ['• 스크랩 목록을 불러오지 못했어요.']
                    : (scrapQuery.data ?? []).length > 0
                      ? (scrapQuery.data ?? [])
                          .slice(0, 2)
                          .map((s) => `• ${s.companyName} / ${s.postingTitle}`)
                      : ['• 스크랩한 공고가 없어요']
              }
              actionLabel={scrapQuery.isError ? '다시 시도' : '목록 보기'}
              onClick={() => (scrapQuery.isError ? scrapQuery.refetch() : navigate('/scraps'))}
            />

            {/* 면접 */}
            <PreviewCard
              title="면접 관련"
              subtitle={
                upcomingQuery.isLoading
                  ? '불러오는 중...'
                  : upcomingQuery.isError
                    ? '불러오기 실패'
                    : (upcomingQuery.data ?? []).length > 0
                      ? `다가오는 면접 ${(upcomingQuery.data ?? []).length}개`
                      : '다가오는 면접 없음'
              }
              lines={
                upcomingQuery.isLoading
                  ? ['• 면접 일정을 불러오고 있어요...']
                  : upcomingQuery.isError
                    ? ['• 면접 일정을 불러오지 못했어요.']
                    : (upcomingQuery.data ?? []).length > 0
                      ? (upcomingQuery.data ?? []).map(
                          (i) =>
                            `• ${i.companyName} - ${i.postingTitle} (${formatDateTime(i.scheduledAt)})`,
                        )
                      : ['• 면접 일정이 생기면 여기 표시돼요']
              }
              actionLabel={upcomingQuery.isError ? '다시 시도' : '면접 관리'}
              onClick={() =>
                upcomingQuery.isError ? upcomingQuery.refetch() : navigate('/interviews')
              }
            />

            {/* 포트폴리오 */}
            <PreviewCard
              title="포트폴리오 분석"
              subtitle={
                portfolioQuery.isLoading
                  ? '불러오는 중...'
                  : portfolioQuery.isError
                    ? '불러오기 실패'
                    : `최근 분석: ${formatDateTime(portfolioQuery.data!.analyzedAt)}`
              }
              lines={
                portfolioQuery.isLoading
                  ? ['• 리포트를 불러오고 있어요...']
                  : portfolioQuery.isError
                    ? ['• 리포트를 불러오지 못했어요.']
                    : [
                        `• 파일: ${portfolioQuery.data!.filename}`,
                        ...portfolioQuery.data!.highlights.slice(0, 2).map((h) => `• ${h}`),
                      ]
              }
              actionLabel={portfolioQuery.isError ? '다시 시도' : '리포트 보기'}
              onClick={() =>
                portfolioQuery.isError ? portfolioQuery.refetch() : navigate('/portfolio')
              }
            />

            {/* 이력서 */}
            <PreviewCard
              title="이력서 관리"
              subtitle="최근 수정: 2026.01.18 09:15"
              lines={['• Resume v1', '• 추천: 프로젝트 성과를 숫자로 써줘요']}
              actionLabel="편집하기"
              onClick={() => navigate('/resume')}
            />
          </div>
        </section>

        {/* 02. Notifications */}
        <section className="space-y-6">
          <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
            02. Notifications
          </h2>

          <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-midnight-ink text-xl font-extrabold">알림</p>
                <p className="text-slate-gray mt-1 text-sm">
                  {notiQuery.isLoading
                    ? '불러오는 중...'
                    : notiQuery.isError
                      ? '불러오기 실패'
                      : `읽지 않은 알림: ${unreadCount}개`}
                </p>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  if (notiQuery.isError) notiQuery.refetch();
                  else setShowNoti((v) => !v);
                }}
              >
                {notiQuery.isError ? '다시 시도' : showNoti ? '닫기' : '알림 보기'}
              </Button>
            </div>

            {showNoti && !notiQuery.isError && !notiQuery.isLoading && (
              <div className="mt-6 space-y-3">
                {(notiQuery.data ?? []).map((n) => (
                  <div key={n.id} className="bg-pure-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-midnight-ink text-sm font-semibold">{n.message}</p>
                      {!n.read && <span className="bg-midnight-ink mt-1 h-2 w-2 shrink-0 rounded-full" />}
                    </div>
                    <p className="text-slate-gray mt-2 text-xs">{formatDateTime(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}

            {showNoti && notiQuery.isLoading && (
              <div className="mt-6 space-y-3">
                <div className="bg-pure-white/60 h-16 animate-pulse rounded-2xl" />
                <div className="bg-pure-white/60 h-16 animate-pulse rounded-2xl" />
              </div>
            )}
          </div>
        </section>

        {/* 03. Calendar (면접만) */}
        <section className="space-y-6">
          <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
            03. Calendar
          </h2>

          <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-midnight-ink text-xl font-extrabold">캘린더</p>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={goPrevMonth}>
                  ◀
                </Button>

                <p className="text-slate-gray min-w-[88px] text-center text-lg font-bold">
                  {thisMonthLabel}
                </p>

                <Button type="button" variant="outline" size="sm" onClick={goNextMonth}>
                  ▶
                </Button>

                <Button type="button" variant="outline" size="sm" onClick={goToday}>
                  오늘
                </Button>
              </div>
            </div>

            {/* ✅ 상태 UI: 로딩/에러/정상 */}
            {interviewQuery.isLoading ? (
              <CalendarSkeleton />
            ) : interviewQuery.isError ? (
              <ErrorBox
                message={interviewQuery.errorMessage ?? '면접 일정을 불러오지 못했어요.'}
                onRetry={interviewQuery.refetch}
              />
            ) : (
              <>
                <div className="text-slate-gray grid grid-cols-7 gap-3 text-center text-sm font-bold">
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

                    return (
                      <button
                        key={`${ymd}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedDate(ymd);
                          if (!inThisMonth) setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                        }}
                        className={[
                          'min-h-[78px] rounded-2xl border p-3 text-left transition',
                          inThisMonth ? 'bg-pure-white border-soft-pebble' : 'bg-cloud-dancer border-soft-pebble/50',
                          'hover:bg-soft-pebble/30',
                          isSelected ? 'ring-midnight-ink ring-2' : '',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={
                              inThisMonth ? 'text-midnight-ink font-extrabold' : 'text-silver-mist font-extrabold'
                            }
                          >
                            {d.getDate()}
                          </span>

                          {isToday && (
                            <span className="bg-midnight-ink text-cloud-dancer rounded-full px-2 py-0.5 text-[10px] font-bold">
                              TODAY
                            </span>
                          )}
                        </div>

                        {/* 면접 일정 미리보기 */}
                        <div className="mt-2 space-y-1">
                          {ev.slice(0, 2).map((e) => (
                            <p key={e.interview_id} className="text-slate-gray truncate text-xs font-semibold">
                              • {e.companyName} {e.postingTitle}
                            </p>
                          ))}
                          {ev.length > 2 && (
                            <p className="text-slate-gray text-xs font-bold">+{ev.length - 2} more</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 선택한 날짜 일정(면접만) */}
                <div className="bg-pure-white mt-8 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-midnight-ink text-lg font-extrabold">선택한 날짜 일정</p>
                      <p className="text-slate-gray mt-1 text-sm font-bold">{formatYmdToKorean(selectedDate)}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {selectedInterviews.length === 0 ? (
                      <p className="text-slate-gray text-sm font-semibold">이 날짜에는 면접 일정이 없어요.</p>
                    ) : (
                      selectedInterviews.map((e) => {
                        const startMs = new Date(e.scheduledAt).getTime();
                        const nowMs = Date.now();

                        const JOIN_BEFORE_MIN = 30; // ✅ 30분 전부터 입장 가능
                        const JOIN_AFTER_HOURS = 2; // 시작 후 2시간까지 허용(원하면 0)

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
                        } else {
                          if (joinable) {
                            btnText = '입장';
                            disabled = false;
                            helperText = '입장 가능';
                          } else {
                            btnText = '대기';
                            disabled = true;
                            helperText =
                              minutesToStart > 0
                                ? `시작 ${minutesToStart}분 전 · 시작 30분 전부터 입장 가능`
                                : '곧 시작돼요.';
                          }
                        }

                        return (
                          <div key={e.interview_id} className="bg-cloud-dancer rounded-xl p-4">
                            <p className="text-midnight-ink text-sm font-extrabold">
                              {e.companyName} - {e.postingTitle}
                            </p>
                            <p className="text-slate-gray mt-1 text-xs">{formatDateTime(e.scheduledAt)}</p>

                            {helperText && <p className="text-slate-gray mt-2 text-xs font-semibold">{helperText}</p>}

                            <div className="mt-3 flex justify-end">
                              <Button
                                type="button"
                                variant={disabled ? 'outline' : 'dark'}
                                size="sm"
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
              </>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="dark" size="md" onClick={() => navigate('/profile/edit')}>
                회원 정보 수정
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------ 작은 컴포넌트들 ------------------ */

function PreviewCard({
  title,
  subtitle,
  lines,
  onClick,
  actionLabel,
}: {
  title: string;
  subtitle: string;
  lines: string[];
  onClick: () => void;
  actionLabel: string;
}) {
  return (
    <div className="bg-cloud-dancer space-y-6 rounded-2xl p-8 shadow-sm">
      <div>
        <p className="text-slate-gray text-sm font-bold tracking-widest uppercase">{title}</p>
        <p className="text-midnight-ink mt-2 text-xl font-black">{subtitle}</p>
      </div>

      <div className="space-y-1">
        {lines.map((t, i) => (
          <p key={i} className="text-slate-gray truncate text-sm font-semibold">
            {t}
          </p>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="md" onClick={onClick}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div>
      <div className="text-slate-gray grid grid-cols-7 gap-3 text-center text-sm font-bold">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-3">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="border-soft-pebble bg-pure-white/60 min-h-[78px] animate-pulse rounded-2xl border p-3"
          >
            <div className="bg-soft-pebble/60 h-4 w-8 rounded" />
            <div className="bg-soft-pebble/40 mt-3 h-3 w-20 rounded" />
            <div className="bg-soft-pebble/30 mt-2 h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-pure-white mt-8 rounded-2xl p-6 shadow-sm">
        <div className="bg-soft-pebble/40 h-5 w-40 animate-pulse rounded" />
        <div className="mt-4 space-y-2">
          <div className="bg-soft-pebble/20 h-16 animate-pulse rounded-xl" />
          <div className="bg-soft-pebble/20 h-16 animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-pure-white border-soft-pebble rounded-2xl border p-6 shadow-sm">
      <p className="text-midnight-ink text-sm font-extrabold">데이터를 불러오지 못했어요</p>
      <p className="text-slate-gray mt-2 text-sm font-semibold">{message}</p>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="dark" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    </div>
  );
}
