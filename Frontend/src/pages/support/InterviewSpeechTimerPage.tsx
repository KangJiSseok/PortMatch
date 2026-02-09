import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Target,
  Scissors,
  PencilLine,
  Settings2,
  FileText,
  ClipboardList,
  BarChart3,
  Play,
  Square,
  RotateCcw,
  PenLine,
} from 'lucide-react';
import Button from '../../components/Button/Button';

const NORMAL_SPEED = 6;

const InterviewSpeechTimerPage = () => {
  const [script, setScript] = useState('');
  const [targetMin, setTargetMin] = useState(1);
  const [targetSec, setTargetSec] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const totalTargetSeconds = useMemo(() => targetMin * 60 + targetSec, [targetMin, targetSec]);

  const analysis = useMemo(() => {
    const charCount = script.replace(/\s/g, '').length;
    const estimatedSeconds = Math.ceil(charCount / NORMAL_SPEED);
    return { charCount, estimatedSeconds };
  }, [script]);

  const handleStop = useCallback(() => {
    setIsTimerRunning(false);
    setIsCompleted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTimerRunning) return;
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleStop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimerRunning, handleStop]);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const startPractice = () => {
    if (totalTargetSeconds <= 0) return;
    setElapsedTime(0);
    setIsCompleted(false);
    setIsTimerRunning(true);
  };

  const handleReset = () => {
    setIsCompleted(false);
    setIsTimerRunning(false);
    setElapsedTime(0);
  };

  const handleTimeInput = (val: string, setter: (n: number) => void) => {
    const num = parseInt(val, 10);
    setter(isNaN(num) ? 0 : Math.max(0, Math.min(59, num)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnalysisResult = () => {
    if (!isCompleted) return null;
    const diff = elapsedTime - totalTargetSeconds;
    const actualSpeed = elapsedTime > 0 ? (analysis.charCount / elapsedTime).toFixed(1) : '0';
    const isIdeal = Math.abs(diff) <= 5;

    if (isIdeal) {
      return {
        title: '완벽한 페이스입니다!',
        desc: `목표 시간과 거의 일치하게 마쳤습니다. 현재 속도(${actualSpeed}자/초)를 유지하세요.`,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        icon: <Target size={26} />,
        actualSpeed,
      };
    } else if (diff > 5) {
      const overChars = Math.ceil(diff * parseFloat(actualSpeed));
      return {
        title: '분량 조절이 필요합니다.',
        desc: `목표보다 ${diff}초 초과되었습니다. 현재 속도 기준 약 ${overChars}자 정도 내용을 줄여야 합니다.`,
        color: 'text-error',
        bg: 'bg-red-50',
        icon: <Scissors size={26} />,
        actualSpeed,
      };
    } else {
      const lackChars = Math.ceil(Math.abs(diff) * parseFloat(actualSpeed));
      return {
        title: '내용이 조금 부족합니다.',
        desc: `목표보다 ${Math.abs(diff)}초 일찍 끝났습니다. 약 ${lackChars}자 정도의 내용을 더 보강해보세요.`,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        icon: <PencilLine size={26} />,
        actualSpeed,
      };
    }
  };

  const resultFeedback = getAnalysisResult();

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32 select-none">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Speech Stopwatch
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            {isTimerRunning
              ? '집중해서 대본을 읽어보세요.'
              : '실전과 동일한 환경에서 시간을 측정해보세요.'}
          </p>
        </header>

        <div className="flex items-start gap-8">
          <motion.section
            animate={{ width: isCompleted ? 600 : 976 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-pure-white flex h-132 shrink-0 flex-col rounded-4xl border border-gray-100 p-8 shadow-lg"
          >
            <div className="flex h-full flex-col gap-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                    <span className="text-midnight-ink ml-1">
                      {isTimerRunning ? (
                        <FileText size={22} />
                      ) : isCompleted ? (
                        <ClipboardList size={22} />
                      ) : (
                        <Settings2 size={22} />
                      )}
                    </span>
                    <h3 className="text-midnight-ink text-xl font-black whitespace-nowrap">
                      {isTimerRunning
                        ? '집중 읽기 모드'
                        : isCompleted
                          ? '대본 확인'
                          : '스피치 설정 및 작성'}
                    </h3>
                  </div>

                  {!isTimerRunning && !isCompleted && (
                    <div className="flex shrink-0 gap-10">
                      <div className="flex flex-col gap-2">
                        <label className="text-midnight-ink ml-1 text-sm font-black tracking-tighter uppercase opacity-60">
                          목표 발표 시간
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="bg-cloud-dancer/30 border-soft-pebble/30 focus-within:border-point-blue flex items-center gap-2 rounded-xl border px-4 py-2 transition-all">
                            <input
                              type="number"
                              value={targetMin.toString().padStart(2, '0')}
                              onChange={(e) => handleTimeInput(e.target.value, setTargetMin)}
                              className="w-10 bg-transparent text-center text-lg font-bold outline-none"
                            />
                            <span className="text-slate-gray text-xs font-bold">분</span>
                          </div>
                          <div className="bg-cloud-dancer/30 border-soft-pebble/30 focus-within:border-point-blue flex items-center gap-2 rounded-xl border px-4 py-2 transition-all">
                            <input
                              type="number"
                              value={targetSec.toString().padStart(2, '0')}
                              onChange={(e) => handleTimeInput(e.target.value, setTargetSec)}
                              className="w-10 bg-transparent text-center text-lg font-bold outline-none"
                            />
                            <span className="text-slate-gray text-xs font-bold">초</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <AnimatePresence mode="wait">
                    {isTimerRunning ? (
                      <motion.div
                        key="timer-status"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-6"
                      >
                        <div className="flex flex-col text-right">
                          <span className="text-slate-gray mb-2 text-[10px] leading-none font-black tracking-widest uppercase opacity-40">
                            진행 시간 / 목표 시간
                          </span>
                          <div className="flex items-baseline gap-2 leading-none">
                            <span className="text-point-blue text-3xl font-black tabular-nums">
                              {formatTime(elapsedTime)}
                            </span>
                            <span className="text-slate-gray text-sm font-bold">
                              / {formatTime(totalTargetSeconds)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Button
                            variant="blue"
                            size="md"
                            className="flex h-12 items-center gap-2 rounded-xl px-6 text-base font-black shadow-md"
                            onClick={handleStop}
                          >
                            <Square size={16} fill="currentColor" />
                            읽기 완료
                          </Button>
                          <span className="text-slate-gray text-[9px] leading-none font-bold tracking-tight opacity-40">
                            (Space / Enter)
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="char-count"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-end"
                      >
                        {!isCompleted && (
                          <span className="text-point-blue bg-point-blue/5 mb-2 flex items-center gap-2 rounded-xl px-5 py-2 text-lg font-black">
                            <Timer size={20} />
                            예상 소요 시간: {formatTime(analysis.estimatedSeconds)}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-2 flex items-end justify-between px-2">
                  <h4 className="text-midnight-ink/40 text-xs font-black tracking-widest uppercase">
                    Script
                  </h4>
                  <span className="text-slate-gray decoration-point-blue/30 text-sm font-bold underline underline-offset-4 opacity-80">
                    공백 제외 {analysis.charCount}자
                  </span>
                </div>
                <textarea
                  className={`bg-cloud-dancer/10 border-soft-pebble/20 focus:border-point-blue/50 w-full flex-1 resize-none rounded-2xl border p-8 leading-relaxed font-bold break-keep transition-all outline-none ${
                    isTimerRunning ? 'text-midnight-ink text-xl' : 'text-slate-gray text-base'
                  }`}
                  placeholder="발표할 내용을 입력하세요..."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  readOnly={isTimerRunning || isCompleted}
                />
              </div>

              {!isTimerRunning && !isCompleted && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="blue"
                    size="lg"
                    className="flex w-full max-w-lg items-center justify-center gap-3 rounded-2xl py-5 text-xl font-black shadow-md"
                    onClick={startPractice}
                  >
                    <Play size={24} fill="currentColor" />
                    측정 시작하기
                  </Button>
                </div>
              )}
            </div>
          </motion.section>

          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-132 w-96 shrink-0"
            >
              <section className="bg-pure-white flex h-full flex-col rounded-4xl border border-gray-100 p-8 shadow-lg">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="text-slate-gray mb-2 text-base font-bold tracking-widest uppercase opacity-40">
                    실제 측정 시간
                  </div>
                  <div className="text-midnight-ink mb-6 text-7xl font-black tracking-tighter tabular-nums">
                    {formatTime(elapsedTime)}
                  </div>

                  <AnimatePresence mode="wait">
                    {resultFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${resultFeedback.bg} ${resultFeedback.color} mb-4 w-full rounded-3xl border border-current/10 p-6 text-left`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {resultFeedback.icon}
                            <h4 className="flex items-center gap-2 text-xl font-black">
                              <BarChart3 size={20} />
                              결과 분석
                            </h4>
                          </div>
                        </div>
                        <span className="mb-3 inline-block rounded-md bg-white/60 px-2.5 py-1 text-xs font-black">
                          발화 속도: {resultFeedback.actualSpeed}자/초
                        </span>
                        <p className="text-base leading-relaxed font-bold break-keep">
                          {resultFeedback.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex w-full flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="blue"
                        size="lg"
                        className="flex items-center justify-center gap-1.5 rounded-xl py-4 text-base font-black whitespace-nowrap shadow-md"
                        onClick={startPractice}
                      >
                        <RotateCcw size={18} />
                        다시 측정
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex items-center justify-center gap-1.5 rounded-xl py-4 text-base font-black whitespace-nowrap"
                        onClick={handleReset}
                      >
                        <PenLine size={18} />
                        대본 수정
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewSpeechTimerPage;
