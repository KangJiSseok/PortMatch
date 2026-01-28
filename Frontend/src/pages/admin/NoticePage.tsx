import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/Button/Button';

interface Notice {
  id: number;
  category: '시스템' | '서비스' | '이벤트' | '안내';
  title: string;
  date: string;
  isNew?: boolean;
}

const MOCK_NOTICES: Notice[] = [
  {
    id: 6,
    category: '시스템',
    title: '새로운 AI 매칭 엔진 v2.0 업데이트 안내',
    date: '2026.01.22',
    isNew: true,
  },
  {
    id: 5,
    category: '서비스',
    title: '기업 전용 인재 추천 리포트 서비스 런칭',
    date: '2026.01.15',
    isNew: true,
  },
  {
    id: 4,
    category: '이벤트',
    title: '신규 가입 회원 대상 포트폴리오 정밀 분석 무료 이벤트',
    date: '2026.01.10',
  },
  {
    id: 3,
    category: '안내',
    title: '개인정보 처리방침 개정 안내 (2026.01.01 시행)',
    date: '2025.12.20',
  },
  { id: 2, category: '시스템', title: '연말 서버 정기 점검 작업 공지', date: '2025.12.15' },
  {
    id: 1,
    category: '서비스',
    title: 'PortMatch 베타 서비스 오픈 및 환영 인사',
    date: '2025.11.01',
  },
];

const CATEGORIES = ['전체', '시스템', '서비스', '이벤트', '안내'];

const NoticePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('전체');

  const filteredNotices =
    activeTab === '전체'
      ? MOCK_NOTICES
      : MOCK_NOTICES.filter((notice) => notice.category === activeTab);

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 flex items-start justify-between border-l-4 pl-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h1 className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase">
              Notice
            </h1>
            <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
              PortMatch의 새로운 소식과 안내사항을 확인하세요.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Button
              isBack
              variant="outline"
              size="md"
              onClick={() => navigate(-1)}
              className="hover:text-midnight-ink border-none px-0! text-zinc-400 hover:bg-transparent!"
            />
          </motion.div>
        </header>

        <section className="mb-10 flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`relative rounded-xl px-6 py-2 text-sm font-black transition-all ${
                activeTab === cat ? 'bg-midnight-ink text-white' : 'text-zinc-400 hover:bg-zinc-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid gap-4">
            {filteredNotices.length > 0 ? (
              filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="group border-silver-mist bg-pure-white flex min-w-full cursor-pointer items-center justify-between rounded-3xl border p-7 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50"
                >
                  <div className="flex min-w-0 items-center gap-8">
                    <span className="w-12 text-center text-sm font-bold text-zinc-300 tabular-nums">
                      {notice.id.toString().padStart(2, '0')}
                    </span>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`shrink-0 rounded-full px-3 py-0.5 text-[11px] font-black tracking-tight uppercase ${
                            notice.category === '시스템'
                              ? 'bg-red-50 text-red-500'
                              : notice.category === '서비스'
                                ? 'bg-blue-50 text-blue-500'
                                : notice.category === '이벤트'
                                  ? 'bg-orange-50 text-orange-500'
                                  : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {notice.category}
                        </span>
                        {notice.isNew && (
                          <span className="bg-point-blue h-1.5 w-1.5 animate-pulse rounded-full" />
                        )}
                      </div>
                      <h3 className="text-midnight-ink group-hover:text-point-blue truncate text-xl font-black tracking-tight transition-colors">
                        {notice.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-8">
                    <div className="bg-cloud-dancer h-8 w-px" />
                    <span className="w-24 text-right text-sm font-bold text-zinc-400 tabular-nums">
                      {notice.date}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="border-silver-mist bg-pure-white rounded-[40px] border-2 border-dashed py-32 text-center">
                <div className="mb-4 text-6xl opacity-20">📢</div>
                <p className="text-soft-pebble text-xl font-black italic">
                  해당 카테고리의 공지사항이 없습니다.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {filteredNotices.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button className="text-midnight-ink flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-100 font-black shadow-sm transition-all hover:bg-zinc-50">
              1
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticePage;
