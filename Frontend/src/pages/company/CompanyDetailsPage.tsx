import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button/Button';

interface JobPosting {
  id: number;
  title: string;
  deadline: string;
  tags: string[];
}

interface CompanyDetails {
  id: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  industry: string;
  employeeCount: string;
  revenue: string;
  website: string;
  isScrapped: boolean;
  scrapCount: number;
  enterpriseType: string;
  projects: {
    id: number;
    title: string;
    period: string;
    description: string;
  }[];
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface CompanyBackendData {
  cid: string;
  corpName: string;
  totPsncnt: string;
  busiSize: string;
  yrSalesAmt: string;
  corpAddr: string;
  homePg: string;
  busiCont: string;
  logo: string;
  scrapCount?: number;
  isScrapped?: boolean;
  projects?: {
    id: number;
    title: string;
    period: string;
    description: string;
  }[];
}

const DEFAULT_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239ca3af'%3ENo Logo%3C/text%3E%3C/svg%3E";

function CompanyDetailsPage() {
  const { companyId: paramId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [hasJobPostings, setHasJobPostings] = useState(true);
  const [toast, setToast] = useState<{ message: React.ReactNode; visible: boolean }>({
    message: '',
    visible: false,
  });

  const getRoleFromStorage = () => {
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.user?.role || 'APPLICANT';
      }
    } catch (error) {
      console.error(error);
      return 'APPLICANT';
    }
    return 'APPLICANT';
  };

  const userRole = getRoleFromStorage();
  const isApplicant = userRole.toUpperCase() === 'APPLICANT';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        let targetId = paramId;
        if (!targetId || targetId === 'undefined' || targetId === '1') {
          const listRes = await axios.get<ApiResponse<CompanyBackendData[]>>('/api/companies', {
            headers,
          });
          if (listRes.data.code === 1000 && listRes.data.data.length > 0) {
            targetId = listRes.data.data[0].cid;
          }
        }

        if (!targetId) {
          setIsLoading(false);
          return;
        }

        const [companyRes, jobsRes] = await Promise.all([
          axios.get<ApiResponse<CompanyBackendData>>(`/api/companies/${targetId}`, { headers }),
          axios
            .get<JobPosting[]>(`/api/job-postings/company/${targetId}`, { headers })
            .catch(() => ({ data: [] })),
        ]);

        if (companyRes.data.code === 1000) {
          const b = companyRes.data.data;
          setCompany({
            id: b.cid,
            name: b.corpName,
            logo: b.logo === 'string' || !b.logo ? DEFAULT_LOGO : b.logo,
            description: b.busiCont,
            location: b.corpAddr === 'string' ? b.totPsncnt : b.corpAddr,
            industry: 'IT / 소프트웨어 개발',
            employeeCount: b.totPsncnt,
            revenue: b.yrSalesAmt,
            website: b.homePg,
            enterpriseType: b.busiSize,
            isScrapped: b.isScrapped || false,
            scrapCount: b.scrapCount || 0,
            projects: b.projects || [],
          });
        }

        const rawJobsData = (jobsRes as { data?: JobPosting[] }).data;
        if (Array.isArray(rawJobsData)) {
          setJobPostings(rawJobsData);
        } else if (Array.isArray(jobsRes)) {
          setJobPostings(jobsRes);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [paramId]);

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top =
        element.getBoundingClientRect().top - document.body.getBoundingClientRect().top - 120;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const showToastMessage = (msg: React.ReactNode) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 4000);
  };

  const handleScrap = async () => {
    if (!company || isScraping || !isApplicant) return;
    const prev = company.isScrapped;
    setIsScraping(true);
    setCompany({
      ...company,
      isScrapped: !prev,
      scrapCount: prev ? company.scrapCount - 1 : company.scrapCount + 1,
    });

    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      if (prev) {
        await axios.delete(`/api/companies/${company.id}/scrap`, { headers });
      } else {
        await axios.post(`/api/companies/${company.id}/scrap`, {}, { headers });
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
    } catch (error) {
      console.error(error);
      setCompany({ ...company, isScrapped: prev, scrapCount: company.scrapCount });
      alert('스크랩 처리 중 오류가 발생했습니다.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleShare = async () => {
    if (!company) return;
    const data = {
      title: company.name,
      text: `${company.name} 기업 정보`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToastMessage('링크가 복사되었습니다.');
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-pure-white flex min-h-screen items-center justify-center">
        <div className="border-point-blue h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="bg-pure-white flex min-h-screen flex-col items-center justify-center">
        <p className="text-midnight-ink mb-4 text-xl font-bold">
          등록된 기업 정보를 찾을 수 없습니다.
        </p>
        <Button onClick={() => navigate(-1)}>뒤로 가기</Button>
      </div>
    );
  }

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
          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-8">
            <div className="flex flex-row items-end gap-12">
              <div
                className={`border-pure-white bg-pure-white h-40 w-40 shrink-0 overflow-hidden rounded-3xl border-4 shadow-xl transition-all ${!hasJobPostings && 'opacity-50 grayscale'}`}
              >
                <img
                  src={company.logo}
                  className="h-full w-full object-contain p-4"
                  alt="logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_LOGO;
                  }}
                />
              </div>
              <div className="flex w-full min-w-0 flex-1 flex-col items-start">
                <div className="mb-4 flex items-center justify-start gap-2">
                  <span
                    className={`${hasJobPostings ? 'bg-point-blue' : 'bg-white/20'} text-pure-white rounded-md px-4 py-1.5 text-sm font-black uppercase shadow-xl ring-1 ring-white/10 backdrop-blur-sm`}
                  >
                    {hasJobPostings ? '채용중' : '채용 없음'}
                  </span>
                  {company.enterpriseType && (
                    <span className="text-pure-white flex items-center gap-1 rounded-md bg-black/60 px-4 py-1.5 text-sm font-bold whitespace-nowrap shadow-xl ring-1 ring-white/30 backdrop-blur-sm">
                      {company.enterpriseType}
                    </span>
                  )}
                </div>
                <h1 className="text-pure-white line-clamp-2 text-left text-4xl font-black tracking-tighter">
                  {company.name}
                </h1>
                <p className="text-pure-white mt-4 text-left text-lg font-bold opacity-90">
                  {company.industry}
                </p>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3">
                <Button
                  size="lg"
                  className="bg-pure-white text-midnight-ink h-14 rounded-2xl px-6 text-base font-black shadow-lg transition-all hover:scale-105"
                  onClick={() => window.open(company.website, '_blank')}
                >
                  기업 홈페이지 〉
                </Button>

                <motion.button
                  disabled={!isApplicant || isScraping}
                  onClick={handleScrap}
                  whileHover={isApplicant && !isScraping ? { scale: 1.05 } : {}}
                  whileTap={isApplicant && !isScraping ? { scale: 0.95 } : {}}
                  className={`flex h-14 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-3 shadow-xl transition-all ${
                    !isApplicant
                      ? 'text-pure-white cursor-not-allowed border-transparent bg-white/10 opacity-40 grayscale'
                      : company.isScrapped
                        ? 'bg-pure-white border-red-500 text-red-500'
                        : 'bg-pure-white text-midnight-ink border-zinc-100'
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={company.isScrapped ? '#ef4444' : 'none'}
                    stroke={company.isScrapped ? '#ef4444' : 'currentColor'}
                    strokeWidth="2.5"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 3.975 3 5.5l7 7Z" />
                  </svg>
                  <span className="text-[11px] leading-none font-black">{company.scrapCount}</span>
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
                    { label: '산업', value: company.industry },
                    { label: '사원수', value: company.employeeCount },
                    { label: '기업구분', value: company.enterpriseType },
                    { label: '매출액', value: company.revenue },
                    { label: '위치', value: company.location },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border-silver-mist/40 flex items-center justify-between border-b pb-4"
                    >
                      <span className="text-slate-gray text-base font-bold">{item.label}</span>
                      <span className="text-midnight-ink text-right text-lg font-black">
                        {item.value || '-'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-gray border-silver-mist/30 mt-8 border-t pt-8 text-lg leading-relaxed font-medium">
                  {company.description}
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
                  {company.projects && company.projects.length > 0 ? (
                    company.projects.map((p) => (
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
                    <div className="text-slate-gray py-16 text-center text-xl font-bold">
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
                {jobPostings.length > 0 ? (
                  <div className="divide-silver-mist divide-y">
                    {jobPostings.map((job) => (
                      <div
                        key={job.id}
                        className="group flex cursor-pointer items-center justify-between py-8 first:pt-0 last:pb-0"
                        onClick={() => navigate(`/job-posts/${job.id}`)}
                      >
                        <div className="space-y-3">
                          <h4 className="group-hover:text-point-blue text-2xl font-black transition-colors">
                            {job.title}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {job.tags?.map((t) => (
                              <span
                                key={t}
                                className="bg-cloud-dancer text-slate-gray border-silver-mist/30 rounded-lg border px-3 py-1 text-xs font-bold"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="mb-2 text-lg font-black text-red-500">{job.deadline}</p>
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
                  <div className="text-slate-gray py-16 text-center text-xl font-bold">
                    진행 중인 공고가 없습니다.
                  </div>
                )}
              </section>
            </div>

            <aside className="col-span-4">
              <div className="sticky top-24 space-y-5">
                <div className="bg-pure-white rounded-4xl border border-zinc-100 p-8 shadow-sm">
                  <h3 className="text-midnight-ink text-md mb-6 font-black tracking-widest uppercase opacity-40">
                    Quick Menu
                  </h3>
                  <nav className="space-y-4">
                    {[
                      { id: 'section-info', label: '기업 정보' },
                      { id: 'section-projects', label: '프로젝트 내역' },
                      { id: 'section-jobs', label: '채용 공고' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToId(item.id)}
                        className="group flex w-full items-center transition-all active:scale-95"
                      >
                        <div className="bg-point-blue h-4 w-1 rounded-full" />
                        <span className="text-midnight-ink group-hover:text-point-blue px-4 font-bold">
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
                      className="w-full rounded-xl py-3 text-sm font-black shadow-[0_8px_15px_rgba(0,119,255,0.1)] hover:scale-[1.01]"
                    >
                      맨 위로 이동
                    </Button>
                  </div>
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
              className="bg-midnight-ink text-pure-white fixed bottom-10 left-1/2 z-100 rounded-2xl px-6 py-3 text-center text-sm font-bold shadow-2xl"
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
