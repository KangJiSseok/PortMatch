import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function NoticeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    category: '시스템',
    content: '',
  });

  useEffect(() => {
    const fetchNoticeData = () => {
      if (!isEditMode) return;

      const mockData = {
        title: '기존 공지사항 제목입니다',
        category: '시스템',
        content: '기존 공지사항 내용이 여기에 들어갑니다.',
      };

      setForm(mockData);
    };

    fetchNoticeData();
  }, [id, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(isEditMode ? '수정되었습니다.' : '등록되었습니다.');
    navigate('/admin/notices');
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="mx-auto w-200 px-6">
        <header className="mb-10">
          <h1 className="text-midnight-ink text-3xl font-black tracking-tighter">
            {isEditMode ? '공지사항 수정' : '신규 공지사항 작성'}
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black tracking-widest text-zinc-400 uppercase">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="focus:border-midnight-ink w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-4 font-bold outline-none"
            >
              <option>시스템</option>
              <option>서비스</option>
              <option>이벤트</option>
              <option>안내</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black tracking-widest text-zinc-400 uppercase">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="공지사항 제목을 입력하세요"
              className="focus:border-midnight-ink w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-4 font-bold outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black tracking-widest text-zinc-400 uppercase">
              Content
            </label>
            <textarea
              rows={12}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="공지사항 내용을 입력하세요"
              className="focus:border-midnight-ink w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-4 font-bold outline-none"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-zinc-200 py-4 font-black text-zinc-400 hover:bg-zinc-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="bg-midnight-ink flex-1 rounded-2xl py-4 font-black text-white transition-all hover:bg-black"
            >
              {isEditMode ? '수정 완료' : '공지 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoticeFormPage;
