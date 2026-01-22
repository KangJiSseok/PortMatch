import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button/Button';
import heroBg from '../assets/images/main/HERO_BG.avif';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop';

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
    {
      id: 4,
      companyId: 4,
      company: '현대자동차',
      title: '자율주행 소프트웨어 개발',
      deadline: 'D-10',
    },
    {
      id: 5,
      companyId: 5,
      company: '당근마켓',
      title: '백엔드 엔지니어 (Kotlin)',
      deadline: '상시',
    },
    { id: 6, companyId: 6, company: '토스', title: '데이터 분석가 (Product)', deadline: 'D-2' },
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
    image:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1926&auto=format&fit=crop',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Shinsegae_Logo.svg/1024px-Shinsegae_Logo.svg.png',
    tags: ['연봉 상위 1%', '유연근무'],
    deadline: '오늘마감',
    location: '서울 강남구',
  },
  {
    id: 2,
    companyId: 20,
    title: '[취업캠프] UXUI 디자인 / 프론트엔드 실무 프로젝트 과정',
    company: '이젠아카데미 DX교육센터',
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop',
    logo: 'https://via.placeholder.com/100/10B981/FFFFFF?text=EZEN',
    tags: ['정부지원', '취업률 90%'],
    deadline: '상시채용',
    location: '서울 서초구',
  },
  {
    id: 3,
    companyId: 21,
    title: '[AI 특화] 파이썬 기반 데이터 분석 및 AI 모델링 과정 모집',
    company: 'MBC아카데미 컴퓨터교육센터',
    image: '',
    logo: 'https://via.placeholder.com/100/EF4444/FFFFFF?text=MBC',
    tags: ['전액무료', '우수기관'],
    deadline: 'D-12',
    location: '서울 마포구',
  },
  {
    id: 4,
    companyId: 22,
    title: '카카오 클라우드 플랫폼 엔지니어 대규모 채용',
    company: '카카오',
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop',
    logo: 'https://via.placeholder.com/100/FEE500/000000?text=KAKAO',
    tags: ['재택근무', '스톡옵션'],
    deadline: 'D-7',
    location: '경기 성남시',
  },
];

function MainPage() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole');
  const [trendIndex, setTrendIndex] = useState(0);

  useEffect(() => {
    const navbarInput = document.getElementById('navbar-search-input') as HTMLInputElement;
    if (navbarInput) {
      navbarInput.value = '';
    }
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  const goToCompanyDetail = (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    navigate(`/companies/${companyId}`);
  };

  const goToJobPostDetail = (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    navigate(`/job-posts/${companyId}`);
  };

  const getHeroContent = () => {
    if (!isLoggedIn)
      return {
        line1: '당신의 포트폴리오,',
        highlight: 'AI 정밀 분석',
        line2Suffix: '으로 길을 찾다.',
        button: '로그인하고 분석 시작하기',
        link: '/login',
      };
    if (userRole === 'corporate')
      return {
        line1: '기업을 위한 AI 추천,',
        highlight: '가장 적합한 인재',
        line2Suffix: '를 제안합니다.',
        button: '인재 탐색 시작하러 가기',
        link: '/recommend/companies',
      };
    return {
      line1: '나만의 경쟁력,',
      highlight: 'AI 정밀 분석',
      line2Suffix: ' 리포트를 확인하세요.',
      button: '포트폴리오 분석 결과 보기',
      link: '/portfolios',
    };
  };

  const heroContent = getHeroContent();

  const newLocal = 'absolute bottom-1 left-0 -z-10 h-2 w-full bg-midnight-ink/10';

  const underlineEffect =
    "relative after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-[2px] after:bg-point-blue after:transition-all after:duration-300 hover:after:w-full";

  return (
    <div className="text-midnight-ink min-h-screen bg-white pt-24 pb-20">
      <section className="mx-auto mb-12 max-w-6xl px-6">
        <div className="flex min-h-95 overflow-hidden rounded-4xl border border-zinc-100 bg-zinc-50 shadow-sm">
          <div className="relative flex flex-1 flex-col justify-center overflow-hidden p-10 lg:p-14">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={heroBg}
                alt="Hero"
                className="h-full w-full object-cover opacity-25 transition-transform duration-1000 hover:scale-105"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-linear-to-r from-zinc-50 via-zinc-50/70 to-transparent" />
            </div>

            <div className="relative z-10">
              <h1 className="text-midnight-ink mb-8 text-3xl leading-tight font-black tracking-tighter lg:text-4xl">
                {heroContent.line1}
                <br />
                <span className="text-point-blue relative inline-block">
                  {heroContent.highlight}
                  <span className={newLocal} />
                </span>
                {heroContent.line2Suffix}
              </h1>
              <div className="flex">
                <Button
                  variant="blue"
                  className="rounded-2xl border-2 px-14 py-6 text-xl font-black shadow-2xl transition-all duration-300 active:scale-95"
                  onClick={() => navigate(heroContent.link)}
                >
                  {heroContent.button}
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden w-90 flex-col justify-center border-l border-zinc-200 bg-white p-8 lg:flex">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-black tracking-[0.2em] text-zinc-400 uppercase">
                Trend Pick
              </h3>
              <div className="flex gap-2.5">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setTrendIndex(i)}
                    className={`h-3.5 w-3.5 rounded-full transition-all ${i === trendIndex ? 'bg-midnight-ink scale-110 shadow-sm' : 'bg-zinc-200 hover:bg-zinc-300'}`}
                  />
                ))}
              </div>
            </div>
            <div className="min-h-60">
              <AnimatePresence mode="wait">
                <motion.div
                  key={trendIndex}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  {RECOMMENDATION_SETS[trendIndex].map((item) => (
                    <div
                      key={item.id}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-100 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-md"
                      onClick={(e) => goToJobPostDetail(e, item.companyId)}
                    >
                      <div className="mr-3 min-w-0 flex-1 space-y-1">
                        <p className="text-midnight-ink truncate text-base font-bold">
                          {item.title}
                        </p>
                        <p
                          onClick={(e) => goToCompanyDetail(e, item.companyId)}
                          className={`hover:text-point-blue inline-block cursor-pointer text-sm font-medium text-zinc-500 transition-colors duration-300 ${underlineEffect}`}
                        >
                          {item.company}
                        </p>
                      </div>
                      <svg
                        className="group-hover:text-midnight-ink shrink-0 text-zinc-300 transition-colors"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-end justify-between border-b border-zinc-100 pb-5">
          <div className="space-y-1">
            <h2 className="text-midnight-ink text-2xl font-black tracking-tighter">
              최근 채용 공고
            </h2>
          </div>
          <button className="group text-md hover:text-midnight-ink flex items-center gap-1 font-bold text-zinc-400 transition-colors">
            전체 보기
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transition-transform group-hover:translate-x-1"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_JOBS.map((job) => (
            <motion.div
              key={job.id}
              whileHover={{ y: -5 }}
              className="group flex flex-col overflow-hidden rounded-[20px] border border-zinc-100 bg-white shadow-sm transition-all hover:shadow-lg"
              onClick={(e) => goToJobPostDetail(e, job.companyId)}
            >
              <div className="relative h-28 w-full overflow-hidden">
                <img
                  src={job.image || FALLBACK_IMAGE}
                  alt="job"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-black/5" />
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 min-w-0 flex-1 space-y-1.5">
                  <p
                    onClick={(e) => goToCompanyDetail(e, job.companyId)}
                    className={`hover:text-point-blue inline-block cursor-pointer text-sm font-bold text-zinc-400 transition-colors duration-300 ${underlineEffect}`}
                  >
                    {job.company}
                  </p>
                  <h3 className="text-midnight-ink line-clamp-2 text-base leading-snug font-black">
                    {job.title}
                  </h3>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-3">
                  <span className="text-xs font-bold text-zinc-400">{job.location}</span>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-sm font-black ${job.deadline === '오늘마감' ? 'text-red-500' : 'text-zinc-800'}`}
                    >
                      {job.deadline}
                    </span>
                    <button className="text-zinc-300 transition-colors hover:text-zinc-800">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MainPage;
