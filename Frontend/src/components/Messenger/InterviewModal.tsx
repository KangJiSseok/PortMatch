import React, { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateTime: string, note: string) => void;
}

const InterviewModal = ({ isOpen, onClose, onConfirm }: InterviewModalProps) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    onConfirm(`${date} ${time}`, note);
    onClose();
  };

  return (
    <div className="bg-midnight-ink/50 fixed inset-0 z-10000 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-pure-white animate-in fade-in zoom-in w-full max-w-sm overflow-hidden rounded-4xl shadow-2xl duration-200">
        <div className="border-soft-pebble flex items-center justify-between border-b p-6">
          <h3 className="text-midnight-ink text-lg font-black tracking-tighter">면접 일정 제안</h3>
          <button
            onClick={onClose}
            className="text-silver-mist hover:text-midnight-ink transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-midnight-ink flex items-center gap-2 text-xs font-black tracking-wider uppercase opacity-60">
              <Calendar size={14} /> 면접 날짜
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-soft-pebble bg-soft-pebble/10 text-midnight-ink focus:ring-point-blue w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-midnight-ink flex items-center gap-2 text-xs font-black tracking-wider uppercase opacity-60">
              <Clock size={14} /> 면접 시간
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border-soft-pebble bg-soft-pebble/10 text-midnight-ink focus:ring-point-blue w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-midnight-ink flex items-center gap-2 text-xs font-black tracking-wider uppercase opacity-60">
              추가 안내사항
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 회사 로비에서 연락 부탁드립니다."
              className="border-soft-pebble bg-soft-pebble/10 text-midnight-ink focus:ring-point-blue h-24 w-full resize-none rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={!date || !time}
            className="bg-point-blue text-pure-white disabled:bg-silver-mist w-full rounded-2xl py-4 text-sm font-black shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:scale-100"
          >
            제안 메시지 전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewModal;
