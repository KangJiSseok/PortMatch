import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../components/Button/Button';
import { fetchMyInterviewViewById, type InterviewSessionView } from '../api/mockData';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

type PageStatus = 'loading' | 'error' | 'notfound' | 'success';

export default function InterviewLobbyPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const interviewId = Number(id);

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('세션 정보를 불러오지 못했어요.');
  const [session, setSession] = useState<InterviewSessionView | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const load = async () => {
    if (!Number.isFinite(interviewId)) {
      setSession(null);
      setStatus('notfound');
      return;
    }

    setStatus('loading');
    setErrorMessage('세션 정보를 불러오지 못했어요.');

    try {
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

  if (status === 'loading') {
    return <LobbySkeleton onBack={() => navigate('/interviews')} />;
  }

  if (status === 'error') {
    return (
      <ErrorBox message={errorMessage} onRetry={load} onBack={() => navigate('/interviews')} />
    );
  }

  if (status === 'notfound' || !session) {
    return <NotFoundBox onBack={() => navigate('/interviews')} />;
  }

  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Lobby</h1>
        <p className="text-slate-gray mt-2">입장 전 대기실</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 왼쪽: 정보/설정 */}
        <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm lg:col-span-1">
          <p className="text-slate-gray text-sm font-bold tracking-widest uppercase">
            {session.companyName}
          </p>
          <p className="text-midnight-ink mt-2 text-2xl font-black">{session.postingTitle}</p>
          <p className="text-slate-gray mt-2 text-sm font-semibold">
            {formatDateTime(session.scheduledAt)}
          </p>

          {/* room_id 표시 */}
          <div className="bg-pure-white mt-4 rounded-2xl p-4">
            <p className="text-midnight-ink text-sm font-extrabold">Room ID</p>
            <p className="text-slate-gray mt-1 text-xs font-semibold break-all">
              {session.room_id}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-pure-white flex items-center justify-between rounded-2xl p-4">
              <p className="text-midnight-ink font-extrabold">마이크</p>
              <Button
                type="button"
                variant={!micOn ? 'dark' : 'outline'}
                size="sm"
                onClick={() => setMicOn((v) => !v)}
              >
                {!micOn ? 'ON' : 'OFF'}
              </Button>
            </div>

            <div className="bg-pure-white flex items-center justify-between rounded-2xl p-4">
              <p className="text-midnight-ink font-extrabold">카메라</p>
              <Button
                type="button"
                variant={!camOn ? 'dark' : 'outline'}
                size="sm"
                onClick={() => setCamOn((v) => !v)}
              >
                {!camOn ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/interviews')}
            >
              목록
            </Button>
            <Button
              type="button"
              variant="dark"
              size="md"
              onClick={() =>
                navigate(`/interviews/${session.interview_id}/room`, { state: { micOn, camOn } })
              }
            >
              면접 입장
            </Button>
          </div>
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm lg:col-span-2">
          <p className="text-midnight-ink text-lg font-extrabold">내 화면 미리보기</p>

          <div className="bg-midnight-ink mt-6 flex h-[360px] items-center justify-center rounded-2xl">
            <span className="text-cloud-dancer font-extrabold">
              {camOn ? 'CAM PREVIEW' : 'CAM OFF'}
            </span>
          </div>

          <div className="bg-pure-white mt-6 flex items-center justify-between rounded-2xl p-5">
            <p className="text-midnight-ink font-extrabold">현재 설정</p>
            <p className="text-slate-gray text-sm font-semibold">
              Mic: {micOn ? 'ON' : 'OFF'} / Cam: {camOn ? 'ON' : 'OFF'}
            </p>
          </div>

          <div className="bg-pure-white mt-6 rounded-2xl p-5">
            <p className="text-midnight-ink font-extrabold">입장 전 체크</p>
            <ul className="text-slate-gray mt-3 list-disc space-y-1 pl-5 text-sm font-semibold">
              <li>마이크/카메라 설정 확인</li>
              <li>네트워크 안정 확인</li>
              <li>입장 버튼 누르면 바로 면접방으로 이동</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundBox({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Lobby</h1>
        <p className="text-slate-gray mt-2">입장 전 대기실</p>
      </header>

      <div className="bg-cloud-dancer mt-10 rounded-2xl p-10 text-center shadow-sm">
        <p className="text-midnight-ink text-lg font-extrabold">유효하지 않은 면접 세션이에요.</p>
        <p className="text-slate-gray mt-2 text-sm">목록에서 다시 선택해 주세요.</p>

        <div className="mt-6 flex justify-center">
          <Button type="button" variant="dark" size="md" onClick={onBack}>
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
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Lobby</h1>
        <p className="text-slate-gray mt-2">입장 전 대기실</p>
      </header>

      <div className="bg-pure-white border-soft-pebble mt-10 rounded-2xl border p-10 text-center shadow-sm">
        <p className="text-midnight-ink text-lg font-extrabold">데이터를 불러오지 못했어요</p>
        <p className="text-slate-gray mt-2 text-sm font-semibold">{message}</p>

        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" variant="outline" size="md" onClick={onBack}>
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

function LobbySkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Lobby</h1>
        <p className="text-slate-gray mt-2">입장 전 대기실</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm lg:col-span-1">
          <div className="bg-soft-pebble/50 h-3 w-28 animate-pulse rounded" />
          <div className="bg-soft-pebble/40 mt-3 h-7 w-60 animate-pulse rounded" />
          <div className="bg-soft-pebble/30 mt-3 h-4 w-40 animate-pulse rounded" />

          <div className="bg-pure-white mt-6 rounded-2xl p-4">
            <div className="bg-soft-pebble/40 h-3 w-20 animate-pulse rounded" />
            <div className="bg-soft-pebble/30 mt-2 h-3 w-full animate-pulse rounded" />
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-pure-white rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="bg-soft-pebble/40 h-4 w-16 animate-pulse rounded" />
                <div className="bg-soft-pebble/30 h-8 w-16 animate-pulse rounded" />
              </div>
            </div>
            <div className="bg-pure-white rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="bg-soft-pebble/40 h-4 w-16 animate-pulse rounded" />
                <div className="bg-soft-pebble/30 h-8 w-16 animate-pulse rounded" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button type="button" variant="outline" size="md" onClick={onBack}>
              목록
            </Button>
            <div className="bg-soft-pebble/30 h-10 flex-1 animate-pulse rounded-md" />
          </div>
        </div>

        <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm lg:col-span-2">
          <div className="bg-soft-pebble/40 h-4 w-40 animate-pulse rounded" />
          <div className="bg-midnight-ink/70 mt-6 h-[360px] animate-pulse rounded-2xl" />
          <div className="bg-pure-white mt-6 rounded-2xl p-5">
            <div className="bg-soft-pebble/40 h-4 w-28 animate-pulse rounded" />
            <div className="bg-soft-pebble/30 mt-3 h-3 w-52 animate-pulse rounded" />
          </div>
          <div className="bg-pure-white mt-6 rounded-2xl p-5">
            <div className="bg-soft-pebble/40 h-4 w-28 animate-pulse rounded" />
            <div className="bg-soft-pebble/30 mt-3 h-3 w-64 animate-pulse rounded" />
            <div className="bg-soft-pebble/30 mt-2 h-3 w-56 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
