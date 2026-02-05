import React, { useState } from 'react'; // useEffect 제거
import { Calendar, Clock, X, Briefcase, ChevronDown } from 'lucide-react';

interface JobPostingSimple {
  id: number;
  title: string;
}

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateTime: string, note: string, selectedJob: JobPostingSimple) => void;
  defaultJob?: JobPostingSimple | null;
  jobPostings?: JobPostingSimple[];
}

const InterviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  defaultJob,
  jobPostings = [],
}: InterviewModalProps) => {
  // [수정] useEffect 대신 초기값에서 바로 defaultJob 처리
  // 부모에서 key를 변경해주면 이 컴포넌트는 새로 마운트되므로 초기값이 다시 설정됨
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<number | string>(defaultJob?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    let finalJob: JobPostingSimple | undefined;

    if (defaultJob) {
      finalJob = defaultJob;
    } else {
      finalJob = jobPostings.find((job) => String(job.id) === String(selectedJobId));
    }

    if (!finalJob) {
      alert('면접을 진행할 채용 공고를 선택해주세요.');
      return;
    }

    onConfirm(`${date} ${time}`, note, finalJob);
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
              <Briefcase size={14} /> 관련 채용 공고
            </label>

            {defaultJob ? (
              <div className="border-soft-pebble bg-point-blue/5 text-point-blue w-full rounded-xl border px-4 py-3 text-sm font-bold">
                {defaultJob.title}
              </div>
            ) : (
              <div className="relative">
                <select
                  required
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="border-soft-pebble bg-soft-pebble/10 text-midnight-ink focus:ring-point-blue w-full appearance-none rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2"
                >
                  <option value="" disabled>
                    공고를 선택해주세요
                  </option>
                  {jobPostings.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="text-silver-mist pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
                  size={16}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-midnight-ink flex items-center gap-2 text-xs font-black tracking-wider uppercase opacity-60">
                <Calendar size={14} /> 날짜
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
                <Clock size={14} /> 시간
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border-soft-pebble bg-soft-pebble/10 text-midnight-ink focus:ring-point-blue w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-midnight-ink flex items-center gap-2 text-xs font-black tracking-wider uppercase opacity-60">
              추가 안내사항
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 일정 조정이 필요할 시 연락 바랍니다."
              className="border-soft-pebble bg-soft-pebble/10 text-midnight-ink focus:ring-point-blue h-24 w-full resize-none rounded-xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={!date || !time || (!defaultJob && !selectedJobId)}
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
