// src/pages/CompanyInterviewListPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Button from '../../components/Button/Button';
import {
  fetchCompanyInterviewViewsByStatus,
  type InterviewListStatus,
  type InterviewSessionView,
} from '../../api/interview';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

// datetime-local value 만들기: YYYY-MM-DDTHH:mm
function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// datetime-local(YYYY-MM-DDTHH:mm) -> ISO 문자열
function localInputToIso(value: string) {
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return new Date().toISOString();

  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mi] = timePart.split(':').map(Number);

  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mi ?? 0, 0);
  return dt.toISOString();
}

// ✅ 현재 시각(분 단위) -> datetime-local min 값
function nowLocalMinValue() {
  const d = new Date();
  d.setSeconds(0, 0);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

type CorporateView = InterviewSessionView & {
  applicantName?: string;
};

const ROUTES = {
  list: '/interviews',
  lobby: (id: number) => `/interviews/${id}/lobby`,
  // ✅ 테스트 로비 라우트 추가 (앞에 "/" 필수)
  test: (id: number) => `/interviews/test/${id}/lobby`,
} as const;

// ✅ 실명 느낌 없이: “지원자 01~”
function pickApplicantName(interviewId: number) {
  const n = (Math.abs(interviewId) % 99) + 1;
  return `지원자 ${String(n).padStart(2, '0')}`;
}

// ✅ 테스트 고정 세션(InterviewPage랑 동일하게 맞추기)
const DUMMY_SESSION = 'ses_dummy_test_001';

export default function CorporateInterviewListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<InterviewListStatus>('UPCOMING');

  const [items, setItems] = useState<CorporateView[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('면접 목록을 불러오지 못했어요.');

  // ✅ 수정 모달 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CorporateView | null>(null);
  const [editValue, setEditValue] = useState(''); // datetime-local 값
  const [minEditValue, setMinEditValue] = useState(nowLocalMinValue()); // ✅ 과거 선택 막기

  const load = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('면접 목록을 불러오지 못했어요.');

    try {
      const data = (await fetchCompanyInterviewViewsByStatus(tab)) as CorporateView[];
      setItems(data);
    } catch (err) {
      setItems([]);
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ✅ 모달 열릴 때: 스크롤 잠금 + ESC 닫기 + min 최신 유지
  useEffect(() => {
    if (!editOpen) return;

    setMinEditValue(nowLocalMinValue());
    const t = window.setInterval(() => {
      setMinEditValue(nowLocalMinValue());
    }, 30_000);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearInterval(t);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [editOpen]);

  const openEditModal = (s: CorporateView) => {
    const minNow = nowLocalMinValue();
    const initial = toLocalInputValue(s.scheduledAt);

    setEditTarget(s);
    // ✅ 기존 시간이 과거면 자동으로 현재(min)로 보정
    setEditValue(initial < minNow ? minNow : initial);

    setMinEditValue(minNow);
    setEditOpen(true);
  };

  const isPastSelected = !!editValue && editValue < minEditValue;

  const modalTitle = useMemo(() => {
    if (!editTarget) return '면접 시간 수정';
    const applicantName = editTarget.applicantName?.trim()
      ? editTarget.applicantName
      : pickApplicantName(editTarget.interview_id);

    return `${applicantName} · 면접 시간 수정`;
  }, [editTarget]);

  const saveEdit = () => {
    if (!editTarget) return;
    if (!editValue) return;
    if (editValue < minEditValue) return;

    const nextIso = localInputToIso(editValue);

    setItems((prev) =>
      prev.map((it) =>
        it.interview_id === editTarget.interview_id ? { ...it, scheduledAt: nextIso } : it,
      ),
    );

    setEditOpen(false);
    setEditTarget(null);
  };

  const isUpcoming = tab === 'UPCOMING';

  // ✅ 테스트 로비로 이동 (TestInterviewLobbyPage.tsx 라우트로!)
  const goTestLobby = () => {
    navigate(ROUTES.test(0), {
      state: {
        sessionId: DUMMY_SESSION,
        initialMicOn: false,
        initialCamOn: false,

        // (선택) 테스트 화면에 텍스트 채워 넣기
        companyName: 'TEST',
        postingTitle: 'INTERVIEW MANAGEMENT TEST',
        scheduledAt: new Date().toISOString(),
      },
    });
  };

  return (
    // ✅ 가로 스크롤/고정폭: CompanyJobManagementPage 톤 그대로
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        {/* ✅ 헤더(왼쪽 파란 라인 + 큰 타이틀) */}
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
              >
                Interview Management
              </motion.h1>
              <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
                면접 일정을 관리하고 바로 입장/수정까지 처리하세요.
              </p>
            </div>

            {/* ✅ 테스트 로비 입장 버튼 */}
            <div className="shrink-0">
              <Button
                type="button"
                variant="blue"
                size="lg"
                className="rounded-2xl px-8 shadow-xl"
                onClick={goTestLobby}
              >
                테스트 로비 입장
              </Button>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {/* ✅ 섹션 타이틀 + 탭 */}
          <div className="mb-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <h2 className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap">
                면접 목록
              </h2>
              <span className="text-soft-pebble text-sm font-black tracking-widest whitespace-nowrap uppercase">
                {isUpcoming ? 'UPCOMING' : 'DONE'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="filter"
                size="lg"
                isActive={tab === 'UPCOMING'}
                className="rounded-2xl border-2 px-8 text-base font-black"
                onClick={() => setTab('UPCOMING')}
              >
                예정
              </Button>
              <Button
                type="button"
                variant="filter"
                size="lg"
                isActive={tab === 'DONE'}
                className="rounded-2xl border-2 px-8 text-base font-black"
                onClick={() => setTab('DONE')}
              >
                완료
              </Button>
            </div>
          </div>

          {/* ✅ 로딩 */}
          {isLoading && <ListSkeleton />}

          {/* ✅ 에러 */}
          {!isLoading && isError && (
            <div className="border-silver-mist bg-pure-white rounded-[40px] border p-10 shadow-sm">
              <p className="text-midnight-ink text-2xl font-black tracking-tight">
                데이터를 불러오지 못했어요
              </p>
              <p className="text-slate-gray mt-3 text-base leading-relaxed font-bold opacity-60">
                {errorMessage}
              </p>
              <div className="mt-8 flex justify-end">
                <Button
                  variant="blue"
                  size="lg"
                  className="rounded-2xl px-8 shadow-xl"
                  onClick={() => void load()}
                >
                  다시 시도
                </Button>
              </div>
            </div>
          )}

          {/* ✅ 성공 */}
          {!isLoading && !isError && (
            <div className="grid gap-6">
              {items.length === 0 ? (
                <div className="border-silver-mist bg-pure-white rounded-[40px] border-2 border-dashed py-32 text-center">
                  <div className="mb-4 text-6xl opacity-20">📅</div>
                  <p className="text-soft-pebble text-xl font-black italic">
                    {isUpcoming ? '예정된 면접이 없습니다.' : '완료된 면접이 없습니다.'}
                  </p>
                  <p className="text-slate-gray mt-3 text-base font-bold opacity-40">
                    일정이 생성되면 여기에 자동으로 나타나요.
                  </p>
                </div>
              ) : (
                items.map((s) => {
                  const applicantName = s.applicantName?.trim()
                    ? s.applicantName
                    : pickApplicantName(s.interview_id);

                  return (
                    <div
                      key={s.interview_id}
                      className="border-silver-mist bg-pure-white flex min-w-full items-center justify-between rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50"
                    >
                      {/* LEFT */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              'shrink-0 rounded-full px-4 py-1 text-xs font-black tracking-tight',
                              isUpcoming
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-cloud-dancer text-slate-gray',
                            ].join(' ')}
                          >
                            {isUpcoming ? '예정' : '완료'}
                          </span>

                          <span className="text-slate-gray text-sm font-black tracking-widest whitespace-nowrap uppercase">
                            {s.postingTitle}
                          </span>
                        </div>

                        <h3 className="text-midnight-ink mt-4 truncate text-2xl font-black tracking-tight">
                          지원자: {applicantName}
                        </h3>

                        <div className="mt-4 flex items-center gap-3">
                          <span className="rounded-full bg-zinc-100 px-4 py-1 text-sm font-black text-zinc-700">
                            {formatDateTime(s.scheduledAt)}
                          </span>

                          <span className="bg-cloud-dancer text-midnight-ink rounded-full px-4 py-1 text-sm font-black">
                            ROOM ·{' '}
                            <span className="text-slate-gray font-bold break-all opacity-70">
                              {s.room_id}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex shrink-0 items-center gap-3">
                        {isUpcoming ? (
                          <>
                            <Button
                              type="button"
                              variant="light"
                              size="md"
                              className="rounded-xl px-6"
                              onClick={() => openEditModal(s)}
                            >
                              수정
                            </Button>

                            <Button
                              type="button"
                              variant="dark"
                              size="lg"
                              className="rounded-2xl px-10 shadow-xl"
                              onClick={() => navigate(ROUTES.lobby(s.interview_id))}
                            >
                              입장하기
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="light"
                            size="lg"
                            className="rounded-2xl px-10"
                            onClick={() => navigate(ROUTES.list)}
                          >
                            확인
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </motion.div>

        {/* ✅ 면접 시간 수정 모달 */}
        <AnimatePresence>
          {editOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditOpen(false)}
                className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-pure-white relative w-full max-w-md overflow-hidden rounded-[40px] p-10 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                <div className="text-point-blue mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v6l3 2" />
                  </svg>
                </div>

                <h3 className="text-midnight-ink mb-2 text-2xl font-black tracking-tight">
                  {modalTitle}
                </h3>

                <p className="text-slate-gray mb-8 leading-relaxed font-bold opacity-60">
                  현재:{' '}
                  <span className="font-black">
                    {editTarget ? formatDateTime(editTarget.scheduledAt) : '-'}
                  </span>
                  <br />
                  변경할 시간을 선택하세요. (과거는 선택 불가)
                </p>

                <div className="text-left">
                  <label
                    className="text-midnight-ink mb-2 block text-sm font-black"
                    htmlFor="scheduledAt"
                  >
                    면접 시간
                  </label>

                  <input
                    id="scheduledAt"
                    type="datetime-local"
                    value={editValue}
                    min={minEditValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={[
                      'w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3',
                      'text-base font-bold text-zinc-700',
                      'focus:ring-midnight-ink outline-none focus:ring-2',
                    ].join(' ')}
                  />

                  {isPastSelected ? (
                    <p className="mt-3 text-sm font-bold text-red-500">
                      과거 시간은 선택할 수 없어요. 현재 이후로 설정해 주세요.
                    </p>
                  ) : (
                    <p className="mt-3 text-sm font-bold text-zinc-400 opacity-60">
                      저장하면 즉시 목록에 반영됩니다.
                    </p>
                  )}
                </div>

                <div className="mt-10 flex gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 rounded-2xl"
                    onClick={() => setEditOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    variant="blue"
                    size="lg"
                    className="flex-1 rounded-2xl shadow-lg"
                    onClick={saveEdit}
                    disabled={!editValue || isPastSelected}
                  >
                    저장하기
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="border-silver-mist bg-pure-white animate-pulse rounded-4xl border p-8 shadow-sm"
        >
          <div className="flex items-center justify-between gap-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-6 w-20 rounded-full bg-zinc-200/60" />
                <div className="h-4 w-40 rounded bg-zinc-200/50" />
              </div>

              <div className="mt-5 h-8 w-3/4 rounded bg-zinc-200/60" />

              <div className="mt-5 flex items-center gap-3">
                <div className="h-7 w-44 rounded-full bg-zinc-200/50" />
                <div className="h-7 w-56 rounded-full bg-zinc-200/40" />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="h-10 w-20 rounded-xl bg-zinc-200/60" />
              <div className="h-12 w-32 rounded-2xl bg-zinc-200/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
