import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
    headline: 'React/TypeScript 기반 컴포넌트 설계 경험이 풍부하고 협업 커뮤니케이션이 강점입니다.',
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
      className="group flex flex-col gap-6 rounded-4xl border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md md:flex-row md:items-center"
    >
      {/* 좌측(메인 정보) */}
      <div className="flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-midnight-ink text-2xl font-black tracking-tight">
            {candidate.name}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {candidate.stacks.map((stack) => (
              <span
                key={stack}
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-500"
              >
                {stack}
              </span>
            ))}
          </div>
        </div>

        <p className="text-base leading-relaxed text-zinc-600">{candidate.headline}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {candidate.keywords.map((k) => (
            <span
              key={k}
              className="rounded-full border border-zinc-100 bg-white px-3 py-1 text-[11px] font-black text-zinc-400"
            >
              #{k}
            </span>
          ))}
        </div>
      </div>

      {/* 우측(매칭 점수 + 이력서 확인) - ✅ 세로 가운데 정렬 + 폰트 동일 + 배경 제거 */}
      <div className="flex items-center gap-10">
        <span className="text-midnight-ink text-xl font-black">
          매칭 {candidate.matchScore}
        </span>

        <button
          onClick={onOpenResume}
          className="flex min-w-[160px] flex-col items-center justify-center"
        >
          <span className="mb-1 text-[11px] font-black tracking-[0.2em] text-zinc-400 uppercase group-hover:text-point-blue">
            Resume
          </span>
          <span className="text-midnight-ink text-xl font-black group-hover:text-point-blue">
            이력서 확인
          </span>
        </button>
      </div>
    </motion.li>
  );
}

export default function RecommendCandidatesPage() {
  const navigate = useNavigate();
  const devMode = import.meta.env.DEV;

  // ✅ devMode에서는 API 호출 자체를 막음
  const { data, isLoading, isError, refetch } = useRecommendedCandidates({}, !devMode);

  const candidates = devMode ? MOCK_CANDIDATES : (data ?? []);

  // Navbar 검색어 초기화
  useEffect(() => {
    const input = document.getElementById('navbar-search-input') as HTMLInputElement | null;
    if (input) input.value = '';
  }, []);

  const sortedCandidates = useMemo(
    () => [...candidates].sort((a, b) => b.matchScore - a.matchScore),
    [candidates],
  );

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="mx-auto w-[1200px] px-6">
        <header className="mb-16">
          <h1 className="text-midnight-ink mb-4 text-5xl font-black">
            추천 후보자 리스트
          </h1>
          <p className="text-xl text-zinc-500">
            기업에 최적화된 AI 기반 후보자 추천 결과입니다.
          </p>
        </header>

        {/* ✅ devMode에서는 로딩/에러 UI 숨김 */}
        {!devMode && isLoading && <LoadingState />}
        {!devMode && isError && (
          <ErrorState description="데이터를 불러오지 못했습니다." onAction={refetch} />
        )}

        {!devMode && !isLoading && !isError && sortedCandidates.length === 0 && (
          <EmptyState title="추천 후보자가 없습니다" description="아직 매칭된 후보자가 없습니다." />
        )}

        {sortedCandidates.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6"
          >
            {sortedCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onOpenResume={() => navigate(`/resumes/${candidate.id}`)} // TODO: 실제 라우트에 맞게 수정
              />
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
