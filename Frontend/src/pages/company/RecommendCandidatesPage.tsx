import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Info, FileText, ChevronDown, Users, Search, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRecommendCandidates } from '@/hooks/useRecommendCandidates';
import CompactRadarChart from '@/components/charts/CompactRadarChart';
import axiosInstance from '@/api/axiosInstance';
import { resumeApi } from '@/api/resumeApi';
import { portfolioApi } from '@/api/portfolioApi';
import type { CandidateCardModel, CandidateFactor } from '@/types/recommendCandidate';

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
  기술: '#60A5FA',
  주제: '#FB923C',
  아키텍처: '#4ADE80',
  맥락: '#C084FC',
};

type StackItem = {
  stackId: number;
  stackName: string;
};

type RawStackItem = {
  stackId?: number;
  id?: number;
  stackName?: string;
  name?: string;
  stack_name?: string;
};
//   기술: '#64748B',
//   주제: '#94A3B8',
//   아키텍처: '#475569',
//   맥락: POINT_BLUE,
// };

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
      desc: '인재의 기술스택 및 도구 사용 경험의 유사도를 평가합니다.',
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
              <h4 className="text-[15px] font-black text-[#1a1a1a]">인재 평가 지표</h4>
              <p className="mt-0.5 text-[12px] font-medium text-gray-500">
                AI가 추천인을 선별하는 4가지 핵심 관점
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
              이 리포트는 입력한 검색 문장을 기준으로, 추천 후보자들의 포트폴리오 내용을 비교해
              <br />
              <span className="border-b-2 border-[#d6d2c4] font-bold text-[#1a1a1a]">
                기술, 주제, 아키텍처, 맥락
              </span>
              의 유사도를 계산합니다.
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

/** ---------------- Comparison Table ---------------- */

type ComparisonSection = {
  label: string;
  factor: CandidateFactor;
  searchValue: string;
  candidateValue: string;
  score: number;
};

function CandidateComparisonTable({ sections }: { sections: ComparisonSection[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full table-fixed text-left">
        <colgroup>
          <col className="w-[140px]" />
          <col className="w-[100px]" />
          <col />
        </colgroup>
        <thead className="border-b border-gray-200 bg-gray-50/50">
          <tr className="text-[13px] font-medium tracking-wider text-gray-500 uppercase">
            <th className="px-6 py-4 text-center">비교 항목</th>
            <th className="px-4 py-4 text-center">매칭도</th>
            <th className="px-6 py-4">
              <span className="font-semibold text-gray-900">추천 인재의 포트폴리오 추출 내용</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sections.map((section) => (
            <tr key={section.factor} className="transition-colors hover:bg-gray-50/30">
              {/* 비교 항목 */}
              <td className="px-6 py-5">
                <div className="text-center text-[14px] font-semibold text-gray-700">
                  {section.label}
                </div>
              </td>

              {/* 매칭도 (점수 + 프로그레스 바) */}
              <td className="px-4 py-5">
                <div className="flex flex-col items-center gap-2">
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: FACTOR_COLOR[section.factor] }}
                  >
                    {section.score}
                    <span className="ml-0.5 text-[12px] font-medium opacity-80">점</span>
                  </span>
                  <div className="h-1.5 w-full max-w-[60px] overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${section.score}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: FACTOR_COLOR[section.factor] }}
                    />
                  </div>
                </div>
              </td>

              {/* 후보자 포트폴리오 데이터 - 배경색 제거됨 */}
              <td className="px-6 py-5">
                <div className="text-[14px] leading-relaxed text-gray-600">
                  {section.candidateValue || <span className="text-gray-300">—</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** ---------------- Detail Modal ---------------- */

function CandidateDetailModal({
  open,
  candidate,
  searchQuery,
  onClose,
}: {
  open: boolean;
  candidate: CandidateCardModel | null;
  searchQuery: string;
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

  const top1 = candidate.topFactors?.[0] ?? '기술';
  const top2 = candidate.topFactors?.[1] ?? '주제';

  // 비교 테이블용 데이터
  const comparisonSections: ComparisonSection[] = [
    {
      label: '기술',
      factor: '기술',
      searchValue: searchQuery,
      candidateValue: tech,
      score: candidate.weights['기술'],
    },
    {
      label: '주제/역량',
      factor: '주제',
      searchValue: searchQuery,
      candidateValue: topic,
      score: candidate.weights['주제'],
    },
    {
      label: '아키텍처',
      factor: '아키텍처',
      searchValue: searchQuery,
      candidateValue: arch,
      score: candidate.weights['아키텍처'],
    },
    {
      label: '맥락',
      factor: '맥락',
      searchValue: searchQuery,
      candidateValue: context,
      score: candidate.weights['맥락'],
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 28, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative z-[201] flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
          >
            {/* Header - 구글 머티리얼 스타일의 깔끔한 구성 */}
            <div
              className="relative px-8 py-6 text-white"
              style={{
                backgroundColor: PALETTE.midnightInk,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 상단 레이블 - 칩 스타일 */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.05em] text-blue-200">
                      CANDIDATE REPORT
                    </span>
                    <span className="text-[12px] font-medium text-white/40">|</span>
                    <span className="text-[12px] font-medium text-blue-200/80">
                      ID #{candidate.portfolioId}
                    </span>
                  </div>

                  {/* 후보자 성함 */}
                  <h4 className="flex items-baseline gap-2 text-[24px] font-bold tracking-tight">
                    {candidate.userName ? candidate.userName : `후보자 #${candidate.userId}`}
                    <span className="text-[14px] font-normal text-white/50">Candidate Profile</span>
                  </h4>

                  {/* 강점 태그 - 해시태그 스타일 */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {[top1, top2].map((tag) => (
                      <span key={tag} className="text-[13px] font-medium text-blue-100">
                        #{FACTOR_LABEL[tag]}
                      </span>
                    ))}
                    {/* <span className="h-3 w-[1px] bg-white/20 mx-1" /> */}
                    <span className="text-[13px] font-medium text-white/90">관점에서 강점</span>
                  </div>
                </div>

                {/* 전체 유사도 점수 - 깔끔한 숫자 강조 */}
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline leading-none">
                      <span className="text-[48px] font-light tracking-tighter text-white">
                        {candidate.matchScore}
                      </span>
                      <span className="ml-1 text-[16px] font-medium text-blue-200">점</span>
                    </div>
                    <span className="mt-1 text-[10px] font-bold tracking-widest text-blue-200/60 uppercase">
                      Match Score
                    </span>
                  </div>

                  {/* 닫기 버튼 - 원형 인터랙션 */}
                  <button
                    onClick={onClose}
                    className="group relative -mt-4 -mr-2 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-white/10 active:scale-95"
                    aria-label="close"
                  >
                    <X className="h-5 w-5 text-white/60 group-hover:text-white" />
                  </button>
                </div>
              </div>
            </div>
            {/* Body - scrollable */}
            <div
              ref={detailRef}
              className="soft-scrollbar flex-1 overflow-y-auto px-10 pt-4 pb-4"
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

              <div className="space-y-8">
                {/* 비교 테이블 */}
                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-[16px] font-black text-[#1a1a1a]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    추천 인재의 포트폴리오 분석 결과
                  </h4>
                  <CandidateComparisonTable sections={comparisonSections} />
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-gray-100 bg-white px-10 py-6">
              <button
                onClick={onClose}
                className="w-full cursor-pointer rounded-2xl py-4 text-[15px] font-black text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.995]"
                style={{
                  backgroundColor: PALETTE.midnightInk,
                }}
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
  onResumeView,
  onPdfView,
}: {
  candidate: CandidateCardModel;
  onOpen: (c: CandidateCardModel) => void;
  onResumeView: (c: CandidateCardModel) => void;
  onPdfView: (c: CandidateCardModel) => void;
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
      <div
        className="relative flex-shrink-0 cursor-pointer [perspective:1000px]"
        style={{ height: 300 }}
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex h-full flex-col p-6 [backface-visibility:hidden]">
            <div className="flex min-h-[44px] items-center justify-center pt-[8px]">
              <h3 className="w-full truncate text-center text-[16px] font-black text-[#1a1a1a]">
                {candidate.userName ? candidate.userName : `후보자 #${candidate.userId}`}
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
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(0,0,0,0.04)',
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
            className="group relative w-full overflow-hidden rounded-2xl py-3.5 text-[13px] font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${POINT_BLUE} 0%, #7B8AE6 50%, ${POINT_BLUE} 100%)`,
              backgroundSize: '200% 200%',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="relative z-10">상세 리포트 보기</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResumeView(candidate);
              }}
              disabled={!candidate.userId}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 py-2.5 text-[12px] font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              style={{ color: POINT_BLUE }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-10"
                style={{ background: `linear-gradient(135deg, ${POINT_BLUE}, transparent)` }}
              />
              <span className="relative z-10">이력서 조회</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPdfView(candidate);
              }}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:from-slate-500 hover:to-slate-600 hover:shadow-md"
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
  const navigate = useNavigate();

  // 검색 폼
  const [queryInput, setQueryInput] = useState('');
  const [requestQuery, setRequestQuery] = useState('');
  const DEFAULT_LIMIT = 10;
  const [limitInput, setLimitInput] = useState(String(DEFAULT_LIMIT));
  const [stackInput, setStackInput] = useState('');
  const [selectedStacks, setSelectedStacks] = useState<StackItem[]>([]);
  const [duplicateStackError, setDuplicateStackError] = useState(false);

  // 페이지네이션
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  // 모달
  const [detailTarget, setDetailTarget] = useState<CandidateCardModel | null>(null);
  const [resumeNotice, setResumeNotice] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // API 호출 (query가 비면 enabled=false)
  const parsedLimit = Number(limitInput);
  const resolvedLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT;
  const { response, cards, isLoading, isFetching, error, refetch } = useRecommendCandidates({
    query: requestQuery,
    limit: resolvedLimit,
  });

  const { data: stackSearchResults } = useQuery({
    queryKey: ['stacks', stackInput],
    queryFn: async () => {
      if (!stackInput.trim()) return [];
      const response = await axiosInstance.get(`/stacks/name/${stackInput}`);
      const rawData = (response.data?.data ?? []) as RawStackItem[];
      return rawData
        .map((item: RawStackItem) => ({
          stackId: item.stackId || item.id || 0,
          stackName: item.stackName || item.name || item.stack_name || '',
        }))
        .filter((item: StackItem) => item.stackId !== 0);
    },
    enabled: stackInput.length > 0,
    staleTime: 1000 * 60,
  });

  const handleSelectStack = (stack: StackItem) => {
    if (selectedStacks.some((s) => s.stackId === stack.stackId)) {
      setDuplicateStackError(true);
      setTimeout(() => setDuplicateStackError(false), 1000);
      setStackInput('');
      return;
    }
    setSelectedStacks((prev) => [...prev, stack]);
    setStackInput('');
  };

  const removeStack = (stackId: number) => {
    setSelectedStacks((prev) => prev.filter((s) => s.stackId !== stackId));
  };

  const hasRequestQuery = Boolean(requestQuery.trim());
  const displayCards = hasRequestQuery ? cards : [];
  const displayResponse = hasRequestQuery ? response : undefined;

  const runSearch = () => {
    const nextQuery = queryInput.trim();
    setPage(1);
    if (!nextQuery) {
      setRequestQuery('');
      return;
    }
    const nextLimit = Number(limitInput);
    if (!Number.isFinite(nextLimit) || nextLimit < 1) {
      alert('1 이상의 수만 입력 가능합니다.');
      return;
    }
    const techList = selectedStacks.map((s) => s.stackName).filter(Boolean);
    const techPrompt =
      techList.length > 0
        ? `\n\n[기술 스택 입력]\n- 이 항목은 검색 문장과 별도로 입력된 기술 스택입니다.\n- 기술 스택 목록: ${techList.join(', ')}`
        : '';
    const finalQuery = `${nextQuery}${techPrompt}`;
    if (finalQuery === requestQuery) {
      refetch();
      return;
    }
    setRequestQuery(finalQuery);
  };

  const handleResumeView = async (candidate: CandidateCardModel) => {
    const userId = candidate.userId;
    if (!userId) {
      alert('사용자 ID가 없습니다.');
      return;
    }

    try {
      const resume = await resumeApi.getMainResumeByUserId(userId);
      if (!resume?.id) {
        throw new Error('empty resume');
      }
      navigate(`/resumes/${resume.id}`, {
        state: { companyResume: resume, companyUserId: userId },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '이력서 조회에 실패했습니다.';
      console.error('이력서 조회 실패: ', err);
      if (message.includes('이력서가 없습니다')) {
        setResumeNotice({ open: true, message: '해당 유저의 이력서가 없습니다.' });
        return;
      }
      setResumeNotice({ open: true, message: '이력서 조회에 실패했습니다.' });
    }
  };

  const handlePdfView = async (candidate: CandidateCardModel) => {
    try {
      const { url } = await portfolioApi.getPresignedUrl(candidate.portfolioId);
      if (!url) {
        throw new Error('empty url');
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('PDF 조회 실패: ', err);
      alert('PDF 조회에 실패했습니다.');
    }
  };

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
      <div className="mx-auto w-full max-w-[1280px] min-w-[1280px] px-10">
        {/* Header */}
        <header className="mb-6 border-l-[6px] border-[#5151E7] pl-6">
          <h1 className="text-5xl font-black tracking-tight text-[#1a1a1a]">추천 인재 리스트</h1>
          <p className="mt-3 text-[17px] font-semibold text-[#a3a3a3] italic">
            검색 문장을 기준으로 포트폴리오 유사도를 계산해 추천합니다.
          </p>
        </header>

        {/* Criteria */}
        <EvaluationCriteria />

        {/* Search Bar */}
        <div className="mb-8 pl-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-[#fcfcfc] px-5 py-4">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      runSearch();
                    }
                  }}
                  placeholder="예) PostgreSQL 추천 시스템 유사도 검색"
                  className="w-full bg-transparent text-[15px] font-bold text-gray-800 outline-none placeholder:text-gray-400"
                />
              </div>

              <button
                type="button"
                onClick={runSearch}
                className="rounded-xl px-5 py-4 text-[14px] font-black text-white shadow-md transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-white/70"
                style={{ backgroundColor: queryInput.trim() ? POINT_BLUE : '#d1d5db' }}
                disabled={!queryInput.trim()}
              >
                검색
              </button>
            </div>

            {/* Summary chips (응답 상단 데이터) */}
            {displayResponse && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(displayResponse.tech ?? []).slice(0, 6).map((t: string) => (
                  <span
                    key={`tech-${t}`}
                    className="rounded-full border border-blue-100 bg-white px-3 py-1 text-[12px] font-bold text-blue-700"
                  >
                    #{t}
                  </span>
                ))}
                {(displayResponse.keywords ?? []).slice(0, 6).map((k: string) => (
                  <span
                    key={`kw-${k}`}
                    className="rounded-full border border-amber-100 bg-white px-3 py-1 text-[12px] font-bold text-amber-700"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {/* <div className="border-t border-gray-100 pt-4">
                <div className="text-[13px] font-black text-[#1a1a1a]">선택 옵션</div>
                <div className="mt-1 text-[12px] font-semibold text-gray-500">
                  해당 기술을 보유한 지원자가 점수가 높아집니다.
                </div>
              </div> */}

              <div className="grid grid-cols-[7fr_3fr] gap-3">
                <div className="relative">
                  <div className="mb-2 text-[12px] font-black text-gray-700">
                    기술 스택 (선택)
                    <span className="mt-1 block text-[12px] font-semibold text-gray-400">
                      해당 기술을 보유한 지원자가 점수가 높아집니다.
                    </span>
                  </div>
                  <motion.input
                    animate={duplicateStackError ? { x: [-4, 4, -4, 4, 0] } : {}}
                    type="text"
                    value={stackInput}
                    onChange={(e) => setStackInput(e.target.value)}
                    placeholder="기술 스택 검색 (예: React)"
                    className={`w-full rounded-2xl border px-5 py-4 text-[14px] font-bold transition-all outline-none ${
                      duplicateStackError
                        ? 'border-red-500 bg-red-50/30'
                        : 'border-slate-100 bg-slate-50 focus:border-blue-600 focus:bg-white'
                    }`}
                  />

                  {stackInput && stackSearchResults && stackSearchResults.length > 0 && (
                    <div className="absolute top-full z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                      {stackSearchResults.map((stack: StackItem) => (
                        <button
                          key={stack.stackId}
                          onClick={() => handleSelectStack(stack)}
                          className="w-full px-5 py-3 text-left text-[14px] font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        >
                          {stack.stackName}
                        </button>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {duplicateStackError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -bottom-6 left-2 text-[11px] font-black text-red-500"
                      >
                        이미 추가된 기술 스택입니다.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <div className="mb-2 text-[12px] font-black text-gray-700">
                    추천 인원 제한
                    <span className="mt-1 block text-[12px] font-semibold text-gray-400">
                      추천인을 최소 1명 이상 입력해주세요.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3">
                    <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                    <span className="w-[40px] shrink-0 text-center text-[12px] font-black text-gray-500">
                      LIMIT
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={limitInput}
                      onChange={(e) => {
                        setLimitInput(e.target.value);
                      }}
                      placeholder="10"
                      className="w-[70px] shrink-0 rounded-lg border border-gray-100 bg-[#fcfcfc] px-2 py-1 text-center text-[13px] font-black text-gray-800 outline-none placeholder:text-gray-400"
                    />
                    <span className="text-[12px] font-bold text-gray-500">명</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <AnimatePresence>
                  {selectedStacks.map((stack) => (
                    <motion.span
                      key={stack.stackId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-[12px] font-black text-blue-600"
                    >
                      {stack.stackName}
                      <button
                        onClick={() => removeStack(stack.stackId)}
                        className="text-blue-300 transition-colors hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-6 py-4 text-[13px] font-bold text-gray-500">
            추천 인재를 분석 중입니다···
          </div>
        )}

        {!isLoading && error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/70 px-6 py-4 text-[13px] font-bold text-red-600">
            {error.message || '추천 인재 데이터를 불러오지 못했습니다.'}
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
                {displayCards.length} candidates
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
              검색 문장을 입력하고 “검색”을 눌러 추천 인재를 받아보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-7">
            {pagedCards.map((c: CandidateCardModel) => (
              <CandidateCard
                key={`${c.userId}-${c.portfolioId}`}
                candidate={c}
                onOpen={setDetailTarget}
                onResumeView={handleResumeView}
                onPdfView={handlePdfView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <CandidateDetailModal
        open={!!detailTarget}
        candidate={detailTarget}
        searchQuery={requestQuery}
        onClose={() => setDetailTarget(null)}
      />

      <AnimatePresence>
        {resumeNotice.open && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResumeNotice({ open: false, message: '' })}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="relative z-[211] w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eee9] text-[#4a4a4a]">
                  <Info className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-[16px] font-black text-[#1a1a1a]">안내</h4>
                </div>
              </div>
              <p className="text-[14px] leading-relaxed font-medium text-[#4a4a4a]">
                {resumeNotice.message}
              </p>
              <button
                type="button"
                onClick={() => setResumeNotice({ open: false, message: '' })}
                className="mt-6 w-full cursor-pointer rounded-2xl py-3 text-[14px] font-black text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.995]"
                style={{ backgroundColor: PALETTE.midnightInk }}
              >
                확인
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
