// src/pages/InterviewListPage.tsx
import { useEffect, useState } from 'react';
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

const ROUTES = {
  list: '/interviews',
  lobby: (id: number) => `/interviews/${id}/lobby`,
  mypage: '/mypage',
} as const;

export default function InterviewListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<InterviewListStatus>('UPCOMING');

  const [items, setItems] = useState<InterviewSessionView[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('면접 목록을 불러오지 못했어요.');

  const load = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('면접 목록을 불러오지 못했어요.');

    try {
      const data = await fetchMyInterviewViewsByStatus(tab);
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

  return (
    // ✅ [해결 1 방식] body 자체가 넓어지도록 root에 min-w 고정
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-32 pb-20">
      {/* ✅ 캔버스 고정 폭 */}
      <div className="mx-auto w-[1280px] space-y-10 px-6">
        {/* 탭 + 리스트 */}
        <section className="space-y-5">
          {/* ✅ 반응형 제거: flex-wrap 금지 */}
          <div className="flex flex-nowrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">면접 목록</h2>
            </div>

            <div className="flex gap-2">
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

          {isLoading && <ListSkeleton />}

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

          {!isLoading && !isError && (
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-10 text-center shadow-sm">
                  <p className="text-lg font-black">표시할 면접이 없어요.</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-500">
                    면접 일정이 잡히면 여기로 쏙 들어옵니다.
                  </p>
                </div>
              ) : (
                items.map((s) => (
                  <div
                    key={s.interview_id}
                    className={
                      // ✅ 반응형 제거: md:flex-row 같은 거 금지 → 무조건 row 고정
                      'group flex items-center justify-between gap-4 rounded-4xl border border-zinc-100 bg-white p-6 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md'
                    }
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">
                        {s.companyName}
                      </p>
                      <p className="mt-2 truncate text-2xl font-black tracking-tighter">
                        {s.postingTitle}
                      </p>
                      {/* ✅ 반응형 제거: wrap은 유지해도 “배치 변경”은 아니라서 OK
                          (좁아지면 줄바꿈은 생길 수 있음. 줄바꿈도 싫으면 flex-nowrap로 바꿔줘) */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
                          {formatDateTime(s.scheduledAt)}
                        </span>
                        <span className="bg-cloud-dancer text-midnight-ink rounded-full px-3 py-1 text-xs font-black">
                          ROOM ·{' '}
                          <span className="font-semibold break-all text-zinc-600">{s.room_id}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {tab === 'UPCOMING' ? (
                        <Button
                          type="button"
                          variant="blue"
                          size="md"
                          className="rounded-2xl"
                          onClick={() => navigate(ROUTES.lobby(s.interview_id))}
                        >
                          입장
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
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
          {/* ✅ 반응형 제거: md:flex-row 금지 → 무조건 row 고정 */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="h-3 w-24 rounded bg-zinc-200/70" />
              <div className="mt-3 h-7 w-72 rounded bg-zinc-200/60" />
              <div className="mt-3 h-4 w-48 rounded bg-zinc-200/50" />
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
