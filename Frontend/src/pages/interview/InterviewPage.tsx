// src/pages/interview/InterviewPage.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MediaConnection } from 'peerjs';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, User, Loader2, FileText } from 'lucide-react';

import { createPeer } from '../../utils/peerConnection';
import { useAuthStore } from '../../store/authStore';
import {
  fetchInterviewTemplates,
  type InterviewTemplateSummary,
  type InterviewTemplateDetail,
  fetchInterviewTemplateDetail,
  fetchInterviewQuestionMemo,
  updateInterviewQuestionMemo,
} from '../../api/interview/InterviewTemplates';
import {
  fetchInterviewPartnerPeer,
  registerInterviewPeer,
  type InterviewRoomRole,
} from '../../api/interview/room';

// --- Types ---

type RoomNavState = {
  sessionId?: string;
  title?: string; // 면접 이름 (추후)
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

  return msg || (err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
}

// --- Component ---
export default function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state ?? {}) as RoomNavState;

  // Role 가져오기
  const { user } = useAuthStore();
  const isCorporate = user?.role === 'COMPANY';
  const roomId = navState.sessionId?.trim() ?? '';
  const myRole: InterviewRoomRole = isCorporate ? 'INTERVIEWER' : 'APPLICANT';

  // -- State --
  const [status, setStatus] = useState<ConnectStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const interviewTitle = navState.title ?? '포트매치 기술 면접'; // 면접 이름 (기본값)

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
  const pollTimerRef = useRef<number | null>(null);

  // --- Templates & Memos State ---
  const [templates, setTemplates] = useState<InterviewTemplateSummary[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | number | null>(null);
  const [templateDetailById, setTemplateDetailById] = useState<
    Record<string | number, InterviewTemplateDetail | null>
  >({});

  // [수정] 문법 오류가 있던 State 선언부 수정
  const [templateDetailLoadingId, setTemplateDetailLoadingId] = useState<string | number | null>(
    null,
  );

  const [memoByKey, setMemoByKey] = useState<Record<string, string>>({});
  const [memoOpenByKey, setMemoOpenByKey] = useState<Record<string, boolean>>({});
  const [memoLoadingByKey, setMemoLoadingByKey] = useState<Record<string, boolean>>({});
  const [memoSavingByKey, setMemoSavingByKey] = useState<Record<string, boolean>>({});
  const [memoErrorByKey, setMemoErrorByKey] = useState<Record<string, string>>({});
  const [hasTemplateScrollbar, setHasTemplateScrollbar] = useState(false);
  const templateListRef = useRef<HTMLDivElement | null>(null);

  const pipRef = useRef<HTMLDivElement | null>(null);

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
      throw new Error('카메라 / 마이크 권한이 필요합니다.');
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
    if (!camOn && !micOn) return;
    if (localStreamRef.current) return;
    void getLocalStream().catch((err) => {
      setStatus('error');
      setErrorMessage(toHumanError(err));
    });
  }, [camOn, getLocalStream, micOn]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!camOn) {
      if (!stream) return;
      stream.getVideoTracks().forEach((t) => (t.enabled = false));
      return;
    }

    const hasLiveVideo = stream?.getVideoTracks().some((t) => t.readyState === 'live');
    if (!stream || !hasLiveVideo) {
      localStreamRef.current = null;
      setLocalStream(null);
      setLocalReady(false);
      void getLocalStream()
        .then((nextStream) => {
          nextStream.getVideoTracks().forEach((t) => (t.enabled = true));
        })
        .catch((err) => {
          setStatus('error');
          setErrorMessage(toHumanError(err));
        });
      return;
    }

    stream.getVideoTracks().forEach((t) => (t.enabled = true));
  }, [camOn, getLocalStream]);

  // --- Connect Logic ---
  const connect = useCallback(async (silent = false) => {
    if (!roomId) {
      if (!silent) showToast('면접방 정보가 없습니다.');
      return;
    }
    if (!peerRef.current || !peerReady) return;
    if (status === 'connecting') return;

    cleanupSession();
    setStatus('connecting');
    setErrorMessage('');

    try {
      const partnerId = await fetchInterviewPartnerPeer(roomId, myRole);
      const remoteId = partnerId?.trim() ?? '';
      if (!remoteId) {
        if (!silent) showToast('상대방이 아직 입장하지 않았습니다.');
        setStatus('idle');
        return;
      }

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
    myRole,
    peerReady,
    roomId,
    showToast,
    status,
  ]);

  // --- Peer Event Listeners ---
  useEffect(() => {
    const peer = createPeer();
    peerRef.current = peer;

    peer.on('open', async (id) => {
      setPeerReady(true);
      if (!roomId) return;
      try {
        await registerInterviewPeer(roomId, myRole, id);
      } catch (err) {
        setStatus('error');
        setErrorMessage(toHumanError(err));
      }
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
  }, [camOn, getLocalStream, micOn, myRole, roomId, showToast]);

  useEffect(() => {
    if (!roomId) return;
    if (!peerReady) return;
    if (status !== 'idle') return;
    if (autoConnectRef.current) return;
    autoConnectRef.current = true;
    const cleanup = defer(() => void connect(true));
    return cleanup;
  }, [connect, peerReady, roomId, status]);

  useEffect(() => {
    if (!roomId || !peerReady) return;
    if (pollTimerRef.current) return;

    pollTimerRef.current = window.setInterval(() => {
      if (status !== 'idle') return;
      if (!roomId) return;
      void connect(true);
    }, 3000);

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [connect, peerReady, roomId, status]);

  useEffect(() => {
    const el = templateListRef.current;
    if (!el) return;

    const update = () => setHasTemplateScrollbar(el.scrollHeight > el.clientHeight);
    update();

    const handleResize = () => update();
    window.addEventListener('resize', handleResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      ro?.disconnect();
    };
  }, [templates, expandedTemplateId, memoOpenByKey]);

  useEffect(() => {
    let ignore = false;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError('');
      try {
        const result = await fetchInterviewTemplates();
        if (ignore) return;
        if (result.status && Array.isArray(result.data)) {
          setTemplates(result.data);
        } else {
          setTemplates([]);
        }
      } catch (err) {
        if (ignore) return;
        setTemplates([]);
        setTemplatesError(toHumanError(err));
      } finally {
        if (!ignore) setTemplatesLoading(false);
      }
    };

    void loadTemplates();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleTemplate = useCallback(
    async (templateId: string | number) => {
      const shouldExpand = expandedTemplateId !== templateId;
      if (!shouldExpand) {
        setExpandedTemplateId(null);
        return;
      }

      setExpandedTemplateId(templateId);

      if (templateDetailById[templateId]) return;
      if (templateDetailLoadingId === templateId) return;

      setTemplateDetailLoadingId(templateId);
      try {
        const result = await fetchInterviewTemplateDetail(templateId);
        if (result.status) {
          setTemplateDetailById((prev) => ({ ...prev, [templateId]: result.data }));
        } else {
          setTemplateDetailById((prev) => ({ ...prev, [templateId]: null }));
        }
      } catch (err) {
        setTemplateDetailById((prev) => ({ ...prev, [templateId]: null }));
        setTemplatesError(toHumanError(err));
      } finally {
        setTemplateDetailLoadingId((prev) => (prev === templateId ? null : prev));
      }
    },
    [expandedTemplateId, templateDetailById, templateDetailLoadingId],
  );

  const getMemoKey = (
    templateId: string | number,
    topicId: string | number,
    questionId: string | number,
  ) => `${templateId}:${topicId}:${questionId}`;

  const handleToggleMemo = useCallback(
    async (templateId: string | number, topicId: string | number, questionId: string | number) => {
      const key = getMemoKey(templateId, topicId, questionId);
      const willOpen = !memoOpenByKey[key];
      setMemoOpenByKey((prev) => ({ ...prev, [key]: !prev[key] }));
      if (!willOpen) return;

      if (memoByKey[key] !== undefined) return;

      setMemoLoadingByKey((prev) => ({ ...prev, [key]: true }));
      setMemoErrorByKey((prev) => ({ ...prev, [key]: '' }));
      try {
        const result = await fetchInterviewQuestionMemo(templateId, topicId, questionId);
        if (result.status) {
          setMemoByKey((prev) => ({ ...prev, [key]: result.data.memoContent ?? '' }));
        } else {
          setMemoByKey((prev) => ({ ...prev, [key]: '' }));
        }
      } catch (err) {
        setMemoErrorByKey((prev) => ({ ...prev, [key]: toHumanError(err) }));
      } finally {
        setMemoLoadingByKey((prev) => ({ ...prev, [key]: false }));
      }
    },
    [memoByKey, memoOpenByKey],
  );

  const handleSaveMemo = useCallback(
    async (templateId: string | number, topicId: string | number, questionId: string | number) => {
      const key = getMemoKey(templateId, topicId, questionId);
      const memoContent = memoByKey[key] ?? '';

      setMemoSavingByKey((prev) => ({ ...prev, [key]: true }));
      setMemoErrorByKey((prev) => ({ ...prev, [key]: '' }));
      try {
        const result = await updateInterviewQuestionMemo(
          templateId,
          topicId,
          questionId,
          memoContent,
        );
        if (result.status) {
          setMemoByKey((prev) => ({ ...prev, [key]: result.data.memoContent ?? memoContent }));
        }
      } catch (err) {
        setMemoErrorByKey((prev) => ({ ...prev, [key]: toHumanError(err) }));
      } finally {
        setMemoSavingByKey((prev) => ({ ...prev, [key]: false }));
      }
    },
    [memoByKey],
  );

  const showRightSide = isCorporate;

  return (
    <div
      className={`flex h-screen w-full items-center justify-center overflow-hidden bg-white px-4 pt-4 pb-4 ${
        showRightSide ? 'gap-4' : ''
      }`}
    >
      {/* --- LEFT SIDE: Main Interview Area --- */}
      <section className="bg-midnight-ink relative flex h-full w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-black/5">
        {/* Top Header (Overlay) */}
        <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            {/* [수정] 면접 이름 표시 (복사 기능 제거) */}
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
                  : '상대방의 입장을 대기중입니다.'}
              </p>
            </div>
          )}
        </div>

        {/* PIP (Local Video) */}
        <div
          ref={pipRef}
          className="bg-slate-gray absolute right-8 bottom-8 z-20 aspect-video w-64 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transition-transform hover:scale-105"
        >
          {localReady ? (
            <div className="relative h-full w-full">
              <video
                ref={localVideoRef}
                className={`h-full w-full transform object-cover ${!camOn ? 'hidden' : ''} scale-x-[-1]`}
                autoPlay
                playsInline
                muted
              />
              {!camOn && (
                <div className="bg-slate-gray absolute inset-0 flex items-center justify-center">
                  <CameraOff className="text-silver-mist h-8 w-8" />
                </div>
              )}
              <div className="bg-midnight-ink/20 text-pure-white absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                내 화면
              </div>
            </div>
          ) : (
            <div className="bg-slate-gray flex h-full w-full items-center justify-center">
              <Loader2 className="text-silver-mist h-6 w-6 animate-spin" />
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-pure-white absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 transform items-center gap-4 rounded-full px-6 py-3 shadow-2xl ring-1 ring-black/5">
          {/* Mic */}
          <button
            onClick={() => setMicOn((prev) => !prev)}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
              micOn
                ? 'bg-cloud-dancer text-slate-gray hover:bg-soft-pebble'
                : 'bg-error text-pure-white ring-error/30 ring-2 hover:bg-red-600'
            }`}
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          {/* Cam */}
          <button
            onClick={() => setCamOn((prev) => !prev)}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
              camOn
                ? 'bg-cloud-dancer text-slate-gray hover:bg-soft-pebble'
                : 'bg-error text-pure-white ring-error/30 ring-2 hover:bg-red-600'
            }`}
          >
            {camOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
          </button>

          <div className="bg-soft-pebble mx-2 h-8 w-px opacity-50" />

          {/* Leave */}
          <button
            onClick={leave}
            className="bg-error text-pure-white shadow-error/20 flex h-10 w-16 items-center justify-center rounded-full shadow-lg transition-all hover:w-20 hover:bg-red-600 active:scale-95"
          >
            <PhoneOff className="h-4 w-4 fill-current" />
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

      {/* --- RIGHT SIDE: Corporate Only --- */}
      {showRightSide && (
        <aside className="bg-midnight-ink hidden h-full w-[420px] flex-col gap-4 rounded-[2rem] p-6 shadow-2xl ring-1 ring-black/5 xl:flex">
          <section className="flex min-h-0 flex-[2] flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-slate-gray/30 flex h-10 w-10 items-center justify-center rounded-xl">
                <FileText className="text-point-blue h-5 w-5 opacity-90" />
              </div>
              <div>
                <p className="text-pure-white text-lg font-bold">Template List</p>
                <p className="text-silver-mist text-sm">Corporate templates</p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {templatesLoading ? (
                <div className="text-silver-mist flex flex-1 items-center justify-center text-sm">
                  Loading templates...
                </div>
              ) : templatesError ? (
                <div className="text-error/80 flex flex-1 items-center justify-center text-center text-xs leading-relaxed">
                  {templatesError}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-silver-mist flex flex-1 items-center justify-center text-sm">
                  No templates yet.
                </div>
              ) : (
                <div
                  ref={templateListRef}
                  className={`custom-scrollbar flex-1 space-y-3 overflow-y-auto ${
                    hasTemplateScrollbar ? 'pl-2 pr-1' : 'px-2'
                  } [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-white/45 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/5`}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.35) transparent',
                  }}
                >
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border-soft-pebble/20 bg-pure-white/5 flex flex-col gap-2 rounded-2xl border p-4"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTemplate(template.id)}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="bg-point-blue/20 text-point-blue max-w-[70%] truncate rounded-full px-3 py-1 text-[12px] font-bold uppercase">
                              {template.targetRole || 'Role'}
                            </span>
                            <span className="text-silver-mist text-[12px] font-medium">
                              {template.updatedAt || template.createdAt
                                ? new Date(
                                    template.updatedAt || template.createdAt || '',
                                  ).toLocaleDateString()
                                : ''}
                            </span>
                          </div>
                          <p className="text-pure-white mt-1 text-base font-semibold">
                            {template.title}
                          </p>
                        </div>
                        <span className="text-silver-mist text-sm">
                          {expandedTemplateId === template.id ? '닫기' : '보기'}
                        </span>
                      </button>

                      {expandedTemplateId === template.id && (
                        <div className="border-soft-pebble/20 mt-2 border-t pt-3">
                          {templateDetailLoadingId === template.id ? (
                            <div className="text-silver-mist text-sm">상세 불러오는 중..</div>
                          ) : templateDetailById[template.id] ? (
                            <div className="space-y-3">
                              {templateDetailById[template.id]?.topics?.length ? (
                                templateDetailById[template.id]?.topics.map((topic) => (
                                  <div key={topic.id} className="space-y-2">
                                    <p className="text-pure-white text-sm font-bold">
                                      {topic.name}
                                    </p>
                                    <div className="space-y-2">
                                      {(topic.questions || []).map((q, idx) => {
                                        const memoKey = getMemoKey(template.id, topic.id, q.id);
                                        const memoOpen = memoOpenByKey[memoKey];
                                        const memoLoading = memoLoadingByKey[memoKey];
                                        const memoSaving = memoSavingByKey[memoKey];
                                        const memoError = memoErrorByKey[memoKey];
                                        const memoValue = memoByKey[memoKey] ?? '';
                                        return (
                                          <div key={q.id} className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                              <p className="text-silver-mist text-[12px] leading-relaxed">
                                                Q{idx + 1}. {q.content}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleToggleMemo(template.id, topic.id, q.id)
                                                }
                                                className="text-point-blue/80 text-[11px] font-semibold"
                                              >
                                                {memoOpen ? '메모 닫기' : '메모 열기'}
                                              </button>
                                            </div>

                                            {memoOpen && (
                                              <div className="space-y-2">
                                                {memoLoading ? (
                                                  <div className="text-silver-mist text-[11px]">
                                                    메모 불러오는 중..
                                                  </div>
                                                ) : (
                                                  <textarea
                                                    value={memoValue}
                                                    onChange={(e) =>
                                                      setMemoByKey((prev) => ({
                                                        ...prev,
                                                        [memoKey]: e.target.value,
                                                      }))
                                                    }
                                                    placeholder="질문 메모를 입력하세요."
                                                    className="bg-midnight-ink/60 border-soft-pebble/30 text-pure-white placeholder:text-silver-mist/70 min-h-16 w-full resize-none rounded-lg border p-2 text-[12px] leading-relaxed outline-none"
                                                  />
                                                )}
                                                <div className="flex items-center justify-between gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleSaveMemo(template.id, topic.id, q.id)
                                                    }
                                                    disabled={memoSaving}
                                                    className="bg-point-blue text-pure-white rounded-md px-3 py-1.5 text-[11px] font-semibold disabled:opacity-60"
                                                  >
                                                    {memoSaving ? '저장 중..' : '저장'}
                                                  </button>
                                                  {memoError && (
                                                    <span className="text-error/80 text-[11px]">
                                                      {memoError}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-silver-mist text-sm">
                                  등록된 질문이 없습니다.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-error/80 text-xs">
                              상세 정보를 불러오지 못했습니다.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>
      )}
    </div>
  );
}

