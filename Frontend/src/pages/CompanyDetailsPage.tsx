import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button/Button';

interface CompanyDetails {
  id: number;
  name: string;
  logo: string;
  description: string;
  location: string;
  industry: string;
  employeeCount: string;
  revenue: string;
  website: string;
  isScrapped: boolean;
  enterpriseType: string;
  projects: {
    id: number;
    title: string;
    period: string;
    description: string;
  }[];
  jobPostings: {
    id: number;
    title: string;
    deadline: string;
    tags: string[];
  }[];
}

const DUMMY_COMPANY: CompanyDetails = {
  id: 1,
  name: '넥스트웨이브 테크놀로지스',
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=200&auto=format&fit=crop',
  description:
    '넥스트웨이브 테크놀로지스는 차세대 AI 기반 데이터 분석 솔루션을 제공하는 혁신 기업입니다. 클라우드 네이티브 아키텍처를 기반으로 확장성 높은 서비스를 개발하며 사람이 중심이 되는 기술 생태계를 구축합니다.',
  location: '서울 강남구 테헤란로 518',
  industry: 'IT / 소프트웨어 개발',
  employeeCount: '150명',
  revenue: '320억 원',
  website: 'http://www.nwave.kr/main.html',
  isScrapped: false,
  enterpriseType: '중소기업',
  projects: [
    {
      id: 1,
      title: '글로벌 AI 데이터 매칭 플랫폼 구축',
      period: '2024.01 - 2024.12',
      description:
        '실시간 데이터 스트리밍 기반의 AI 매칭 엔진을 개발하여 매칭 정확도를 40% 이상 개선했습니다.',
    },
    {
      id: 2,
      title: '차세대 클라우드 보안 관제 시스템',
      period: '2023.06 - 2023.12',
      description:
        '멀티 클라우드 환경에서의 위협 탐지 및 자동 대응 시스템을 구축하여 보안 사고율을 낮췄습니다.',
    },
  ],
  jobPostings: [
    {
      id: 1,
      title: '시니어 프론트엔드 개발자 (React/TS)',
      deadline: 'D-5',
      tags: ['채용중', '경력 5년↑'],
    },
    {
      id: 2,
      title: '백엔드 개발자 (Node.js/Go)',
      deadline: 'D-12',
      tags: ['채용중', '정규직', '경력 3년↑'],
    },
  ],
};

function CompanyDetailsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetails | null>(DUMMY_COMPANY);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [hasJobPostings, setHasJobPostings] = useState(true);
  const [toast, setToast] = useState<{ message: React.ReactNode; visible: boolean }>({
    message: '',
    visible: false,
  });

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/companies/${companyId}/details`);
        if (res.data) {
          setCompany({ ...DUMMY_COMPANY, ...res.data });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [companyId]);

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const showToastMessage = (msg: React.ReactNode) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 4000);
  };

  const handleScrap = async () => {
    if (!company || isScraping) return;

    const previousScrappedState = company.isScrapped;
    const nextState = !previousScrappedState;

    if (!hasJobPostings) {
      if (nextState) {
        showToastMessage(
          <span>
            스크랩되었습니다!{' '}
            <Link to="/mypage" className="text-point-blue mx-1 font-black underline">
              마이페이지
            </Link>
            에서 확인해보세요.
          </span>,
        );
      }
      setCompany({ ...company, isScrapped: nextState });
      return;
    }

    setIsScraping(true);
    setCompany({ ...company, isScrapped: nextState });

    try {
      if (previousScrappedState) {
        await axios.delete(`/api/companies/${companyId}/scrap`);
      } else {
        await axios.post(`/api/companies/${companyId}/scrap`);
        showToastMessage(
          <span>
            스크랩되었습니다!{' '}
            <Link to="/mypage" className="text-point-blue mx-1 font-black underline">
              마이페이지
            </Link>
            에서 확인해보세요.
          </span>,
        );
      }
    } catch {
      setCompany({ ...company, isScrapped: previousScrappedState });
      alert('스크랩 처리 중 서버 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleShare = async () => {
    if (!company) return;
    const shareData = {
      title: company.name,
      text: `${company.name} 기업 정보를 확인해보세요!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToastMessage('링크가 클립보드에 복사되었습니다.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-pure-white flex min-h-screen items-center justify-center">
        <div className="border-point-blue h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    );
  }

  const heartPath =
    'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 3.975 3 5.5l7 7Z';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-pure-white text-midnight-ink min-h-screen min-w-7xl pb-20"
      >
        <div className="fixed top-24 right-8 z-50">
          <Button
            onClick={() => setHasJobPostings(!hasJobPostings)}
            className="bg-midnight-ink text-pure-white rounded-full px-6 text-sm font-black shadow-2xl transition-all active:scale-95"
          >
            {hasJobPostings ? '공고 모드 ON' : '공고 모드 OFF'}
          </Button>
        </div>

        <section className="bg-midnight-ink relative flex min-h-100 w-full flex-col justify-end overflow-hidden pb-16">
          <div className="from-point-blue/20 absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] via-transparent to-transparent" />
          <div className="bg-point-blue/10 absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-8">
            <div className="flex flex-row items-end gap-12">
              <div
                className={`border-pure-white bg-pure-white h-40 w-40 shrink-0 overflow-hidden rounded-3xl border-4 shadow-xl transition-all ${!hasJobPostings && 'opacity-50 grayscale'}`}
              >
                <img src={company?.logo} className="h-full w-full object-contain p-4" alt="logo" />
              </div>

              <div className="flex w-full min-w-0 flex-1 flex-col items-start">
                <div className="mb-4 flex items-center justify-start gap-2">
                  {hasJobPostings ? (
                    <>
                      <span className="bg-point-blue text-pure-white rounded-md px-4 py-1.5 text-sm font-black whitespace-nowrap uppercase shadow-xl">
                        채용중
                      </span>
                      <span className="text-pure-white flex items-center gap-1 rounded-md bg-black/60 px-4 py-1.5 text-sm font-bold whitespace-nowrap shadow-xl ring-1 ring-white/30 backdrop-blur-sm">
                        {company?.enterpriseType}
                      </span>
                    </>
                  ) : (
                    <span className="text-pure-white/60 rounded-md bg-white/20 px-4 py-1.5 text-sm font-black shadow-xl ring-1 ring-white/10 backdrop-blur-sm">
                      채용 없음
                    </span>
                  )}
                </div>
                <div className="w-full">
                  <h1 className="text-pure-white line-clamp-3 w-full text-left text-4xl leading-tight font-black tracking-tighter break-all">
                    {company?.name}
                  </h1>
                </div>
                <p className="text-pure-white mt-4 min-h-7 w-full text-left text-lg font-bold break-keep opacity-90">
                  {hasJobPostings ? company?.industry : '등록된 정보가 없습니다'}
                </p>
              </div>

              <div className="flex shrink-0 justify-end gap-3">
                <Button
                  size="lg"
                  disabled={!hasJobPostings}
                  className={`h-14.5 rounded-2xl px-6 text-base font-black whitespace-nowrap shadow-lg transition-all ${
                    hasJobPostings
                      ? 'bg-pure-white text-midnight-ink hover:bg-cloud-dancer hover:scale-105'
                      : 'text-pure-white/30 cursor-not-allowed border-none bg-white/10'
                  }`}
                  onClick={() => window.open(company?.website, '_blank')}
                >
                  기업 홈페이지 〉
                </Button>

                <motion.button
                  whileHover={
                    !isScraping
                      ? {
                          scale: 1.05,
                          backgroundColor: company?.isScrapped ? '#fff1f2' : '#f9fafb',
                        }
                      : {}
                  }
                  whileTap={!isScraping ? { scale: 0.95 } : {}}
                  onClick={handleScrap}
                  disabled={isScraping}
                  className={`flex h-14.5 w-14.5 shrink-0 items-center justify-center rounded-2xl border-2 shadow-xl transition-all ${
                    isScraping ? 'cursor-not-allowed opacity-50' : ''
                  } ${
                    company?.isScrapped
                      ? 'bg-pure-white border-red-500 text-red-500'
                      : 'bg-pure-white text-midnight-ink border-zinc-100'
                  }`}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={company?.isScrapped ? '#ef4444' : 'none'}
                    stroke={company?.isScrapped ? '#ef4444' : 'currentColor'}
                    strokeWidth="2.5"
                  >
                    <path d={heartPath} />
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-16 w-full max-w-7xl px-8">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-8 space-y-12">
              <section
                id="section-info"
                className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
              >
                <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  기업 정보
                </h2>
                <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                  {[
                    { label: '산업', value: hasJobPostings ? company?.industry : '-' },
                    { label: '사원수', value: hasJobPostings ? company?.employeeCount : '-' },
                    { label: '기업구분', value: hasJobPostings ? company?.enterpriseType : '-' },
                    { label: '매출액', value: hasJobPostings ? company?.revenue : '-' },
                    { label: '위치', value: hasJobPostings ? company?.location : '-' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border-silver-mist/40 flex min-w-0 items-center justify-between border-b pb-4"
                    >
                      <span className="text-slate-gray shrink-0 text-base font-bold">
                        {item.label}
                      </span>
                      <span className="text-midnight-ink min-w-0 truncate pl-4 text-right text-lg font-black tracking-tight">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-gray border-silver-mist/30 mt-8 border-t pt-8 text-lg leading-relaxed font-medium break-keep">
                  {hasJobPostings ? company?.description : '기업 상세 정보가 등록되지 않았습니다.'}
                </p>
              </section>

              <section
                id="section-projects"
                className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
              >
                <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  기업 프로젝트 내역
                </h2>
                <div className="space-y-6">
                  {hasJobPostings ? (
                    company?.projects?.map((p) => (
                      <div
                        key={p.id}
                        className="border-silver-mist bg-cloud-dancer/30 rounded-3xl border p-8"
                      >
                        <div className="mb-3 flex flex-row items-center justify-between gap-4">
                          <h3 className="min-w-0 flex-1 text-xl font-black break-keep">
                            {p.title}
                          </h3>
                          <span className="bg-pure-white text-slate-gray border-silver-mist/50 shrink-0 rounded-lg border px-3 py-1 text-xs font-black">
                            {p.period}
                          </span>
                        </div>
                        <p className="text-slate-gray text-base leading-relaxed font-medium break-keep">
                          {p.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-gray py-16 text-center text-base font-medium">
                      프로젝트 내역이 없습니다.
                    </div>
                  )}
                </div>
              </section>

              <section
                id="section-jobs"
                className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
              >
                <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  채용 중인 공고
                </h2>
                {hasJobPostings ? (
                  <div className="divide-silver-mist divide-y">
                    {company?.jobPostings?.map((job) => (
                      <div
                        key={job.id}
                        className="group flex flex-row items-center justify-between gap-4 py-8 first:pt-0 last:pb-0"
                        onClick={() => navigate(`/job-posts/${job.id}`)}
                      >
                        <div className="min-w-0 flex-1 space-y-3">
                          <h4 className="group-hover:text-point-blue text-2xl font-black break-keep transition-colors">
                            {job.title}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {job.tags?.map((t) => (
                              <span
                                key={t}
                                className="bg-cloud-dancer text-slate-gray border-silver-mist/30 rounded-lg border px-3 py-1 text-xs font-bold whitespace-nowrap"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                          <p className="text-lg font-black text-red-500">{job.deadline}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-sm font-black"
                          >
                            상세보기
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-slate-gray text-xl font-bold">
                      현재 진행 중인 공고가 없습니다.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <aside className="col-span-4 min-w-0">
              <div className="sticky top-24 space-y-5">
                <div className="bg-pure-white rounded-4xl border border-zinc-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="mb-6">
                    <h3 className="text-midnight-ink text-md font-black tracking-widest uppercase opacity-40">
                      Quick Menu
                    </h3>
                  </div>

                  <nav className="space-y-3">
                    {[
                      { id: 'section-info', label: '기업 정보' },
                      { id: 'section-projects', label: '프로젝트 내역' },
                      { id: 'section-jobs', label: '진행 중인 공고' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToId(item.id)}
                        className="group flex w-full items-center py-1 transition-all active:scale-[0.98]"
                      >
                        <div className="bg-point-blue h-4 w-1 shrink-0 rounded-full" />
                        <span className="text-midnight-ink group-hover:text-point-blue text-md px-4 font-bold transition-all group-hover:translate-x-0.5">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </nav>

                  <div className="mt-6 space-y-2 border-t border-zinc-50">
                    <Button
                      variant="outline"
                      onClick={handleShare}
                      className="w-full rounded-xl border-zinc-200 py-3 text-sm font-black transition-all hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                    >
                      공유하기
                    </Button>
                    <Button
                      variant="blue"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="w-full rounded-xl py-3 text-sm font-black shadow-[0_8px_15px_rgba(0,119,255,0.1)] transition-all hover:scale-[1.01]"
                    >
                      맨 위로 이동
                    </Button>
                  </div>
                </div>

                <div className="bg-midnight-ink text-pure-white rounded-4xl p-8 shadow-2xl transition-all duration-500">
                  <div className="mb-4">
                    <span className="bg-point-blue mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-black tracking-wider text-white uppercase">
                      AI Analysis
                    </span>
                    <h4 className="text-lg leading-tight font-black">AI 역량 분석 매칭</h4>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed font-medium opacity-70">
                    내 포트폴리오 기반 AI 리포트를 확인하세요.
                  </p>
                  <Button
                    className="bg-pure-white text-midnight-ink hover:bg-cloud-dancer w-full rounded-xl py-3.5 text-sm font-black transition-all"
                    onClick={() => navigate('/portfolios')}
                  >
                    리포트 확인하기
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <AnimatePresence>
          {toast.visible && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className="bg-midnight-ink text-pure-white fixed bottom-10 left-1/2 z-100 rounded-2xl px-6 py-3 text-center text-sm font-bold whitespace-nowrap shadow-2xl"
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

export default CompanyDetailsPage;
