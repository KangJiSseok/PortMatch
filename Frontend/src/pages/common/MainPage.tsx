import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Calculator,
  FileText,
  Mic,
  Calendar,
  BarChart3,
  CheckSquare,
  Globe,
  TrendingUp,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import heroBg from '../../assets/images/main/HERO_BG.avif';
import { useAuthStore } from '@/store/authStore';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop';
const FALLBACK_LOGO =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23E5E7EB" width="64" height="64"/%3E%3Ctext fill="%236B7280" font-family="sans-serif" font-size="14" dy="5" font-weight="bold" x="50%" y="50%" text-anchor="middle"%3ELOGO%3C/text%3E%3C/svg%3E';

interface JobPost {
  id: string;
  title: string;
  cid: string;
  detail: string;
  endDate: string;
  active: number;
  company: {
    corpName: string;
    logo: string;
    corpAddr: string;
  };
}

interface Talent {
  id: number;
  name: string;
  position: string;
  experience: string;
  tags: string[];
  avatar: string;
}

interface QuickMenu {
  id: number;
  title: string;
  icon: React.ElementType;
  link?: string;
}

const USER_QUICK_MENUS: QuickMenu[] = [
  { id: 1, title: '스피치 타이머', icon: Timer, link: '/support/speech-timer' },
  { id: 2, title: '실수령액 계산기', icon: Calculator, link: '/support/salary' },
  { id: 3, title: '협업 일정 관리', icon: Calendar, link: '/support/schedule' },
  { id: 4, title: '글로벌 단위 변환기', icon: Globe, link: '/support/unit-converter' },
  { id: 5, title: '면접 예상 질문', icon: FileText, link: '/support/interview-template' },
  { id: 6, title: '이력서 첨삭', icon: Mic, link: '/support/resume-feedback' },
];

const COMPANY_QUICK_MENUS: QuickMenu[] = [
  { id: 1, title: '캐파 계산기', icon: BarChart3, link: '/support/sprint-capacity' },
  { id: 2, title: '인건비 계산기', icon: TrendingUp, link: '/support/employer-cost' },
  { id: 3, title: '협업 일정 관리', icon: Calendar, link: '/support/schedule' },
  { id: 4, title: '글로벌 단위 변환기', icon: Globe, link: '/support/unit-converter' },
  { id: 5, title: '면접 평가지', icon: CheckSquare, link: '/support/interview-template' },
  { id: 6, title: '면접 질문 생성', icon: Mic, link: '/support/interview-generator' },
];

const MOCK_TALENTS: Talent[] = [
  {
    id: 1,
    name: '김철수',
    position: 'Full-Stack Developer',
    experience: '경력 5년',
    tags: ['React', 'Node.js', 'AWS'],
    avatar: '👤',
  },
  {
    id: 2,
    name: '이영희',
    position: 'UI/UX Designer',
    experience: '경력 3년',
    tags: ['Figma', 'Protopie'],
    avatar: '🎨',
  },
  {
    id: 3,
    name: '박지민',
    position: 'Backend Engineer',
    experience: '신입',
    tags: ['Java', 'Spring Boot', 'MySQL'],
    avatar: '💻',
  },
  {
    id: 4,
    name: '최유진',
    position: 'Product Manager',
    experience: '경력 7년',
    tags: ['Agile', 'Jira'],
    avatar: '📋',
  },
  {
    id: 5,
    name: '정호석',
    position: 'Data Scientist',
    experience: '경력 2년',
    tags: ['Python', 'PyTorch'],
    avatar: '📊',
  },
];

function MainPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const [trendIndex, setTrendIndex] = useState(0);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [trendPosts, setTrendPosts] = useState<JobPost[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement;
    if (navbarInput) navbarInput.value = '';

    fetchJobPosts();
  }, []);

  const fetchJobPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/job-postings');
      const json = await response.json();
      if (json && Array.isArray(json.data)) {
        const activePosts = json.data.filter((post: JobPost) => post.active === 1);
        setJobPosts(activePosts);

        const chunks: JobPost[][] = [];
        const trendSource = activePosts.slice(0, 9);
        for (let i = 0; i < trendSource.length; i += 3) {
          chunks.push(trendSource.slice(i, i + 3));
        }
        setTrendPosts(chunks);
      }
    } catch (error) {
      console.error(error);
      setJobPosts([]);
      setTrendPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDDay = (endDate: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(endDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘 마감';
    if (diffDays < 0) return '마감됨';
    return `D-${diffDays}`;
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
  const goToJobPostDetail = (e: React.MouseEvent, id: string) => {
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
        link: '/recommend/companies',
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

  return (
    <div className="text-midnight-ink min-h-screen min-w-max bg-white">
      <div className="mx-auto w-350 px-6 pt-24 pb-20">
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
                Trend Pick
              </h3>
              <div className="flex gap-2">
                {loading
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
              {loading ? (
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
                    {trendPosts[trendIndex]?.map((item) => {
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
                          <span
                            className={`ml-2 text-sm font-black ${
                              dDay === '오늘 마감' ? 'text-red-600' : 'text-point-blue'
                            }`}
                          >
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

        <section className="mb-10">
          <div className="mb-8 flex items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <span className="bg-midnight-ink rounded px-2 py-1 text-[10px] font-black text-white">
              NOTICE
            </span>
            <p className="flex-1 truncate text-sm font-bold text-zinc-600">
              새로운 AI 매칭 엔진 v2.0 업데이트 안내 (2026.01.22)
            </p>
            <button
              onClick={() => navigate('/notices')}
              className="group hover:text-point-blue relative py-1 text-sm font-black text-zinc-400 transition-colors duration-300"
            >
              더보기
              <span className="bg-point-blue absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
            </button>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter">
              {user?.role === 'COMPANY' ? '실시간 추천 인재' : '최근 채용 공고'}
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

          <div className="grid min-h-80 grid-cols-5 gap-6">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
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
              : user?.role === 'COMPANY'
                ? MOCK_TALENTS.map((talent) => (
                    <motion.div
                      key={talent.id}
                      whileHover={{ y: -10 }}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm transition-all hover:shadow-xl"
                    >
                      <div className="mb-4 flex h-20 w-20 items-center justify-center self-center rounded-2xl border border-zinc-100 bg-zinc-50 text-4xl">
                        {talent.avatar}
                      </div>
                      <div className="mb-4 space-y-1 text-center">
                        <h3 className="text-midnight-ink text-lg font-black">{talent.name}</h3>
                        <p className="text-point-blue text-sm font-bold">{talent.position}</p>
                        <p className="text-xs font-bold text-zinc-400">{talent.experience}</p>
                      </div>
                      <div className="mt-auto flex flex-wrap justify-center gap-1">
                        {talent.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))
                : jobPosts.map((job) => (
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
                          <span className="text-point-blue text-sm font-black whitespace-nowrap">
                            {calculateDDay(job.endDate)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MainPage;
