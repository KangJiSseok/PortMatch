import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Button from '../../components/Button/Button';
import { fetchJobPostDetail } from '../../api/applyJobPost';

type PageStatus = 'loading' | 'error' | 'notfound' | 'success';
type ApiResult = Awaited<ReturnType<typeof fetchJobPostDetail>>;
type JobPostDetailData = NonNullable<ApiResult>;

// API 데이터 타입 확장
type JobPostWithExtras = JobPostDetailData['jobPost'] & {
  active?: number;
  applied?: boolean; // 백엔드에서 지원 여부를 보내준다고 가정
};

type ResumeItem = {
  id: number;
  title: string;
  isMain: boolean;
  updatedAt: string;
};

type ResumeApiResponse = {
  status: boolean;
  code: number;
  message: string;
  data: ResumeItem[];
};

function formatYmdDot(ymd?: string | null) {
  if (!ymd) return '-';
  return ymd.replaceAll('-', '.');
}

function calculateDDay(deadline?: string | null, active?: number) {
  if (active === 0) return '마감';
  if (!deadline) return '상시채용';

  const end = new Date(`${deadline}T23:59:59`);
  if (isNaN(end.getTime())) return '상시채용';

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

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

function ApplySkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-midnight-ink min-h-screen min-w-7xl bg-white pt-24 pb-20">
      <div className="mx-auto w-7xl px-6">
        <div className="mb-12 flex items-center justify-between">
          <div className="h-10 w-48 animate-pulse rounded bg-zinc-100" />
          <Button type="button" variant="outline" size="md" onClick={onBack}>
            뒤로
          </Button>
        </div>
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-8 space-y-6">
            <div className="h-64 animate-pulse rounded-[40px] bg-zinc-50" />
            <div className="h-96 animate-pulse rounded-[40px] bg-zinc-50" />
          </div>
          <div className="col-span-4">
            <div className="h-80 animate-pulse rounded-[40px] bg-zinc-50" />
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
        <div className="rounded-[40px] border border-zinc-100 bg-white p-10 text-center shadow-sm">
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="w-full max-w-lg rounded-4xl border border-zinc-100 bg-white p-10 shadow-2xl"
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
        >
          <p className="text-midnight-ink text-2xl font-black tracking-tighter">{title}</p>
          {description && <p className="mt-3 text-base font-medium text-zinc-500">{description}</p>}
          <div className="mt-8 flex justify-end gap-3">{actions}</div>
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

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // [추가] 지원 여부 상태 (초기값 false)
  const [hasApplied, setHasApplied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const fetchResumes = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const response = await fetch('/api/resumes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('이력서 목록을 불러오는데 실패했습니다.');

      const json = (await response.json()) as ResumeApiResponse;
      if (json.status && Array.isArray(json.data)) {
        setResumes(json.data);
        if (json.data.length > 0) {
          setSelectedResumeId((prev) => {
            if (prev) return prev;
            const mainResume = json.data.find((r) => r.isMain);
            return mainResume ? mainResume.id : json.data[0].id;
          });
        }
      }

      if (isManual) {
        setToast('이력서 목록을 새로고침했습니다.');
      }
    } catch (err) {
      console.error(err);
      setToast('이력서 목록을 불러오지 못했어요.');
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  const load = useCallback(async () => {
    if (!Number.isFinite(jobPostId)) {
      setStatus('notfound');
      setData(null);
      return;
    }

    setStatus('loading');
    setErrorMessage('지원 정보를 불러오지 못했어요.');

    try {
      const res = await fetchJobPostDetail(jobPostId);
      if (!res || !res.jobPost || !res.company) {
        setStatus('notfound');
        setData(null);
        return;
      }
      setData(res);
      setStatus('success');

      // [추가] 지원 여부 초기화 (백엔드 데이터 기반)
      const jp = res.jobPost as JobPostWithExtras;
      setHasApplied(!!jp.applied);

      fetchResumes(false);
    } catch (err) {
      setStatus('error');
      setData(null);
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    }
  }, [jobPostId, fetchResumes]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // [수정] canApply 로직: 텍스트 의존성 제거 및 상시채용/마감 정확히 판별
  const canApply = useMemo(() => {
    if (!data?.jobPost) return false;

    const jp = data.jobPost as JobPostWithExtras;
    const status = (jp.status ?? 'OPEN').toUpperCase();

    // 1. 공고 상태가 OPEN이 아니면 지원 불가
    if (status !== 'OPEN') return false;

    // 2. active가 0(비활성)이면 지원 불가
    if (jp.active === 0) return false;

    // 3. 상시채용(deadline 없음)이면 지원 가능
    if (!jp.deadline) return true;

    // 4. 마감일 체크 (오늘 날짜와 비교)
    const end = new Date(`${jp.deadline}T23:59:59`);
    const now = new Date();

    // 날짜 형식이 잘못된 경우 -> 상시채용으로 처리
    if (isNaN(end.getTime())) return true;

    // 현재 시간이 마감 시간을 지났으면 지원 불가
    return now <= end;
  }, [data]);

  const submit = async () => {
    if (!Number.isFinite(jobPostId)) return;
    if (isSubmitting) return;

    if (hasApplied) {
      setToast('이미 지원 완료된 공고입니다.');
      return;
    }

    if (!selectedResumeId) {
      setToast('이력서를 먼저 선택해줘!');
      return;
    }
    if (!canApply) {
      setToast('현재 공고 상태/마감일 때문에 지원할 수 없어요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/job-postings/${jobPostId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeId: selectedResumeId }),
      });

      if (!response.ok) {
        throw new Error('지원에 실패했습니다.');
      }

      setHasApplied(true);
      setDoneModalOpen(true);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '지원에 실패했어요. 잠시 후 다시 시도해주세요.';
      setToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // [추가] 지원 취소 함수 (DELETE 요청)
  const cancel = async () => {
    if (!Number.isFinite(jobPostId)) return;
    if (isSubmitting) return;

    if (!confirm('정말 지원을 취소하시겠습니까?')) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/job-postings/${jobPostId}/apply`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('지원 취소에 실패했습니다.');
      }

      setHasApplied(false);
      setToast('지원이 정상적으로 취소되었습니다.');
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '취소에 실패했어요. 잠시 후 다시 시도해주세요.';
      setToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <ApplySkeleton onBack={() => navigate(-1)} />;
  }

  if (status === 'error') {
    return (
      <ErrorBox
        title="지원 정보를 불러오지 못했어요"
        message={errorMessage}
        onRetry={load}
        onBack={() => navigate(-1)}
      />
    );
  }

  if (status === 'notfound' || !data || !data.jobPost || !data.company) {
    return (
      <ErrorBox
        title="공고를 찾을 수 없어요"
        message="상세 페이지에서 다시 시도해 주세요."
        onRetry={load}
        onBack={() => navigate(-1)}
      />
    );
  }

  const { jobPost, company } = data;
  const jp = jobPost as JobPostWithExtras;
  const dday = calculateDDay(jp.deadline, jp.active);
  const ddayColorClass = ddayClass(dday);

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
              지원서 작성
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

        <section className="overflow-hidden rounded-[40px] border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="p-10 lg:p-14">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-silver-mist text-xs font-black tracking-[0.2em] uppercase">
                  JOB
                </p>
                <div className="mt-3">
                  <h2 className="text-midnight-ink text-3xl font-black tracking-tighter">
                    {jobPost.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate(`/companies/${company.id}`)}
                    className="text-slate-gray hover:text-point-blue mt-2 text-lg font-bold transition-colors"
                  >
                    {company.companies_name}
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`${ddayColorClass} text-2xl font-black`}>{dday}</span>
                <span className="text-silver-mist text-sm font-bold">
                  {dday === '상시채용'
                    ? '기한 제한 없음'
                    : `마감 ${formatYmdDot(jobPost.deadline)}`}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-12 grid grid-cols-12 gap-12">
          <div className="col-span-8 space-y-12">
            <section className="rounded-[40px] border border-zinc-200 bg-white p-12 shadow-sm">
              <div className="mb-10 flex items-center justify-between">
                <h2 className="border-point-blue text-midnight-ink border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  이력서 선택
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fetchResumes(true)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? '불러오는 중...' : '목록 새로고침'}
                </Button>
              </div>

              {resumes.length === 0 ? (
                <div className="rounded-3xl bg-zinc-50 py-20 text-center">
                  <p className="text-xl font-black text-zinc-400">선택할 이력서가 없어요.</p>
                  <p className="mt-2 text-sm font-medium text-zinc-400">
                    이력서를 먼저 만들고 돌아와 주세요!
                  </p>
                  <div className="mt-8 flex justify-center">
                    <Button
                      type="button"
                      variant="dark"
                      size="md"
                      onClick={() => navigate('/resumes/me')}
                      className="rounded-xl px-8 py-3 font-bold"
                    >
                      이력서 작성하러 가기
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {resumes.map((r) => {
                    const selected = selectedResumeId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedResumeId(r.id)}
                        className={`group w-full cursor-pointer rounded-3xl border p-8 text-left transition-all duration-300 ${
                          selected
                            ? 'border-point-blue bg-point-blue/5 shadow-inner'
                            : 'border-zinc-200 bg-white hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <span
                                className={`grid h-6 w-6 place-items-center rounded-full border text-xs font-black transition-colors ${
                                  selected
                                    ? 'border-point-blue bg-point-blue text-white'
                                    : 'border-zinc-300 bg-white text-zinc-300 group-hover:border-zinc-400'
                                }`}
                                aria-hidden
                              >
                                ✓
                              </span>
                              <p
                                className={`truncate text-xl font-black transition-colors ${
                                  selected ? 'text-point-blue' : 'text-midnight-ink'
                                }`}
                              >
                                {r.title}
                              </p>
                              {r.isMain && (
                                <span className="bg-slate-gray/10 text-slate-gray rounded-md px-2 py-0.5 text-xs font-bold">
                                  대표
                                </span>
                              )}
                            </div>
                            <p className="mt-2 pl-9 text-xs font-medium text-zinc-400">
                              최종 수정: {new Date(r.updatedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/resumes/${r.id}`);
                              }}
                              className="rounded-lg text-xs"
                            >
                              보기
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="col-span-4">
            <div className="sticky top-24 space-y-5">
              <div className="rounded-[40px] border border-zinc-200 bg-white p-8 shadow-sm">
                <h3 className="mb-6 text-xs font-black tracking-widest text-zinc-400 uppercase">
                  Summary
                </h3>

                <div className="space-y-4">
                  <div className="rounded-3xl bg-zinc-50 p-6">
                    <p className="text-xs font-black text-zinc-400">선택한 이력서</p>
                    <p className="text-midnight-ink mt-2 text-lg font-black tracking-tight">
                      {resumes.find((r) => r.id === selectedResumeId)?.title ?? (
                        <span className="text-zinc-400">선택 안함</span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-zinc-50 p-6">
                    <p className="text-xs font-black text-zinc-400">지원 가능 여부</p>
                    <p
                      className={`mt-2 text-lg font-black ${
                        canApply ? 'text-point-blue' : 'text-zinc-400'
                      }`}
                    >
                      {canApply ? '지원 가능' : '불가 (마감/상태 확인)'}
                    </p>
                  </div>

                  <div
                    className={`rounded-3xl p-6 transition-colors ${
                      hasApplied ? 'bg-blue-50' : 'bg-zinc-50'
                    }`}
                  >
                    <p className="text-xs font-black text-zinc-400">내 지원 상태</p>
                    <p
                      className={`mt-2 text-lg font-black ${
                        hasApplied ? 'text-blue-600' : 'text-zinc-400'
                      }`}
                    >
                      {hasApplied ? '지원 완료 (Applied)' : '미지원'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {/* 상태에 따라 지원 또는 취소 버튼 표시 */}
                  {hasApplied ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full rounded-2xl border-red-100 font-bold text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={cancel}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '처리 중...' : '지원 취소하기'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="blue"
                      size="lg"
                      className={`w-full rounded-2xl py-4 text-lg font-black shadow-lg shadow-blue-500/20 ${
                        !canApply ? 'cursor-not-allowed bg-zinc-400 opacity-50 shadow-none' : ''
                      }`}
                      onClick={submit}
                      disabled={!selectedResumeId || !canApply || isSubmitting}
                    >
                      {isSubmitting ? '제출 중...' : '지원서 제출하기'}
                    </Button>
                  )}

                  {!canApply && !hasApplied && (
                    <p className="text-center text-xs font-medium text-zinc-400">
                      공고 상태 또는 마감일로 인해 제출이 제한됩니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-black text-zinc-800 shadow-2xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {doneModalOpen && data?.jobPost && (
        <Modal
          title="지원서 제출 완료! 🎉"
          description="성공적으로 지원서가 접수되었습니다."
          onClose={() => {
            setDoneModalOpen(false);
            navigate(-1);
          }}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="rounded-xl border-zinc-200 font-bold"
                onClick={() => {
                  setDoneModalOpen(false);
                  navigate(-1);
                }}
              >
                공고로 돌아가기
              </Button>
              <Button
                type="button"
                variant="blue"
                size="md"
                className="rounded-xl font-bold shadow-lg"
                onClick={() => {
                  setDoneModalOpen(false);
                  navigate('/mypage', { replace: true });
                }}
              >
                마이페이지 확인
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
