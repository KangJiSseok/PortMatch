import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  Coins,
  Check,
  Briefcase,
  PieChart,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Checkbox from '../../components/Checkbox/Checkbox';

// 결과 데이터 타입 정의
interface CostResult {
  monthlyGross: number;
  employerPension: number;
  employerHealth: number;
  employerLongTerm: number;
  employerEmployment: number;
  employerIndustrial: number;
  retirementAccrual: number;
  totalEmployerInsurances: number;
  totalMonthlyCost: number;
  totalYearlyCost: number;
}

const EmployerCostCalculatorPage = () => {
  const [type, setType] = useState<'yearly' | 'monthly'>('yearly');
  const [amount, setAmount] = useState('');
  const [isIncludeRetirement, setIsIncludeRetirement] = useState(false);
  const [welfare, setWelfare] = useState('200,000');
  const [result, setResult] = useState<CostResult | null>(null);

  const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatNumber(e.target.value));
  };

  const handleWelfareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWelfare(formatNumber(e.target.value));
  };

  // 헬퍼 함수에 정확한 타입 적용 (Unexpected any 해결)
  const getPensionGroupTotal = (res: CostResult) =>
    res.employerPension + res.employerHealth + res.employerLongTerm;

  const calculateCost = () => {
    const rawAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!rawAmount) return;

    let monthlyGross = type === 'yearly' ? rawAmount / 12 : rawAmount;

    if (type === 'yearly' && isIncludeRetirement) {
      monthlyGross = rawAmount / 13;
    }

    const welfareAmount = Number(welfare.replace(/[^0-9]/g, ''));

    const employerPension = Math.floor(Math.min(monthlyGross * 0.045, 265500));
    const employerHealth = Math.floor(monthlyGross * 0.03545);
    const employerLongTerm = Math.floor(employerHealth * 0.1295);
    const employerEmployment = Math.floor(monthlyGross * 0.0115);
    const employerIndustrial = Math.floor(monthlyGross * 0.01);

    const retirementAccrual = Math.floor(monthlyGross / 12);

    const totalEmployerInsurances =
      employerPension + employerHealth + employerLongTerm + employerEmployment + employerIndustrial;

    const totalMonthlyCost =
      monthlyGross + totalEmployerInsurances + retirementAccrual + welfareAmount;
    const totalYearlyCost = totalMonthlyCost * 12;

    setResult({
      monthlyGross,
      employerPension,
      employerHealth,
      employerLongTerm,
      employerEmployment,
      employerIndustrial,
      retirementAccrual,
      totalEmployerInsurances,
      totalMonthlyCost,
      totalYearlyCost,
    });
  };

  const formatKrw = (val: number) => Math.floor(val).toLocaleString() + ' 원';

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32 select-none">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Employer Cost Calculator
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            팀원 한 명을 채용할 때 발생하는 실제 기업 지출 총액을 분석합니다.
          </p>
        </header>

        {/* h-164로 높이를 늘려 내부 콘텐츠가 넉넉하게 들어가도록 조정 */}
        <div className="flex h-164 items-stretch justify-center gap-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-88 shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="mb-6 flex shrink-0 items-center gap-2">
              <div className="bg-point-blue h-5 w-1.5 rounded-full" />
              <Calculator size={20} className="text-midnight-ink" />
              <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
                채용 조건 설정
              </h2>
            </div>

            <div className="flex h-full flex-col">
              <div className="flex shrink-0 rounded-xl bg-gray-50 p-1">
                {(['yearly', 'monthly'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`relative flex-1 py-2 text-sm font-black transition-all ${
                      type === t ? 'text-point-blue' : 'text-slate-gray hover:text-midnight-ink'
                    }`}
                  >
                    {type === t && (
                      <motion.div
                        layoutId="activeType"
                        className="bg-pure-white absolute inset-0 rounded-lg shadow-sm"
                      />
                    )}
                    <span className="relative z-10 whitespace-nowrap">
                      {t === 'yearly' ? '연봉' : '월급'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 space-y-5">
                <Input
                  label={type === 'yearly' ? '책정 연봉 (원)' : '지급 월급 (원)'}
                  placeholder="예: 40,000,000"
                  value={amount}
                  onChange={handleAmountChange}
                />

                <div className="flex h-5 items-center px-1">
                  <AnimatePresence>
                    {type === 'yearly' && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        <Checkbox
                          label="퇴직금 포함 여부 (1/13)"
                          checked={isIncludeRetirement}
                          onChange={(e) => setIsIncludeRetirement(e.target.checked)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Input
                  label="월 복리후생비 / 식대 (원)"
                  value={welfare}
                  onChange={handleWelfareChange}
                />

                <div className="mt-4 rounded-2xl bg-gray-50 p-5">
                  <div className="text-slate-gray flex items-start gap-2">
                    <AlertCircle size={16} className="text-point-blue mt-0.5 shrink-0" />
                    <p className="text-xs leading-relaxed font-bold break-keep">
                      실제 지출액은 4대 보험 사업주 부담분과 퇴직급여 충당금에 따라 책정 연봉보다 약
                      10~15% 높게 발생합니다.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="blue"
                size="md"
                fullWidth
                className="mt-auto flex items-center justify-center gap-2 rounded-xl py-4 text-lg font-black whitespace-nowrap shadow-md active:scale-[0.98]"
                onClick={calculateCost}
              >
                <Check size={20} />총 인건비 계산하기
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pure-white flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="mb-6 flex shrink-0 items-center gap-2">
              <div className="bg-point-blue h-5 w-1.5 rounded-full" />
              <TrendingUp size={20} className="text-midnight-ink" />
              <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
                총 인건비 리포트
              </h2>
            </div>

            <div className="relative flex-1">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50"
                  >
                    <div className="mb-4 rounded-full bg-white p-6 shadow-sm">
                      <Briefcase size={40} className="text-point-blue opacity-40" />
                    </div>
                    <p className="text-slate-gray text-center text-base font-bold">
                      조건을 입력하면 상세 지출 리포트가 생성됩니다.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex h-full flex-col"
                  >
                    <div className="bg-point-blue/5 border-point-blue/10 mb-6 rounded-2xl border p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-midnight-ink flex items-center gap-1.5 text-sm font-black uppercase opacity-60">
                          <PieChart size={16} /> 예상 연간 지출 총액
                        </span>
                        <ArrowRight size={16} className="text-point-blue" />
                      </div>
                      <div className="text-point-blue text-4xl font-black tracking-tighter">
                        {formatKrw(result.totalYearlyCost)}
                      </div>
                    </div>

                    <div className="mb-2 flex items-center justify-between px-2">
                      <span className="text-midnight-ink text-lg font-black uppercase">
                        월평균 지출액
                      </span>
                      <div className="text-midnight-ink flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        <span className="text-2xl font-black">
                          {formatKrw(result.totalMonthlyCost)}
                        </span>
                      </div>
                    </div>

                    <div className="custom-scrollbar mt-4 flex flex-1 flex-col gap-6 overflow-y-auto border-t border-gray-100 pt-6 pr-2">
                      <div className="flex items-center justify-between rounded-xl bg-gray-50/80 p-2">
                        <span className="text-midnight-ink text-sm font-bold">
                          월 기본급 (세전)
                        </span>
                        <span className="text-midnight-ink text-base font-black">
                          {formatKrw(result.monthlyGross)}
                        </span>
                      </div>

                      <div className="space-y-6 px-1">
                        <div className="flex flex-col gap-3">
                          <span className="text-point-blue border-point-blue border-l-2 pl-2 text-[11px] font-black tracking-widest uppercase opacity-60">
                            사업주 부담 4대 보험
                          </span>
                          <div className="grid gap-3 pl-1">
                            <div className="text-slate-gray flex justify-between text-xs font-bold">
                              <span>연금 / 건강 / 요양 보험료</span>
                              <span className="text-midnight-ink">
                                {formatKrw(getPensionGroupTotal(result))}
                              </span>
                            </div>
                            <div className="text-slate-gray flex justify-between text-xs font-bold">
                              <span>고용 / 산재 보험료</span>
                              <span className="text-midnight-ink">
                                {formatKrw(result.employerEmployment + result.employerIndustrial)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <span className="text-point-blue border-point-blue border-l-2 pl-2 text-[11px] font-black tracking-widest uppercase opacity-60">
                            법정 및 복리후생
                          </span>
                          <div className="grid gap-3 pl-1">
                            <div className="text-slate-gray flex justify-between text-xs font-bold">
                              <span>퇴직급여 충당금 (월 적립분)</span>
                              <span className="text-midnight-ink">
                                {formatKrw(result.retirementAccrual)}
                              </span>
                            </div>
                            <div className="text-slate-gray flex justify-between text-xs font-bold">
                              <span>기타 수당 및 복지비</span>
                              <span className="text-midnight-ink">
                                {formatKrw(Number(welfare.replace(/[^0-9]/g, '')))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-midnight-ink mb-2 flex items-center justify-between rounded-2xl p-5 text-white">
                        <span className="text-sm font-black uppercase opacity-60">
                          추가 부담금 합계
                        </span>
                        <span className="text-xl font-black">
                          + {formatKrw(result.totalEmployerInsurances + result.retirementAccrual)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default EmployerCostCalculatorPage;
