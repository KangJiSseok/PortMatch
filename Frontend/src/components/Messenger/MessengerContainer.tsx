import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Send,
  ChevronLeft,
  Search,
  MoreHorizontal,
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
} from 'lucide-react';
import { useMessenger } from '../../hooks/useMessenger';
import { useAuth } from '../../hooks/useAuth';
import { getRelativeTime } from '../../utils/date';
import InterviewModal from './InterviewModal';
import type { ChatRoom, Message } from '../../types/messenger';

const CompanyLogo = ({ room }: { room: ChatRoom }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const isOpponentCompany = user?.role !== 'COMPANY' && room.companyName;

  return (
    <div className="relative shrink-0">
      <div className="border-soft-pebble bg-soft-pebble/20 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border">
        {room.logoUrl && !imgError ? (
          <img
            src={room.logoUrl}
            alt="profile"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-silver-mist">
            {isOpponentCompany ? <Building2 size={24} /> : <User size={24} />}
          </div>
        )}
      </div>

      {!room.logoUrl && isOpponentCompany && (
        <div className="bg-point-blue text-pure-white ring-pure-white absolute -right-1 -bottom-1 flex h-5 items-center justify-center rounded-md px-1 text-[8px] font-black uppercase ring-2">
          Corp
        </div>
      )}
    </div>
  );
};

const ChatList = () => {
  const { rooms, setCurrentRoomId } = useMessenger();
  const { user } = useAuth();

  const isLoggedIn = !!user;
  const isEmpty = !rooms || rooms.length === 0;
  const isCompany = user?.role === 'COMPANY';

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  const renderContent = () => {
    if (!isLoggedIn) {
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
            onClick={handleLoginRedirect}
            className="bg-point-blue text-pure-white hover:bg-point-blue/90 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <LogIn size={14} /> 로그인하러 가기
          </button>
        </div>
      );
    }

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
            <button className="bg-point-blue text-pure-white hover:bg-point-blue/90 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95">
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

            <button className="bg-soft-pebble/30 text-midnight-ink hover:bg-soft-pebble/50 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black transition-all active:scale-95">
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

    return (
      <div className="divide-soft-pebble divide-y">
        {rooms.map((room: ChatRoom) => {
          const opponentName = user?.role === 'COMPANY' ? room.applicantName : room.companyName;
          const isMyLastMessage = room.lastSenderId === String(user?.userId);

          return (
            <div
              key={room.id}
              onClick={() => setCurrentRoomId(room.id)}
              className="hover:bg-soft-pebble/10 flex cursor-pointer items-start gap-4 p-5 transition-all active:scale-[0.98]"
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
                {room.unreadCount > 0 && !isMyLastMessage && (
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
        {isLoggedIn && <Search size={20} className="text-silver-mist cursor-pointer" />}
      </div>

      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
};

const ChatRoomWindow = ({ roomId }: { roomId: string }) => {
  const { rooms, messages, setCurrentRoomId, sendMessage, acceptInterview, declineInterview } =
    useMessenger();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = rooms.find((r: ChatRoom) => r.id === roomId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!room) return null;

  const opponentName = user?.role === 'COMPANY' ? room.applicantName : room.companyName;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const handleInterviewConfirm = async (dateTime: string, note: string) => {
    const interviewText = `[면접 제안]\n일시: ${dateTime}\n안내: ${note || '없음'}\n위 일정으로 면접을 제안합니다. 확인 부탁드립니다.`;
    await sendMessage(interviewText, 'interview');
  };

  const handleAccept = async (msg: Message) => {
    if (msg.isAccepted || msg.isDeclined || isProcessing) return;
    if (!window.confirm('이 면접 제안을 수락하시겠습니까?')) return;

    setIsProcessing(true);
    try {
      await acceptInterview(msg.id, msg.interviewId || 'pending', room.companyName || '기업');
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (msg: Message) => {
    if (msg.isAccepted || msg.isDeclined || isProcessing) return;
    if (!window.confirm('이 면접 제안을 거절하시겠습니까?')) return;

    setIsProcessing(true);
    try {
      await declineInterview(msg.id, msg.interviewId || 'pending', room.companyName || '기업');
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
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
      <div className="border-soft-pebble bg-pure-white sticky top-0 z-10 flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentRoomId(null)}
            className="text-midnight-ink hover:text-point-blue transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-50">
              {room.logoUrl ? (
                <img
                  src={room.logoUrl}
                  alt={opponentName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '';
                    (e.currentTarget as HTMLImageElement).parentElement!.innerHTML =
                      '<svg ... icon />';
                  }}
                />
              ) : (
                <div className="text-silver-mist">
                  {user?.role === 'COMPANY' ? <User size={20} /> : <Building2 size={20} />}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-midnight-ink text-sm leading-none font-black tracking-tight">
                  {opponentName || '이름 없음'}
                </span>
                {!room.logoUrl && room.companyName && user?.role !== 'COMPANY' && (
                  <span className="bg-point-blue/10 text-point-blue rounded px-1.5 py-0.5 text-[9px] leading-none font-black uppercase">
                    Corp
                  </span>
                )}
              </div>
              <span className="text-silver-mist mt-0.5 text-[10px] font-medium">
                {user?.role === 'COMPANY' ? '지원자' : '기업 담당자'}
              </span>
            </div>
          </div>
        </div>
        <MoreHorizontal size={18} className="text-silver-mist cursor-pointer" />
      </div>

      <div className="bg-pure-white flex-1 space-y-6 overflow-y-auto p-5 pb-18">
        {messages.map((msg: Message) => {
          const isMe = msg.senderId === String(user?.userId);
          const isInterview = msg.type === 'interview';

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="group relative max-w-[85%]">
                <div
                  className={`rounded-2xl border p-4 shadow-sm transition-all ${
                    msg.isAccepted
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
                          className={`text-[10px] font-black uppercase ${
                            msg.isDeclined ? 'text-slate-gray' : 'text-point-blue'
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
                    className={`mb-2 flex items-start justify-between border-b pb-2 ${
                      isMe && !isInterview ? 'border-pure-white/20' : 'border-midnight-ink/10'
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

                  {isInterview && !isMe && !msg.isAccepted && !msg.isDeclined && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleAccept(msg)}
                        disabled={isProcessing}
                        className="bg-point-blue text-pure-white flex-1 rounded-lg py-3 text-[11px] font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleDecline(msg)}
                        disabled={isProcessing}
                        className="bg-soft-pebble text-midnight-ink flex-1 rounded-lg py-3 text-[11px] font-black transition-all active:scale-95 disabled:opacity-50"
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
      </div>

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
            {user?.role === 'COMPANY' && (
              <button
                type="button"
                onClick={() => setIsInterviewModalOpen(true)}
                className="text-point-blue flex items-center gap-1.5 text-[11px] font-black transition-opacity hover:opacity-80"
              >
                <Calendar size={14} /> 면접 제안
              </button>
            )}
            <div className="flex flex-1 justify-end">
              <button
                type="submit"
                disabled={!input.trim()}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition-all ${
                  input.trim()
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

      <InterviewModal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        onConfirm={handleInterviewConfirm}
      />
    </div>
  );
};

const MessengerContainer = () => {
  const { isOpen, currentRoomId, totalUnreadCount, toggleMessenger } = useMessenger();

  return (
    <>
      {isOpen && (
        <div className="border-soft-pebble bg-pure-white animate-in fade-in slide-in-from-bottom-6 fixed right-8 bottom-30 z-9999 flex h-130 w-95 flex-col overflow-hidden rounded-4xl border shadow-[0_20px_50px_rgba(26,26,26,0.15)] duration-300">
          {currentRoomId ? <ChatRoomWindow roomId={currentRoomId} /> : <ChatList />}
        </div>
      )}

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
