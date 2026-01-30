import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  ArrowRightLeft,
  TrendingUp,
  RefreshCcw,
  Maximize,
  Layers,
  Check,
  Weight,
  Thermometer,
  Clock,
  Droplets,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';

type ConverterCategory = 'CURRENCY' | 'LENGTH' | 'AREA' | 'WEIGHT' | 'VOLUME' | 'TEMP';

interface CategoryConfig {
  icon: LucideIcon;
  name: string;
  units: string[];
}

interface CurrencyApiResponse {
  rates: Record<string, number>;
  base_code: string;
  result: string;
  time_last_update_utc: string;
}

const CATEGORIES: Record<ConverterCategory, CategoryConfig> = {
  CURRENCY: { icon: Globe, name: '환율', units: ['USD', 'KRW', 'JPY', 'EUR'] },
  LENGTH: { icon: Maximize, name: '길이', units: ['cm', 'm', 'in', 'ft'] },
  AREA: { icon: Layers, name: '넓이', units: ['m²', 'py', 'ft²'] },
  WEIGHT: { icon: Weight, name: '무게', units: ['kg', 'g', 'lb', 'oz'] },
  VOLUME: { icon: Droplets, name: '부피', units: ['ml', 'L', 'gal', 'oz'] },
  TEMP: { icon: Thermometer, name: '온도', units: ['C', 'F'] },
};

const RATES: Record<string, number> = {
  cm: 1,
  m: 100,
  in: 2.54,
  ft: 30.48,
  'm²': 1,
  py: 3.305785,
  'ft²': 0.092903,
  kg: 1,
  g: 0.001,
  lb: 0.453592,
  oz: 0.0283495,
  ml: 1,
  L: 1000,
  gal: 3785.41,
  oz_v: 29.5735,
};

const MAX_DIGITS = 15;

const UnitConverterPage = () => {
  const [category, setCategory] = useState<ConverterCategory>('CURRENCY');
  const [amount, setAmount] = useState('1,000');
  const [fromUnit, setFromUnit] = useState('USD');
  const [toUnit, setToUnit] = useState('KRW');
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const units = CATEGORIES[category].units;
    setFromUnit(units[0]);
    setToUnit(units[1]);
    if (category === 'CURRENCY') fetchCurrencyRates(units[0]);
  }, [category]);

  const fetchCurrencyRates = async (base: string) => {
    setLoading(true);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const data: CurrencyApiResponse = await res.json();
      if (data?.rates) {
        setCurrencyRates(data.rates);
        const dateObj = new Date(data.time_last_update_utc);
        setLastUpdated(
          `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`,
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const convertedValue = useMemo(() => {
    const raw = Number(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(raw)) return 0;

    if (category === 'CURRENCY') return (currencyRates[toUnit] || 0) * raw;
    if (category === 'TEMP') {
      if (fromUnit === toUnit) return raw;
      return fromUnit === 'C' ? (raw * 9) / 5 + 32 : ((raw - 32) * 5) / 9;
    }
    const fromR = fromUnit === 'oz' && category === 'VOLUME' ? RATES.oz_v : RATES[fromUnit];
    const toR = toUnit === 'oz' && category === 'VOLUME' ? RATES.oz_v : RATES[toUnit];
    const baseValue = raw * (fromR || 1);
    return baseValue / (toR || 1);
  }, [amount, fromUnit, toUnit, category, currencyRates]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    if (val.replace('.', '').length > MAX_DIGITS) return;
    const parts = val.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(parts.join('.'));
  };

  const formatResult = (val: number) => {
    if (val === 0) return '0';

    let digits = 2;
    if (val <= 1) digits = 5;
    else if (val <= 10) digits = 4;
    else if (val <= 100) digits = 3;
    else if (val > 1000000) digits = 0;

    return val.toLocaleString(undefined, {
      maximumFractionDigits: digits,
    });
  };

  return (
    <div className="bg-pure-white flex min-h-screen min-w-350 justify-center pt-32 pb-32 select-none">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-10 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter uppercase"
          >
            Universal Unit Converter
          </motion.h1>
          <div className="mt-2 flex h-6 items-center gap-2">
            <p className="text-slate-gray text-lg font-bold italic opacity-40">
              환율 및 국제 단위계의 실시간 변환을 지원합니다.
            </p>
          </div>
        </header>

        <div className="flex h-110 items-stretch justify-center gap-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-88 shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="mb-6 grid grid-cols-3 gap-1 rounded-2xl bg-gray-50 p-1.5">
              {(Object.keys(CATEGORIES) as ConverterCategory[]).map((cat) => {
                const CatIcon = CATEGORIES[cat].icon;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`relative flex flex-col items-center gap-1.5 py-3 transition-all ${category === cat ? 'text-point-blue' : 'text-slate-gray hover:text-midnight-ink'}`}
                  >
                    {category === cat && (
                      <motion.div
                        layoutId="activeTab"
                        className="bg-pure-white absolute inset-0 rounded-xl border border-gray-100 shadow-sm"
                      />
                    )}
                    <CatIcon size={16} className="relative z-10" />
                    <span className="relative z-10 text-[12px] font-black">
                      {CATEGORIES[cat].name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-6">
              <Input
                label="입력 수치"
                value={amount}
                onChange={handleAmountChange}
                className="text-xl font-black"
              />
              <div className="grid grid-cols-[1fr_44px_1fr] items-end gap-2">
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="text-midnight-ink focus:border-point-blue w-full cursor-pointer rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-black transition-all outline-none"
                >
                  {CATEGORIES[category].units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setFromUnit(toUnit);
                    setToUnit(fromUnit);
                    if (category === 'CURRENCY') fetchCurrencyRates(toUnit);
                  }}
                  className="hover:bg-point-blue text-slate-gray flex h-13 items-center justify-center rounded-xl bg-gray-100 shadow-sm transition-all hover:text-white active:scale-90"
                >
                  <ArrowRightLeft size={18} />
                </button>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="text-midnight-ink focus:border-point-blue w-full cursor-pointer rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-black transition-all outline-none"
                >
                  {CATEGORIES[category].units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-auto pt-4">
              {category === 'CURRENCY' && (
                <Button
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-black shadow-sm"
                  onClick={() => fetchCurrencyRates(fromUnit)}
                >
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> 환율 최신화
                </Button>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pure-white relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 p-8 shadow-lg"
          >
            <div className="mb-8 flex h-10 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                <TrendingUp size={20} className="text-midnight-ink" />
                <h2 className="text-midnight-ink text-lg font-black tracking-tight">
                  단위 변환 결과
                </h2>
              </div>
              {category === 'CURRENCY' && lastUpdated && (
                <div className="text-point-blue bg-point-blue/5 border-point-blue/10 flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[11px] font-black">
                  <Clock size={12} /> 데이터 기준: {lastUpdated} (UTC)
                </div>
              )}
            </div>

            <div className="-mt-6 flex flex-1 flex-col items-center justify-center">
              <div className="text-slate-gray text-lg font-bold tracking-widest uppercase opacity-40">
                {amount} {fromUnit} 은(는) 현재
              </div>

              <div className="flex h-28 w-full items-center justify-center px-6 text-center">
                <motion.div
                  key={convertedValue}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-baseline justify-center"
                >
                  <span
                    className={`text-point-blue leading-none font-black tracking-tighter wrap-break-word tabular-nums ${
                      formatResult(convertedValue).length > 12
                        ? 'text-4xl'
                        : formatResult(convertedValue).length > 8
                          ? 'text-5xl'
                          : 'text-6xl'
                    }`}
                  >
                    {formatResult(convertedValue)}
                  </span>
                  <span className="text-midnight-ink ml-4 text-2xl font-black uppercase opacity-30">
                    {toUnit}
                  </span>
                </motion.div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-600 shadow-sm">
                  <Check size={18} />
                  {category === 'TEMP'
                    ? `${fromUnit === 'C' ? '(°C × 9/5) + 32' : '(°F - 32) × 5/9'}`
                    : `1 ${fromUnit} ≈ ${(convertedValue / (Number(amount.replace(/[^0-9.]/g, '')) || 1)).toLocaleString(undefined, { maximumFractionDigits: 5 })} ${toUnit}`}
                </div>

                {category === 'CURRENCY' && (
                  <div className="text-slate-gray/60 flex items-center gap-2 text-[11px] font-bold">
                    <AlertCircle size={14} />
                    실제 거래 환율과 차이가 있을 수 있으니 참고용으로만 사용하시기 바랍니다.
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default UnitConverterPage;
