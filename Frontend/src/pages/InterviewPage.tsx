// src/pages/InterviewPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import Button from '../components/Button/Button';
import { fetchMyInterviewViewById, type InterviewSessionView } from '../api/mockData';

type RoomNavState = {
  micOn?: boolean;
  camOn?: boolean;
};

type PageStatus = 'loading' | 'error' | 'notfound' | 'success';
type UserRole = 'guest' | 'individual' | 'corporate';

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
} as const;

function RoomHeader({
  subtitle,
  tags,
  onBackToLobby,
  onExit,
}: {
  subtitle: string;
  tags?: React.ReactNode;
  onBackToLobby: () => void;
  onExit: () => void;
}) {
  return (
    <header className="border-b border-zinc-100 pb-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <p className="text-xs font-black tracking-[0.35em] text-zinc-400 uppercase">
              interview room
            </p>
          </div>

          <p className="mt-4 truncate text-lg font-bold text-zinc-600 sm:text-xl">{subtitle}</p>

          {tags ? <div className="mt-4 flex flex-wrap items-center gap-2">{tags}</div> : null}
        </div>

        {/* ✅ 버튼은 헤더에만: 나가기 (중복 제거) */}
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="red" size="md" className="rounded-2xl" onClick={onExit}>
            나가기
          </Button>
        </div>
      </div>
    </header>
  );
}

function VideoPanel({
  title,
  desc,
  label,
  heightClass,
}: {
  title: string;
  desc: string;
  label: string;
  heightClass: string;
}) {
  return (
    <section className="rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm">
      <h2 className="text-lg font-black tracking-tight">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-zinc-500">{desc}</p>

      <div className="mt-6 overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="bg-point-blue/60 inline-flex h-2 w-2 rounded-full" />
            <p className="text-sm font-black text-zinc-600">{label}</p>
          </div>
          <span className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">live</span>
        </div>

        <div className={`bg-midnight-ink flex items-center justify-center ${heightClass}`}>
          <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
            {label}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ role 분기 (로비에서 했던 방식 그대로)
  const role = ((localStorage.getItem('userRole') ?? 'guest') as UserRole) || 'guest';
  const isCorporate = role === 'corporate';

  const navState = (location.state ?? {}) as RoomNavState;

  const initialMicOn = typeof navState.micOn === 'boolean' ? navState.micOn : true;
  const initialCamOn = typeof navState.camOn === 'boolean' ? navState.camOn : false;

  const [micOn, setMicOn] = useState(initialMicOn);
  const [camOn, setCamOn] = useState(initialCamOn);

  const interviewId = Number(id);
  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('면접방 정보를 불러오지 못했어요.');
  const [session, setSession] = useState<InterviewSessionView | null>(null);

  const [exitOpen, setExitOpen] = useState(false);

  const load = async () => {
    if (!Number.isFinite(interviewId)) {
      setSession(null);
      setStatus('notfound');
      return;
    }

    setStatus('loading');
    setErrorMessage('면접방 정보를 불러오지 못했어요.');

    try {
      const data = await fetchMyInterviewViewById(interviewId);
      if (!data) {
        setSession(null);
        setStatus('notfound');
        return;
      }
      setSession(data);
      setStatus('success');
    } catch (err) {
      setSession(null);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!exitOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExitOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [exitOpen]);

  const goLobby = () => navigate(ROUTES.lobby(Number(id)));
  const goList = () => navigate(ROUTES.list);

  // ✅ role에 따라 메인 영상(큰 화면) 라벨/타이틀만 스왑
  const mainVideo = useMemo(() => {
    if (isCorporate) {
      return {
        title: '지원자 화면',
        desc: '',
        label: 'APPLICANT VIDEO',
      };
    }
    return {
      title: '기업 화면',
      desc: '',
      label: 'COMPANY VIDEO',
    };
  }, [isCorporate]);

  if (status === 'loading') return <RoomSkeleton onBackToLobby={goLobby} onExit={goList} />;
  if (status === 'error') {
    return (
      <ErrorBox message={errorMessage} onRetry={load} onBackToLobby={goLobby} onList={goList} />
    );
  }
  if (status === 'notfound' || !session)
    return <NotFoundBox onList={goList} onBackToLobby={goLobby} />;

  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <RoomHeader
          subtitle={`${session.companyName} · ${session.postingTitle}`}
          onBackToLobby={goLobby}
          onExit={() => setExitOpen(true)}
          tags={
            <>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-600 shadow-sm ring-1 ring-zinc-100">
                {formatDateTime(session.scheduledAt)}
              </span>
              <span className="bg-cloud-dancer text-midnight-ink rounded-full px-3 py-1 text-xs font-black">
                ROOM ·{' '}
                <span className="font-semibold break-all text-zinc-600">{session.room_id}</span>
              </span>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ✅ 메인(큰 화면): role에 따라 기업/지원자 라벨만 스왑 */}
          <div className="lg:col-span-2">
            <VideoPanel
              title={mainVideo.title}
              desc={mainVideo.desc}
              label={mainVideo.label}
              heightClass="h-[520px]"
            />
          </div>

          {/* ✅ 내 화면 + 토글(컨트롤바 삭제하고 여기로 통합) */}
          <section className="rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm lg:col-span-1">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight">내 화면</h2>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  Mic: {micOn ? 'ON' : 'OFF'} · Cam: {camOn ? 'ON' : 'OFF'}
                </p>
              </div>

              <div className="flex gap-2">
                {/* ✅ 버튼 size는 md만 */}
                <Button
                  type="button"
                  variant="filter"
                  size="md"
                  isActive={micOn}
                  className="rounded-2xl border-2"
                  onClick={() => setMicOn((v) => !v)}
                >
                  MIC
                </Button>
                <Button
                  type="button"
                  variant="filter"
                  size="md"
                  isActive={camOn}
                  className="rounded-2xl border-2"
                  onClick={() => setCamOn((v) => !v)}
                >
                  CAM
                </Button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="bg-point-blue/60 inline-flex h-2 w-2 rounded-full" />
                  <p className="text-sm font-black text-zinc-600">{camOn ? 'MY VIDEO' : 'CAM OFF'}</p>
                </div>
                <span className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">
                  preview
                </span>
              </div>

              <div className="bg-midnight-ink flex h-[260px] items-center justify-center">
                <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
                  {camOn ? 'MY VIDEO' : 'CAMERA DISABLED'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* 나가기 모달 */}
        {exitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-midnight-ink/60 absolute inset-0"
              onClick={() => setExitOpen(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setExitOpen(false);
              }}
              aria-label="닫기"
            />

            <div
              className="relative w-full max-w-md rounded-4xl border border-zinc-100 bg-white p-6 shadow-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby="exit-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="exit-modal-title" className="text-xl font-black tracking-tight">
                나가시겠습니까?
              </h2>
              <p className="mt-2 text-sm font-semibold text-zinc-500">
                나가면 면접이 종료되거나 재입장이 어려울 수 있어요.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="bg-pure-white rounded-2xl"
                  onClick={() => setExitOpen(false)}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant="red"
                  size="md"
                  className="rounded-2xl"
                  onClick={() => {
                    setExitOpen(false);
                    goList();
                  }}
                >
                  확인
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 상태 UI ---------- */

function NotFoundBox({ onList, onBackToLobby }: { onList: () => void; onBackToLobby: () => void }) {
  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <RoomHeader subtitle="세션을 찾을 수 없어요." onBackToLobby={onBackToLobby} onExit={onList} />

        <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-10 text-center shadow-sm">
          <p className="text-lg font-black">유효하지 않은 면접 세션이에요.</p>
          <p className="mt-2 text-sm font-semibold text-zinc-500">목록에서 다시 선택해 주세요.</p>
          <div className="mt-6 flex justify-center">
            <Button variant="blue" size="md" className="rounded-2xl" onClick={onList}>
              면접 목록으로
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({
  message,
  onRetry,
  onBackToLobby,
  onList,
}: {
  message: string;
  onRetry: () => void;
  onBackToLobby: () => void;
  onList: () => void;
}) {
  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <RoomHeader
          subtitle="연결 준비 중 문제가 발생했어요."
          onBackToLobby={onBackToLobby}
          onExit={onList}
        />

        <div className="rounded-4xl border border-zinc-100 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black">데이터를 불러오지 못했어요</p>
          <p className="mt-2 text-sm font-semibold text-zinc-500">{message}</p>

          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" size="md" className="rounded-2xl" onClick={onBackToLobby}>
              로비로
            </Button>
            <Button variant="outline" size="md" className="rounded-2xl" onClick={onList}>
              목록
            </Button>
            <Button variant="blue" size="md" className="rounded-2xl" onClick={onRetry}>
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomSkeleton({
  onBackToLobby,
  onExit,
}: {
  onBackToLobby: () => void;
  onExit: () => void;
}) {
  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <RoomHeader subtitle="방에 연결하는 중..." onBackToLobby={onBackToLobby} onExit={onExit} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="animate-pulse rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm lg:col-span-2">
            <div className="h-4 w-36 rounded bg-zinc-200/70" />
            <div className="bg-midnight-ink/70 mt-6 h-[520px] rounded-4xl" />
          </div>

          <div className="animate-pulse rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm lg:col-span-1">
            <div className="h-4 w-24 rounded bg-zinc-200/70" />
            <div className="mt-3 h-4 w-48 rounded bg-zinc-200/60" />
            <div className="bg-midnight-ink/70 mt-6 h-[260px] rounded-4xl" />
            <div className="mt-6 h-24 rounded-3xl bg-white ring-1 ring-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
