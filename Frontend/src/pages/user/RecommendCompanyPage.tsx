import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, KeyRound, Puzzle, X } from 'lucide-react';

// ✅ 타입 및 팔레트 정의
type Factor = '프로젝트' | '문제' | '해결' | '기술스택';
const FACTOR_ORDER: Factor[] = ['프로젝트', '문제', '해결', '기술스택'];

type Company = {
  id: number;
  companyId: number;
  name: string;
  matchScore: number;
  openingsCount: number;
  weights: Record<Factor, number>;
  topFactors: Factor[];
};

const PALETTE = {
  pureWhite: '#fcfcfc',
  midnightInk: '#1a1a1a',
  cloudDancer: '#f0eee9',
  slateGray: '#4a4a4a',
  softPebble: '#d6d2c4',
  silverMist: '#a3a3a3',
};

const FACTOR_COLOR: Record<Factor, string> = {
  프로젝트: '#60A5FA',
  문제: '#FB923C',
  해결: '#4ADE80',
  기술스택: '#C084FC',
};

// ✅ 채도 낮춘 포인트 블루
const POINT_BLUE = '#5563C1';

// ---------------- UI Components ----------------

function DonutChart({ weights, score }: { weights: Record<Factor, number>; score: number }) {
  const size = 120;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // ✅ accAngle 재할당 제거: 렌더 중 부수효과 없이 순수 계산으로 segments 생성
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

// ---------------- Button Motion (Press + Lift + Focus) ----------------

const BTN_BASE =
  'relative w-full rounded-xl font-bold transition-all duration-200 outline-none cursor-pointer ' +
  'focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
  'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]';

const BTN_INSET =
  "overflow-hidden after:content-[''] after:absolute after:inset-0 after:pointer-events-none " +
  'after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-200 ' +
  'after:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.06)] ' +
  'hover:after:opacity-100 focus-visible:after:opacity-100';

// ---------------- Main Card ----------------

function CompanyCard({
  company,
  onOpenReason,
}: {
  company: Company;
  onOpenReason: (c: Company) => void;
}) {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);

  const goToPostings = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `/job-postings?cid=${company.companyId}&companyName=${encodeURIComponent(company.name)}`,
    );
  };

  return (
    <motion.div
      whileHover={{
        y: -6,
        // ✅ 오른쪽/아래 방향 그림자 "확실히 보이게"
        boxShadow: '14px 18px 36px rgba(0,0,0,0.16), 6px 8px 16px rgba(0,0,0,0.10)',
      }}
      whileTap={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={[
        'relative flex h-[460px] w-full flex-col overflow-hidden rounded-2xl',
        'border border-gray-200/60 bg-white',
      ].join(' ')}
      style={{
        // ✅ 기본 상태도 살짝
        boxShadow: '6px 8px 18px rgba(0,0,0,0.06)',
      }}
    >
      {/* ✅ 테두리/인셋은 아주 미세하게만 */}
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
          {/* 앞면 */}
          <div className="absolute inset-0 flex h-full flex-col p-6 [backface-visibility:hidden]">
            <div className="flex min-h-[44px] items-center justify-center pt-[8px]">
              <h3 className="w-full truncate text-center text-[17px] font-bold text-[#1a1a1a]">
                {company.name}
              </h3>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
              <DonutChart weights={company.weights} score={company.matchScore} />

              <div className="mt-9 flex flex-wrap justify-center gap-2">
                {company.topFactors.map((f: Factor) => (
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

          {/* 뒷면 */}
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

// ---------------- Reason Modal (UPDATED: spacing + line breaks + lucide + scroll lock) ----------------

function lockBodyScroll(lock: boolean) {
  const body = document.body;

  if (lock) {
    // iOS 튐 방지 + 정확한 복구
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

  // ESC 닫기(선택)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!company) return null;

  // ✅ 헤더 문장 줄바꿈 3줄
  const line1 = `${company.name} 기준,`;
  const line2 = '당신의 #문제해결 역량이';
  const line3 = '가장 강점으로 평가됐습니다.';

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
            {/* Header (덜 빽빽하게) */}
            <div
              style={{ backgroundColor: PALETTE.midnightInk }}
              className="relative px-7 py-7 text-white sm:px-10 sm:py-9"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black tracking-widest text-blue-300 uppercase">
                  AI INSIGHT REPORT
                </span>

                {/* ✅ confidence 안 쓰니까 주석처리 (삭제 X) */}
                {/*
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400">Confidence</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[95%] bg-blue-500" />
                  </div>
                  <span className="text-[11px] font-black text-blue-400">95%</span>
                </div>
                */}
              </div>

              {/* close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* ✅ 줄바꿈 적용 */}
              <h3 className="text-[22px] leading-[1.15] font-black tracking-tight sm:text-[26px]">
                {line1}
                <br />
                <span className="text-blue-400">{line2}</span>
                <br />
                {line3}
              </h3>

              {/* ✅ 숨통(설명 한 줄) */}
              {/* <p className="mt-4 max-w-[58ch] text-[12.5px] leading-relaxed text-white/55">
                아래 가이드는 포트폴리오/자소서/면접 답변에서 강점이 “눈에 띄게” 배치되도록 추천합니다.
              </p> */}
            </div>

            {/* Body (덜 꽉차게: padding/spacing/line-height/폭 조절) */}
            <div className="flex-1 overflow-y-auto px-7 py-8 sm:px-10 sm:py-10">
              <div className="space-y-12">
                {/* 1 */}
                <div>
                  <h4 className="mb-4 flex items-center gap-3 text-[18px] font-black text-[#1a1a1a]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    포트폴리오 강조 포인트
                  </h4>

                  <div className="rounded-2xl border border-gray-100 bg-[#f8f9fa] p-6 sm:p-7">
                    <p className="max-w-[62ch] text-[16px] leading-relaxed font-medium text-[#4a4a4a] sm:text-[17px]">
                      최근 진행하신{' '}
                      <span className="font-bold text-[#1a1a1a]">대규모 데이터 처리 프로젝트</span>
                      의 트러블슈팅 과정을 이력서 최상단에 배치하세요. 이 기업은 레거시 개선 작업을
                      진행 중이므로 당신의 ‘해결 로직’을 핵심 인재 요건으로 보고 있습니다.
                    </p>
                  </div>
                </div>

                {/* 2 */}
                <div>
                  <h4 className="mb-4 flex items-center gap-3 text-[18px] font-black text-[#1a1a1a]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    지원서 작성 치트키
                  </h4>

                  <div className="flex flex-wrap gap-2.5">
                    {['#기술부채_해결', '#아키텍처_최적화', '#수치기반_성과', '#확장성_고려'].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-xl border-2 border-gray-100 bg-white px-4 py-2 text-[14px] font-bold text-gray-600 shadow-sm"
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                {/* 3 */}
                <div>
                  <h4 className="mb-4 flex items-center gap-3 text-[18px] font-black text-[#1a1a1a]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <Puzzle className="h-5 w-5" />
                    </span>
                    합격 전략 가이드
                  </h4>

                  <div className="rounded-2xl border-2 border-dashed border-[#d6d2c4] bg-[#fcfcfc] p-6 sm:p-7">
                    <p className="max-w-[62ch] text-[16px] leading-loose font-medium text-[#4a4a4a] sm:text-[17px]">
                      “면접 시 단순 기술 사용 경험보다,{' '}
                      <span className="font-bold text-[#1a1a1a] underline">
                        왜 그 기술을 선택했는지
                      </span>
                      에 대한 논리적 근거를 3가지 이상 준비하세요. 해당 팀 리더는 기술적 타당성을
                      가장 중요하게 평가합니다.”
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer (호흡 확보) */}
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

// ---------------- Main Page ----------------

type SortBy = 'matchScore' | 'openingsCount';

export default function RecommendCompanyPage() {
  const [sortBy, setSortBy] = useState<SortBy>('matchScore');
  const [reasonTarget, setReasonTarget] = useState<Company | null>(null);

  const sortedCompanies = useMemo(() => {
    return [...MOCK_COMPANIES].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [sortBy]);

  const isScore = sortBy === 'matchScore';
  const isOpenings = sortBy === 'openingsCount';

  const sortBtnBase =
    'rounded-full px-4 py-2 text-[13px] font-black transition-all duration-200 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2';

  const sortBtnOn = 'bg-[#1a1a1a] text-white shadow-sm';
  const sortBtnOff = 'bg-[#f0eee9]/70 text-[#4a4a4a] hover:bg-[#f0eee9]';

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

        {/* ✅ 정렬 버튼 2개 추가 */}
        <div className="mb-10 flex items-center gap-2 pl-6">
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

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedCompanies.map((c) => (
            <CompanyCard key={c.id} company={c} onOpenReason={setReasonTarget} />
          ))}
        </div>
      </div>

      <ReasonModal
        open={!!reasonTarget}
        company={reasonTarget}
        onClose={() => setReasonTarget(null)}
      />
    </div>
  );
}

// ---------------- Mock ----------------

const MOCK_COMPANIES = Array.from({ length: 15 }).map((_, i) => ({
  id: i + 1,
  companyId: 1000 + i + 1,
  name: ['삼성전자', '네이버', '카카오', '토스', '쿠팡', '라인', '현대차', '배민'][i % 8],
  matchScore: [98, 92, 89, 86, 84, 81, 78, 76][i % 8],
  openingsCount: [2, 0, 5, 1, 3, 4, 2, 1][i % 8],
  weights: { 프로젝트: 40, 문제: 20, 해결: 20, 기술스택: 20 } as Record<Factor, number>,
  topFactors: ['프로젝트', '문제'] as Factor[],
}));
