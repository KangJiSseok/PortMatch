import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button/Button';
import heroBg from '../../assets/images/main/HERO_BG.avif';
import { useAuthStore } from '@/store/authStore';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop';
const FALLBACK_LOGO =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23E5E7EB" width="64" height="64"/%3E%3Ctext fill="%236B7280" font-family="sans-serif" font-size="14" dy="5" font-weight="bold" x="50%" y="50%" text-anchor="middle"%3ELOGO%3C/text%3E%3C/svg%3E';

interface JobPost {
  id: string;
  title: string;
  cid: string;
  endDate: string;
  company: {
    corpName: string;
    totPsncnt: string;
    logo: string;
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
  icon: string;
  color: string;
  link?: string;
}

const USER_QUICK_MENUS: QuickMenu[] = [
  { id: 1, title: 'AI 매칭 리포트 X', icon: '📊', color: 'bg-blue-50' },
  { id: 2, title: '실수령액 계산기', icon: '💰', color: 'bg-emerald-50', link: '/support/salary' },
  {
    id: 3,
    title: '예상 면접 질문 정리',
    icon: '📋',
    color: 'bg-indigo-50',
    link: '/support/interview-template',
  },
  { id: 4, title: '맞춤형 이력서 첨삭 X', icon: '🎙️', color: 'bg-orange-50' },
  { id: 5, title: '협업 일정 관리', icon: '📅', color: 'bg-pink-50', link: '/support/schedule' },
  { id: 6, title: '실시간 채용 알림 X', icon: '🔔', color: 'bg-amber-50' },
];

const COMPANY_QUICK_MENUS: QuickMenu[] = [
  { id: 1, title: 'AI 인재 매칭 리포트 X', icon: '🎯', color: 'bg-blue-50' },
  { id: 2, title: '실수령액 계산기', icon: '💰', color: 'bg-emerald-50', link: '/support/salary' },
  {
    id: 3,
    title: '면접 평가지 템플릿',
    icon: '📋',
    color: 'bg-indigo-50',
    link: '/support/interview-template',
  },
  { id: 4, title: '맞춤형 면접 질문 생성 X', icon: '🎙️', color: 'bg-orange-50' },
  { id: 5, title: '협업 일정 관리', icon: '📅', color: 'bg-pink-50', link: '/support/schedule' },
  { id: 6, title: '신규 인재 실시간 알림 X', icon: '🔔', color: 'bg-amber-50' },
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

const RECOMMENDATION_SETS = [
  [
    {
      id: 1,
      companyId: 1,
      company: '신세계푸드',
      title: '베이커리 제품 개발 경력',
      deadline: '오늘마감',
    },
    { id: 2, companyId: 2, company: '삼성전자', title: '클라우드 아키텍트 채용', deadline: 'D-5' },
    { id: 3, companyId: 3, company: '네이버', title: 'UI/UX 프로덕트 디자이너', deadline: '상시' },
  ],
  [
    { id: 4, companyId: 4, company: '현대자동차', title: '자율주행 SW 개발', deadline: 'D-10' },
    { id: 5, companyId: 5, company: '당근마켓', title: '백엔드 엔지니어', deadline: '상시' },
    { id: 6, companyId: 6, company: '토스', title: '데이터 분석가', deadline: 'D-2' },
  ],
  [
    { id: 7, companyId: 7, company: '쿠팡', title: '물류 시스템 기획자', deadline: 'D-14' },
    { id: 8, companyId: 8, company: '라인플러스', title: '글로벌 서비스 기획', deadline: '상시' },
    { id: 9, companyId: 9, company: '배달의민족', title: '프론트엔드 개발자', deadline: 'D-4' },
  ],
];

function MainPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const [trendIndex, setTrendIndex] = useState(0);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement;
    if (navbarInput) navbarInput.value = '';

    if (user?.role !== 'COMPANY') {
      fetchJobPosts();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  const fetchJobPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/job-postings');
      const json = await response.json();
      if (json && Array.isArray(json.data)) setJobPosts(json.data);
    } catch (error) {
      console.error(error);
      setJobPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
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
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setTrendIndex(i)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${i === trendIndex ? 'bg-midnight-ink' : 'bg-zinc-200'}`}
                  />
                ))}
              </div>
            </div>
            <div className="h-30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={trendIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {RECOMMENDATION_SETS[trendIndex].map((item) => (
                    <div
                      key={item.id}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-50 bg-zinc-50/30 p-3 transition-all hover:bg-white hover:shadow-sm"
                      onClick={(e) => goToJobPostDetail(e, String(item.id))}
                    >
                      <p className="text-midnight-ink flex-1 truncate text-sm font-bold">
                        {item.title}
                      </p>
                      <span className="text-point-blue ml-2 text-sm font-black">
                        {item.deadline}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="mb-12 grid grid-cols-6 gap-4">
          {quickMenus.map((menu) => (
            <div
              key={menu.id}
              className={`group cursor-pointer rounded-2xl border border-transparent p-6 transition-all hover:border-zinc-100 hover:shadow-md ${menu.color}`}
              onClick={() => menu.link && navigate(menu.link)}
            >
              <div className="mb-3 text-3xl">{menu.icon}</div>
              <p className="group-hover:text-midnight-ink text-sm font-black text-zinc-700">
                {menu.title}
              </p>
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
              onClick={() => navigate('/support/notices')}
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

          <div className="grid grid-cols-5 gap-6">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-3xl border border-zinc-100 bg-zinc-50"
                  />
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
                              job.company?.logo === 'string' || !job.company?.logo
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
                        <div className="mb-4 space-y-2">
                          <div className="flex">
                            <p
                              onClick={(e) => goToCompanyDetail(e, job.cid)}
                              className={`hover:text-point-blue relative flex max-w-full cursor-pointer text-[13px] font-bold text-zinc-400 transition-colors ${underlineEffect}`}
                            >
                              <span className="truncate">{job.company?.corpName || '기업명'}</span>
                            </p>
                          </div>
                          <h3 className="text-midnight-ink group-hover:text-point-blue line-clamp-2 h-10 text-base leading-tight font-black transition-colors">
                            {job.title}
                          </h3>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-4">
                          <span className="max-w-25 truncate text-sm font-bold text-zinc-400">
                            {job.company?.totPsncnt || '지역 미정'}
                          </span>
                          <span className="text-sm font-black text-zinc-800">{job.endDate}</span>
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
