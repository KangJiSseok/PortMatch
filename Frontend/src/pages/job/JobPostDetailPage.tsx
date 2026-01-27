// src/pages/JobPostDetailPage.tsx
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../../components/Button/Button';
import { fetchJobPostDetail, toggleJobPostScrapAsync } from '../../api/jobPosts';
import { useAuthStore } from '@/store/authStore';

type PageStatus = 'loading' | 'error' | 'notfound' | 'success';
type ApiResult = Awaited<ReturnType<typeof fetchJobPostDetail>>;
type JobPostDetailData = NonNullable<ApiResult>;

// ✅ 타입에 아직 필드 추가 전이어도 TS 에러 안나게 로컬 확장 타입
type JobPostExtraFields = {
  career?: string | null; // 신입/경력/무관 등
  education?: string | null; // 학력무관/대졸(4년) 이상 등
  employment_type?: string | null; // 정규직/계약직/인턴
  work_location?: string | null; // 서울 강남구 등
  salary?: string | null; // 면접 후 결정/회사내규 등
  work_days?: string | null; // 주 5일(월~금) 등
  work_hours?: string | null; // 09:00~18:00 등
};

const underlineEffect =
  "relative after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-[2px] after:bg-point-blue after:transition-all after:duration-300 hover:after:w-full";

function formatYmdDot(ymd?: string | null) {
  if (!ymd) return '-';
  return ymd.replaceAll('-', '.');
}

function calcDday(deadline?: string | null) {
  if (!deadline) return '-';
  const end = new Date(`${deadline}T23:59:59`);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `D-${diffDays}`;
  if (diffDays === 0) return 'D-DAY';
  return '마감';
}

function ddayClass(dday: string) {
  if (dday === 'D-DAY' || dday === '마감') return 'text-error';

  const m = dday.match(/^D-(\d+)$/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n <= 3) return 'text-error';
    return 'text-point-blue';
  }

  return 'text-midnight-ink';
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <p key={i} className="text-midnight-ink text-sm leading-6 font-medium">
          {l === '' ? '\u00A0' : l}
        </p>
      ))}
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
      <p className="text-midnight-ink text-sm font-black">{label}</p>
      <p className="text-midnight-ink text-sm font-black">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <p className="text-midnight-ink text-sm font-black">{label}</p>
      {isLink ? (
        <a
          className="hover:text-point-blue text-slate-gray mt-1 block text-sm font-medium break-all underline transition-colors"
          href={value}
          target="_blank"
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <p className="text-slate-gray mt-1 text-sm font-medium break-all">{value}</p>
      )}
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-6">
      <p className="text-slate-gray text-base font-black">{label}</p>
      <div className="min-w-0 text-base">{children}</div>
    </div>
  );
}

function SectionCard({
  id,
  title,
  offset,
  children,
}: {
  id: string;
  title: string;
  offset: number;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      style={{ scrollMarginTop: offset }}
      className="rounded-[20px] border border-zinc-100 bg-white p-8 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <h3 className="text-midnight-ink text-2xl font-black tracking-tighter">{title}</h3>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-24 pb-20">
      <div className="mx-auto w-[1280px] px-6">
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

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-[20px] border border-zinc-100 bg-white p-8 shadow-sm"
              >
                <div className="h-6 w-40 rounded bg-zinc-200" />
                <div className="mt-6 h-28 rounded-xl bg-zinc-50" />
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="animate-pulse rounded-[20px] border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="h-6 w-28 rounded bg-zinc-200" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-xl bg-zinc-50" />
                ))}
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-11 rounded-xl bg-zinc-200" />
                <div className="h-11 rounded-xl bg-zinc-100" />
              </div>
            </div>
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
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-24 pb-20">
      <div className="mx-auto w-[1280px] px-6">
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
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-24 pb-20">
      <div className="mx-auto w-[1280px] px-6">
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

export default function JobPostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobPostId = Number(id);

  // ✅ 여기! store에서 user 가져오기 (MyPageGate랑 동일)
  const { user } = useAuthStore();
  const isCompanyViewer = user?.role === 'COMPANY';

  const [navH, setNavH] = useState(80);
  const GAP = 16;
  const OFFSET = useMemo(() => navH + GAP, [navH]);

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('공고 정보를 불러오지 못했어요.');
  const [data, setData] = useState<JobPostDetailData | null>(null);
  const [scrapPending, setScrapPending] = useState(false);

  useLayoutEffect(() => {
    const nav = document.getElementById('app-navbar');
    const set = () => setNavH(nav?.offsetHeight ?? 80);
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  useEffect(() => {
    const prev = document.documentElement.style.scrollPaddingTop;
    document.documentElement.style.scrollPaddingTop = `${OFFSET}px`;
    return () => {
      document.documentElement.style.scrollPaddingTop = prev;
    };
  }, [OFFSET]);

  const handleToggleScrap = async () => {
    if (!data || scrapPending) return;

    const optimistic = !data.isScrapped;
    setData((prev) => (prev ? { ...prev, isScrapped: optimistic } : prev));

    setScrapPending(true);
    try {
      const confirmed = await toggleJobPostScrapAsync(data.jobPost.id, optimistic);
      setData((prev) => (prev ? { ...prev, isScrapped: confirmed } : prev));
    } catch (e) {
      setData((prev) => (prev ? { ...prev, isScrapped: !optimistic } : prev));
      // eslint-disable-next-line no-console
      console.error(e);
      // eslint-disable-next-line no-alert
      alert('스크랩 처리 실패! 다시 시도해줘 🥲');
    } finally {
      setScrapPending(false);
    }
  };

  const scrollToId = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - OFFSET;
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

    try {
      const res = await fetchJobPostDetail(jobPostId);
      if (!res) {
        setStatus('notfound');
        setData(null);
        return;
      }
      setData(res);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setData(null);
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (status === 'loading') return <DetailSkeleton onBack={() => navigate(-1)} />;

  if (status === 'error') {
    return (
      <ErrorBox
        title="공고 정보를 불러오지 못했어요"
        message={errorMessage}
        onRetry={load}
        onBack={() => navigate(-1)}
      />
    );
  }

  if (status === 'notfound' || !data) {
    return (
      <EmptyBox
        title="공고를 찾을 수 없어요"
        message="목록에서 다시 선택해 주세요."
        onBack={() => navigate(-1)}
      />
    );
  }

  const { jobPost, company } = data;
  const jp = jobPost as typeof jobPost & JobPostExtraFields;

  const dday = calcDday(jobPost.deadline);

  const canApply = (() => {
    const st = (jobPost.status ?? 'OPEN').toUpperCase();
    const d = calcDday(jobPost.deadline);
    if (st !== 'OPEN') return false;
    if (d === '마감') return false;
    return true;
  })();

  const workTimeText =
    jp.work_days && jp.work_hours
      ? `${jp.work_days} ${jp.work_hours}`
      : (jp.work_days ?? jp.work_hours ?? null);

  return (
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-24 pb-20">
      <div className="mx-auto w-[1280px] px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-midnight-ink text-2xl font-black tracking-tighter">공고 상세</h2>
          </div>
          <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>
            뒤로
          </Button>
        </div>

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
                  className="text-midnight-ink [display:-webkit-box] min-w-0 overflow-hidden text-3xl leading-tight font-black tracking-tighter break-words [-webkit-box-orient:vertical] [-webkit-line-clamp:2] lg:text-4xl"
                  title={jobPost.title}
                >
                  {jobPost.title}
                </h1>
              </div>

              <div className="flex items-center gap-3 whitespace-nowrap">
                <span className={`text-lg font-black ${ddayClass(dday)}`}>{dday}</span>

                <span className="text-silver-mist text-sm font-bold">
                  마감 {formatYmdDot(jobPost.deadline)}
                </span>

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
                    <span className="text-midnight-ink font-black">
                      {jp.salary ?? '면접 후 결정'}
                    </span>
                  </SummaryRow>

                  <SummaryRow label="근무지역">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-midnight-ink font-black">
                        {jp.work_location ?? '-'}
                      </span>
                      {jp.work_location ? (
                        <button
                          type="button"
                          className="text-point-blue text-sm font-black hover:underline"
                          onClick={() => {
                            const q = encodeURIComponent(jp.work_location ?? '');
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${q}`,
                              '_blank',
                              'noreferrer',
                            );
                          }}
                        >
                          지도 &gt;
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

            {(jobPost.required_stacks ?? []).length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {(jobPost.required_stacks ?? []).map((s) => (
                  <span
                    key={s}
                    className="text-slate-gray rounded-full border border-zinc-100 bg-white px-3 py-1 text-xs font-black"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SectionCard id="detail" title="상세요강" offset={OFFSET}>
              <div className="rounded-xl bg-zinc-50 p-6">
                {jobPost.requirement_text ? (
                  <TextBlock text={jobPost.requirement_text} />
                ) : (
                  <p className="text-slate-gray text-sm font-medium">상세요강이 비어 있어요.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard id="requirements" title="지원자격" offset={OFFSET}>
              <div className="space-y-4">
                <div className="rounded-xl bg-zinc-50 p-6">
                  <p className="text-midnight-ink text-sm font-black">필수 기술 스택</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(jobPost.required_stacks ?? []).length === 0 ? (
                      <span className="text-slate-gray text-sm font-medium">-</span>
                    ) : (
                      (jobPost.required_stacks ?? []).map((s) => (
                        <span
                          key={s}
                          className="text-slate-gray rounded-full border border-zinc-100 bg-white px-3 py-1 text-xs font-black"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-zinc-50 p-6">
                  <p className="text-midnight-ink text-sm font-black">우대사항</p>
                  <p className="text-slate-gray mt-2 text-sm leading-6 font-medium">
                    (데모) 경력/학력/고용형태/근무지/급여/근무시간 정보는 상단 요약 영역에서 먼저
                    보여줘요.
                    <br />
                    (추후) 상세 요건 컬럼이 더 늘어나면 이 섹션에 사람인처럼 쫘악 풀어쓰면 됨.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard id="company" title="기업정보" offset={OFFSET}>
              <div className="space-y-3">
                <InfoRow label="기업명" value={company.companies_name} />
                <InfoRow label="주소" value={company.address ?? '-'} />
                <InfoRow
                  label="홈페이지"
                  value={company.homepage_url ?? '-'}
                  isLink={!!company.homepage_url}
                />
              </div>
            </SectionCard>

            <SectionCard id="reviews" title="취업 후기" offset={OFFSET}>
              <div className="rounded-xl bg-zinc-50 p-10 text-center">
                <p className="text-lg font-black">아직 후기가 없어요.</p>
              </div>
            </SectionCard>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky" style={{ top: OFFSET }}>
              <div className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <p className="text-midnight-ink text-lg font-black tracking-tighter">
                      지원 정보
                    </p>
                    <span className={`text-sm font-black ${ddayClass(dday)}`}>{dday}</span>
                  </div>
                </div>

                <div className="mt-5">
                  <MiniRow label="마감" value={formatYmdDot(jobPost.deadline)} />
                </div>

                <div className="my-8 h-px w-full bg-zinc-100" />

                <h3 className="text-midnight-ink text-md font-black tracking-widest uppercase opacity-40">
                  Quick Menu
                </h3>

                <nav className="mt-5 space-y-1">
                  {[
                    ['detail', '상세요강'],
                    ['requirements', '지원자격'],
                    ['company', '기업정보'],
                    ['reviews', '취업후기'],
                  ].map(([key, label]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => scrollToId(key)}
                      className="group w-full justify-start border-transparent bg-transparent px-0 py-2 hover:border-transparent hover:bg-transparent active:scale-[0.98]"
                      icon={<div className="bg-point-blue mt-0.5 h-5 w-1 shrink-0 rounded-full" />}
                    >
                      <span className="text-midnight-ink group-hover:text-point-blue px-4 text-lg font-bold transition-all group-hover:translate-x-0.5">
                        {label}
                      </span>
                    </Button>
                  ))}
                </nav>

                {/* ✅ 기업(COMPANY)이면 지원 버튼 숨김 */}
                {!isCompanyViewer && (
                  <div className="mt-8">
                    {data.external_apply_url ? (
                      <Button
                        type="button"
                        variant="blue"
                        size="lg"
                        className="w-full rounded-2xl py-4 text-base font-black shadow-lg"
                        onClick={() =>
                          window.open(data.external_apply_url!, '_blank', 'noreferrer')
                        }
                      >
                        외부 페이지로 지원
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="blue"
                        size="lg"
                        className="w-full rounded-2xl py-4 text-base font-black shadow-lg"
                        onClick={() => navigate(`/job-posts/${jobPost.id}/apply`)}
                        disabled={!canApply}
                      >
                        지원하기
                      </Button>
                    )}

                    {!canApply && (
                      <p className="text-slate-gray mt-2 text-xs font-medium opacity-70">
                        현재 공고 상태/마감일 때문에 지원이 비활성화돼요.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
