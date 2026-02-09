import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Coffee, Target, Activity, Lightbulb, Clock } from 'lucide-react';
import Input from '../../components/Input/Input';

const SprintCapacityCalculatorPage = () => {
  const [members, setMembers] = useState('5');
  const [days, setDays] = useState('10');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [overhead, setOverhead] = useState('20');
  const [focusFactor, setFocusFactor] = useState('0.8');

  const result = useMemo(() => {
    const totalHours = Number(members) * Number(days) * Number(hoursPerDay);
    const meetingHours = totalHours * (Number(overhead) / 100);
    const capacity = (totalHours - meetingHours) * Number(focusFactor);
    return { totalHours, meetingHours, capacity: Math.floor(capacity) };
  }, [members, days, hoursPerDay, overhead, focusFactor]);

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32 select-none">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Sprint Capacity
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            팀의 가용 시간을 분석하여 무리 없는 스프린트 계획을 수립하세요.
          </p>
        </header>

        <div className="flex h-132 items-stretch gap-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-96 shrink-0 flex-col rounded-3xl border border-gray-100 p-8 shadow-lg"
          >
            <div className="flex h-full flex-col gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                <Settings2 size={20} className="text-midnight-ink ml-1" />
                <h3 className="text-midnight-ink text-xl font-black whitespace-nowrap uppercase">
                  스프린트 설정
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="팀원 수 (명)"
                  type="number"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                />
                <Input
                  label="스프린트 기간 (일)"
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>

              <Input
                label="하루 평균 근무 시간 (h)"
                type="number"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
              />

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-point-blue h-4 w-1 rounded-full" />
                    <Coffee size={16} className="text-midnight-ink ml-1" />
                    <h3 className="text-midnight-ink text-sm font-black whitespace-nowrap uppercase">
                      비업무 오버헤드
                    </h3>
                  </div>
                  <p className="text-slate-gray ml-3 text-[10px] font-bold italic opacity-60">
                    * 회의, 스크럼, 휴식 등 고정 비작업 시간
                  </p>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={overhead}
                  onChange={(e) => setOverhead(e.target.value)}
                  className="accent-point-blue h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-100"
                />
                <div className="text-slate-gray flex justify-between px-1 text-[10px] font-black italic">
                  <span>기본 0%</span>
                  <span className="text-point-blue text-xs font-black">현재 {overhead}%</span>
                  <span>최대 50%</span>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-point-blue h-4 w-1 rounded-full" />
                    <Target size={16} className="text-midnight-ink ml-1" />
                    <h3 className="text-midnight-ink text-sm font-black whitespace-nowrap uppercase">
                      몰입 가중치
                    </h3>
                  </div>
                  <p className="text-slate-gray ml-3 text-[10px] font-bold italic opacity-60">
                    * 실제 작업에 온전히 집중 가능한 비율
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {[0.7, 0.8, 0.9, 1.0].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFocusFactor(f.toString())}
                      className={`flex-1 rounded-xl py-2 text-[11px] font-black transition-all ${
                        focusFactor === f.toString()
                          ? 'bg-point-blue text-white shadow-md'
                          : 'text-slate-gray border border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {f === 1 ? '100%' : `${f * 100}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pure-white flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 p-8 shadow-lg"
          >
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                <Activity size={20} className="text-midnight-ink ml-1" />
                <h3 className="text-midnight-ink text-xl font-black whitespace-nowrap uppercase">
                  가용 리소스 결과
                </h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-point-blue text-6xl font-black tracking-tighter tabular-nums">
                  {result.capacity}
                </span>
                <span className="text-slate-gray text-2xl font-black uppercase opacity-40">
                  시간
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col border-t border-gray-100 pt-2">
              <div className="flex flex-col gap-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-midnight-ink text-base font-black uppercase opacity-80">
                      이론상 전체 시간
                    </span>
                    <span className="text-slate-gray text-[10px] font-bold italic opacity-60">
                      팀원 × 기간 × 업무시간
                    </span>
                  </div>
                  <span className="text-midnight-ink text-2xl font-black tabular-nums">
                    {result.totalHours}h
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-error text-base font-black uppercase opacity-80">
                      비업무 시간 차감
                    </span>
                    <span className="text-error/60 text-[10px] font-bold italic opacity-60">
                      고정 오버헤드 ({overhead}%)
                    </span>
                  </div>
                  <span className="text-error text-2xl font-black tabular-nums">
                    - {result.meetingHours.toFixed(1)}h
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-midnight-ink text-base font-black uppercase opacity-80">
                      최종 몰입 리소스
                    </span>
                    <span className="text-slate-gray text-[10px] font-bold italic opacity-60">
                      집중 가중치 적용 결과
                    </span>
                  </div>
                  <div className="text-point-blue flex items-center gap-2">
                    <Clock size={20} />
                    <span className="text-2xl font-black tabular-nums">x{focusFactor}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto rounded-3xl border border-blue-100 bg-blue-50/30 p-6">
                <div className="text-point-blue mb-2 flex items-center gap-2">
                  <Lightbulb size={18} />
                  <h4 className="text-xs font-black tracking-wider uppercase">Planning Insight</h4>
                </div>
                <p className="text-midnight-ink text-sm leading-relaxed font-bold break-keep">
                  팀의 가용량은{' '}
                  <span className="text-point-blue font-black underline underline-offset-4">
                    {result.capacity}시간
                  </span>
                  입니다. 약{' '}
                  <span className="text-point-blue font-black">
                    {Math.floor(result.capacity / 6)} SP
                  </span>{' '}
                  내외의 업무 할당을 권장합니다.
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default SprintCapacityCalculatorPage;
