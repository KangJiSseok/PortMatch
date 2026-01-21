// src/pages/JobPostDetailPage.tsx
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../components/Button/Button';
import { fetchJobPostDetail, toggleJobPostScrap, toggleJobPostScrapAsync } from '../api/jobPosts';

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

function formatYmdDot(ymd?: string | null) {
  if (!ymd) return '-';
  return ymd.replaceAll('-', '.');
}

function formatIsoDot(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
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
  // D-DAY / 마감은 무조건 빨강
  if (dday === 'D-DAY' || dday === '마감') return 'text-red-500';

  // D-숫자면 숫자 파싱해서 3 이하면 빨강, 그 외는 포인트블루
  const m = dday.match(/^D-(\d+)$/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n <= 3) return 'text-red-500';
    return 'text-point-blue';
  }

  // 그 외(예: '-') 기본 텍스트
  return 'text-zinc-800';
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <p key={i} className="text-sm leading-6 font-medium text-zinc-500">
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
      <p className="text-sm font-black text-zinc-800">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <p className="text-midnight-ink text-sm font-black">{label}</p>
      {isLink ? (
        <a
          className="hover:text-point-blue mt-1 block text-sm font-medium break-all text-zinc-600 underline transition-colors"
          href={value}
          target="_blank"
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm font-medium break-all text-zinc-600">{value}</p>
      )}
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-6">
      <p className="text-base font-black text-zinc-600">{label}</p>
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
    <div className="text-midnight-ink min-h-screen bg-white pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-6">
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
    <div className="text-midnight-ink min-h-screen bg-white pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-4xl border border-zinc-100 bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-black">{title}</p>
          <p className="mt-2 text-sm font-medium text-zinc-500">{message}</p>
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
    <div className="text-midnight-ink min-h-screen bg-white pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-10 text-center shadow-sm">
          <p className="text-xl font-black">{title}</p>
          <p className="mt-2 text-sm font-medium text-zinc-500">{message}</p>
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

  // ✅ navbar 기준 offset
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

    // 1) UI 먼저 바꿈 (optimistic)
    const optimistic = !data.isScrapped;
    setData((prev) => (prev ? { ...prev, isScrapped: optimistic } : prev));

    // 2) 그 다음 "저장"을 비동기로
    setScrapPending(true);
    try {
      const confirmed = await toggleJobPostScrapAsync(jobPost.id, optimistic);

      // 서버(여기선 mock)가 준 값으로 최종 확정
      setData((prev) => (prev ? { ...prev, isScrapped: confirmed } : prev));
    } catch (e) {
      // 3) 실패하면 롤백
      setData((prev) => (prev ? { ...prev, isScrapped: !optimistic } : prev));
      console.error(e);
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

  // ✅ 조건 return (여기 아래 hook 절대 없음)
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

  // ✅ 타입 확장(필드 추가 전에도 TS 안 터지게)
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
      : jp.work_days ?? jp.work_hours ?? null;

  return (
    <div className="text-midnight-ink min-h-screen bg-white pb-20 pt-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* 상단 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-midnight-ink text-2xl font-black tracking-tighter">공고 상세</h2>
          </div>
          <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>
            뒤로
          </Button>
        </div>

        {/* 요약 카드 */}
        <section className="overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="p-10 lg:p-14">
            {/* 회사명 */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">COMPANY</p>
                <p
                  className="mt-1 inline-flex max-w-full cursor-pointer items-center gap-2 text-base font-black text-midnight-ink transition-colors hover:text-point-blue"
                  onClick={() => navigate(`/companies/${company.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/companies/${company.id}`);
                  }}
                >
                  <span className="truncate">{company.companies_name}</span>
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

            {/* 제목 + 우측 라인 */}
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <h1 className="text-midnight-ink text-3xl font-black tracking-tighter lg:text-4xl">
                {jobPost.title}
              </h1>

              {/* ✅ D-day + 마감 + 스크랩 (같은 줄) */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-lg font-black ${ddayClass(dday)}`}>{dday}</span>

                <span className="text-sm font-bold text-zinc-400">
                  마감 {formatYmdDot(jobPost.deadline)}
                </span>

                <button
                  type="button"
                  onClick={handleToggleScrap}
                  disabled={scrapPending}
                  className={`ml-1 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black transition-all
                    ${
                      data.isScrapped
                        ? 'border-point-blue/30 bg-point-blue/10 text-point-blue'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
                    }
                    ${scrapPending ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                  aria-label={data.isScrapped ? '스크랩 해제' : '스크랩'}
                >
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
                  {scrapPending ? '처리중...' : '스크랩'}
                </button>

              </div>
            </div>

            {/* ✅ 사람인 파란 박스 느낌: 경력/학력/근무형태/급여/근무지역(+근무시간 옵션) */}
            <div className="mt-8 rounded-2xl border border-zinc-100 bg-white">
              <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                {/* 왼쪽 */}
                <div className="space-y-6 p-7">
                  <SummaryRow label="경력">
                    <span className="font-black text-point-blue">{jp.career ?? '무관'}</span>
                  </SummaryRow>

                  <SummaryRow label="학력">
                    <span className="font-black text-point-blue">{jp.education ?? '학력무관'}</span>
                  </SummaryRow>

                  <SummaryRow label="근무형태">
                    <span className="font-black text-point-blue">{jp.employment_type ?? '협의'}</span>
                  </SummaryRow>
                </div>

                {/* 오른쪽 */}
                <div className="space-y-6 border-t border-zinc-100 p-7 md:border-t-0 md:border-l">
                  <SummaryRow label="급여">
                    <span className="font-black text-zinc-800">{jp.salary ?? '면접 후 결정'}</span>
                  </SummaryRow>

                  <SummaryRow label="근무지역">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-black text-zinc-800">{jp.work_location ?? '-'}</span>
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

                  {/* 있으면 보여주기(없으면 숨김) */}
                  {workTimeText ? (
                    <SummaryRow label="근무시간">
                      <span className="font-black text-zinc-800">{workTimeText}</span>
                    </SummaryRow>
                  ) : null}
                </div>
              </div>

              <div className="h-px w-full bg-zinc-100" />
            </div>

            {/* 스택 태그 */}
            {(jobPost.required_stacks ?? []).length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {(jobPost.required_stacks ?? []).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-zinc-100 bg-white px-3 py-1 text-xs font-black text-zinc-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 본문 + sticky */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 왼쪽 */}
          <div className="space-y-6 lg:col-span-2">
            <SectionCard id="detail" title="상세요강" offset={OFFSET}>
              <div className="rounded-xl bg-zinc-50 p-6">
                {jobPost.requirement_text ? (
                  <TextBlock text={jobPost.requirement_text} />
                ) : (
                  <p className="text-sm font-medium text-zinc-500">상세요강이 비어 있어요.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard id="requirements" title="지원자격" offset={OFFSET}>
              <div className="space-y-4">
                <div className="rounded-xl bg-zinc-50 p-6">
                  <p className="text-midnight-ink text-sm font-black">필수 기술 스택</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(jobPost.required_stacks ?? []).length === 0 ? (
                      <span className="text-sm font-medium text-zinc-500">-</span>
                    ) : (
                      (jobPost.required_stacks ?? []).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-zinc-100 bg-white px-3 py-1 text-xs font-black text-zinc-600"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-zinc-50 p-6">
                  <p className="text-midnight-ink text-sm font-black">우대사항</p>
                  <p className="mt-2 text-sm leading-6 font-medium text-zinc-500">
                    (데모) 경력/학력/고용형태/근무지/급여/근무시간 정보는 상단 요약 영역에서 먼저 보여줘요.
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
                <InfoRow label="홈페이지" value={company.homepage_url ?? '-'} isLink={!!company.homepage_url} />
              </div>
            </SectionCard>

            <SectionCard id="reviews" title="취업 후기" offset={OFFSET}>
              <div className="rounded-xl bg-zinc-50 p-10 text-center">
                <p className="text-lg font-black">아직 후기가 없어요.</p>
              </div>
            </SectionCard>
          </div>

          {/* 오른쪽 sticky */}
          <aside className="lg:col-span-1">
            <div
              className="sticky rounded-[20px] border border-zinc-100 bg-white p-6 shadow-sm"
              style={{ top: OFFSET }}
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-black tracking-tighter">지원 정보</p>
                  <span className={`text-sm font-black ${ddayClass(dday)}`}>{dday}</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <MiniRow label="마감" value={formatYmdDot(jobPost.deadline)} />
                <MiniRow label="상태" value={(jobPost.status ?? 'OPEN').toUpperCase()} />
                <MiniRow label="등록일" value={formatIsoDot(jobPost.created_at)} />
              </div>

              {/* 바로가기 */}
              <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
                <p className="text-midnight-ink text-sm font-black">바로가기</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ['detail', '상세요강'],
                    ['requirements', '지원자격'],
                    ['company', '기업정보'],
                    ['reviews', '취업후기'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => scrollToId(key)}
                      className="hover:text-point-blue hover:border-point-blue/40 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-sm font-black text-zinc-700 transition hover:shadow-sm"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6">
                {data.external_apply_url ? (
                  <Button
                    type="button"
                    variant="blue"
                    size="lg"
                    className="w-full rounded-2xl"
                    onClick={() => window.open(data.external_apply_url!, '_blank', 'noreferrer')}
                  >
                    외부 페이지로 지원
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="blue"
                    size="lg"
                    className="w-full rounded-2xl"
                    onClick={() => navigate(`/job-posts/${jobPost.id}/apply`)}
                    disabled={!canApply}
                  >
                    지원하기
                  </Button>
                )}

                {!canApply && (
                  <p className="mt-2 text-xs font-medium text-zinc-500">
                    현재 공고 상태/마감일 때문에 지원이 비활성화돼요.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
