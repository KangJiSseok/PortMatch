import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/Button/Button';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';

import { useRecommendedCandidates } from '@/hooks/useRecommendedCandidates';
import type { Candidate } from '@/types/recommendCandidate';

// ✅ 개발용 MOCK
const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 201,
    name: '김포트',
    headline:
      'React/TypeScript 기반 컴포넌트 설계 경험이 풍부하고 협업 커뮤니케이션이 강점입니다.',
    matchScore: 96,
    stacks: ['React', 'TypeScript', 'Tailwind'],
    keywords: ['상태관리', '컴포넌트 설계', '협업'],
    updatedAt: '2026-01-25',
    liked: false,
    followed: false,
    scrapped: false,
  },
  {
    id: 202,
    name: '박매치',
    headline: 'Kotlin/Spring 기반 API 설계와 트러블슈팅 경험이 있고, 도메인 이해도가 빠릅니다.',
    matchScore: 91,
    stacks: ['Kotlin', 'Spring', 'JPA'],
    keywords: ['API 설계', '트러블슈팅', '도메인'],
    updatedAt: '2026-01-24',
    liked: false,
    followed: false,
    scrapped: false,
  },
];

function CandidateCard({
  candidate,
  onOpenResume,
}: {
  candidate: Candidate;
  onOpenResume: () => void;
}) {
  return (
    <motion.li
      whileHover={{ y: -4 }}
      className="group border-silver-mist bg-pure-white flex min-w-full flex-col items-center justify-between gap-6 rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50 md:flex-row md:items-center"
    >
      {/* 좌측(메인 정보) */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-midnight-ink text-2xl font-black tracking-tight">
            {candidate.name}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {candidate.stacks.map((stack) => (
              <span
                key={stack}
                className="border-silver-mist bg-cloud-dancer text-slate-gray rounded-full border px-3 py-1 text-[11px] font-black tracking-tight"
              >
                {stack}
              </span>
            ))}
          </div>
        </div>

        <p className="text-slate-gray text-base leading-relaxed opacity-80 md:max-w-[90%]">
          {candidate.headline}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {candidate.keywords.map((k) => (
            <span
              key={k}
              className="border-silver-mist bg-pure-white text-slate-gray rounded-full border px-3 py-1 text-[11px] font-black tracking-tight opacity-70"
            >
              #{k}
            </span>
          ))}
        </div>
      </div>

      {/* 우측(점수 + 버튼) */}
      <div className="flex shrink-0 items-center gap-8">
        {/* ✅ Match Score: 가운데 정렬 + 점수 크게 강조 */}
        <div className="flex w-28 flex-col items-center justify-center text-center">
          <span className="text-slate-gray text-[11px] font-black tracking-widest uppercase opacity-60">
            MATCH SCORE
          </span>
          <span className="text-midnight-ink mt-1 text-4xl font-black tabular-nums leading-none">
            {candidate.matchScore}
          </span>
        </div>

        {/* ✅ 버튼 크기 줄이기 + 고정(칸 줄여도 안 줄어들게) */}
        <Button
          variant="outline"
          onClick={onOpenResume}
          className={[
            'group/btn no-title-hover shrink-0',
            'h-20 w-32 rounded-2xl border-2 transition-all',
            'text-midnight-ink hover:text-point-blue cursor-pointer hover:bg-slate-50',
          ].join(' ')}
        >
          <div className="flex h-full flex-col items-center justify-center gap-1">
            <span className="text-[10px] font-black tracking-[0.2em] whitespace-nowrap uppercase opacity-60">
              Resume
            </span>
            <span className="text-sm font-black">이력서 확인</span>
          </div>
        </Button>

        {/* ✅ 구분선: shrink-0로 고정 */}
        <div className="bg-cloud-dancer hidden h-12 w-px shrink-0 md:block" />
      </div>
    </motion.li>
  );
}

export default function RecommendCandidatesPage() {
  const navigate = useNavigate();

  // ✅ error까지 받아야 401만 예외처리 가능
  const { data, isLoading, isError, error, refetch } = useRecommendedCandidates({});

  // ✅ API 데이터가 "배열 + 길이>0"이면 API 사용, 아니면 MOCK 사용
  const candidates = Array.isArray(data) && data.length > 0 ? data : MOCK_CANDIDATES;

  // ✅ 401(Unauthorized)면 ErrorState 대신 MOCK 화면 보여주기
  const isUnauthorized =
    error instanceof Error && (error.message.includes('401') || error.message === 'UNAUTHORIZED');

  // Navbar 검색어 초기화
  useEffect(() => {
    const input = document.getElementById('navbar-search-input') as HTMLInputElement | null;
    if (input) input.value = '';
  }, []);

  // ✅ 추천 점수 순 고정 정렬
  const sortedCandidates = useMemo(
    () => [...candidates].sort((a, b) => b.matchScore - a.matchScore),
    [candidates],
  );

  /**
   * ✅ 로딩 오래 걸릴 때 체감 개선:
   * - API가 느리거나 401로 결국 MOCK 보여줄 거면, 로딩 UI를 너무 오래 붙잡지 않기
   * - "데이터가 없으면 MOCK"이 이미 있으니, isLoading이어도 목록을 보여줄 수 있음
   *
   * 아래 showSkeleton을 true로 두면 로딩 UI 유지,
   * false로 두면 로딩 중에도 MOCK 리스트가 바로 보임.
   */
  const showSkeleton = false;

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Recommended Candidates
          </motion.h1>

          <p className="text-slate-gray mt-2 text-lg font-bold italic opacity-50">
            기업에 최적화된 AI 기반 추천 결과입니다.
          </p>
        </header>

        <section className="space-y-8">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <div>
                <h2 className="text-midnight-ink text-2xl font-black uppercase">추천 지원자 목록</h2>
                <p className="text-slate-gray mt-1 text-sm font-bold italic opacity-40">
                  추천 점수 기준으로 높은 지원자부터 보여줘요.
                </p>
              </div>
            </div>
          </div>

          {/* ✅ 로딩 오래 걸릴 때: showSkeleton=true면 로딩 표시, false면 바로 리스트 보이게 */}
          {showSkeleton && isLoading && <LoadingState />}

          {/* ✅ 401이 아닐 때만 에러 UI */}
          {isError && !isUnauthorized && (
            <ErrorState description="데이터를 불러오지 못했습니다." onAction={refetch} />
          )}

          {/* ✅ 정상 or 401(개발 중)일 때 리스트/empty */}
          {!showSkeleton && isLoading ? (
            // 로딩 중에도 MOCK/기존 데이터 렌더
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6">
              {sortedCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onOpenResume={() => navigate(`/resumes/${candidate.id}`)}
                />
              ))}
            </motion.ul>
          ) : (
            <>
              {!isLoading && (!isError || isUnauthorized) && sortedCandidates.length === 0 && (
                <EmptyState
                  title="추천 후보자가 없습니다"
                  description="아직 매칭된 후보자가 없습니다."
                />
              )}

              {!isLoading && (!isError || isUnauthorized) && sortedCandidates.length > 0 && (
                <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6">
                  {sortedCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onOpenResume={() => navigate(`/resumes/${candidate.id}`)}
                    />
                  ))}
                </motion.ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
