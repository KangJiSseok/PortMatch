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
} from 'lucide-react';
import { useMessenger } from '../../hooks/useMessenger';
import { useAuth } from '../../hooks/useAuth';
import { getRelativeTime } from '../../utils/date';
import InterviewModal from './InterviewModal';
import type { ChatRoom, Message } from '../../types/messenger';

const CompanyLogo = ({ room }: { room: ChatRoom }) => {
  const [imgError, setImgError] = useState(false);

  if (room.logoUrl && !imgError) {
    return (
      <img
        src={room.logoUrl}
        alt={room.name}
        onError={() => setImgError(true)}
        className="border-soft-pebble bg-pure-white h-12 w-12 shrink-0 rounded-xl border object-contain p-1"
      />
    );
  }

  return (
    <div className="bg-soft-pebble text-midnight-ink flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
      {room.companyName ? <Building2 size={24} /> : <User size={24} />}
    </div>
  );
};

const ChatList = () => {
  const { rooms, setCurrentRoomId } = useMessenger();

  return (
    <div className="bg-pure-white flex-1 overflow-y-auto">
      <div className="border-soft-pebble bg-pure-white sticky top-0 z-10 flex items-center justify-between border-b p-6">
        <h2 className="text-midnight-ink text-xl font-black tracking-tighter">쪽지함</h2>
        <Search size={20} className="text-silver-mist cursor-pointer" />
      </div>
      <div className="divide-soft-pebble divide-y">
        {rooms.map((room: ChatRoom) => (
          <div
            key={room.id}
            onClick={() => setCurrentRoomId(room.id)}
            className="hover:bg-soft-pebble/10 flex cursor-pointer items-start gap-4 p-5 transition-all active:scale-[0.98]"
          >
            <CompanyLogo room={room} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="text-midnight-ink truncate text-sm font-bold">{room.name}</h4>
                <span className="text-silver-mist text-[10px] font-bold">
                  {getRelativeTime(room.lastUpdatedAt)}
                </span>
              </div>
              <p className="text-slate-gray truncate text-xs leading-relaxed font-medium">
                {room.lastMessage}
              </p>
              {room.unreadCount > 0 && (
                <div className="mt-2">
                  <span className="bg-point-blue inline-flex h-1.5 w-1.5 rounded-full" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChatRoomWindow = ({ roomId }: { roomId: string }) => {
  const {
    rooms,
    messages,
    setCurrentRoomId,
    sendMessage,
    acceptInterview,
    declineInterview,
  } = useMessenger();
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
      await acceptInterview(msg.id, msg.interviewId || 'pending', room?.name || '기업');
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
      await declineInterview(msg.id, msg.interviewId || 'pending', room?.name || '기업');
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-pure-white flex flex-1 flex-col overflow-hidden">
      <div className="border-soft-pebble bg-pure-white sticky top-0 z-10 flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentRoomId(null)}
            className="text-midnight-ink hover:text-point-blue transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-midnight-ink text-sm font-black tracking-tight">{room.name}</span>
            {room.companyName && (
              <span className="bg-point-blue/10 text-point-blue rounded px-1.5 py-0.5 text-[9px] font-black uppercase">
                Corp
              </span>
            )}
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
                        <Calendar size={12} className={msg.isDeclined ? 'text-slate-gray' : 'text-point-blue'} />
                        <span className={`text-[10px] font-black uppercase ${msg.isDeclined ? 'text-slate-gray' : 'text-point-blue'}`}>
                          {msg.isAccepted ? 'Accepted' : msg.isDeclined ? 'Declined' : 'Interview Request'}
                        </span>
                      </div>
                      {msg.isAccepted && <CheckCircle2 size={14} className="text-point-blue" />}
                      {msg.isDeclined && <XCircle size={14} className="text-slate-gray" />}
                    </div>
                  )}

                  <div className={`mb-2 flex items-start justify-between border-b pb-2 ${isMe && !isInterview ? 'border-pure-white/20' : 'border-midnight-ink/10'}`}>
                    <span className="text-[9px] font-black tracking-widest uppercase opacity-70">
                      {isMe ? 'Sent' : 'Received'}
                    </span>
                    <span className="text-[9px] font-bold opacity-70">
                      {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed font-medium whitespace-pre-wrap ${isInterview ? 'font-bold' : ''}`}>
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
            className="text-midnight-ink placeholder:text-silver-mist h-20 w-full resize-none border-none bg-transparent text-xs leading-relaxed font-bold outline-none"
            placeholder="회신할 내용을 입력하세요..."
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
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition-all ${input.trim() ? 'bg-point-blue text-pure-white shadow-md' : 'bg-soft-pebble text-silver-mist'
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
        {
          totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center 
                   bg-error text-pure-white text-[12px] font-black
                   rounded-full 
                   ring-2 ring-pure-white 
                   shadow-[0_0_10px_rgba(255,59,48,0.5)] 
                   border border-white/30
                   animate-bounce-subtle">
              {totalUnreadCount}
            </span>
          )}
      </button >
    </>
  );
};

export default MessengerContainer;

