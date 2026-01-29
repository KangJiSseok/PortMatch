import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, KeyRound, Puzzle, X, Info } from 'lucide-react';
import { fetchPortfolioRecommendedCompanies } from '@/api/recommendCompany';
import type { CompanyRecommendationResponse } from '@/types/recommendCompany';

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
  name: string;
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
  프로젝트: '#60A5FA',
  도메인: '#F43F5E',
  문제: '#FB923C',
  해결: '#4ADE80',
  기술스택: '#C084FC',
};

// ✅ 채도 낮춘 포인트 블루
const POINT_BLUE = '#5563C1';

/** ---------------- distance(0~1) -> weights(%) ---------------- **/

function distancesToWeights(dist: Record<Factor, number>): Record<Factor, number> {
  // distance 작을수록 좋음 → strength는 1-distance
  const strengths: Record<Factor, number> = {
    프로젝트: 1 - dist.프로젝트,
    도메인: 1 - dist.도메인,
    문제: 1 - dist.문제,
    해결: 1 - dist.해결,
    기술스택: 1 - dist.기술스택,
  };

  const sum = FACTOR_ORDER.reduce((acc, k) => acc + Math.max(0, strengths[k]), 0);

  // 방어: sum이 0이면 균등 분배
  if (sum <= 0) {
    const even = Math.floor(100 / FACTOR_ORDER.length);
    const base: Record<Factor, number> = {
      프로젝트: even,
      도메인: even,
      문제: even,
      해결: even,
      기술스택: even,
    };
    const remain = 100 - even * FACTOR_ORDER.length;
    if (remain > 0) base[FACTOR_ORDER[0]] += remain;
    return base;
  }

  const raw = FACTOR_ORDER.map((k) => ({ k, v: (strengths[k] / sum) * 100 }));

  const rounded: Record<Factor, number> = {
    프로젝트: 0,
    도메인: 0,
    문제: 0,
    해결: 0,
    기술스택: 0,
  };

  raw.forEach(({ k, v }) => {
    rounded[k] = Math.round(v);
  });

  const total = FACTOR_ORDER.reduce((acc, k) => acc + rounded[k], 0);
  const diff = 100 - total;

  if (diff !== 0) {
    const maxKey = raw.sort((a, b) => b.v - a.v)[0]?.k ?? FACTOR_ORDER[0];
    rounded[maxKey] = Math.max(0, rounded[maxKey] + diff);
  }

  return rounded;
}

function pickTopFactors(weights: Record<Factor, number>, n = 2): Factor[] {
  return [...FACTOR_ORDER].sort((a, b) => weights[b] - weights[a]).slice(0, n);
}

/** ---------------- DonutChart (CI-safe) ---------------- **/

function DonutChart({ weights, score }: { weights: Record<Factor, number>; score: number }) {
  const size = 120;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  type Segment = { key: Factor; angle: number; start: number; end: number };

  const segments: Segment[] = FACTOR_ORDER.reduce(
    (state, k) => {
      const value = weights[k] ?? 0;
      const angle = (value / 100) * 360;

      const start = state.acc;
      const end = start + angle;

      if (angle < 1) return { acc: end, segs: state.segs };

      return {
        acc: end,
        segs: [...state.segs, { key: k, angle, start, end }],
      };
    },
    { acc: 0, segs: [] as Segment[] },
  ).segs;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f1f1" strokeWidth={stroke} />

        {segments.map(({ key, angle, start, end }) => {
          const startRad = ((start - 90) * Math.PI) / 180;
          const endRad = ((end - 90) * Math.PI) / 180;

          return (
            <path
              key={key}
              d={`M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 ${
                angle > 180 ? 1 : 0
              } 1 ${cx + r * Math.cos(endRad)} ${cy + r * Math.sin(endRad)}`}
              fill="none"
              stroke={FACTOR_COLOR[key]}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div className="absolute flex flex-col items-center">
        <span className="text-[30px] leading-none font-black text-gray-900">{score}</span>
        <span className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          match
        </span>
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
        'relative flex h-[460px] w-full flex-col overflow-hidden rounded-2xl',
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
        className="relative flex-1 cursor-pointer [perspective:1000px]"
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

            <div className="flex flex-1 flex-col items-center justify-center">
              <DonutChart weights={company.weights} score={company.matchScore} />

              <div className="mt-9 flex flex-wrap justify-center gap-2">
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
                    #{f}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute top-4 right-4 text-gray-300 opacity-20">
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
                      <span className="font-semibold text-gray-500">{f}</span>
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

      <div className="space-y-2 px-5 pt-1 pb-5">
        <button
          onClick={goToPostings}
          className={`${BTN_BASE} ${BTN_INSET} py-3.5 text-[14px] shadow-sm hover:shadow-md`}
          style={{
            backgroundColor: 'rgba(240,238,233,0.55)',
            color: PALETTE.slateGray,
            border: '1px solid rgba(0,0,0,0.055)',
          }}
        >
          모집중인 공고 {company.openingsCount}개 보기
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenReason(company);
          }}
          className={`${BTN_BASE} ${BTN_INSET} py-3.5 text-[14px] text-white shadow-sm hover:shadow-md`}
          style={{ backgroundColor: POINT_BLUE }}
        >
          합격 전략 리포트
        </button>
      </div>
    </motion.div>
  );
}

/** ---------------- Criteria (모달 밖에서 1번만) ---------------- **/

import { ChevronDown } from 'lucide-react';

function EvaluationCriteria() {
  const [open, setOpen] = useState(false);

  // ✅ 요청하신 세련된 컬러 팔레트와 매칭
  const FACTOR_COLORS = {
    프로젝트: '#60A5FA',
    도메인: '#F43F5E',
    문제: '#FB923C',
    해결: '#4ADE80',
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
    { id: '문제', desc: '프로젝트에서 해결하려 했던 과제의 본질(성능, 효율 등)에 집중합니다.' },
    { id: '해결', desc: '문제를 풀기 위해 선택한 접근 방식과 사고 구조가 논리적인지 평가합니다.' },
    {
      id: '기술스택',
      desc: '단순 사용 여부보다 기술이 활용된 맥락과 숙련도의 연관성을 고려합니다.',
    },
  ];

  return (
    <div className="mb-10 pl-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Header (Toggle) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eee9] text-[#4a4a4a]">
              <Info className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-[17px] font-black text-[#1a1a1a]">기업 평가 지표</h4>
              <p className="mt-0.5 text-[13px] font-medium text-gray-500">
                AI가 당신의 포트폴리오를 분석하는 5가지 핵심 관점
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Body */}
        {open && (
          <div className="border-t border-gray-100 bg-[#fcfcfc] px-6 py-8">
            {/* Intro */}
            <p className="mb-8 max-w-[80ch] text-[15px] leading-relaxed text-[#4a4a4a]">
              이 리포트는 기업이 실제로 수행하는 프로젝트 내용을 기준으로,
              <br />
              <span className="border-b-2 border-[#d6d2c4] font-bold text-[#1a1a1a]">
                “어떤 맥락에서 어떤 문제를 어떻게 해결해왔는지”
              </span>
              가 얼마나 유사한지를 종합적으로 평가합니다.
            </p>

            {/* Criteria Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CRITERIA_DATA.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md"
                >
                  {/* 컬러 포인트 라인 (상단) */}
                  <div
                    className="absolute top-0 left-0 h-1 w-full rounded-t-xl"
                    style={{
                      backgroundColor: FACTOR_COLORS[item.id as keyof typeof FACTOR_COLORS],
                    }}
                  />
                  <h5 className="mb-2 text-[14px] font-black text-[#1a1a1a]">{item.id}</h5>
                  <p className="text-[12px] leading-[1.6] font-medium text-gray-500">{item.desc}</p>
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

function lockBodyScroll(lock: boolean) {
  const body = document.body;

  if (lock) {
    const y = window.scrollY || document.documentElement.scrollTop;
    body.dataset.scrollY = String(y);
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  } else {
    const y = Number(body.dataset.scrollY || '0');
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
}: {
  open: boolean;
  company: Company | null;
  onClose: () => void;
}) {
  useEffect(() => {
    lockBodyScroll(open);
    return () => lockBodyScroll(false);
  }, [open]);

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
  const headline: Headline = company.headline ?? {
    line1: `${company.name} 기준, 당신의`,
    highlight: '#문제해결',
    line2: '역량이',
    line3: '가장 강점으로 평가됐습니다.',
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
            animate={{ y: 0, opacity: 1, scale: 0.8 }}
            exit={{ y: 28, opacity: 0, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative z-[201] flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
          >
            <div
              style={{ backgroundColor: PALETTE.midnightInk }}
              className="relative px-7 py-7 text-white sm:px-10 sm:py-9"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black tracking-widest text-blue-300 uppercase">
                  AI INSIGHT REPORT
                </span>
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* ✅ 백엔드 headline 기반 3줄 */}
              <h3 className="text-[22px] leading-[1.15] font-black tracking-tight sm:text-[26px]">
                {headline.line1}
                <br />
                <span className="text-blue-400">
                  {headline.highlight} {headline.line2}
                </span>
                <br />
                {headline.line3}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-8 sm:px-10 sm:py-10">
              <div className="space-y-12">
                {/* 1 */}
                <div>
                  <h4 className="mb-4 flex items-center gap-3 text-[18px] font-black text-[#1a1a1a]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    {portfolioFocus?.title ?? '포트폴리오 강조 포인트'}
                  </h4>

                  <div className="rounded-2xl border border-gray-100 bg-[#f8f9fa] p-6 sm:p-7">
                    <p className="max-w-[62ch] text-[16px] leading-relaxed font-medium text-[#4a4a4a] sm:text-[17px]">
                      {portfolioFocus?.text ?? '...'}
                    </p>
                  </div>
                </div>

                {/* 2 */}
                <div>
                  <h4 className="mb-4 flex items-center gap-3 text-[18px] font-black text-[#1a1a1a]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    {writingCheats?.title ?? '지원서 작성 치트키'}
                  </h4>

                  <div className="flex flex-wrap gap-2.5">
                    {(writingCheats?.tags ?? ['#...']).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-xl border-2 border-gray-100 bg-white px-4 py-2 text-[14px] font-bold text-gray-600 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3 */}
                <div>
                  <h4 className="mb-4 flex items-center gap-3 text-[18px] font-black text-[#1a1a1a]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <Puzzle className="h-5 w-5" />
                    </span>
                    {strategyGuide?.title ?? '합격 전략 가이드'}
                  </h4>

                  <div className="rounded-2xl border-2 border-dashed border-[#d6d2c4] bg-[#fcfcfc] p-6 sm:p-7">
                    <p className="max-w-[62ch] text-[16px] leading-loose font-medium text-[#4a4a4a] sm:text-[17px]">
                      {strategyGuide?.text ?? '...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-7 py-6 sm:px-10 sm:py-7">
              <button
                onClick={onClose}
                style={{ backgroundColor: PALETTE.midnightInk }}
                className="w-full cursor-pointer rounded-2xl py-5 text-[16px] font-black text-white shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.995]"
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
  const [reasonTarget, setReasonTarget] = useState<Company | null>(null);
  const [searchParams] = useSearchParams();
  const [apiCompanies, setApiCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ✅ 8개(4*2) 페이지네이션
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  const portfolioIdParam = searchParams.get('portfolioId');
  const portfolioId = portfolioIdParam ? Number(portfolioIdParam) : null;

  // TODO: 실제 API로 교체 시, companies를 fetch로 받아서 setCompanies 하면 됨
  useEffect(() => {
    if (!portfolioId || Number.isNaN(portfolioId)) {
      setApiCompanies([]);
      setIsLoading(false);
      setLoadError('?ы듃?대━??ID媛 ?꾩슂?⑸땲??. ?ы듃?대━??遺꾩꽍 ?섏씠吏?먯꽌 ?대룞?댁＜?몄슂.');
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
          const distByFactor: Record<Factor, number> = {
            [FACTOR_ORDER[0]]: item.projectDistance,
            [FACTOR_ORDER[1]]: item.domainDistance,
            [FACTOR_ORDER[2]]: item.problemDistance,
            [FACTOR_ORDER[3]]: item.solutionDistance,
            [FACTOR_ORDER[4]]: item.techDistance,
          };

          const weights = distancesToWeights(distByFactor);
          const topFactors = pickTopFactors(weights, 2);

          return {
            id: idx + 1,
            companyId: item.companyId,
            name: item.companyName,
            matchScore: Math.round((item.similarity ?? 0) * 100),
            openingsCount: 0,
            weights,
            topFactors,
          };
        });

        setApiCompanies(mapped);
      } catch (err) {
        if (!ignore) {
          setApiCompanies([]);
          setLoadError('異붿쿇 湲곗뾽??遺덈윭?ㅼ? 紐삵뻽?듬땲??.');
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

  const hasValidPortfolioId = Boolean(portfolioId) && !Number.isNaN(portfolioId);
  const useMockFallback = hasValidPortfolioId && Boolean(loadError) && import.meta.env.DEV;
  const companies = useMockFallback ? MOCK_COMPANIES : apiCompanies;

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [companies, sortBy]);

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
            AI 추천 리스트
          </h1>
          <p className="mt-3 text-[16px] font-semibold text-[#a3a3a3] italic md:text-[17px]">
            데이터 매칭 알고리즘이 분석한 최적의 합격 전략입니다.
          </p>
        </header>

        {/* ✅ 평가 기준: 모달 밖에서 1번만 */}
        <EvaluationCriteria />

        {isLoading && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-6 py-4 text-[13px] font-bold text-gray-500">
            異붿쿇 湲곗뾽??遺덈윭?ㅼ? 吏꾪뻾 以묒엯?덈떎...
          </div>
        )}

        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/70 px-6 py-4 text-[13px] font-bold text-red-600">
            {loadError}
          </div>
        )}

        <div className="mb-10 flex items-center justify-between gap-4 pl-6">
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
            <CompanyCard key={c.id} company={c} onOpenReason={setReasonTarget} />
          ))}
        </div>
      </div>
      {/* </div>
      </div> */}

      <ReasonModal
        open={!!reasonTarget}
        company={reasonTarget}
        onClose={() => setReasonTarget(null)}
      />
    </div>
  );
}

/** ---------------- Mock (API 응답 -> Company 매핑 예시) ---------------- **/

type ApiCompanyRec = {
  companyId: number;
  companyName: string;
  similarity: number; // 0~1
  openingsCount?: number;

  projectDistance: number;
  domainDistance: number;
  problemDistance: number;
  solutionDistance: number;
  techDistance: number;

  headline?: Headline;
  sections?: Section[];
};

const MOCK_API: ApiCompanyRec[] = Array.from({ length: 15 }).map((_, i) => ({
  companyId: 1000 + i + 1,
  companyName: ['삼성전자', '네이버', '카카오', '토스', '쿠팡', '라인', '현대차', '배민'][i % 8],
  similarity: [0.92, 0.88, 0.85, 0.83, 0.81, 0.79, 0.77, 0.75][i % 8],
  openingsCount: [2, 0, 5, 1, 3, 4, 2, 1][i % 8],

  projectDistance: [0.19, 0.23, 0.25, 0.28, 0.31, 0.33, 0.36, 0.38][i % 8],
  domainDistance: [0.16, 0.24, 0.27, 0.29, 0.33, 0.35, 0.37, 0.4][i % 8],
  problemDistance: [0.2, 0.23, 0.26, 0.27, 0.3, 0.33, 0.35, 0.39][i % 8],
  solutionDistance: [0.18, 0.22, 0.24, 0.26, 0.29, 0.32, 0.34, 0.37][i % 8],
  techDistance: [0.17, 0.2, 0.23, 0.25, 0.28, 0.31, 0.33, 0.36][i % 8],

  // ✅ 백엔드 주는 구조 흉내
  headline: {
    line1: `${['삼성전자', '네이버', '카카오', '토스', '쿠팡', '라인', '현대차', '배민'][i % 8]} 기준, 당신의`,
    highlight: ['#문제해결', '#도메인적합', '#기술깊이', '#문제정의'][i % 4],
    line2: '역량이',
    line3: '가장 강점으로 평가됐습니다.',
  },
  sections: [
    { key: 'portfolioFocus', title: '포트폴리오 강조 포인트', text: '... (백엔드 text)' },
    { key: 'writingCheats', title: '지원서 작성 치트키', tags: ['#도메인_맥락', '#수치기반_성과'] },
    { key: 'strategyGuide', title: '합격 전략 가이드', text: '... (백엔드 text)' },
  ],
}));

const MOCK_COMPANIES: Company[] = MOCK_API.map((a, idx) => {
  const distByFactor: Record<Factor, number> = {
    프로젝트: a.projectDistance,
    도메인: a.domainDistance,
    문제: a.problemDistance,
    해결: a.solutionDistance,
    기술스택: a.techDistance,
  };

  const weights = distancesToWeights(distByFactor);
  const topFactors = pickTopFactors(weights, 2);

  return {
    id: idx + 1,
    companyId: a.companyId,
    name: a.companyName,
    matchScore: Math.round((a.similarity ?? 0) * 100),
    openingsCount: a.openingsCount ?? 0,
    weights,
    topFactors,
    headline: a.headline,
    sections: a.sections,
  };
});
