// src/pages/CorporateMyPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';

/** ------------------ types ------------------ */
type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  refetch: () => void;
};

type ApplicantView = {
  id: number;
  nickname: string;
  position: string;
  appliedAt: string; // ISO
  status: 'new' | 'reviewing' | 'interview' | 'rejected';
  highlights: string[];
};

type CompanyProfileView = {
  companyName: string;
  managerName: string;
  email: string;
  website?: string;
};

type InterviewEvent = {
  id: number;
  title: string;
  scheduledAt: string; // ISO
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
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${mi}`;
}

function buildMonthCells(monthPivot: Date) {
  const first = new Date(monthPivot.getFullYear(), monthPivot.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // Sunday start

  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

/** ------------------ query-like hook ------------------ */
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
    } catch (e) {
      setIsError(true);
      setErrorMessage(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void run(), deps);

  return { data, isLoading, isError, errorMessage, refetch: run };
}

/** ------------------ mock fetchers (MVP용) ------------------ */
async function fetchCompanyProfile(): Promise<CompanyProfileView> {
  await new Promise((r) => setTimeout(r, 350));
  return {
    companyName: '샘플 기업',
    managerName: '담당자',
    email: 'hr@example.com',
    website: 'https://example.com',
  };
}

async function fetchApplicants(): Promise<ApplicantView[]> {
  await new Promise((r) => setTimeout(r, 450));
  return [
    {
      id: 101,
      nickname: '지원자 1',
      position: 'Frontend',
      appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      status: 'new',
      highlights: ['React', 'TypeScript', '협업 경험'],
    },
    {
      id: 102,
      nickname: '지원자 2',
      position: 'Backend',
      appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      status: 'reviewing',
      highlights: ['Spring', 'JPA', '성능 개선'],
    },
  ];
}

async function fetchCompanyInterviews(): Promise<InterviewEvent[]> {
  await new Promise((r) => setTimeout(r, 400));
  const now = new Date();
  const a = new Date(now);
  a.setDate(now.getDate() + 1);
  a.setHours(14, 0, 0, 0);

  const b = new Date(now);
  b.setDate(now.getDate() + 3);
  b.setHours(10, 30, 0, 0);

  return [
    { id: 201, title: '지원자 1 - 1차 면접', scheduledAt: a.toISOString() },
    { id: 202, title: '지원자 2 - 1차 면접', scheduledAt: b.toISOString() },
  ];
}

/** ------------------ small UI ------------------ */
function SectionTitle({ no, title }: { no: string; title: string }) {
  return (
    <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
      {no}. {title}
    </h2>
  );
}

function PreviewCard({
  title,
  subtitle,
  lines,
  actionLabel,
  onClick,
}: {
  title: string;
  subtitle: string;
  lines: string[];
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="bg-cloud-dancer space-y-6 rounded-2xl p-8 shadow-sm">
      <div>
        <p className="text-midnight-ink text-lg font-extrabold">{title}</p>
        <p className="text-slate-gray mt-1 text-sm font-semibold">{subtitle}</p>
      </div>

      <ul className="space-y-2">
        {lines.map((t, i) => (
          <li key={i} className="text-midnight-ink text-sm font-semibold">
            {t}
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <Button onClick={onClick} variant="outline">
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ApplicantView['status'] }) {
  const label =
    status === 'new'
      ? '신규'
      : status === 'reviewing'
        ? '검토중'
        : status === 'interview'
          ? '면접'
          : '불합격';

  return (
    <span className="bg-pure-white text-midnight-ink border-soft-pebble inline-flex rounded-full border px-3 py-1 text-xs font-extrabold">
      {label}
    </span>
  );
}

/** ------------------ page ------------------ */
export default function CorporateMyPage() {
  const navigate = useNavigate();

  const profileQuery = useQueryLike(fetchCompanyProfile, []);
  const applicantsQuery = useQueryLike(fetchApplicants, []);
  const interviewQuery = useQueryLike(fetchCompanyInterviews, []);

  // applicants filter
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | ApplicantView['status']>('all');

  const filteredApplicants = useMemo(() => {
    const arr = applicantsQuery.data ?? [];
    return arr.filter((a) => {
      const hit =
        a.nickname.toLowerCase().includes(q.toLowerCase()) ||
        a.position.toLowerCase().includes(q.toLowerCase());
      const okStatus = status === 'all' ? true : a.status === status;
      return hit && okStatus;
    });
  }, [applicantsQuery.data, q, status]);

  // calendar
  const [monthPivot, setMonthPivot] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toYmd(new Date()));
  const cells = useMemo(() => buildMonthCells(monthPivot), [monthPivot]);

  const interviewMap = useMemo(() => {
    const m = new Map<string, InterviewEvent[]>();
    (interviewQuery.data ?? []).forEach((ev) => {
      const key = toYmdFromIso(ev.scheduledAt);
      m.set(key, [...(m.get(key) ?? []), ev]);
    });
    return m;
  }, [interviewQuery.data]);

  const selectedEvents = interviewMap.get(selectedDate) ?? [];
  const todayYmd = toYmd(new Date());

  return (
    <div className="bg-pure-white min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        {/* header */}
        <div className="bg-midnight-ink rounded-3xl p-8 text-cloud-dancer shadow-sm">
          <p className="text-cloud-dancer/80 text-sm font-semibold">기업 마이페이지</p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black">
                {profileQuery.isLoading ? '불러오는 중…' : profileQuery.data?.companyName ?? '기업'}
              </h1>
              <p className="text-cloud-dancer/80 mt-2 text-sm font-semibold">
                담당자: {profileQuery.data?.managerName ?? '-'} · {profileQuery.data?.email ?? '-'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => navigate('/jobposts/new')}>공고 등록</Button>
              <Button variant="outline" onClick={() => navigate('/company/edit')}>
                기업 정보 수정
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          {/* 01 */}
          <section className="space-y-6">
            <SectionTitle no="01" title="대시보드" />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <PreviewCard
                title="지원자 이력서 관리"
                subtitle={
                  applicantsQuery.isLoading
                    ? '불러오는 중...'
                    : applicantsQuery.isError
                      ? '불러오기 실패'
                      : `총 ${(applicantsQuery.data ?? []).length}명`
                }
                lines={
                  applicantsQuery.isLoading
                    ? ['• 지원자 목록을 불러오고 있어요...']
                    : applicantsQuery.isError
                      ? ['• 지원자 목록을 불러오지 못했어요.']
                      : (applicantsQuery.data ?? []).length > 0
                        ? (applicantsQuery.data ?? [])
                            .slice(0, 2)
                            .map((a) => `• ${a.nickname} (${a.position}) · ${formatDateTime(a.appliedAt)}`)
                        : ['• 아직 지원자가 없어요']
                }
                actionLabel={applicantsQuery.isError ? '다시 시도' : '전체 보기'}
                onClick={() => (applicantsQuery.isError ? applicantsQuery.refetch() : undefined)}
              />

              <PreviewCard
                title="면접 캘린더"
                subtitle={
                  interviewQuery.isLoading
                    ? '불러오는 중...'
                    : interviewQuery.isError
                      ? '불러오기 실패'
                      : `예정 ${(interviewQuery.data ?? []).length}건`
                }
                lines={
                  interviewQuery.isLoading
                    ? ['• 면접 일정을 불러오는 중...']
                    : interviewQuery.isError
                      ? ['• 면접 일정을 불러오지 못했어요.']
                      : (interviewQuery.data ?? []).length > 0
                        ? (interviewQuery.data ?? [])
                            .slice(0, 2)
                            .map((e) => `• ${formatDateTime(e.scheduledAt)} · ${e.title}`)
                        : ['• 예정된 면접이 없어요']
                }
                actionLabel={interviewQuery.isError ? '다시 시도' : '아래에서 보기'}
                onClick={() => (interviewQuery.isError ? interviewQuery.refetch() : undefined)}
              />
            </div>
          </section>

          {/* 02 */}
          <section className="space-y-6">
            <SectionTitle no="02" title="지원자 목록" />

            <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="이름/포지션 검색"
                  className="border-soft-pebble bg-pure-white text-midnight-ink w-full rounded-xl border px-4 py-3 text-sm font-semibold md:w-72"
                />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="border-soft-pebble bg-pure-white text-midnight-ink rounded-xl border px-4 py-3 text-sm font-semibold"
                >
                  <option value="all">전체 상태</option>
                  <option value="new">신규</option>
                  <option value="reviewing">검토중</option>
                  <option value="interview">면접</option>
                  <option value="rejected">불합격</option>
                </select>
              </div>

              <div className="mt-6 space-y-3">
                {applicantsQuery.isLoading ? (
                  <p className="text-slate-gray text-sm font-semibold">불러오는 중...</p>
                ) : filteredApplicants.length === 0 ? (
                  <p className="text-slate-gray text-sm font-semibold">조건에 맞는 지원자가 없어요.</p>
                ) : (
                  filteredApplicants.map((a) => (
                    <div
                      key={a.id}
                      className="border-soft-pebble bg-pure-white flex flex-col gap-3 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-midnight-ink text-sm font-extrabold">
                          {a.nickname} · {a.position}
                        </p>
                        <p className="text-slate-gray text-xs font-semibold">
                          지원일: {formatDateTime(a.appliedAt)}
                        </p>
                        <p className="text-midnight-ink/80 text-xs font-semibold">
                          {a.highlights.map((h) => `#${h}`).join(' ')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 md:justify-end">
                        <StatusPill status={a.status} />
                        <Button variant="outline" onClick={() => navigate(`/resume/${a.id}`)}>
                          이력서 보기
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* 03 */}
          <section className="space-y-6">
            <SectionTitle no="03" title="캘린더" />

            <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-midnight-ink text-xl font-extrabold">면접 일정</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setMonthPivot((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                    }
                  >
                    이전
                  </Button>
                  <Button variant="outline" onClick={() => setMonthPivot(new Date())}>
                    오늘
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setMonthPivot((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                    }
                  >
                    다음
                  </Button>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                <div>
                  <div className="grid grid-cols-7 gap-3 text-center text-xs font-bold text-slate-gray">
                    {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-3">
                    {cells.map((d, idx) => {
                      const ymd = toYmd(d);
                      const inThisMonth = d.getMonth() === monthPivot.getMonth();
                      const isToday = ymd === todayYmd;
                      const isSelected = ymd === selectedDate;
                      const ev = interviewMap.get(ymd) ?? [];

                      return (
                        <button
                          key={`${ymd}-${idx}`}
                          type="button"
                          onClick={() => setSelectedDate(ymd)}
                          className={[
                            'border-soft-pebble rounded-2xl border p-3 text-left transition',
                            inThisMonth ? 'bg-pure-white' : 'bg-pure-white/50 opacity-60',
                            isSelected ? 'ring-midnight-ink ring-2' : '',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-midnight-ink text-sm font-extrabold">
                              {d.getDate()}
                            </p>
                            {isToday && (
                              <span className="bg-midnight-ink text-cloud-dancer rounded-full px-2 py-0.5 text-[10px] font-black">
                                TODAY
                              </span>
                            )}
                          </div>
                          {ev.length > 0 && (
                            <p className="text-midnight-ink/80 mt-2 text-[11px] font-extrabold">
                              {ev.length}건
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-pure-white rounded-2xl p-6 shadow-sm">
                  <p className="text-midnight-ink text-sm font-extrabold">
                    {selectedDate} 일정
                  </p>
                  <div className="mt-4 space-y-3">
                    {selectedEvents.length === 0 ? (
                      <p className="text-slate-gray text-sm font-semibold">이 날짜엔 일정이 없어요.</p>
                    ) : (
                      selectedEvents.map((e) => (
                        <div key={e.id} className="border-soft-pebble rounded-2xl border p-4">
                          <p className="text-midnight-ink text-sm font-extrabold">{e.title}</p>
                          <p className="text-slate-gray mt-1 text-xs font-semibold">
                            {formatDateTime(e.scheduledAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 text-center text-xs font-semibold text-slate-gray">
          ※ 기업 정보 수정 / 공고 등록 라우트는 프로젝트 라우팅에 맞게 연결만 바꿔주면 돼요.
        </div>
      </div>
    </div>
  );
}
