import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type ChangeEvent,
  type PointerEvent,
  type MouseEvent,
} from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { useBlocker } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';

interface Question {
  id: string;
  content: string;
  importance: number;
  userAnswer?: string;
  intervieweeAnswer?: string;
  score?: number;
}

interface QuestionCategory {
  categoryName: string;
  questions: Question[];
}

interface InterviewTemplate {
  id: string;
  title: string;
  role: string;
  categories: QuestionCategory[];
  createdAt: string;
  color: string;
}

interface SectionCardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

interface CategoryItemProps {
  cat: QuestionCategory;
  catIdx: number;
  questionInput: string;
  setQuestionInput: (val: string) => void;
  onAddQuestion: () => void;
  onRemoveCategory: () => void;
  onReorderQuestions: (newQuestions: Question[]) => void;
  onRemoveQuestion: (qIdx: number) => void;
  questionsError: boolean;
}

type ConfirmType = 'EXIT' | 'DELETE_TEMPLATE' | 'DELETE_CATEGORY' | 'DELETE_QUESTION';

interface ConfirmModalState {
  type: ConfirmType;
  data?: string | number | { catIdx: number; qIdx: number };
}

const POINT_BLUE = '#5151e7';
const MAX_CATEGORY_LENGTH = 20;

const ROLE_OPTIONS = [
  { value: '', label: '직무를 선택하세요' },
  { value: 'frontend', label: '프론트엔드 개발자' },
  { value: 'backend', label: '백엔드 개발자' },
  { value: 'fullstack', label: '풀스택 개발자' },
  { value: 'mobile', label: '모바일 앱 개발자 (iOS/Android)' },
  { value: 'devops', label: 'DevOps / 인프라 엔지니어' },
  { value: 'data', label: '데이터 엔지니어 / 사이언티스트' },
  { value: 'ai_ml', label: 'AI / 머신러닝 엔지니어' },
  { value: 'design', label: 'UI/UX 디자이너' },
  { value: 'pm_po', label: '기획자 (PM/PO)' },
  { value: 'qa', label: 'QA / 테스트 엔지니어' },
  { value: 'marketing', label: '퍼포먼스 마케팅' },
  { value: 'other', label: '기타 (직접 입력)' },
];

const STORAGE_KEY = 'giterra_interview_templates_v3';

const SectionCard = ({
  title,
  children,
  actions,
  className = '',
  sectionRef,
}: SectionCardProps) => (
  <motion.section
    ref={sectionRef}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`bg-pure-white flex shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-[0_22px_45px_-11px_rgba(0,0,0,0.06)] ${className}`}
  >
    <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="bg-point-blue h-4 w-1 rounded-full" />
        <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
          {title}
        </h2>
      </div>
      <div className="flex shrink-0 gap-2">{actions}</div>
    </div>
    <div className="relative flex flex-col">{children}</div>
  </motion.section>
);

const InterviewTemplatePage = () => {
  const { user } = useAuthStore();
  const isCorporate = user?.role === 'COMPANY';

  const [templates, setTemplates] = useState<InterviewTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [currentCategories, setCurrentCategories] = useState<QuestionCategory[]>([]);
  const [questionInputs, setQuestionInputs] = useState<Record<number, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedViewTemplate, setSelectedViewTemplate] = useState<InterviewTemplate | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLDivElement>(null);

  const isDirty = useMemo(() => {
    return (
      view === 'form' &&
      (title.trim() !== '' || role !== '' || currentCategories.some((c) => c.questions.length > 0))
    );
  }, [view, title, role, currentCategories]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !selectedViewTemplate && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const yOffset = -180;
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const filteredTemplates = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return templates.filter(
      (t) => t.title.toLowerCase().includes(term) || t.role.toLowerCase().includes(term),
    );
  }, [templates, searchTerm]);

  const handleOpenForm = (template?: InterviewTemplate) => {
    if (template) {
      setEditingId(template.id);
      setTitle(template.title);
      const isCustom = !ROLE_OPTIONS.some((opt) => opt.label === template.role);
      setRole(
        isCustom ? 'other' : ROLE_OPTIONS.find((o) => o.label === template.role)?.value || '',
      );
      setCustomRole(isCustom ? template.role : '');
      setCurrentCategories(template.categories);
    } else {
      setEditingId(null);
      setTitle('');
      setRole('');
      setCustomRole('');
      setCurrentCategories([
        { categoryName: isCorporate ? '직무 전문성' : '기술 질문', questions: [] },
        { categoryName: isCorporate ? '공통 역량' : '기본 인성', questions: [] },
      ]);
    }
    setView('form');
    setErrors({});
  };

  const handleReturnToList = () => {
    if (isDirty) {
      setConfirmModal({ type: 'EXIT' });
    } else {
      setView('list');
    }
  };

  const handleUpdateDetailContent = <K extends keyof Question>(
    templateId: string,
    catIdx: number,
    qIdx: number,
    field: K,
    value: Question[K],
  ) => {
    const updatedTemplates = templates.map((t) => {
      if (t.id === templateId) {
        const newCategories = [...t.categories];
        const targetCategory = { ...newCategories[catIdx] };
        const targetQuestions = [...targetCategory.questions];
        targetQuestions[qIdx] = { ...targetQuestions[qIdx], [field]: value };
        targetCategory.questions = targetQuestions;
        newCategories[catIdx] = targetCategory;
        return { ...t, categories: newCategories };
      }
      return t;
    });

    setTemplates(updatedTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    const current = updatedTemplates.find((t) => t.id === templateId);
    if (current) setSelectedViewTemplate(current);
  };

  const handleCategoryInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CATEGORY_LENGTH) {
      setCategoryNameInput(value);
    }
  };

  const handleAddCategory = () => {
    const name = categoryNameInput.trim();
    if (!name) {
      setErrors((prev) => ({ ...prev, categoryName: true }));
      return;
    }

    const isDuplicate = currentCategories.some(
      (cat) => cat.categoryName.toLowerCase() === name.toLowerCase(),
    );

    if (isDuplicate) {
      showToast('⚠️ 이미 존재하는 주제 이름입니다.');
      return;
    }

    setCurrentCategories([{ categoryName: name, questions: [] }, ...currentCategories]);
    setCategoryNameInput('');
  };

  const executeDeleteCategory = (index: number) => {
    const updated = currentCategories.filter((_, i) => i !== index);
    setCurrentCategories(updated);
    setConfirmModal(null);
  };

  const handleAddQuestion = (catIdx: number) => {
    const content = (questionInputs[catIdx] || '').trim();
    if (!content) return;

    const newQuestion: Question = {
      id: `q-${crypto.randomUUID()}`,
      content,
      importance: 1,
    };

    const updated = [...currentCategories];
    updated[catIdx].questions = [newQuestion, ...updated[catIdx].questions];
    setCurrentCategories(updated);
    setQuestionInputs((prev) => ({ ...prev, [catIdx]: '' }));
  };

  const executeDeleteQuestion = (catIdx: number, qIdx: number) => {
    const updated = [...currentCategories];
    updated[catIdx].questions.splice(qIdx, 1);
    setCurrentCategories(updated);
    setConfirmModal(null);
  };

  const handleSaveTemplate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!title.trim()) newErrors.title = true;
    if (!role) newErrors.role = true;
    if (role === 'other' && !customRole.trim()) newErrors.customRole = true;

    const hasEmptyCategory = currentCategories.some((cat) => cat.questions.length === 0);
    if (hasEmptyCategory) newErrors.questionsError = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const hasBasicError = newErrors.title || newErrors.role || newErrors.customRole;
      if (hasBasicError) {
        showToast('⚠️ 필수 항목을 확인해주세요.');
        scrollToSection(formRef);
      } else if (newErrors.questionsError) {
        showToast('⚠️ 모든 주제에 최소 한 개 이상의 질문을 등록해야 합니다.');
        scrollToSection(categoryInputRef);
      }
      return;
    }

    const finalRole =
      role === 'other'
        ? customRole.trim()
        : ROLE_OPTIONS.find((r) => r.value === role)?.label || role;

    const newTemplate: InterviewTemplate = {
      id: editingId || crypto.randomUUID(),
      title,
      role: finalRole,
      categories: currentCategories,
      createdAt: new Date().toLocaleDateString(),
      color: POINT_BLUE,
    };

    let updated;
    if (editingId) {
      updated = templates.map((t) => (t.id === editingId ? newTemplate : t));
    } else {
      updated = [newTemplate, ...templates];
    }

    setTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showToast(editingId ? '✅ 템플릿이 수정되었습니다.' : '✅ 템플릿이 저장되었습니다.');
    setView('list');
  };

  const executeDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setConfirmModal(null);
    showToast('✨ 삭제되었습니다.');
  };

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32 select-none">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-18 left-1/2 z-6000 flex items-center gap-2 rounded-xl px-6 py-3 text-base font-black text-white shadow-2xl ${
              toastMessage.startsWith('⚠️') ? 'bg-error' : 'bg-point-blue'
            }`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            {isCorporate ? 'Interview Management' : 'Interview Prep'}
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            {view === 'list'
              ? '보관된 템플릿을 관리하고 검색하세요'
              : '질문을 구성하고 템플릿을 완성하세요'}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SectionCard
                title="목록 관리"
                actions={
                  <Button
                    variant="blue"
                    size="md"
                    className="shrink-0 rounded-xl px-6 font-black whitespace-nowrap shadow-md"
                    onClick={() => handleOpenForm()}
                  >
                    새 템플릿 추가
                  </Button>
                }
              >
                <div className="mb-6 shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="템플릿 제목 또는 직무로 검색하세요..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-cloud-dancer/20 border-soft-pebble/30 focus:border-point-blue w-full rounded-2xl border py-3.5 pr-5 pl-12 text-base font-bold transition-all outline-none"
                    />
                    <svg
                      className="text-silver-mist absolute top-1/2 left-5 -translate-y-1/2"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  </div>
                </div>

                {filteredTemplates.length > 0 ? (
                  <div className="grid grid-cols-3 gap-5">
                    {filteredTemplates.map((t) => (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-pure-white relative flex h-full min-h-60 shrink-0 cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-100 p-5 shadow-sm transition-all hover:border-transparent hover:shadow-xl"
                        onClick={() => setSelectedViewTemplate(t)}
                      >
                        <div className="bg-point-blue absolute top-0 bottom-0 left-0 w-1 transition-all group-hover:w-1.5" />
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 pr-6 pl-2">
                            <div className="mb-0 flex flex-col items-start gap-1.5">
                              <span className="bg-point-blue text-pure-white max-w-full truncate rounded-md px-2.5 py-0.5 text-[11px] font-black tracking-wider whitespace-nowrap uppercase shadow-sm">
                                {t.role}
                              </span>
                              <h4 className="text-midnight-ink w-full truncate text-xl leading-tight font-black">
                                {t.title}
                              </h4>
                            </div>
                            <span className="text-silver-mist ml-1 text-[11px] font-bold whitespace-nowrap">
                              {t.createdAt}
                            </span>
                          </div>
                          <Button
                            variant="close"
                            size="sm"
                            className="shrink-0"
                            onClick={(e: MouseEvent) => {
                              e.stopPropagation();
                              setConfirmModal({ type: 'DELETE_TEMPLATE', data: t.id });
                            }}
                          />
                        </div>

                        <div className="relative mb-5 flex flex-wrap items-start gap-1 pl-2">
                          {t.categories.slice(0, 4).map((c, i) => (
                            <span
                              key={i}
                              className="bg-point-blue/10 text-point-blue rounded-md px-2 py-0.5 text-[10px] font-black whitespace-nowrap"
                            >
                              {c.categoryName} ({c.questions.length})
                            </span>
                          ))}
                          {t.categories.length > 4 && (
                            <span className="bg-point-blue/5 text-point-blue rounded-md px-2 py-0.5 text-[10px] font-black whitespace-nowrap italic">
                              외 {t.categories.length - 4}개
                            </span>
                          )}
                        </div>

                        <div className="mt-auto flex shrink-0 items-center justify-between border-t border-slate-50 pt-3 pl-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg px-3 text-xs font-black whitespace-nowrap"
                            onClick={(e: MouseEvent) => {
                              e.stopPropagation();
                              handleOpenForm(t);
                            }}
                          >
                            수정
                          </Button>
                          <div className="relative">
                            <span className="text-point-blue text-[11px] font-black whitespace-nowrap transition-transform group-hover:translate-x-1">
                              상세 보기 →
                            </span>
                            <div className="bg-point-blue absolute -bottom-1 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-8"
                  >
                    <div className="mb-4 text-5xl">🔍</div>
                    <h3 className="text-midnight-ink mb-2 text-xl font-black whitespace-nowrap">
                      검색 결과가 없습니다
                    </h3>
                    <p className="text-silver-mist text-base font-bold whitespace-nowrap">
                      다른 검색어를 입력하거나 새로운 템플릿을 추가해 보세요.
                    </p>
                  </motion.div>
                )}
              </SectionCard>
            </motion.div>
          ) : (
            <motion.div
              key="form-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="grid grid-cols-1 gap-6">
                <SectionCard
                  title={editingId ? '질문 수정하기' : '질문 구성하기'}
                  sectionRef={formRef}
                  actions={
                    <Button
                      variant="outline"
                      size="md"
                      className="shrink-0 rounded-xl px-5 font-black whitespace-nowrap"
                      onClick={handleReturnToList}
                    >
                      목록으로 돌아가기
                    </Button>
                  }
                >
                  <div className="flex flex-col gap-8">
                    <div className="grid shrink-0 grid-cols-2 gap-6">
                      <Input
                        label="템플릿 제목"
                        error={errors.title ? ' ' : undefined}
                        placeholder="예: 상반기 개발자 평가"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <div className="flex flex-col gap-3">
                        <Select
                          label="대상 직무"
                          options={ROLE_OPTIONS}
                          value={role}
                          error={!!errors.role}
                          onChange={(e) => setRole(e.target.value)}
                        />
                        <AnimatePresence>
                          {role === 'other' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <Input
                                label="상세 직무 입력"
                                error={errors.customRole ? ' ' : undefined}
                                placeholder="직무명을 입력하세요"
                                value={customRole}
                                onChange={(e) => setCustomRole(e.target.value)}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col space-y-4" ref={categoryInputRef}>
                      <div className="flex shrink-0 items-end gap-2">
                        <div className="relative flex-1">
                          <Input
                            label="새 주제 추가"
                            placeholder="예: 프로젝트 경험, 지원 동기"
                            value={categoryNameInput}
                            onChange={handleCategoryInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                          />
                          <div className="absolute top-0 right-0 flex items-center gap-1 pt-1">
                            <span
                              className={`text-xs font-black ${categoryNameInput.length >= MAX_CATEGORY_LENGTH ? 'text-error' : 'text-silver-mist'}`}
                            >
                              {categoryNameInput.length}
                            </span>
                            <span className="text-silver-mist text-xs font-bold">
                              / {MAX_CATEGORY_LENGTH}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="h-11 shrink-0 rounded-xl px-6 font-black whitespace-nowrap"
                          onClick={handleAddCategory}
                        >
                          주제 추가
                        </Button>
                      </div>

                      <Reorder.Group
                        axis="y"
                        values={currentCategories}
                        onReorder={setCurrentCategories}
                        className="grid shrink-0 grid-cols-1 gap-6"
                      >
                        {currentCategories.map((cat, catIdx) => (
                          <CategoryItem
                            key={cat.categoryName}
                            cat={cat}
                            catIdx={catIdx}
                            questionInput={questionInputs[catIdx] || ''}
                            setQuestionInput={(val: string) =>
                              setQuestionInputs((prev) => ({ ...prev, [catIdx]: val }))
                            }
                            onAddQuestion={() => handleAddQuestion(catIdx)}
                            onRemoveCategory={() => {
                              if (currentCategories.length <= 1) {
                                showToast('⚠️ 최소 한 개의 주제는 유지되어야 합니다.');
                              } else {
                                setConfirmModal({ type: 'DELETE_CATEGORY', data: catIdx });
                              }
                            }}
                            onReorderQuestions={(newQuestions: Question[]) => {
                              const updated = [...currentCategories];
                              updated[catIdx].questions = newQuestions;
                              setCurrentCategories(updated);
                            }}
                            onRemoveQuestion={(qIdx: number) =>
                              setConfirmModal({ type: 'DELETE_QUESTION', data: { catIdx, qIdx } })
                            }
                            questionsError={errors.questionsError && cat.questions.length === 0}
                          />
                        ))}
                      </Reorder.Group>
                    </div>

                    <div className="flex shrink-0 gap-3 pt-6 pb-6">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 rounded-xl py-3 text-base font-black whitespace-nowrap"
                        onClick={handleReturnToList}
                      >
                        취소
                      </Button>
                      <Button
                        variant="blue"
                        size="lg"
                        className="flex-2 rounded-xl py-3 text-lg font-black whitespace-nowrap shadow-lg"
                        onClick={handleSaveTemplate}
                      >
                        {editingId ? '수정 완료' : '템플릿 저장'}
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedViewTemplate && (
          <div className="bg-midnight-ink/60 fixed inset-0 z-7000 flex items-start justify-center p-5 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-pure-white relative mt-10 flex max-h-[calc(100vh-80px)] w-full max-w-4xl flex-col overflow-hidden rounded-4xl px-7 pt-16 pb-7 shadow-2xl"
            >
              <div className="mb-5 flex shrink-0 items-start justify-between">
                <div>
                  <span className="bg-point-blue rounded-lg px-3 py-1 text-[10px] font-black whitespace-nowrap text-white uppercase">
                    {selectedViewTemplate.role}
                  </span>
                  <h3 className="text-midnight-ink mt-2 truncate text-2xl font-black">
                    {selectedViewTemplate.title}
                  </h3>
                </div>
                <Button
                  variant="close"
                  size="md"
                  className="shrink-0"
                  onClick={() => setSelectedViewTemplate(null)}
                />
              </div>

              <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-3">
                {selectedViewTemplate.categories.map((cat, cIdx) => (
                  <div key={cIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-point-blue h-3.5 w-1 rounded-full" />
                      <span className="text-midnight-ink text-lg font-black tracking-tight whitespace-nowrap uppercase">
                        {cat.categoryName}
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {cat.questions.map((q, qIdx) => (
                        <div
                          key={q.id}
                          className="border-soft-pebble/30 bg-cloud-dancer/10 rounded-2xl border p-4"
                        >
                          <p className="text-midnight-ink mb-3 text-base font-bold">
                            <span className="text-point-blue/30 mr-3 font-black whitespace-nowrap">
                              Q{qIdx + 1}
                            </span>
                            {q.content}
                          </p>
                          <textarea
                            className="bg-pure-white border-soft-pebble/50 focus:border-point-blue min-h-18 w-full rounded-xl border p-4 text-sm font-bold outline-none"
                            value={(isCorporate ? q.intervieweeAnswer : q.userAnswer) || ''}
                            onChange={(e) =>
                              handleUpdateDetailContent(
                                selectedViewTemplate.id,
                                cIdx,
                                qIdx,
                                isCorporate ? 'intervieweeAnswer' : 'userAnswer',
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-soft-pebble/30 mt-5 flex shrink-0 justify-end border-t pt-5">
                <Button
                  variant="blue"
                  size="md"
                  className="shrink-0 rounded-xl px-10 font-black whitespace-nowrap shadow-lg"
                  onClick={() => setSelectedViewTemplate(null)}
                >
                  작성 완료
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(confirmModal || blocker.state === 'blocked') && (
          <div className="fixed inset-0 z-9000 flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setConfirmModal(null);
                blocker.reset?.();
              }}
              className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-pure-white relative w-full max-w-sm overflow-hidden rounded-3xl p-8 text-center shadow-2xl"
            >
              <h3 className="text-midnight-ink mb-1.5 text-xl font-black whitespace-nowrap">
                {confirmModal?.type === 'EXIT' || blocker.state === 'blocked'
                  ? '작성을 중단할까요?'
                  : '정말 삭제할까요?'}
              </h3>
              <p className="text-silver-mist text-base font-bold">
                {confirmModal?.type === 'EXIT' || blocker.state === 'blocked'
                  ? '이동하면 작성 중인 항목들이 사라집니다.'
                  : '삭제된 데이터는 복구할 수 없습니다.'}
              </p>
              <div className="mt-7 flex shrink-0 gap-3">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1 rounded-xl font-black whitespace-nowrap"
                  onClick={() => {
                    setConfirmModal(null);
                    blocker.reset?.();
                  }}
                >
                  {confirmModal?.type === 'EXIT' || blocker.state === 'blocked'
                    ? '계속 작성'
                    : '취소'}
                </Button>
                <Button
                  variant="red"
                  size="md"
                  className="flex-1 rounded-xl font-black whitespace-nowrap"
                  onClick={() => {
                    if (blocker.state === 'blocked') {
                      blocker.proceed?.();
                      return;
                    }
                    if (!confirmModal) return;
                    switch (confirmModal.type) {
                      case 'EXIT':
                        setView('list');
                        setConfirmModal(null);
                        break;
                      case 'DELETE_TEMPLATE':
                        executeDeleteTemplate(confirmModal.data as string);
                        break;
                      case 'DELETE_CATEGORY':
                        executeDeleteCategory(confirmModal.data as number);
                        break;
                      case 'DELETE_QUESTION': {
                        const d = confirmModal.data as { catIdx: number; qIdx: number };
                        executeDeleteQuestion(d.catIdx, d.qIdx);
                        break;
                      }
                    }
                  }}
                >
                  {confirmModal?.type === 'EXIT' || blocker.state === 'blocked'
                    ? '나가기'
                    : '삭제하기'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CategoryItem = ({
  cat,
  questionInput,
  setQuestionInput,
  onAddQuestion,
  onRemoveCategory,
  onReorderQuestions,
  onRemoveQuestion,
  questionsError,
}: CategoryItemProps) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      key={cat.categoryName}
      value={cat}
      dragListener={false}
      dragControls={dragControls}
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 50, mass: 1 }}
      className="border-soft-pebble/30 bg-cloud-dancer/10 flex shrink-0 flex-col overflow-hidden rounded-3xl border p-6"
    >
      <motion.div layout="position" className="mb-5 flex shrink-0 items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div
            onPointerDown={(e: PointerEvent) => dragControls.start(e)}
            className="text-silver-mist hover:text-point-blue shrink-0 cursor-grab p-1 active:cursor-grabbing"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle cx="9" cy="5" r="1" fill="currentColor" />
              <circle cx="9" cy="12" r="1" fill="currentColor" />
              <circle cx="9" cy="19" r="1" fill="currentColor" />
              <circle cx="15" cy="5" r="1" fill="currentColor" />
              <circle cx="15" cy="12" r="1" fill="currentColor" />
              <circle cx="15" cy="19" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className="bg-point-blue h-4 w-1 shrink-0 rounded-full" />
          <span className="text-midnight-ink truncate text-lg font-black whitespace-nowrap">
            {cat.categoryName}
          </span>
        </div>
        <button
          onClick={onRemoveCategory}
          className="bg-error text-pure-white hover:bg-pure-white hover:text-error hover:border-error shrink-0 rounded-lg border border-transparent px-3 py-1.5 text-xs font-black whitespace-nowrap transition-all"
        >
          주제 삭제
        </button>
      </motion.div>

      <motion.div layout="position" className="mb-6 flex shrink-0 gap-2">
        <input
          className={`bg-pure-white focus:border-point-blue flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all outline-none ${questionsError ? 'border-error shadow-error/10 shadow-sm' : 'border-soft-pebble/50'}`}
          placeholder="질문을 입력하세요"
          value={questionInput}
          onChange={(e) => setQuestionInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAddQuestion()}
        />
        <Button
          variant="blue"
          size="md"
          className="shrink-0 rounded-xl px-6 font-black whitespace-nowrap"
          onClick={onAddQuestion}
        >
          추가
        </Button>
      </motion.div>

      <div className="flex flex-col">
        <Reorder.Group
          axis="y"
          values={cat.questions}
          onReorder={onReorderQuestions}
          className="space-y-3"
        >
          <AnimatePresence initial={false}>
            {cat.questions.map((q: Question, qIdx: number) => (
              <QuestionItem key={q.id} q={q} qIdx={qIdx} onRemove={() => onRemoveQuestion(qIdx)} />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    </Reorder.Item>
  );
};

const QuestionItem = ({
  q,
  qIdx,
  onRemove,
}: {
  q: Question;
  qIdx: number;
  onRemove: () => void;
}) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      key={q.id}
      value={q}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 50 }}
      dragListener={false}
      dragControls={dragControls}
      dragElastic={0}
      dragMomentum={false}
      className="group bg-pure-white relative flex shrink-0 items-center justify-between overflow-hidden rounded-xl border border-slate-200 p-4 shadow-sm"
    >
      <div className="flex flex-1 items-center overflow-hidden">
        <div
          onPointerDown={(e: PointerEvent) => dragControls.start(e)}
          className="text-silver-mist hover:text-point-blue flex shrink-0 cursor-grab items-center justify-center p-1.5 active:cursor-grabbing"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <circle cx="9" cy="5" r="1" fill="currentColor" />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="9" cy="19" r="1" fill="currentColor" />
            <circle cx="15" cy="5" r="1" fill="currentColor" />
            <circle cx="15" cy="12" r="1" fill="currentColor" />
            <circle cx="15" cy="19" r="1" fill="currentColor" />
          </svg>
        </div>
        <span className="text-point-blue/30 mx-2 shrink-0 text-sm font-black whitespace-nowrap">
          Q{qIdx + 1}
        </span>
        <p className="text-midnight-ink truncate pr-3 text-sm font-bold">{q.content}</p>
      </div>
      <Button
        variant="close"
        size="sm"
        className="shrink-0 scale-90"
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          onRemove();
        }}
      />
    </Reorder.Item>
  );
};

export default InterviewTemplatePage;
