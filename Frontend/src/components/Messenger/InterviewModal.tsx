import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, FileText, Clock, AlertCircle } from 'lucide-react';
import Button from '../Button/Button';

interface JobPosting {
  id: number;
  title: string;
}

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateTime: string, note: string, selectedJob: JobPosting) => void;
  defaultJob: JobPosting | null;
  jobPostings: JobPosting[];
}

const AlertModal = ({
  isOpen,
  message,
  onClose,
}: {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900">알림</h3>
            <p className="mt-2 text-sm font-medium whitespace-pre-wrap text-slate-500">{message}</p>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-4">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
            >
              확인
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const InterviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  defaultJob,
  jobPostings,
}: InterviewModalProps) => {
  const [selectedJobId, setSelectedJobId] = useState<number | string>(defaultJob?.id || '');

  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    message: '',
  });

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = () => {
    if (!selectedJobId) {
      setAlertConfig({
        isOpen: true,
        message: '관련 채용 공고를 선택해주세요.',
      });
      return;
    }

    if (!date) {
      setAlertConfig({
        isOpen: true,
        message: '면접 일시를 선택해주세요.',
      });
      return;
    }

    const selectedDate = new Date(date);
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 1);

    if (selectedDate < minDate) {
      setAlertConfig({
        isOpen: true,
        message: '면접 시간은 현재 시간으로부터\n최소 1시간 이후여야 합니다.',
      });
      return;
    }

    const job = jobPostings.find((j) => j.id === Number(selectedJobId));
    if (job) {
      onConfirm(date, note, job);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AlertModal
        isOpen={alertConfig.isOpen}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />

      <AnimatePresence>
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <Calendar className="text-point-blue" size={20} />
                면접 제안하기
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  <FileText size={14} /> 관련 채용 공고
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="focus:border-point-blue focus:ring-point-blue/10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2"
                >
                  <option value="">공고를 선택해주세요</option>
                  {jobPostings.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  <Clock size={14} /> 면접 일시
                </label>
                <input
                  type="datetime-local"
                  value={date}
                  min={getMinDateTime()}
                  onChange={(e) => setDate(e.target.value)}
                  className="focus:border-point-blue focus:ring-point-blue/10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-all outline-none focus:ring-2"
                />
                <p className="pl-1 text-[11px] font-medium text-slate-400">
                  * 최소 1시간 이후의 시간부터 선택 가능합니다.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  추가 안내 사항 (선택)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="예: 일정 조정이 필요할 시 연락 바랍니다."
                  className="focus:border-point-blue focus:ring-point-blue/10 h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-all outline-none placeholder:text-slate-400 focus:ring-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Button variant="light" size="md" onClick={onClose} className="rounded-xl">
                취소
              </Button>
              <Button
                variant="blue"
                size="md"
                onClick={handleSubmit}
                className="rounded-xl shadow-lg shadow-blue-500/20"
              >
                제안 보내기
              </Button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
};

export default InterviewModal;
