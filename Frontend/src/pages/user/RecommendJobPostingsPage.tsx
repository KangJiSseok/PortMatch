                                    import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Info,
  ChevronDown,
  Briefcase,
  ExternalLink,
  X,
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
import { useRecommendJobPostings } from '@/hooks/useRecommendJobPostings';
import type { JobPostingCardModel, JobPostingFactor, JobPostingWeights } from '@/types/recommendJobPosting';

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

const FACTOR_ORDER: JobPostingFactor[] = ['도메인', 'Tech', 'Problem', 'Architecture'];
const FACTOR_LABEL: Record<JobPostingFactor, string> = {
  도메인: '도메인',
  Tech: 'Tech',
  Problem: 'Problem',
  Architecture: 'Architecture',
};

const FACTOR_COLOR: Record<JobPostingFactor, string> = {
  도메인: '#60A5FA',
  Tech: '#FB923C',
  Problem: '#4ADE80',
  Architecture: '#C084FC',
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
      color: FACTOR_COLOR.Tech,
    },
    {
      id: '문제 정의',
      desc: '프로젝트에서 해결하려 했던 과제의 본질(성능, 효율 등)에 집중합니다.',
      color: FACTOR_COLOR.Problem,
    },
    {
      id: '아키텍처',
      desc: '설계/구조/성능/분산 등 아키텍처 경험의 유사도를 평가합니다.',
      color: FACTOR_COLOR.Architecture,
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
            <p className="mb-4 max-w-[200ch] text-[13px] leading-relaxed text-[#4a4a4a]">
              이 리포트는 분석한 포트폴리오와 채용 공고를 대조하여,
              <br />
              <span className="border-b-2 border-[#d6d2c4] font-bold text-[#1a1a1a]">
                "해당 직무의 도메인에서 다루는 기술과 문제 정의, 그리고 아키텍처"
                {/* Domain, Tech, Problem, Architecture */}
              </span>{' '}
              가 실무 요구사항과 얼마나 맞닿아 있는지를 종합적으로 산출합니다.
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

/** ---------------- Radar Chart ---------------- */

type RadarDataPoint = { category: string; value: number };

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
        <div className="fixed inset-0 z-[70]">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="absolute left-1/2 top-[6vh] flex max-h-[86vh] w-[92vw] max-w-[960px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-7 py-5">
              <div>
                <p className="text-[12px] font-bold text-gray-400">Recommendation Detail</p>
                <h3 className="text-[20px] font-black text-[#1a1a1a]">
                  {posting.title}
                </h3>
                <p className="text-[13px] font-semibold text-gray-500">{posting.companyName}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                aria-label="close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-[#fcfcfc] p-4">
                    <h4 className="mb-2 text-[13px] font-black text-gray-900">Problem</h4>
                    <p className="text-[12px] leading-relaxed text-gray-600">
                      {posting.problem || 'No problem summary provided.'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-[#fcfcfc] p-4">
                    <h4 className="mb-2 text-[13px] font-black text-gray-900">Solution</h4>
                    <p className="text-[12px] leading-relaxed text-gray-600">
                      {posting.solution || 'No solution summary provided.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h4 className="mb-2 text-[13px] font-black text-gray-900">Portfolio Content</h4>
                    <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-gray-600">
                      {posting.portfolioContent || 'No portfolio content.'}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h4 className="mb-2 text-[13px] font-black text-gray-900">Job Posting Content</h4>
                    <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-gray-600">
                      {posting.jobPostingContent || 'No job posting content.'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-white px-7 py-5">
              <button
                onClick={onClose}
                className="w-full cursor-pointer rounded-2xl py-4 text-[15px] font-black text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.995]"
                style={{ backgroundColor: PALETTE.midnightInk }}
              >
                Close
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

      <div className="flex flex-1 flex-col p-6">
        <div className="flex min-h-[44px] items-center justify-center pt-[8px]">
          <div className="text-center">
            <h3 className="line-clamp-2 text-[16px] font-black text-[#1a1a1a]">
              {posting.title}
            </h3>
            <p className="mt-1 text-[12px] font-semibold text-gray-500">{posting.companyName}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-end pt-[8px]">
          <JobPostingRadarChart weights={posting.weights} score={posting.matchScore} />

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {posting.topFactors.map((f) => (
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
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 px-5 py-4">
        <button
          type="button"
          onClick={() => onOpen(posting)}
          className="text-[12px] font-black text-gray-500 hover:text-gray-800"
        >
          View details
        </button>
        <button
          type="button"
          onClick={() => onViewDetail(posting)}
          className="inline-flex items-center gap-2 rounded-full bg-[#1f2937] px-4 py-2 text-[12px] font-black text-white shadow-sm"
        >
          <ExternalLink className="h-3 w-3" />
          Job post
        </button>
      </div>
    </motion.div>
  );
}

/** ---------------- Page ---------------- */

const PAGE_SIZE = 8;

export default function RecommendJobPostingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portfolioIdParam = searchParams.get('portfolioId');
  const portfolioId = portfolioIdParam && Number.isFinite(Number(portfolioIdParam)) ? Number(portfolioIdParam) : null;

  const [page, setPage] = useState(1);
  const [prevCardsLength, setPrevCardsLength] = useState(0);
  const [detailTarget, setDetailTarget] = useState<JobPostingCardModel | null>(null);

  const { response, cards, isLoading, isFetching, error } = useRecommendJobPostings(portfolioId);

  const displayCards = cards;

  // React 권장 패턴: 렌더링 중 상태 조정 (useEffect 대신)
  if (cards.length !== prevCardsLength) {
    setPrevCardsLength(cards.length);
    if (prevCardsLength !== 0) {
      setPage(1);
    }
  }

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
    <div style={{ backgroundColor: PALETTE.pureWhite }} className="min-h-screen pt-32 pb-24">
      <div className="mx-auto w-full max-w-[1280px] px-8 md:px-10 lg:px-12">
        <header className="mb-6 border-l-[6px] border-[#5151E7] pl-6">
          <h1 className="text-4xl font-black tracking-tight text-[#1a1a1a] md:text-5xl">
            추천 공고 리스트
          </h1>
          <p className="mt-3 text-[16px] font-semibold text-[#a3a3a3] italic md:text-[17px]">
            포트폴리오를 기준으로 유사도가 높은 공고를 추천합니다.
          </p>
        </header>

        <EvaluationCriteria />

        <div className="mb-8 pl-6">
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
        </div>

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

        {pagedCards.length === 0 && !isLoading && !error ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-bold text-gray-500">
              추천 결과가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-4">
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
