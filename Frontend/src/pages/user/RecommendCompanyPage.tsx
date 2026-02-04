import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  KeyRound,
  Puzzle,
  X,
  Info,
  FileText,
  MousePointerClick,
  ChevronDown,
  Building2,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { BaseTickContentProps, TickItem } from 'recharts/types/util/types';
import {
  fetchPortfolioRecommendedCompanies,
  fetchCompanyMatchExplanation,
} from '@/api/recommendCompany';
import { fetchJobPostingsByCompany } from '@/api/jobPostings';
import type {
  CompanyRecommendationResponse,
  ExplanationMatchSection,
} from '@/types/recommendCompany';

/** ---------------- Types ---------------- **/

type Factor = '프로젝트' | '도메인' | '문제' | '해결' | '기술스택';
const FACTOR_ORDER: Factor[] = ['프로젝트', '도메인', '문제', '해결', '기술스택'];

type Headline = {
  line1: string;
  highlight: string;
  line2: string;
  line3: string;
};

type Section =
  | { key: 'portfolioFocus'; title: string; text: string }
  | { key: 'writingCheats'; title: string; tags: string[] }
  | { key: 'strategyGuide'; title: string; text: string };

type Company = {
  id: number;
  companyId: number;
  portfolioProjectId: number;
  companyProjectId: number;
  name: string;
  portfolioContent: string;
  companyContent: string;
  matchScore: number; // 0~100
  openingsCount: number;
  weights: Record<Factor, number>; // % 합 100
  topFactors: Factor[];
  // ✅ 백엔드가 주는 헤드라인/섹션
  headline?: Headline;
  sections?: Section[];
};

/** ---------------- Palette ---------------- **/

const PALETTE = {
  pureWhite: '#fcfcfc',
  midnightInk: '#1a1a1a',
  cloudDancer: '#f0eee9',
  slateGray: '#4a4a4a',
  softPebble: '#d6d2c4',
  silverMist: '#a3a3a3',
};

// ✅ 도메인 색: \
const FACTOR_COLOR: Record<Factor, string> = {
  프로젝트: '#F43F5E',
  도메인: '#60A5FA',
  문제: '#FB923C',
  해결: '#4ADE80',
  기술스택: '#C084FC',
};

// ✅ 채도 낮춘 포인트 블루
const POINT_BLUE = '#5563C1';

/** ---------------- similarity(0~1 or 0~100) -> weights(%) ---------------- **/

function toScore(similarity: number): number {
  if (!Number.isFinite(similarity)) return 0;
  if (similarity > 1) return Math.max(0, Math.min(100, Math.round(similarity)));
  return Math.max(0, Math.min(100, Math.round(similarity * 100)));
}

function similaritiesToWeights(sim: Record<Factor, number>): Record<Factor, number> {
  const out = {} as Record<Factor, number>;
  FACTOR_ORDER.forEach((k) => {
    out[k] = toScore(sim[k] ?? 0);
  });
  return out;
}

function pickTopFactors(weights: Record<Factor, number>, n = 2): Factor[] {
  return [...FACTOR_ORDER].sort((a, b) => weights[b] - weights[a]).slice(0, n);
}

const FACTOR_LABEL: Record<Factor, string> = {
  프로젝트: '프로젝트',
  도메인: '도메인',
  문제: '문제 정의',
  해결: '해결 방식',
  기술스택: '기술스택',
};

/** ---------------- Radar Chart ---------------- **/

type RadarDataPoint = { category: string; value: number };

function CompanyRadarChart({ weights, score }: { weights: Record<Factor, number>; score: number }) {
  const data: RadarDataPoint[] = FACTOR_ORDER.map((f) => ({
    category: FACTOR_LABEL[f],
    value: weights[f] ?? 0,
  }));

  const maxValue = Math.max(...data.map((d) => d.value));

  const renderTick = (props: BaseTickContentProps) => {
    const { x, y, payload } = props;
    const tick = payload as TickItem | undefined;
    const label = tick?.value != null ? String(tick.value) : undefined;
    if (x == null || y == null || !label) return null;
    const xNum = typeof x === 'string' ? Number(x) : x;
    const yNum = typeof y === 'string' ? Number(y) : y;
    if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) return null;
    const isMax = data.find((d) => d.category === label)?.value === maxValue;

    return (
      <text
        x={xNum}
        y={yNum}
        textAnchor="middle"
        fill={isMax ? '#c15555' : '#1e293b'}
        fontSize={10}
        fontWeight={700}
      >
        {label}
      </text>
    );
  };

  return (
    <div className="w-full">
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
              <radialGradient id="companyRadarFillGradient" cx="50%" cy="50%" r="60%">
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
              fill="url(#companyRadarFillGradient)"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** ---------------- Button Motion ---------------- **/

const BTN_BASE =
  'relative w-full rounded-xl font-bold transition-all duration-200 outline-none cursor-pointer ' +
  'focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
  'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]';

const BTN_INSET =
  "overflow-hidden after:content-[''] after:absolute after:inset-0 after:pointer-events-none " +
  'after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-200 ' +
  'after:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.06)] ' +
  'hover:after:opacity-100 focus-visible:after:opacity-100';

/** ---------------- CompanyCard ---------------- **/

const TECH_KEYWORDS = [
  'React',
  'Next.js',
  'Vue',
  'Angular',
  'Svelte',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Express',
  'NestJS',
  'Spring',
  'Spring Boot',
  'Java',
  'Kotlin',
  'Python',
  'Django',
  'FastAPI',
  'Flask',
  'Go',
  'Rust',
  'C#',
  'C++',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'Kafka',
  'RabbitMQ',
  'Docker',
  'Kubernetes',
  'AWS',
  'GCP',
  'Azure',
  'GraphQL',
  'REST',
];

function extractTechTags(text: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase();
  const tags = TECH_KEYWORDS.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  return Array.from(new Set(tags));
}

function extractTechTagsFromStructured(content: string): string[] {
  if (!content) return [];
  const parsed = parseStructuredContent(content);
  const techLine =
    parsed['기술'] || parsed['기술스택'] || parsed['스택'] || parsed['Tech'] || content;

  const rawTags = techLine
    .split(/[,\u00B7/|]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const keywordTags = extractTechTags(techLine);
  const merged = [...rawTags, ...keywordTags];
  return Array.from(new Set(merged));
}

function getExcerpt(text: string): string {
  if (!text) return '';
  const parts = text
    .split(/[\n.!?]/)
    .map((t) => t.trim())
    .filter(Boolean);
  return parts[0] ?? text.slice(0, 80);
}

function parseStructuredContent(content: string): Record<string, string> {
  if (!content) return {};
  const result: Record<string, string> = {};
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line) => {
    const match = line.match(/^\[([^\]]+)\]\s*(.+)$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  });

  if (Object.keys(result).length === 0) {
    const regex = /\[([^\]]+)\]\s*([^[]+)/g;
    let match = regex.exec(content);
    while (match) {
      result[match[1]] = match[2].trim();
      match = regex.exec(content);
    }
  }

  return result;
}

function getStructuredValue(content: string, labels: string[], fallback: string): string {
  const parsed = parseStructuredContent(content);
  for (const label of labels) {
    if (parsed[label]) return parsed[label];
  }
  return fallback;
}

function ComparisonTable({
  portfolioContent,
  companyContent,
  weights,
}: {
  portfolioContent: string;
  companyContent: string;
  weights: Record<Factor, number>;
}) {
  const portfolioTechTags = extractTechTagsFromStructured(portfolioContent);
  const companyTechTags = extractTechTagsFromStructured(companyContent);
  const matchedTechTags = companyTechTags.filter((tag) => portfolioTechTags.includes(tag));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full table-fixed text-left">
        <colgroup>
          <col className="w-[140px]" />
          <col className="w-[100px]" />
          <col />
          <col />
        </colgroup>
        <thead className="border-b border-gray-200 bg-gray-50/50">
          <tr className="text-[13px] font-medium tracking-wider text-gray-500 uppercase">
            <th className="px-6 py-4 text-center">비교 항목</th>
            <th className="px-4 py-4 text-center">매칭도</th>
            <th className="px-6 py-4">내 포트폴리오</th>
            <th className="px-6 py-4">기업 과제</th>
          </tr>
        </thead>
        <tbody className="text-[14px]">
          {FACTOR_ORDER.map((factor) => {
            if (factor === '기술스택') {
              return (
                <tr key={factor} className="border-t border-gray-100">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    <div>{FACTOR_LABEL[factor]}</div>
                    {matchedTechTags.length > 0 && (
                      <p className="mt-2 text-[12px] font-semibold text-indigo-600">
                        공통 기술 {matchedTechTags.length}개
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-5 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[14px] font-bold text-gray-900">
                        {weights[factor]}
                        <span className="ml-0.5 text-[12px] font-medium opacity-80">점</span>
                      </span>
                      <div className="h-1.5 w-full max-w-[60px] overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${weights[factor]}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: FACTOR_COLOR[factor] }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {portfolioTechTags.length === 0 && (
                        <span className="text-[12px] text-blue-400">추출된 기술 없음</span>
                      )}
                      {portfolioTechTags.map((tag) => (
                        <span
                          key={`portfolio-${tag}`}
                          className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                            matchedTechTags.includes(tag)
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'border border-blue-100 bg-white text-blue-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {companyTechTags.length === 0 && (
                        <span className="text-[12px] text-indigo-400">추출된 기술 없음</span>
                      )}
                      {companyTechTags.map((tag) => (
                        <span
                          key={`company-${tag}`}
                          className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                            matchedTechTags.includes(tag)
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'border border-indigo-100 bg-white text-indigo-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            }

            const portfolioValue = getStructuredValue(
              portfolioContent,
              factor === '프로젝트' ? ['프로젝트명', '프로젝트'] : [factor],
              getExcerpt(portfolioContent),
            );
            const companyValue = getStructuredValue(
              companyContent,
              factor === '프로젝트' ? ['프로젝트명', '프로젝트', '회사'] : [factor],
              getExcerpt(companyContent),
            );

            return (
              <tr key={factor} className="border-t border-gray-100">
                <td className="px-6 py-4 font-bold text-gray-900">{FACTOR_LABEL[factor]}</td>
                <td className="px-4 py-5 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[14px] font-bold text-gray-900">
                      {weights[factor]}
                      <span className="ml-0.5 text-[12px] font-medium opacity-80">점</span>
                    </span>
                    <div className="h-1.5 w-full max-w-[60px] overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${weights[factor]}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: FACTOR_COLOR[factor] }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-[14px] leading-relaxed text-gray-600">
                  {portfolioValue || '포트폴리오 요약 데이터가 없습니다.'}
                </td>
                <td className="px-6 py-5 text-[14px] leading-relaxed text-gray-600">
                  {companyValue || '기업 과제 요약 데이터가 없습니다.'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompanyCard({
  company,
  onOpenReason,
}: {
  company: Company;
  onOpenReason: (c: Company) => void;
}) {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);

  const goToPostings = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(
      `/job-postings?cid=${company.companyId}&companyName=${encodeURIComponent(company.name)}`,
    );
  };

  return (
    <motion.div
      whileHover={{
        y: -6,
        boxShadow: '14px 18px 36px rgba(0,0,0,0.16), 6px 8px 16px rgba(0,0,0,0.10)',
      }}
      whileTap={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={[
        'relative flex min-h-[460px] w-full flex-col overflow-hidden rounded-2xl',
        'border border-gray-200/60 bg-white',
      ].join(' ')}
      style={{
        boxShadow: '6px 8px 18px rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)' }}
      />

      <div
        className="relative flex-shrink-0 cursor-pointer [perspective:1000px]"
        style={{ height: 300 }}
        onClick={() => setIsFlipped((v) => !v)}
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex h-full flex-col p-6 [backface-visibility:hidden]">
            <div className="flex min-h-[44px] items-center justify-center pt-[8px]">
              <h3 className="w-full truncate text-center text-[17px] font-bold text-[#1a1a1a]">
                {company.name}
              </h3>
            </div>

            <div className="flex flex-1 flex-col items-center justify-end pt-[13px]">
              <CompanyRadarChart weights={company.weights} score={company.matchScore} />

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {company.topFactors.map((f) => (
                  <span
                    key={f}
                    className="rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{
                      backgroundColor: `${FACTOR_COLOR[f]}12`,
                      color: FACTOR_COLOR[f],
                      border: `1px solid ${FACTOR_COLOR[f]}25`,
                    }}
                  >
                    #{FACTOR_LABEL[f]}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute top-4 right-4 text-gray-500 opacity-40">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex h-full [transform:rotateY(180deg)] flex-col p-6 [backface-visibility:hidden]"
            style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFBFB 100%)' }}
          >
            <div className="flex min-h-[44px] items-center justify-center pt-[8px]">
              <h3 className="w-full truncate text-center text-[17px] font-bold text-[#1a1a1a]">
                {company.name} 분석 지표
              </h3>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <div className="space-y-4">
                {FACTOR_ORDER.map((f) => (
                  <div key={f} className="text-[12px]">
                    <div className="mb-1.5 flex justify-between">
                      <span className="font-semibold text-gray-500">{FACTOR_LABEL[f]}</span>
                      <span className="font-bold text-[#4a4a4a]">{company.weights[f]}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isFlipped ? `${company.weights[f]}%` : 0 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: FACTOR_COLOR[f] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(0,0,0,0.04)',
              }}
            />
          </div>
        </motion.div>
      </div>

      <div className="-mt-4 flex min-h-0 flex-1 flex-col gap-2 px-4 pt-0 pb-2">
        <div className="mt-10 space-y-2 pt-1">
          <button
            onClick={goToPostings}
            className={`${BTN_BASE} ${BTN_INSET} w-full py-3 text-[13px] shadow-sm`}
            style={{
              backgroundColor: '#F8F8F6',
              color: PALETTE.slateGray,
              border: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            채용 공고 <span className="ml-1 text-blue-600">{company.openingsCount}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenReason(company);
            }}
            className={`${BTN_BASE} ${BTN_INSET} w-full py-3 text-[13px] text-white shadow-md`}
            style={{ backgroundColor: POINT_BLUE }}
          >
            합격 전략 리포트
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/** ---------------- Criteria (모달 밖에서 1번만) ---------------- **/

function EvaluationCriteria() {
  const [open, setOpen] = useState(false);

  // ✅ 요청하신 세련된 컬러 팔레트와 매칭
  const FACTOR_COLORS = {
    프로젝트: '#60A5FA',
    도메인: '#F43F5E',
    '문제 정의': '#FB923C',
    '해결 방식': '#4ADE80',
    기술스택: '#C084FC',
  };

  const CRITERIA_DATA = [
    {
      id: '프로젝트',
      desc: '실제로 구현한 제품의 성격, 대규모 트래픽 처리 등 구현 규모를 비교합니다.',
    },
    {
      id: '도메인',
      desc: '프로젝트가 어떤 산업·서비스 영역에서 진행되었는지, 환경적 유사성을 평가합니다.',
    },
    {
      id: '문제 정의',
      desc: '프로젝트에서 해결하려 했던 과제의 본질(성능, 효율 등)에 집중합니다.',
    },
    {
      id: '해결 방식',
      desc: '문제를 풀기 위해 선택한 접근 방식과 사고 구조가 논리적인지 평가합니다.',
    },
    {
      id: '기술스택',
      desc: '단순 사용 여부보다 기술이 활용된 맥락과 숙련도의 연관성을 고려합니다.',
    },
  ];

  return (
    <div className="mb-6 pl-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Header (Toggle) - 컴팩트 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50/50"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0eee9] text-[#4a4a4a]">
              <Info className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-[15px] font-black text-[#1a1a1a]">기업 평가 지표</h4>
              <p className="mt-0.5 text-[12px] font-medium text-gray-500">
                AI가 당신의 포트폴리오를 분석하는 5가지 핵심 관점
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Body - 패딩·간격 축소 */}
        {open && (
          <div className="border-t border-gray-100 bg-[#fcfcfc] px-5 py-4">
            <p className="mb-4 max-w-[80ch] text-[13px] leading-relaxed text-[#4a4a4a]">
              이 리포트는 기업이 실제로 수행하는 프로젝트 내용을 기준으로,
              <br />
              <span className="border-b-2 border-[#d6d2c4] font-bold text-[#1a1a1a]">
                “어떤 맥락에서 어떤 문제를 어떻게 해결해왔는지”
              </span>
              가 얼마나 유사한지를 종합적으로 평가합니다.
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {CRITERIA_DATA.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-lg border border-gray-100 bg-white p-3 shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all hover:shadow-md"
                >
                  <div
                    className="absolute top-0 left-0 h-0.5 w-full rounded-t-lg"
                    style={{
                      backgroundColor: FACTOR_COLORS[item.id as keyof typeof FACTOR_COLORS],
                    }}
                  />
                  <h5 className="mb-1 text-[13px] font-black text-[#1a1a1a]">{item.id}</h5>
                  <p className="text-[11px] leading-[1.5] font-medium text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------------- Reason Modal ---------------- **/

let lockedScrollY = 0;
function lockBodyScroll(lock: boolean) {
  const body = document.body;

  if (lock) {
    const y = window.scrollY || document.documentElement.scrollTop;
    lockedScrollY = y;
    body.dataset.scrollY = String(y);
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  } else {
    const y = Number(body.dataset.scrollY || lockedScrollY || 0);
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    delete body.dataset.scrollY;
    window.scrollTo(0, y);
  }
}

function ReasonModal({
  open,
  company,
  onClose,
  loading,
  error,
}: {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [progress, setProgress] = useState(0);
  const showScan = false;
  const comparisonTableRef = useRef<HTMLDivElement | null>(null);
  const comparisonHeightRef = useRef(0);
  const [comparisonTableHeight, setComparisonTableHeight] = useState(0);

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => setProgress(0));
      return;
    }

    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    requestAnimationFrame(() => setProgress(0));

    const schedule = (intervalMs: number, stepMin: number, stepMax: number, cap: number) => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        setProgress((prev) => {
          if (!mounted) return prev;
          const step = stepMin + Math.floor(Math.random() * (stepMax - stepMin + 1));
          const next = Math.min(cap, prev + step);
          return next;
        });
      }, intervalMs);
    };

    // 97%까지 빠르게, 이후 천천히
    schedule(120, 6, 10, 97);

    const phaseTimer = setTimeout(() => {
      schedule(600, 1, 2, 99);
    }, 1100);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      clearTimeout(phaseTimer);
    };
  }, [loading]);
  useEffect(() => {
    lockBodyScroll(open);
    return () => lockBodyScroll(false);
  }, [open]);

  useEffect(() => {
    if (loading) return;
    const node = comparisonTableRef.current;
    if (!node) return;

    const updateHeight = () => {
      const next = Math.ceil(node.getBoundingClientRect().height);
      if (next > 0 && next !== comparisonHeightRef.current) {
        comparisonHeightRef.current = next;
        setComparisonTableHeight(next);
      }
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, company, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!company) return null;

  // ✅ 백엔드 headline 사용 + fallback
  const fallbackTopFactor = pickTopFactors(company.weights, 1)[0] ?? '프로젝트';
  const topFactorLabel = FACTOR_LABEL[fallbackTopFactor];
  const headerHeadline: Headline = {
    line1: `${company.name} 기준, 당신의`,
    highlight: `#${topFactorLabel}`,
    line2: '항목이',
    line3: '가장 유사하게 평가되었습니다.',
  };

  const summaryHeadline: Headline = company.headline ?? {
    line1: `${company.name} 기준, 당신의`,
    highlight: `#${topFactorLabel}`,
    line2: '항목이',
    line3: '가장 유사하게 평가되었습니다.',
  };

  // ✅ 섹션도 백엔드 응답 사용 + fallback
  const sections: Section[] = company.sections ?? [
    { key: 'portfolioFocus', title: '포트폴리오 강조 포인트', text: '...' },
    { key: 'writingCheats', title: '지원서 작성 치트키', tags: ['#...'] },
    { key: 'strategyGuide', title: '합격 전략 가이드', text: '...' },
  ];

  const portfolioFocus = sections.find((s) => s.key === 'portfolioFocus') as
    | { key: 'portfolioFocus'; title: string; text: string }
    | undefined;

  const writingCheats = sections.find((s) => s.key === 'writingCheats') as
    | { key: 'writingCheats'; title: string; tags: string[] }
    | undefined;

  const strategyGuide = sections.find((s) => s.key === 'strategyGuide') as
    | { key: 'strategyGuide'; title: string; text: string }
    | undefined;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 28, opacity: 0, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative z-[201] flex max-h-[94vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
          >
            <div
              className="relative px-6 py-6 text-white sm:px-8"
              style={{ backgroundColor: PALETTE.midnightInk }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.05em] text-blue-200">
                      COMPANY REPORT
                    </span>
                    <span className="text-[12px] font-medium text-white/40">|</span>
                    <span className="text-[12px] font-medium text-blue-200/80">
                      ID #{company.companyId}
                    </span>
                  </div>

                  <h4 className="text-[22px] leading-[1.25] font-bold tracking-tight sm:text-[24px]">
                    {headerHeadline.line1}
                    <br />
                    <span className="text-blue-300">{headerHeadline.highlight}</span>{' '}
                    {headerHeadline.line2}
                    <br />
                    {headerHeadline.line3}
                  </h4>
                </div>

                <button
                  onClick={onClose}
                  className="group relative -mt-4 -mr-2 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-white/10 active:scale-95"
                  aria-label="close"
                >
                  <X className="h-5 w-5 text-white/60 group-hover:text-white" />
                </button>
              </div>
            </div>

            <div
              className="soft-scrollbar flex-1 overflow-y-auto px-7 pt-4 pb-6 sm:px-10 sm:pt-4 sm:pb-4"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(15,23,42,0.22) transparent' }}
            >
              <style>
                {`
                  .soft-scrollbar::-webkit-scrollbar { width: 8px; }
                  .soft-scrollbar::-webkit-scrollbar-track { background: transparent; }
                  .soft-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(15,23,42,0.18);
                    border-radius: 999px;
                  }
                  .soft-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(15,23,42,0.28);
                  }
                `}
              </style>
              <div className="w-full space-y-8">
                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-[16px] font-black text-[#1a1a1a]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    내 포트폴리오와 비교 결과
                  </h4>
                  <div
                    ref={comparisonTableRef}
                    style={
                      loading && comparisonTableHeight
                        ? { minHeight: `${comparisonTableHeight}px` }
                        : undefined
                    }
                  >
                    <ComparisonTable
                      portfolioContent={company.portfolioContent}
                      companyContent={company.companyContent}
                      weights={company.weights}
                    />
                  </div>
                </div>

                {showScan && (
                  <div className="relative max-h-[62vh] w-full overflow-hidden rounded-[24px] border border-slate-100 bg-white/60 p-6 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl">
                    <style>
                      {`
                  @keyframes scanLine {
                    0% { transform: translateY(-10%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(110%); opacity: 0; }
                  }
                  @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                `}
                    </style>

                    {/* 상단 장식 요소 - 은은한 글로우 */}
                    <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-50/50 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-50/40 blur-3xl" />

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900">
                          전략 리포트 스캔
                        </h3>
                        <p className="mt-1.5 text-sm font-medium text-slate-500">
                          AI가 포트폴리오의 핵심 역량을 정밀하게 분석하고 있습니다
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
                      {/* 메인 스캔 프리뷰 영역 */}
                      <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                        {/* 스캐닝 라인 애니메이션 */}
                        <div
                          className="absolute inset-x-0 z-10 h-12 w-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent"
                          style={{ animation: 'scanLine 3s ease-in-out infinite' }}
                        />

                        <div className="space-y-3 opacity-40">
                          <div className="h-4 w-1/3 rounded-md bg-slate-200" />
                          <div className="space-y-2">
                            <div className="h-2 w-full rounded-md bg-slate-200" />
                            <div className="h-2 w-11/12 rounded-md bg-slate-200" />
                            <div className="h-2 w-10/12 rounded-md bg-slate-200" />
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="h-12 rounded-lg bg-slate-200" />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 우측 체크리스트 영역 */}
                      <div className="flex flex-col justify-center space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <p className="text-[13px] font-bold text-slate-800">분석 프로세스</p>
                        <div className="space-y-3">
                          {[
                            { t: 30, l: '데이터 정밀 대조' },
                            { t: 60, l: '역량 구조 정합 확인' },
                            { t: 90, l: '최종 리포트 생성' },
                          ].map((step, idx) => {
                            const done = progress >= step.t;
                            const active = progress >= step.t - 30 && progress < step.t;
                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-3 transition-opacity duration-300 ${done || active ? 'opacity-100' : 'opacity-40'}`}
                              >
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                                    done ? 'border-slate-800 bg-slate-800' : 'border-slate-300'
                                  }`}
                                >
                                  {done && <span className="text-[10px] text-white">✓</span>}
                                  {active && (
                                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-800" />
                                  )}
                                </div>
                                <span
                                  className={`text-xs font-medium ${done ? 'text-slate-900' : 'text-slate-500'}`}
                                >
                                  {step.l}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 하단 진행바 */}
                    <div className="mt-6">
                      <div className="mb-2 flex justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                          System Status
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">Processing...</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-800 transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="w-full rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-lg shadow-slate-200/40 backdrop-blur">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[12px] font-bold tracking-wider text-slate-500 uppercase">
                        합격 전략을 분석 중입니다···
                      </span>
                      <span className="text-[12px] font-bold text-slate-500">{progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-800 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-[16px] font-black text-[#1a1a1a]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <MousePointerClick className="h-4 w-4" />
                    </span>
                    분석 요약
                  </h4>
                  <div className="rounded-2xl border border-gray-100 bg-[#f8f9fa] p-6 sm:p-7">
                    <p
                      className={`text-[14px] leading-relaxed font-medium ${
                        loading ? 'text-gray-300' : 'text-[#4a4a4a]'
                      }`}
                    >
                      {loading ? (
                        '분석 중'
                      ) : (
                        <>
                          <span className="font-black text-blue-500">{summaryHeadline.highlight}</span>
                          <br></br>
                          {summaryHeadline.line1}
                        </>
                      )}
                    </p>
                    <p
                      className={`text-[14px] leading-relaxed font-medium ${
                        loading ? 'text-gray-300' : 'text-[#4a4a4a]'
                      }`}
                    >
                      {loading ? '' : <>{summaryHeadline.line2}</>}
                    </p>
                    <p
                      className={`text-[14px] leading-relaxed font-medium ${
                        loading ? 'text-gray-300' : 'text-[#4a4a4a]'
                      }`}
                    >
                      {loading ? '' : summaryHeadline.line3}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4 text-[13px] font-bold text-red-600">
                    {error}
                  </div>
                )}

                <>
                  {/* 1 */}
                  <div>
                    <h4 className="mb-4 flex items-center gap-2 text-[16px] font-black text-[#1a1a1a]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      {portfolioFocus?.title ?? '포트폴리오 강조 포인트'}
                    </h4>

                    <div className="rounded-2xl border border-gray-100 bg-[#f8f9fa] p-6 sm:p-7">
                      <p
                        className={`w-full text-[14px] leading-relaxed font-medium ${
                          loading ? 'text-gray-300' : 'text-[#4a4a4a]'
                        }`}
                      >
                        {loading ? '분석 중' : (portfolioFocus?.text ?? '...')}
                      </p>
                    </div>
                  </div>

                  {/* 2 */}
                  <div>
                    <h4 className="mb-4 flex items-center gap-2 text-[16px] font-black text-[#1a1a1a]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        <KeyRound className="h-4 w-4" />
                      </span>
                      {writingCheats?.title ?? '지원서 작성 치트키'}
                    </h4>

                    <div className="flex flex-wrap gap-2.5">
                      {(loading ? ['분석 중'] : (writingCheats?.tags ?? ['#...'])).map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-xl border-2 border-gray-100 bg-white px-3 py-2 text-[13px] font-bold shadow-sm ${
                            loading ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3 */}
                  <div>
                    <h4 className="mb-4 flex items-center gap-2 text-[16px] font-black text-[#1a1a1a]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <Puzzle className="h-4 w-4" />
                      </span>
                      {strategyGuide?.title ?? '합격 전략 가이드'}
                    </h4>

                    <div className="rounded-2xl border border-gray-100 bg-[#f8f9fa] p-6 sm:p-7">
                      <p
                        className={`w-full text-[14px] leading-relaxed font-medium ${
                          loading ? 'text-gray-300' : 'text-[#4a4a4a]'
                        }`}
                      >
                        {loading ? '분석 중' : (strategyGuide?.text ?? '...')}
                      </p>
                    </div>
                  </div>
                </>
              </div>
            </div>

            <div className="border-t border-gray-100 px-7 py-5 sm:px-10 sm:py-6">
              <button
                onClick={onClose}
                style={{ backgroundColor: PALETTE.midnightInk }}
                className="w-full cursor-pointer rounded-2xl py-4 text-[15px] font-black text-white shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.995]"
              >
                전략 확인 완료
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** ---------------- Main Page ---------------- **/

type SortBy = 'matchScore' | 'openingsCount';

export default function RecommendCompanyPage() {
  const [sortBy, setSortBy] = useState<SortBy>('matchScore');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [reasonTarget, setReasonTarget] = useState<Company | null>(null);
  const [searchParams] = useSearchParams();
  const [apiCompanies, setApiCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [explanationCache, setExplanationCache] = useState<
    Record<number, { headline: Headline; sections: Section[] }>
  >({});
  const [explanationLoadingId, setExplanationLoadingId] = useState<number | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [openingsCountMap, setOpeningsCountMap] = useState<Record<number, number>>({});

  // ✅ 8개(4*2) 페이지네이션
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  const portfolioIdParam = searchParams.get('portfolioId');
  const portfolioId = portfolioIdParam ? Number(portfolioIdParam) : null;

  const mapExplanationSections = (sections: ExplanationMatchSection[] = []): Section[] =>
    sections.map((section) => {
      if (section.key === 'writingCheats') {
        return {
          key: 'writingCheats',
          title: '지원서 작성 치트키',
          tags: section.tags ?? [],
        };
      }
      if (section.key === 'portfolioFocus') {
        return {
          key: 'portfolioFocus',
          title: '포트폴리오 강조 포인트',
          text: section.text ?? '',
        };
      }
      if (section.key === 'strategyGuide') {
        return {
          key: 'strategyGuide',
          title: '합격 전략 가이드',
          text: section.text ?? '',
        };
      }
      if (section.tags && section.tags.length > 0) {
        return {
          key: 'writingCheats',
          title: '지원서 작성 치트키',
          tags: section.tags,
        };
      }
      return {
        key: 'strategyGuide',
        title: '합격 전략 가이드',
        text: section.text ?? '',
      };
    });

  // TODO: 실제 API로 교체 시, companies를 fetch로 받아서 setCompanies 하면 됨
  useEffect(() => {
    if (!portfolioId || Number.isNaN(portfolioId)) {
      setApiCompanies([]);
      setIsLoading(false);
      setLoadError('포트폴리오 정보가 없습니다. 이전 단계에서 다시 접근해 주세요.');
      return;
    }

    let ignore = false;
    const run = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await fetchPortfolioRecommendedCompanies(portfolioId);
        if (ignore) return;

        const mapped = data.map((item: CompanyRecommendationResponse, idx) => {
          const simByFactor: Record<Factor, number> = {
            프로젝트: item.projectSimilarity,
            도메인: item.domainSimilarity,
            문제: item.problemSimilarity,
            해결: item.solutionSimilarity,
            기술스택: item.techSimilarity,
          };

          const weights = similaritiesToWeights(simByFactor);
          const topFactors = pickTopFactors(weights, 2);
          const matchScore = toScore(item.similarity ?? 0);

          return {
            id: idx + 1,
            companyId: item.companyId,
            portfolioProjectId: item.portfolioProjectId,
            companyProjectId: item.companyProjectId,
            name: item.companyName,
            portfolioContent: item.portfolioContent ?? '',
            companyContent: item.companyContent ?? '',
            matchScore,
            openingsCount: 0,
            weights,
            topFactors,
          };
        });

        setApiCompanies(mapped);
      } catch (err) {
        if (!ignore) {
          console.error('추천 기업 조회 실패:', err);
          setApiCompanies([]);
          setLoadError('추천 기업 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, [portfolioId]);

  const companies = apiCompanies;

  const companiesWithCounts = useMemo(
    () =>
      companies.map((company) => ({
        ...company,
        openingsCount: openingsCountMap[company.companyId] ?? company.openingsCount ?? 0,
      })),
    [companies, openingsCountMap],
  );

  useEffect(() => {
    if (companies.length === 0) return;
    const uniqueIds = Array.from(new Set(companies.map((c) => c.companyId)));
    const missing = uniqueIds.filter((id) => openingsCountMap[id] === undefined);
    if (missing.length === 0) return;

    let cancelled = false;
    const run = async () => {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await fetchJobPostingsByCompany(String(id));
            const count = Array.isArray(res.data) ? res.data.length : 0;
            return [id, count] as const;
          } catch (err) {
            console.error('실패:', err);
            return [id, 0] as const;
          }
        }),
      );

      if (cancelled) return;
      setOpeningsCountMap((prev) => {
        const next = { ...prev };
        results.forEach(([id, count]) => {
          next[id] = count;
        });
        return next;
      });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [companies, openingsCountMap]);

  const handleOpenReason = async (company: Company) => {
    setReasonTarget(company);
    setExplanationError(null);

    if (!company.portfolioProjectId || !company.companyProjectId) {
      setExplanationError('Missing analysis ids for explanation.');
      return;
    }

    const cached = explanationCache[company.companyId];
    if (cached) {
      setReasonTarget((prev) =>
        prev && prev.companyId === company.companyId ? { ...prev, ...cached } : prev,
      );
      return;
    }

    try {
      setExplanationLoadingId(company.companyId);
      const response = await fetchCompanyMatchExplanation({
        companyId: company.companyId,
        portfolioProjectId: company.portfolioProjectId,
        companyProjectId: company.companyProjectId,
      });

      if (!response.success || !response.payload) {
        throw new Error(response.error || 'Failed to load explanation.');
      }

      const mapped = {
        headline: response.payload.headline,
        sections: mapExplanationSections(response.payload.sections ?? []),
      };

      setExplanationCache((prev) => ({ ...prev, [company.companyId]: mapped }));
      setReasonTarget((prev) =>
        prev && prev.companyId === company.companyId ? { ...prev, ...mapped } : prev,
      );
    } catch (err) {
      setExplanationError(err instanceof Error ? err.message : 'Failed to load explanation.');
    } finally {
      setExplanationLoadingId(null);
    }
  };

  const sortedCompanies = useMemo(() => {
    return [...companiesWithCounts].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [companiesWithCounts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedCompanies.length / PAGE_SIZE));

  const pagedCompanies = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedCompanies.slice(start, start + PAGE_SIZE);
  }, [sortedCompanies, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [sortBy]);

  const isScore = sortBy === 'matchScore';
  const isOpenings = sortBy === 'openingsCount';

  useEffect(() => {
    if (!sortedCompanies.length) return;
    if (selectedCompanyId === null) {
      setSelectedCompanyId(sortedCompanies[0].companyId);
      return;
    }
    const exists = sortedCompanies.some((company) => company.companyId === selectedCompanyId);
    if (!exists) setSelectedCompanyId(sortedCompanies[0].companyId);
  }, [sortedCompanies, selectedCompanyId]);

  const sortBtnBase =
    'rounded-full px-4 py-2 text-[13px] font-black transition-all duration-200 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2';

  const sortBtnOn = 'bg-[#1a1a1a] text-white shadow-sm';
  const sortBtnOff = 'bg-[#f0eee9]/70 text-[#4a4a4a] hover:bg-[#f0eee9]';

  const pagerBtn =
    'h-10 w-10 rounded-xl border border-gray-200 bg-white text-[13px] font-black text-gray-600 ' +
    'shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0';

  return (
    <div style={{ backgroundColor: PALETTE.pureWhite }} className="min-h-screen pt-32 pb-24">
      <div className="mx-auto w-full max-w-[1280px] px-8 md:px-10 lg:px-12">
        <header className="mb-6 border-l-[6px] border-[#5151E7] pl-6">
          <h1 className="text-4xl font-black tracking-tight text-[#1a1a1a] md:text-5xl">
            추천 기업 리스트
          </h1>
          <p className="mt-3 text-[16px] font-semibold text-[#a3a3a3] italic md:text-[17px]">
            포트폴리오 기준으로 유사도가 높은 기업을 추천합니다.
          </p>
        </header>

        {/* ✅ 평가 기준: 모달 밖에서 1번만 */}
        <EvaluationCriteria />

        {isLoading && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-6 py-4 text-[13px] font-bold text-gray-500">
            추천 기업 데이터를 분석 중입니다···
          </div>
        )}

        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/70 px-6 py-4 text-[13px] font-bold text-red-600">
            {loadError}
          </div>
        )}

        <div className="mb-10 flex items-center justify-between gap-4 pl-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-[#f0eee9]/70 px-4 py-2">
              <Building2 className="h-4 w-4 text-[#4a4a4a]" />
              <span className="text-[13px] font-black text-[#4a4a4a]">
                {sortedCompanies.length} companies
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSortBy('matchScore')}
                className={`${sortBtnBase} ${isScore ? sortBtnOn : sortBtnOff}`}
              >
                점수순
              </button>
              <button
                type="button"
                onClick={() => setSortBy('openingsCount')}
                className={`${sortBtnBase} ${isOpenings ? sortBtnOn : sortBtnOff}`}
              >
                공고 많은 순
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={pagerBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="prev"
            >
              ‹
            </button>

            <div className="min-w-[84px] text-center text-[12px] font-bold text-gray-500">
              {page} / {totalPages}
            </div>

            <button
              type="button"
              className={pagerBtn}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="next"
            >
              ›
            </button>
          </div>
        </div>

        {/* ✅ 4열 고정: 작은 화면에서도 4열 유지 (넘치면 가로 스크롤) */}
        {/* <div className="overflow-x-auto">
          <div className="min-w-[1200px]"> */}
        <div className="grid grid-cols-4 gap-7">
          {pagedCompanies.map((c) => (
            <CompanyCard key={c.id} company={c} onOpenReason={handleOpenReason} />
          ))}
        </div>
      </div>
      {/* </div>
      </div> */}

      <ReasonModal
        open={!!reasonTarget}
        company={reasonTarget}
        loading={!!reasonTarget && explanationLoadingId === reasonTarget.companyId}
        error={explanationError}
        onClose={() => {
          setReasonTarget(null);
          setExplanationError(null);
        }}
      />
    </div>
  );
}
