import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import Button from '../components/Button/Button';
import { fetchMyInterviewViewById, type InterviewSessionView } from '../api/mockData';

type RoomNavState = {
  micOn?: boolean;
  camOn?: boolean;
};

type PageStatus = 'loading' | 'error' | 'notfound' | 'success';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const navState = (location.state ?? {}) as RoomNavState;

  const initialMicOn = typeof navState.micOn === 'boolean' ? navState.micOn : true;
  const initialCamOn = typeof navState.camOn === 'boolean' ? navState.camOn : false;

  const [micOn, setMicOn] = useState(initialMicOn);
  const [camOn, setCamOn] = useState(initialCamOn);

  // ✅ 상태 UI
  const interviewId = Number(id);
  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('면접방 정보를 불러오지 못했어요.');
  const [session, setSession] = useState<InterviewSessionView | null>(null);

  // ✅ 나가기 모달
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
      // 여기에서 실제론 OpenVidu connect 같은 걸 하게 될 텐데
      // MVP에선 "세션 조회"만 해도 상태 UI로 충분히 퀄리티 올라감
      const data = await fetchMyInterviewViewById(interviewId /*, { shouldFail: true } */);

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

  // ✅ 모달 열릴 때 ESC 닫기 + 스크롤 잠금
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

  // ✅ Loading
  if (status === 'loading') {
    return <RoomSkeleton />;
  }

  // ✅ Error
  if (status === 'error') {
    return (
      <ErrorBox
        message={errorMessage}
        onRetry={load}
        onBack={() => navigate(`/interviews/${id}/lobby`)}
        onList={() => navigate('/interviews')}
      />
    );
  }

  // ✅ NotFound
  if (status === 'notfound' || !session) {
    return <NotFoundBox onList={() => navigate('/interviews')} />;
  }

  // ✅ Success
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
          Interview Room
        </h1>
        <p className="text-slate-gray mt-2">
          {session.companyName} · {session.postingTitle} · {formatDateTime(session.scheduledAt)}
        </p>

        {/* room_id 표시(디버깅/진짜 연결 느낌) */}
        <div className="bg-cloud-dancer mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2">
          <span className="text-midnight-ink text-xs font-extrabold">ROOM</span>
          <span className="text-slate-gray text-xs font-semibold break-all">{session.room_id}</span>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 메인: 기업 화면 */}
        <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm lg:col-span-2">
          <p className="text-midnight-ink text-lg font-extrabold">기업 화면</p>
          <div className="bg-midnight-ink mt-6 flex h-[520px] items-center justify-center rounded-2xl">
            <span className="text-cloud-dancer font-extrabold">COMPANY VIDEO</span>
          </div>
        </div>

        {/* 사이드: 내 화면 */}
        <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm lg:col-span-1">
          <p className="text-midnight-ink text-lg font-extrabold">내 화면</p>
          <div className="bg-midnight-ink mt-6 flex h-[260px] items-center justify-center rounded-2xl">
            <span className="text-cloud-dancer font-extrabold">
              {camOn ? 'MY VIDEO' : 'CAM OFF'}
            </span>
          </div>

          <div className="bg-pure-white mt-6 rounded-2xl p-5">
            <p className="text-midnight-ink font-extrabold">상태</p>
            <p className="text-slate-gray mt-2 text-sm font-semibold">
              Mic: {micOn ? 'ON' : 'OFF'} / Cam: {camOn ? 'ON' : 'OFF'}
            </p>
          </div>

          {/* 작은 안내(흐름 개선) */}
          <div className="bg-pure-white mt-6 rounded-2xl p-5">
            <p className="text-midnight-ink text-sm font-extrabold">팁</p>
            <p className="text-slate-gray mt-2 text-sm font-semibold">
              문제가 있으면 카메라/마이크를 껐다가 다시 켜보세요.
            </p>
          </div>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-cloud-dancer mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-6 shadow-sm">
        <div className="flex gap-3">
          <Button
            type="button"
            variant={!micOn ? 'dark' : 'outline'}
            size="md"
            onClick={() => setMicOn((v) => !v)}
          >
            마이크 {micOn ? 'OFF' : 'ON'}
          </Button>

          <Button
            type="button"
            variant={!camOn ? 'dark' : 'outline'}
            size="md"
            onClick={() => setCamOn((v) => !v)}
          >
            카메라 {camOn ? 'OFF' : 'ON'}
          </Button>
        </div>

        <Button
          type="button"
          variant="dark"
          size="md"
          onClick={() => {
            setExitOpen(true);
          }}
        >
          나가기
        </Button>
      </div>

      {/* 나가기 확인 모달 */}
      {exitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="bg-midnight-ink/60 absolute inset-0 cursor-default"
            onClick={() => setExitOpen(false)}
            aria-label="닫기"
            type="button"
          />

          <div
            className="bg-pure-white relative w-full max-w-md rounded-2xl p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="exit-modal-title" className="text-midnight-ink text-xl font-black">
              나가시겠습니까?
            </h2>
            <p className="text-slate-gray mt-2 text-sm font-semibold">
              나가면 면접이 종료되거나 재입장이 어려울 수 있어요.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" size="md" onClick={() => setExitOpen(false)}>
                취소
              </Button>
              <Button
                type="button"
                variant="dark"
                size="md"
                onClick={() => {
                  setExitOpen(false);
                  navigate('/interviews');
                }}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 상태 UI 컴포넌트 ---------- */

function NotFoundBox({ onList }: { onList: () => void }) {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
          Interview Room
        </h1>
        <p className="text-slate-gray mt-2">세션을 찾을 수 없어요.</p>
      </header>

      <div className="bg-cloud-dancer mt-10 rounded-2xl p-10 text-center shadow-sm">
        <p className="text-midnight-ink text-lg font-extrabold">유효하지 않은 면접 세션이에요.</p>
        <p className="text-slate-gray mt-2 text-sm">목록에서 다시 선택해 주세요.</p>

        <div className="mt-6 flex justify-center">
          <Button type="button" variant="dark" size="md" onClick={onList}>
            면접 목록으로
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({
  message,
  onRetry,
  onBack,
  onList,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
  onList: () => void;
}) {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
          Interview Room
        </h1>
        <p className="text-slate-gray mt-2">연결 준비 중 문제가 발생했어요.</p>
      </header>

      <div className="bg-pure-white border-soft-pebble mt-10 rounded-2xl border p-10 text-center shadow-sm">
        <p className="text-midnight-ink text-lg font-extrabold">데이터를 불러오지 못했어요</p>
        <p className="text-slate-gray mt-2 text-sm font-semibold">{message}</p>

        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" variant="outline" size="md" onClick={onBack}>
            로비로
          </Button>
          <Button type="button" variant="outline" size="md" onClick={onList}>
            목록
          </Button>
          <Button type="button" variant="dark" size="md" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoomSkeleton() {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
          Interview Room
        </h1>
        <p className="text-slate-gray mt-2">방에 연결하는 중...</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm lg:col-span-2">
          <div className="bg-soft-pebble/40 h-4 w-28 animate-pulse rounded" />
          <div className="bg-midnight-ink/70 mt-6 h-[520px] animate-pulse rounded-2xl" />
        </div>

        <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm lg:col-span-1">
          <div className="bg-soft-pebble/40 h-4 w-20 animate-pulse rounded" />
          <div className="bg-midnight-ink/70 mt-6 h-[260px] animate-pulse rounded-2xl" />
          <div className="bg-pure-white mt-6 rounded-2xl p-5">
            <div className="bg-soft-pebble/40 h-4 w-16 animate-pulse rounded" />
            <div className="bg-soft-pebble/30 mt-3 h-3 w-40 animate-pulse rounded" />
          </div>
        </div>
      </div>

      <div className="bg-cloud-dancer mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-6 shadow-sm">
        <div className="flex gap-3">
          <div className="bg-soft-pebble/30 h-10 w-28 animate-pulse rounded-md" />
          <div className="bg-soft-pebble/30 h-10 w-28 animate-pulse rounded-md" />
        </div>
        <div className="bg-soft-pebble/40 h-10 w-24 animate-pulse rounded-md" />
      </div>
    </div>
  );
}
