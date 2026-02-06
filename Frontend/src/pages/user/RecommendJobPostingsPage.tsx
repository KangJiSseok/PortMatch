import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Info, FileText, ChevronDown, Briefcase, X } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { BaseTickContentProps, TickItem } from 'recharts/types/util/types';
import { useRecommendJobPostings } from '@/hooks/useRecommendJobPostings';
import type {
  JobPostingCardModel,
  JobPostingFactor,
  JobPostingWeights,
} from '@/types/recommendJobPosting';

/** ---------------- Palette ---------------- */

const PALETTE = {
  pureWhite: '#fcfcfc',
  midnightInk: '#1a1a1a',
  cloudDancer: '#f0eee9',
  slateGray: '#4a4a4a',
  softPebble: '#d6d2c4',
  silverMist: '#a3a3a3',
};

/** ---------------- Factor ---------------- */

const FACTOR_ORDER: JobPostingFactor[] = ['도메인', '기술스택', '문제 정의', '아키텍처'];
const FACTOR_LABEL: Record<JobPostingFactor, string> = {
  도메인: '도메인',
  기술스택: '기술스택',
  '문제 정의': '문제 정의',
  아키텍처: '아키텍처',
};

const FACTOR_COLOR: Record<JobPostingFactor, string> = {
  도메인: '#60A5FA',
  기술스택: '#FB923C',
  '문제 정의': '#4ADE80',
  아키텍처: '#C084FC',
};

/** ---------------- Criteria ---------------- */

function EvaluationCriteria() {
  const [open, setOpen] = useState(false);

  const CRITERIA_DATA = [
    {
      id: '도메인',
      desc: '프로젝트가 어떤 산업·서비스 영역에서 진행되었는지, 환경적 유사성을 평가합니다.',
      color: FACTOR_COLOR.도메인,
    },
    {
      id: '기술스택',
      desc: '단순 사용 여부보다 기술이 활용된 맥락과 숙련도의 연관성을 고려합니다.',
      color: FACTOR_COLOR.기술스택,
    },
    {
      id: '문제 정의',
      desc: '프로젝트에서 해결하려 했던 과제의 본질(성능, 효율 등)에 집중합니다.',
      color: FACTOR_COLOR['문제 정의'],
    },
    {
      id: '아키텍처',
      desc: '설계/구조/성능/분산 등 아키텍처 경험의 유사도를 평가합니다.',
      color: FACTOR_COLOR.아키텍처,
    },
  ];

  return (
    <div className="mb-6 pl-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
              <h4 className="text-[15px] font-black text-[#1a1a1a]">공고 추천 기준</h4>
              <p className="mt-0.5 text-[12px] font-medium text-gray-500">
                추천 알고리즘이 비교하는 4가지 기준
              </p>
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="border-t border-gray-100 bg-[#fcfcfc] px-5 py-4">
            <p className="mb-4 max-w-[200ch] text-[13px] leading-relaxed break-keep text-[#4a4a4a]">
              이 리포트는 분석한 포트폴리오와 채용 공고를 대조하여,
              <br />
              <span className="border-b-2 border-[#d6d2c4] font-bold text-[#1a1a1a]">
                "해당 직무의 도메인에서 다루는 기술과 문제 정의, 그리고 아키텍처"
              </span>{' '}
              가 실무 요구사항과 얼마나 맞닿아 있는지를 종합적으로 산출합니다.
            </p>

            <div className="grid grid-cols-4 gap-2.5">
              {CRITERIA_DATA.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-lg border border-gray-100 bg-white p-3 shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all hover:shadow-md"
                >
                  <div
                    className="absolute top-0 left-0 h-0.5 w-full rounded-t-lg"
                    style={{ backgroundColor: item.color }}
                  />
                  <h5 className="mb-1 text-[13px] font-black text-[#1a1a1a]">{item.id}</h5>
                  <p className="text-[11px] leading-[1.5] break-keep font-medium text-gray-500">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------------- Modal scroll lock ---------------- */

function lockBodyScroll(lock: boolean) {
  const body = document.body;
  const html = document.documentElement;

  if (lock) {
    const y = window.scrollY || document.documentElement.scrollTop;
    body.dataset.scrollY = String(y);

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';
  } else {
    html.style.overflow = '';
    body.style.overflow = '';
    body.style.paddingRight = '';
    delete body.dataset.scrollY;
  }
}

/** ---------------- Radar Chart ---------------- */

type RadarDataPoint = { category: string; value: number };

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

function getExcerpt(text: string): string {
  if (!text) return '';
  const parts = text
    .split(/[\n.!?]/)
    .map((t) => t.trim())
    .filter(Boolean);
  return parts[0] ?? text.slice(0, 120);
}

function getStructuredValue(content: string, labels: string[], fallback: string): string {
  const parsed = parseStructuredContent(content);
  for (const label of labels) {
    if (parsed[label]) return parsed[label];
  }
  return fallback;
}

function JobPostingRadarChart({ weights, score }: { weights: JobPostingWeights; score: number }) {
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
        fontSize={11}
        fontWeight={700}
      >
        {label}
      </text>
    );
  };

  return (
    <div className="w-full job-radar">
      <style>
        {`
          .job-radar svg:focus { outline: none; }
          .job-radar svg:focus-visible { outline: none; }
          .job-radar *:focus { outline: none; }
          .job-radar *:focus-visible { outline: none; }
        `}
      </style>
      <div className="mb-2 flex items-center justify-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">match</span>
        <span className="text-[18px] font-black text-gray-900">{score}</span>
      </div>
      <div className="flex h-[200px] w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={data}
            outerRadius="70%"
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={{ outline: 'none' }}
          >
            <defs>
              <radialGradient id="jobRadarFillGradient" cx="50%" cy="50%" r="60%">
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
              fill="url(#jobRadarFillGradient)"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** ---------------- Detail Modal ---------------- */

function JobPostingComparisonTable({
  portfolioContent,
  jobPostingContent,
  weights,
}: {
  portfolioContent: string;
  jobPostingContent: string;
  weights: JobPostingWeights;
}) {
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
            <th className="px-6 py-4">공고 내용</th>
          </tr>
        </thead>
        <tbody className="text-[14px]">
          {FACTOR_ORDER.map((factor) => {
            const portfolioValue = getStructuredValue(
              portfolioContent,
              factor === '도메인'
                ? ['도메인', 'Domain']
                : factor === '기술스택'
                  ? ['기술', '기술스택', 'Tech']
                  : factor === '문제 정의'
                    ? ['문제', '문제 정의', 'Problem']
                    : ['아키텍처', 'Architecture'],
              getExcerpt(portfolioContent),
            );
            const jobPostingValue = getStructuredValue(
              jobPostingContent,
              factor === '도메인'
                ? ['도메인', 'Domain']
                : factor === '기술스택'
                  ? ['기술', '기술스택', 'Tech']
                  : factor === '문제 정의'
                    ? ['문제', '문제 정의', 'Problem']
                    : ['아키텍처', 'Architecture'],
              getExcerpt(jobPostingContent),
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
                  {jobPostingValue || '공고 요약 데이터가 없습니다.'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function JobPostingDetailModal({
  open,
  posting,
  onClose,
}: {
  open: boolean;
  posting: JobPostingCardModel | null;
  onClose: () => void;
}) {
  useEffect(() => {
    lockBodyScroll(open);
    return () => lockBodyScroll(false);
  }, [open]);

  return (
    <AnimatePresence>
      {open && posting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-[201] flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div
              className="relative px-6 py-6 text-white"
              style={{ backgroundColor: PALETTE.midnightInk }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.05em] text-blue-200">
                      JOB REPORT
                    </span>
                    <span className="text-[12px] font-medium text-white/40">|</span>
                    <span className="text-[12px] font-medium text-blue-200/80">
                      ID #{posting.jobPostingId}
                    </span>
                  </div>

                  <h4 className="text-[22px] leading-[1.25] font-bold tracking-tight">
                    {posting.companyName}
                    <span className="ml-2 text-[14px] font-normal text-white/50">Company</span>
                  </h4>
                  <p className="mt-2 text-[13px] font-medium text-blue-100">{posting.title}</p>
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

            <div className="soft-scrollbar flex-1 overflow-y-auto px-7 pt-4 pb-6">
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
              <div className="space-y-8">
                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-[16px] font-black text-[#1a1a1a]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    추천 공고 비교 결과
                  </h4>
                  <JobPostingComparisonTable
                    portfolioContent={posting.portfolioContent}
                    jobPostingContent={posting.jobPostingContent}
                    weights={posting.weights}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-white px-7 py-5">
              <button
                onClick={onClose}
                className="w-full cursor-pointer rounded-2xl py-4 text-[15px] font-black text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.995]"
                style={{ backgroundColor: PALETTE.midnightInk }}
              >
                확인 완료
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** ---------------- Card ---------------- */

function JobPostingCard({
  posting,
  onOpen,
  onViewDetail,
}: {
  posting: JobPostingCardModel;
  onOpen: (p: JobPostingCardModel) => void;
  onViewDetail: (p: JobPostingCardModel) => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rawTitle = posting.title ?? '';
  const isLongTitle = rawTitle.length > 20;
  const displayTitle = isLongTitle ? `${rawTitle.slice(0, 20)}...` : rawTitle;

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
      style={{ boxShadow: '6px 8px 18px rgba(0,0,0,0.06)' }}
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
              <div className="text-center">
                <h3 className="text-[16px] font-black text-[#1a1a1a]">{posting.companyName}</h3>
                <p
                  className="mt-1 line-clamp-2 text-[12px] font-semibold break-words text-gray-500"
                  title={isLongTitle ? rawTitle : undefined}
                >
                  {displayTitle}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-end pt-[8px]">
              <JobPostingRadarChart weights={posting.weights} score={posting.matchScore} />
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
              <h3 className="w-full truncate text-center text-[16px] font-black text-[#1a1a1a]">
                {posting.companyName} 분석 지표
              </h3>
            </div>

            <div className="flex flex-1 flex-col justify-center pt-4">
              <div className="space-y-3">
                {FACTOR_ORDER.map((f) => (
                  <div key={f} className="text-[12px]">
                    <div className="mb-1.5 flex justify-between">
                      <span className="font-semibold text-gray-500">{FACTOR_LABEL[f]}</span>
                      <span className="font-bold text-[#4a4a4a]">{posting.weights[f]}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isFlipped ? `${posting.weights[f]}%` : 0 }}
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

      <div className="mt-2 flex items-center justify-between border-t border-gray-100 px-5 py-4">
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={() => onViewDetail(posting)}
            className="relative w-full cursor-pointer overflow-hidden rounded-xl py-3 text-[13px] font-bold shadow-sm transition-all duration-200 outline-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.06)] after:transition-opacity after:duration-200 after:content-[''] hover:-translate-y-0.5 hover:after:opacity-100 focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:after:opacity-100 active:translate-y-0 active:scale-[0.99]"
            style={{
              backgroundColor: '#F8F8F6',
              color: PALETTE.slateGray,
              border: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            채용 공고
          </button>

          <button
            type="button"
            onClick={() => onOpen(posting)}
            className="relative w-full cursor-pointer overflow-hidden rounded-xl py-3 text-[13px] font-bold text-white shadow-md transition-all duration-200 outline-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.06)] after:transition-opacity after:duration-200 after:content-[''] hover:-translate-y-0.5 hover:after:opacity-100 focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:after:opacity-100 active:translate-y-0 active:scale-[0.99]"
            style={{ backgroundColor: '#5563C1' }}
          >
            상세 분석 결과
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/** ---------------- Page ---------------- */

const PAGE_SIZE = 8;

export default function RecommendJobPostingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL 파라미터에서 값 읽기 (뒤로가기 시 자동 반영)
  const portfolioIdParam = searchParams.get('portfolioId');
  const portfolioId =
    portfolioIdParam && Number.isFinite(Number(portfolioIdParam)) ? Number(portfolioIdParam) : null;

  // limit과 page를 URL 파라미터에서 직접 파생 (뒤로가기 시 자동 반영)
  const urlLimitParam = searchParams.get('limit');
  const urlPageParam = searchParams.get('page');
  const limit = (() => {
    const parsed = Number(urlLimitParam);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 10;
  })();
  const page = (() => {
    const parsed = Number(urlPageParam);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
  })();

  const prevCardsLengthRef = useRef(0);
  const [detailTarget, setDetailTarget] = useState<JobPostingCardModel | null>(null);

  // URL 파라미터 업데이트 함수
  const updateUrlParams = useCallback((newLimit: number, newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', String(newLimit));
    params.set('page', String(newPage));
    navigate({ search: `?${params.toString()}` }, { replace: false });
  }, [navigate, searchParams]);

  const { cards, isLoading, isFetching, error } = useRecommendJobPostings(portfolioId, limit);

  const displayCards = cards;

  // cards 길이가 변경되면 페이지를 1로 리셋
  useEffect(() => {
    if (cards.length !== prevCardsLengthRef.current) {
      const hadCards = prevCardsLengthRef.current !== 0;
      prevCardsLengthRef.current = cards.length;
      if (hadCards && page !== 1) {
        updateUrlParams(limit, 1);
      }
    }
  }, [cards.length, page, limit, updateUrlParams]);

  const totalPages = Math.max(1, Math.ceil(displayCards.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedCards = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return displayCards.slice(start, start + PAGE_SIZE);
  }, [displayCards, safePage]);

  const pagerBtn =
    'h-10 w-10 rounded-xl border border-gray-200 bg-white text-[13px] font-black text-gray-600 ' +
    'shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0';

  return (
    <div
      style={{ backgroundColor: PALETTE.pureWhite }}
      className="min-h-screen pt-32 pb-24 overflow-x-auto"
    >
      <div className="mx-auto w-full max-w-[1280px] min-w-[1280px] px-8">
        <header className="mb-6 border-l-[6px] border-[#5151E7] pl-6">
          <h1 className="text-4xl font-black tracking-tight text-[#1a1a1a]">
            추천 공고 리스트
          </h1>
          <p className="mt-3 text-[16px] font-semibold text-[#a3a3a3] italic">
            포트폴리오를 기준으로 유사도가 높은 공고를 추천합니다.
          </p>
        </header>

        <EvaluationCriteria />

        <div className="mb-6 pl-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <div>
              <h4 className="text-[14px] font-black text-[#1a1a1a]">추천 공고 개수</h4>
              <p className="mt-1 text-[12px] font-medium text-gray-500">
                요청할 추천 공고 수를 지정하세요.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (!Number.isFinite(next)) return;
                  const clamped = Math.min(50, Math.max(1, Math.floor(next)));
                  updateUrlParams(clamped, page);
                }}
                className="h-10 w-20 rounded-xl border border-gray-200 bg-white px-3 text-right text-[13px] font-black text-gray-700 outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/10"
              />
              <span className="text-[12px] font-bold text-gray-500">개</span>
            </div>
          </div>
        </div>

        {/* <div className="mb-8 pl-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full bg-[#f0eee9]/70 px-4 py-2">
                <Briefcase className="h-4 w-4 text-[#4a4a4a]" />
                <span className="text-[13px] font-black text-[#4a4a4a]">
                  portfolioId: {portfolioIdParam || 'missing'}
                </span>
              </span>
              {response?.matches?.length ? (
                <span className="text-[12px] font-semibold text-gray-500">
                  {response.matches.length} matches
                </span>
              ) : null}
            </div>
          </div>
        </div> */}

        {portfolioId === null && (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/70 px-6 py-4 text-[13px] font-bold text-amber-700">
            포트폴리오 Id가 없습니다. 다시 시도해주세요
          </div>
        )}

        {isLoading && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-6 py-4 text-[13px] font-bold text-gray-500">
            추천 공고를 분석 중입니다...
          </div>
        )}

        {!isLoading && error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/70 px-6 py-4 text-[13px] font-bold text-red-600">
            {error.message || 'Failed to load recommendations.'}
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-6 py-4 text-[13px] font-bold text-gray-500">
            Refreshing results...
          </div>
        )}

        <div className="mb-10 flex items-center justify-between gap-4 pl-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-[#f0eee9]/70 px-4 py-2">
              <Briefcase className="h-4 w-4 text-[#4a4a4a]" />
              <span className="text-[13px] font-black text-[#4a4a4a]">
                {displayCards.length} postings
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={pagerBtn}
              onClick={() => updateUrlParams(limit, Math.max(1, safePage - 1))}
              aria-label="prev"
            >
              ‹
            </button>

            <div className="min-w-[84px] text-center text-[12px] font-bold text-gray-500">
              {safePage} / {totalPages}
            </div>

            <button
              type="button"
              className={pagerBtn}
              onClick={() => updateUrlParams(limit, Math.min(totalPages, safePage + 1))}
              aria-label="next"
            >
              ›
            </button>
          </div>
        </div>

        {pagedCards.length === 0 && !isLoading && !error ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-bold text-gray-500">추천 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-7">
            {pagedCards.map((p) => (
              <JobPostingCard
                key={p.jobPostingId}
                posting={p}
                onOpen={setDetailTarget}
                onViewDetail={(target) => navigate(`/job-posts/${target.jobPostingId}`)}
              />
            ))}
          </div>
        )}
      </div>

      <JobPostingDetailModal
        open={!!detailTarget}
        posting={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  );
}
