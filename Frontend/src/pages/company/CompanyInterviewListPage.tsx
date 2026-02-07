// src/pages/CompanyInterviewListPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import Button from '../../components/Button/Button';
import {
  fetchCompanyInterviewViewsByStatus,
  type InterviewListStatus,
  type InterviewSessionView,
} from '../../api/interview';
import { updateInterviewSchedule } from '../../api/interview/update';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}


// ???�재 ?�각(�??�위) -> datetime-local min �?

type CorporateView = InterviewSessionView & {
  applicantName?: string;
};

const ROUTES = {
  list: '/interviews',
  lobby: (id: number) => `/interviews/${id}/lobby`,
  interviewTemplate: '/support/interview-template',
} as const;

export default function CorporateInterviewListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<InterviewListStatus>('UPCOMING');

  const [items, setItems] = useState<CorporateView[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('면접 목록??불러?��? 못했?�요.');
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // ???�정 모달 ?�태

  const load = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('면접 목록??불러?��? 못했?�요.');

    try {
      const data = (await fetchCompanyInterviewViewsByStatus(tab)) as CorporateView[];
      setItems(data);
    } catch (err) {
      setItems([]);
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : '?????�는 ?�류가 발생?�어??');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ??모달 ?�릴 ?? ?�크�??�금 + ESC ?�기 + min 최신 ?��?

  const isUpcoming = tab === 'UPCOMING';


  const handleCancel = async (s: CorporateView) => {
    if (cancelingId !== null) return;
    const ok = window.confirm('?�당 면접??취소?�시겠습?�까?');
    if (!ok) return;

    setCancelingId(s.interview_id);
    try {
      await updateInterviewSchedule(s.interview_id, { status: 'CANCELED' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : '면접 취소???�패?�습?�다.');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    // ??가�??�크�?고정?? CompanyJobManagementPage ??그�?�?
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        {/* ???�더(?�쪽 ?��? ?�인 + ???�?��?) */}
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
                면접 ?�정??관리하�?바로 ?�장/?�정까�? 처리?�세??
              </p>
            </div>

            {/* 면접 ?�플�??�동 버튼 */}
            <div className="shrink-0">
              <Button
                type="button"
                variant="blue"
                size="lg"
                className="rounded-2xl px-8 shadow-xl"
                onClick={() => navigate(ROUTES.interviewTemplate)}
              >
                면접 ?�플�??�동
              </Button>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {/* ???�션 ?�?��? + ??*/}
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
                ?�정
              </Button>
              <Button
                type="button"
                variant="filter"
                size="lg"
                isActive={tab === 'DONE'}
                className="rounded-2xl border-2 px-8 text-base font-black"
                onClick={() => setTab('DONE')}
              >
                ?�료
              </Button>
            </div>
          </div>

          {/* ??로딩 */}
          {isLoading && <ListSkeleton />}

          {/* ???�러 */}
          {!isLoading && isError && (
            <div className="border-silver-mist bg-pure-white rounded-[40px] border p-10 shadow-sm">
              <p className="text-midnight-ink text-2xl font-black tracking-tight">
                ?�이?��? 불러?��? 못했?�요
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
                  ?�시 ?�도
                </Button>
              </div>
            </div>
          )}

          {/* ???�공 */}
          {!isLoading && !isError && (
            <div className="grid gap-6">
              {items.length === 0 ? (
                <div className="border-silver-mist bg-pure-white rounded-[40px] border-2 border-dashed py-32 text-center">
                  <div className="mb-4 text-6xl opacity-20">?��</div>
                  <p className="text-soft-pebble text-xl font-black italic">
                    {isUpcoming ? '?�정??면접???�습?�다.' : '?�료??면접???�습?�다.'}
                  </p>
                  <p className="text-slate-gray mt-3 text-base font-bold opacity-40">
                    ?�정???�성?�면 ?�기???�동?�로 ?��??�요.
                  </p>
                </div>
              ) : (
                items.map((s) => {
                  const applicantName = s.applicantName?.trim()
                    ? s.applicantName
                    : '미확??지?�자';

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
                            {isUpcoming ? '?�정' : '?�료'}
                          </span>

                          <span className="text-slate-gray text-sm font-black tracking-widest whitespace-nowrap uppercase">
                            {s.postingTitle}
                          </span>
                        </div>

                        <h3 className="text-midnight-ink mt-4 truncate text-2xl font-black tracking-tight">
                          지?�자: {applicantName}
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
                              variant="outline"
                              size="lg"
                              className="rounded-2xl px-8"
                              disabled={cancelingId === s.interview_id}
                              onClick={() => void handleCancel(s)}
                            >
                              {cancelingId === s.interview_id ? '취소 중입니다' : '면접 취소'}
                            </Button>

                            <Button
                              type="button"
                              variant="dark"
                              size="lg"
                              className="rounded-2xl px-10 shadow-xl"
                              onClick={() => navigate(ROUTES.lobby(s.interview_id))}
                            >
                              {'\uB85C\uBE44 \uC785\uC7A5'}
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
                            ?�인
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
