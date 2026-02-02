import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { BaseTickContentProps, TickItem } from 'recharts/types/util/types';
import type { CandidateFactor, CandidateWeights } from '@/types/recommendCandidate';

const FACTOR_ORDER: CandidateFactor[] = ['기술', '키워드', '아키텍처', '종합'];
const FACTOR_LABEL: Record<CandidateFactor, string> = {
  기술: '기술',
  키워드: '키워드',
  아키텍처: '아키텍처',
  종합: '종합',
};

const RANK_FONT_SIZES = [13, 11, 11, 11];

type RadarDataPoint = { category: string; value: number };

type CompactRadarChartProps = {
  weights: CandidateWeights;
  score: number;
};

export default function CompactRadarChart({ weights, score }: CompactRadarChartProps) {
  const data: RadarDataPoint[] = FACTOR_ORDER.map((f) => ({
    category: FACTOR_LABEL[f],
    value: weights[f] ?? 0,
  }));

  const maxValue = Math.max(...data.map((d) => d.value));

  const rankFontMap = (() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const map = new Map<string, number>();
    sorted.forEach((item, idx) => {
      map.set(item.category, RANK_FONT_SIZES[Math.min(idx, RANK_FONT_SIZES.length - 1)]);
    });
    return map;
  })();

  const renderTick = (props: BaseTickContentProps) => {
    const { x, y, payload } = props;
    const tick = payload as TickItem | undefined;
    const label = tick?.value != null ? String(tick.value) : undefined;
    if (x == null || y == null || !label) return null;
    const xNum = typeof x === 'string' ? Number(x) : x;
    const yNum = typeof y === 'string' ? Number(y) : y;
    if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) return null;
    const fontSize = rankFontMap.get(label) ?? 9;
    const isMax = data.find((d) => d.category === label)?.value === maxValue;

    return (
      <text
        x={xNum}
        y={yNum}
        textAnchor="middle"
        fill={isMax ? '#c15555' : '#1e293b'}
        fontSize={fontSize}
        fontWeight={700}
      >
        {label}
      </text>
    );
  };

  return (
    <div className="w-full radar-chart">
      <style>
        {`
          .radar-chart svg:focus { outline: none; }
          .radar-chart svg:focus-visible { outline: none; }
          .radar-chart *:focus { outline: none; }
          .radar-chart *:focus-visible { outline: none; }
        `}
      </style>
      <div className="mb-2 flex items-center justify-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">match</span>
        <span className="text-[18px] font-black text-gray-900">{score}</span>
      </div>
      <div className="h-[200px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={data}
            outerRadius="70%"
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={{ outline: 'none' }}
          >
            <defs>
              <radialGradient id="radarFillGradient" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
              </radialGradient>
            </defs>
            <PolarGrid strokeDasharray="2 2" stroke="#f1f5f9" />
            <PolarAngleAxis dataKey="category" tick={renderTick} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke="#93c5fd"
              strokeWidth={1.5}
              fill="url(#radarFillGradient)"
              dot={(props) => {
                const { cx, cy, value, index } = props;
                if (value !== maxValue || value === 0) return <div key={index} />;
                return (
                  <g key={`max-dot-${index}`}>
                    <circle cx={cx} cy={cy} r={6} fill="#3b82f6" fillOpacity={0.2} />
                    <circle cx={cx} cy={cy} r={3} fill="#2563eb" stroke="#fff" strokeWidth={1.5} />
                  </g>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
