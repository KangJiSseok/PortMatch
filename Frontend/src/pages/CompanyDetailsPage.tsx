import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button/Button';

interface CompanyDetails {
  id: number;
  name: string;
  logo: string;
  bannerImage: string;
  officeImages: string[];
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
  name: '(주)넥스트웨이브 테크놀로지스',
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=200&auto=format&fit=crop',
  bannerImage:
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
  officeImages: [
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497215842964-222b430dc094?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531973576160-7125cd663d86?q=80&w=400&auto=format&fit=crop',
  ],
  description:
    '넥스트웨이브 테크놀로지스는 차세대 AI 기반 데이터 분석 솔루션을 제공하는 혁신 기업입니다. 클라우드 네이티브 아키텍처를 기반으로 확장성 높은 서비스를 개발하며 사람이 중심이 되는 기술 생태계를 구축합니다.',
  location: '서울 강남구 테헤란로 518',
  industry: 'IT / 소프트웨어 개발',
  employeeCount: '150명',
  revenue: '320억 원',
  website: 'https://nextwave-tech.example.com',
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
      id: 101,
      title: '시니어 프론트엔드 개발자 (React/TS)',
      deadline: 'D-5',
      tags: ['채용중', '경력 5년↑'],
    },
    {
      id: 102,
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

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`/api/companies/${companyId}/details`);
        if (res.data) setCompany(res.data);
      } catch (e) {
        console.error(e);
      }
    };
  }, [companyId]);

  const handleScrap = async () => {
    if (!company) return;
    try {
      if (company.isScrapped) {
        await axios.delete(`/api/companies/${companyId}/scrap`);
      } else {
        await axios.post(`/api/companies/${companyId}/scrap`);
      }
      setCompany({ ...company, isScrapped: !company.isScrapped });
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async () => {
    if (!company) return;

    const shareData = {
      title: company.name,
      text: `${company.name}의 기업 정보와 채용 공고를 확인해보세요.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 클립보드에 복사되었습니다.');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  if (!company) return null;

  return (
    <div className="bg-pure-white min-h-screen pb-20 text-[#1a1a1a]">
      <section className="relative h-[360px] w-full overflow-hidden">
        <img
          src={company.bannerImage}
          className="h-full w-full object-cover brightness-50"
          alt="banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 mx-auto max-w-7xl px-8 pb-12">
          <div className="flex items-end gap-8">
            <div className="border-pure-white bg-pure-white h-40 w-40 shrink-0 overflow-hidden rounded-3xl border-4 shadow-xl">
              <img src={company.logo} className="h-full w-full object-contain p-4" alt="logo" />
            </div>
            <div className="text-pure-white mb-2 flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-point-blue rounded-md px-4 py-1.5 text-sm font-black uppercase">
                  채용중
                </span>
                <span className="flex items-center gap-1 rounded-md bg-black/40 px-4 py-1.5 text-sm font-bold ring-1 ring-white/20">
                  {company.enterpriseType}
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter">{company.name}</h1>
              <p className="text-lg font-bold opacity-80">{company.industry}</p>
            </div>
            <div className="mb-2 flex gap-3">
              <Button
                size="lg"
                className="bg-cloud-dancer text-midnight-ink hover:bg-pure-white rounded-2xl font-black shadow-lg transition-all"
                onClick={() => window.open(company.website, '_blank')}
              >
                기업 홈페이지 〉
              </Button>
              <button
                onClick={handleScrap}
                className={`flex h-[58px] w-[58px] items-center justify-center rounded-2xl shadow-lg transition-all duration-300 ${
                  company.isScrapped
                    ? 'text-pure-white bg-red-500 ring-2 ring-red-300'
                    : 'text-pure-white bg-black/40 ring-1 ring-white/20 backdrop-blur-md hover:bg-black/60'
                }`}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill={company.isScrapped ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 3.975 3 5.5l7 7Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-12 max-w-7xl px-8">
        <div className="grid grid-cols-4 gap-4 overflow-hidden rounded-[32px]">
          {company.officeImages.map((img, i) => (
            <div key={i} className="h-60 overflow-hidden">
              <img
                src={img}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                alt="office"
              />
            </div>
          ))}
          <div className="bg-slate-gray text-pure-white relative flex h-60 items-center justify-center text-2xl font-black">
            + 3
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl px-8">
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-12 space-y-12 lg:col-span-8">
            <section className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm">
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
                    <span className="text-slate-gray font-bold">{item.label}</span>
                    <span className="text-midnight-ink text-lg font-black tracking-tight">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-slate-gray border-silver-mist/30 border-t pt-8 text-lg leading-relaxed font-medium break-keep">
                {company.description}
              </p>
            </section>

            <section className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm">
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                기업 프로젝트 내역
              </h2>
              <div className="space-y-6">
                {company.projects.map((p) => (
                  <div
                    key={p.id}
                    className="border-silver-mist bg-cloud-dancer/30 hover:border-point-blue/30 rounded-3xl border p-8 transition-all"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xl font-black">{p.title}</h3>
                      <span className="bg-pure-white text-slate-gray border-silver-mist/50 rounded-lg border px-3 py-1 text-xs font-black">
                        {p.period}
                      </span>
                    </div>
                    <p className="text-slate-gray leading-relaxed font-medium">{p.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm">
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                채용 중인 공고
              </h2>
              <div className="divide-silver-mist divide-y">
                {company.jobPostings.map((job) => (
                  <div
                    key={job.id}
                    className="group flex cursor-pointer items-center justify-between py-8 first:pt-0 last:pb-0"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="space-y-3">
                      <h4 className="group-hover:text-point-blue text-2xl font-black transition-colors">
                        {job.title}
                      </h4>
                      <div className="flex gap-2">
                        {job.tags.map((t) => (
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
                        className="hover:bg-cloud-dancer rounded-xl font-black"
                      >
                        상세보기
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="col-span-12 space-y-6 lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <div className="border-silver-mist bg-pure-white rounded-[32px] border p-8 shadow-sm">
                <h3 className="text-midnight-ink mb-6 text-xl font-black tracking-tight">
                  Quick Actions
                </h3>
                <div className="space-y-4">
                  <Button
                    variant="blue"
                    size="xl"
                    className="shadow-point-blue/20 w-full rounded-2xl !py-6 !text-xl font-black shadow-lg"
                    onClick={handleShare}
                  >
                    기업 정보 공유하기
                  </Button>
                  <Button
                    className="bg-cloud-dancer text-midnight-ink border-silver-mist hover:bg-slate-gray hover:text-pure-white w-full rounded-2xl !py-6 !text-xl font-black transition-all"
                    onClick={() => navigate('/recommend/companies')}
                  >
                    비슷한 기업 추천보기
                  </Button>
                </div>
              </div>

              <div className="bg-point-blue text-pure-white shadow-point-blue/20 rounded-[32px] p-8 shadow-xl">
                <h4 className="mb-2 text-xl font-black">AI 역량 분석 매칭</h4>
                <p className="mb-6 text-sm leading-relaxed font-medium opacity-80">
                  내 포트폴리오를 분석하여 이 기업과의 합격률을 확인해 보세요.
                </p>
                <Button
                  className="bg-pure-white text-point-blue w-full rounded-xl !py-4 font-black"
                  onClick={() => navigate('/portfolios')}
                >
                  내 매칭 점수 확인
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CompanyDetailsPage;
