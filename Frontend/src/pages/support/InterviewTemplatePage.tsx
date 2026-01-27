import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';

interface QuestionCategory {
  categoryName: string;
  questions: string[];
}

interface InterviewTemplate {
  id: string;
  title: string;
  role: string;
  categories: QuestionCategory[];
  createdAt: string;
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const ROLE_OPTIONS = [
  { value: 'frontend', label: '프론트엔드 개발자' },
  { value: 'backend', label: '백엔드 개발자' },
  { value: 'design', label: 'UI/UX 디자이너' },
  { value: 'pm', label: '프로덕트 매니저' },
  { value: 'marketing', label: '마케팅' },
];

const STORAGE_KEY = 'interview_templates_v2';

const SectionCard = ({ title, children, actions, className = '' }: SectionCardProps) => (
  <section
    className={`bg-pure-white flex flex-col rounded-[40px] border border-slate-100 p-10 shadow-xl shadow-slate-200/50 ${className}`}
  >
    <div className="mb-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1.5 rounded-full bg-blue-600" />
        <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">{title}</h2>
      </div>
      <div className="flex gap-3">{actions}</div>
    </div>
    <div className="relative flex-1">{children}</div>
  </section>
);

const InterviewTemplatePage = () => {
  const [templates, setTemplates] = useState<InterviewTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [title, setTitle] = useState('');
  const [role, setRole] = useState('frontend');
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [currentCategories, setCurrentCategories] = useState<QuestionCategory[]>([
    { categoryName: '공통 인성', questions: [] },
    { categoryName: '직무 기술', questions: [] },
  ]);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [questionInput, setQuestionInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<string | null>(null);
  const [selectedViewTemplate, setSelectedViewTemplate] = useState<InterviewTemplate | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  const addCategory = () => {
    if (!categoryNameInput.trim()) return;
    if (currentCategories.some((c) => c.categoryName === categoryNameInput)) {
      showToast('⚠️ 이미 존재하는 주제입니다.');
      return;
    }
    setCurrentCategories([
      ...currentCategories,
      { categoryName: categoryNameInput.trim(), questions: [] },
    ]);
    setCategoryNameInput('');
  };

  const removeCategory = (index: number) => {
    if (currentCategories.length <= 1) return;
    setCurrentCategories(currentCategories.filter((_, i) => i !== index));
    if (selectedCategoryIndex >= index) setSelectedCategoryIndex(0);
  };

  const addQuestion = () => {
    if (!questionInput.trim()) return;
    const updated = [...currentCategories];
    updated[selectedCategoryIndex].questions.push(questionInput.trim());
    setCurrentCategories(updated);
    setQuestionInput('');
  };

  const removeQuestion = (catIdx: number, qIdx: number) => {
    const updated = [...currentCategories];
    updated[catIdx].questions.splice(qIdx, 1);
    setCurrentCategories(updated);
  };

  const saveTemplate = () => {
    const totalQuestions = currentCategories.reduce((acc, cur) => acc + cur.questions.length, 0);
    if (!title || totalQuestions === 0) {
      showToast('⚠️ 제목과 질문을 모두 구성해주세요.');
      return;
    }

    const newTemplate: InterviewTemplate = {
      id: Date.now().toString(),
      title,
      role: ROLE_OPTIONS.find((r) => r.value === role)?.label || role,
      categories: currentCategories.filter((c) => c.questions.length > 0),
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newTemplate, ...templates];
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTitle('');
    setCurrentCategories([
      { categoryName: '공통 인성', questions: [] },
      { categoryName: '직무 기술', questions: [] },
    ]);
    showToast('✅ 평가지가 안전하게 저장되었습니다!');
  };

  const confirmDeleteTemplate = () => {
    if (!deleteConfirmTemplate) return;
    const updated = templates.filter((t) => t.id !== deleteConfirmTemplate);
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDeleteConfirmTemplate(null);
    showToast('✨ 템플릿이 삭제되었습니다.');
  };

  return (
    <div className="bg-pure-white min-h-screen overflow-x-auto pt-32 pb-32 select-none">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-24 left-1/2 z-2000 flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-black text-white shadow-2xl ${
              toastMessage.includes('✅') || toastMessage.includes('✨')
                ? 'bg-blue-600'
                : 'bg-red-500'
            }`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-350 px-6">
        <header className="mb-12 flex items-start justify-between border-l-4 border-blue-600 pl-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">
              Evaluation Template
            </h1>
            <p className="mt-2 text-lg font-bold text-slate-400 italic">
              체계적인 면접을 위한 주제별 평가지를 구성하세요
            </p>
          </div>
        </header>

        <div className="grid grid-cols-12 items-stretch gap-8">
          <div className="col-span-7">
            <SectionCard title="질문 구성하기" className="h-full">
              <div className="flex h-full flex-col gap-8">
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="템플릿 제목"
                    placeholder="예: 2026 하반기 공채 프론트엔드"
                    value={title}
                    onChange={({ target }) => setTitle(target.value)}
                  />
                  <Select
                    label="대상 직무"
                    options={ROLE_OPTIONS}
                    value={role}
                    onChange={({ target }) => setRole(target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label="주제(카테고리) 관리"
                        placeholder="추가할 주제를 입력하세요"
                        value={categoryNameInput}
                        onChange={({ target }) => setCategoryNameInput(target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="h-14 rounded-2xl border-2 border-slate-900 px-8 font-black text-slate-900"
                      onClick={addCategory}
                    >
                      주제 추가
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {currentCategories.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedCategoryIndex(i)}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-5 py-2.5 transition-all ${
                          selectedCategoryIndex === i
                            ? 'border-blue-600 bg-blue-50/50 text-blue-600 ring-4 ring-blue-600/5'
                            : 'border-slate-100 bg-slate-50 text-slate-400'
                        }`}
                      >
                        <span className="text-base font-black">{c.categoryName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCategory(i);
                          }}
                          className="opacity-30 transition-opacity hover:text-red-500 hover:opacity-100"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                          >
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-6 border-t border-slate-100 pt-6">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Input
                        label={`[${currentCategories[selectedCategoryIndex].categoryName}] 카테고리에 질문 등록`}
                        placeholder="면접 질문을 입력하세요"
                        value={questionInput}
                        onChange={({ target }) => setQuestionInput(target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                          e.key === 'Enter' && addQuestion()
                        }
                      />
                    </div>
                    <Button
                      variant="blue"
                      className="h-14 rounded-2xl px-10 font-black shadow-lg shadow-blue-600/20"
                      onClick={addQuestion}
                    >
                      질문 등록
                    </Button>
                  </div>

                  <div className="custom-scrollbar max-h-125 space-y-6 overflow-y-auto pr-2">
                    {currentCategories.map(
                      (cat, catIdx) =>
                        cat.questions.length > 0 && (
                          <div key={catIdx} className="space-y-3">
                            <div className="flex items-center gap-2 pl-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                              <span className="text-sm font-black tracking-widest text-blue-600 uppercase">
                                {cat.categoryName}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {cat.questions.map((q, qIdx) => (
                                <div
                                  key={qIdx}
                                  className="group flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all hover:border-blue-200 hover:bg-white"
                                >
                                  <p className="flex-1 text-base font-bold text-slate-800">
                                    <span className="mr-4 font-black text-blue-600/30">
                                      {qIdx + 1}
                                    </span>
                                    {q}
                                  </p>
                                  <Button
                                    variant="close"
                                    size="sm"
                                    onClick={() => removeQuestion(catIdx, qIdx)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                    )}
                    {currentCategories.every((c) => c.questions.length === 0) && (
                      <div className="rounded-[40px] border-2 border-dashed border-slate-100 py-20 text-center text-lg font-bold text-slate-300">
                        작성된 질문이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex justify-center pt-8">
                  <Button
                    variant="blue"
                    size="xl"
                    className="w-full rounded-[25px] py-6 font-black shadow-2xl shadow-blue-600/20"
                    onClick={saveTemplate}
                  >
                    이 구성으로 템플릿 저장하기
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-span-5">
            <SectionCard title="저장된 템플릿 목록" className="h-full">
              <div className="flex h-full flex-col">
                {templates.length > 0 ? (
                  <div className="custom-scrollbar h-full max-h-275 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 gap-6">
                      {templates.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedViewTemplate(t)}
                          className="group cursor-pointer rounded-[40px] border border-slate-100 bg-slate-50/50 p-8 transition-all hover:border-blue-200 hover:bg-white hover:shadow-2xl hover:shadow-blue-600/5"
                        >
                          <div className="mb-6 flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <span className="rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] leading-none font-black tracking-widest text-white uppercase">
                                {t.role}
                              </span>
                              <h4 className="mt-3 truncate text-xl font-black text-slate-800">
                                {t.title}
                              </h4>
                            </div>
                            <Button
                              variant="close"
                              size="md"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmTemplate(t.id);
                              }}
                            />
                          </div>
                          <div className="mb-6 flex min-h-16 flex-wrap items-start gap-2">
                            {t.categories.map((c, i) => (
                              <span
                                key={i}
                                className="rounded-2xl border border-blue-100/50 bg-blue-50 px-3 py-2 text-xs font-black text-blue-600"
                              >
                                {c.categoryName} ({c.questions.length})
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                            <span className="text-sm font-bold text-slate-400">{t.createdAt}</span>
                            <span className="text-sm font-black text-blue-600 transition-transform group-hover:translate-x-1">
                              상세 보기 →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-[50px] border-2 border-dashed border-slate-100 py-32 text-center text-xl font-bold text-slate-300">
                    저장된 평가지가 없습니다.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {deleteConfirmTemplate && (
          <div className="fixed inset-0 z-3000 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmTemplate(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-[40px] bg-white p-10 text-center shadow-2xl"
            >
              <h3 className="mb-2 text-2xl font-black text-slate-900">템플릿을 삭제할까요?</h3>
              <p className="text-lg font-bold text-slate-500">
                저장된 모든 질문 데이터가 삭제됩니다.
              </p>
              <div className="mt-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={() => setDeleteConfirmTemplate(null)}
                >
                  취소
                </Button>
                <Button
                  variant="red"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={confirmDeleteTemplate}
                >
                  삭제하기
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedViewTemplate && (
          <div className="fixed inset-0 z-3000 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedViewTemplate(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl rounded-[50px] bg-white p-12 shadow-2xl"
            >
              <div className="mb-10 flex items-start justify-between">
                <div>
                  <span className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black tracking-widest text-white uppercase">
                    {selectedViewTemplate.role}
                  </span>
                  <h3 className="mt-4 text-3xl font-black text-slate-900">
                    {selectedViewTemplate.title}
                  </h3>
                </div>
                <Button variant="close" size="lg" onClick={() => setSelectedViewTemplate(null)} />
              </div>

              <div className="custom-scrollbar max-h-125 space-y-10 overflow-y-auto pr-4">
                {selectedViewTemplate.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-1.5 rounded-full bg-blue-600" />
                      <span className="text-lg font-black tracking-tight text-slate-800 uppercase">
                        {cat.categoryName}
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {cat.questions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="rounded-3xl border border-slate-50 bg-slate-50/50 p-6"
                        >
                          <p className="text-base font-bold text-slate-700">
                            <span className="mr-4 font-black text-blue-600/20">{qIdx + 1}</span>
                            {q}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 border-t border-slate-100 pt-8">
                <Button
                  variant="blue"
                  size="xl"
                  className="w-full rounded-3xl py-6 font-black"
                  onClick={() => {
                    setSelectedViewTemplate(null);
                    showToast('🚀 선택한 템플릿이 성공적으로 적용되었습니다.');
                  }}
                >
                  이 템플릿으로 면접 시작하기
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewTemplatePage;
