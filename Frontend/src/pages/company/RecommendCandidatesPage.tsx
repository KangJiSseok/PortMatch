import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Info,
  FileText,
  ChevronDown,
  Users,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useRecommendCandidates } from '@/hooks/useRecommendCandidates';
import CompactRadarChart from '@/components/charts/CompactRadarChart';
import type {
  CandidateCardModel,
  CandidateFactor,
} from '@/types/recommendCandidate';

/** ---------------- Palette ---------------- */

const PALETTE = {
  pureWhite: '#fcfcfc',
  midnightInk: '#1a1a1a',
  cloudDancer: '#f0eee9',
  slateGray: '#4a4a4a',
  softPebble: '#d6d2c4',
  silverMist: '#a3a3a3',
};

const POINT_BLUE = '#5563C1';

/** ---------------- Factor ---------------- */

const FACTOR_ORDER: CandidateFactor[] = ['기술', '주제', '아키텍처', '맥락'];
const FACTOR_LABEL: Record<CandidateFactor, string> = {
  기술: '기술',
  주제: '주제',
  아키텍처: '아키텍처',
  맥락: '맥락',
};

const FACTOR_COLOR: Record<CandidateFactor, string> = {
  기술: '#64748B',
  주제: '#94A3B8',
  아키텍처: '#475569',
  맥락: POINT_BLUE,
};


/** ---------------- Small Utils ---------------- */

/**
 * unifiedText에서 [기술]/[역량]/[아키텍처 경험]/[프로젝트] 같은 섹션을 뽑아오는 간단 파서
 * (기업추천 페이지의 parseStructuredContent 느낌으로)
 */
function parseStructured(content: string): Record<string, string> {
  if (!content) return {};
  const result: Record<string, string> = {};

  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const m = line.match(/^\[([^\]]+)\]\s*(.+)$/);
    if (m) {
      result[m[1]] = m[2].trim();
    }
  }

  // fallback: 한 줄에 몰려있을 때
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

// function firstSentence(text: string): string {
//   if (!text) return '';
//   const parts = text
//     .split(/[\n.!?]/)
//     .map((t) => t.trim())
//     .filter(Boolean);
//   return parts[0] ?? text.slice(0, 120);
// }

/** ---------------- Criteria (모달 밖 1번) ---------------- */



function EvaluationCriteria() {
  const [open, setOpen] = useState(false);

  const CRITERIA_DATA = [
    {
      id: '기술',
      desc: '후보자의 기술스택 및 도구 사용 경험의 유사도를 평가합니다.',
      color: FACTOR_COLOR['기술'],
    },
    {
      id: '주제',
      desc: '프로젝트/경험에서 드러난 핵심 주제의 유사도를 평가합니다.',
      color: FACTOR_COLOR['주제'],
    },
    {
      id: '아키텍처',
      desc: '설계/구조/성능/분산 등 아키텍처 경험의 유사도를 평가합니다.',
      color: FACTOR_COLOR['아키텍처'],
    },
    {
      id: '맥락',
      desc: '전체 텍스트/역량/프로젝트 맥락 기반으로 점수를 산출합니다.',
      color: FACTOR_COLOR['맥락'],
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
              <h4 className="text-[15px] font-black text-[#1a1a1a]">후보자 평가 지표</h4>
              <p className="mt-0.5 text-[12px] font-medium text-gray-500">
                추천 알고리즘이 비교하는 4가지 핵심 관점
              </p>
            </div>
          </div>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="border-t border-gray-100 bg-[#fcfcfc] px-5 py-4">
            <p className="mb-4 max-w-[80ch] text-[13px] leading-relaxed text-[#4a4a4a]">
              이 리포트는 입력한 검색 문장(쿼리)을 기준으로, 후보자의 포트폴리오 내용을 비교해
              <br />
              <span className="border-b-2 border-[#d6d2c4] font-bold text-[#1a1a1a]">
                ?기술 ? 주제 ? 아키텍처 ? 맥락?
              </span>
              의 유사도를 계산합니다.
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
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
                  <p className="text-[11px] leading-[1.5] font-medium text-gray-500">
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

/** ---------------- Detail Modal ---------------- */


function CandidateDetailModal({
  open,
  candidate,
  onClose,
}: {
  open: boolean;
  candidate: CandidateCardModel | null;
  onClose: () => void;
}) {
  const detailRef = useRef<HTMLDivElement | null>(null);

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

  if (!candidate) return null;

  const parsed = parseStructured(candidate.unifiedText);
  const tech = parsed['기술'] || parsed['기술스택'] || candidate.summary.tech;
  const topic = parsed['역량'] || candidate.summary.keyword || '';
  const arch = parsed['아키텍처 경험'] || candidate.summary.architecture;
  const context = parsed['프로젝트'] || '';

  const top1 = candidate.topFactors?.[0] ?? '프로젝트';
  const top2 = candidate.topFactors?.[1] ?? '기술';

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
            className="relative z-[201] flex max-h-[94vh] w-full max-w-[980px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
          >
            {/* Header */}
            <div
              style={{ backgroundColor: PALETTE.midnightInk }}
              className="relative px-7 py-5 text-white sm:px-10 sm:py-6"
            >
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black tracking-widest text-blue-300 uppercase">
                CANDIDATE REPORT
              </span>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>

              <h4 className="mt-4 text-[20px] leading-[1.2] font-black tracking-tight sm:text-[22px]">
                후보자 #{candidate.userId} · 포트폴리오 #{candidate.portfolioId}
                <br />
                <span className="text-blue-400">
                  #{FACTOR_LABEL[top1]} / #{FACTOR_LABEL[top2]}
                </span>{' '}
                관점에서 강점이 두드러집니다.
              </h4>
            </div>

            {/* Body */}
            <div
              ref={detailRef}
              className="soft-scrollbar flex-1 overflow-y-auto px-7 py-6 text-[16px] sm:px-10 sm:py-8 sm:text-[17px]"
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

              <div className="space-y-6">
                {/* Score summary */}
                <div className="grid grid-cols-2 gap-3">
                  {FACTOR_ORDER.map((f) => (
                    <div
                      key={f}
                      className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                        {FACTOR_LABEL[f]}
                      </div>
                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-[20px] font-black text-gray-900">
                          {candidate.weights[f]}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500">?</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="rounded-2xl border border-gray-100 bg-[#f8f9fa] p-5 shadow-sm">
                  <h4 className="mb-3 flex items-center gap-2 text-[16px] font-black text-[#1a1a1a]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    요약 정보
                  </h4>

                  <div className="space-y-3 text-[13px]">
                    <div>
                      <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase">
                        기술 
                      </div>
                      <p className="mt-1 font-semibold text-gray-700">
                        {tech || '기술 요약이 없습니다.'}
                      </p>
                    </div>
                    <div>
                      <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase">
                        역량
                      </div>
                      <p className="mt-1 font-semibold text-gray-700">
                        {topic || '역량 요약이 없습니다.'}
                      </p>
                    </div>
                    <div>
                      <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase">
                        아기텍처 경험
                      </div>
                      <p className="mt-1 font-semibold text-gray-700">
                        {arch || '아키텍처 경험 요약이 없습니다.'}
                      </p>
                    </div>
                    <div>
                      <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase">
                        프로젝트
                      </div>
                      <p className="mt-1 font-semibold text-gray-700">
                        {context || '프로젝트 요약이 없습니다.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Raw (collapsed) */}
                <details className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <summary className="cursor-pointer text-[13px] font-bold text-gray-600">
                    원문
                  </summary>
                  <pre className="mt-3 max-h-[200px] overflow-auto whitespace-pre-wrap break-words text-[12px] leading-relaxed text-gray-700">
                    {candidate.unifiedText || '원문 데이터가 없습니다.'}
                  </pre>
                </details>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-7 py-6 sm:px-10 sm:py-7">
              <button
                onClick={onClose}
                style={{ backgroundColor: PALETTE.midnightInk }}
                className="w-full cursor-pointer rounded-2xl py-5 text-[16px] font-black text-white shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.995]"
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


/** ---------------- Candidate Card ---------------- */


function CandidateCard({
  candidate,
  onOpen,
}: {
  candidate: CandidateCardModel;
  onOpen: (c: CandidateCardModel) => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

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
      onClick={() => setIsFlipped((v) => !v)}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)' }}
      />

      {/* Flip ?? */}
      <div className="relative flex-shrink-0 cursor-pointer [perspective:1000px]" style={{ height: 300 }}>
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex h-full flex-col p-6 [backface-visibility:hidden]">
            <div className="flex min-h-[44px] items-center justify-center pt-[8px]">
              <h3 className="w-full truncate text-center text-[16px] font-black text-[#1a1a1a]">
                후보자 #{candidate.userId}
              </h3>
            </div>

            <div className="flex flex-1 flex-col items-center justify-end pt-[13px]">
              <CompactRadarChart weights={candidate.weights} score={candidate.matchScore} />

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {candidate.topFactors.map((f) => (
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
              <h3 className="w-full truncate text-center text-[16px] font-black text-[#1a1a1a]">
                유사도 분해
              </h3>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <div className="space-y-4">
                {FACTOR_ORDER.map((f) => (
                  <div key={f} className="text-[12px]">
                    <div className="mb-1.5 flex justify-between">
                      <span className="font-bold text-gray-600">{FACTOR_LABEL[f]}</span>
                      <span className="font-bold text-[#4a4a4a]">{candidate.weights[f]}점</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isFlipped ? `${candidate.weights[f]}%` : 0 }}
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
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(0,0,0,0.04)',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* 하단 */}
      <div className="-mt-4 flex min-h-0 flex-1 flex-col gap-2 px-4 pt-0 pb-2">
        <div className="mt-10 space-y-3 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(candidate);
            }}
            className="group relative w-full overflow-hidden rounded-2xl py-3.5 text-[13px] font-bold text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${POINT_BLUE} 0%, #7B8AE6 50%, ${POINT_BLUE} 100%)`,
              backgroundSize: '200% 200%',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10">상세 리포트 보기</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 py-2.5 text-[12px] font-semibold shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300"
              style={{ color: POINT_BLUE }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: `linear-gradient(135deg, ${POINT_BLUE}, transparent)` }}
              />
              <span className="relative z-10">이력서 조회</span>
            </button>

            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:from-slate-500 hover:to-slate-600"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/5 to-white/10" />
              <span className="relative z-10">PDF 조회</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


/** ---------------- Main Page ---------------- */

export default function RecommendCandidatesPage() {

  // 검색 폼
  const [query, setQuery] = useState('');
  const DEFAULT_LIMIT = 30;
  const [limitEnabled, setLimitEnabled] = useState(true);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  // 페이지네이션
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  // 모달
  const [detailTarget, setDetailTarget] = useState<CandidateCardModel | null>(null);

  // API 호출 (query가 비면 enabled=false)
  const { response, cards, isLoading, isFetching, error, refetch } = useRecommendCandidates({
    query,
    limit: limitEnabled ? limit : undefined,
  });

  // "검색" 버튼을 눌러야 호출되게 만들고 싶으면:
  // - query를 inputState로 두고,
  // - 실제 요청용 state(requestQuery)를 따로 만들어서 enabled를 requestQuery 기준으로 바꾸면 됨.
  // 일단은 지금 구조: query/limit 바뀌면 자동 호출 (단, query가 비면 호출 X)

  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedCards = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return cards.slice(start, start + PAGE_SIZE);
  }, [cards, safePage]);

  const pagerBtn =
    'h-10 w-10 rounded-xl border border-gray-200 bg-white text-[13px] font-black text-gray-600 ' +
    'shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0';

  return (
    <div style={{ backgroundColor: PALETTE.pureWhite }} className="min-h-screen pt-32 pb-24">
      <div className="mx-auto w-full max-w-[1280px] px-8 md:px-10 lg:px-12">
        {/* Header */}
        <header className="mb-6 border-l-[6px] border-[#5151E7] pl-6">
          <h1 className="text-4xl font-black tracking-tight text-[#1a1a1a] md:text-5xl">
            AI 추천 지원자
          </h1>
          <p className="mt-3 text-[16px] font-semibold text-[#a3a3a3] italic md:text-[17px]">
            검색 문장을 기준으로 포트폴리오 유사도를 계산해 추천합니다.
          </p>
        </header>



        {/* Criteria */}
        <EvaluationCriteria />

        
        {/* Search Bar */}
        <div className="mb-8 pl-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-[#fcfcfc] px-4 py-3">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="예) PostgreSQL 추천 시스템 유사도 검색"
                  className="w-full bg-transparent text-[14px] font-semibold text-gray-800 outline-none placeholder:text-gray-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex w-[200px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3">
                  <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() =>
                      setLimitEnabled((prev) => {
                        const next = !prev;
                        if (next && (!Number.isFinite(limit) || limit <= 0)) {
                          setLimit(DEFAULT_LIMIT);
                        }
                        return next;
                      })
                    }
                    className={`w-[44px] shrink-0 rounded-lg px-2 py-1 text-[11px] font-black text-center ${
                      limitEnabled ? 'bg-[#5563C1] text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {limitEnabled ? 'ON' : 'OFF'}
                  </button>
                  <span className="w-[40px] shrink-0 text-[12px] font-black text-gray-500 text-center">
                    LIMIT
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={limit}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const next = raw === '' ? 0 : Number(raw);
                      setLimit(next);
                    }}
                    placeholder="-"
                    className={`w-[60px] shrink-0 rounded-lg border border-gray-100 bg-[#fcfcfc] px-2 py-1 text-[13px] font-black text-gray-800 outline-none placeholder:text-gray-400 text-center ${
                      limitEnabled ? '' : 'opacity-60 pointer-events-none'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-xl px-4 py-3 text-[13px] font-black text-white shadow-md transition hover:-translate-y-0.5 active:translate-y-0"
                  style={{ backgroundColor: POINT_BLUE }}
                >
                  검색
                </button>
              </div>
            </div>

            {/* Summary chips (응답 상단 데이터) */}
            {response && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(response.tech ?? []).slice(0, 6).map((t: string) => (
                  <span
                    key={`tech-${t}`}
                    className="rounded-full border border-blue-100 bg-white px-3 py-1 text-[12px] font-bold text-blue-700"
                  >
                    #{t}
                  </span>
                ))}
                {(response.keywords ?? []).slice(0, 6).map((k: string) => (
                  <span
                    key={`kw-${k}`}
                    className="rounded-full border border-amber-100 bg-white px-3 py-1 text-[12px] font-bold text-amber-700"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-6 py-4 text-[13px] font-bold text-gray-500">
            추천 후보자를 분석 중입니다···
          </div>
        )}

        {!isLoading && error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/70 px-6 py-4 text-[13px] font-bold text-red-600">
            {error.message || '추천 후보자 데이터를 불러오지 못했습니다.'}
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-6 py-4 text-[13px] font-bold text-gray-500">
            새 결과를 가져오는 중입니다···
          </div>
        )}

        {/* Top Bar: count + pager */}
        <div className="mb-10 flex items-center justify-between gap-4 pl-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-[#f0eee9]/70 px-4 py-2">
              <Users className="h-4 w-4 text-[#4a4a4a]" />
              <span className="text-[13px] font-black text-[#4a4a4a]">
                {cards.length} candidates
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={pagerBtn}
              onClick={() => setPage(Math.max(1, safePage - 1))}
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
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              aria-label="next"
            >
              ›
            </button>
          </div>
        </div>

        {/* Grid */}
        {pagedCards.length === 0 && !isLoading && !error ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-bold text-gray-500">
              검색 문장을 입력하고 “검색”을 눌러 추천 후보자를 받아보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-7">
            {pagedCards.map((c: CandidateCardModel) => (
              <CandidateCard key={`${c.userId}-${c.portfolioId}`} candidate={c} onOpen={setDetailTarget} />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <CandidateDetailModal
        open={!!detailTarget}
        candidate={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  );
}
