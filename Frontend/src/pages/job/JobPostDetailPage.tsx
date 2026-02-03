// src/pages/JobPostDetailPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Building2, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

import Button from '../../components/Button/Button';
import { fetchJobPostDetail } from '@/api/jobPost/detail';
import { fetchScrapCheck, toggleScrap } from '@/api/jobPost/scrap';
import { useAuthStore } from '@/store/authStore';

// --- Types ---
type PageStatus = 'loading' | 'error' | 'notfound' | 'success';
type ApiResult = Awaited<ReturnType<typeof fetchJobPostDetail>>;

interface ExtendedUserData {
  userId: number;
  email: string;
  name: string;
  role: string;
  cid?: string;
}

type JobPostExtraFields = {
  stackIds?: number[];
  career?: string | null;
  education?: string | null;
  employment_type?: string | null;
  work_location?: string | null;
  salary?: string | null;
  work_days?: string | null;
  work_hours?: string | null;
  active?: number;
  cid?: string;
};

interface ParsedDetailData {
  career?: string;
  education?: string;
  employment_type?: string;
  salary?: string;
  work_location?: string;
  work_days?: string;
  work_hours?: string;
  requirement_text?: string;
}

interface OtherJobPosting {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  detail: string;
  jobType: number;
  stackIds: number[];
}

interface StackInfo {
  stackId: number;
  stackName: string;
}

// --- Helper Functions ---
const underlineEffect =
  "relative after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-[2px] after:bg-point-blue after:transition-all after:duration-300 hover:after:w-full";

function formatYmdDot(ymd?: string | null) {
  if (!ymd) return '-';
  return ymd.replaceAll('-', '.');
}

function parseRequirementText(detailStr: string) {
  if (!detailStr) return '';
  try {
    if (detailStr.trim().startsWith('{')) {
      const parsed = JSON.parse(detailStr);
      return parsed.requirement_text || '';
    }
    return detailStr;
  } catch {
    return detailStr;
  }
}

function ensureHttps(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

function calculateDDay(deadline?: string | null, active?: number) {
  if (active === 0) return '마감';
  if (!deadline) return '상시채용';

  const end = new Date(`${deadline}T23:59:59`);
  if (isNaN(end.getTime())) return '상시채용';

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays)) return '상시채용';

  if (diffDays < 0) return '마감';
  if (diffDays === 0) return 'D-DAY';
  return `D-${diffDays}`;
}

function ddayClass(dday: string) {
  if (dday === 'D-DAY' || dday === '마감') return 'text-error';
  if (dday === '상시채용') return 'text-point-blue';

  const m = dday.match(/^D-(\d+)$/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n <= 3) return 'text-error';
    return 'text-point-blue';
  }
  return 'text-midnight-ink';
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-6">
      <p className="text-slate-gray text-base font-black">{label}</p>
      <div className="min-w-0 text-base">{children}</div>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <p key={i} className="text-midnight-ink text-base leading-8 font-medium">
          {l === '' ? '\u00A0' : l}
        </p>
      ))}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-zinc-100 py-4 last:border-0">
      <div className="flex w-28 shrink-0 items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-sm font-bold">{label}</span>
      </div>
      <span className="text-midnight-ink truncate text-lg font-black">{value}</span>
    </div>
  );
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-midnight-ink min-h-screen min-w-7xl bg-white pt-24 pb-20">
      <div className="mx-auto w-7xl px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-36 animate-pulse rounded bg-zinc-100" />
          <Button type="button" variant="outline" size="md" onClick={onBack}>
            뒤로
          </Button>
        </div>
        <div className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="animate-pulse p-10">
            <div className="h-3 w-28 rounded bg-zinc-200" />
            <div className="mt-3 h-9 w-2/3 rounded bg-zinc-200" />
            <div className="mt-6 h-32 rounded-2xl bg-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({
  title,
  message,
  onRetry,
  onBack,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="text-midnight-ink min-h-screen min-w-7xl bg-white pt-24 pb-20">
      <div className="mx-auto w-7xl px-6">
        <div className="rounded-4xl border border-zinc-100 bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-black">{title}</p>
          <p className="text-slate-gray mt-2 text-sm font-medium">{message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button type="button" variant="outline" size="md" onClick={onBack}>
              뒤로
            </Button>
            <Button type="button" variant="dark" size="md" onClick={onRetry}>
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyBox({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="text-midnight-ink min-h-screen min-w-7xl bg-white pt-24 pb-20">
      <div className="mx-auto w-7xl px-6">
        <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-10 text-center shadow-sm">
          <p className="text-xl font-black">{title}</p>
          <p className="text-slate-gray mt-2 text-sm font-medium">{message}</p>
          <div className="mt-6 flex justify-center">
            <Button type="button" variant="dark" size="md" onClick={onBack}>
              뒤로
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function JobPostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const jobPostId = Number(id);

  const { user, isLoggedIn } = useAuthStore();
  const uid = user?.userId;
  const extendedUser = user as ExtendedUserData | null;
  const isCompanyViewer = user?.role === 'COMPANY';

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('공고 정보를 불러오지 못했어요.');
  const [data, setData] = useState<NonNullable<ApiResult> | null>(null);
  const [scrapPending, setScrapPending] = useState(false);

  const [mainJobStacks, setMainJobStacks] = useState<StackInfo[]>([]);
  const [otherJobPostings, setOtherJobPostings] = useState<OtherJobPosting[]>([]);
  const [stackNameMap, setStackNameMap] = useState<Record<number, string>>({});

  const pid = useMemo(() => (Number.isFinite(jobPostId) ? String(jobPostId) : ''), [jobPostId]);

  const goLogin = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  const scrollToId = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const load = async () => {
    if (!Number.isFinite(jobPostId)) {
      setStatus('notfound');
      setData(null);
      return;
    }

    setStatus('loading');
    setErrorMessage('공고 정보를 불러오지 못했어요.');
    setMainJobStacks([]);

    try {
      const res = await fetchJobPostDetail(jobPostId);
      if (!res) {
        setStatus('notfound');
        setData(null);
        return;
      }

      const targetPost = res.jobPost as typeof res.jobPost &
        JobPostExtraFields & { detail?: string };

      let parsedExtras: ParsedDetailData = {};
      const rawDetail = targetPost.detail || targetPost.requirement_text;

      try {
        if (rawDetail && typeof rawDetail === 'string' && rawDetail.startsWith('{')) {
          parsedExtras = JSON.parse(rawDetail);
        }
      } catch (e) {
        console.warn('JSON parsing failed, treating as plain text', e);
        parsedExtras = { requirement_text: rawDetail ?? undefined };
      }

      const rawStackIds = targetPost.stackIds;
      const rawActive = targetPost.active;
      const rawCid = targetPost.cid;

      const mergedJobPost = {
        ...res.jobPost,
        ...parsedExtras,
        stackIds: Array.isArray(rawStackIds) ? rawStackIds : [],
        active: rawActive,
        cid: rawCid,
        requirement_text: parsedExtras.requirement_text || res.jobPost.requirement_text,
      };

      setData({
        ...res,
        jobPost: mergedJobPost,
      });

      setStatus('success');

      if (isLoggedIn && uid && pid) {
        try {
          const checked = await fetchScrapCheck(uid, pid);
          setData((prev) => (prev ? { ...prev, isScrapped: checked } : prev));
        } catch (e) {
          console.warn('scrap check failed', e);
        }
      }

      try {
        const stackRes = await axios.get(`/api/stacks/posting/${jobPostId}`);
        if (stackRes.data?.status && Array.isArray(stackRes.data.data)) {
          setMainJobStacks(stackRes.data.data);
        }
      } catch (e) {
        console.warn('Failed to fetch main job stacks', e);
      }

      if (res.company?.id) {
        try {
          const jobsRes = await axios.get(`/api/job-postings/company/${res.company.id}`);
          if (jobsRes.data?.data) {
            const others = jobsRes.data.data.filter((j: OtherJobPosting) => j.id !== jobPostId);
            setOtherJobPostings(others);
          }
        } catch (e) {
          console.error('Failed to fetch other jobs', e);
        }
      }
    } catch (err) {
      setStatus('error');
      setData(null);
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isLoggedIn, uid]);

  useEffect(() => {
    if (otherJobPostings.length === 0) return;

    const fetchStackNames = async () => {
      const allIds = otherJobPostings.flatMap((job) => job.stackIds || []);
      const uniqueIds = [...new Set(allIds)];
      const idsToFetch = uniqueIds.filter((id) => !stackNameMap[id]);

      if (idsToFetch.length === 0) return;

      const newMap: Record<number, string> = {};

      await Promise.all(
        idsToFetch.map(async (stackId) => {
          try {
            const res = await axios.get(`/api/stacks/${stackId}`);
            if (res.data?.status && res.data?.data) {
              newMap[stackId] = res.data.data.stackName;
            }
          } catch (e) {
            console.warn(`Failed to fetch stack name for ID: ${stackId}`, e);
          }
        }),
      );

      setStackNameMap((prev) => ({ ...prev, ...newMap }));
    };

    fetchStackNames();
  }, [otherJobPostings, stackNameMap]);

  const handleToggleScrap = async () => {
    if (!data || scrapPending) return;

    if (!isLoggedIn || !uid) {
      alert('로그인이 필요합니다.');
      goLogin();
      return;
    }
    if (!pid) return;

    const optimistic = !data.isScrapped;
    setData((prev) => (prev ? { ...prev, isScrapped: optimistic } : prev));

    setScrapPending(true);
    try {
      const confirmed = await toggleScrap(uid, pid);
      setData((prev) => (prev ? { ...prev, isScrapped: confirmed } : prev));
    } catch (e) {
      setData((prev) => (prev ? { ...prev, isScrapped: !optimistic } : prev));
      console.error(e);
      alert('스크랩 처리 실패! 다시 시도해줘 🥲');
    } finally {
      setScrapPending(false);
    }
  };

  const requireLoginThen = (next: () => void) => {
    if (!isLoggedIn || !uid) {
      alert('로그인이 필요합니다.');
      goLogin();
      return;
    }
    next();
  };

  if (status === 'loading') return <DetailSkeleton onBack={() => navigate(-1)} />;
  if (status === 'error')
    return (
      <ErrorBox
        title="공고 정보를 불러오지 못했어요"
        message={errorMessage}
        onRetry={load}
        onBack={() => navigate(-1)}
      />
    );
  if (status === 'notfound' || !data)
    return (
      <EmptyBox
        title="공고를 찾을 수 없어요"
        message="목록에서 다시 선택해 주세요."
        onBack={() => navigate(-1)}
      />
    );

  const { jobPost, company } = data;
  const jp = jobPost as typeof jobPost & JobPostExtraFields;
  const dday = calculateDDay(jobPost.deadline, jp.active);
  const isClosed = dday === '마감';

  const isOwner =
    isLoggedIn &&
    isCompanyViewer &&
    !!extendedUser?.cid &&
    !!company?.id &&
    String(extendedUser.cid) === String(company.id);

  const canApply = (() => {
    if (isClosed) return false;
    const st = (jobPost.status ?? 'OPEN').toUpperCase();
    if (st !== 'OPEN') return false;
    return true;
  })();

  const workTimeText =
    jp.work_days && jp.work_hours
      ? `${jp.work_days} ${jp.work_hours}`
      : (jp.work_days ?? jp.work_hours ?? null);

  return (
    <div className="text-midnight-ink min-h-screen min-w-7xl bg-white pt-24 pb-20">
      <div className="mx-auto w-7xl px-6">
        <header className="border-point-blue mt-4 mb-12 flex items-end justify-between border-l-8 pl-6">
          <div className="min-w-0 flex-1">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
            >
              공고 상세
            </motion.h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              isBack
              onClick={() => navigate(-1)}
              className="border-midnight-ink text-midnight-ink shrink-0 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap hover:bg-gray-50"
            >
              뒤로
            </Button>
          </div>
        </header>

        <section className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="p-10 lg:p-14">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-silver-mist text-xs font-black tracking-[0.2em] uppercase">
                  COMPANY
                </p>

                <p
                  className="text-midnight-ink hover:text-point-blue mt-1 inline-flex max-w-full cursor-pointer items-center gap-2 text-base font-black transition-colors"
                  onClick={() => navigate(`/companies/${company.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/companies/${company.id}`);
                  }}
                >
                  <span className={`min-w-0 ${underlineEffect}`}>
                    <span className="truncate">{company.companies_name}</span>
                  </span>

                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 opacity-60"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
              <div className="min-w-0">
                <h1
                  className="text-midnight-ink [display:-webkit-box] min-w-0 overflow-hidden pb-1 text-3xl leading-snug font-black tracking-tighter wrap-break-word [-webkit-box-orient:vertical] [-webkit-line-clamp:2] lg:text-4xl"
                  title={jobPost.title}
                >
                  {jobPost.title}
                </h1>
              </div>

              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className={`text-lg font-black ${ddayClass(dday)}`}>{dday}</span>

                {dday !== '상시채용' && (
                  <span className="text-silver-mist text-sm font-bold">
                    {dday === '마감'
                      ? formatYmdDot(jobPost.deadline)
                      : `마감 ${formatYmdDot(jobPost.deadline)}`}
                  </span>
                )}

                {/* [수정됨] 기업 회원이 아닐 때만 스크랩 버튼 표시 (!isCompanyViewer 추가) */}
                {isLoggedIn && uid && !isCompanyViewer ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleToggleScrap}
                    disabled={scrapPending}
                    aria-label={data.isScrapped ? '스크랩 해제' : '스크랩'}
                    icon={
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={data.isScrapped ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                      </svg>
                    }
                    className={`ml-1 rounded-xl px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60 ${
                      data.isScrapped
                        ? 'border-point-blue/30 bg-point-blue/10 text-point-blue hover:bg-point-blue/15 hover:text-point-blue'
                        : 'border-soft-pebble text-slate-gray hover:border-midnight-ink hover:text-midnight-ink bg-white'
                    }`}
                  >
                    {scrapPending ? '처리중' : '스크랩'}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-zinc-100 bg-white">
              <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                <div className="space-y-6 p-7">
                  <SummaryRow label="경력">
                    <span className="text-point-blue font-black">{jp.career ?? '무관'}</span>
                  </SummaryRow>
                  <SummaryRow label="학력">
                    <span className="text-point-blue font-black">{jp.education ?? '학력무관'}</span>
                  </SummaryRow>
                  <SummaryRow label="근무형태">
                    <span className="text-point-blue font-black">
                      {jp.employment_type ?? '협의'}
                    </span>
                  </SummaryRow>
                </div>

                <div className="space-y-6 border-t border-zinc-100 p-7 md:border-t-0 md:border-l">
                  <SummaryRow label="급여">
                    <span className="text-point-blue font-black">
                      {jp.salary ?? '면접 후 결정'}
                    </span>
                  </SummaryRow>
                  <SummaryRow label="근무지역">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-point-blue font-black">
                        {jp.work_location || '면접 후 결정'}
                      </span>
                      {jp.work_location ? (
                        <button
                          type="button"
                          className="text-point-blue text-sm font-black"
                          onClick={() => {
                            const q = encodeURIComponent(jp.work_location ?? '');
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${q}`,
                              '_blank',
                              'noreferrer',
                            );
                          }}
                        >
                          <span className={underlineEffect}>지도 &gt;</span>
                        </button>
                      ) : null}
                    </div>
                  </SummaryRow>
                  {workTimeText ? (
                    <SummaryRow label="근무시간">
                      <span className="text-midnight-ink font-black">{workTimeText}</span>
                    </SummaryRow>
                  ) : null}
                </div>
              </div>
              <div className="h-px w-full bg-zinc-100" />
            </div>

            {mainJobStacks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {mainJobStacks.map((stack) => (
                  <span
                    key={stack.stackId}
                    className="text-slate-gray rounded-full border border-zinc-100 bg-white px-3 py-1 text-xs font-black"
                  >
                    {stack.stackName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mx-auto mt-12 w-7xl px-6">
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-8 space-y-12">
            <section
              id="section-detail"
              className="rounded-[40px] border border-zinc-200 bg-white p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                상세 요강
              </h2>
              {jobPost.requirement_text ? (
                <TextBlock text={jobPost.requirement_text} />
              ) : (
                <p className="font-medium text-zinc-400">상세 요강이 비어있습니다.</p>
              )}
            </section>

            <section
              id="section-requirements"
              className="rounded-[40px] border border-zinc-200 bg-white p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                기술 스택 및 우대사항
              </h2>
              <div className="space-y-6">
                <div>
                  {mainJobStacks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {mainJobStacks.map((stack) => (
                        <span
                          key={stack.stackId}
                          className="text-slate-gray rounded-full border border-zinc-100 bg-zinc-50 px-4 py-2 text-sm font-bold"
                        >
                          {stack.stackName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-bold text-zinc-400">기술 스택 무관</p>
                  )}
                </div>
              </div>
            </section>

            <section
              id="section-company"
              className="rounded-[40px] border border-zinc-200 bg-white p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                기업 정보
              </h2>
              <div className="space-y-4">
                <InfoItem
                  icon={<Building2 size={20} />}
                  label="기업명"
                  value={company.companies_name}
                />
                <InfoItem icon={<MapPin size={20} />} label="주소" value={company.address ?? '-'} />
                {company.homepage_url && (
                  <div className="flex items-center gap-4 py-4">
                    <div className="flex w-28 shrink-0 items-center gap-2 text-zinc-400">
                      <Globe size={20} />
                      <span className="text-sm font-bold">홈페이지</span>
                    </div>
                    <a
                      href={ensureHttps(company.homepage_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-point-blue truncate text-lg font-black hover:underline"
                    >
                      {company.homepage_url}
                    </a>
                  </div>
                )}
              </div>
            </section>

            <section
              id="section-jobs"
              className="rounded-[40px] border border-zinc-200 bg-white p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                이 기업의 다른 공고
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {otherJobPostings.length > 0 ? (
                  <>
                    {otherJobPostings.map((job) => {
                      const dDayText = calculateDDay(job.endDate);
                      const isJobClosed = dDayText === '마감';

                      return (
                        <motion.div
                          key={job.id}
                          whileHover={{ y: -8 }}
                          className="group flex cursor-pointer flex-col rounded-3xl border border-zinc-200 bg-zinc-50/30 p-8 transition-shadow duration-300 hover:bg-white hover:shadow-2xl"
                          onClick={() => navigate(`/job-posts/${job.id}`)}
                        >
                          <div className="mb-4 space-y-2">
                            <h4 className="text-midnight-ink group-hover:text-point-blue line-clamp-1 text-2xl font-black transition-colors duration-300">
                              {job.title}
                            </h4>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {job.stackIds &&
                                job.stackIds.map((stackId) => (
                                  <div
                                    key={stackId}
                                    className="flex items-center justify-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-slate-700"
                                  >
                                    {stackNameMap[stackId] || stackId}
                                  </div>
                                ))}
                            </div>

                            <p className="text-slate-gray mt-2 line-clamp-2 text-sm font-medium opacity-70">
                              {parseRequirementText(job.detail)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                            <span className="text-slate-gray min-w-0 flex-1 truncate pr-4 text-sm font-bold">
                              {company.address ?? '지역 정보 없음'}
                            </span>
                            <span
                              className={`${
                                isJobClosed ? 'text-error' : 'text-point-blue'
                              } text-sm font-black whitespace-nowrap`}
                            >
                              {dDayText}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                    <Button
                      variant="outline"
                      fullWidth
                      size="lg"
                      className="mt-6 rounded-3xl border-2 border-dashed opacity-60 transition-all duration-300 hover:opacity-100"
                      onClick={() => navigate(`/job-postings?keyword=${company.companies_name}`)}
                    >
                      {company.companies_name}의 모든 공고 보기
                    </Button>
                  </>
                ) : (
                  <div className="text-slate-gray py-20 text-center text-xl font-bold">
                    다른 진행 중인 공고가 없습니다.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="col-span-4">
            <div className="sticky top-24 space-y-5">
              <div className="rounded-4xl border border-zinc-200 bg-white p-8 shadow-sm">
                <h3 className="mb-6 text-xs font-black tracking-widest text-zinc-400 uppercase">
                  Quick Menu
                </h3>
                <nav className="mb-8 space-y-4">
                  {[
                    { id: 'section-detail', label: '상세 요강' },
                    { id: 'section-requirements', label: '지원 자격' },
                    { id: 'section-company', label: '기업 정보' },
                    { id: 'section-jobs', label: '채용 공고' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToId(item.id)}
                      className="group flex w-full items-center transition-transform active:scale-95"
                    >
                      <div className="bg-point-blue h-4 w-1 rounded-full" />
                      <span className="text-midnight-ink group-hover:text-point-blue px-4 font-bold transition-colors">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </nav>

                <div className="space-y-3 border-t border-zinc-100 pt-6">
                  {isOwner ? (
                    <Button
                      variant="blue"
                      fullWidth
                      className="rounded-xl py-3 font-black shadow-lg"
                      onClick={() => navigate(`/company/jobs/edit/${jobPostId}`)}
                    >
                      공고 수정하기
                    </Button>
                  ) : (
                    !isCompanyViewer &&
                    (data.external_apply_url ? (
                      <Button
                        variant="blue"
                        fullWidth
                        className="rounded-xl py-3 font-black shadow-lg"
                        onClick={() =>
                          requireLoginThen(() => {
                            window.open(data.external_apply_url!, '_blank', 'noreferrer');
                          })
                        }
                      >
                        외부 페이지로 지원
                      </Button>
                    ) : (
                      <Button
                        variant="blue"
                        fullWidth
                        className="rounded-xl py-3 font-black shadow-lg"
                        onClick={() =>
                          requireLoginThen(() => {
                            navigate(`/job-posts/${jobPost.id}/apply`);
                          })
                        }
                        disabled={!canApply}
                      >
                        {isClosed ? '마감된 공고입니다' : '지원하기'}
                      </Button>
                    ))
                  )}

                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="rounded-xl py-3"
                  >
                    맨 위로
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
