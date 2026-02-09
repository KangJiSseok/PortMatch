// src/pages/InterviewLobbyPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Settings2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Share2,
} from 'lucide-react';

import Button from '../../components/Button/Button';
import { useAuthStore } from '../../store/authStore';
import {
  fetchCompanyInterviewViewById,
  fetchMyInterviewViewById,
  type InterviewSessionView,
  createInterviewRoom,
} from '../../api/interview';

// --- Helpers ---
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}

function removeTracksByKind(stream: MediaStream, kind: 'audio' | 'video') {
  const tracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
  tracks.forEach((t) => {
    t.stop();
    stream.removeTrack(t);
  });
}

function defer(fn: () => void) {
  const id = window.setTimeout(fn, 0);
  return () => window.clearTimeout(id);
}

// --- Types ---
type PageStatus = 'loading' | 'error' | 'notfound' | 'success';

type LobbyNavState = {
  sessionId?: string;
  initialMicOn?: boolean;
  initialCamOn?: boolean;
};

const ROUTES = {
  list: '/interviews',
  lobby: (id: number) => `/interviews/${id}/lobby`,
  room: (id: number) => `/interviews/${id}/room`,
} as const;

// --- Components ---
function LobbyHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-8 py-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-200 backdrop-blur-md transition-all hover:bg-white hover:text-zinc-900 hover:ring-zinc-300"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>목록으로</span>
        </Button>
        <div className="h-4 w-px bg-zinc-400/30" />
        <span className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">
          Interview Lobby
        </span>
      </div>
    </header>
  );
}

// --- Main Page ---
export default function InterviewLobbyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? {}) as LobbyNavState;

  const interviewId = Number(id);

  const { user } = useAuthStore();
  const isCorporate = user?.role === 'COMPANY';

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('세션 정보를 불러오지 못했어요.');
  const [session, setSession] = useState<InterviewSessionView | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [roomLoading, setRoomLoading] = useState<boolean>(false);

  // Media State
  const [micOn, setMicOn] = useState<boolean>(navState.initialMicOn ?? false);
  const [camOn, setCamOn] = useState<boolean>(navState.initialCamOn ?? false);
  const [mirrorOn, setMirrorOn] = useState(true);

  // Preview Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string>('');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [streamRev, setStreamRev] = useState(0);

  const camOpIdRef = useRef(0);
  const micOpIdRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    streamRef.current = mediaStream;
  }, [mediaStream]);

  // Audio Meter
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Toast
  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const ensureRoom = useCallback(async () => {
    if (!Number.isFinite(interviewId) || interviewId <= 0) return;
    if (roomId) return;
    setRoomLoading(true);
    try {
      const createdRoomId = await createInterviewRoom(interviewId);
      setRoomId(createdRoomId);
    } catch (err) {
      setRoomId('');
      showToast(err instanceof Error ? err.message : '면접방 생성에 실패했습니다.');
    } finally {
      setRoomLoading(false);
    }
  }, [interviewId, roomId, showToast]);

  // --- Load Session ---
  const load = useCallback(async () => {
    if (!Number.isFinite(interviewId) || interviewId <= 0) {
      setSession(null);
      setStatus('notfound');
      return;
    }

    setStatus('loading');
    setErrorMessage('세션 정보를 불러오지 못했어요.');

    try {
      const data = isCorporate
        ? await fetchCompanyInterviewViewById(interviewId)
        : await fetchMyInterviewViewById(interviewId);
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
  }, [interviewId]);

  useEffect(() => {
    const cleanup = defer(() => void load());
    return cleanup;
  }, [load]);

  useEffect(() => {
    if (status !== 'success' || !session) return;
    void ensureRoom();
  }, [ensureRoom, session, status]);

  // --- Navigation & Actions ---
  const goList = useCallback(() => navigate(ROUTES.list), [navigate]);

  const goRoom = useCallback(() => {
    if (!session) return;
    const targetRoomId = roomId || navState.sessionId || session.room_id;
    if (!targetRoomId) {
      showToast('면접방 정보를 불러오지 못했어요.');
      return;
    }
    navigate(ROUTES.room(session.interview_id), {
      state: {
        micOn,
        camOn,
        sessionId: targetRoomId,
        title: session.postingTitle, // 면접 제목 전달
      },
    });
  }, [camOn, micOn, navigate, navState.sessionId, roomId, session, showToast]);

  const inviteLink = useMemo(() => {
    if (!session) return '';
    return `${window.location.origin}${ROUTES.lobby(session.interview_id)}`;
  }, [session]);

  const copyInviteLink = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast('초대 링크 복사 완료!');
    } catch {
      showToast('복사 실패');
    }
  }, [inviteLink, showToast]);

  // --- Media Logic (Existing Robust Logic) ---
  const ensureMediaSupported = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError('이 브라우저는 미디어 장치를 지원하지 않습니다.');
      return false;
    }
    return true;
  }, []);

  // 0. Cleanup when both off
  useEffect(() => {
    const alive = { current: true };
    const run = () => {
      if (!alive.current) return;
      if (camOn || micOn) return;
      setMediaError('');
      if (streamRef.current) stopStream(streamRef.current);
      setMediaStream(null);
      setMicLevel(0);
      setStreamRev((v) => v + 1);
    };
    run();
    return () => {
      alive.current = false;
    };
  }, [camOn, micOn]);

  // 1. Cam Toggle
  useEffect(() => {
    const alive = { current: true };
    const opId = ++camOpIdRef.current;
    const cleanup = defer(() => {
      if (!alive.current) return;
      const run = async () => {
        if (!camOn) {
          setMediaError('');
          const current = streamRef.current;
          if (current) {
            removeTracksByKind(current, 'video');
            if (current.getTracks().length === 0) setMediaStream(null);
            setStreamRev((v) => v + 1);
          }
          return;
        }
        if (!ensureMediaSupported()) return;
        setMediaError('');
        const base = streamRef.current;
        if (base && base.getVideoTracks().length > 0) {
          base.getVideoTracks().forEach((t) => (t.enabled = true));
          setStreamRev((v) => v + 1);
          return;
        }
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (!alive.current || opId !== camOpIdRef.current) {
            stopStream(s);
            return;
          }
          const vt = s.getVideoTracks()[0];
          const latest = streamRef.current;
          if (latest) {
            latest.addTrack(vt);
            setStreamRev((v) => v + 1);
          } else {
            setMediaStream(new MediaStream([vt]));
          }
        } catch (e) {
          setMediaError('카메라 접근 권한을 확인해주세요.');
        }
      };
      void run();
    });
    return () => {
      alive.current = false;
      cleanup();
    };
  }, [camOn, ensureMediaSupported]);

  // 2. Mic Toggle
  useEffect(() => {
    const alive = { current: true };
    const opId = ++micOpIdRef.current;
    const run = async () => {
      if (!alive.current) return;
      if (!micOn) {
        setMediaError('');
        const current = streamRef.current;
        if (current) {
          removeTracksByKind(current, 'audio');
          setMicLevel(0);
          if (current.getTracks().length === 0) setMediaStream(null);
          setStreamRev((v) => v + 1);
        }
        showToast('마이크 OFF');
        return;
      }
      if (!ensureMediaSupported()) return;
      setMediaError('');
      showToast('마이크 권한 요청 중...');
      const base = streamRef.current;
      if (base && base.getAudioTracks().length > 0) {
        base.getAudioTracks().forEach((t) => (t.enabled = true));
        setStreamRev((v) => v + 1);
        showToast('마이크 ON');
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        if (!alive.current || opId !== micOpIdRef.current) {
          stopStream(s);
          return;
        }
        const at = s.getAudioTracks()[0];
        if (at) at.enabled = true;
        const latest = streamRef.current;
        if (latest) {
          latest.addTrack(at);
          setStreamRev((v) => v + 1);
        } else {
          setMediaStream(new MediaStream([at]));
          setStreamRev((v) => v + 1);
        }
        showToast('마이크 ON');
      } catch (e) {
        setMediaError('마이크 권한을 허용해주세요');
        setMicLevel(0);
        showToast('마이크 권한 요청 실패');
      }
    };
    void run();
    return () => {
      alive.current = false;
    };
  }, [micOn, ensureMediaSupported]);

  // 3. Attach Stream
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!mediaStream) {
      el.srcObject = null;
      return;
    }
    if (el.srcObject !== mediaStream) {
      el.srcObject = mediaStream;
    }
    el.muted = true;
    el.play().catch(() => {});
  }, [mediaStream, streamRev]);

  // 4. Mic Meter
  useEffect(() => {
    const alive = { current: true };
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setMicLevel(0);
    if (!micOn) {
      return () => {
        alive.current = false;
      };
    }
    const s = streamRef.current;
    if (!s || s.getAudioTracks().length === 0) {
      showToast('마이크 트랙이 없습니다.');
      return () => {
        alive.current = false;
      };
    }
    s.getAudioTracks().forEach((t) => (t.enabled = true));
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      return () => {
        alive.current = false;
      };
    }
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(s);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      if (!alive.current) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const level = Math.min(1, rms * 3.5);
      setMicLevel(level);
      rafRef.current = requestAnimationFrame(tick);
    };
    ctx.resume()
      .then(() => {
        if (alive.current) tick();
      })
      .catch(() => {
        showToast('오디오 컨텍스트 활성화 실패');
      });
    return () => {
      alive.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [micOn, streamRev]);

  useEffect(() => {
    return () => {
      if (streamRef.current) stopStream(streamRef.current);
    };
  }, []);

  // --- Render Conditions ---
  if (status === 'loading') return <LobbySkeleton onBack={goList} />;
  if (status === 'error') return <ErrorBox message={errorMessage} onRetry={load} onBack={goList} />;
  if (status === 'notfound' || !session) return <NotFoundBox onBack={goList} />;

  const showPreview = camOn && !!mediaStream && mediaStream.getVideoTracks().length > 0;

  return (
    <div className="text-midnight-ink relative flex min-h-screen min-w-[1400px] w-full flex-col overflow-hidden bg-[#FCFCFC] pt-12 pb-10">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#FCFCFC]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(40%_40%_at_20%_20%,rgba(59,130,246,0.08),transparent),radial-gradient(35%_35%_at_80%_30%,rgba(16,185,129,0.06),transparent)]" />
      <LobbyHeader onBack={goList} />

      <main className="relative z-10 mx-auto flex w-[1400px] flex-1 items-stretch justify-center gap-12 px-8 pt-8">
        {/* --- LEFT: Preview Section (Dark Theme like Room) --- */}
        <section className="relative min-w-[840px] flex-1" style={{ height: '600px' }}>
          <div className="bg-midnight-ink relative h-full w-full overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-black/5">
            {/* Camera View */}
            <div className="flex h-full w-full items-center justify-center">
              {camOn ? (
                showPreview ? (
                  <video
                    ref={videoRef}
                    className={`h-full w-full object-cover ${mirrorOn ? 'scale-x-[-1]' : ''}`}
                    playsInline
                    autoPlay
                    muted
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-zinc-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-xs font-black tracking-widest uppercase">
                      starting camera...
                    </span>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-4 text-zinc-600">
                  <div className="rounded-full bg-zinc-800/50 p-6 backdrop-blur-sm">
                    <CameraOff className="h-10 w-10 opacity-50" />
                  </div>
                  <span className="text-xs font-black tracking-widest uppercase opacity-50">
                    camera is off
                  </span>
                </div>
              )}
            </div>

            {/* Mic Meter Overlay */}
            {micOn && (
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/40 px-5 py-2 backdrop-blur-md">
                <Mic
                  className={`h-4 w-4 ${micLevel > 0.05 ? 'text-green-400' : 'text-zinc-400'}`}
                />
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-green-400 transition-[width] duration-75"
                    style={{ width: `${Math.round(micLevel * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Toast Overlay */}
            {toast && (
              <div className="animate-fade-in-up absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-zinc-800 shadow-lg">
                {toast}
              </div>
            )}

            {/* Error Overlay */}
            {mediaError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
                <div className="max-w-sm rounded-2xl bg-white p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1 font-bold text-zinc-800">장치 오류</h3>
                  <p className="mb-4 text-sm text-zinc-500">{mediaError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    새로고침
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <p className="rounded-full bg-white/50 px-3 py-1 text-xs font-medium text-zinc-500 backdrop-blur-md">
              Tip: 면접장에 입장하기 전 카메라와 마이크 상태를 확인해주세요.
            </p>
          </div>
        </section>

        {/* --- RIGHT: Controls & Info Section (Light Card) --- */}
        <section className="flex w-[420px] flex-col gap-8" style={{ height: '600px' }}>
          <div className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-10 shadow-xl ring-1 ring-zinc-100">
            {/* Session Info */}
            <div className="space-y-2">
              <p className="text-xs font-black tracking-widest text-zinc-400 uppercase">
                {session.companyName}
              </p>
              <h1 className="text-2xl leading-tight font-black text-zinc-800">
                {session.postingTitle}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {formatDateTime(session.scheduledAt)}
              </p>
            </div>

            {/* Corporate: Invite Link Section */}
            {isCorporate && (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-bold text-zinc-500">
                    <Share2 className="h-3 w-3" /> 지원자 초대 링크
                  </span>
                  <button
                    onClick={copyInviteLink}
                    className="text-point-blue text-xs font-bold hover:underline"
                  >
                    복사하기
                  </button>
                </div>
                <p className="line-clamp-2 rounded border border-zinc-100 bg-white p-2 text-xs break-all text-zinc-400">
                  {inviteLink}
                </p>
              </div>
            )}

            {/* Device Controls */}
            <div className="flex justify-center gap-5">
              <button
                onClick={() => setMicOn((v) => !v)}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ring-1 transition-all ring-inset ${
                  micOn
                    ? 'bg-zinc-100 text-zinc-700 ring-zinc-200 hover:bg-zinc-200'
                    : 'bg-red-50 text-red-500 ring-red-100 hover:bg-red-100'
                }`}
                title="마이크 켜기/끄기"
              >
                {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </button>

              <button
                onClick={() => setCamOn((v) => !v)}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ring-1 transition-all ring-inset ${
                  camOn
                    ? 'bg-zinc-100 text-zinc-700 ring-zinc-200 hover:bg-zinc-200'
                    : 'bg-red-50 text-red-500 ring-red-100 hover:bg-red-100'
                }`}
                title="카메라 켜기/끄기"
              >
                {camOn ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
              </button>

              <button
                className="flex h-16 w-16 cursor-not-allowed items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 ring-1 ring-zinc-100 ring-inset"
                title="설정 (준비중)"
              >
                <Settings2 className="h-6 w-6" />
              </button>
            </div>

            {/* Quick Settings */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <p className="mb-3 text-xs font-black tracking-widest text-zinc-400 uppercase">
                Quick Settings
              </p>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setMirrorOn((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-100"
                >
                  <span>내 화면 미러링</span>
                  <span className={mirrorOn ? 'text-green-600' : 'text-zinc-400'}>
                    {mirrorOn ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {/* Main Action */}
            <Button
              type="button"
              variant="blue"
              size="lg"
              className="w-full rounded-2xl py-4 text-base shadow-lg shadow-blue-500/20"
              onClick={goRoom}
              disabled={roomLoading}
            >
              {roomLoading
                ? '면접방 준비 중...'
                : isCorporate
                  ? '면접 시작하기'
                  : '면접 입장하기'}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------------- Sub Components ---------------- */

function NotFoundBox({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-[#FCFCFC] flex h-screen w-full items-center justify-center">
      <div className="max-w-md rounded-[2rem] bg-white p-10 text-center shadow-xl ring-1 ring-zinc-100">
        <h2 className="text-xl font-black text-zinc-800">유효하지 않은 면접입니다</h2>
        <p className="mt-3 mb-6 text-sm leading-relaxed text-zinc-500">
          존재하지 않거나 삭제된 면접 세션입니다.
          <br />
          목록으로 돌아가 확인해주세요.
        </p>
        <Button
          type="button"
          variant="blue"
          size="md"
          className="w-full rounded-xl"
          onClick={onBack}
        >
          목록으로 돌아가기
        </Button>
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
    <div className="bg-[#FCFCFC] flex h-screen w-full items-center justify-center">
      <div className="max-w-md rounded-[2rem] bg-white p-10 text-center shadow-xl ring-1 ring-zinc-100">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-zinc-800">오류가 발생했습니다</h2>
        <p className="mt-3 mb-8 text-sm leading-relaxed text-zinc-500">{message}</p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="flex-1 rounded-xl"
            onClick={onBack}
          >
            나가기
          </Button>
          <Button
            type="button"
            variant="blue"
            size="md"
            className="flex-1 rounded-xl"
            onClick={onRetry}
          >
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}

function LobbySkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-[#FCFCFC] flex min-h-screen w-full flex-col pt-20 pb-10">
      <LobbyHeader onBack={onBack} />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-center justify-center gap-8 px-6">
        <div className="aspect-video flex-1 animate-pulse rounded-[2rem] bg-zinc-200/50" />
        <div className="h-[400px] w-[400px] space-y-6 rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-100" />
          <div className="mt-8 h-12 w-full animate-pulse rounded-2xl bg-zinc-100" />
          <div className="mt-8 flex justify-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-zinc-100" />
            <div className="h-16 w-16 animate-pulse rounded-2xl bg-zinc-100" />
          </div>
        </div>
      </main>
    </div>
  );
}


