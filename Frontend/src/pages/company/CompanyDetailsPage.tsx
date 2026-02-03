import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Globe, MapPin, Building2 } from 'lucide-react';
import Button from '../../components/Button/Button';

interface UserData {
  userId: number;
  email: string;
  name: string;
  role: string;
}

interface ApiResponse<T> {
  status: boolean;
  code: number;
  message: string;
  data: T;
}

interface Project {
  id: number;
  title: string;
  period: string;
  description: string;
}

interface JobPosting {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  detail: string;
  jobType: number;
}

interface CompanyDetails {
  id: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  industry: string;
  employeeCount: string;
  website: string;
  isScrapped: boolean;
  projects: Project[];
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
  isScrapped?: boolean;
  projects?: Project[];
}

const DEFAULT_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239ca3af'%3ENo Logo%3C/text%3E%3C/svg%3E";

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

function CompanyDetailsPage() {
  const { companyId: paramId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [toast, setToast] = useState<{ message: React.ReactNode; visible: boolean }>({
    message: '',
    visible: false,
  });

  const isApplicant = currentUser?.role === 'APPLICANT';

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setIsLoading(true);

      const axiosConfig = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const userPromise = (async () => {
        try {
          const res = await axios.get<ApiResponse<UserData>>('/api/auth/me', axiosConfig);
          if ((res.data.code === 1000 || res.data.code === 0) && res.data.data) {
            return res.data.data;
          }
          return null;
        } catch {
          return null;
        }
      })();

      let targetId = paramId;
      if (!targetId || targetId === 'undefined') {
        try {
          const listRes = await axios.get<ApiResponse<CompanyBackendData[]>>(
            '/api/companies',
            axiosConfig,
          );
          if (
            (listRes.data.code === 1000 || listRes.data.code === 0) &&
            listRes.data.data.length > 0
          )
            targetId = listRes.data.data[0].cid;
        } catch (e) {
          console.error(e);
        }
      }

      if (!targetId) {
        setIsLoading(false);
        return;
      }

      try {
        const [fetchedUser, companyRes, jobsRes] = await Promise.all([
          userPromise,
          axios.get<ApiResponse<CompanyBackendData>>(`/api/companies/${targetId}`, axiosConfig),
          axios
            .get<ApiResponse<JobPosting[]>>(`/api/job-postings/company/${targetId}`, axiosConfig)
            .catch(() => ({
              data: {
                code: 0,
                message: '',
                data: [],
                status: false,
              } as ApiResponse<JobPosting[]>,
            })),
        ]);

        if (fetchedUser) {
          setCurrentUser(fetchedUser);
        }

        if (companyRes.data.code === 1000 || companyRes.data.code === 0) {
          const b = companyRes.data.data;
          let initialIsScrapped = false;

          if (fetchedUser && fetchedUser.role === 'APPLICANT') {
            try {
              const scrapCheckRes = await axios.get<ApiResponse<boolean>>(
                '/api/company-scraps/check',
                {
                  ...axiosConfig,
                  params: { uid: fetchedUser.userId, cid: targetId },
                },
              );

              if (scrapCheckRes.data.code === 1000 || scrapCheckRes.data.code === 0) {
                initialIsScrapped = scrapCheckRes.data.data;
              }
            } catch (err) {
              console.error(err);
            }
          }

          setCompany({
            id: b.cid,
            name: b.corpName,
            logo: b.logo && b.logo !== 'string' ? b.logo : DEFAULT_LOGO,
            description: b.busiCont || '기업 소개가 없습니다.',
            location: b.corpAddr || '비공개',
            industry: b.busiSize || '정보 없음',
            employeeCount: b.totPsncnt || '비공개',
            website: b.homePg,
            isScrapped: initialIsScrapped,
            projects: b.projects || [],
          });
        }
        setJobPostings(jobsRes.data.data || []);
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
    if (element)
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - 120,
        behavior: 'smooth',
      });
  };

  const showToastMessage = (msg: React.ReactNode) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 4000);
  };

  const handleScrap = async () => {
    if (!company || isScraping || !isApplicant || !currentUser) return;

    const prevScrapped = company.isScrapped;

    setIsScraping(true);

    setCompany({
      ...company,
      isScrapped: !prevScrapped,
    });

    try {
      await axios.post('/api/company-scraps', null, {
        withCredentials: true,
        params: { uid: currentUser.userId, cid: company.id },
      });

      if (!prevScrapped) {
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
      setCompany({
        ...company,
        isScrapped: prevScrapped,
      });
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

  if (isLoading)
    return (
      <div className="bg-pure-white flex min-h-screen items-center justify-center">
        <div className="border-point-blue h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  if (!company) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-pure-white text-midnight-ink min-h-screen min-w-7xl pb-20"
      >
        <section className="relative flex min-h-110 w-full flex-col justify-end overflow-hidden pb-16">
          <div className="absolute inset-0 bg-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-size-[20px_20px] opacity-30" />
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/80" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-8">
            <div className="flex flex-row items-end gap-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative shrink-0"
              >
                <div className="bg-pure-white relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-4xl shadow-2xl ring-1 ring-white/10">
                  <img src={company.logo} className="h-full w-full object-contain p-6" alt="logo" />
                </div>
              </motion.div>

              <div className="flex w-full min-w-0 flex-1 flex-col items-start pb-2">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-5 flex flex-wrap items-center gap-3"
                >
                  <span
                    className={`${
                      jobPostings.length > 0
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-700 text-zinc-300'
                    } rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-300`}
                  >
                    {jobPostings.length > 0 ? '채용중' : '채용 없음'}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20">
                    <Building2 size={14} className="opacity-70" />
                    {company.industry}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20">
                    <MapPin size={14} className="opacity-70" />
                    {company.location.split(' ')[0]}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-pure-white mb-3 line-clamp-1 w-full text-left text-5xl font-black tracking-tight"
                >
                  {company.name}
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="line-clamp-1 text-left text-lg font-medium text-slate-300"
                >
                  {company.industry}
                </motion.p>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex shrink-0 items-center justify-end gap-3 pb-2"
              >
                <Button
                  variant="light"
                  size="lg"
                  disabled={!company.website}
                  className={`group h-14 rounded-2xl px-6 transition-all ${
                    company.website
                      ? 'cursor-pointer bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/20 hover:text-white'
                      : 'cursor-not-allowed bg-white/5 text-white/30 ring-1 ring-white/5 hover:bg-white/5 hover:text-white/30'
                  }`}
                  onClick={() => {
                    if (company.website) {
                      const targetUrl = company.website.match(/^https?:\/\//)
                        ? company.website
                        : `https://${company.website}`;
                      window.open(targetUrl, '_blank');
                    }
                  }}
                >
                  <Globe
                    size={18}
                    className={`mr-2 ${company.website ? 'opacity-70 group-hover:opacity-100' : 'opacity-30'}`}
                  />
                  홈페이지
                </Button>
                <motion.button
                  disabled={!isApplicant || isScraping}
                  onClick={handleScrap}
                  whileHover={isApplicant && !isScraping ? { scale: 1.05 } : {}}
                  whileTap={isApplicant && !isScraping ? { scale: 0.95 } : {}}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 ${
                    !isApplicant
                      ? 'cursor-not-allowed border-transparent bg-white/5 text-white/40 grayscale'
                      : company.isScrapped
                        ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Heart
                    size={24}
                    fill={company.isScrapped ? 'currentColor' : 'none'}
                    stroke={company.isScrapped ? 'currentColor' : 'currentColor'}
                    strokeWidth={2.5}
                  />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-12 w-full max-w-7xl px-8">
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
                    { label: '위치', value: company.location, fullWidth: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`border-silver-mist/40 flex items-center justify-between gap-6 border-b pb-4 ${
                        item.fullWidth ? 'col-span-2' : ''
                      }`}
                    >
                      <span className="text-slate-gray shrink-0 text-base font-bold">
                        {item.label}
                      </span>
                      <span
                        className={`text-midnight-ink text-lg font-black ${
                          item.fullWidth
                            ? 'line-clamp-2 text-right break-keep'
                            : 'truncate text-right'
                        }`}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section
                id="section-intro"
                className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
              >
                <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  기업 소개
                </h2>
                <div className="text-midnight-ink text-lg leading-relaxed font-medium whitespace-pre-wrap">
                  {company.description}
                </div>
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
                          <h3 className="min-w-0 flex-1 truncate text-xl font-black">{p.title}</h3>
                          <span className="bg-pure-white text-slate-gray rounded-lg border px-3 py-1 text-xs font-black">
                            {p.period}
                          </span>
                        </div>
                        <p className="text-slate-gray line-clamp-2 text-base font-medium">
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
                <div className="grid grid-cols-1 gap-4">
                  {jobPostings.length > 0 ? (
                    <>
                      {jobPostings.map((job) => {
                        const dDayText = calculateDDay(job.endDate);
                        const isClosed = dDayText === '마감됨';

                        return (
                          <motion.div
                            key={job.id}
                            whileHover={{
                              y: -8,
                              transition: { type: 'spring', stiffness: 300, damping: 20 },
                            }}
                            className="border-silver-mist group flex cursor-pointer flex-col rounded-3xl border bg-zinc-50/30 p-8 transition-shadow duration-300 hover:bg-white hover:shadow-2xl"
                            onClick={() => navigate(`/job-posts/${job.id}`)}
                          >
                            <div className="mb-4 space-y-2">
                              <h4 className="text-midnight-ink group-hover:text-point-blue line-clamp-1 text-2xl font-black transition-colors duration-300">
                                {job.title}
                              </h4>
                              <p className="text-slate-gray line-clamp-2 text-sm font-medium opacity-70">
                                {job.detail}
                              </p>
                            </div>
                            <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                              <span className="text-slate-gray max-w-60 truncate text-sm font-bold">
                                {company.location}
                              </span>
                              <span
                                className={`${
                                  isClosed ? 'text-error' : 'text-point-blue'
                                } text-sm font-black`}
                              >
                                {dDayText}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                      <Button
                        variant="outline"
                        fullWidth
                        size="lg"
                        className="mt-6 rounded-3xl border-2 border-dashed opacity-60 transition-all duration-300 hover:opacity-100"
                        onClick={() => navigate(`/job-postings?keyword=${company.name}`)}
                      >
                        {company.name}의 모든 공고 보기
                      </Button>
                    </>
                  ) : (
                    <div className="text-slate-gray py-20 text-center text-xl font-bold">
                      진행 중인 공고가 없습니다.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="col-span-4">
              <div className="sticky top-24 space-y-5">
                <div className="bg-pure-white rounded-4xl border border-zinc-100 p-8 shadow-sm">
                  <h3 className="text-midnight-ink text-md mb-6 font-black tracking-widest uppercase opacity-40">
                    Quick Menu
                  </h3>
                  <nav className="mb-8 space-y-4">
                    {[
                      { id: 'section-info', label: '기업 정보' },
                      { id: 'section-intro', label: '기업 소개' },
                      { id: 'section-projects', label: '프로젝트 내역' },
                      { id: 'section-jobs', label: '채용 공고' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToId(item.id)}
                        className="group flex w-full items-center transition-transform active:scale-95"
                      >
                        <div className="bg-point-blue h-4 w-1 rounded-full" />
                        <span className="text-midnight-ink group-hover:text-point-blue px-4 font-bold transition-colors">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </nav>
                  <div className="space-y-2 border-t border-zinc-100 pt-6">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleShare}
                      className="rounded-xl py-3"
                    >
                      공유하기
                    </Button>
                    <Button
                      variant="blue"
                      fullWidth
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="rounded-xl py-3 shadow-[0_8px_15px_rgba(0,119,255,0.1)]"
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
