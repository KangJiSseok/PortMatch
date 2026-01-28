import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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

function NoticePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('전체');

  const filteredNotices =
    activeTab === '전체'
      ? MOCK_NOTICES
      : MOCK_NOTICES.filter((notice) => notice.category === activeTab);

  const underlineEffect =
    "relative after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-[2px] after:bg-point-blue after:transition-all after:duration-300 group-hover:after:w-full";

  return (
    <div className="text-midnight-ink min-h-screen bg-white">
      <div className="mx-auto w-350 px-6 pt-32 pb-20">
        <header className="mb-12">
          <button
            onClick={() => navigate(-1)}
            className="group hover:text-midnight-ink mb-6 flex items-center gap-2 text-sm font-bold text-zinc-400 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            뒤로가기
          </button>
          <h1 className="text-4xl font-black tracking-tighter">공지사항</h1>
          <p className="mt-4 text-lg font-bold text-zinc-400">
            PortMatch의 새로운 소식과 안내사항을 확인하세요.
          </p>
        </header>

        <section className="mb-10 flex gap-4 border-b border-zinc-100 pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`relative px-4 py-2 text-base font-black transition-all ${
                activeTab === cat ? 'text-midnight-ink' : 'text-zinc-300 hover:text-zinc-500'
              }`}
            >
              {cat}
              {activeTab === cat && (
                <motion.div
                  layoutId="activeTab"
                  className="bg-midnight-ink absolute bottom-[-17px] left-0 h-1 w-full"
                />
              )}
            </button>
          ))}
        </section>

        <section className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
          <div className="flex bg-zinc-50 px-8 py-4 text-sm font-black tracking-widest text-zinc-400 uppercase">
            <span className="w-16 text-center">NO</span>
            <span className="w-24 text-center">CATEGORY</span>
            <span className="flex-1 px-10">TITLE</span>
            <span className="w-32 text-center">DATE</span>
          </div>

          <div className="divide-y divide-zinc-50">
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className="group flex cursor-pointer items-center px-8 py-6 transition-colors hover:bg-zinc-50/50"
              >
                <span className="w-16 text-center text-sm font-bold text-zinc-300">
                  {notice.id}
                </span>
                <span
                  className={`w-24 rounded-md px-2 py-1 text-center text-xs font-black tracking-tighter uppercase ${
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
                <div className="flex-1 px-10">
                  <h3
                    className={`text-midnight-ink group-hover:text-point-blue inline-block text-lg font-bold transition-colors ${underlineEffect}`}
                  >
                    {notice.title}
                    {notice.isNew && (
                      <span className="bg-point-blue ml-2 inline-block h-2 w-2 rounded-full" />
                    )}
                  </h3>
                </div>
                <span className="w-32 text-center text-sm font-bold text-zinc-400">
                  {notice.date}
                </span>
              </div>
            ))}
          </div>
        </section>

        {filteredNotices.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-xl font-bold text-zinc-300">해당 카테고리의 공지사항이 없습니다.</p>
          </div>
        )}

        <div className="mt-12 flex justify-center gap-2">
          <button className="text-midnight-ink flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-100 font-bold shadow-sm transition-all hover:bg-zinc-50">
            1
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoticePage;
