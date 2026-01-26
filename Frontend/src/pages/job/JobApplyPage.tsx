// src/pages/JobApplyPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Button from '../../components/Button/Button';
import { fetchJobPostDetail } from '../../api/jobPosts';

type PageStatus = 'loading' | 'error' | 'notfound' | 'success';
type ApiResult = Awaited<ReturnType<typeof fetchJobPostDetail>>;
type JobPostDetailData = NonNullable<ApiResult>;

type ResumeLite = {
  id: string;
  title: string;
  experienceCount?: number;
  educationCount?: number;
};

type StoredApplication = {
  jobPostId: number;
  resumeId: string;
  appliedAt: string; // ISO
};

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

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadResumesFromLocalStorage(): ResumeLite[] {
  const raw = localStorage.getItem('resumes');
  if (raw) {
    try {
      const record = JSON.parse(raw) as Record<string, any>;
      const list = Object.values(record)
        .filter((v) => v && typeof v === 'object')
        .map((v) => {
          const id = String(v.id ?? '');
          const title = String(v.title ?? '이력서');
          const experienceCount = Array.isArray(v.experience) ? v.experience.length : undefined;
          const educationCount = Array.isArray(v.education) ? v.education.length : undefined;
          return { id, title, experienceCount, educationCount } satisfies ResumeLite;
        })
        .filter((v) => v.id.trim().length > 0);

      if (list.length > 0) return list;
    } catch {
      // ignore
    }
  }

  return [
    { id: 'frontend', title: '프론트엔드 이력서' },
    { id: 'backend', title: '백엔드 이력서' },
  ];
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-[20px] border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="h-6 w-48 rounded bg-zinc-200" />
      <div className="mt-4 h-10 w-72 rounded bg-zinc-50" />
      <div className="mt-6 h-11 rounded-xl bg-zinc-100" />
    </div>
  );
}

function Modal({
  title,
  description,
  onClose,
  actions,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  actions: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="w-full max-w-lg rounded-[24px] border border-zinc-100 bg-white p-8 shadow-xl"
          initial={{ y: 16, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 16, opacity: 0, scale: 0.98 }}
        >
          <p className="text-midnight-ink text-xl font-black tracking-tighter">{title}</p>
          {description && <p className="mt-2 text-sm font-medium text-zinc-500">{description}</p>}
          <div className="mt-6 flex justify-end gap-2">{actions}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function JobApplyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const jobPostId = Number(id);

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('지원 정보를 불러오지 못했어요.');
  const [data, setData] = useState<JobPostDetailData | null>(null);

  const [resumes, setResumes] = useState<ResumeLite[]>(() => loadResumesFromLocalStorage());
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(() => {
    const list = loadResumesFromLocalStorage();
    return list[0]?.id ?? null;
  });

  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const load = async () => {
    if (!Number.isFinite(jobPostId)) {
      setStatus('notfound');
      setData(null);
      return;
    }

    setStatus('loading');
    setErrorMessage('지원 정보를 불러오지 못했어요.');

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const canApply = useMemo(() => {
    if (!data) return false;
    const { jobPost } = data;
    const st = (jobPost.status ?? 'OPEN').toUpperCase();
    const d = calcDday(jobPost.deadline);
    if (st !== 'OPEN') return false;
    if (d === '마감') return false;
    return true;
  }, [data]);

  const refreshResumes = () => {
    const next = loadResumesFromLocalStorage();
    setResumes(next);

    setSelectedResumeId((prev) => {
      if (!next.length) return null;
      if (!prev) return next[0].id;
      return next.some((r) => r.id === prev) ? prev : next[0].id;
    });

    setToast('이력서 목록을 새로 불러왔어요.');
  };

  const submit = () => {
    if (!Number.isFinite(jobPostId)) return;

    if (!selectedResumeId) {
      setToast('이력서를 먼저 선택해줘!');
      return;
    }
    if (!canApply) {
      setToast('현재 공고 상태/마감일 때문에 지원할 수 없어요.');
      return;
    }

    const key = 'jobApplications';
    const prev = safeParseJson<StoredApplication[]>(localStorage.getItem(key), []);

    const next: StoredApplication[] = [
      ...prev.filter((a) => a.jobPostId !== jobPostId),
      { jobPostId, resumeId: selectedResumeId, appliedAt: new Date().toISOString() },
    ];

    localStorage.setItem(key, JSON.stringify(next));
    setDoneModalOpen(true);
  };

  // ✅ 가로 스크롤: body 자체가 넓어지도록 root/min-w + container/w 고정
  const Root = ({ children }: { children: React.ReactNode }) => (
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-32 pb-20">
      <div className="mx-auto w-[1280px] px-6">{children}</div>
    </div>
  );

  if (status === 'loading') {
    return (
      <Root>
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-midnight-ink text-2xl font-black tracking-tighter">지원서 작성</h2>
            <p className="text-sm font-medium text-zinc-500">
              이력서를 선택하고 지원서를 제출해요.
            </p>
          </div>
          <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>
            뒤로
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-1">
            <CardSkeleton />
          </div>
        </div>
      </Root>
    );
  }

  if (status === 'error') {
    return (
      <Root>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[24px] border border-zinc-100 bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-black">지원 정보를 불러오지 못했어요</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">{errorMessage}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>
                뒤로
              </Button>
              <Button type="button" variant="dark" size="md" onClick={load}>
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      </Root>
    );
  }

  if (status === 'notfound' || !data) {
    return (
      <Root>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-10 text-center shadow-sm">
            <p className="text-xl font-black">공고를 찾을 수 없어요</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              상세 페이지에서 다시 시도해 주세요.
            </p>
            <div className="mt-6 flex justify-center">
              <Button type="button" variant="dark" size="md" onClick={() => navigate(-1)}>
                뒤로
              </Button>
            </div>
          </div>
        </div>
      </Root>
    );
  }

  const { jobPost, company } = data;
  const dday = calcDday(jobPost.deadline);

  return (
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-26 pb-20">
      <div className="mx-auto w-[1280px] px-6">
        {/* 상단 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-midnight-ink text-2xl font-black tracking-tighter">지원서 작성</h2>
          </div>
        </div>

        {/* 요약 헤더 */}
        <section className="rounded-[20px] border border-zinc-100 bg-zinc-50 p-8 shadow-sm">
          <p className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">JOB</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-midnight-ink text-2xl font-black tracking-tighter">
                {jobPost.title}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/companies/${company.id}`)}
                className="hover:text-point-blue mt-1 text-sm font-black text-zinc-600 transition-colors"
              >
                {company.companies_name}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-black text-zinc-700">
                {dday} · 마감 {formatYmdDot(jobPost.deadline)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate(`/job-posts/${jobPost.id}`)}
              >
                공고로 돌아가기
              </Button>
            </div>
          </div>
        </section>

        {/* 본문 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* 이력서 선택 */}
          <div className="lg:col-span-2">
            <section className="rounded-[20px] border border-zinc-100 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-midnight-ink text-xl font-black tracking-tighter">
                  이력서 선택
                </h3>
                <Button type="button" variant="outline" size="md" onClick={refreshResumes}>
                  목록 새로고침
                </Button>
              </div>

              {resumes.length === 0 ? (
                <div className="mt-6 rounded-xl bg-zinc-50 p-10 text-center">
                  <p className="text-lg font-black">선택할 이력서가 없어요.</p>
                  <p className="mt-2 text-sm font-medium text-zinc-500">
                    이력서를 먼저 만들고 돌아와 주세요!
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Button
                      type="button"
                      variant="dark"
                      size="md"
                      onClick={() => navigate('/resumes/frontend')}
                    >
                      이력서 작성/수정
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {resumes.map((r) => {
                    const selected = selectedResumeId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedResumeId(r.id)}
                        className={`w-full rounded-2xl border p-5 text-left transition ${
                          selected
                            ? 'border-point-blue/40 bg-point-blue/5 shadow-sm'
                            : 'border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <span
                                className={`grid h-6 w-6 place-items-center rounded-full border text-xs font-black ${
                                  selected
                                    ? 'border-point-blue bg-point-blue text-white'
                                    : 'border-zinc-300 bg-white text-zinc-600'
                                }`}
                                aria-hidden
                              >
                                ✓
                              </span>
                              <p className="text-midnight-ink truncate text-base font-black">
                                {r.title}
                              </p>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {typeof r.experienceCount === 'number' && (
                                <span className="rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-black text-zinc-700">
                                  경력 {r.experienceCount}개
                                </span>
                              )}
                              {typeof r.educationCount === 'number' && (
                                <span className="rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-black text-zinc-700">
                                  학력 {r.educationCount}개
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="md"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/resumes/${r.id}`);
                              }}
                            >
                              보기
                            </Button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* 제출 요약/CTA */}
          <aside className="lg:col-span-1">
            <div className="sticky top-32 rounded-[20px] border border-zinc-100 bg-white p-6 shadow-sm">
              <p className="text-midnight-ink text-lg font-black tracking-tighter">제출 요약</p>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <p className="text-xs font-black text-zinc-400">선택한 이력서</p>
                  <p className="mt-1 text-sm font-black text-zinc-800">
                    {selectedResumeId ?? '선택 없음'}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-50 px-4 py-3">
                  <p className="text-xs font-black text-zinc-400">지원 가능 여부</p>
                  <p
                    className={`mt-1 text-sm font-black ${canApply ? 'text-zinc-800' : 'text-zinc-500'}`}
                  >
                    {canApply ? '가능' : '불가(마감/상태 확인)'}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Button
                  type="button"
                  variant="blue"
                  size="lg"
                  className="w-full rounded-2xl"
                  onClick={submit}
                  disabled={!selectedResumeId || !canApply}
                >
                  지원서 제출
                </Button>
                {!canApply && (
                  <p className="mt-2 text-xs font-medium text-zinc-500">
                    공고 상태/마감일 때문에 제출이 비활성화돼요.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-black text-zinc-800 shadow-lg"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done modal */}
      {doneModalOpen && (
        <Modal
          title="지원서 제출 완료!"
          description=""
          onClose={() => {
            setDoneModalOpen(false);
            navigate(`/job-posts/${jobPost.id}`);
          }}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setDoneModalOpen(false);
                  navigate(`/job-posts/${jobPost.id}`);
                }}
              >
                공고로 돌아가기
              </Button>
              <Button
                type="button"
                variant="blue"
                size="md"
                onClick={() => {
                  setDoneModalOpen(false);
                  navigate('/mypage');
                }}
              >
                마이페이지로
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
