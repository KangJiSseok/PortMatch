import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';

type TimeSlot = {
  id: string;
  day: string;
  time: string;
  votes: string[];
};

type ModalType = 'ERROR' | 'SUCCESS' | 'RESET_CONFIRM';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const STORAGE_KEY = 'local_schedule_data_v2';

const ScheduleManagementPage = () => {
  const [allVotes, setAllVotes] = useState<TimeSlot[]>(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (err) {
        console.error('데이터 로드 실패', err);
      }
    }
    const initialSlots: TimeSlot[] = [];
    DAYS.forEach((day) => {
      HOURS.forEach((time) => {
        initialSlots.push({ id: `${day}-${time}`, day, time, votes: [] });
      });
    });
    return initialSlots;
  });

  const [userName, setUserName] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
  const [modal, setModal] = useState<{ type: ModalType; message?: string } | null>(null);

  const analysis = useMemo(() => {
    let max = 0;
    allVotes.forEach((slot) => {
      if (slot.votes.length > max) max = slot.votes.length;
    });
    const topIds = max > 0 ? allVotes.filter((s) => s.votes.length === max).map((s) => s.id) : [];
    const sortedSlots = [...allVotes]
      .filter((s) => s.votes.length > 0)
      .sort((a, b) => b.votes.length - a.votes.length)
      .slice(0, 3);
    return { max, topIds, sortedSlots };
  }, [allVotes]);

  const handleMouseDown = (id: string) => {
    setIsDragging(true);
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

  const submitVotes = () => {
    if (!userName || availableSlots.length === 0) {
      setModal({ type: 'ERROR', message: '이름과 시간을 확인해주세요.' });
      return;
    }
    const updatedVotes = allVotes.map((slot) =>
      availableSlots.includes(slot.id)
        ? { ...slot, votes: [...new Set([...slot.votes, userName])] }
        : slot,
    );
    setAllVotes(updatedVotes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVotes));

    const submittedName = userName;
    setUserName('');
    setAvailableSlots([]);
    setModal({
      type: 'SUCCESS',
      message: `${submittedName}님의 일정이 성공적으로 반영되었습니다.`,
    });
  };

  const executeReset = () => {
    const initialSlots: TimeSlot[] = [];
    DAYS.forEach((day) => {
      HOURS.forEach((time) => {
        initialSlots.push({ id: `${day}-${time}`, day, time, votes: [] });
      });
    });
    setAllVotes(initialSlots);
    localStorage.removeItem(STORAGE_KEY);
    setModal(null);
  };

  const getIntensityStyle = (count: number) => {
    if (count === 0) return { backgroundColor: 'transparent' };
    const opacity = Math.min(count * 0.15, 1);
    return { backgroundColor: `rgba(81, 81, 231, ${opacity})` };
  };

  return (
    <div
      className="bg-pure-white flex min-h-screen min-w-350 justify-center overflow-x-auto pt-32 pb-32 select-none"
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <div className="w-5xl px-6">
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
                함께하는 시간을 맞추기 위한 최적의 일정을 찾아보세요.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setModal({ type: 'RESET_CONFIRM' })}
            className="border-midnight-ink text-midnight-ink shrink-0 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap hover:bg-gray-50"
          >
            초기화
          </Button>
        </header>

        {/* items-stretch를 통해 좌우 섹션 높이를 강제로 통일 */}
        <div className="flex items-stretch gap-7">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-md shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="flex flex-1 flex-col gap-5">
              <div className="space-y-3">
                <h3 className="text-midnight-ink text-lg font-black whitespace-nowrap">
                  1. 내 시간 선택
                </h3>
                <Input
                  label="참여자 이름"
                  placeholder="이름을 입력하세요"
                  value={userName}
                  onChange={({ target }) => setUserName(target.value)}
                />
              </div>

              <div className="flex shrink-0 flex-col">
                <div className="mb-1 grid grid-cols-[45px_1fr] pr-2">
                  <div />
                  <div className="grid grid-cols-7 text-center">
                    {DAYS.map((day) => (
                      <span
                        key={day}
                        className="text-point-blue text-[11px] font-black whitespace-nowrap uppercase"
                      >
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
                              className={`h-4.5 cursor-pointer border-b border-gray-50 transition-colors duration-75 ${
                                availableSlots.includes(id)
                                  ? 'bg-point-blue shadow-inner'
                                  : 'hover:bg-gray-50'
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* 하단 버튼 위치 고정 */}
            <Button
              variant="blue"
              size="md"
              fullWidth
              className="shadow-point-blue/20 mt-7 rounded-xl py-4 text-base font-black whitespace-nowrap shadow-md active:scale-[0.98]"
              onClick={submitVotes}
            >
              내 시간 결과에 반영하기
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
                <h3 className="text-midnight-ink text-lg font-black whitespace-nowrap">
                  2. 일정 종합 현황
                </h3>
                {analysis.max > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-point-blue/10 text-point-blue rounded-lg px-2 py-1 text-[9px] font-black whitespace-nowrap"
                  >
                    🏆 최다 {analysis.max}명 가능
                  </motion.div>
                ) : (
                  <div className="h-5.25" />
                )}
              </div>

              <div className="flex shrink-0 flex-col">
                <div className="mb-1 grid grid-cols-[45px_1fr] pr-2">
                  <div />
                  <div className="grid grid-cols-7 text-center">
                    {DAYS.map((day) => (
                      <span
                        key={day}
                        className="text-point-blue text-[11px] font-black whitespace-nowrap uppercase"
                      >
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
                          const slot = allVotes.find((s) => s.id === `${day}-${hour}`);
                          const voteCount = slot?.votes.length || 0;
                          const isTop = analysis.topIds.includes(slot?.id || '');
                          return (
                            <div
                              key={`${day}-${hour}-res`}
                              style={getIntensityStyle(voteCount)}
                              className={`group relative h-4.5 border-b border-gray-50 transition-all duration-300 ${
                                isTop ? 'z-20 ring-1 ring-amber-400 ring-inset' : ''
                              }`}
                            >
                              {voteCount > 0 && (
                                <div className="bg-midnight-ink/90 pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                  <span className="text-[9px] font-black whitespace-nowrap text-white">
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

              {/* mt-auto를 통해 결과 박스를 항상 섹션 최하단으로 밀어냄 */}
              <div className="mt-auto shrink-0 border-t border-gray-100 pt-6">
                <h4 className="text-midnight-ink mb-4 text-xs font-black tracking-wider whitespace-nowrap uppercase opacity-40">
                  Best 3 Recommended
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {analysis.sortedSlots.length > 0 ? (
                    analysis.sortedSlots.map((slot, index) => (
                      <div
                        key={slot.id}
                        className="flex shrink-0 flex-col items-center rounded-xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <span className="text-point-blue mb-0.5 text-[9px] font-black whitespace-nowrap">
                          TOP {index + 1}
                        </span>
                        <span className="text-midnight-ink text-center text-[11px] font-black whitespace-nowrap">
                          {slot.day} {slot.time}
                        </span>
                        <span className="text-midnight-ink/50 mt-0.5 text-[9px] font-bold whitespace-nowrap">
                          {slot.votes.length}명
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-midnight-ink/30 col-span-3 flex h-15.5 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs font-bold whitespace-nowrap">
                      데이터 대기 중...
                    </div>
                  )}
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
              <h3 className="text-midnight-ink mb-2 text-xl font-black whitespace-nowrap">
                {modal.type === 'ERROR'
                  ? '확인 필요'
                  : modal.type === 'SUCCESS'
                    ? '반영 완료'
                    : '정말 초기화할까요?'}
              </h3>
              <p className="text-silver-mist text-base leading-relaxed font-bold">
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
