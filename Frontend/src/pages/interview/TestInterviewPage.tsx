// src/pages/interview/TestInterviewPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MediaConnection } from 'peerjs';

import Button from '../../components/Button/Button';
import { createPeer } from '../../utils/peerConnection';

type UserRole = 'guest' | 'individual' | 'corporate';

type TestRoomNavState = {
  sessionId?: string;
  micOn?: boolean;
  camOn?: boolean;
};

type ConnectStatus = 'idle' | 'connecting' | 'connected' | 'error';

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

export default function TestInterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? {}) as TestRoomNavState;

  const role = ((localStorage.getItem('userRole') ?? 'guest') as UserRole) || 'guest';
  const isCorporate = role === 'corporate';

  const [status, setStatus] = useState<ConnectStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [remotePeerIdInput, setRemotePeerIdInput] = useState<string>(
    navState.sessionId ?? ''
  );

  const [micOn, setMicOn] = useState<boolean>(navState.micOn ?? true);
  const [camOn, setCamOn] = useState<boolean>(navState.camOn ?? true);

  const peerRef = useRef<ReturnType<typeof createPeer> | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [myPeerId, setMyPeerId] = useState<string>('');
  const [localReady, setLocalReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);

  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 1600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const canConnect = useMemo(
    () => remotePeerIdInput.trim().length > 0,
    [remotePeerIdInput]
  );

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    setLocalReady(true);

    return stream;
  }, []);

  const cleanupSession = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }

    stopStreamTracks(localStreamRef.current);
    localStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setLocalReady(false);
    setRemoteReady(false);
    setStatus('idle');
    setErrorMessage('');
  }, []);

  const connect = useCallback(async () => {
    const remoteId = remotePeerIdInput.trim();

    if (!remoteId) {
      showToast('상대방 Peer ID가 비어있어요!');
      return;
    }

    if (!peerRef.current) {
      showToast('Peer 연결 준비 중이에요. 잠시만 기다려주세요!');
      return;
    }

    cleanupSession();
    setStatus('connecting');
    setErrorMessage('');

    try {
      const stream = await getLocalStream();
      stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
      stream.getVideoTracks().forEach((t) => (t.enabled = camOn));

      const call = peerRef.current.call(remoteId, stream);

      if (!call) {
        throw new Error('통화 연결을 시작하지 못했어요.');
      }

      callRef.current = call;

      call.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        setRemoteReady(true);
        setStatus('connected');
      });

      call.on('close', () => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setRemoteReady(false);
        setStatus('idle');
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
  }, [camOn, cleanupSession, getLocalStream, micOn, remotePeerIdInput, showToast]);

  const leave = useCallback(() => {
    cleanupSession();
    navigate(-1);
  }, [cleanupSession, navigate]);

  useEffect(() => {
    const peer = createPeer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      setMyPeerId(id);
    });

    peer.on('call', async (call) => {
      try {
        setStatus('connecting');
        callRef.current?.close();
        callRef.current = call;

        const stream = await getLocalStream();
        stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
        stream.getVideoTracks().forEach((t) => (t.enabled = camOn));

        call.answer(stream);

        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          setRemoteReady(true);
          setStatus('connected');
        });

        call.on('close', () => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          setRemoteReady(false);
          setStatus('idle');
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
      localStreamRef.current = null;

      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, [camOn, getLocalStream, micOn]);

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

  // 페이지 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  // 들어오자마자 peerId가 있으면 자동 연결(테스트 편의)
  useEffect(() => {
    if (!navState.sessionId) return;
    const cleanup = defer(() => {
      void connect();
    });
    return cleanup;
  }, [connect, navState.sessionId]);

  const copyMyPeerId = useCallback(async () => {
    if (!myPeerId) {
      showToast('아직 내 Peer ID가 준비되지 않았어요!');
      return;
    }
    try {
      await navigator.clipboard.writeText(myPeerId);
      showToast('내 Peer ID 복사 완료!');
    } catch {
      showToast('복사 실패… 직접 드래그해서 복사해줘!');
    }
  }, [myPeerId, showToast]);

  return (
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-32 pb-20">
      <div className="mx-auto w-[1280px] space-y-10 px-6">
        <header className="border-b border-zinc-100 pb-6">
          <div className="flex items-end justify-between gap-5">
            <div className="min-w-0">
              <p className="text-xs font-black tracking-[0.35em] text-zinc-400 uppercase">
                test interview room
              </p>
              <p className="mt-4 truncate text-lg font-bold text-zinc-600 sm:text-xl">
                PeerJS 연결 테스트 (DB 조회 없음)
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="rounded-2xl"
                onClick={() => navigate(-1)}
              >
                뒤로
              </Button>
              <Button type="button" variant="red" size="md" className="rounded-2xl" onClick={leave}>
                나가기
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <section className="col-span-1 rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm">
            <p className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">controls</p>

            <div className="mt-4 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-black">My Peer ID</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                상대방에게 내 Peer ID를 공유하세요.
              </p>

              <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-black text-zinc-700">
                {myPeerId || '발급 중...'}
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="flex-1 rounded-2xl"
                  onClick={copyMyPeerId}
                >
                  복사
                </Button>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-black">상대방 Peer ID</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                상대방의 Peer ID를 입력하고 통화를 시작하세요.
              </p>

              <input
                value={remotePeerIdInput}
                onChange={(e) => setRemotePeerIdInput(e.target.value)}
                placeholder="예: peer_xxx123"
                className={[
                  'mt-3 w-full rounded-2xl border bg-white px-4 py-3 text-base font-bold text-zinc-700',
                  'focus:ring-midnight-ink border-zinc-200 outline-none focus:ring-2',
                ].join(' ')}
              />

              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="flex-1 rounded-2xl"
                  onClick={() => setRemotePeerIdInput('')}
                >
                  비우기
                </Button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-black">마이크</p>
                <Button
                  type="button"
                  variant="filter"
                  size="md"
                  isActive={micOn}
                  className="rounded-2xl border-2"
                  onClick={() => setMicOn((v) => !v)}
                >
                  {micOn ? 'ON' : 'OFF'}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-black">카메라</p>
                <Button
                  type="button"
                  variant="filter"
                  size="md"
                  isActive={camOn}
                  className="rounded-2xl border-2"
                  onClick={() => setCamOn((v) => !v)}
                >
                  {camOn ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>

            {status === 'error' && errorMessage ? (
              <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-black text-red-600">연결 실패</p>
                <p className="mt-2 text-xs font-semibold break-words text-red-600/80">
                  {errorMessage}
                </p>
              </div>
            ) : null}

            <div className="mt-8 space-y-2">
              <Button
                type="button"
                variant="blue"
                size="md"
                className="w-full rounded-2xl"
                onClick={() => void connect()}
                disabled={!canConnect || status === 'connecting'}
              >
                {status === 'connected'
                  ? '재연결'
                  : status === 'connecting'
                    ? '연결 중...'
                    : '통화 시작'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full rounded-2xl"
                onClick={cleanupSession}
                disabled={status !== 'connected' && status !== 'connecting'}
              >
                연결 끊기
              </Button>

              <p className="mt-2 text-sm font-semibold text-zinc-500">
                상태:{' '}
                <span className="font-black">
                  {status === 'idle'
                    ? '대기'
                    : status === 'connecting'
                      ? '연결 중'
                      : status === 'connected'
                        ? '연결됨'
                        : '오류'}
                </span>
                <span className="text-zinc-300"> · </span>
                참가자{' '}
                <span className="font-black">
                  {(localReady ? 1 : 0) + (remoteReady ? 1 : 0)}
                </span>
              </p>

              {isCorporate ? (
                <p className="text-xs font-semibold text-zinc-400">
                  기업 계정에서는 상대방 Peer ID를 꼭 확인해주세요.
                </p>
              ) : null}
            </div>
          </section>

          <section className="col-span-2 rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-lg font-black tracking-tighter">화상 테스트</p>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  로컬(내 화면) + 리모트(상대 화면) 둘 다 떠야 성공!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-600 shadow-sm ring-1 ring-zinc-100">
                  MIC: {micOn ? 'ON' : 'OFF'}
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-600 shadow-sm ring-1 ring-zinc-100">
                  CAM: {camOn ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="col-span-2 overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                  <p className="text-sm font-black text-zinc-600">REMOTE</p>
                  <span className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">
                    peer
                  </span>
                </div>

                <div className="bg-midnight-ink relative flex h-[420px] items-center justify-center">
                  {remoteReady ? (
                    <video
                      ref={remoteVideoRef}
                      className="h-full w-full object-cover"
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
                      {status === 'connected' || status === 'connecting'
                        ? 'waiting for peer...'
                        : 'not connected'}
                    </span>
                  )}

                  {toast ? (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-zinc-700 shadow-sm">
                      {toast}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="col-span-1 overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                  <p className="text-sm font-black text-zinc-600">LOCAL</p>
                  <span className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase">
                    preview
                  </span>
                </div>

                <div className="bg-midnight-ink relative flex h-[420px] items-center justify-center">
                  {localReady ? (
                    <video
                      ref={localVideoRef}
                      className="h-full w-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
                      {status === 'connecting' ? 'initializing...' : 'no local stream'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
