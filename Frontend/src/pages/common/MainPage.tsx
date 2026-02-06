import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Calculator,
  FileText,
  Calendar,
  BarChart3,
  CheckSquare,
  Globe,
  Wallet,
  Pen,
  Search,
  FileDiff,
  FileDown,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import EmptyState from '../../components/states/EmptyState';
import heroBg from '../../assets/images/main/HERO_BG.avif';
import { useAuthStore } from '@/store/authStore';
import type { JobPostingDto } from '@/types/backendJobPosting';
import { portfolioApi } from '@/api/portfolioApi';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop';
const FALLBACK_LOGO =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23E5E7EB" width="64" height="64"/%3E%3Ctext fill="%236B7280" font-family="sans-serif" font-size="14" dy="5" font-weight="bold" x="50%" y="50%" text-anchor="middle"%3ELOGO%3C/text%3E%3C/svg%3E';

interface QuickMenu {
  id: number;
  title: string;
  icon: React.ElementType;
  link?: string;
}

interface RecommendationItem {
  userId: number;
  userName: string;
  portfolioId: number;
  portfolioName: string;
  similarity: number;
}

interface HistoryItem {
  id: number;
  query: string;
  createdAt: string;
  recommendations: RecommendationItem[];
}

interface SearchHistoryResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    histories: HistoryItem[];
  };
}

const RECOMMENDED_QUERIES = [
  '핀테크 보안 전문가',
  '대용량 트래픽 처리 백엔드',
  'React Native 앱 배포 경험',
  '3년차 이상 퍼포먼스 마케터',
  'SaaS B2B 영업 경력',
  'AWS 클라우드 아키텍트',
  '데이터 시각화 대시보드 경험',
  '초기 스타트업 리드 개발자',
  'Figma 능숙한 UI 디자이너',
  '글로벌 서비스 기획 경험',
  'Java Spring Boot 숙련자',
  '헬스케어 데이터 분석가',
  '유니티 3D 게임 클라이언트',
  '블록체인 스마트 컨트랙트',
  '영상 편집 및 모션 그래픽',
  'HR 인사 관리 5년차',
  '검색 엔진 최적화(SEO) 전문가',
  '자연어 처리(NLP) AI 모델링',
  'e-커머스 플랫폼 기획',
  'MSA 마이크로서비스 전환 경험',
];

const USER_QUICK_MENUS: QuickMenu[] = [
  { id: 1, title: '스피치 타이머', icon: Timer, link: '/support/speech-timer' },
  { id: 2, title: '실수령액 계산기', icon: Calculator, link: '/support/salary' },
  { id: 3, title: '협업 일정 관리', icon: Calendar, link: '/support/schedule' },
  { id: 4, title: '글로벌 단위 변환기', icon: Globe, link: '/support/unit-converter' },
  { id: 5, title: '면접 예상 질문', icon: FileText, link: '/support/interview-template' },
  { id: 6, title: '포트폴리오 첨삭', icon: Pen, link: '/support/portfolio-feedback' },
];

const COMPANY_QUICK_MENUS: QuickMenu[] = [
  { id: 1, title: '캐파 계산기', icon: BarChart3, link: '/support/sprint-capacity' },
  { id: 2, title: '인건비 계산기', icon: Wallet, link: '/support/employer-cost' },
  { id: 3, title: '협업 일정 관리', icon: Calendar, link: '/support/schedule' },
  { id: 4, title: '글로벌 단위 변환기', icon: Globe, link: '/support/unit-converter' },
  { id: 5, title: '문서 비교 분석', icon: FileDiff, link: '/support/doc-comparator' },
  { id: 6, title: '면접 평가지', icon: CheckSquare, link: '/support/interview-template' },
];

function MainPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();

  const [trendIndex, setTrendIndex] = useState(0);
  const [companyTrendIndex] = useState(0);

  const [hotPosts, setHotPosts] = useState<JobPostingDto[]>([]);
  const [isHotLoading, setIsHotLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState<JobPostingDto[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<HistoryItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [shuffledQueries, setShuffledQueries] = useState<string[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const calculateDDay = (endDate: string | null | undefined): string => {
    if (!endDate) return '상시채용';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(endDate);
    if (isNaN(target.getTime())) return '상시채용';
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (Number.isNaN(diffDays)) return '상시채용';
    if (diffDays === 0) return '오늘 마감';
    if (diffDays < 0) return '마감됨';
    return `D-${diffDays}`;
  };

  const handleReSearch = (query: string) => {
    navigate(`/company/recommend/candidates?q=${encodeURIComponent(query)}`);
  };

  const handlePdfView = async (portfolioId: number) => {
    try {
      const { url } = await portfolioApi.getPresignedUrl(portfolioId);
      if (!url) throw new Error('empty url');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
      alert('PDF 조회에 실패했습니다.');
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_LOGO;
  };

  const goToCompanyDetail = (e: React.MouseEvent, cid: string) => {
    e.stopPropagation();
    navigate(`/companies/${cid}`);
  };
  const goToJobPostDetail = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigate(`/job-posts/${id}`);
  };

  const handleSeeAll = () => {
    if (user?.role === 'COMPANY') {
      navigate('/company/recommend/candidates');
    } else {
      navigate('/job-postings');
    }
  };

  useEffect(() => {
    if (user?.role === 'COMPANY') {
      const shuffled = [...RECOMMENDED_QUERIES].sort(() => 0.5 - Math.random());
      setShuffledQueries(shuffled);
    }
  }, [user?.role]);

  useEffect(() => {
    const fetchHotPosts = async () => {
      try {
        const response = await fetch('/api/job-postings/hot');
        const json = await response.json();
        if (json.status && json.data) setHotPosts(json.data);
      } catch (error) {
        console.error('Failed to fetch hot posts', error);
      } finally {
        setIsHotLoading(false);
      }
    };

    const fetchRecentPosts = async () => {
      try {
        const response = await fetch('/api/job-postings/latest?page=0&size=10');
        const json = await response.json();
        if (json.status && json.data) setRecentPosts(json.data);
      } catch (error) {
        console.error('Failed to fetch recent posts', error);
      } finally {
        setIsRecentLoading(false);
      }
    };

    if (user?.role !== 'COMPANY') {
      fetchHotPosts();
      fetchRecentPosts();
    } else {
      setIsHotLoading(false);
      setIsRecentLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    const fetchSearchHistory = async () => {
      setIsSearchLoading(true);
      try {
        const response = await fetch('/api/portfolios/recommendations/users/history');
        const json: SearchHistoryResponse = await response.json();
        if (json.status && json.data && json.data.histories) {
          setRecentSearches(json.data.histories);
        }
      } catch (error) {
        console.error('Failed to fetch search history', error);
      } finally {
        setIsSearchLoading(false);
      }
    };

    if (user?.role === 'COMPANY') {
      fetchSearchHistory();
    }
  }, [user?.role]);
  const trendPosts = useMemo(() => {
    const chunks: JobPostingDto[][] = [];
    const trendSource = hotPosts.slice(0, 9);
    for (let i = 0; i < trendSource.length; i += 3) {
      chunks.push(trendSource.slice(i, i + 3));
    }
    return chunks;
  }, [hotPosts]);

  const companyQueryChunks = useMemo(() => {
    const chunks: string[][] = [];
    for (let i = 0; i < shuffledQueries.length; i += 3) {
      chunks.push(shuffledQueries.slice(i, i + 3));
    }
    return chunks;
  }, [shuffledQueries]);

  const quickMenus = user?.role === 'COMPANY' ? COMPANY_QUICK_MENUS : USER_QUICK_MENUS;

  const heroContent = (() => {
    if (!isLoggedIn)
      return {
        line1: '당신의 포트폴리오,',
        highlight: 'AI 정밀 분석',
        line2Suffix: '으로 길을 찾다.',
        button: '로그인 후 시작',
        link: '/login',
      };
    if (user?.role === 'COMPANY')
      return {
        line1: '기업을 위한 추천,',
        highlight: '적합한 인재',
        line2Suffix: '를 제안합니다.',
        button: '인재 탐색하기',
        link: '/company/recommend/candidates',
      };
    return {
      line1: '나만의 경쟁력,',
      highlight: 'AI 분석 리포트',
      line2Suffix: '를 확인하세요.',
      button: '포트폴리오 분석하기',
      link: '/portfolios',
    };
  })();

  const underlineEffect =
    "relative after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-[2px] after:bg-point-blue after:transition-all after:duration-300 hover:after:w-full";

  const getDDayColor = (dDay: string) => {
    if (dDay === '오늘 마감' || dDay === '마감됨') return 'text-red-600';
    return 'text-point-blue';
  };

  return (
    <div className="text-midnight-ink min-h-screen min-w-max bg-white">
      <div className="mx-auto w-350 px-6 pt-24 pb-20">
        {/* HERO SECTION */}
        <section className="mb-10 flex gap-6">
          <div className="relative flex h-55 flex-1 overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
            <div className="absolute inset-0 z-0">
              <img
                src={heroBg}
                alt="Hero"
                className="h-full w-full object-cover opacity-20"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-linear-to-r from-zinc-50 via-zinc-50/50 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col justify-center p-10">
              <h1 className="text-midnight-ink mb-6 text-3xl font-black tracking-tighter">
                {heroContent.line1} <span className="text-point-blue">{heroContent.highlight}</span>{' '}
                {heroContent.line2Suffix}
              </h1>
              <div className="flex">
                <Button
                  variant="blue"
                  className="rounded-xl px-10 py-4 text-xl font-black shadow-lg transition-all active:scale-95"
                  onClick={() => navigate(heroContent.link)}
                >
                  {heroContent.button}
                </Button>
              </div>
            </div>
          </div>

          <div className="h-55 w-100 rounded-4xl border border-zinc-100 bg-white px-6 py-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-black tracking-[0.2em] text-zinc-400 uppercase">
                {user?.role === 'COMPANY' ? 'Recommended Keywords' : 'Trend Pick'}
              </h3>
              <div className="flex gap-2">
                {user?.role === 'COMPANY'
                  ? null
                  : isHotLoading
                    ? [1, 2, 3].map((i) => (
                        <div key={i} className="h-2.5 w-2.5 rounded-full bg-zinc-100" />
                      ))
                    : trendPosts.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setTrendIndex(i)}
                          className={`h-2.5 w-2.5 rounded-full transition-all ${i === trendIndex ? 'bg-midnight-ink' : 'bg-zinc-200'}`}
                        />
                      ))}
              </div>
            </div>
            <div className="h-38">
              {user?.role === 'COMPANY' ? (
                companyQueryChunks.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={companyTrendIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      {companyQueryChunks[companyTrendIndex]?.map((query, idx) => (
                        <div
                          key={idx}
                          className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-50 bg-zinc-50/30 p-3 transition-all hover:bg-white hover:shadow-sm"
                          onClick={() => handleReSearch(query)}
                        >
                          <p className="text-midnight-ink flex-1 truncate text-sm font-bold">
                            {query}
                          </p>
                          <div className="flex items-center gap-1">
                            <Search size={14} className="text-point-blue" />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center space-y-3 rounded-xl bg-zinc-50/30">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
                  </div>
                )
              ) : isHotLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-11 w-full animate-pulse rounded-xl border border-zinc-50 bg-zinc-50/50"
                    />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={trendIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    {trendPosts[trendIndex]?.map((item: JobPostingDto) => {
                      const dDay = calculateDDay(item.endDate);
                      return (
                        <div
                          key={item.id}
                          className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-50 bg-zinc-50/30 p-3 transition-all hover:bg-white hover:shadow-sm"
                          onClick={(e) => goToJobPostDetail(e, item.id)}
                        >
                          <p className="text-midnight-ink flex-1 truncate text-sm font-bold">
                            {item.title}
                          </p>
                          <span className={`ml-2 text-sm font-black ${getDDayColor(dDay)}`}>
                            {dDay}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </section>

        {/* QUICK MENU */}
        <section className="mb-12 grid grid-cols-6 gap-4">
          {quickMenus.map((menu) => (
            <div
              key={menu.id}
              className="group hover:border-point-blue/30 hover:bg-point-blue/5 cursor-pointer rounded-2xl border border-zinc-100 bg-white p-6 transition-all hover:shadow-md"
              onClick={() => menu.link && navigate(menu.link)}
            >
              <div className="text-point-blue mb-3 transition-transform duration-300 group-hover:-translate-y-1">
                <menu.icon size={28} strokeWidth={2.5} />
              </div>
              <p className="text-midnight-ink text-sm font-black">{menu.title}</p>
            </div>
          ))}
        </section>

        {/* NOTICE */}
        <section className="mb-10">
          <div className="mb-8 flex items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <span className="bg-midnight-ink rounded px-2 py-1 text-[10px] font-black text-white">
              NOTICE
            </span>
            <p className="flex-1 truncate text-sm font-bold text-zinc-600">
              정식 오픈 기념 '프리미엄 멤버십 1개월 무료 체험' 이벤트 진행 중
            </p>
            <button
              onClick={() => navigate('/notices')}
              className="group hover:text-point-blue relative py-1 text-sm font-black text-zinc-400 transition-colors duration-300"
            >
              더보기
              <span className="bg-point-blue absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
            </button>
          </div>

          {/* MAIN LIST SECTION */}
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter">
              {user?.role === 'COMPANY' ? '최근 검색된 추천 인재' : '최근 채용 공고'}
            </h2>
            <button
              onClick={handleSeeAll}
              className="group hover:text-point-blue relative flex items-center gap-1 py-1 text-sm font-black text-zinc-400 transition-colors duration-300"
            >
              전체 보기{' '}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              <span className="bg-point-blue absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
            </button>
          </div>

          {user?.role === 'COMPANY' ? (
            <div className="space-y-12">
              {isSearchLoading ? (
                <div className="flex h-60 items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600"></div>
                </div>
              ) : recentSearches.length > 0 ? (
                recentSearches.slice(0, 2).map((history) => (
                  <div key={history.id} className="animate-fade-in-up">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="bg-point-blue/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <Search size={16} className="text-point-blue" />
                      </div>
                      <span className="text-midnight-ink text-lg font-black">
                        '{history.query}'
                      </span>
                      <span className="text-xs font-medium text-zinc-400">
                        {formatDate(history.createdAt)} 검색
                      </span>
                      {/* 재검색 버튼 */}
                      <button
                        onClick={() => handleReSearch(history.query)}
                        className="group flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-600 transition-all hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Search size={12} />
                        재검색
                      </button>
                    </div>

                    {/* 카드 리스트: 5개 제한, 그리드 */}
                    <div className="grid grid-cols-5 gap-6">
                      {history.recommendations && history.recommendations.length > 0 ? (
                        history.recommendations.slice(0, 5).map((candidate) => (
                          <motion.div
                            key={candidate.userId}
                            className="flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm"
                          >
                            <div className="flex flex-1 flex-col p-6 pt-6">
                              <div className="mb-4 space-y-1">
                                <p className="truncate text-lg font-black text-zinc-800">
                                  {candidate.userName}
                                </p>
                                <h3 className="text-midnight-ink line-clamp-2 text-sm leading-relaxed font-bold">
                                  {candidate.portfolioName}
                                </h3>
                              </div>

                              <div className="mt-auto border-t border-zinc-50 pt-5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-400">적합도</span>
                                  <span className="text-point-blue text-lg font-black">
                                    {Math.floor(candidate.similarity * 100)}점
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-100">
                                  <div
                                    className="bg-point-blue h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.floor(candidate.similarity * 100))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-auto bg-zinc-50 px-6 py-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePdfView(candidate.portfolioId);
                                }}
                                className="group/btn relative flex w-full items-center justify-center gap-1 overflow-hidden rounded-lg bg-zinc-700 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-600"
                              >
                                <FileDown size={14} />
                                포트폴리오 조회 (PDF)
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-5">
                          <EmptyState
                            title="추천 인재가 없습니다"
                            description="다른 검색어로 검색해보세요."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-60 flex-col items-center justify-center rounded-3xl border border-zinc-100 bg-zinc-50">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200">
                    <Search size={32} className="text-zinc-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-black text-zinc-600">
                    아직 검색 기록이 없으시네요
                  </h3>
                  <p className="mb-6 text-sm text-zinc-400">원하는 인재의 키워드를 검색해보세요.</p>
                  <Button
                    variant="blue"
                    className="rounded-xl px-6 py-3 font-bold"
                    onClick={() => navigate('/company/recommend/candidates')}
                  >
                    인재 검색하러 가기
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-80 grid-cols-5 gap-6">
              {isRecentLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 h-16 w-16 animate-pulse rounded-xl bg-zinc-100" />
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
                      <div className="h-6 w-full animate-pulse rounded bg-zinc-100" />
                      <div className="h-6 w-full animate-pulse rounded bg-zinc-100" />
                    </div>
                    <div className="mt-auto flex justify-between border-t border-zinc-50 pt-4">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
                      <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-100" />
                    </div>
                  </div>
                ))
              ) : recentPosts.length === 0 ? (
                <div className="col-span-5">
                  <EmptyState
                    title="등록된 채용 공고가 없습니다."
                    description="새로운 공고를 기다려주세요."
                  />
                </div>
              ) : (
                recentPosts.map((job: JobPostingDto) => {
                  const dDay = calculateDDay(job.endDate);
                  return (
                    <motion.div
                      key={job.id}
                      whileHover={{ y: -10 }}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition-all hover:shadow-xl"
                      onClick={(e) => goToJobPostDetail(e, job.id)}
                    >
                      <div className="p-5 pb-0">
                        <div className="h-16 w-16 overflow-hidden rounded-xl border border-zinc-100 p-2">
                          <img
                            src={
                              !job.company?.logo || job.company.logo === 'string'
                                ? FALLBACK_LOGO
                                : job.company.logo
                            }
                            alt={job.company?.corpName}
                            className="h-full w-full object-contain"
                            onError={handleLogoError}
                          />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5 pt-4">
                        <div className="mb-4 space-y-1">
                          <div className="flex">
                            <p
                              onClick={(e) => goToCompanyDetail(e, job.cid)}
                              className={`hover:text-point-blue relative flex max-w-full cursor-pointer text-[13px] font-bold text-zinc-400 transition-colors ${underlineEffect}`}
                            >
                              <span className="truncate">{job.company?.corpName || '기업명'}</span>
                            </p>
                          </div>
                          <h3 className="text-midnight-ink group-hover:text-point-blue line-clamp-2 min-h-10 text-base leading-tight font-black transition-colors">
                            {job.title}
                          </h3>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-4">
                          <span className="max-w-35 truncate text-sm font-bold text-zinc-400">
                            {job.company?.corpAddr || '지역 미정'}
                          </span>
                          <span
                            className={`text-sm font-black whitespace-nowrap ${getDDayColor(dDay)}`}
                          >
                            {dDay}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MainPage;
