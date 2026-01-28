import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Notice {
  id: number;
  category: string;
  title: string;
  date: string;
}

const MOCK_NOTICES: Notice[] = [
  {
    id: 6,
    category: '시스템',
    title: '새로운 AI 매칭 엔진 v2.0 업데이트 안내',
    date: '2026.01.22',
  },
  {
    id: 5,
    category: '서비스',
    title: '기업 전용 인재 추천 리포트 서비스 런칭',
    date: '2026.01.15',
  },
];

function NoticeManagementPage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState(MOCK_NOTICES);

  const handleDelete = (id: number) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      setNotices(notices.filter((n) => n.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-32 pb-20">
      <div className="mx-auto w-350 px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-midnight-ink text-4xl font-black tracking-tighter">
              공지사항 관리
            </h1>
            <p className="mt-2 text-lg font-bold text-zinc-400">
              시스템 공지사항을 작성하고 관리합니다.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/notices/new')}
            className="bg-midnight-ink rounded-xl px-6 py-3 text-sm font-black text-white transition-all hover:bg-black active:scale-95"
          >
            신규 공지 작성
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-xs font-black tracking-widest text-zinc-400 uppercase">
                <th className="px-8 py-4 text-center">ID</th>
                <th className="px-8 py-4">카테고리</th>
                <th className="px-8 py-4">제목</th>
                <th className="px-8 py-4">작성일</th>
                <th className="px-8 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {notices.map((notice) => (
                <tr key={notice.id} className="group hover:bg-zinc-50/30">
                  <td className="px-8 py-6 text-center text-sm font-bold text-zinc-300">
                    {notice.id}
                  </td>
                  <td className="px-8 py-6">
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-500">
                      {notice.category}
                    </span>
                  </td>
                  <td className="text-midnight-ink px-8 py-6 text-base font-bold">
                    {notice.title}
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-zinc-400">{notice.date}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/notices/edit/${notice.id}`)}
                        className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-500 hover:bg-zinc-100"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="rounded-lg border border-red-100 px-3 py-1 text-xs font-bold text-red-400 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default NoticeManagementPage;
