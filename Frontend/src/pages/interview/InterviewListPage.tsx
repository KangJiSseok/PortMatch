// src/pages/InterviewListPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button/Button';
import {
  fetchMyInterviewViewsByStatus,
  type InterviewListStatus,
  type InterviewSessionView,
} from '../../api/mockData';

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

  const isUpcoming = tab === 'UPCOMING';

  return (
    // ✅ MyPage 방식(해결 1): 문서(body) 자체가 넓어지도록 min-w 고정
    // ✅ 스타일은 CompanyJobManagementPage 톤(큰 글씨/컬러/카드 느낌)으로 맞춤
    <div className="bg-pure-white text-midnight-ink min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        {/* ✅ 헤더(큰 타이틀) */}
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <h1 className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase">
            Interview
          </h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            예정/완료 면접을 한 번에 확인하고 바로 입장하세요.
          </p>
        </header>

        {/* ✅ 섹션 타이틀 + 탭 */}
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <h2 className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap">
                면접 목록
              </h2>
              <span className="text-soft-pebble text-sm font-black tracking-widest whitespace-nowrap uppercase">
                {isUpcoming ? 'UPCOMING' : 'DONE'}
              </span>
            </div>

            {/* ✅ 탭 버튼(글씨 크게/톤 맞춤) */}
            <div className="flex gap-3">
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

          {/* 로딩 */}
          {isLoading && <ListSkeleton />}

          {/* 에러 */}
          {!isLoading && isError && (
            <div className="border-silver-mist bg-pure-white rounded-4xl border p-10 shadow-sm">
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
                  className="rounded-2xl px-8 shadow-lg"
                  onClick={load}
                >
                  다시 시도
                </Button>
              </div>
            </div>
          )}

          {/* 성공 */}
          {!isLoading && !isError && (
            <div className="grid gap-6">
              {items.length === 0 ? (
                <div className="border-silver-mist bg-pure-white rounded-[40px] border-2 border-dashed py-24 text-center">
                  <div className="mb-4 text-6xl opacity-20">🗓️</div>
                  <p className="text-soft-pebble text-xl font-black italic">
                    표시할 면접이 없습니다.
                  </p>
                  <p className="text-slate-gray mt-3 text-base font-bold opacity-40">
                    면접 일정이 잡히면 여기에 자동으로 나타나요.
                  </p>
                </div>
              ) : (
                items.map((s) => (
                  <div
                    key={s.interview_id}
                    className="border-silver-mist bg-pure-white flex min-w-full items-center justify-between rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50"
                  >
                    {/* LEFT */}
                    <div className="min-w-0">
                      <div className="mb-4 flex items-center gap-3">
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

                        <span className="text-soft-pebble text-sm font-black tracking-widest whitespace-nowrap uppercase">
                          {s.companyName}
                        </span>
                      </div>

                      <h3 className="text-midnight-ink truncate text-2xl font-black tracking-tight">
                        {s.postingTitle}
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
                        <Button
                          type="button"
                          variant="dark"
                          size="lg"
                          className="rounded-2xl px-10 shadow-xl"
                          onClick={() => navigate(ROUTES.lobby(s.interview_id))}
                        >
                          입장하기
                        </Button>
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
    <div className="grid gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="border-silver-mist bg-pure-white animate-pulse rounded-4xl border p-8 shadow-sm"
        >
          <div className="flex items-center justify-between gap-8">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-6 w-20 rounded-full bg-zinc-200/60" />
                <div className="h-4 w-28 rounded bg-zinc-200/50" />
              </div>

              <div className="mt-5 h-8 w-3/4 rounded bg-zinc-200/60" />

              <div className="mt-5 flex items-center gap-3">
                <div className="h-7 w-44 rounded-full bg-zinc-200/50" />
                <div className="h-7 w-56 rounded-full bg-zinc-200/40" />
              </div>
            </div>

            <div className="h-12 w-32 rounded-2xl bg-zinc-200/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
