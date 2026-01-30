// src/pages/TestInterviewPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  OpenVidu,
  type Publisher,
  type Session,
  type StreamManager,
  type Subscriber,
} from 'openvidu-browser';

import Button from '../../components/Button/Button';
import axiosInstance from '../../api/axiosInstance';

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

function stopStreamTracks(sm: StreamManager | null) {
  try {
    const ms = sm?.stream?.getMediaStream?.();
    if (!ms) return;
    ms.getTracks().forEach((t) => t.stop());
  } catch {
    // ignore
  }
}

function StreamVideo({
  streamManager,
  muted,
}: {
  streamManager: StreamManager | null;
  muted?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !streamManager) return;

    streamManager.addVideoElement(el);
    if (muted) el.muted = true;

    return () => {
      if (el) el.srcObject = null;
    };
  }, [muted, streamManager]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      autoPlay
      playsInline
      muted={muted}
    />
  );
}

/**
 * 토큰만 받아서 붙는 테스트 (DB 조회 X)
 * - POST /api/interview/sessions/{sessionId}/connections
 */
async function fetchOpenViduToken(sessionId: string): Promise<string> {
  const sid = encodeURIComponent(sessionId);
  const res = await axiosInstance.post(`/interview/sessions/${sid}/connections`, {});

  const payload = res.data as unknown;
  const data = (payload as { data?: unknown })?.data ?? payload;

  // 1) 서버가 string으로 바로 내려주는 경우
  if (typeof data === 'string') return data;

  // 2) { token: "..." } / { connectionToken: "..." } 같은 경우
  if (typeof data === 'object' && data) {
    const obj = data as Record<string, unknown>;
    const token =
      (typeof obj.token === 'string' && obj.token) ||
      (typeof obj.connectionToken === 'string' && obj.connectionToken) ||
      (typeof obj.wsToken === 'string' && obj.wsToken);

    if (token) return token;
  }

  throw new Error('토큰 응답 형식이 예상과 달라요.');
}

/**
 * 서버가 내려준 토큰이 wss://.../openvidu 형태면 그대로 사용.
 * 로컬/프록시 환경에서 host/path가 꼬이는 경우에만 VITE_OPENVIDU_PUBLIC_URL 기준으로 보정.
 *
 * VITE_OPENVIDU_PUBLIC_URL 예시:
 *  - https://i14d205.p.ssafy.io           (추천)
 *  - https://i14d205.p.ssafy.io/openvidu  (가능)
 *  - http://i14d205.p.ssafy.io:8443       (가능)
 */
function normalizeOpenViduToken(raw: string): string {
  const publicUrl = (import.meta.env.VITE_OPENVIDU_PUBLIC_URL as string | undefined) ?? '';
  if (!publicUrl) return raw;

  try {
    const t = new URL(raw);

    // raw가 ws/wss URL이 아니면 그대로
    if (t.protocol !== 'ws:' && t.protocol !== 'wss:') return raw;

    // ✅ 요청대로 ws/wss 프로토콜은 유지하고, :4443만 /openvidu로 교체
    t.port = '';
    t.pathname = '/openvidu';

    return t.toString();
  } catch {
    return raw;
  }
}

function toHumanError(err: unknown): string {
  // axios 에러
  if (axios.isAxiosError(err)) {
    const http = err.response?.status;
    const msg =
      (typeof err.response?.data === 'string' && err.response.data) ||
      (err.response?.data as { message?: string } | undefined)?.message ||
      err.message;
    return http ? `(${http}) ${msg}` : msg;
  }

  // OpenVidu connect 에러
  const anyErr = err as Record<string, unknown> | null;
  const msg =
    (typeof anyErr?.message === 'string' && anyErr.message) ||
    (typeof anyErr?.error === 'string' && anyErr.error) ||
    (typeof anyErr?.reason === 'string' && anyErr.reason) ||
    '';

  if (msg.includes('Token') && msg.includes('401')) {
    return [
      'OpenVidu 토큰 인증 실패(401).',
      '토큰 발급 서버(/connections)와 실제 OpenVidu 인스턴스가 같은 곳을 보고 있는지 확인하세요.',
      '(nginx 라우팅/포트/secret 설정 불일치가 흔한 원인)',
    ].join(' ');
  }

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

  const [sessionIdInput, setSessionIdInput] = useState<string>(navState.sessionId ?? '');

  const [micOn, setMicOn] = useState<boolean>(navState.micOn ?? true);
  const [camOn, setCamOn] = useState<boolean>(navState.camOn ?? true);

  const ovSessionRef = useRef<Session | null>(null);
  const publisherRef = useRef<Publisher | null>(null);
  const connectOpRef = useRef(0);

  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

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

  const canConnect = useMemo(() => sessionIdInput.trim().length > 0, [sessionIdInput]);

  const cleanupSession = useCallback(() => {
    const s = ovSessionRef.current;
    const p = publisherRef.current;

    stopStreamTracks(p);

    try {
      s?.disconnect();
    } catch {
      // ignore
    }

    ovSessionRef.current = null;
    publisherRef.current = null;

    setPublisher(null);
    setSubscribers([]);
    setStatus('idle');
    setErrorMessage('');
  }, []);

  const connect = useCallback(async () => {
    const sid = sessionIdInput.trim();

    if (!sid) {
      showToast('sessionId 비어있음!');
      return;
    }

    cleanupSession();
    setStatus('connecting');
    setErrorMessage('');

    const opId = ++connectOpRef.current;

    try {
      // 1) 토큰 받기 + 필요하면 보정
      const token = await fetchOpenViduToken(sid);
      const normalized = normalizeOpenViduToken(token);

      // eslint-disable-next-line no-console
      console.log('OV TOKEN  =', token);
      // eslint-disable-next-line no-console
      console.log('OV NORMAL =', normalized);
      // eslint-disable-next-line no-console
      console.log('OV PUBLIC =', import.meta.env.VITE_OPENVIDU_PUBLIC_URL);

      if (opId !== connectOpRef.current) return;

      // 2) 세션 생성/이벤트 바인딩
      const ov = new OpenVidu();
      const session = ov.initSession();
      ovSessionRef.current = session;

      session.on('streamCreated', (event) => {
        const sub = session.subscribe(event.stream, undefined);
        setSubscribers((prev) => [...prev, sub]);
      });

      session.on('streamDestroyed', (event) => {
        const deadId = event.stream.streamId;
        setSubscribers((prev) => prev.filter((s) => s.stream.streamId !== deadId));
      });

      session.on('exception', (event) => {
        // eslint-disable-next-line no-console
        console.warn('OpenVidu exception:', event);
      });

      // 3) connect
      await session.connect(normalized, {
        clientData: isCorporate ? 'corporate' : role,
      });

      if (opId !== connectOpRef.current) {
        session.disconnect();
        return;
      }

      // 4) 퍼블리셔 생성 + publish
      const publisherObj = await ov.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: micOn,
        publishVideo: camOn,
        mirror: true,
        resolution: '1280x720',
        frameRate: 30,
      });

      publisherRef.current = publisherObj;
      setPublisher(publisherObj);

      session.publish(publisherObj);

      setStatus('connected');
    } catch (err) {
      cleanupSession();
      setStatus('error');
      setErrorMessage(toHumanError(err));
    }
  }, [camOn, cleanupSession, isCorporate, micOn, role, sessionIdInput, showToast]);

  const leave = useCallback(() => {
    cleanupSession();
    navigate(-1);
  }, [cleanupSession, navigate]);

  // mic/cam 상태 변경 시 publisher 반영
  useEffect(() => {
    const p = publisherRef.current;
    if (!p) return;
    try {
      p.publishAudio(micOn);
    } catch {
      // ignore
    }
  }, [micOn]);

  useEffect(() => {
    const p = publisherRef.current;
    if (!p) return;
    try {
      p.publishVideo(camOn);
    } catch {
      // ignore
    }
  }, [camOn]);

  // 페이지 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  // 들어오자마자 sessionId가 있으면 자동 연결(테스트 편의)
  useEffect(() => {
    if (!navState.sessionId) return;
    const cleanup = defer(() => {
      void connect();
    });
    return cleanup;
  }, [connect, navState.sessionId]);

  const copySessionId = useCallback(async () => {
    const sid = sessionIdInput.trim();
    if (!sid) {
      showToast('복사할 sessionId가 비어있어요!');
      return;
    }
    try {
      await navigator.clipboard.writeText(sid);
      showToast('sessionId 복사 완료!');
    } catch {
      showToast('복사 실패… 직접 드래그해서 복사해줘!');
    }
  }, [sessionIdInput, showToast]);

  const remoteMain = subscribers[0] ?? null;
  const remoteRest = subscribers.slice(1);

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
                OpenVidu 연결 테스트 (DB 조회 없음)
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
              <p className="text-sm font-black">Session ID</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">
                같은 sessionId로 서로 들어오면 같은 방에서 만나요.
              </p>

              <input
                value={sessionIdInput}
                onChange={(e) => setSessionIdInput(e.target.value)}
                placeholder="예: ses_dummy_test_001"
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
                  onClick={copySessionId}
                >
                  복사
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="flex-1 rounded-2xl"
                  onClick={() => setSessionIdInput('')}
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
                <p className="mt-2 text-xs font-semibold text-red-600/70">
                  (특히 401이면) 토큰 발급 OpenVidu와 실제 접속 OpenVidu가 같은 곳인지 확인!
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
                    : '연결'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full rounded-2xl"
                onClick={cleanupSession}
                disabled={status !== 'connected'}
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
                <span className="font-black">{subscribers.length + (publisher ? 1 : 0)}</span>
              </p>
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
                    subscriber
                  </span>
                </div>

                <div className="bg-midnight-ink relative flex h-[420px] items-center justify-center">
                  {remoteMain ? (
                    <StreamVideo streamManager={remoteMain} />
                  ) : (
                    <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
                      {status === 'connected' ? 'waiting for peer...' : 'not connected'}
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
                  {publisher ? (
                    <StreamVideo streamManager={publisher} muted />
                  ) : (
                    <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
                      {status === 'connecting' ? 'initializing...' : 'no local stream'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {remoteRest.length > 0 ? (
              <div className="mt-4 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-black text-zinc-700">추가 참가자</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {remoteRest.map((s) => (
                    <div
                      key={s.stream.streamId}
                      className="bg-midnight-ink/90 overflow-hidden rounded-3xl border border-zinc-100"
                    >
                      <div className="h-40">
                        <StreamVideo streamManager={s} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
