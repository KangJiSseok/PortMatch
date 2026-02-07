import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Send,
  ChevronLeft,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Briefcase,
  Sparkles,
  Lock,
  LogIn,
  AlertCircle,
  Check,
  Loader2, // ✅ 로딩 아이콘 추가
} from 'lucide-react';
import { useMessenger } from '../../hooks/useMessenger';
import { useAuth } from '../../hooks/useAuth';
import { getRelativeTime } from '../../utils/date';
import InterviewModal from './InterviewModal';
import type { ChatRoom, Message } from '../../types/messenger';
import SystemIcon from '../../assets/images/system/alarm.png';

// ==========================================
// 1. 타입 및 인터페이스 정의
// ==========================================

interface ExtendedMessage extends Message {
  additionalInfo?: {
    interviewId?: number | string;
    jobPostingId?: number | string;
    id?: number | string;
    [key: string]: unknown;
  };
}

// ✅ Provider의 로딩 상태를 포함하도록 확장
interface ExtendedMessengerContext {
  rooms: ChatRoom[];
  messages: Message[];
  currentRoomId: string | null;
  isOpen: boolean;
  totalUnreadCount: number;

  // 👇 로딩 상태 (핵심)
  areRoomsLoading: boolean;
  areMessagesLoading: boolean;

  setCurrentRoomId: (id: string | null) => void;
  toggleMessenger: () => void;
  sendMessage: (
    text: string,
    type?: 'text' | 'image' | 'interview',
    file?: File,
    additionalInfo?: Record<string, unknown>,
  ) => Promise<void>;
  fetchRooms: () => Promise<void>;
  acceptInterview: (
    messageId: string,
    interviewId: string | number,
    companyName: string,
  ) => Promise<void>;
  declineInterview: (
    messageId: string,
    interviewId: string | number,
    companyName: string,
  ) => Promise<void>;
  sendSystemNotification: (
    targetUserId: string | number,
    messageText: string,
    linkJobId?: number | string,
  ) => Promise<void>;
}

interface ModalConfig {
  isOpen: boolean;
  type: 'confirm' | 'confirm-success' | 'alert' | 'success';
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface JobPostingItem {
  id: number;
  title: string;
  [key: string]: unknown;
}

interface InterviewPayload {
  id: number;
  time: string;
  status: string;
  userId: number;
  jobPostingId: number;
  jobPosting: {
    id: number;
  };
  user: {
    userId: number;
  };
}

interface InterviewResponse {
  id: number;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
  userId: number;
  jobPostingId: number;
  user: {
    userId: number;
    name: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ==========================================
// 2. 공용 컴포넌트
// ==========================================

// ✅ [추가] 로딩 스피너 컴포넌트
const LoadingSpinner = ({ text = "불러오는 중..." }: { text?: string }) => (
  <div className="flex h-full w-full flex-col items-center justify-center p-10">
    <Loader2 className="text-point-blue h-8 w-8 animate-spin" />
    <p className="text-silver-mist mt-3 text-xs font-bold">{text}</p>
  </div>
);

const ConfirmModal = ({ config, onClose }: { config: ModalConfig; onClose: () => void }) => {
  if (!config.isOpen) return null;

  const isRed = config.type === 'confirm';
  const isGreen = config.type === 'success' || config.type === 'confirm-success';

  const Icon = isGreen ? Check : AlertCircle;

  const colorClass = isRed
    ? 'text-red-600 bg-red-100'
    : isGreen
      ? 'text-green-600 bg-green-100'
      : 'text-blue-600 bg-blue-100';

  const buttonColorClass = isRed
    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
    : isGreen
      ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20';

  const isConfirmModal = config.type === 'confirm' || config.type === 'confirm-success';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${colorClass}`}
            >
              <Icon size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900">{config.title}</h3>
            <p className="mt-2 text-sm font-medium whitespace-pre-wrap text-slate-500">
              {config.message}
            </p>
          </div>
          <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-4">
            {isConfirmModal ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (config.onConfirm) config.onConfirm();
                    onClose();
                  }}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-colors ${buttonColorClass}`}
                >
                  확인
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-colors ${buttonColorClass}`}
              >
                확인
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const CompanyLogo = ({ room }: { room: ChatRoom }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const isOpponentCompany = user?.role !== 'COMPANY' && room.companyName;
  const isSystem = room.senderType === 'system';
  const logoSrc = isSystem ? SystemIcon : room.logoUrl;

  return (
    <div className="relative shrink-0">
      <div className="border-soft-pebble bg-soft-pebble/20 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border">
        {logoSrc && !imgError ? (
          <img
            src={logoSrc}
            alt="profile"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-silver-mist">
            {isOpponentCompany ? <Building2 size={20} /> : <User size={20} />}
          </div>
        )}
      </div>
      {!logoSrc && isOpponentCompany && (
        <div className="bg-point-blue text-pure-white ring-pure-white absolute -right-1 -bottom-1 flex h-4 items-center justify-center rounded-md px-1 text-[8px] font-black uppercase ring-2">
          Corp
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. 채팅 목록 컴포넌트
// ==========================================
const ChatList = () => {
  // ✅ areRoomsLoading 추가
  const { rooms, setCurrentRoomId, currentRoomId, areRoomsLoading } =
    useMessenger() as unknown as ExtendedMessengerContext;
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isCompany = user?.role === 'COMPANY';

  const renderContent = () => {
    // 1. 비로그인 처리
    if (!user) {
      return (
        <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
          <div className="bg-soft-pebble/30 mb-6 flex h-24 w-24 items-center justify-center rounded-full">
            <Lock size={36} className="text-silver-mist opacity-80" />
          </div>
          <h3 className="text-midnight-ink mb-2 text-lg font-black tracking-tight">
            로그인이 필요해요
          </h3>
          <p className="text-slate-gray mb-8 text-xs leading-relaxed font-medium whitespace-pre-wrap">
            쪽지함을 확인하려면
            <br />
            먼저 로그인을 진행해주세요.
          </p>
          <button
            onClick={() => handleNavigation('/login')}
            className="bg-point-blue text-pure-white hover:bg-point-blue/90 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <LogIn size={14} /> 로그인하러 가기
          </button>
        </div>
      );
    }

    // 2. ✅ 로딩 중 처리 (빈 화면보다 먼저 체크!)
    if (areRoomsLoading) {
      return <LoadingSpinner text="대화방 불러오는 중..." />;
    }

    // 3. 빈 데이터 처리
    const isEmpty = !rooms || rooms.length === 0;
    if (isEmpty) {
      return (
        <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
          <div className="bg-soft-pebble/30 mb-6 flex h-24 w-24 items-center justify-center rounded-full">
            {isCompany ? (
              <Briefcase size={36} className="text-silver-mist opacity-80" />
            ) : (
              <FileText size={36} className="text-silver-mist opacity-80" />
            )}
          </div>
          <h3 className="text-midnight-ink mb-2 text-lg font-black tracking-tight">
            아직 주고받은 쪽지가 없어요
          </h3>
          <p className="text-slate-gray mb-8 text-xs leading-relaxed font-medium whitespace-pre-wrap">
            {isCompany
              ? '새로운 공고를 등록해 지원자를 모집하거나\n인재 추천을 받아 딱 맞는 분을 찾아보세요!'
              : '매력적인 이력서로 기업의 제안을 받아보거나\n관심 있는 공고에 지원해 대화를 시작해보세요!'}
          </p>
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => handleNavigation(isCompany ? '/company/jobs/new' : '/resumes/me')}
              className="bg-point-blue text-pure-white hover:bg-point-blue/90 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              {isCompany ? (
                <>
                  <Briefcase size={14} /> 채용 공고 등록하기
                </>
              ) : (
                <>
                  <FileText size={14} /> 이력서 작성하러 가기
                </>
              )}
            </button>
            <button
              onClick={() =>
                handleNavigation(isCompany ? '/company/recommend/candidates' : '/job-postings')
              }
              className="bg-soft-pebble/30 text-midnight-ink hover:bg-soft-pebble/50 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black transition-all active:scale-95"
            >
              {isCompany ? (
                <>
                  <Sparkles size={14} className="text-point-blue" /> 인재 풀 탐색하기
                </>
              ) : (
                <>
                  <Briefcase size={14} className="text-point-blue" /> 채용 공고 보러가기
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    // 4. 목록 렌더링
    return (
      <div className="divide-soft-pebble divide-y">
        {rooms.map((room: ChatRoom) => {
          const opponentName = user?.role === 'COMPANY' ? room.applicantName : room.companyName;
          const isMyLastMessage = room.lastSenderId === String(user?.userId);
          const isCurrentRoom = currentRoomId === room.id;

          return (
            <div
              key={room.id}
              onClick={() => setCurrentRoomId(room.id)}
              className={`flex cursor-pointer items-start gap-4 p-5 transition-all active:scale-[0.98] ${isCurrentRoom ? 'bg-soft-pebble/20' : 'hover:bg-soft-pebble/10'
                }`}
            >
              <CompanyLogo room={room} />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="text-midnight-ink truncate text-sm font-bold">
                    {opponentName || '이름 없음'}
                  </h4>
                  <span className="text-silver-mist text-[10px] font-bold">
                    {getRelativeTime(room.lastUpdatedAt)}
                  </span>
                </div>
                <p className="text-slate-gray truncate text-xs leading-relaxed font-medium">
                  {room.lastMessage}
                </p>
                {room.unreadCount > 0 && !isMyLastMessage && !isCurrentRoom && (
                  <div className="mt-2">
                    <span className="bg-point-blue inline-flex h-1.5 w-1.5 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-pure-white flex h-full flex-col overflow-hidden">
      <div className="border-soft-pebble bg-pure-white sticky top-0 z-10 flex items-center justify-between border-b p-6">
        <h2 className="text-midnight-ink text-xl font-black tracking-tighter">쪽지함</h2>
      </div>
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
};

// ==========================================
// 4. 채팅방 상세 컴포넌트
// ==========================================
interface ChatRoomWindowProps {
  roomId: string;
  pendingJobInfo: { id: number; title: string } | null;
  onConsumeJobInfo: () => void;
}

const ChatRoomWindow = ({ roomId, pendingJobInfo, onConsumeJobInfo }: ChatRoomWindowProps) => {
  const navigate = useNavigate();
  const {
    rooms,
    messages,
    setCurrentRoomId,
    sendMessage,
    acceptInterview,
    declineInterview,
    sendSystemNotification,
    areMessagesLoading, // ✅ 메시지 로딩 상태
  } = useMessenger() as unknown as ExtendedMessengerContext;
  const { user } = useAuth();
  const [input, setInput] = useState('');

  const [targetJobInfo, setTargetJobInfo] = useState<{ id: number; title: string } | null>(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
  });

  const [myJobPostings, setMyJobPostings] = useState<{ id: number; title: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = rooms.find((r: ChatRoom) => r.id === roomId);
  const isCompany = user?.role === 'COMPANY';
  const isSystemRoom = room?.senderType === 'system';
  const logoSrc = isSystemRoom ? SystemIcon : room?.logoUrl;
  const myIdentifier =
    isCompany && user?.cid ? `COMPANY_${String(user.cid)}` : String(user?.userId);

  const showAlert = (title: string, message: string, type: 'alert' | 'success' = 'alert') => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 면접 상태 동기화
  useEffect(() => {
    if (!messages || messages.length === 0 || isCompany) return;

    const syncInterviewStatuses = async () => {
      try {
        const res = await fetch(`/api/interviews/user/${user?.userId}`);
        if (!res.ok) return;

        const myInterviews: InterviewResponse[] = await res.json();
        const newProcessedIds = new Set<string>();

        messages.forEach((msg) => {
          if (msg.type !== 'interview') return;
          if (processedIds.has(msg.id)) return;

          const extMsg = msg as ExtendedMessage;
          const msgIntId = Number(
            extMsg.additionalInfo?.id || extMsg.additionalInfo?.interviewId || extMsg.interviewId,
          );
          const msgPostId = Number(extMsg.jobPostingId || extMsg.additionalInfo?.jobPostingId);

          if (msgIntId > 0) {
            const interview = myInterviews.find((i) => i.id === msgIntId);
            if (interview && interview.status !== 'PENDING') {
              newProcessedIds.add(msg.id);
            }
          } else if (msgPostId > 0) {
            const interview = myInterviews.find((i) => i.jobPostingId === msgPostId);
            if (interview && interview.status !== 'PENDING') {
              newProcessedIds.add(msg.id);
            }
          }
        });

        if (newProcessedIds.size > 0) {
          setProcessedIds((prev) => {
            const next = new Set(prev);
            newProcessedIds.forEach((id) => next.add(id));
            return next;
          });
        }
      } catch (e) {
        console.error('면접 상태 동기화 실패', e);
      }
    };

    syncInterviewStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isCompany, user?.userId]);

  useEffect(() => {
    if (isCompany) {
      const fetchMyJobs = async () => {
        try {
          const meRes = await fetch('/api/auth/me');
          const meJson = await meRes.json();
          if (meJson.status && meJson.data?.cid) {
            const cid = meJson.data.cid;
            const jobRes = await fetch(`/api/job-postings/company/${cid}`);
            const jobJson = await jobRes.json();
            if (jobJson.status && Array.isArray(jobJson.data)) {
              setMyJobPostings(
                jobJson.data.map((job: JobPostingItem) => ({
                  id: job.id,
                  title: job.title,
                })),
              );
            }
          }
        } catch (e) {
          console.error('공고 목록 로드 실패', e);
        }
      };
      fetchMyJobs();
    }
  }, [isCompany]);

  useEffect(() => {
    if (pendingJobInfo) {
      setTargetJobInfo(pendingJobInfo);
      setIsInterviewModalOpen(true);
      onConsumeJobInfo();
    }
  }, [pendingJobInfo, onConsumeJobInfo]);

  // ✅ [수정] 방이 없거나 로딩 중일 때 처리
  if (!room) {
    // 방 로딩이 덜 된 상태라면 아무것도 렌더링하지 않음 (ChatList로 돌아가거나 로딩 대기)
    return null;
  }

  const opponentName = isCompany ? room.applicantName : room.companyName;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const handleInterviewConfirm = async (
    dateTime: string,
    note: string,
    selectedJob: { id: number; title: string },
  ) => {
    const applicantIdentifier = room.participants.find((p) => !p.startsWith('COMPANY_'));
    const applicantId = Number(applicantIdentifier);

    if (!applicantId || isNaN(applicantId)) {
      showAlert('오류', '지원자 정보를 찾을 수 없어 면접 일정을 잡을 수 없습니다.');
      return;
    }

    try {
      const payload: InterviewPayload = {
        id: 0,
        time: new Date(dateTime).toISOString(),
        status: 'PENDING',
        userId: applicantId,
        jobPostingId: selectedJob.id,
        jobPosting: { id: selectedJob.id },
        user: { userId: applicantId },
      };

      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);

      const json = await response.json();
      console.log('면접 일정 생성 성공:', json);

      const companyName = room?.companyName || '기업';
      const interviewText = `[면접 제안]\n\n기업명: ${companyName}\n공고명: ${selectedJob.title}\n\n일시: ${dateTime}\n안내: ${note || '없음'}\n\n위 일정으로 면접을 제안합니다. 확인 부탁드립니다.`;

      const createdInterviewId = json.id;

      // 제안할 때도 시스템 알림과 유사하게 interviewId를 포함해서 전송
      await sendMessage(interviewText, 'interview', undefined, {
        interviewId: createdInterviewId,
        id: createdInterviewId,
        jobPostingId: selectedJob.id,
        jobPostingTitle: selectedJob.title,
      });

      setIsInterviewModalOpen(false);
      setTargetJobInfo(null);
      showAlert('전송 완료', '면접 제안을 성공적으로 보냈습니다.', 'success');
    } catch (error) {
      console.error('면접 일정 잡기 실패:', error);
      showAlert('전송 실패', '면접 일정을 잡는데 실패했습니다.\n잠시 후 다시 시도해주세요.');
    }
  };

  const fetchInterviewIdByPosting = async (jobPostingId: number): Promise<number | null> => {
    try {
      const res = await fetch(`/api/interviews/posting/${jobPostingId}`);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      const data: InterviewResponse[] = await res.json();
      const myInterview = data.find((item) => item.userId === user?.userId);
      return myInterview ? myInterview.id : null;
    } catch (error) {
      console.error('면접 ID 조회 실패:', error);
      return null;
    }
  };

  // ✅ [수락] 로직 (sendSystemNotification 사용)
  const executeAccept = async (msg: Message) => {
    if (msg.isAccepted || msg.isDeclined || processedIds.has(msg.id)) return;
    setIsProcessing(true);

    try {
      const extMsg = msg as ExtendedMessage;

      const rawId =
        extMsg.additionalInfo?.id || extMsg.additionalInfo?.interviewId || extMsg.interviewId;

      let interviewId = Number(rawId);

      if (isNaN(interviewId) || interviewId === 0) {
        const postingId = extMsg.jobPostingId || extMsg.additionalInfo?.jobPostingId;
        if (postingId) {
          const fetchedId = await fetchInterviewIdByPosting(Number(postingId));
          if (fetchedId) interviewId = fetchedId;
        }
      }

      if (!interviewId || interviewId === 0) {
        throw new Error('유효한 면접 ID를 찾을 수 없습니다.');
      }

      const numericId = Number(interviewId);

      // 1. 상태 업데이트
      const listRes = await fetch(`/api/interviews/user/${user?.userId}`);
      if (!listRes.ok) throw new Error('면접 목록 조회 실패');

      const allInterviews: InterviewResponse[] = await listRes.json();
      const targetInterview = allInterviews.find((item) => item.id === numericId);

      if (!targetInterview) {
        throw new Error('해당 면접 정보를 찾을 수 없습니다.');
      }

      const updatePayload = {
        ...targetInterview,
        status: 'CONFIRMED',
      };

      const putRes = await fetch(`/api/interviews/${numericId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!putRes.ok) throw new Error('면접 수락(상태 변경) 실패');

      await acceptInterview(msg.id, interviewId, room.companyName || '기업');
      setProcessedIds((prev) => new Set(prev).add(msg.id));

      const userName = user?.name || '지원자';
      const jobTitle = msg.jobPostingTitle || '채용 공고';

      // ✅ 타겟 ID 결정 (내가 기업이면 -> 지원자, 내가 지원자면 -> 기업)
      const targetId = isCompany ? room.applicantId : room.companyId;

      if (targetId) {
        const acceptText = `[면접 수락 안내]\n안녕하세요, ${userName}입니다.\n\n제안 주신 [${jobTitle}] 면접 요청을 확인하였으며, 기쁜 마음으로 수락합니다.\n\n안내해주신 일정에 늦지 않게 참석하겠습니다.\n감사합니다.`;

        await sendSystemNotification(targetId, acceptText, numericId);
      } else {
        // Fallback
        const acceptText = `[면접 수락 안내]\n안녕하세요, ${userName}입니다.\n\n제안 주신 [${jobTitle}] 면접 요청을 수락합니다.`;
        await sendMessage(acceptText, 'text');
      }

      showAlert('수락 완료', '면접 제안을 수락했습니다.\n안내 메시지가 전송되었습니다.', 'success');
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showAlert('오류', `면접 수락 처리에 실패했습니다.\n${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptClick = (msg: Message) => {
    if (msg.isAccepted || msg.isDeclined || isProcessing || processedIds.has(msg.id)) return;
    setModalConfig({
      isOpen: true,
      type: 'confirm-success',
      title: '면접 수락',
      message: '이 면접 제안을 수락하시겠습니까?',
      onConfirm: () => executeAccept(msg),
    });
  };

  // ✅ [거절] 로직 (sendSystemNotification 사용)
  const executeDecline = async (msg: Message) => {
    if (msg.isAccepted || msg.isDeclined || processedIds.has(msg.id)) return;
    setIsProcessing(true);

    try {
      const extMsg = msg as ExtendedMessage;

      const rawId =
        extMsg.additionalInfo?.id || extMsg.additionalInfo?.interviewId || extMsg.interviewId;

      let interviewId = Number(rawId);

      if (isNaN(interviewId) || interviewId === 0) {
        const postingId = extMsg.jobPostingId || extMsg.additionalInfo?.jobPostingId;
        if (postingId) {
          const fetchedId = await fetchInterviewIdByPosting(Number(postingId));
          if (fetchedId) interviewId = fetchedId;
        }
      }

      if (interviewId && interviewId !== 0) {
        const numericId = Number(interviewId);

        const listRes = await fetch(`/api/interviews/user/${user?.userId}`);

        if (listRes.ok) {
          const allInterviews: InterviewResponse[] = await listRes.json();
          const targetInterview = allInterviews.find((item) => item.id === numericId);

          if (targetInterview) {
            const updatePayload = {
              ...targetInterview,
              status: 'CANCELED',
            };

            const putRes = await fetch(`/api/interviews/${numericId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatePayload),
            });

            if (!putRes.ok) {
              throw new Error(`면접 상태 변경 실패: ${putRes.status}`);
            }
          } else {
            console.warn('거절할 면접 정보를 목록에서 찾을 수 없음');
          }
        }
      }

      await declineInterview(msg.id, interviewId || 'pending', room.companyName || '기업');
      setProcessedIds((prev) => new Set(prev).add(msg.id));

      const userName = user?.name || '지원자';
      const jobTitle = msg.jobPostingTitle || '채용 공고';

      // ✅ 타겟 ID 결정
      const targetId = isCompany ? room.applicantId : room.companyId;

      if (targetId) {
        const declineText = `[면접 거절 안내]\n안녕하세요, ${userName}입니다.\n\n보내주신 [${jobTitle}] 면접 제안에 진심으로 감사드립니다.\n\n다만, 아쉽게도 개인적인 사정으로 인해 이번 면접에는 참석하기 어려울 것 같습니다.\n\n좋은 제안을 주셔서 감사드리며, 귀사의 무궁한 발전을 기원합니다.`;

        await sendSystemNotification(targetId, declineText, interviewId);
      } else {
        // Fallback
        const declineText = `[면접 거절 안내]\n안녕하세요, ${userName}입니다.\n\n아쉽지만 이번 면접 제안은 거절하게 되었습니다. 죄송합니다.`;
        await sendMessage(declineText, 'text');
      }

      showAlert('거절 완료', '면접 제안을 거절했습니다.\n안내 메시지가 전송되었습니다.', 'success');
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showAlert('오류', `면접 거절 처리에 실패했습니다.\n${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineClick = (msg: Message) => {
    if (msg.isAccepted || msg.isDeclined || isProcessing || processedIds.has(msg.id)) return;
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: '면접 거절',
      message: '정말로 이 면접 제안을 거절하시겠습니까?\n거절 후에는 되돌릴 수 없습니다.',
      onConfirm: () => executeDecline(msg),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) return;
      e.preventDefault();
      if (input.trim()) {
        handleSend(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <div className="bg-pure-white flex flex-1 flex-col overflow-hidden">
      <ConfirmModal
        config={modalConfig}
        onClose={() => setModalConfig((p) => ({ ...p, isOpen: false }))}
      />

      <div className="border-soft-pebble bg-pure-white sticky top-0 z-10 flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentRoomId(null)}
            className="text-midnight-ink hover:text-point-blue transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-50">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={opponentName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '';
                  }}
                />
              ) : (
                <div className="text-silver-mist">
                  {isCompany ? <User size={18} /> : <Building2 size={18} />}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-midnight-ink text-sm leading-none font-black tracking-tight">
                  {opponentName || '이름 없음'}
                </span>
                {!logoSrc && room.companyName && !isCompany && (
                  <span className="bg-point-blue/10 text-point-blue rounded px-1.5 py-0.5 text-[9px] leading-none font-black uppercase">
                    Corp
                  </span>
                )}
              </div>
              <span className="text-silver-mist mt-0.5 text-[10px] font-medium">
                {isSystemRoom ? '시스템 알림' : isCompany ? '지원자' : '기업 담당자'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-pure-white flex-1 space-y-6 overflow-y-auto p-5 pb-18">

        {/* ✅ [수정] 메시지 로딩 스피너 (메시지가 없는데 로딩중일때만) */}
        {areMessagesLoading && messages.length === 0 ? (
          <LoadingSpinner text="메시지 불러오는 중..." />
        ) : (
          <>
            {messages.map((msg: Message) => {
              const isMe = msg.senderId === myIdentifier;
              const isInterview = msg.type === 'interview';
              const isProcessed = processedIds.has(msg.id) || msg.isAccepted || msg.isDeclined;

              // ✅ 시스템 메시지(알림) 스타일링
              if (msg.senderId === 'system' || msg.type === 'system') {
                return (
                  <div key={msg.id} className="my-4 flex justify-center">
                    <div className="max-w-[80%] rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-center text-xs font-bold whitespace-pre-wrap text-slate-500 shadow-sm">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="group relative max-w-[85%]">
                    <div
                      className={`rounded-2xl border p-4 shadow-sm transition-all ${msg.isAccepted
                          ? 'border-point-blue/30 bg-point-blue/5'
                          : msg.isDeclined
                            ? 'border-gray-200 bg-gray-50 opacity-80'
                            : isInterview
                              ? 'bg-point-blue/5 border-point-blue/30 text-midnight-ink'
                              : isMe
                                ? 'bg-point-blue border-point-blue text-pure-white'
                                : 'bg-pure-white border-soft-pebble text-midnight-ink'
                        }`}
                    >
                      {isInterview && (
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              size={12}
                              className={msg.isDeclined ? 'text-slate-gray' : 'text-point-blue'}
                            />
                            <span
                              className={`text-[10px] font-black uppercase ${msg.isDeclined ? 'text-slate-gray' : 'text-point-blue'
                                }`}
                            >
                              {msg.isAccepted
                                ? 'Accepted'
                                : msg.isDeclined
                                  ? 'Declined'
                                  : 'Interview Request'}
                            </span>
                          </div>
                          {msg.isAccepted && <CheckCircle2 size={14} className="text-point-blue" />}
                          {msg.isDeclined && <XCircle size={14} className="text-slate-gray" />}
                        </div>
                      )}

                      <div
                        className={`mb-2 flex items-start justify-between border-b pb-2 ${isMe && !isInterview ? 'border-pure-white/20' : 'border-midnight-ink/10'
                          }`}
                      >
                        <span className="text-[9px] font-black tracking-widest uppercase opacity-70">
                          {isMe ? 'Sent' : 'Received'}
                        </span>
                        <span className="text-[9px] font-bold opacity-70">
                          {msg.createdAt
                            ?.toDate()
                            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-relaxed font-medium whitespace-pre-wrap ${isInterview ? 'font-bold' : ''}`}
                      >
                        {msg.text}
                      </p>

                      {isInterview && msg.jobPostingId && !isCompany && (
                        <div
                          className={`mt-3 border-t pt-3 ${isMe ? 'border-pure-white/20' : 'border-black/5'}`}
                        >
                          <button
                            onClick={() => navigate(`/job-posts/${msg.jobPostingId}`)}
                            className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-colors ${isMe
                                ? 'bg-white/20 text-white hover:bg-white/30'
                                : 'bg-white/50 text-slate-700 hover:bg-white hover:text-blue-600'
                              }`}
                          >
                            <FileText size={12} />
                            공고 상세 보기
                          </button>
                        </div>
                      )}

                      {isInterview && !isMe && !isProcessed && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleAcceptClick(msg)}
                            disabled={isProcessing}
                            className="bg-point-blue text-pure-white flex-1 rounded-lg py-3 text-[11px] font-black shadow-md transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50"
                          >
                            수락
                          </button>
                          <button
                            onClick={() => handleDeclineClick(msg)}
                            disabled={isProcessing}
                            className="bg-soft-pebble text-midnight-ink flex-1 rounded-lg py-3 text-[11px] font-black transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {!isSystemRoom ? (
        <div className="bg-pure-white border-soft-pebble border-t p-5">
          <form
            onSubmit={handleSend}
            className="border-soft-pebble focus-within:ring-point-blue bg-soft-pebble/5 flex flex-col gap-2 rounded-xl border p-3 transition-all focus-within:ring-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-midnight-ink placeholder:text-silver-mist h-20 w-full resize-none border-none bg-transparent text-xs leading-relaxed font-bold outline-none placeholder:whitespace-pre-wrap"
              placeholder={'회신할 내용을 입력하세요...\n(Enter: 전송 / Shift+Enter: 줄바꿈)'}
            />
            <div className="flex items-center justify-between">
              {isCompany && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetJobInfo(null);
                    setIsInterviewModalOpen(true);
                  }}
                  className="text-point-blue flex items-center gap-1.5 text-[11px] font-black transition-opacity hover:opacity-80"
                >
                  <Calendar size={14} /> 면접 제안
                </button>
              )}
              <div className="flex flex-1 justify-end">
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition-all ${input.trim()
                      ? 'bg-point-blue text-pure-white shadow-md'
                      : 'bg-soft-pebble text-silver-mist'
                    }`}
                >
                  쪽지 보내기 <Send size={14} />
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="border-soft-pebble border-t bg-gray-50 p-6 text-center">
          <span className="text-silver-mist flex items-center justify-center gap-2 text-xs font-bold">
            <Lock size={14} />
            발신 전용 알림 센터입니다.
          </span>
        </div>
      )}

      <InterviewModal
        key={isInterviewModalOpen ? 'open' : 'closed'}
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        onConfirm={handleInterviewConfirm}
        defaultJob={targetJobInfo}
        jobPostings={myJobPostings}
      />
    </div>
  );
};

// ==========================================
// 5. 메인 컨테이너
// ==========================================
const MessengerContainer = () => {
  const { user } = useAuth();
  const { isOpen, currentRoomId, totalUnreadCount, toggleMessenger, fetchRooms } =
    useMessenger() as unknown as ExtendedMessengerContext;

  const [pendingJobInfo, setPendingJobInfo] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setPendingJobInfo(customEvent.detail);
      }
    };
    window.addEventListener('OPEN_INTERVIEW_MODAL', handleOpenModal);
    return () => window.removeEventListener('OPEN_INTERVIEW_MODAL', handleOpenModal);
  }, []);

  // 로그인 시 fetchRooms 2회 호출 (토큰/상태 동기화 안정성 확보)
  useEffect(() => {
    if (user?.userId) {
      if (fetchRooms) fetchRooms();

      const timer = setTimeout(() => {
        if (fetchRooms) fetchRooms();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user?.userId, fetchRooms]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="border-soft-pebble bg-pure-white fixed right-8 bottom-30 z-9999 flex h-150 w-95 flex-col overflow-hidden rounded-4xl border shadow-[0_20px_50px_rgba(26,26,26,0.15)]"
          >
            {currentRoomId ? (
              <ChatRoomWindow
                // ✅ key를 제거하여 불필요한 언마운트 방지
                roomId={currentRoomId}
                pendingJobInfo={pendingJobInfo}
                onConsumeJobInfo={() => setPendingJobInfo(null)}
              />
            ) : (
              <ChatList key={user ? `list-${user.userId}` : 'list-guest'} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleMessenger}
        className="bg-point-blue text-pure-white fixed right-8 bottom-8 z-9999 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95"
      >
        <Mail size={32} />
        {totalUnreadCount > 0 && (
          <span className="bg-error text-pure-white ring-pure-white animate-bounce-subtle absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-[12px] font-black shadow-[0_0_10px_rgba(255,59,48,0.5)] ring-2">
            {totalUnreadCount}
          </span>
        )}
      </button>
    </>
  );
};

export default MessengerContainer;