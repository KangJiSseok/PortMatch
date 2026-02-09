// src/pages/MyPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Building2, ChevronRight, User, CalendarDays, FileText, FileCheck, X } from 'lucide-react';

import Button from '../../components/Button/Button';

import CalendarSkeleton from '../../components/Calendar/CalendarSkeleton';
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
  fetchMyInterviewViews,
  fetchMyUpcomingInterviewViews,
} from '../../api/myPage';
import { useAuthStore } from '../../store/authStore';

import { fetchCompanyDetail } from '../../api/company/detail';
import { fetchMyCompanyScrapRowsForMe, fetchMyScrapRowsForMe } from '../../api/myPage/scraps';
import type { CompanyScrapRowApi, ScrapRowApi } from '../../api/myPage/types';
import { fetchJobPostDetail } from '../../api/jobPost/detail';

const ROUTES = {
  resume: '/resumes/me',
  interviewList: '/interviews',
  myApplications: '/applications/me',
  profileEdit: '/profile/edit',
} as const;

type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  refetch: () => void;
};

type ScrapView = {
  scrap_id: number;
  job_post_id: number | null;
  postingTitle: string;
  companyName: string;
  createdAt: string;
};

type CompanyScrapView = {
  scrap_id: number;
  company_id: string;
  companyName: string;
  createdAt: string;
};

type ScrapModalItem = {
  key: string | number;
  title: string;
  subtitle: string;
  jobPostId: number | null;
  createdAtMs: number;
  onClick: () => void;
};

type CompanyScrapModalItem = {
  key: string | number;
  title: string;
  companyId: string;
  createdAtMs: number;
  onClick: () => void;
};

/** React Query 비슷한 미니 훅 */
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
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요');
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

function normalizeText(s: string) {
  return s.trim().toLowerCase();
}

async function toScrapViews(rows: ScrapRowApi[]): Promise<ScrapView[]> {
  const normalized = rows.map((row) => {
    const pid = typeof row.pid === 'string' ? Number(row.pid) : row.pid;
    const jobPostId = typeof pid === 'number' && Number.isFinite(pid) ? pid : null;
    return { row, jobPostId };
  });

  const results = await Promise.all(
    normalized.map(async ({ row, jobPostId }) => {
      if (!jobPostId) return null;
      const detail = await fetchJobPostDetail(jobPostId);
      if (!detail) return null;
      return { row, jobPostId, detail };
    }),
  );

  return results
    .filter((it): it is NonNullable<typeof it> => Boolean(it))
    .map(({ row, jobPostId, detail }) => {
      const title = detail.jobPost?.title || (jobPostId ? `공고 ${jobPostId}` : '공고');
      const company = detail.company?.companies_name || '-';

      return {
        scrap_id: row.id,
        job_post_id: jobPostId,
        postingTitle: title,
        companyName: company,
        createdAt: row.createdAt,
      };
    });
}

async function toCompanyScrapViews(rows: CompanyScrapRowApi[]): Promise<CompanyScrapView[]> {
  const normalized = rows.map((row) => {
    const companyId = row.cid?.toString().trim();
    return { row, companyId };
  });

  const results = await Promise.all(
    normalized.map(async ({ row, companyId }) => {
      if (!companyId) return null;
      const detail = await fetchCompanyDetail(companyId).catch(() => null);
      return { row, companyId, detail };
    }),
  );

  return results
    .filter((it): it is NonNullable<typeof it> => Boolean(it))
    .map(({ row, companyId, detail }) => {
      const name = detail?.corpName || companyId;

      return {
        scrap_id: row.id,
        company_id: companyId,
        companyName: name,
        createdAt: row.createdAt,
      };
    });
}

export default function MyPage() {
  const navigate = useNavigate();

  const [isScrapOpen, setIsScrapOpen] = useState(false);
  const [isCompanyScrapOpen, setIsCompanyScrapOpen] = useState(false);

  const interviewQuery = useQueryLike<InterviewSessionView[]>(() => fetchMyInterviewViews(), []);

  // 바로가기용: 1개만 가져와도 됨
  const upcomingQuery = useQueryLike<InterviewSessionView[]>(
    () => fetchMyUpcomingInterviewViews(2),
    [],
  );

  const scrapQuery = useQueryLike<ScrapView[]>(async () => {
    const rows = await fetchMyScrapRowsForMe();
    return toScrapViews(rows);
  }, []);
  const companyScrapQuery = useQueryLike<CompanyScrapView[]>(async () => {
    const rows = await fetchMyCompanyScrapRowsForMe();
    return toCompanyScrapViews(rows);
  }, []);

  // Date.now()
  const [nowMs, setNowMs] = useState<number>(0);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  // 캘린더 상태
  const todayYmd = toYmd(new Date());

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => todayYmd);

  // 이벤트 맵
  const interviewViews = interviewQuery.data ?? [];
  const calendarViews = interviewViews.filter((v) =>
    !((v.interviewStatus ?? "").toUpperCase().includes("CANCELED")),
  );
  const interviewEventMap = useMemo(() => {
    const m = new Map<string, InterviewSessionView[]>();
    for (const iv of calendarViews) {
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
  }, [calendarViews]);

  const selectedInterviews = useMemo(
    () => interviewEventMap.get(selectedDate) ?? [],
    [interviewEventMap, selectedDate],
  );

  // 상단 카드 미리보기: 면접은 '가장 빠른 1개'만 보여주기
  const nextInterview = (upcomingQuery.data ?? [])[0];

  // 스크랩 모달 아이템
  const scrapAllItems = useMemo<ScrapModalItem[]>(() => {
    const list = scrapQuery.data ?? [];
    return list.map((s) => {
      const jobPostId = s.job_post_id;
      const createdAtMs = Number.isFinite(new Date(s.createdAt).getTime())
        ? new Date(s.createdAt).getTime()
        : 0;

      return {
        key: s.scrap_id,
        title: s.postingTitle,
        subtitle: s.companyName,
        jobPostId,
        createdAtMs,
        onClick: () => {
          if (!jobPostId) {
            alert('공고 ID가 없어 상세 페이지로 이동할 수 없어요');
            return;
          }
          setIsScrapOpen(false);
          navigate(`/job-posts/${jobPostId}`);
        },
      };
    });
  }, [scrapQuery.data, navigate]);

  const companyScrapAllItems = useMemo<CompanyScrapModalItem[]>(() => {
    const list = companyScrapQuery.data ?? [];
    return list.map((s) => {
      const createdAtMs = Number.isFinite(new Date(s.createdAt).getTime())
        ? new Date(s.createdAt).getTime()
        : 0;

      return {
        key: s.scrap_id,
        title: s.companyName,
        companyId: s.company_id,
        createdAtMs,
        onClick: () => {
          setIsCompanyScrapOpen(false);
          navigate(`/companies/${s.company_id}`);
        },
      };
    });
  }, [companyScrapQuery.data, navigate]);

  // 스크랩 정렬
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
      if (scrapSort === 'recent') return b.createdAtMs - a.createdAtMs;

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

  // 기업 스크랩 정렬
  const [companyScrapSort, setCompanyScrapSort] = useState<'recent' | 'name'>('name');
  const [companyScrapSearch, setCompanyScrapSearch] = useState('');

  const filteredSortedCompanyScraps = useMemo(() => {
    const q = normalizeText(companyScrapSearch);

    const filtered = q
      ? companyScrapAllItems.filter((it) => normalizeText(it.title).includes(q))
      : companyScrapAllItems;

    const sorted = [...filtered].sort((a, b) => {
      if (companyScrapSort === 'recent') return b.createdAtMs - a.createdAtMs;
      return a.title.localeCompare(b.title, 'ko');
    });

    return sorted;
  }, [companyScrapAllItems, companyScrapSearch, companyScrapSort]);

  const userName = useAuthStore((state) => state.user?.name);

  const scrapCountText = scrapQuery.isLoading ? '-' : String((scrapQuery.data ?? []).length);
  const companyScrapCountText = companyScrapQuery.isLoading
    ? '-'
    : String((companyScrapQuery.data ?? []).length);

  // 면접 카드 텍스트 로직
  const interviewCardContent = useMemo(() => {
    if (upcomingQuery.isLoading) return { title: '로딩 중...', subtitle: '' };
    if (upcomingQuery.isError) return { title: '불러오기 실패', subtitle: '' };
    if (!nextInterview) return { title: '예정된 면접 없음', subtitle: '' };

    return {
      title: nextInterview.postingTitle,
      subtitle: `${nextInterview.companyName} · ${formatDateTime(nextInterview.scheduledAt)}`,
    };
  }, [upcomingQuery, nextInterview]);

  return (
    // ✅ [Outer] min-w-[1280px] 로 고정: 창이 줄어도 1280px 이하로 찌그러지지 않고 스크롤 발생
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-24 pb-32">
      {/* ✅ [Inner] w-[1024px] 로 고정: 내부 콘텐츠는 항상 1024px 너비 유지 (가운데 정렬) */}
      <div className="mx-auto w-[1280px] space-y-16 px-6">
        {/* 헤더: 원티드 스타일 (point-blue 적용) */}
        <header className="mb-12 flex items-end justify-between px-2 pt-5">
          <div>
            <p className="text-point-blue mb-1 text-xs font-bold tracking-widest uppercase">
              Career Growth
            </p>
            <h1 className="text-midnight-ink text-4xl font-black tracking-tight">
              {/* ✅ 더 화려한 그라데이션: 시작(밝은 블루) -> 중간(포인트 블루) -> 끝(보라) */}
              <span className="bg-gradient-to-r from-blue-400 via-point-blue to-purple-500 bg-clip-text text-transparent">
                {userName ?? 'Guest'}
              </span>
              님,
              <br />
              오늘도 합격으로 가볼까요? 🚀
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              className="hover:border-point-blue/50 hover:bg-point-blue/5 hover:text-point-blue flex h-12 items-center gap-2 rounded-full border border-zinc-200 px-6 text-base font-bold text-zinc-600 transition"
              onClick={() => navigate(ROUTES.profileEdit)}
            >
              <User className="h-5 w-5" />
              <span>프로필 수정</span>
            </Button>
          </div>
        </header>

        {/* 바로가기 섹션 */}
        <section className="space-y-6">
          {/* 카드 그리드 - 고정 높이 240px로 정갈하게 유지 */}
          <div className="grid h-[240px] grid-cols-4 grid-rows-2 gap-5">
            
            {/* 1. 내 이력서 - 신뢰감 있는 차콜 톤 */}
            <div 
              className="group relative col-span-1 row-span-2 flex cursor-pointer flex-col items-center justify-center gap-5 rounded-[32px] border border-zinc-100 bg-white p-6 transition-all duration-300 hover:border-zinc-200 hover:shadow-xl hover:-translate-y-1.5"
              onClick={() => navigate(ROUTES.resume)}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-zinc-100 transition-colors group-hover:bg-zinc-200/70">
                <FileText className="h-10 w-10 text-zinc-700 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-midnight-ink">내 이력서</p>
                <p className="mt-1.5 text-sm font-bold text-zinc-500">지금 바로 관리하기</p>
              </div>
              <ChevronRight className="absolute bottom-7 right-7 h-5 w-5 text-zinc-300 transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-zinc-500" />
            </div>

            {/* 2. 내 지원 목록 - 생동감 있는 에메랄드 톤 */}
            <div 
              className="group relative col-span-1 row-span-2 flex cursor-pointer flex-col items-center justify-center gap-5 rounded-[32px] border border-zinc-100 bg-white p-6 transition-all duration-300 hover:border-zinc-200 hover:shadow-xl hover:-translate-y-1.5"
              onClick={() => navigate(ROUTES.myApplications)}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-emerald-50 transition-colors group-hover:bg-emerald-100/80">
                <FileCheck className="h-10 w-10 text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-midnight-ink">내 지원 목록</p>
                <p className="mt-1.5 text-sm font-bold text-zinc-500">지원한 공고 확인</p>
              </div>
              <ChevronRight className="absolute bottom-7 right-7 h-5 w-5 text-zinc-300 transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-emerald-500" />
            </div>

            {/* 3. 면접 일정 - 스마트한 블루 톤 */}
            <div 
              className="group relative col-span-1 row-span-2 flex cursor-pointer flex-col items-center justify-center gap-5 rounded-[32px] border border-zinc-100 bg-white p-6 transition-all duration-300 hover:border-zinc-200 hover:shadow-xl hover:-translate-y-1.5"
              onClick={() => navigate(ROUTES.interviewList)}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-blue-50 transition-colors group-hover:bg-blue-100/80">
                <CalendarDays className="h-10 w-10 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-midnight-ink">{interviewCardContent.title}</p>
                <p className="mt-1.5 text-sm font-bold text-zinc-500">{interviewCardContent.subtitle || "예정된 면접이 없습니다"}</p>
              </div>
              <ChevronRight className="absolute bottom-7 right-7 h-5 w-5 text-zinc-300 transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-blue-500" />
            </div>

            {/* 4. 관심 회사 - 부드러운 로즈 톤 */}
            <div 
              className="group flex col-span-1 row-span-1 cursor-pointer items-center justify-between rounded-[28px] border border-zinc-100 bg-white px-8 transition-all duration-300 hover:border-zinc-200 hover:shadow-lg"
              onClick={() => {
                if (companyScrapQuery.isError) companyScrapQuery.refetch();
                setIsCompanyScrapOpen(true);
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 transition-colors group-hover:bg-rose-100/70">
                  <Building2 className="h-6 w-6 text-rose-400" />
                </div>
                <p className="text-lg font-bold text-midnight-ink">관심 회사</p>
              </div>
              <p className="tabular-nums text-3xl font-black text-midnight-ink transition-transform group-hover:scale-110">{companyScrapCountText}</p>
            </div>

            {/* 5. 관심 공고 - 세련된 바이올렛 톤 */}
            <div 
              className="group flex col-span-1 row-span-1 cursor-pointer items-center justify-between rounded-[28px] border border-zinc-100 bg-white px-8 transition-all duration-300 hover:border-zinc-200 hover:shadow-lg"
              onClick={() => {
                if (scrapQuery.isError) scrapQuery.refetch();
                setIsScrapOpen(true);
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 transition-colors group-hover:bg-violet-100/70">
                  <Bookmark className="h-6 w-6 text-violet-400" />
                </div>
                <p className="text-lg font-bold text-midnight-ink">관심 공고</p>
              </div>
              <p className="tabular-nums text-3xl font-black text-midnight-ink transition-transform group-hover:scale-110">{scrapCountText}</p>
            </div>

          </div>
        </section>

        {/* 캘린더 섹션 */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-1 pb-2">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-800">캘린더</h2>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 p-8 shadow-sm">
            {interviewQuery.isLoading ? (
              <CalendarSkeleton />
            ) : interviewQuery.isError ? (
              <ErrorBox
                message={interviewQuery.errorMessage ?? '면접 일정을 불러오지 못했어요.'}
                onRetry={interviewQuery.refetch}
              />
            ) : (
              <div className="grid grid-cols-[1fr_360px] gap-10">
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
                  emptyText="해당 날짜에는 면접 일정이 없어요"
                  renderItem={(e) => {
                    const startMs = new Date(e.scheduledAt).getTime();
                    const currentMs = nowMs;

                    const JOIN_BEFORE_MIN = 30;
                    const JOIN_AFTER_HOURS = 2;

                    const isToday = toYmdFromIso(e.scheduledAt) === todayYmd;
                    const isDone = e.status === 'DONE';

                    const joinable =
                      !isDone &&
                      isToday &&
                      currentMs > 0 &&
                      currentMs >= startMs - JOIN_BEFORE_MIN * 60 * 1000 &&
                      currentMs <= startMs + JOIN_AFTER_HOURS * 60 * 60 * 1000;

                    let btnText = '입장';
                    let helperText: string | null = null;
                    let disabled = false;

                    if (isDone) {
                      btnText = '종료';
                      disabled = true;
                      helperText = '면접이 종료되었습니다.';
                    } else if (joinable) {
                      btnText = '입장';
                      helperText = '지금 입장 가능해요';
                    } else {
                      btnText = isToday ? '대기' : '예정';
                      disabled = true;

                      const hint = formatScheduleHint(e.scheduledAt);
                      helperText = isToday ? `${hint} · 시작 30분 전부터 입장 가능` : hint;
                    }

                    return (
                      <div
                        key={e.interview_id}
                        className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
                      >
                        {/* 텍스트 영역: flex-col과 gap-1로 모든 줄 간격을 동일하게(4px) 설정 */}
                        <div className="flex flex-col gap-1">
                          {/* 회사명 */}
                          <p className="text-sm font-bold text-zinc-600">
                            {e.companyName}
                            <span
                              className={[
                                'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black',
                                isDone ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-50 text-emerald-600',
                              ].join(' ')}
                            >
                              {isDone ? '종료' : '예정'}
                            </span>
                          </p>

                          {/* 공고 제목 (2줄 말줄임) */}
                          <p className="text-m font-black leading-tight text-midnight-ink line-clamp-2">
                            {e.postingTitle}
                          </p>

                          {/* 날짜 */}
                          <p className="text-xs font-semibold text-zinc-400">
                            {formatDateTime(e.scheduledAt)}
                          </p>
                        </div>

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

      {/* 관심 공고 모달 */}
      <NotificationModal
        open={isScrapOpen}
        onClose={() => setIsScrapOpen(false)}
        title="관심 공고"
      >
        {scrapQuery.isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : scrapQuery.isError ? (
          <ErrorBox
            message={scrapQuery.errorMessage ?? '스크랩을 불러오지 못했어요'}
            onRetry={scrapQuery.refetch}
          />
        ) : (scrapQuery.data ?? []).length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base font-bold text-zinc-900">스크랩한 공고가 없어요</p>
            <p className="mt-1 text-sm font-medium text-zinc-500">마음에 드는 공고를 찜해보세요</p>
          </div>
        ) : (
          <div className="space-y-2 pb-10">
            {/* Sticky Toolbar */}
            <div className="sticky top-0 z-10 -mx-8 bg-white/80 px-8 pb-4 pt-2 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-zinc-400">
                  총 <span className="font-bold text-zinc-900">{filteredSortedScraps.length}</span>개 · {companyCount}개 회사
                </p>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'recent', label: '최근' },
                    { id: 'company', label: '회사순' },
                    { id: 'title', label: '공고순' },
                  ].map((sort) => (
                    <Button
                      key={sort.id}
                      size="sm"
                      variant={scrapSort === sort.id ? 'dark' : 'outline'}
                      className="h-8 rounded-lg px-3 text-xs font-bold transition-all"
                      onClick={() => setScrapSort(sort.id as any)}
                    >
                      {sort.label}
                    </Button>
                  ))}
                </div>
              </div>
              <input
                value={scrapSearch}
                onChange={(e) => setScrapSearch(e.target.value)}
                placeholder="회사/공고명 검색"
                className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm font-bold text-zinc-700 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-200 focus:bg-white focus:ring-4 focus:ring-zinc-100/50"
              />
            </div>

            {/* List Content */}
            {filteredSortedScraps.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-base font-bold text-zinc-900">검색 결과가 없어요</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
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

      <NotificationModal
        open={isCompanyScrapOpen}
        onClose={() => setIsCompanyScrapOpen(false)}
        title="관심 기업"
      >
        {companyScrapQuery.isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : (companyScrapQuery.data ?? []).length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base font-bold text-zinc-900">스크랩한 기업이 없어요</p>
            <p className="mt-1 text-sm font-medium text-zinc-500">관심 있는 기업을 찜해보세요</p>
          </div>
        ) : (
          <div className="space-y-2 pb-10">
            {/* Sticky Toolbar */}
            <div className="sticky top-0 z-10 -mx-8 bg-white/80 px-8 pb-4 pt-2 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-zinc-400">
                  총 <span className="font-bold text-zinc-900">{filteredSortedCompanyScraps.length}</span>개
                </p>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'recent', label: '최근' },
                    { id: 'name', label: '이름순' },
                  ].map((sort) => (
                    <Button
                      key={sort.id}
                      size="sm"
                      variant={companyScrapSort === sort.id ? 'dark' : 'outline'}
                      className="h-8 rounded-lg px-3 text-xs font-bold transition-all"
                      onClick={() => setCompanyScrapSort(sort.id as any)}
                    >
                      {sort.label}
                    </Button>
                  ))}
                </div>
              </div>
              <input
                value={companyScrapSearch}
                onChange={(e) => setCompanyScrapSearch(e.target.value)}
                placeholder="기업명 검색"
                className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm font-bold text-zinc-700 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-200 focus:bg-white focus:ring-4 focus:ring-zinc-100/50"
              />
            </div>

            {/* List Content */}
            {filteredSortedCompanyScraps.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-base font-bold text-zinc-900">검색 결과가 없어요</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {filteredSortedCompanyScraps.map((it) => (
                  <CompanyScrapListRow
                    key={String(it.key)}
                    title={it.title}
                    meta={formatYmdToKorean(toYmd(new Date(it.createdAtMs)))}
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
 * Modal
 * ========================= */

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
    
    // 스크롤 락 로직 (기존 로직 유지)
    document.addEventListener('keydown', onKeyDown);
    const scrollY = window.scrollY;
    document.body.style.cssText = `
      position: fixed; 
      top: -${scrollY}px; 
      left: 0; 
      right: 0; 
      width: 100%;
      overflow-y: hidden;
    `;

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const scrollY = document.body.style.top;
      document.body.style.cssText = '';
      window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* 백드롭: 블러 강도를 살짝 낮춰 배경과 조화롭게 설정 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* 모달 본체: 너비를 500px로 제한하여 집중도 향상 */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[500px] transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[80vh] flex-col overflow-hidden rounded-[28px] border border-zinc-100 bg-white shadow-2xl">
          
          {/* 헤더: 타이틀 폰트 두께 조절 및 X 아이콘 배치 */}
          <div className="flex items-center justify-between px-8 py-6">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="group rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="닫기"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>

          {/* 콘텐츠 영역: 기존의 커스텀 스크롤바 유지 */}
          <div
            className={[
              'flex-1 overflow-y-auto px-8 pb-8',
              '[&::-webkit-scrollbar]:w-1.5',
              '[&::-webkit-scrollbar-track]:bg-transparent',
              '[&::-webkit-scrollbar-thumb]:rounded-full',
              '[&::-webkit-scrollbar-thumb]:bg-zinc-200',
              'hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300',
            ].join(' ')}
          >
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={`
        group w-full text-left transition-all duration-200
        py-4 px-2 rounded-xl flex items-center justify-between gap-4
        ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-zinc-50 active:bg-zinc-100'}
      `}
    >
      <div className="min-w-0 flex-1">
        {/* 제목: 폰트 두께를 세련되게 조정 */}
        <p className="text-zinc-900 line-clamp-1 text-[15px] font-bold group-hover:text-black">
          {title}
        </p>
        
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-500">{company}</span>
          {disabled && (
            <span className="text-[11px] font-medium text-red-400 bg-red-50 px-1.5 py-0.5 rounded">
              이동 불가
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors">
        <ChevronRight size={18} strokeWidth={2.5} />
      </div>
    </button>
  );
}

function CompanyScrapListRow({
  title,
  meta,
  onClick,
}: {
  title: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left transition-all duration-200 py-4 px-2 rounded-xl flex items-center justify-between gap-4 hover:bg-zinc-50 active:bg-zinc-100"
    >
      <div className="min-w-0 flex-1">
        <p className="text-zinc-900 line-clamp-1 text-[15px] font-bold group-hover:text-black">
          {title}
        </p>
        {meta && (
          <p className="mt-1 text-sm font-medium text-zinc-500">
            {meta}
          </p>
        )}
      </div>

      <div className="shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors">
        <ChevronRight size={18} strokeWidth={2.5} />
      </div>
    </button>
  );
}
