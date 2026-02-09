import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  ReceiptText, // ReceiptKoreanWon 대신 존재함이 확실한 아이콘으로 교체
  Wallet,
  Check,
  Gift,
  CircleDollarSign,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Checkbox from '../../components/Checkbox/Checkbox';

interface SalaryResult {
  monthlyGross: number;
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  incomeTax: number;
  localIncomeTax: number;
  totalDeductions: number;
  netPay: number;
  taxSavings: number;
}

const SalaryCalculatorPage = () => {
  const [type, setType] = useState<'yearly' | 'monthly'>('yearly');
  const [amount, setAmount] = useState('');
  const [isIncludeRetirement, setIsIncludeRetirement] = useState(false);
  const [nonTaxable, setNonTaxable] = useState('200,000');
  const [familyCount, setFamilyCount] = useState('1');
  const [result, setResult] = useState<SalaryResult | null>(null);

  const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatNumber(e.target.value));
  };

  const handleNonTaxableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNonTaxable(formatNumber(e.target.value));
  };

  const calculateSalary = () => {
    const rawAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!rawAmount) return;

    let monthlyGross = type === 'yearly' ? rawAmount / 12 : rawAmount;
    if (type === 'yearly' && isIncludeRetirement) {
      monthlyGross = rawAmount / 13;
    }

    const nonTaxableAmount = Number(nonTaxable.replace(/[^0-9]/g, ''));
    const taxableAmount = Math.max(0, monthlyGross - nonTaxableAmount);

    const nationalPension = Math.floor(Math.min(taxableAmount * 0.045, 265500));
    const healthInsurance = Math.floor(taxableAmount * 0.03545);
    const longTermCare = Math.floor(healthInsurance * 0.1295);
    const employmentInsurance = Math.floor(taxableAmount * 0.009);

    const getBaseIncomeTax = (taxable: number, persons: number) => {
      if (taxable < 1060000) return 0;
      let baseTax = 0;
      if (taxable < 3000000) baseTax = taxable * 0.015;
      else if (taxable < 5000000) baseTax = taxable * 0.035;
      else if (taxable < 7000000) baseTax = taxable * 0.055;
      else baseTax = taxable * 0.08;

      const deductionRate = (persons - 1) * 0.15;
      return Math.max(0, baseTax * (1 - deductionRate));
    };

    const incomeTax = Math.floor(getBaseIncomeTax(taxableAmount, Number(familyCount)));
    const loneTax = Math.floor(getBaseIncomeTax(taxableAmount, 1));
    const taxSavings = Math.max(0, loneTax - incomeTax);
    const localIncomeTax = Math.floor(incomeTax * 0.1);

    const totalDeductions =
      nationalPension +
      healthInsurance +
      longTermCare +
      employmentInsurance +
      incomeTax +
      localIncomeTax;
    const netPay = Math.floor(monthlyGross - totalDeductions);

    setResult({
      monthlyGross,
      nationalPension,
      healthInsurance,
      longTermCare,
      employmentInsurance,
      incomeTax,
      localIncomeTax,
      totalDeductions,
      netPay,
      taxSavings,
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
            Salary Calculator
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            나의 실제 월 급여를 확인해보세요.
          </p>
        </header>

        <div className="flex h-132 items-stretch gap-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-88 shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="mb-6 flex shrink-0 items-center gap-2">
              <div className="bg-point-blue h-5 w-1.5 rounded-full" />
              <Calculator size={20} className="text-midnight-ink" />
              <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
                급여 조건 설정
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

              <div className="mt-6 space-y-4">
                <Input
                  label={type === 'yearly' ? '희망 연봉 (원)' : '월 급여 (원)'}
                  placeholder="예: 50,000,000"
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
                        transition={{ duration: 0.2 }}
                      >
                        <Checkbox
                          label="퇴직금 포함 여부"
                          checked={isIncludeRetirement}
                          onChange={(e) => setIsIncludeRetirement(e.target.checked)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="비과세액 (원)"
                    value={nonTaxable}
                    onChange={handleNonTaxableChange}
                  />
                  <Select
                    label="부양가족 수"
                    options={[
                      { value: '1', label: '본인(1명)' },
                      { value: '2', label: '2명' },
                      { value: '3', label: '3명' },
                      { value: '4', label: '4명' },
                    ]}
                    value={familyCount}
                    onChange={(e) => setFamilyCount(e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="blue"
                size="md"
                fullWidth
                className="mt-auto flex items-center justify-center gap-2 rounded-xl py-4 text-lg font-black whitespace-nowrap shadow-md active:scale-[0.98]"
                onClick={calculateSalary}
              >
                <Check size={20} />
                계산하기
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pure-white flex flex-1 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="mb-6 flex shrink-0 items-center gap-2">
              <div className="bg-point-blue h-5 w-1.5 rounded-full" />
              <ReceiptText size={20} className="text-midnight-ink" />
              <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
                상세 계산 결과
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 opacity-40"
                >
                  <Wallet size={48} className="text-midnight-ink mb-3" />
                  <p className="text-slate-gray text-center text-sm leading-relaxed font-bold whitespace-nowrap">
                    급여 정보를 입력하고
                    <br />
                    계산하기 버튼을 눌러주세요.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full flex-col"
                >
                  <div className="mb-8 shrink-0">
                    <div className="flex items-start justify-between">
                      <div className="text-midnight-ink text-xl font-black whitespace-nowrap">
                        월 예상 실수령액
                      </div>
                      {result.taxSavings > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-point-blue/10 text-point-blue flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black whitespace-nowrap"
                        >
                          <Gift size={12} />
                          부양가족 혜택: {formatKrw(result.taxSavings)} 절세
                        </motion.div>
                      )}
                    </div>
                    <div className="text-point-blue mt-3 flex items-center gap-2 text-4xl font-black tracking-tighter whitespace-nowrap">
                      <CircleDollarSign size={32} />
                      {formatKrw(result.netPay)}
                    </div>
                  </div>

                  <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto border-t border-gray-100 pt-8 pr-2 text-sm font-medium">
                    <div className="flex shrink-0 items-center justify-between">
                      <span className="text-slate-gray text-sm whitespace-nowrap">
                        월 급여액 (세전)
                      </span>
                      <span className="text-midnight-ink text-lg font-bold whitespace-nowrap">
                        {formatKrw(result.monthlyGross)}
                      </span>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="text-slate-gray flex items-center justify-between text-xs">
                        <span className="whitespace-nowrap">국민연금 (4.5%)</span>
                        <span className="text-midnight-ink font-bold whitespace-nowrap">
                          - {formatKrw(result.nationalPension)}
                        </span>
                      </div>
                      <div className="text-slate-gray flex items-center justify-between text-xs">
                        <span className="whitespace-nowrap">건강보험 (3.545%)</span>
                        <span className="text-midnight-ink font-bold whitespace-nowrap">
                          - {formatKrw(result.healthInsurance)}
                        </span>
                      </div>
                      <div className="text-slate-gray flex items-center justify-between text-xs">
                        <span className="whitespace-nowrap">고용보험 (0.9%)</span>
                        <span className="text-midnight-ink font-bold whitespace-nowrap">
                          - {formatKrw(result.employmentInsurance)}
                        </span>
                      </div>
                      <div className="text-slate-gray flex items-center justify-between text-xs">
                        <span className="whitespace-nowrap">근로소득세 (지방세 포함)</span>
                        <span className="text-midnight-ink font-bold whitespace-nowrap">
                          - {formatKrw(result.incomeTax + result.localIncomeTax)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto flex shrink-0 items-center justify-between border-t border-gray-100 pt-6">
                      <span className="text-error text-base font-black whitespace-nowrap">
                        공제액 합계
                      </span>
                      <span className="text-error text-2xl font-black tracking-tight whitespace-nowrap">
                        {formatKrw(result.totalDeductions)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculatorPage;
