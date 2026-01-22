// src/pages/CorporateInterviewListPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/Button/Button';
import {
  fetchMyInterviewViewsByStatus,
  type InterviewListStatus,
  type InterviewSessionView,
} from '../api/mockData';

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
} as const;

/** ✅ “지원자: -” 방지용 더미 지원자명(실존 느낌 X) */
const APPLICANT_POOL = [
  '김싸피',
  '이삼성',
  '박코딩',
  '최알고',
  '정버그',
  '오리액트',
  '한타입',
  '윤자바',
  '신파이썬',
  '강깃허브',
  '문도커',
  '배배포',
] as const;

function pickApplicantName(interviewId: number) {
  const idx = Math.abs(interviewId) % APPLICANT_POOL.length;
  return APPLICANT_POOL[idx];
}

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
      const data = (await fetchMyInterviewViewsByStatus(tab)) as CorporateView[];
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
    load();
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
    if (editValue < minEditValue) return; // 안전장치

    const nextIso = localInputToIso(editValue);

    setItems((prev) =>
      prev.map((it) =>
        it.interview_id === editTarget.interview_id ? { ...it, scheduledAt: nextIso } : it,
      ),
    );

    setEditOpen(false);
    setEditTarget(null);
  };

  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <section className="space-y-5">
          {/* 헤더 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">면접 관리</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="filter"
                size="md"
                isActive={tab === 'UPCOMING'}
                className="rounded-2xl border-2"
                onClick={() => setTab('UPCOMING')}
              >
                예정
              </Button>
              <Button
                type="button"
                variant="filter"
                size="md"
                isActive={tab === 'DONE'}
                className="rounded-2xl border-2"
                onClick={() => setTab('DONE')}
              >
                완료
              </Button>
            </div>
          </div>

          {/* ✅ 상태 UI: 로딩 */}
          {isLoading && <ListSkeleton />}

          {/* ✅ 상태 UI: 에러 */}
          {!isLoading && isError && (
            <div className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-sm">
              <p className="text-lg font-black">데이터를 불러오지 못했어요</p>
              <p className="mt-2 text-sm font-semibold text-zinc-500">{errorMessage}</p>
              <div className="mt-6 flex justify-end">
                <Button variant="blue" size="md" className="rounded-2xl" onClick={load}>
                  다시 시도
                </Button>
              </div>
            </div>
          )}

          {/* ✅ 상태 UI: 성공 */}
          {!isLoading && !isError && (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-10 text-center shadow-sm">
                  <p className="text-lg font-black">표시할 면접이 없어요.</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-500">
                    {tab === 'UPCOMING'
                      ? '예정된 면접이 생기면 여기에 쌓입니다.'
                      : '완료된 면접이 아직 없어요.'}
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
                      className="group flex flex-col gap-4 rounded-4xl border border-zinc-100 bg-white p-6 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">
                          {s.postingTitle}
                        </p>

                        <p className="mt-2 truncate text-2xl font-black tracking-tighter">
                          지원자: {applicantName}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
                            {formatDateTime(s.scheduledAt)}
                          </span>
                          <span className="bg-cloud-dancer text-midnight-ink rounded-full px-3 py-1 text-xs font-black">
                            ROOM ·{' '}
                            <span className="font-semibold break-all text-zinc-600">
                              {s.room_id}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* ✅ 버튼 UX:
                          - UPCOMING: 수정(모달) + 입장
                          - DONE: 기록만
                       */}
                      <div className="flex shrink-0 gap-2">
                        {tab === 'UPCOMING' ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="md"
                              className="rounded-2xl"
                              onClick={() => openEditModal(s)}
                            >
                              수정
                            </Button>

                            <Button
                              type="button"
                              variant="blue"
                              size="md"
                              className="rounded-2xl"
                              onClick={() => navigate(ROUTES.lobby(s.interview_id))}
                            >
                              입장
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="md"
                            className="rounded-2xl"
                            onClick={() => alert('TODO: 완료 면접 기록/리포트 페이지')}
                          >
                            기록
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>

      {/* ✅ 면접 시간 수정 모달 */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="bg-midnight-ink/60 absolute inset-0"
            onClick={() => setEditOpen(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setEditOpen(false);
            }}
            aria-label="닫기"
          />

          <div
            className="relative w-full max-w-lg rounded-4xl border border-zinc-100 bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black tracking-[0.35em] text-zinc-400 uppercase">
                  schedule edit
                </p>
                <h2 id="edit-modal-title" className="mt-2 text-xl font-black tracking-tight">
                  {modalTitle}
                </h2>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-zinc-100 bg-zinc-50 p-5">
              <label className="block text-sm font-black" htmlFor="scheduledAt">
                면접 시간
              </label>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                현재: {editTarget ? formatDateTime(editTarget.scheduledAt) : '-'}
              </p>

              <div className="mt-4">
                <input
                  id="scheduledAt"
                  type="datetime-local"
                  value={editValue}
                  min={minEditValue} // ✅ 과거 선택 불가
                  onChange={(e) => setEditValue(e.target.value)}
                  className={[
                    'w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3',
                    'text-sm font-semibold text-zinc-700',
                    'focus:ring-midnight-ink outline-none focus:ring-2',
                  ].join(' ')}
                />

                {isPastSelected ? (
                  <p className="mt-3 text-xs font-semibold text-red-500">
                    과거 시간은 선택할 수 없어요. 현재 이후로 설정해 주세요.
                  </p>
                ) : (
                  <p mt-3 text-xs font-semibold text-red-500></p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="rounded-2xl"
                onClick={() => setEditOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="blue"
                size="md"
                className="rounded-2xl"
                onClick={saveEdit}
                disabled={!editValue || isPastSelected} // ✅ 과거면 저장도 막기
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-4xl border border-zinc-100 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="h-3 w-28 rounded bg-zinc-200/70" />
              <div className="mt-3 h-7 w-72 rounded bg-zinc-200/60" />
              <div className="mt-3 h-4 w-52 rounded bg-zinc-200/50" />
            </div>

            <div className="flex shrink-0 gap-2">
              <div className="h-10 w-20 rounded-2xl bg-zinc-200/60" />
              <div className="h-10 w-20 rounded-2xl bg-zinc-200/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
