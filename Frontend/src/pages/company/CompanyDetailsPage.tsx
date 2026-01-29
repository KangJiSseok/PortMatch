import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import Button from '../../components/Button/Button';

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
  revenue: string;
  website: string;
  isScrapped: boolean;
  scrapCount: number;
  enterpriseType: string;
  projects: Project[];
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

const formatRevenue = (value: string | number) => {
  if (!value || value === '0') return '-';
  const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
  if (isNaN(num)) return value.toString();
  if (num >= 100000000) {
    const billion = Math.floor(num / 100000000);
    const million = Math.floor((num % 100000000) / 10000000);
    return million > 0 ? `${billion}억 ${million}천만원` : `${billion}억원`;
  }
  return `${Math.floor(num / 10000000)}천만원`;
};

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

  const isApplicant = (() => {
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.user?.role?.toUpperCase() === 'APPLICANT';
      }
    } catch {
      return false;
    }
    return false;
  })();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let targetId = paramId;

        if (!targetId || targetId === 'undefined') {
          const listRes = await axios.get<ApiResponse<CompanyBackendData[]>>('/api/companies', {
            headers,
          });
          if (listRes.data.code === 1000 && listRes.data.data.length > 0)
            targetId = listRes.data.data[0].cid;
        }
        if (!targetId) return;

        const [companyRes, jobsRes] = await Promise.all([
          axios.get<ApiResponse<CompanyBackendData>>(`/api/companies/${targetId}`, { headers }),
          axios
            .get<ApiResponse<JobPosting[]>>(`/api/job-postings/company/${targetId}`, { headers })
            .catch(() => ({
              data: { code: 0, message: '', data: [] } as ApiResponse<JobPosting[]>,
            })),
        ]);

        if (companyRes.data.code === 1000) {
          const b = companyRes.data.data;
          setCompany({
            id: b.cid,
            name: b.corpName,
            logo: b.logo && b.logo !== 'string' ? b.logo : DEFAULT_LOGO,
            description: b.busiCont,
            location: b.corpAddr || '-',
            industry: 'IT / 소프트웨어 개발',
            employeeCount: b.totPsncnt ? `${Number(b.totPsncnt).toLocaleString()}명` : '-',
            revenue: formatRevenue(b.yrSalesAmt),
            website: b.homePg,
            enterpriseType: b.busiSize,
            isScrapped: b.isScrapped || false,
            scrapCount: b.scrapCount || 0,
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
    if (!company || isScraping || !isApplicant) return;

    const prevScrapped = company.isScrapped;
    const prevCount = company.scrapCount;

    setIsScraping(true);

    setCompany({
      ...company,
      isScrapped: !prevScrapped,
      scrapCount: prevScrapped ? prevCount - 1 : prevCount + 1,
    });

    try {
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (prevScrapped) {
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
      setCompany({
        ...company,
        isScrapped: prevScrapped,
        scrapCount: prevCount,
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
        <div className="fixed top-24 right-8 z-50">
          <Button
            variant="dark"
            size="sm"
            onClick={() => setHasJobPostings(!hasJobPostings)}
            className="rounded-full px-6 shadow-2xl active:scale-95"
          >
            {hasJobPostings ? '공고 모드 ON' : '공고 모드 OFF'}
          </Button>
        </div>

        <section className="bg-midnight-ink relative flex min-h-100 w-full flex-col justify-end overflow-hidden pb-16">
          <div className="from-point-blue/20 absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] via-transparent to-transparent" />
          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-8">
            <div className="flex flex-row items-end gap-12">
              <div
                className={`border-pure-white bg-pure-white h-40 w-40 shrink-0 overflow-hidden rounded-3xl border-4 shadow-xl transition-all duration-300 ${!hasJobPostings && 'opacity-50 grayscale'}`}
              >
                <img src={company.logo} className="h-full w-full object-contain p-4" alt="logo" />
              </div>
              <div className="flex w-full min-w-0 flex-1 flex-col items-start">
                <div className="mb-4 flex items-center justify-start gap-2">
                  <span
                    className={`${hasJobPostings ? 'bg-point-blue' : 'bg-white/20'} text-pure-white rounded-md px-4 py-1.5 text-sm font-black ring-1 ring-white/10 backdrop-blur-sm transition-colors duration-300`}
                  >
                    {hasJobPostings ? '채용중' : '채용 없음'}
                  </span>
                  <span className="text-pure-white rounded-md bg-black/60 px-4 py-1.5 text-sm font-bold ring-1 ring-white/30 backdrop-blur-sm">
                    {company.enterpriseType}
                  </span>
                </div>
                <h1 className="text-pure-white line-clamp-1 text-left text-4xl font-black tracking-tighter">
                  {company.name}
                </h1>
                <p className="text-pure-white mt-4 text-left text-lg font-bold opacity-90">
                  {company.industry}
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-3">
                <Button
                  variant="light"
                  size="lg"
                  className="h-14 rounded-2xl px-6"
                  onClick={() => window.open(company.website, '_blank')}
                >
                  기업 홈페이지 〉
                </Button>
                <motion.button
                  disabled={!isApplicant || isScraping}
                  onClick={handleScrap}
                  whileHover={isApplicant && !isScraping ? { scale: 1.05 } : {}}
                  whileTap={isApplicant && !isScraping ? { scale: 0.95 } : {}}
                  className={`flex h-14 min-w-14 flex-col items-center justify-center rounded-2xl border-2 shadow-xl transition-colors duration-300 ${
                    !isApplicant
                      ? 'cursor-not-allowed border-transparent bg-white/10 text-white opacity-40 grayscale'
                      : company.isScrapped
                        ? 'border-red-500 bg-white text-red-500'
                        : 'text-midnight-ink border-zinc-100 bg-white'
                  }`}
                >
                  <Heart
                    size={20}
                    fill={company.isScrapped ? '#ef4444' : 'none'}
                    stroke={company.isScrapped ? '#ef4444' : 'currentColor'}
                    strokeWidth={2.5}
                  />
                  <span className="text-[11px] font-black">{company.scrapCount}</span>
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
                      className="border-silver-mist/40 flex items-center justify-between gap-6 border-b pb-4"
                    >
                      <span className="text-slate-gray shrink-0 text-base font-bold">
                        {item.label}
                      </span>
                      <span className="text-midnight-ink truncate text-right text-lg font-black">
                        {item.value}
                      </span>
                    </div>
                  ))}
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
                      {jobPostings.map((job) => (
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
                            <span className="text-point-blue text-sm font-black">
                              {calculateDDay(job.endDate)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
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
                  <div className="space-y-2 border-t border-zinc-50 pt-6">
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
