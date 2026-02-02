import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  CalendarClock,
  Users,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  Star,
  UserX,
  UserCheck,
  Filter,
  Share2,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';

type TimeSlot = {
  id: string;
  day: string;
  time: string;
  votes: string[];
};

type ModalType = 'ERROR' | 'SUCCESS' | 'RESET_CONFIRM' | 'DUPLICATE_NAME';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const MAX_NAME_LENGTH = 10;

const ScheduleManagementPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [allVotes, setAllVotes] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
  const [modal, setModal] = useState<{ type: ModalType; message?: string } | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);

  const [nameError, setNameError] = useState(false);
  const [timeError, setTimeError] = useState(false);

  const nameSectionRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const createInitialSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    DAYS.forEach((day) => {
      HOURS.forEach((time) => {
        slots.push({ id: `${day}-${time}`, day, time, votes: [] });
      });
    });
    return slots;
  };

  useEffect(() => {
    if (!roomId) {
      const newRoomId = Math.random().toString(36).substring(2, 11);
      navigate(`/support/schedule/${newRoomId}`, { replace: true });
      return;
    }

    const docRef = doc(db, 'schedules', roomId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setAllVotes(docSnap.data().votes as TimeSlot[]);
        } else {
          const initial = createInitialSlots();
          setDoc(docRef, { votes: initial, createdAt: new Date() });
          setAllVotes(initial);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firebase Error:', error);
        setLoading(false);
        setModal({ type: 'ERROR', message: '데이터 동기화에 실패했습니다.' });
      },
    );

    return () => unsubscribe();
  }, [roomId, navigate]);

  const analysis = useMemo(() => {
    if (allVotes.length === 0) return { max: 0, topIds: [], sortedSlots: [], participants: [] };
    let max = 0;
    allVotes.forEach((slot) => {
      if (slot.votes.length > max) max = slot.votes.length;
    });
    const topIds = max > 0 ? allVotes.filter((s) => s.votes.length === max).map((s) => s.id) : [];
    const sortedSlots = [...allVotes]
      .filter((s) => s.votes.length > 0)
      .sort((a, b) => b.votes.length - a.votes.length)
      .slice(0, 3);
    const participants = [...new Set(allVotes.flatMap((slot) => slot.votes))];
    return { max, topIds, sortedSlots, participants };
  }, [allVotes]);

  const handleMouseDown = (id: string) => {
    setIsDragging(true);
    setTimeError(false);
    const mode = availableSlots.includes(id) ? 'deselect' : 'select';
    setDragMode(mode);
    updateSelection(id, mode);
  };

  const handleMouseEnter = (id: string) => {
    if (isDragging) updateSelection(id, dragMode);
  };

  const updateSelection = (id: string, mode: 'select' | 'deselect') => {
    setAvailableSlots((prev) => {
      if (mode === 'select' && !prev.includes(id)) return [...prev, id];
      if (mode === 'deselect' && prev.includes(id)) return prev.filter((t) => t !== id);
      return prev;
    });
  };

  const copySharedLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setModal({ type: 'SUCCESS', message: '공유 링크가 클립보드에 복사되었습니다.' });
    } catch {
      setModal({ type: 'ERROR', message: '링크 복사에 실패했습니다.' });
    }
  };

  const submitVotes = async () => {
    const trimmedName = userName.trim();
    if (!trimmedName) {
      setNameError(true);
      setModal({ type: 'ERROR', message: '참여자 이름을 입력해주세요.' });
      return;
    }

    const isDuplicate = allVotes.some((slot) => slot.votes.includes(trimmedName));
    if (isDuplicate) {
      setNameError(true);
      setModal({ type: 'DUPLICATE_NAME', message: `'${trimmedName}'님은 이미 등록되어 있습니다.` });
      return;
    }

    if (availableSlots.length === 0) {
      setTimeError(true);
      setModal({ type: 'ERROR', message: '가능한 시간대를 그리드에서 선택해주세요.' });
      return;
    }

    const updatedVotes = allVotes.map((slot) =>
      availableSlots.includes(slot.id)
        ? { ...slot, votes: [...new Set([...slot.votes, trimmedName])] }
        : slot,
    );

    if (roomId) {
      try {
        await updateDoc(doc(db, 'schedules', roomId), { votes: updatedVotes });
        setUserName('');
        setAvailableSlots([]);
        setNameError(false);
        setTimeError(false);
        setModal({ type: 'SUCCESS', message: `${trimmedName}님의 일정이 반영되었습니다.` });
      } catch {
        setModal({ type: 'ERROR', message: '데이터 저장에 실패했습니다.' });
      }
    }
  };

  const executeReset = async () => {
    if (roomId) {
      try {
        await updateDoc(doc(db, 'schedules', roomId), { votes: createInitialSlots() });
        setModal(null);
        setSelectedParticipant(null);
      } catch {
        setModal({ type: 'ERROR', message: '초기화에 실패했습니다.' });
      }
    }
  };

  const getIntensityStyle = (slot: TimeSlot, isTop: boolean) => {
    const count = slot.votes.length;
    if (count === 0) return { backgroundColor: 'transparent' };
    if (selectedParticipant) {
      return slot.votes.includes(selectedParticipant)
        ? { backgroundColor: '#5151e7' }
        : { backgroundColor: 'rgba(81, 81, 231, 0.05)' };
    }
    if (isTop) return { backgroundColor: '#5151e7' };
    const opacity = Math.min(count * 0.15, 0.7);
    return { backgroundColor: `rgba(81, 81, 231, ${opacity})` };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-point-blue flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <RotateCcw size={40} />
          </motion.div>
          <p className="font-bold">일정 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-pure-white flex min-h-screen min-w-350 justify-center overflow-x-auto pt-32 pb-32 select-none"
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 flex items-end justify-between border-l-4 pl-6">
          <div className="min-w-0 flex-1">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
            >
              Schedule Adjustment
            </motion.h1>
            <div className="flex flex-col items-start">
              <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
                링크를 공유하여 팀원들과 최적의 시간을 찾아보세요.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={copySharedLink}
              className="border-point-blue text-point-blue flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap hover:bg-blue-50"
            >
              <Share2 size={16} />
              공유하기
            </Button>
            <Button
              variant="outline"
              onClick={() => setModal({ type: 'RESET_CONFIRM' })}
              className="border-midnight-ink text-midnight-ink flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap hover:bg-gray-50"
            >
              <RotateCcw size={16} />
              초기화
            </Button>
          </div>
        </header>

        <div className="flex items-stretch justify-center gap-7">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-md shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="flex flex-1 flex-col gap-5">
              <div className="space-y-3" ref={nameSectionRef}>
                <div className="flex items-center gap-2">
                  <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                  <CalendarClock size={20} className="text-midnight-ink" />
                  <h3 className="text-midnight-ink text-lg font-black whitespace-nowrap uppercase">
                    내 시간 선택
                  </h3>
                </div>

                <div className="relative">
                  <div className="absolute top-0 right-0 flex items-center gap-1 pt-1">
                    <span
                      className={`text-xs font-black ${userName.length >= MAX_NAME_LENGTH ? 'text-error' : 'text-silver-mist'}`}
                    >
                      {userName.length}
                    </span>
                    <span className="text-silver-mist text-xs font-bold">/ {MAX_NAME_LENGTH}</span>
                  </div>
                  <Input
                    ref={nameInputRef}
                    label="참여자 이름"
                    placeholder="이름을 입력하세요"
                    value={userName}
                    error={nameError ? ' ' : undefined}
                    onChange={({ target }) => {
                      if (target.value.length <= MAX_NAME_LENGTH) {
                        setUserName(target.value);
                        if (nameError) setNameError(false);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col">
                <div className="mb-1 grid grid-cols-[45px_1fr] pr-2">
                  <div />
                  <div className="grid grid-cols-7 text-center">
                    {DAYS.map((day) => (
                      <span key={day} className="text-point-blue text-[11px] font-black uppercase">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className={`grid grid-cols-[45px_1fr] rounded-xl transition-all duration-300 ${timeError ? 'ring-error/50 bg-error/5 ring-2' : ''}`}
                >
                  <div className="flex flex-col">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="text-midnight-ink/30 flex h-4.5 items-center text-[10px] font-bold whitespace-nowrap"
                      >
                        {hour}
                      </div>
                    ))}
                  </div>
                  <div className="grid shrink-0 grid-cols-7 border-t border-l border-gray-100">
                    {DAYS.map((day) => (
                      <div key={day} className="flex flex-col border-r border-gray-100">
                        {HOURS.map((hour) => {
                          const id = `${day}-${hour}`;
                          return (
                            <div
                              key={id}
                              onMouseDown={() => handleMouseDown(id)}
                              onMouseEnter={() => handleMouseEnter(id)}
                              className={`h-4.5 cursor-pointer border-b border-gray-50 transition-colors duration-75 ${availableSlots.includes(id) ? 'bg-point-blue shadow-inner' : 'hover:bg-gray-50'}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="blue"
              size="md"
              fullWidth
              className="shadow-point-blue/20 mt-7 flex items-center justify-center gap-2 rounded-xl py-4 text-base font-black whitespace-nowrap shadow-md active:scale-[0.98]"
              onClick={submitVotes}
            >
              <Check size={20} />내 시간 결과에 반영하기
            </Button>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pure-white flex w-md shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="flex flex-1 flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                  <Users size={20} className="text-midnight-ink" />
                  <h3 className="text-midnight-ink text-lg font-black whitespace-nowrap uppercase">
                    일정 종합 현황
                  </h3>
                </div>
                <AnimatePresence mode="wait">
                  {selectedParticipant ? (
                    <motion.div
                      key="filter-badge"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="bg-point-blue flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black whitespace-nowrap text-white shadow-sm"
                    >
                      <Filter size={10} />
                      {selectedParticipant}님 확인 중
                    </motion.div>
                  ) : analysis.max > 0 ? (
                    <motion.div
                      key="best-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-black whitespace-nowrap text-white shadow-sm"
                    >
                      <Star size={10} fill="currentColor" />
                      최적의 시간: {analysis.max}명 가능
                    </motion.div>
                  ) : (
                    <div className="h-5.25" />
                  )}
                </AnimatePresence>
              </div>

              <div className="flex shrink-0 flex-col">
                <div className="mb-1 grid grid-cols-[45px_1fr] pr-2">
                  <div />
                  <div className="grid grid-cols-7 text-center">
                    {DAYS.map((day) => (
                      <span key={day} className="text-point-blue text-[11px] font-black uppercase">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[45px_1fr]">
                  <div className="flex flex-col">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="text-midnight-ink/30 flex h-4.5 items-center text-[10px] font-bold whitespace-nowrap"
                      >
                        {hour}
                      </div>
                    ))}
                  </div>
                  <div className="grid shrink-0 grid-cols-7 border-t border-l border-gray-100 bg-gray-50/20">
                    {DAYS.map((day) => (
                      <div key={day} className="flex flex-col border-r border-gray-100">
                        {HOURS.map((hour) => {
                          const slot = allVotes.find((s) => s.id === `${day}-${hour}`)!;
                          const voteCount = slot.votes.length;
                          const isTop = !selectedParticipant && analysis.topIds.includes(slot.id);
                          return (
                            <div
                              key={`${day}-${hour}-res`}
                              style={getIntensityStyle(slot, isTop)}
                              className={`group relative h-4.5 border-b border-gray-50 transition-all duration-300 ${isTop ? 'z-20 shadow-[0_0_10px_rgba(81,81,231,0.5)]' : ''}`}
                            >
                              {isTop && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                  <Trophy size={10} className="text-white" fill="currentColor" />
                                </div>
                              )}
                              {voteCount > 0 && (
                                <div className="bg-midnight-ink/90 pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                  <span className="text-[9px] font-black text-white">
                                    {voteCount}명
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-6 border-t border-gray-100 pt-6">
                <div>
                  <h4 className="text-midnight-ink mb-3 flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase opacity-40">
                    <Trophy size={12} /> 추천 베스트 일정
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {analysis.sortedSlots.length > 0 ? (
                      analysis.sortedSlots.map((slot, index) => (
                        <div
                          key={slot.id}
                          className="flex shrink-0 flex-col items-center rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                        >
                          <span className="text-point-blue mb-0.5 text-[9px] font-black uppercase">
                            TOP {index + 1}
                          </span>
                          <span className="text-midnight-ink text-center text-[11px] font-black whitespace-nowrap">
                            {slot.day} {slot.time}
                          </span>
                          <span className="text-midnight-ink/50 mt-0.5 text-[9px] font-bold">
                            {slot.votes.length}명 가능
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-midnight-ink/30 col-span-3 flex h-15.5 items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs font-bold">
                        <Clock size={14} /> 데이터 대기 중...
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-midnight-ink mb-3 flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase opacity-40">
                    <UserCheck size={12} /> 참여 인원 ({analysis.participants.length}명)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.participants.length > 0 ? (
                      analysis.participants.map((name) => (
                        <button
                          key={name}
                          onClick={() =>
                            setSelectedParticipant((prev) => (prev === name ? null : name))
                          }
                          className={`rounded-full border px-3 py-1 text-[10px] font-bold shadow-sm transition-all ${
                            selectedParticipant === name
                              ? 'bg-point-blue border-point-blue text-white'
                              : 'text-midnight-ink hover:border-point-blue/50 border-gray-200 bg-gray-100'
                          }`}
                        >
                          {name}
                        </button>
                      ))
                    ) : (
                      <span className="text-midnight-ink/30 text-[10px] font-bold italic">
                        아직 참여자가 없습니다.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-9000 flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-pure-white relative w-full max-w-sm overflow-hidden rounded-3xl p-9 text-center shadow-2xl"
            >
              <div className="mb-4 flex justify-center">
                {modal.type === 'SUCCESS' ? (
                  <CheckCircle2 size={48} className="text-point-blue" />
                ) : modal.type === 'DUPLICATE_NAME' ? (
                  <UserX size={48} className="text-error" />
                ) : (
                  <AlertTriangle
                    size={48}
                    className={modal.type === 'ERROR' ? 'text-error' : 'text-amber-500'}
                  />
                )}
              </div>
              <h3 className="text-midnight-ink mb-2 text-xl font-black">
                {modal.type === 'ERROR'
                  ? '확인 필요'
                  : modal.type === 'SUCCESS'
                    ? '반영 완료'
                    : modal.type === 'DUPLICATE_NAME'
                      ? '이름 중복'
                      : '정말 초기화할까요?'}
              </h3>
              <p className="text-silver-mist text-base font-bold break-keep">
                {modal.message ||
                  (modal.type === 'RESET_CONFIRM' &&
                    '모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.')}
              </p>
              <div className="mt-8 flex gap-3">
                {modal.type === 'RESET_CONFIRM' ? (
                  <>
                    <Button
                      variant="outline"
                      size="md"
                      className="flex-1 rounded-xl py-3 font-black"
                      onClick={() => setModal(null)}
                    >
                      취소
                    </Button>
                    <Button
                      variant="red"
                      size="md"
                      className="flex-1 rounded-xl py-3 font-black"
                      onClick={executeReset}
                    >
                      초기화하기
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="blue"
                    size="md"
                    className="flex-1 rounded-xl py-3 font-black"
                    onClick={() => setModal(null)}
                  >
                    확인
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleManagementPage;
