import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Button from '../components/Button/Button';

type CompanyProfile = {
  id: number;
  name: string;
  logo: string;
  description: string;
  location: string;
  industry: string;
  employeeCount: string;
  revenue: string;
  website: string;
  enterpriseType: string;

  businessNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

  projects?: { id: number; title: string; period: string; description: string }[];
};

// ✅ Edit 페이지랑 같은 키로 저장해두면 저장값이 이 페이지에 그대로 반영됨
const STORAGE_KEY = 'demo_company_profile_v2';

const DUMMY_COMPANY: CompanyProfile = {
  id: 1,
  name: '넥스트웨이브 테크놀로지스',
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=200&auto=format&fit=crop',
  description:
    '넥스트웨이브 테크놀로지스는 차세대 AI 기반 데이터 분석 솔루션을 제공하는 혁신 기업입니다. 클라우드 네이티브 아키텍처를 기반으로 확장성 높은 서비스를 개발합니다.',
  location: '서울 강남구 테헤란로 518',
  industry: 'IT / 소프트웨어 개발',
  employeeCount: '150명',
  revenue: '320억 원',
  website: 'http://www.nwave.kr/main.html',
  enterpriseType: '중소기업',
  businessNumber: '1234567890',
  contactEmail: 'contact@nwave.kr',
  contactPhone: '02-1234-5678',
  projects: [
    {
      id: 1,
      title: '글로벌 AI 데이터 매칭 플랫폼 구축',
      period: '2024.01 - 2024.12',
      description: '실시간 데이터 스트리밍 기반 매칭 엔진을 개발하여 정확도를 개선했습니다.',
    },
    {
      id: 2,
      title: '차세대 클라우드 보안 관제 시스템',
      period: '2023.06 - 2023.12',
      description: '멀티 클라우드 환경 위협 탐지 및 자동 대응 시스템을 구축했습니다.',
    },
  ],
};

function safeLoadProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DUMMY_COMPANY;
    const parsed = JSON.parse(raw) as Partial<CompanyProfile>;
    return { ...DUMMY_COMPANY, ...parsed } as CompanyProfile;
  } catch {
    return DUMMY_COMPANY;
  }
}

function CompanyProfilePage() {
  const navigate = useNavigate();

  const [company, setCompany] = useState<CompanyProfile | null>(DUMMY_COMPANY);
  const [isLoading, setIsLoading] = useState(false);

  const [toast, setToast] = useState<{ message: React.ReactNode; visible: boolean }>({
    message: '',
    visible: false,
  });

  const showToastMessage = (msg: React.ReactNode) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3500);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // ✅ axios 대신 로컬 더미만 사용
  useEffect(() => {
    setIsLoading(true);
    try {
      const loaded = safeLoadProfile();
      setCompany(loaded);
    } catch (e) {
      console.error(e);
      showToastMessage('기업 정보를 불러오지 못했어요.');
      setCompany(DUMMY_COMPANY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = 120;
    const bodyTop = document.body.getBoundingClientRect().top;
    const elTop = element.getBoundingClientRect().top;
    const elPos = elTop - bodyTop;
    const target = elPos - offset;

    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  const infoItems = useMemo(() => {
    return [
      { label: '산업', value: company?.industry ?? '-' },
      { label: '사원수', value: company?.employeeCount ?? '-' },
      { label: '기업구분', value: company?.enterpriseType ?? '-' },
      { label: '매출액', value: company?.revenue ?? '-' },
      { label: '위치', value: company?.location ?? '-' },
    ];
  }, [company]);

  if (isLoading) {
    return (
      <div className="bg-pure-white flex min-h-screen items-center justify-center">
        <div className="border-point-blue h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
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
        {/* HERO */}
        <section className="bg-midnight-ink relative flex min-h-100 w-full flex-col justify-end overflow-hidden pb-16">
          <div className="from-point-blue/20 absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] via-transparent to-transparent" />
          <div className="bg-point-blue/10 absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-8">
            {/* ✅ 로고+텍스트는 가운데 정렬, 버튼은 하단 기준 유지 */}
            <div className="flex items-end justify-between gap-12">
              <div className="flex min-w-0 flex-1 items-center gap-12">
                <div className="border-pure-white bg-pure-white h-40 w-40 shrink-0 overflow-hidden rounded-3xl border-4 shadow-xl">
                  <img
                    src={company?.logo}
                    className="h-full w-full object-contain p-4"
                    alt="logo"
                  />
                </div>

                <div className="flex w-full min-w-0 flex-1 flex-col items-start">
                  <div className="w-full">
                    <h1 className="text-pure-white line-clamp-3 w-full text-left text-4xl leading-tight font-black tracking-tighter break-all">
                      {company?.name ?? '-'}
                    </h1>
                  </div>

                  <p className="text-pure-white mt-4 min-h-7 w-full text-left text-lg font-bold break-keep opacity-90">
                    {company?.industry ?? '산업 정보가 없습니다'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-3">
                <Button
                  size="lg"
                  disabled={!company?.website}
                  className={`h-14.5 rounded-2xl px-6 text-base font-black whitespace-nowrap shadow-lg transition-all ${
                    company?.website
                      ? 'bg-pure-white text-midnight-ink hover:bg-cloud-dancer hover:scale-105'
                      : 'text-pure-white/30 cursor-not-allowed border-none bg-white/10'
                  }`}
                  onClick={() => company?.website && window.open(company.website, '_blank')}
                >
                  기업 홈페이지 〉
                </Button>

                <Button
                  variant="blue"
                  size="lg"
                  className="h-14.5 rounded-2xl px-6 text-base font-black whitespace-nowrap shadow-lg transition-all hover:scale-105"
                  onClick={() => navigate('/company/profile/edit')}
                >
                  정보 수정
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* BODY */}
        <div className="mx-auto mt-16 w-full max-w-7xl px-8">
          <div className="grid grid-cols-12 gap-12">
            {/* MAIN */}
            <div className="col-span-8 space-y-12">
              <section
                id="section-info"
                className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
              >
                <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  기업 정보
                </h2>

                <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                  {infoItems.map((it) => (
                    <div
                      key={it.label}
                      className="border-silver-mist/40 flex min-w-0 items-center justify-between border-b pb-4"
                    >
                      <span className="text-slate-gray shrink-0 text-base font-bold">
                        {it.label}
                      </span>
                      <span className="text-midnight-ink min-w-0 truncate pl-4 text-right text-lg font-black tracking-tight">
                        {it.value}
                      </span>
                    </div>
                  ))}
                </div>

                <p
                  id="section-intro"
                  className="text-slate-gray border-silver-mist/30 mt-8 border-t pt-8 text-lg leading-relaxed font-medium break-keep"
                >
                  {company?.description ?? '기업 소개가 없습니다.'}
                </p>
              </section>

              <section
                id="section-contact"
                className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
              >
                <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  연락처 / 인증 정보
                </h2>

                <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                  {[
                    { label: '홈페이지', value: company?.website ?? '-' },
                    { label: '이메일', value: company?.contactEmail ?? '-' },
                    { label: '전화번호', value: company?.contactPhone ?? '-' },
                    { label: '사업자등록번호', value: company?.businessNumber ?? '-' },
                  ].map((it) => (
                    <div
                      key={it.label}
                      className="border-silver-mist/40 flex min-w-0 items-center justify-between border-b pb-4"
                    >
                      <span className="text-slate-gray shrink-0 text-base font-bold">
                        {it.label}
                      </span>
                      <span className="text-midnight-ink min-w-0 truncate pl-4 text-right text-lg font-black tracking-tight">
                        {it.value}
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
                  {company?.projects?.length ? (
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
                    <div className="text-slate-gray py-16 text-center text-base font-medium">
                      프로젝트 내역이 없습니다.
                    </div>
                  )}
                </div>
              </section>

              <section>
               <div className="mt-4">
                  <p className="text-slate-gray text-sm font-medium opacity-70">
                    공고 관리는{' '}
                    <Link to="/company/jobs" className="text-point-blue font-black underline">
                      공고 관리 페이지
                    </Link>
                    에서 할 수 있어요.
                  </p>
                </div>
              </section>
            </div>

            {/* ASIDE */}
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
                      { id: 'section-intro', label: '기업 소개' },
                      { id: 'section-contact', label: '연락처' },
                      { id: 'section-projects', label: '프로젝트' },
                    ].map((it) => (
                      <button
                        key={it.id}
                        onClick={() => scrollToId(it.id)}
                        className="group flex w-full items-center py-1 transition-all active:scale-[0.98]"
                      >
                        <div className="bg-point-blue h-4 w-1 shrink-0 rounded-full" />
                        <span className="text-midnight-ink group-hover:text-point-blue text-md px-4 font-bold transition-all group-hover:translate-x-0.5">
                          {it.label}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* ✅ "지금 수정하기" 제거 → "맨 위로 이동"으로 교체 */}
                <Button
                  variant="dark"
                  size="md"
                  className="w-full rounded-xl py-4 text-base font-black shadow-2xl"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  맨 위로 이동
                </Button>
              </div>
            </aside>
          </div>
        </div>

        {/* TOAST */}
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

export default CompanyProfilePage;
