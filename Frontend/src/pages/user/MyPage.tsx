// src/pages/MyPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
  type NotificationItem,
  fetchMyInterviewViews,
  fetchMyUpcomingInterviewViews,
  fetchMyNotifications,
} from '../../api/myPage';
import { useAuthStore } from '../../store/authStore';

import { fetchMyScrapRowsForMe } from '../../api/myPage/scraps';
import type { ScrapRowApi } from '../../api/myPage/types';
import { fetchJobPostDetail } from '../../api/jobPost/detail';

const ROUTES = {
  resume: '/resumes/me',
  interviewList: '/interviews',
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

type ScrapView = {
  scrap_id: number;
  job_post_id: number | null;
  postingTitle: string;
  companyName: string;
  createdAt: string;
};

type ScrapModalItem = {
  key: string | number;
  title: string;
  subtitle: string; // companyName
  jobPostId: number | null;
  createdAtMs: number;
  onClick: () => void;
};

/** React Query ÎπÑÏä∑??ÎØ∏Îãà ??*/
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
      setErrorMessage(err instanceof Error ? err.message : '?????ÜÎäî ?§Î•òÍ∞Ä Î∞úÏÉù?àÏñ¥??');
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
      const title = detail.jobPost?.title || (jobPostId ? `Í≥µÍ≥† ${jobPostId}` : 'Í≥µÍ≥†');
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

export default function MyPage() {
  const navigate = useNavigate();

  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isScrapOpen, setIsScrapOpen] = useState(false);

  const interviewQuery = useQueryLike<InterviewSessionView[]>(() => fetchMyInterviewViews(), []);
  const upcomingQuery = useQueryLike<InterviewSessionView[]>(
    () => fetchMyUpcomingInterviewViews(2),
    [],
  );
  const scrapQuery = useQueryLike<ScrapView[]>(async () => {
    const rows = await fetchMyScrapRowsForMe();
    return toScrapViews(rows);
  }, []);
  const notiQuery = useQueryLike<NotificationItem[]>(() => fetchMyNotifications(), []);

  // ?åÎ¶º: ?úÎ≤Ñ ?êÎ≥∏????Í±¥ÎìúÎ¶¨Í≥† Î°úÏª¨?êÏÑú ?ΩÏùå/??†ú ?®ÏπòÎß??πÍ∏∞
  type NotiPatch = { read?: boolean; deleted?: boolean };
  const [notiPatchById, setNotiPatchById] = useState<Record<number, NotiPatch>>({});

  const notiItems = useMemo(() => {
    const base = notiQuery.data ?? [];
    return base
      .filter((n) => !notiPatchById[n.id]?.deleted)
      .map((n) => {
        const patch = notiPatchById[n.id];
        if (!patch || patch.read === undefined) return n;
        return { ...n, read: patch.read };
      });
  }, [notiQuery.data, notiPatchById]);

  const unreadCount = notiItems.filter((n) => !n.read).length;

  const handleNotiDelete = (id: number) => {
    setNotiPatchById((prev) => ({ ...prev, [id]: { ...prev[id], deleted: true } }));
  };

  const handleNotiClick = (n: NotificationItem) => {
    setNotiPatchById((prev) => ({ ...prev, [n.id]: { ...prev[n.id], read: true } }));

    const route = resolveNotificationRoute(n);
    if (route) {
      setIsNotiOpen(false);
      navigate(route);
    }
  };

  const hasNoti = notiItems.length > 0;
  const hasUnread = unreadCount > 0;

  const handleNotiReadAll = () => {
    if (!hasNoti || !hasUnread) return;

    setNotiPatchById((prev) => {
      const next = { ...prev };
      for (const n of notiItems) next[n.id] = { ...next[n.id], read: true };
      return next;
    });
  };

  const handleNotiDeleteAll = () => {
    if (!hasNoti) return;
    const ok = window.confirm('?åÎ¶º???ÑÎ? ??†ú?†Íπå??');
    if (!ok) return;

    setNotiPatchById((prev) => {
      const next = { ...prev };
      for (const n of notiItems) next[n.id] = { ...next[n.id], deleted: true };
      return next;
    });
  };

  // Date.now()Î•?render ?àÏóê??ÏßÅÏ†ë ??Î∂ÄÎ•¥Í≤å stateÎ°??§Í≥† ?àÏùå (purity/Î¶∞Ìä∏ Î∞©Ïñ¥)
  const [nowMs, setNowMs] = useState<number>(0);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Ï∫òÎ¶∞???ÅÌÉú
  const todayYmd = toYmd(new Date());

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => todayYmd);

  // ?¥Î≤§??Îß?(YYYY-MM-DD -> Interview[])
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

  // ?ÅÎã® Ïπ¥Îìú ?ÑÎ¶¨Î∑?
  const resumeLastEdited = '??;

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
    const rows: PreviewRow[] = (scrapQuery.data ?? []).slice(0, 3).map((s) => ({
      key: s.scrap_id,
      title: s.postingTitle,
      subtitle: s.companyName,
      meta: '',
    }));
    return padToFixedSlots(rows, 3);
  }, [scrapQuery.data]);

  // ?§ÌÅ¨??Î™®Îã¨ ?ÑÏù¥??
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
            alert('Í≥µÍ≥† IDÍ∞Ä ?ÜÏñ¥???ÅÏÑ∏ ?òÏù¥ÏßÄÎ°??¥Îèô?????ÜÏñ¥??');
            return;
          }
          setIsScrapOpen(false);
          navigate(`/job-posts/${jobPostId}`);
        },
      };
    });
  }, [scrapQuery.data, navigate]);

  // ?§ÌÅ¨??Î™®Îã¨: ?ïÎ†¨ + Í≤Ä??
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

  const userName = useAuthStore((state) => state.user?.name);
  const myPageTitle = userName ? `${userName}??My Page` : 'My Page';

  return (
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-28 pb-20">
      <div className="mx-auto w-[1280px] space-y-10 px-6">
        {/* ?§Îçî */}
        <header className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="relative p-10">
            <div className="absolute inset-0 bg-linear-to-r from-zinc-50 via-zinc-50/70 to-transparent" />
            <div className="relative flex flex-nowrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black tracking-[0.3em] text-zinc-400 uppercase">
                  PERSONAL DASHBOARD
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-normal">{myPageTitle}</h1>
                <p className="mt-2 text-sm font-semibold text-zinc-500">
                  ?¥Î†•??¬∑ Î©¥Ï†ë ¬∑ ?§ÌÅ¨?©ÏùÑ ??Í≥≥Ïóê??Í¥ÄÎ¶¨Ìï¥??
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
                  ?åÎ¶º{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </Button>

                <Button
                  variant="blue"
                  size="md"
                  className="rounded-2xl"
                  onClick={() => navigate(ROUTES.profileEdit)}
                >
                  ?åÏõê ?ïÎ≥¥ ?òÏ†ï
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Î∞îÎ°úÍ∞ÄÍ∏?*/}
        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">Î∞îÎ°úÍ∞ÄÍ∏?/h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                ?êÏ£º ?∞Îäî Í∏∞Îä•??Îπ†Î•¥Í≤??¥Îèô?¥Ïöî.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* ?¥Î†•??*/}
            <HubCard title="?¥Î†•?? onClick={() => navigate(ROUTES.resume)}>
              <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center px-6 py-10">
                <div className="bg-cloud-dancer text-midnight-ink grid h-14 w-14 place-items-center rounded-2xl transition group-hover:scale-[1.04]">
                  <IconUser />
                </div>

                <div className="mt-5 text-center">
                  <p className="text-midnight-ink text-lg font-black">ÏµúÍ∑º ?òÏ†ï</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-500">{resumeLastEdited}</p>
                </div>

                <div className="mt-6">
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700 opacity-0 transition group-hover:opacity-100">
                    ?ÅÏÑ∏ Î≥¥Í∏∞ <IconChevronRight />
                  </span>
                </div>
              </div>
            </HubCard>

            {/* Î©¥Ï†ë */}
            <HubCard title="Î©¥Ï†ë" onClick={() => navigate(ROUTES.interviewList)}>
              <div className="flex min-h-[280px] flex-1 flex-col px-6 py-6">
                <div className="flex-1">
                  {upcomingQuery.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <ListSkeleton />
                    </div>
                  ) : upcomingQuery.isError ? (
                    <div className="flex h-full items-center justify-center">
                      <InlineError
                        message={upcomingQuery.errorMessage ?? 'Î©¥Ï†ë ?ïÎ≥¥Î•?Î∂àÎü¨?§Ï? Î™ªÌñà?¥Ïöî.'}
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
                    ?ÑÏ≤¥ Î≥¥Í∏∞ <IconChevronRight />
                  </span>
                </div>
              </div>
            </HubCard>

            {/* ?§ÌÅ¨??*/}
            <HubCard
              title="?§ÌÅ¨?©Ìïú Í≥µÍ≥†"
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
                        message={scrapQuery.errorMessage ?? '?§ÌÅ¨?©ÏùÑ Î∂àÎü¨?§Ï? Î™ªÌñà?¥Ïöî.'}
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
                    ?ÑÏ≤¥ Î≥¥Í∏∞ <IconChevronRight />
                  </span>
                </div>
              </div>
            </HubCard>
          </div>
        </section>

        {/* Ï∫òÎ¶∞??*/}
        <section className="space-y-5">
          <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">Ï∫òÎ¶∞??/h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">Î©¥Ï†ë ?ºÏ†ï??Î™®ÏïÑÎ¥§Ïñ¥??</p>
            </div>
          </div>

          <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-8 shadow-sm">
            {interviewQuery.isLoading ? (
              <CalendarSkeleton />
            ) : interviewQuery.isError ? (
              <ErrorBox
                message={interviewQuery.errorMessage ?? 'Î©¥Ï†ë ?ºÏ†ï??Î∂àÎü¨?§Ï? Î™ªÌñà?¥Ïöî.'}
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
                  title="?†ÌÉù???†Ïßú ?ºÏ†ï"
                  subtitle={formatYmdToKorean(selectedDate)}
                  items={selectedInterviews}
                  emptyText="?¥Îãπ ?†Ïßú?êÎäî Î©¥Ï†ë ?ºÏ†ï???ÜÏñ¥??"
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

                    let btnText = '?ÖÏû•';
                    let helperText: string | null = null;
                    let disabled = false;

                    if (isPast) {
                      btnText = 'Ï¢ÖÎ£å';
                      disabled = true;
                    } else if (joinable) {
                      btnText = '?ÖÏû•';
                      helperText = 'ÏßÄÍ∏??ÖÏû• Í∞Ä?•Ìï¥??';
                    } else {
                      btnText = isToday ? '?ÄÍ∏? : '?àÏ†ï';
                      disabled = true;

                      const hint = formatScheduleHint(e.scheduledAt);
                      helperText = isToday ? `${hint} ¬∑ ?úÏûë 30Î∂??ÑÎ????ÖÏû• Í∞Ä?? : hint;
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

      {/* ?åÎ¶º Î™®Îã¨ */}
      <NotificationModal open={isNotiOpen} onClose={() => setIsNotiOpen(false)} title="?åÎ¶º">
        {notiQuery.isLoading ? (
          <div className="space-y-3 py-5">
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
          </div>
        ) : notiQuery.isError ? (
          <div className="rounded-xl border border-zinc-100 bg-white p-4 py-5">
            <p className="text-midnight-ink text-sm font-black">?åÎ¶º??Î∂àÎü¨?§Ï? Î™ªÌñà?¥Ïöî</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {notiQuery.errorMessage ?? '?†Ïãú ???§Ïãú ?úÎèÑ??Ï£ºÏÑ∏??'}
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="dark" size="sm" onClick={notiQuery.refetch}>
                ?§Ïãú ?úÎèÑ
              </Button>
            </div>
          </div>
        ) : (notiItems ?? []).length === 0 ? (
          <div className="bg-cloud-dancer/25 rounded-xl p-6 py-5 text-center">
            <p className="text-midnight-ink text-sm font-black">?åÎ¶º???ÜÏñ¥??</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">Ï°∞Ïö©?¥ÏÑú Ï¢ãÎã§??(ÏßÑÏã¨)</p>
          </div>
        ) : (
          <div className="space-y-4 py-5">
            {/* ?ÅÎã® ?°ÏÖò */}
            <div className="sticky top-0 z-10 -mx-6 border-b border-zinc-100 bg-white/95 px-6 pt-2 pb-4 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-500">
                  Ï¥?{notiItems.length}Í∞?¬∑ ÎØ∏ÏùΩ??{unreadCount}Í∞?
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={hasUnread ? 'dark' : 'outline'}
                    className="rounded-xl"
                    disabled={!hasUnread}
                    onClick={handleNotiReadAll}
                  >
                    ?ÑÏ≤¥ ?ΩÏùå
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={!hasNoti}
                    onClick={handleNotiDeleteAll}
                  >
                    ?ÑÏ≤¥ ??†ú
                  </Button>
                </div>
              </div>
            </div>

            {/* Î¶¨Ïä§??*/}
            <div className="space-y-3">
              {notiItems.map((n) => {
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
                            ?¥Î¶≠?òÎ©¥ Í¥Ä???òÏù¥ÏßÄÎ°??¥Îèô?¥Ïöî
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
          </div>
        )}
      </NotificationModal>

      {/* ?§ÌÅ¨??Î™®Îã¨ */}
      <NotificationModal
        open={isScrapOpen}
        onClose={() => setIsScrapOpen(false)}
        title="?§ÌÅ¨?©Ìïú Í≥µÍ≥†"
      >
        {scrapQuery.isLoading ? (
          <div className="space-y-3">
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
            <div className="bg-cloud-dancer/60 h-16 animate-pulse rounded-xl" />
          </div>
        ) : scrapQuery.isError ? (
          <div className="rounded-xl border border-zinc-100 bg-white p-4">
            <p className="text-midnight-ink text-sm font-black">?§ÌÅ¨?©ÏùÑ Î∂àÎü¨?§Ï? Î™ªÌñà?¥Ïöî</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {scrapQuery.errorMessage ?? '?†Ïãú ???§Ïãú ?úÎèÑ??Ï£ºÏÑ∏??'}
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="dark" size="sm" onClick={scrapQuery.refetch}>
                ?§Ïãú ?úÎèÑ
              </Button>
            </div>
          </div>
        ) : (scrapQuery.data ?? []).length === 0 ? (
          <div className="bg-cloud-dancer/25 rounded-xl p-6 text-center">
            <p className="text-midnight-ink text-sm font-black">?§ÌÅ¨?©Ìïú Í≥µÍ≥†Í∞Ä ?ÜÏñ¥??</p>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              ÎßàÏùå???úÎäî Í≥µÍ≥†Î•?Ï∞úÌï¥Î≥¥ÏÑ∏??
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            {/* ?ÅÎã® Î∞?(?ïÎ†¨/Í≤Ä?? */}
            <div className="sticky top-0 z-10 -mx-6 border-b border-zinc-100 bg-white/95 px-6 pt-2 pb-4 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-500">
                  Ï¥?{filteredSortedScraps.length}Í∞?¬∑ {companyCount}Í∞??åÏÇ¨
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={scrapSort === 'recent' ? 'dark' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setScrapSort('recent')}
                  >
                    ÏµúÍ∑º
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={scrapSort === 'company' ? 'dark' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setScrapSort('company')}
                  >
                    ?åÏÇ¨Î™?
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={scrapSort === 'title' ? 'dark' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setScrapSort('title')}
                  >
                    Í≥µÍ≥†Î™?
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                <input
                  value={scrapSearch}
                  onChange={(e) => setScrapSearch(e.target.value)}
                  placeholder="?åÏÇ¨/Í≥µÍ≥†Î™?Í≤Ä??
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 transition outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
                />
              </div>
            </div>

            {/* Î¶¨Ïä§??*/}
            {filteredSortedScraps.length === 0 ? (
              <div className="bg-cloud-dancer/25 rounded-2xl p-6 text-center">
                <p className="text-midnight-ink text-sm font-black">Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏñ¥??</p>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  ?§Î•∏ ?§Ïõå?úÎ°ú ?§Ïãú Ï∞æÏïÑÎ≥¥ÏÑ∏??
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
              <span className="text-zinc-300">¬∑</span>
              <p className="truncate text-xs font-semibold text-zinc-500">{meta}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptySlotRow() {
  return <div aria-hidden className="h-[56px] w-full rounded-2xl" />;
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
      <p className="text-midnight-ink text-sm font-black">Î∂àÎü¨?§Í∏∞ ?§Ìå®</p>
      <p className="mt-1 text-sm font-semibold text-zinc-500">{message}</p>
      <div className="mt-3 flex justify-end">
        <Button variant="dark" size="sm" onClick={onRetry}>
          ?§Ïãú ?úÎèÑ
        </Button>
      </div>
    </div>
  );
}

/* =========================
 *          Modal
 * ========================= */

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <p className="text-midnight-ink text-sm font-black">?∞Ïù¥?∞Î? Î∂àÎü¨?§Ï? Î™ªÌñà?¥Ïöî</p>
      <p className="mt-2 text-sm font-semibold text-zinc-500">{message}</p>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="dark" size="sm" onClick={onRetry}>
          ?§Ïãú ?úÎèÑ
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
      {/* ?§Î≤Ñ?àÏù¥ */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Î™®Îã¨ Ïπ¥Îìú */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-[92vw] max-w-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[80vh] flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-2xl">
          {/* ?§Îçî Í≥†Ï†ï */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <p className="text-midnight-ink text-lg font-black">{title}</p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-midnight-ink rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-black transition hover:bg-zinc-50"
            >
              ?´Í∏∞
            </Button>
          </div>

          {/* Î∞îÎîî ?§ÌÅ¨Î°?*/}
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
            <p className="mt-2 text-[11px] font-semibold text-zinc-400">
              ?ÅÏÑ∏ ?¥Îèô Î∂àÍ? (Í≥µÍ≥† ID ?ÜÏùå)
            </p>
          ) : null}
        </div>

        <div className="shrink-0 pt-1 text-zinc-300">
          <IconChevronRight />
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
      aria-hidden
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}


