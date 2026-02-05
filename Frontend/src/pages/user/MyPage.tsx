// src/pages/MyPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Building2, ChevronRight, User, CalendarDays, FileText, FileCheck } from 'lucide-react';

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

                    const joinable =
                      isToday &&
                      currentMs > 0 &&
                      currentMs >= startMs - JOIN_BEFORE_MIN * 60 * 1000 &&
                      currentMs <= startMs + JOIN_AFTER_HOURS * 60 * 60 * 1000;

                    const isPast =
                      currentMs > 0 && currentMs > startMs + JOIN_AFTER_HOURS * 60 * 60 * 1000;

                    let btnText = '입장';
                    let helperText: string | null = null;
                    let disabled = false;

                    if (isPast) {
                      btnText = '종료';
                      disabled = true;
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

      {/* 스크랩 모달 */}
      <NotificationModal
        open={isScrapOpen}
        onClose={() => setIsScrapOpen(false)}
        title="관심 공고"
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
              {scrapQuery.errorMessage ?? '잠시 후 다시 시도해주세요'}
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
              마음에 드는 공고를 찜해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            {/* 툴바 */}
            <div className="sticky top-0 z-10 -mx-6 border-b border-zinc-100 bg-white/95 px-6 pt-2 pb-4 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-500">
                  총 {filteredSortedScraps.length}개 · {companyCount}개 회사
                </p>

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
                    공고순
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

            {/* 리스트 */}
            {filteredSortedScraps.length === 0 ? (
              <div className="bg-cloud-dancer/25 rounded-2xl p-6 text-center">
                <p className="text-midnight-ink text-sm font-black">검색 결과가 없어요</p>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  다른 키워드로 다시 찾아보세요
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

      {/* 기업 스크랩 모달 */}
      <NotificationModal
        open={isCompanyScrapOpen}
        onClose={() => setIsCompanyScrapOpen(false)}
        title="관심 기업"
      >
        {companyScrapQuery.isLoading ? (
          <div className="space-y-3">
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
          </div>
        ) : companyScrapQuery.isError ? (
          <div className="rounded-xl border border-zinc-100 bg-white p-4">
            <p className="text-midnight-ink text-sm font-black">
              기업 스크랩을 불러오지 못했습니다.
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {companyScrapQuery.errorMessage ?? '잠시 후 다시 시도해주세요'}
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="dark" size="sm" onClick={companyScrapQuery.refetch}>
                다시 시도
              </Button>
            </div>
          </div>
        ) : (companyScrapQuery.data ?? []).length === 0 ? (
          <div className="bg-cloud-dancer/25 rounded-xl p-6 text-center">
            <p className="text-midnight-ink text-sm font-black">스크랩한 기업이 없어요</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">관심 있는 기업을 찜해보세요</p>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            {/* 툴바 */}
            <div className="sticky top-0 z-10 -mx-6 border-b border-zinc-100 bg-white/95 px-6 pt-2 pb-4 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-500">
                  총 {filteredSortedCompanyScraps.length}개
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={companyScrapSort === 'recent' ? 'dark' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setCompanyScrapSort('recent')}
                  >
                    최근
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={companyScrapSort === 'name' ? 'dark' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setCompanyScrapSort('name')}
                  >
                    이름순
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <input
                  value={companyScrapSearch}
                  onChange={(e) => setCompanyScrapSearch(e.target.value)}
                  placeholder="기업명 검색"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 transition outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
                />
              </div>
            </div>

            {/* 리스트 */}
            {filteredSortedCompanyScraps.length === 0 ? (
              <div className="bg-cloud-dancer/25 rounded-2xl p-6 text-center">
                <p className="text-midnight-ink text-sm font-black">검색 결과가 없어요</p>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  다른 키워드로 다시 찾아보세요
                </p>
              </div>
            ) : (
              <div className="space-y-2">
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
 * Manage Card Parts
 * ========================= */

function UnifiedHubCard({
  icon,
  title,
  subtitle,
  rightElement,
  onClick,
  className,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: ReactNode;
  onClick: () => void;
  className?: string;
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
        'group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-3xl border border-zinc-100 bg-white px-5 py-5 shadow-sm transition',
        'hover:ring-midnight-ink/20 hover:-translate-y-0.5 hover:shadow-md hover:ring-2',
        'focus:ring-midnight-ink/30 focus:ring-2 focus:outline-none',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-50 text-zinc-500 transition group-hover:scale-110 group-hover:bg-zinc-100">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-midnight-ink truncate text-sm font-black tracking-tight">{title}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs font-semibold text-zinc-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-zinc-300">
        {rightElement}
        <ChevronRight className="h-4 w-4 transition group-hover:text-zinc-500" />
      </div>
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
    <div className="fixed inset-0 z-[200] flex justify-center overflow-auto px-4 py-10">
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-[92vw] max-w-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[80vh] flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4">
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

          <div
            className={[
              'min-h-0 flex-1 overflow-auto px-6',
              '[overscroll-behavior:contain]',
              '[&::-webkit-scrollbar]:w-2',
              '[&::-webkit-scrollbar-track]:rounded-full',
              '[&::-webkit-scrollbar-track]:bg-cloud-dancer/60',
              '[&::-webkit-scrollbar-thumb]:rounded-full',
              '[&::-webkit-scrollbar-thumb]:bg-silver-mist/80',
              'hover:[&::-webkit-scrollbar-thumb]:bg-silver-mist',
              '[&::-webkit-scrollbar-thumb]:border-2',
              '[&::-webkit-scrollbar-thumb]:border-transparent',
              '[&::-webkit-scrollbar-thumb]:bg-clip-padding',
            ].join(' ')}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--color-silver-mist) var(--color-cloud-dancer)',
            }}
          >
            {children}
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
            <p className="mt-2 text-[11px] font-semibold text-zinc-400">
              상세 이동 불가 (공고 ID 없음)
            </p>
          ) : null}
        </div>
        <div className="shrink-0 pt-1 text-zinc-300">
          <ChevronRight className="h-4 w-4" />
        </div>
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
      className={[
        'w-full rounded-2xl border border-zinc-100 bg-white p-4 text-left shadow-sm transition',
        'hover:-translate-y-[1px] hover:shadow-md',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-midnight-ink line-clamp-2 text-sm font-black">{title}</p>
          {meta ? <p className="mt-2 text-xs font-semibold text-zinc-500">{meta}</p> : null}
        </div>
        <div className="shrink-0 pt-1 text-zinc-300">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}
