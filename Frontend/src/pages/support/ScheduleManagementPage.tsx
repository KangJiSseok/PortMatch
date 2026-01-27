import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';

type TimeSlot = {
  id: string;
  day: string;
  time: string;
  votes: string[];
};

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
      alert('이름과 시간을 확인해주세요.');
      return;
    }
    const updatedVotes = allVotes.map((slot) =>
      availableSlots.includes(slot.id)
        ? { ...slot, votes: [...new Set([...slot.votes, userName])] }
        : slot,
    );
    setAllVotes(updatedVotes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVotes));
    setUserName('');
    setAvailableSlots([]);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert(`${userName}님의 일정이 성공적으로 반영되었습니다.`);
  };

  const handleReset = () => {
    if (window.confirm('모든 데이터를 삭제하시겠습니까?')) {
      const initialSlots: TimeSlot[] = [];
      DAYS.forEach((day) => {
        HOURS.forEach((time) => {
          initialSlots.push({ id: `${day}-${time}`, day, time, votes: [] });
        });
      });
      setAllVotes(initialSlots);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getIntensityStyle = (count: number) => {
    if (count === 0) return { backgroundColor: 'transparent' };
    const opacity = Math.min(count * 0.15, 1);
    return { backgroundColor: `rgba(81, 81, 231, ${opacity})` };
  };

  return (
    <div
      className="bg-pure-white flex min-h-screen justify-center overflow-x-auto select-none"
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <div className="w-350 min-w-350 px-6 pt-20 pb-16">
        <header className="border-point-blue mt-4 mb-10 ml-6 flex items-end justify-between border-l-4 pl-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-midnight-ink text-4xl font-black tracking-tighter uppercase"
            >
              Schedule Adjustment
            </motion.h1>
            <h2 className="text-midnight-ink mt-1 text-2xl font-black tracking-tighter">
              일정 조정 플래너
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-midnight-ink text-midnight-ink rounded-xl px-4 py-2 font-bold hover:bg-gray-50"
          >
            초기화
          </Button>
        </header>

        <div className="grid grid-cols-2 items-start gap-10">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-pure-white flex h-225 flex-col justify-between rounded-[40px] border border-gray-100 p-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)]"
          >
            <div className="flex flex-col gap-5">
              <div className="space-y-3">
                <h3 className="text-midnight-ink text-xl font-black">1. 내 시간 선택</h3>
                <Input
                  label="참여자 이름"
                  placeholder="이름을 입력하세요"
                  value={userName}
                  onChange={({ target }) => setUserName(target.value)}
                />
              </div>

              <div className="flex flex-col">
                <div className="mb-2 grid grid-cols-[50px_1fr] pr-2">
                  <div />
                  <div className="grid grid-cols-7 text-center">
                    {DAYS.map((day) => (
                      <span key={day} className="text-point-blue text-sm font-black uppercase">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[50px_1fr]">
                  <div className="flex flex-col">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="text-midnight-ink/30 flex h-6 items-center text-[13px] font-bold"
                      >
                        {hour}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 border-t border-l border-gray-100">
                    {DAYS.map((day) => (
                      <div key={day} className="flex flex-col border-r border-gray-100">
                        {HOURS.map((hour) => {
                          const id = `${day}-${hour}`;
                          return (
                            <div
                              key={id}
                              onMouseDown={() => handleMouseDown(id)}
                              onMouseEnter={() => handleMouseEnter(id)}
                              className={`h-6 cursor-pointer border-b border-gray-50 transition-colors duration-75 ${
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
            <Button
              variant="blue"
              size="lg"
              fullWidth
              className="mt-6 rounded-[20px] py-4 text-xl font-black shadow-2xl transition-all"
              onClick={submitVotes}
            >
              내 시간 결과에 반영하기
            </Button>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-pure-white flex h-225 flex-col justify-between rounded-[40px] border border-gray-100 p-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)]"
          >
            <div className="flex h-full flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-midnight-ink text-xl font-black">2. 일정 종합 현황</h3>
                {analysis.max > 0 && (
                  <span className="text-point-blue animate-pulse text-sm font-black">
                    🏆 최다 {analysis.max}명 가능
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <div className="mb-2 grid grid-cols-[50px_1fr] pr-2">
                  <div />
                  <div className="grid grid-cols-7 text-center">
                    {DAYS.map((day) => (
                      <span key={day} className="text-point-blue text-sm font-black uppercase">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[50px_1fr]">
                  <div className="flex flex-col">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="text-midnight-ink/30 flex h-6 items-center text-[13px] font-bold"
                      >
                        {hour}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 border-t border-l border-gray-100 bg-gray-50/20">
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
                              className={`group relative h-6 border-b border-gray-50 transition-all duration-300 ${
                                isTop ? 'z-20 ring-2 ring-amber-400 ring-inset' : ''
                              }`}
                            >
                              {voteCount > 0 && (
                                <div className="bg-midnight-ink/90 pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                  <span className="text-xs font-black text-white">
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

              <div className="mt-auto border-t border-gray-100 pt-4">
                <h4 className="text-midnight-ink mb-3 text-sm font-black tracking-wider uppercase opacity-60">
                  Best 3 Recommended
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {analysis.sortedSlots.length > 0 ? (
                    analysis.sortedSlots.map((slot, index) => (
                      <div
                        key={slot.id}
                        className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <span className="text-point-blue text-[11px] font-black">
                          TOP {index + 1}
                        </span>
                        <span className="text-midnight-ink text-center text-sm font-black">
                          {slot.day} {slot.time}
                        </span>
                        <span className="text-midnight-ink/50 text-[11px] font-bold">
                          {slot.votes.length}명
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-midnight-ink/30 col-span-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-4 text-center text-sm font-bold">
                      데이터 대기 중...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagementPage;
