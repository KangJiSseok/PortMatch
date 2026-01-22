// src/pages/InterviewLobbyPage.tsx
import { useEffect, useMemo, useState } from 'react';
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
type UserRole = 'guest' | 'individual' | 'corporate';

const ROUTES = {
  list: '/interviews',
  lobby: (id: number) => `/interviews/${id}/lobby`,
  room: (id: number) => `/interviews/${id}/room`,
} as const;

function LobbyHeader({ subtitle, onBack }: { subtitle: string; onBack: () => void }) {
  return (
    <header className="border-b border-zinc-100 pb-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <p className="text-xs font-black tracking-[0.35em] text-zinc-400 uppercase">
              interview lobby
            </p>
          </div>
          <p className="mt-4 truncate text-lg font-bold text-zinc-600 sm:text-xl">{subtitle}</p>
        </div>

        {/* ✅ 헤더 버튼은 딱 1개: 목록 */}
        <div className="flex shrink-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="rounded-2xl"
            onClick={onBack}
          >
            목록
          </Button>
        </div>
      </div>
    </header>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-black">{label}</p>
        <p className="mt-1 text-xs font-semibold text-zinc-500">현재: {value ? 'ON' : 'OFF'}</p>
      </div>

      {/* ✅ M부터: md 사용 */}
      <Button
        type="button"
        variant="filter"
        size="md"
        isActive={value}
        className="rounded-2xl border-2"
        onClick={onToggle}
      >
        {value ? 'ON' : 'OFF'}
      </Button>
    </div>
  );
}

export default function InterviewLobbyPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const interviewId = Number(id);

  // ✅ role 분기 (MyPageGate랑 동일하게 localStorage 기준)
  const role = ((localStorage.getItem('userRole') ?? 'guest') as UserRole) || 'guest';
  const isCorporate = role === 'corporate';

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

  const goList = () => navigate(ROUTES.list);
  const goRoom = () => {
    if (!session) return;
    navigate(ROUTES.room(session.interview_id), { state: { micOn, camOn } });
  };

  // ✅ 기업 전용: 초대 링크 (같은 URL 유지)
  const inviteLink = useMemo(() => {
    if (!session) return '';
    return `${window.location.origin}${ROUTES.lobby(session.interview_id)}`;
  }, [session]);

  const copyInviteLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      alert('초대 링크 복사 완료!');
    } catch {
      // fallback (보안/권한/HTTPS 이슈)
      try {
        const ta = document.createElement('textarea');
        ta.value = inviteLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('초대 링크 복사 완료!');
      } catch {
        alert('복사에 실패했어요. 링크를 직접 복사해 주세요.');
      }
    }
  };

  if (status === 'loading') return <LobbySkeleton onBack={goList} />;
  if (status === 'error') return <ErrorBox message={errorMessage} onRetry={load} onBack={goList} />;
  if (status === 'notfound' || !session) return <NotFoundBox onBack={goList} />;

  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      {/* ✅ InterviewListPage랑 컨테이너/여백 통일 */}
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <LobbyHeader
          subtitle={`${session.companyName} · ${session.postingTitle}`}
          onBack={goList}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 좌측: 세션/설정/입장 */}
          <section className="rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm lg:col-span-1">
            <p className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">
              {session.companyName}
            </p>
            <p className="mt-2 text-2xl font-black tracking-tighter">{session.postingTitle}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-600 shadow-sm ring-1 ring-zinc-100">
                {formatDateTime(session.scheduledAt)}
              </span>
              <span className="bg-cloud-dancer text-midnight-ink rounded-full px-3 py-1 text-xs font-black">
                ROOM ·{' '}
                <span className="font-semibold break-all text-zinc-600">{session.room_id}</span>
              </span>
            </div>

            {/* ✅ 기업 전용: 초대 링크 카드 (형태는 유지, 블럭만 추가) */}
            {isCorporate && (
              <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-black">지원자 초대 링크</p>
                <p className="mt-2 break-all text-xs font-semibold text-zinc-500">{inviteLink}</p>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="w-full rounded-2xl"
                    onClick={copyInviteLink}
                  >
                    링크 복사
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <ToggleRow label="마이크" value={micOn} onToggle={() => setMicOn((v) => !v)} />
              <ToggleRow label="카메라" value={camOn} onToggle={() => setCamOn((v) => !v)} />
            </div>

            {/* ✅ 버튼은 딱 1개만: role 따라 텍스트만 변경 */}
            <div className="mt-8">
              <Button
                type="button"
                variant="blue"
                size="md"
                className="w-full rounded-2xl"
                onClick={goRoom}
              >
                {isCorporate ? '면접 시작' : '면접 입장'}
              </Button>

              <p className="mt-3 text-sm font-semibold text-zinc-500">
                {isCorporate
                  ? '시작하면 바로 면접방으로 이동해요.'
                  : '입장하면 바로 면접방으로 이동해요.'}
              </p>
            </div>
          </section>

          {/* 우측: 미리보기 */}
          <section className="rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-lg font-black tracking-tighter">내 화면 미리보기</p>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  Mic: {micOn ? 'ON' : 'OFF'} · Cam: {camOn ? 'ON' : 'OFF'}
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="bg-point-blue/60 inline-flex h-2 w-2 rounded-full" />
                  <p className="text-sm font-black text-zinc-600">
                    {camOn ? 'CAM PREVIEW' : 'CAM OFF'}
                  </p>
                </div>
                <span className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">
                  preview
                </span>
              </div>

              <div className="bg-midnight-ink flex h-[360px] items-center justify-center">
                <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
                  {camOn ? 'your video' : 'camera disabled'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 상태 UI ---------------- */

function NotFoundBox({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <LobbyHeader subtitle="입장 전 대기실" onBack={onBack} />

        <div className="rounded-4xl border border-zinc-100 bg-zinc-50 p-10 text-center shadow-sm">
          <p className="text-lg font-black">유효하지 않은 면접 세션이에요.</p>
          <p className="mt-2 text-sm font-semibold text-zinc-500">목록에서 다시 선택해 주세요.</p>
          <div className="mt-6 flex justify-center">
            <Button type="button" variant="blue" size="md" className="rounded-2xl" onClick={onBack}>
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
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <LobbyHeader subtitle="세션 정보를 불러오지 못했어요." onBack={onBack} />

        <div className="rounded-4xl border border-zinc-100 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black">데이터를 불러오지 못했어요</p>
          <p className="mt-2 text-sm font-semibold text-zinc-500">{message}</p>

          <div className="mt-6 flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="rounded-2xl"
              onClick={onBack}
            >
              목록
            </Button>
            <Button
              type="button"
              variant="blue"
              size="md"
              className="rounded-2xl"
              onClick={onRetry}
            >
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LobbySkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <LobbyHeader subtitle="입장 전 대기실" onBack={onBack} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="animate-pulse rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm lg:col-span-1">
            <div className="h-3 w-24 rounded bg-zinc-200/70" />
            <div className="mt-3 h-7 w-64 rounded bg-zinc-200/60" />
            <div className="mt-4 h-4 w-40 rounded bg-zinc-200/50" />

            <div className="mt-8 space-y-3">
              <div className="h-16 rounded-3xl bg-white ring-1 ring-zinc-100" />
              <div className="h-16 rounded-3xl bg-white ring-1 ring-zinc-100" />
            </div>

            <div className="mt-8 h-11 w-full rounded-2xl bg-zinc-200/60" />
          </div>

          <div className="animate-pulse rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm lg:col-span-2">
            <div className="h-5 w-48 rounded bg-zinc-200/60" />
            <div className="mt-3 h-4 w-56 rounded bg-zinc-200/50" />

            <div className="mt-6 overflow-hidden rounded-4xl border border-zinc-100 bg-white">
              <div className="h-14 border-b border-zinc-100 bg-white" />
              <div className="bg-midnight-ink/70 h-[360px]" />
            </div>

            <div className="mt-6 h-24 rounded-3xl bg-white ring-1 ring-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
