import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import EmptyState from '@/components/States/EmptyState';

// Mock 데이터 (실제 연동 시 API 호출 결과로 대체)
const MOCK_JOBS = [
  {
    id: 1,
    title: '시니어 프론트엔드 개발자 (React/Next.js)',
    company: '신세계푸드',
    stacks: ['React', 'TypeScript', 'Tailwind'],
    location: '서울 성동구',
    deadline: '오늘마감',
    type: '경력 5-10년',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Shinsegae_Logo.svg/1024px-Shinsegae_Logo.svg.png'
  },
  {
    id: 2,
    title: '플랫폼 클라우드 아키텍트 채용',
    company: '삼성전자',
    stacks: ['AWS', 'Kubernetes', 'Go'],
    location: '경기 수원시',
    deadline: 'D-5',
    type: '경력 무관',
    logo: 'https://via.placeholder.com/100/1a1a1a/fcfcfc?text=SAMSUNG'
  }
];

function JobSearchResultPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const searchType = searchParams.get('type') || 'all';

  return (
    <div className="bg-pure-white min-h-screen pt-32 pb-20">
      <div className="mx-auto max-w-5xl px-6">
        {/* 상단 검색 정보 헤더 */}
        <header className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <div className="bg-soft-pebble h-1 w-6 rounded-full" />
            <span className="text-silver-mist text-[11px] font-black uppercase tracking-[0.2em]">
              Search Results
            </span>
          </div>
          
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-midnight-ink text-3xl font-black tracking-tighter md:text-4xl">
                <span className="text-point-blue">'{keyword}'</span> 
                {searchType === 'company' ? ' 기업 공고' : ' 검색 결과'}
              </h1>
              <p className="text-slate-gray mt-2 text-lg font-medium">
                조건에 맞는 <span className="text-midnight-ink font-bold">{MOCK_JOBS.length}개</span>의 공고를 찾았습니다.
              </p>
            </div>

            {/* 정렬 필터 UI */}
            <div className="bg-cloud-dancer/50 flex gap-1 rounded-xl p-1">
              {['최신순', '정확도순'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-1.5 text-[11px] font-bold transition-all rounded-lg ${
                    tab === '최신순' ? 'bg-white text-midnight-ink shadow-sm' : 'text-silver-mist hover:text-slate-gray'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* 결과 리스트 영역 */}
        <section className="grid gap-5">
          {MOCK_JOBS.length > 0 ? (
            MOCK_JOBS.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="group border-cloud-dancer bg-white hover:border-soft-pebble flex flex-col gap-6 rounded-[28px] border p-7 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(26,26,26,0.04)] md:flex-row md:items-center"
              >
                {/* 기업 로고 */}
                <div className="border-cloud-dancer flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white p-2">
                  <img src={job.logo} alt={job.company} className="h-full w-full object-contain" />
                </div>

                {/* 공고 정보 */}
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="text-silver-mist text-xs font-bold">{job.company}</span>
                    <span className="bg-cloud-dancer text-slate-gray rounded px-1.5 py-0.5 text-[10px] font-bold">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-midnight-ink group-hover:text-point-blue text-xl font-bold tracking-tight transition-colors">
                    {job.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.stacks.map((stack) => (
                      <span key={stack} className="text-silver-mist text-[11px] font-medium">
                        #{stack}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 상태 및 액션 */}
                <div className="border-cloud-dancer flex shrink-0 flex-col items-start gap-3 border-t pt-5 md:items-end md:border-t-0 md:border-l md:pt-0 md:pl-10">
                  <div className="flex flex-col items-start md:items-end">
                    <span className="text-silver-mist text-[10px] font-black uppercase tracking-wider">Deadline</span>
                    <span className={`text-lg font-black ${job.deadline === '오늘마감' ? 'text-error' : 'text-midnight-ink'}`}>
                      {job.deadline}
                    </span>
                  </div>
                  <button className="bg-midnight-ink text-pure-white hover:bg-point-blue w-full rounded-xl px-6 py-2.5 text-xs font-black transition-colors md:w-auto">
                    공고 보기
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
              <EmptyState 
                  title="해당하는 공고가 없습니다"
                  description={`'${keyword}'에 대한 검색 결과가 없습니다. 키워드를 확인해 주세요.`}
                  actionLabel="이전으로 돌아가기"
                />
          )}
        </section>

        {/* 푸터 영역 (RecommendPage와 통일) */}
        <footer className="border-cloud-dancer mt-24 flex items-center justify-between border-t pt-12 text-[12px] font-bold text-silver-mist">
          <p>© 2026 PORT MATCH. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <span className="hover:text-midnight-ink cursor-pointer">Privacy</span>
            <span className="hover:text-midnight-ink cursor-pointer">Terms</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default JobSearchResultPage;