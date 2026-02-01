// src/pages/interview/InterviewPage.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MediaConnection } from 'peerjs';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  User,
  Loader2,
  FileText,
} from 'lucide-react';

import { createPeer } from '../../utils/peerConnection';

// --- Types ---
type UserRole = 'guest' | 'individual' | 'corporate';

type RoomNavState = {
  sessionId?: string;
  title?: string; // 면접 이름 추가
  micOn?: boolean;
  camOn?: boolean;
};

type ConnectStatus = 'idle' | 'connecting' | 'connected' | 'error';

// --- Utilities ---
function defer(fn: () => void) {
  const id = window.setTimeout(fn, 0);
  return () => window.clearTimeout(id);
}

function stopStreamTracks(stream: MediaStream | null) {
  try {
    stream?.getTracks().forEach((t) => t.stop());
  } catch {
    // ignore
  }
}

function toHumanError(err: unknown): string {
  const anyErr = err as Record<string, unknown> | null;
  const msg =
    (typeof anyErr?.message === 'string' && anyErr.message) ||
    (typeof anyErr?.error === 'string' && anyErr.error) ||
    (typeof anyErr?.reason === 'string' && anyErr.reason) ||
    '';

  return msg || (err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
}

// --- Component ---
export default function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? {}) as RoomNavState;

  // Role 가져오기
  const role = ((localStorage.getItem('userRole') ?? 'guest') as UserRole) || 'guest';
  const isCorporate = role === 'corporate';

  // -- State --
  const [status, setStatus] = useState<ConnectStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const remotePeerIdInput = navState.sessionId ?? '';
  const interviewTitle = navState.title ?? '포트매치 기술 면접'; // 면접 이름 (기본값 설정)

  const [micOn, setMicOn] = useState<boolean>(navState.micOn ?? true);
  const [camOn, setCamOn] = useState<boolean>(navState.camOn ?? true);

  // WebRTC Refs
  const peerRef = useRef<ReturnType<typeof createPeer> | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [localReady, setLocalReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const [peerReady, setPeerReady] = useState(false);
  const autoConnectRef = useRef(false);

  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);

  // --- Helpers ---
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

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setLocalReady(true);
      return stream;
    } catch (err) {
      console.error(err);
      throw new Error('카메라/마이크 권한이 필요합니다.');
    }
  }, []);

  const attachStreamToVideo = useCallback(
    (video: HTMLVideoElement | null, stream: MediaStream | null, muted = false) => {
      if (!video) return;
      if (!stream) {
        video.srcObject = null;
        return;
      }
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = muted;
      video.play().catch(() => {});
    },
    [],
  );

  const cleanupSession = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    stopStreamTracks(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setLocalReady(false);
    setRemoteReady(false);
    setStatus('idle');
    setErrorMessage('');
  }, []);

  const leave = useCallback(() => {
    cleanupSession();
    navigate(-1);
  }, [cleanupSession, navigate]);

  useEffect(() => {
    attachStreamToVideo(localVideoRef.current, localStream, true);
  }, [attachStreamToVideo, localStream]);

  useEffect(() => {
    attachStreamToVideo(remoteVideoRef.current, remoteStream, false);
  }, [attachStreamToVideo, remoteStream]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn]);

  // --- Connect Logic ---
  const connect = useCallback(async () => {
    const remoteId = remotePeerIdInput.trim();
    if (!remoteId) {
      showToast('상대방 ID 정보가 없습니다.');
      return;
    }
    if (!peerRef.current || !peerReady) return;
    if (status === 'connecting') return;

    cleanupSession();
    setStatus('connecting');
    setErrorMessage('');

    try {
      const stream = await getLocalStream();
      stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
      stream.getVideoTracks().forEach((t) => (t.enabled = camOn));

      const call = peerRef.current.call(remoteId, stream);
      if (!call) throw new Error('연결 요청 실패');

      callRef.current = call;

      call.on('stream', (incomingStream) => {
        setRemoteStream(incomingStream);
        setRemoteReady(true);
        setStatus('connected');
      });
      call.on('close', () => {
        setRemoteStream(null);
        setRemoteReady(false);
        setStatus('idle');
        showToast('연결이 종료되었습니다.');
      });
      call.on('error', (err) => {
        setStatus('error');
        setErrorMessage(toHumanError(err));
      });
    } catch (err) {
      cleanupSession();
      setStatus('error');
      setErrorMessage(toHumanError(err));
    }
  }, [
    camOn,
    cleanupSession,
    getLocalStream,
    micOn,
    peerReady,
    remotePeerIdInput,
    showToast,
    status,
  ]);

  // --- Peer Event Listeners ---
  useEffect(() => {
    const peer = createPeer();
    peerRef.current = peer;

    peer.on('open', () => setPeerReady(true));

    peer.on('call', async (call) => {
      try {
        setStatus('connecting');
        callRef.current?.close();
        callRef.current = call;

        const stream = await getLocalStream();
        stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
        stream.getVideoTracks().forEach((t) => (t.enabled = camOn));

        call.answer(stream);

        call.on('stream', (incomingStream) => {
          setRemoteStream(incomingStream);
          setRemoteReady(true);
          setStatus('connected');
        });
        call.on('close', () => {
          setRemoteStream(null);
          setRemoteReady(false);
          setStatus('idle');
          showToast('상대방이 나갔습니다.');
        });
        call.on('error', (err) => {
          setStatus('error');
          setErrorMessage(toHumanError(err));
        });
      } catch (err) {
        setStatus('error');
        setErrorMessage(toHumanError(err));
      }
    });

    peer.on('error', (err) => {
      setStatus('error');
      setErrorMessage(toHumanError(err));
    });

    return () => {
      callRef.current?.close();
      peer.destroy();
      stopStreamTracks(localStreamRef.current);
    };
  }, [camOn, getLocalStream, micOn, showToast]);

  useEffect(() => {
    if (!navState.sessionId) return;
    if (!peerReady) return;
    if (status !== 'idle') return;
    if (autoConnectRef.current) return;
    if (!remotePeerIdInput.trim()) return;

    autoConnectRef.current = true;
    const cleanup = defer(() => void connect());
    return cleanup;
  }, [connect, navState.sessionId, peerReady, remotePeerIdInput, status]);

  return (
    <div className="bg-white flex h-screen w-full items-center justify-center gap-4 overflow-hidden px-4 pt-24 pb-4">
      {/* --- LEFT SIDE: Main Interview Area --- */}
      <section className="bg-midnight-ink relative flex h-full w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-black/5">
        {/* Top Header (Overlay) */}
        <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            {/* [수정됨] 면접 이름 표시 (복사 기능 제거) */}
            <div className="bg-pure-white/10 text-pure-white flex items-center gap-2 rounded-full px-5 py-2 text-base font-bold shadow-sm ring-1 ring-white/10 backdrop-blur-md">
              <span className="tracking-wide opacity-95">{interviewTitle}</span>
            </div>

            {/* Status Badge */}
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase shadow-sm ring-1 backdrop-blur-md ${
                status === 'connected'
                  ? 'bg-success/20 text-success ring-success/30'
                  : status === 'connecting'
                    ? 'bg-point-blue/20 text-point-blue ring-point-blue/30'
                    : status === 'error'
                      ? 'bg-error/20 text-error ring-error/30'
                      : 'bg-silver-mist/20 text-silver-mist ring-silver-mist/30'
              }`}
            >
              {status === 'connected' && (
                <span className="bg-success h-2 w-2 animate-pulse rounded-full" />
              )}
              {status}
            </span>
          </div>
        </header>

        {/* Remote Video (Main) */}
        <div className="relative flex h-full w-full items-center justify-center">
          {remoteReady ? (
            <video
              ref={remoteVideoRef}
              className="h-full w-full object-contain"
              autoPlay
              playsInline
            />
          ) : (
            <div className="text-silver-mist flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="bg-slate-gray/50 flex h-28 w-28 items-center justify-center rounded-full backdrop-blur-sm">
                  <User className="text-soft-pebble h-12 w-12" />
                </div>
                {status === 'connecting' && (
                  <Loader2 className="text-point-blue absolute -right-2 -bottom-2 h-10 w-10 animate-spin" />
                )}
              </div>
              <p className="text-lg font-medium tracking-wide opacity-80">
                {status === 'connecting'
                  ? '상대방을 찾고 있습니다...'
                  : '상대방의 입장을 대기 중입니다.'}
              </p>
            </div>
          )}
        </div>

        {/* PIP (Local Video) */}
        <div className="bg-slate-gray absolute right-8 bottom-8 z-20 aspect-video w-64 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transition-transform hover:scale-105">
          {localReady ? (
            <div className="relative h-full w-full">
              <video
                ref={localVideoRef}
                className={`h-full w-full transform object-cover ${
                  !camOn ? 'hidden' : ''
                } scale-x-[-1]`}
                autoPlay
                playsInline
                muted
              />
              {!camOn && (
                <div className="bg-slate-gray absolute inset-0 flex items-center justify-center">
                  <CameraOff className="text-silver-mist h-8 w-8" />
                </div>
              )}
              <div className="bg-midnight-ink/60 text-pure-white absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                나 (You)
              </div>
            </div>
          ) : (
            <div className="bg-slate-gray flex h-full w-full items-center justify-center">
              <Loader2 className="text-silver-mist h-6 w-6 animate-spin" />
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-pure-white absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 transform items-center gap-6 rounded-full px-8 py-4 shadow-2xl ring-1 ring-black/5">
          {/* Mic */}
          <button
            onClick={() => setMicOn((prev) => !prev)}
            className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
              micOn
                ? 'bg-cloud-dancer text-slate-gray hover:bg-soft-pebble'
                : 'bg-error text-pure-white ring-error/30 ring-2 hover:bg-red-600'
            }`}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          {/* Cam */}
          <button
            onClick={() => setCamOn((prev) => !prev)}
            className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
              camOn
                ? 'bg-cloud-dancer text-slate-gray hover:bg-soft-pebble'
                : 'bg-error text-pure-white ring-error/30 ring-2 hover:bg-red-600'
            }`}
          >
            {camOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          </button>

          <div className="bg-soft-pebble mx-2 h-8 w-px opacity-50" />

          {/* Leave */}
          <button
            onClick={leave}
            className="bg-error text-pure-white shadow-error/20 flex h-12 w-20 items-center justify-center rounded-full shadow-lg transition-all hover:w-24 hover:bg-red-600 active:scale-95"
          >
            <PhoneOff className="h-5 w-5 fill-current" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="bg-slate-gray text-pure-white absolute top-24 left-1/2 z-50 -translate-x-1/2 transform animate-bounce rounded-full px-6 py-3 text-sm font-medium shadow-xl">
            {toast}
          </div>
        )}

        {/* Error Display */}
        {status === 'error' && errorMessage && (
          <div className="bg-pure-white ring-error/20 absolute top-1/2 left-1/2 max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 text-center shadow-2xl ring-1">
            <div className="bg-error/10 text-error mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <PhoneOff className="h-6 w-6" />
            </div>
            <h3 className="text-slate-gray mb-1 text-lg font-bold">연결 오류</h3>
            <p className="text-silver-mist text-sm">{errorMessage}</p>
          </div>
        )}
      </section>

      {/* --- RIGHT SIDE: Conditional Content Area --- */}
      <aside className="bg-midnight-ink flex hidden h-full w-[420px] flex-col items-center justify-center rounded-[2rem] p-6 text-center shadow-2xl ring-1 ring-black/5 xl:block">
        {isCorporate ? (
          <>
            <div className="bg-slate-gray/30 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <FileText className="text-point-blue h-8 w-8 opacity-80" />
            </div>
            <p className="text-pure-white text-lg font-bold">????? ??? ???????</p>
            <p className="text-silver-mist mt-2 text-sm">
              ???????????????? ??????
              <br /> ?????????????
            </p>
          </>
        ) : (
          <>
            <br />
            <p className="text-pure-white text-lg font-bold">???</p>
            <p className="text-silver-mist mt-2 text-sm">
              ??? ??? ?????? ?????????????
            </p>
          </>
        )}
      </aside>
    </div>
  );
}
