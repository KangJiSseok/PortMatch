import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button/Button';
import heroBg from '../../assets/images/main/HERO_BG.avif';
import { useAuthStore } from '@/store/authStore';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop';
const FALLBACK_LOGO =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23E5E7EB" width="64" height="64"/%3E%3Ctext fill="%236B7280" font-family="sans-serif" font-size="14" dy="5" font-weight="bold" x="50%" y="50%" text-anchor="middle"%3ELOGO%3C/text%3E%3C/svg%3E';

const USER_QUICK_MENUS = [
  { id: 1, title: 'AI 매칭 리포트', icon: '📊', color: 'bg-blue-50' },
  { id: 2, title: '합격 이력서 분석', icon: '📝', color: 'bg-emerald-50' },
  { id: 3, title: '연봉 계산기', icon: '💰', color: 'bg-indigo-50' },
  { id: 4, title: '맞춤형 이력서 첨삭', icon: '🎙️', color: 'bg-orange-50' },
  { id: 5, title: '취준용 일정 관리', icon: '📅', color: 'bg-pink-50' },
  { id: 6, title: '실시간 채용 알림', icon: '🔔', color: 'bg-amber-50' },
];

const COMPANY_QUICK_MENUS = [
  { id: 1, title: 'AI 인재 매칭 리포트', icon: '🎯', color: 'bg-blue-50' },
  { id: 2, title: 'AI 공고 자동 생성', icon: '📄', color: 'bg-emerald-50' },
  { id: 3, title: '면접 평가지 템플릿', icon: '📋', color: 'bg-indigo-50' },
  { id: 4, title: '맞춤형 면접 질문 생성', icon: '🎙️', color: 'bg-orange-50' },
  { id: 5, title: '채용 전형 일정 관리', icon: '📅', color: 'bg-pink-50' },
  { id: 6, title: '신규 인재 실시간 알림', icon: '🔔', color: 'bg-amber-50' },
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

const MOCK_JOBS = [
  {
    id: 1,
    companyId: 1,
    title: '(주)신세계푸드 베이커리 제과 제품 개발 경력사원 모집',
    company: '신세계푸드',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Shinsegae_Logo.svg/1024px-Shinsegae_Logo.svg.png',
    tags: ['연봉 상위 1%', '유연근무'],
    deadline: '오늘마감',
    location: '서울 강남구',
  },
  {
    id: 2,
    companyId: 20,
    title: '[취업캠프] UXUI 디자인 / 프론트엔드 실무 프로젝트 과정',
    company: '이젠아카데미',
    logo: FALLBACK_LOGO,
    tags: ['정부지원', '취업률 90%'],
    deadline: '상시채용',
    location: '서울 서초구',
  },
  {
    id: 3,
    companyId: 21,
    title: '[AI 특화] 파이썬 기반 데이터 분석 및 AI 모델링 과정 모집',
    company: 'MBC아카데미',
    logo: FALLBACK_LOGO,
    tags: ['전액무료', '우수기관'],
    deadline: 'D-12',
    location: '서울 마포구',
  },
  {
    id: 4,
    companyId: 22,
    title: '카카오 클라우드 플랫폼 엔지니어 대규모 채용',
    company: '카카오',
    logo: FALLBACK_LOGO,
    tags: ['재택근무', '스톡옵션'],
    deadline: 'D-7',
    location: '경기 성남시',
  },
  {
    id: 5,
    companyId: 23,
    title: '비바리퍼블리카 Data Platform Engineer 채용',
    company: '토스',
    logo: FALLBACK_LOGO,
    tags: ['성과급', '자유휴가'],
    deadline: 'D-2',
    location: '서울 강남구',
  },
  {
    id: 6,
    companyId: 3,
    title: '네이버 Search Creative UI 디자인 신입/경력 채용',
    company: '네이버',
    logo: FALLBACK_LOGO,
    tags: ['식대지원', '최고의동료'],
    deadline: 'D-5',
    location: '경기 성남시',
  },
  {
    id: 7,
    companyId: 5,
    title: '당근마켓 광고 플랫폼 서버 엔지니어 (Python/Go)',
    company: '당근',
    logo: FALLBACK_LOGO,
    tags: ['성장지원', '수평적문화'],
    deadline: '상시채용',
    location: '서울 서초구',
  },
  {
    id: 8,
    companyId: 4,
    title: '현대자동차 자율주행 인지/판단 알고리즘 개발 전문가',
    company: '현대자동차',
    logo: FALLBACK_LOGO,
    tags: ['복지포인트', '기숙사지원'],
    deadline: 'D-10',
    location: '경기 화성시',
  },
  {
    id: 9,
    companyId: 8,
    title: '라인플러스 글로벌 핀테크 서비스 기획자(PM)',
    company: '라인플러스',
    logo: FALLBACK_LOGO,
    tags: ['풀리모트', '어학지원'],
    deadline: 'D-8',
    location: '경기 성남시',
  },
  {
    id: 10,
    companyId: 7,
    title: '쿠팡 Full-Stack Software Engineer (Logistics)',
    company: '쿠팡',
    logo: FALLBACK_LOGO,
    tags: ['글로벌환경', '사내카페'],
    deadline: '오늘마감',
    location: '서울 송파구',
  },
];

function MainPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const [trendIndex, setTrendIndex] = useState(0);

  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement;
    if (navbarInput) navbarInput.value = '';
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_LOGO;
  };
  const goToCompanyDetail = (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    navigate(`/companies/${companyId}`);
  };
  const goToJobPostDetail = (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    navigate(`/job-posts/${companyId}`);
  };

  const quickMenus = user?.role === 'COMPANY' ? COMPANY_QUICK_MENUS : USER_QUICK_MENUS;

  const getHeroContent = () => {
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
  };

  const heroContent = getHeroContent();
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
                      onClick={(e) => goToJobPostDetail(e, item.companyId)}
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

        {/* 역할에 따라 USER_QUICK_MENUS 또는 COMPANY_QUICK_MENUS 렌더링 */}
        <section className="mb-12 grid grid-cols-6 gap-4">
          {quickMenus.map((menu) => (
            <div
              key={menu.id}
              className={`group cursor-pointer rounded-2xl border border-transparent p-6 transition-all hover:border-zinc-100 hover:shadow-md ${menu.color}`}
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
            <button className="hover:text-midnight-ink text-sm font-bold text-zinc-400">
              더보기
            </button>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter">
              {user?.role === 'COMPANY' ? '실시간 인재 리스트' : '최근 채용 공고'}
            </h2>
            <button className="hover:text-midnight-ink flex items-center gap-1 text-sm font-black text-zinc-400">
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
            </button>
          </div>

          <div className="grid grid-cols-5 gap-6">
            {MOCK_JOBS.map((job) => (
              <motion.div
                key={job.id}
                whileHover={{ y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
                onClick={(e) => goToJobPostDetail(e, job.companyId)}
              >
                <div className="p-5 pb-0">
                  <div className="h-16 w-16 overflow-hidden rounded-xl border border-zinc-100 p-2">
                    <img
                      src={job.logo || FALLBACK_LOGO}
                      alt={job.company}
                      className="h-full w-full object-contain"
                      onError={handleLogoError}
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5 pt-4">
                  <div className="mb-4 space-y-2">
                    <div className="flex">
                      <p
                        onClick={(e) => goToCompanyDetail(e, job.companyId)}
                        className={`hover:text-point-blue relative flex max-w-full cursor-pointer text-[13px] font-bold text-zinc-400 transition-colors ${underlineEffect}`}
                      >
                        <span className="truncate">{job.company}</span>
                      </p>
                    </div>
                    <h3 className="text-midnight-ink group-hover:text-point-blue line-clamp-2 text-base leading-tight font-black transition-colors">
                      {job.title}
                    </h3>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-4">
                    <span className="text-sm font-bold text-zinc-400">{job.location}</span>
                    <span
                      className={`text-sm font-black ${job.deadline === '오늘마감' ? 'text-red-500' : 'text-zinc-800'}`}
                    >
                      {job.deadline}
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
