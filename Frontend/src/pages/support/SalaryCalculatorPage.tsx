import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="bg-pure-white flex min-h-screen justify-center overflow-x-auto">
      <div className="w-350 min-w-350 px-6 pt-24 pb-16">
        <header className="border-point-blue mt-4 mb-10 ml-6 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Salary Calculator
          </motion.h1>
          <div className="flex flex-col items-start">
            <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
              나의 실제 월 급여를 확인해보세요.
            </p>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-pure-white flex h-120 flex-col justify-between rounded-[40px] border border-gray-100 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]"
          >
            <div className="flex flex-col gap-6">
              <div className="flex rounded-[18px] bg-gray-50 p-1">
                {(['yearly', 'monthly'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`relative flex-1 py-3 text-[15px] font-black transition-all ${type === t ? 'text-point-blue' : 'text-slate-gray hover:text-midnight-ink'}`}
                  >
                    {type === t && (
                      <motion.div
                        layoutId="activeType"
                        className="bg-pure-white absolute inset-0 rounded-[14px] shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{t === 'yearly' ? '연봉' : '월급'}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <Input
                  label={type === 'yearly' ? '희망 연봉 (원)' : '월 급여 (원)'}
                  placeholder="예: 50,000,000"
                  value={amount}
                  onChange={handleAmountChange}
                />

                <div className="flex h-6 items-center px-1">
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

                <div className="grid grid-cols-2 gap-4">
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
            </div>

            <Button
              variant="blue"
              size="lg"
              fullWidth
              className="shadow-point-blue/20 mt-8 rounded-[18px] py-4.5 text-xl font-black shadow-2xl transition-all active:scale-[0.98]"
              onClick={calculateSalary}
            >
              계산하기
            </Button>
          </motion.section>

          <div className="h-120">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.section
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex h-full flex-col items-center justify-center rounded-[40px] border border-dashed border-gray-200 bg-gray-50 p-10"
                >
                  <div className="mb-4 text-5xl">💰</div>
                  <p className="text-slate-gray text-center leading-relaxed font-bold">
                    급여 정보를 입력하고
                    <br />
                    계산하기 버튼을 눌러주세요.
                  </p>
                </motion.section>
              ) : (
                <motion.section
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-pure-white flex h-full flex-col justify-between rounded-[40px] border border-gray-100 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex flex-1 flex-col">
                    <div className="mb-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-midnight-ink mt-1 text-2xl font-black">
                            월 예상 실수령액
                          </div>
                        </div>
                        {result.taxSavings > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-point-blue/10 text-point-blue rounded-lg px-3 py-1.5 text-[11px] font-black"
                          >
                            부양가족 혜택: {formatKrw(result.taxSavings)} 절세
                          </motion.div>
                        )}
                      </div>
                      <div className="text-point-blue mt-2 text-5xl font-black tracking-tighter">
                        {formatKrw(result.netPay)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 text-sm font-medium">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-gray">월 급여액 (세전)</span>
                        <span className="text-midnight-ink text-lg font-bold">
                          {formatKrw(result.monthlyGross)}
                        </span>
                      </div>
                      <div className="space-y-3 pt-2">
                        <div className="text-slate-gray flex justify-between">
                          <span>국민연금 (4.5%)</span>
                          <span className="text-midnight-ink font-bold">
                            - {formatKrw(result.nationalPension)}
                          </span>
                        </div>
                        <div className="text-slate-gray flex justify-between">
                          <span>건강보험 (3.545%)</span>
                          <span className="text-midnight-ink font-bold">
                            - {formatKrw(result.healthInsurance)}
                          </span>
                        </div>
                        <div className="text-slate-gray flex justify-between">
                          <span>고용보험 (0.9%)</span>
                          <span className="text-midnight-ink font-bold">
                            - {formatKrw(result.employmentInsurance)}
                          </span>
                        </div>
                        <div className="text-slate-gray flex justify-between">
                          <span>근로소득세 (지방세 포함)</span>
                          <span className="text-midnight-ink font-bold">
                            - {formatKrw(result.incomeTax + result.localIncomeTax)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between border-t border-gray-100 pt-6">
                        <span className="text-error text-base font-black">공제액 합계</span>
                        <span className="text-error text-xl font-black tracking-tight">
                          {formatKrw(result.totalDeductions)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculatorPage;
