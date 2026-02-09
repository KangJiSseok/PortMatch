import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button/Button';
import { X } from 'lucide-react';

interface Notice {
  id: number;
  category: '시스템' | '서비스' | '이벤트' | '안내';
  title: string;
  date: string;
  content: string;
}

const MOCK_NOTICES: Notice[] = [
  {
    id: 5,
    category: '이벤트',
    title: '정식 오픈 기념: 프리미엄 멤버십 1개월 무료 체험',
    date: '2026.02.09',
    content: `PortMatch 정식 오픈을 기다려주신 여러분을 위한 특별한 혜택!\n\n2월 한 달간 신규 가입하는 모든 회원님께 '프리미엄 멤버십 1개월 무료 이용권'을 드립니다.\n\n- 기간: 2026.02.09 ~ 2026.03.08\n- 대상: 기간 내 신규 가입한 개인/기업 회원\n- 혜택: 무제한 포트폴리오 분석, 무제한 인재 추천 기능 해제\n\n지금 바로 가입하고 AI가 제안하는 커리어 로드맵을 확인해보세요!`,
  },
  {
    id: 4,
    category: '서비스',
    title: 'PortMatch 정식 서비스 오픈 안내',
    date: '2026.02.09',
    content: `안녕하세요, PortMatch 팀입니다.\n\n오랜 베타 테스트 기간을 거쳐 2026년 2월 9일, 드디어 PortMatch가 정식 서비스를 시작합니다.\n\n그동안 보내주신 소중한 피드백을 바탕으로 더욱 강력해진 AI 매칭 엔진과 직관적인 사용자 경험을 준비했습니다.\n\n[주요 변경 사항]\n1. AI 매칭 정확도 향상\n2. 기업 회원 전용 페이지 오픈\n\n앞으로도 구직자와 기업 모두에게 최고의 가치를 제공하는 플랫폼이 되겠습니다.\n감사합니다.`,
  },

  {
    id: 3,
    category: '시스템',
    title: '정식 오픈 대비 최종 서버 점검 완료 (02.08)',
    date: '2026.02.08',
    content: `안녕하세요.\n\n안정적인 정식 서비스 제공을 위한 최종 서버 점검이 완료되었습니다.\n\n- 일시: 2026년 2월 8일 02:00 ~ 06:00 (4시간)\n- 내용: DB 최적화 및 서버 증설, 보안 패치 적용\n\n현재 모든 시스템이 정상 가동 중이며, 더욱 쾌적한 환경에서 서비스를 이용하실 수 있습니다.\n\n이용에 불편을 드려 죄송하며 협조해 주셔서 감사합니다.`,
  },

  {
    id: 2,
    category: '서비스',
    title: 'AI 매칭 엔진 업데이트 사전 안내',
    date: '2026.02.05',
    content: `더 정교해진 매칭 경험을 제공하기 위해 AI 매칭 엔진이 업데이트될 예정입니다.\n\n기존의 단순 키워드 매칭을 넘어, 프로젝트 맥락과 직무 역량의 연관성을 깊이 있게 분석합니다.\n\n이번 업데이트를 통해 추천 공고의 적합도가 크게 향상될 것으로 기대됩니다.\n\n업데이트 적용 예정일: 2026년 2월 9일 (정식 오픈 시 적용)`,
  },
  {
    id: 1,
    category: '안내',
    title: '설 연휴 고객센터 운영 안내',
    date: '2026.02.01',
    content: `민족 대명절 설을 맞아 고객센터 운영 일정을 안내해 드립니다.\n\n- 휴무 기간: 2026.02.16(월) ~ 02.18(수)\n- 정상 운영: 2026.02.19(목) 부터\n\n휴무 기간 중 접수된 1:1 문의는 업무 복귀 후 순차적으로 답변드릴 예정입니다.\n가족들과 함께 따뜻하고 행복한 연휴 보내시길 바랍니다.`,
  },
];

const CATEGORIES = ['전체', '시스템', '서비스', '이벤트', '안내'];

const NoticePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('전체');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const filteredNotices =
    activeTab === '전체'
      ? MOCK_NOTICES
      : MOCK_NOTICES.filter((notice) => notice.category === activeTab);

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
  };

  const closePopup = () => {
    setSelectedNotice(null);
  };

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
                  onClick={() => handleNoticeClick(notice)}
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

      <AnimatePresence>
        {selectedNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={closePopup}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 p-8 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-tight uppercase ${
                        selectedNotice.category === '시스템'
                          ? 'bg-red-50 text-red-500'
                          : selectedNotice.category === '서비스'
                            ? 'bg-blue-50 text-blue-500'
                            : selectedNotice.category === '이벤트'
                              ? 'bg-orange-50 text-orange-500'
                              : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {selectedNotice.category}
                    </span>
                    <span className="text-sm font-bold text-zinc-400">{selectedNotice.date}</span>
                  </div>
                  <h2 className="text-midnight-ink text-2xl font-black tracking-tight">
                    {selectedNotice.title}
                  </h2>
                </div>
                <button
                  onClick={closePopup}
                  className="text-zinc-400 transition-colors hover:text-zinc-800"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-8 pt-6">
                <p className="text-base leading-relaxed font-medium whitespace-pre-wrap text-zinc-600">
                  {selectedNotice.content}
                </p>
              </div>
              <div className="flex justify-end border-t border-zinc-50 bg-zinc-50/50 p-6">
                <Button variant="outline" onClick={closePopup}>
                  확인
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoticePage;
