// src/pages/InterviewLobbyPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Button from '../../components/Button/Button';
import { fetchMyInterviewViewById, type InterviewSessionView } from '../../api/myPage';

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

function LobbyHeader({ subtitle, onBack }: { subtitle: string; onBack: () => void }) {
  return (
    <header className="border-b border-zinc-100 pb-6">
      <div className="flex items-end justify-between gap-5">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <p className="text-xs font-black tracking-[0.35em] text-zinc-400 uppercase">
              interview lobby
            </p>
          </div>
          <p className="mt-4 truncate text-lg font-bold text-zinc-600 sm:text-xl">{subtitle}</p>
        </div>

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
      </div>

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

/** ✅ effect 본문에서 setState “즉시 호출” 피하려고 한 번 늦춰 실행 */
function defer(fn: () => void) {
  const id = window.setTimeout(fn, 0);
  return () => window.clearTimeout(id);
}

export default function InterviewLobbyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? {}) as LobbyNavState;

  const interviewId = Number(id);

  const role = ((localStorage.getItem('userRole') ?? 'guest') as UserRole) || 'guest';
  const isCorporate = role === 'corporate';

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('세션 정보를 불러오지 못했어요.');
  const [session, setSession] = useState<InterviewSessionView | null>(null);

  // ✅ 리스트에서 state로 넘겨준 기본 OFF를 반영
  const [micOn, setMicOn] = useState<boolean>(navState.initialMicOn ?? false);
  const [camOn, setCamOn] = useState<boolean>(navState.initialCamOn ?? false);

  // ✅ 미디어 프리뷰 상태
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string>('');
  const [micLevel, setMicLevel] = useState<number>(0); // 0~1

  // ✅ 트랙만 바뀌어도(스트림 객체는 같아도) 리렌더/이펙트 재실행하게 하는 트리거
  const [streamRev, setStreamRev] = useState(0);

  // ✅ async 경합 방지(카메라/마이크 따로)
  const camOpIdRef = useRef(0);
  const micOpIdRef = useRef(0);

  // ✅ 최신 스트림을 안전하게 참조
  const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    streamRef.current = mediaStream;
  }, [mediaStream]);

  // audio meter refs
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ✅ 토스트(clipboard 복사 안내) — no-alert 회피
  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 1800);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const load = useCallback(async () => {
    // ✅ 테스트 분기 제거: id가 유효하지 않으면 notfound 처리
    if (!Number.isFinite(interviewId) || interviewId <= 0) {
      setSession(null);
      setStatus('notfound');
      return;
    }

    setStatus('loading');
    setErrorMessage('세션 정보를 불러오지 못했어요.');

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
  }, [interviewId]);

  // ✅ 빨간줄 방지: effect 본문에서 load 즉시 호출 X → defer 콜백에서 호출
  useEffect(() => {
    const cleanup = defer(() => {
      void load();
    });
    return cleanup;
  }, [load]);

  const goList = useCallback(() => {
    navigate(ROUTES.list);
  }, [navigate]);

  const goRoom = useCallback(() => {
    if (!session) return;
    navigate(ROUTES.room(session.interview_id), {
      state: { micOn, camOn, sessionId: navState.sessionId ?? session.room_id },
    });
  }, [camOn, micOn, navigate, navState.sessionId, session]);

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
      try {
        const ta = document.createElement('textarea');
        ta.value = inviteLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('초대 링크 복사 완료!');
      } catch {
        showToast('복사 실패… 링크를 직접 복사해줘!');
      }
    }
  }, [inviteLink, showToast]);

  const ensureMediaSupported = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError('이 브라우저는 카메라/마이크 권한 요청을 지원하지 않아요.');
      return false;
    }
    return true;
  }, []);

  /**
   * ✅ 0) 둘 다 OFF면 스트림 완전 종료
   * - cam/mic 토글 로직이 서로 건드리지 않도록 “완전 종료”만 따로 관리
   */
  useEffect(() => {
    const alive = { current: true };

    const cleanup = defer(() => {
      if (!alive.current) return;

      if (camOn || micOn) return;

      setMediaError('');
      const current = streamRef.current;
      if (current) stopStream(current);
      setMediaStream(null);
      setMicLevel(0);
      setStreamRev((v) => v + 1);
    });

    return () => {
      alive.current = false;
      cleanup();
    };
  }, [camOn, micOn]);

  /**
   * ✅ 1) 카메라 토글 전용 (마이크 변화에 반응 X)
   * - 깜빡임 방지 핵심
   */
  useEffect(() => {
    const alive = { current: true };
    const opId = ++camOpIdRef.current;

    const cleanup = defer(() => {
      if (!alive.current) return;

      const run = async () => {
        // camOn이 꺼지면 비디오 트랙만 제거
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

        // camOn이 켜지면 비디오 트랙만 확보/추가
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
          if (!vt) {
            stopStream(s);
            return;
          }

          const latest = streamRef.current;
          if (latest) {
            latest.addTrack(vt);
            setStreamRev((v) => v + 1);
          } else {
            setMediaStream(new MediaStream([vt]));
          }
        } catch (e) {
          const msg =
            e instanceof Error
              ? e.message
              : '카메라 권한 요청에 실패했어요. 브라우저 권한 설정을 확인해 주세요.';
          setMediaError(msg);
        }
      };

      void run();
    });

    return () => {
      alive.current = false;
      cleanup();
    };
  }, [camOn, ensureMediaSupported]);

  /**
   * ✅ 2) 마이크 토글 전용 (카메라 변화에 반응 X)
   * - 깜빡임 방지 핵심
   */
  useEffect(() => {
    const alive = { current: true };
    const opId = ++micOpIdRef.current;

    const cleanup = defer(() => {
      if (!alive.current) return;

      const run = async () => {
        // micOn이 꺼지면 오디오 트랙만 제거
        if (!micOn) {
          setMediaError('');
          const current = streamRef.current;
          if (current) {
            removeTracksByKind(current, 'audio');
            setMicLevel(0);
            if (current.getTracks().length === 0) setMediaStream(null);
            setStreamRev((v) => v + 1);
          }
          return;
        }

        // micOn이 켜지면 오디오 트랙만 확보/추가
        if (!ensureMediaSupported()) return;

        setMediaError('');

        const base = streamRef.current;
        if (base && base.getAudioTracks().length > 0) {
          base.getAudioTracks().forEach((t) => (t.enabled = true));
          setStreamRev((v) => v + 1);
          return;
        }

        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

          if (!alive.current || opId !== micOpIdRef.current) {
            stopStream(s);
            return;
          }

          const at = s.getAudioTracks()[0];
          if (!at) {
            stopStream(s);
            return;
          }

          const latest = streamRef.current;
          if (latest) {
            latest.addTrack(at);
            setStreamRev((v) => v + 1);
          } else {
            setMediaStream(new MediaStream([at]));
          }
        } catch (e) {
          const msg =
            e instanceof Error
              ? e.message
              : '마이크 권한 요청에 실패했어요. 브라우저 권한 설정을 확인해 주세요.';
          setMediaError(msg);
          setMicLevel(0);
        }
      };

      void run();
    });

    return () => {
      alive.current = false;
      cleanup();
    };
  }, [micOn, ensureMediaSupported]);

  // ✅ video 태그에 stream 연결 (트랙만 바뀌어도 play 재시도)
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

    const p = el.play();
    if (p) {
      p.catch(() => {});
    }
  }, [mediaStream, streamRev]);

  // ✅ 마이크 레벨 측정
  useEffect(() => {
    const alive = { current: true };

    // 기존 cleanup
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    const cleanup = defer(() => {
      if (!alive.current) return;

      setMicLevel(0);

      if (!micOn) return;

      const s = streamRef.current;
      if (!s) return;
      if (s.getAudioTracks().length === 0) return;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

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
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);

        const level = Math.min(1, rms * 3.5);
        setMicLevel(level);

        rafRef.current = requestAnimationFrame(tick);
      };

      ctx
        .resume()
        .then(() => {
          if (alive.current) tick();
        })
        .catch(() => {});
    });

    return () => {
      alive.current = false;
      cleanup();

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [micOn, streamRev]);

  // ✅ unmount 시 스트림 종료
  useEffect(() => {
    return () => {
      const current = streamRef.current;
      if (current) stopStream(current);
    };
  }, []);

  if (status === 'loading') return <LobbySkeleton onBack={goList} />;
  if (status === 'error') return <ErrorBox message={errorMessage} onRetry={load} onBack={goList} />;
  if (status === 'notfound' || !session) return <NotFoundBox onBack={goList} />;

  const showPreview = camOn && !!mediaStream && mediaStream.getVideoTracks().length > 0;

  return (
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-32 pb-20">
      <div className="mx-auto w-[1280px] space-y-10 px-6">
        <LobbyHeader
          subtitle={`${session.companyName} · ${session.postingTitle}`}
          onBack={goList}
        />

        <div className="grid grid-cols-3 gap-6">
          <section className="col-span-1 rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm">
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

            {isCorporate && (
              <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-black">지원자 초대 링크</p>
                <p className="mt-2 text-xs font-semibold break-all text-zinc-500">{inviteLink}</p>
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

            {mediaError && (
              <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-black text-red-600">권한/디바이스 오류</p>
                <p className="mt-2 text-xs font-semibold break-words text-red-600/80">
                  {mediaError}
                </p>
                <p className="mt-2 text-xs font-semibold text-red-600/70">
                  브라우저 주소창의 🔒 권한에서 카메라/마이크를 허용해 주세요.
                </p>
              </div>
            )}

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

          <section className="col-span-2 rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-lg font-black tracking-tighter">내 화면 미리보기</p>
              </div>

              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-600 shadow-sm ring-1 ring-zinc-100">
                <span className="tracking-[0.25em] text-zinc-400 uppercase">mic level</span>
                <div className="h-2 w-40 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="bg-point-blue h-full transition-[width] duration-150"
                    style={{ width: `${Math.round(micLevel * 100)}%` }}
                  />
                </div>
                <span className="tabular-nums">{Math.round(micLevel * 100)}%</span>
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

              <div className="bg-midnight-ink relative flex h-[360px] items-center justify-center">
                {camOn ? (
                  showPreview ? (
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover"
                      playsInline
                      autoPlay
                      muted
                    />
                  ) : (
                    <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
                      {mediaStream ? 'starting camera...' : 'requesting permission...'}
                    </span>
                  )
                ) : (
                  <span className="text-cloud-dancer text-sm font-black tracking-[0.3em] uppercase">
                    camera disabled
                  </span>
                )}

                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-zinc-700 shadow-sm">
                  <span className={micOn ? 'text-emerald-600' : 'text-zinc-500'}>
                    MIC {micOn ? 'ON' : 'OFF'}
                  </span>
                  <span className="text-zinc-300">·</span>
                  <span className={camOn ? 'text-emerald-600' : 'text-zinc-500'}>
                    CAM {camOn ? 'ON' : 'OFF'}
                  </span>
                </div>

                {toast ? (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-zinc-700 shadow-sm">
                    {toast}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-zinc-700">체크 포인트</p>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-zinc-600">
                <li>• 권한 허용 팝업이 뜨면 허용 눌러줘야 프리뷰가 나와요.</li>
                <li>• 마이크는 위 Mic Level 막대가 움직이면 “진짜 입력 들어오는 중”.</li>
                <li>• 카메라가 안 보이면 브라우저 주소창 🔒 권한 확인.</li>
              </ul>
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
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-32 pb-20">
      <div className="mx-auto w-[1280px] space-y-10 px-6">
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
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-32 pb-20">
      <div className="mx-auto w-[1280px] space-y-10 px-6">
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
    <div className="text-midnight-ink min-h-screen min-w-[1280px] bg-white pt-32 pb-20">
      <div className="mx-auto w-[1280px] space-y-10 px-6">
        <LobbyHeader subtitle="입장 전 대기실" onBack={onBack} />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 animate-pulse rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm">
            <div className="h-3 w-24 rounded bg-zinc-200/70" />
            <div className="mt-3 h-7 w-64 rounded bg-zinc-200/60" />
            <div className="mt-4 h-4 w-40 rounded bg-zinc-200/50" />

            <div className="mt-8 space-y-3">
              <div className="h-16 rounded-3xl bg-white ring-1 ring-zinc-100" />
              <div className="h-16 rounded-3xl bg-white ring-1 ring-zinc-100" />
            </div>

            <div className="mt-8 h-11 w-full rounded-2xl bg-zinc-200/60" />
          </div>

          <div className="col-span-2 animate-pulse rounded-4xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm">
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
