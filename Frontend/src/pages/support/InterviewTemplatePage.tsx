import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
  type ChangeEvent,
  type PointerEvent,
  type MouseEvent,
} from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { useBlocker } from 'react-router-dom';
import {
  Search,
  SearchX,
  Trash2,
  ArrowRight,
  GripVertical,
  Plus,
  X,
  AlertTriangle,
  ChevronLeft,
  ListTodo,
  PenTool,
  Settings2,
  Edit3,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';

interface Question {
  id: number | string;
  content: string;
  orderIndex: number;
}

interface Topic {
  id?: number | string;
  name: string;
  orderIndex: number;
  questions: Question[];
}

interface InterviewTemplate {
  id: number | string;
  title: string;
  targetRole: string;
  topics: Topic[];
  createdAt: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  status: boolean;
  code: number;
  message: string;
  data: T;
}

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

interface CategoryItemProps {
  topic: Topic;
  topicIdx: number;
  questionInput: string;
  setQuestionInput: (val: string) => void;
  onAddQuestion: () => void;
  onRemoveTopic: () => void;
  onReorderQuestions: (newQuestions: Question[]) => void;
  onRemoveQuestion: (qIdx: number) => void;
  inputError: boolean;
}

type ConfirmType = 'EXIT' | 'DELETE_TEMPLATE' | 'DELETE_TOPIC' | 'DELETE_QUESTION';

interface ConfirmModalState {
  type: ConfirmType;
  data?: string | number | { topicIdx: number; qIdx: number };
}

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
  { value: 'pm_pm', label: '기획자 (PM/PO)' },
  { value: 'qa', label: 'QA / 테스트 엔지니어' },
  { value: 'marketing', label: '퍼포먼스 마케팅' },
  { value: 'other', label: '기타 (직접 입력)' },
];

const API_BASE_URL = '/api/interview-templates';

const shakeVariants = {
  error: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.4 },
  },
};

const SectionCard = ({
  title,
  icon,
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
        <div className="bg-point-blue h-5 w-1.5 rounded-full" />
        {icon && <span className="text-midnight-ink ml-1">{icon}</span>}
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

  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [title, setTitle] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [topicNameInput, setTopicNameInput] = useState('');
  const [currentTopics, setCurrentTopics] = useState<Topic[]>([]);
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
      (title.trim() !== '' ||
        targetRole !== '' ||
        currentTopics.some((t) => t.questions.length > 0))
    );
  }, [view, title, targetRole, currentTopics]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !selectedViewTemplate && currentLocation.pathname !== nextLocation.pathname,
  );

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error();
      const result: ApiResponse<InterviewTemplate[]> = await response.json();

      if (result.status && Array.isArray(result.data)) {
        const fullTemplates = await Promise.all(
          result.data.map(async (baseItem) => {
            try {
              const detailResponse = await fetch(`${API_BASE_URL}/${baseItem.id}`);
              const detailResult = await detailResponse.json();
              return detailResult.status ? detailResult.data : baseItem;
            } catch {
              return baseItem;
            }
          }),
        );
        setTemplates(fullTemplates);
      }
    } catch {
      setTemplates([]);
      showToast('⚠️ 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const fetchTemplateDetail = useCallback(async (id: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) throw new Error();
      const result: ApiResponse<InterviewTemplate> = await response.json();
      if (result.status) {
        setSelectedViewTemplate(result.data);
      }
    } catch {
      showToast('⚠️ 상세 정보를 불러올 수 없습니다.');
    }
  }, []);

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
    return (templates || []).filter(
      (t) => t.title?.toLowerCase().includes(term) || t.targetRole?.toLowerCase().includes(term),
    );
  }, [templates, searchTerm]);

  const handleOpenForm = (template?: InterviewTemplate) => {
    if (template) {
      setEditingId(template.id);
      setTitle(template.title);
      const isCustom = !ROLE_OPTIONS.some((opt) => opt.label === template.targetRole);
      setTargetRole(
        isCustom ? 'other' : ROLE_OPTIONS.find((o) => o.label === template.targetRole)?.value || '',
      );
      setCustomRole(isCustom ? template.targetRole : '');
      setCurrentTopics(template.topics || []);
    } else {
      setEditingId(null);
      setTitle('');
      setTargetRole('');
      setCustomRole('');
      setCurrentTopics([
        { name: isCorporate ? '직무 전문성' : '기술 질문', questions: [], orderIndex: 0 },
        { name: isCorporate ? '공통 역량' : '기본 인성', questions: [], orderIndex: 1 },
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

  const handleTopicInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CATEGORY_LENGTH) {
      setTopicNameInput(value);
      setErrors((prev) => ({ ...prev, topicEmpty: false }));
    }
  };

  const handleAddTopic = () => {
    const name = topicNameInput.trim();
    if (!name) {
      setErrors((prev) => ({ ...prev, topicEmpty: true }));
      return;
    }
    if (currentTopics.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      showToast('⚠️ 이미 존재하는 주제 이름입니다.');
      return;
    }
    setCurrentTopics([{ name, questions: [], orderIndex: currentTopics.length }, ...currentTopics]);
    setTopicNameInput('');
    setErrors((prev) => ({ ...prev, topicEmpty: false }));
  };

  const executeDeleteTopic = (index: number) => {
    setCurrentTopics(currentTopics.filter((_, i) => i !== index));
    setConfirmModal(null);
  };

  const handleAddQuestion = (topicIdx: number) => {
    const content = (questionInputs[topicIdx] || '').trim();
    if (!content) {
      setErrors((prev) => ({ ...prev, [`questionEmpty-${topicIdx}`]: true }));
      return;
    }

    const newQuestion: Question = {
      id: `q-${crypto.randomUUID()}`,
      content,
      orderIndex: currentTopics[topicIdx].questions.length,
    };

    const updated = [...currentTopics];
    updated[topicIdx].questions = [newQuestion, ...updated[topicIdx].questions];
    setCurrentTopics(updated);
    setQuestionInputs((prev) => ({ ...prev, [topicIdx]: '' }));
    setErrors((prev) => ({ ...prev, [`questionEmpty-${topicIdx}`]: false }));
  };

  const executeDeleteQuestion = (topicIdx: number, qIdx: number) => {
    const updated = [...currentTopics];
    updated[topicIdx].questions.splice(qIdx, 1);
    setCurrentTopics(updated);
    setConfirmModal(null);
  };

  const handleSaveTemplate = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!title.trim()) newErrors.title = true;
    if (!targetRole) newErrors.targetRole = true;
    if (targetRole === 'other' && !customRole.trim()) newErrors.customRole = true;
    if (currentTopics.some((t) => t.questions.length === 0)) newErrors.questionsError = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(
        newErrors.questionsError
          ? '⚠️ 모든 주제에 질문을 등록해야 합니다.'
          : '⚠️ 필수 항목을 확인해주세요.',
      );
      scrollToSection(newErrors.questionsError ? categoryInputRef : formRef);
      return;
    }

    const finalRole =
      targetRole === 'other'
        ? customRole.trim()
        : ROLE_OPTIONS.find((r) => r.value === targetRole)?.label || targetRole;

    const mappedTopics = currentTopics.map((topic, tIdx) => ({
      ...topic,
      orderIndex: tIdx,
      questions: topic.questions.map((q, qIdx) => ({
        ...q,
        orderIndex: qIdx,
      })),
    }));

    const templateData = { title, targetRole: finalRole, topics: mappedTopics };

    try {
      const url = editingId ? `${API_BASE_URL}/${editingId}` : API_BASE_URL;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) throw new Error();

      showToast(editingId ? '✅ 템플릿이 수정되었습니다.' : '✅ 템플릿이 저장되었습니다.');
      setView('list');
      fetchTemplates();
    } catch {
      showToast('⚠️ 저장에 실패했습니다.');
    }
  };

  const executeDeleteTemplate = async (id: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setTemplates(templates.filter((t) => t.id !== id));
      setConfirmModal(null);
      showToast('✨ 삭제되었습니다.');
    } catch {
      showToast('⚠️ 삭제에 실패했습니다.');
    }
  };

  if (loading && view === 'list' && templates.length === 0) {
    return (
      <div className="bg-pure-white flex min-h-screen min-w-350 items-center justify-center pt-32">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Loader2 size={64} className="text-point-blue animate-spin" />
          </div>
          <p className="text-silver-mist text-lg font-black whitespace-nowrap">
            데이터를 불러오고 있습니다
          </p>
        </div>
      </div>
    );
  }

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
              ? '보관된 템플릿을 관리하고 검색하세요.'
              : '질문을 구성하고 템플릿을 완성하세요.'}
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
                icon={<ListTodo size={22} />}
                actions={
                  <Button
                    variant="blue"
                    size="md"
                    className="flex shrink-0 items-center gap-2 rounded-xl px-6 font-black whitespace-nowrap shadow-md"
                    onClick={() => handleOpenForm()}
                  >
                    <Plus size={18} />새 템플릿 추가
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
                    <Search
                      className="text-silver-mist absolute top-1/2 left-5 -translate-y-1/2"
                      size={18}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex min-h-80 items-center justify-center">
                    <Loader2 size={40} className="text-point-blue animate-spin" />
                  </div>
                ) : filteredTemplates.length > 0 ? (
                  <div className="grid grid-cols-3 gap-5">
                    {filteredTemplates.map((t) => (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-pure-white relative flex h-full min-h-60 shrink-0 cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-100 p-5 shadow-sm transition-all hover:border-transparent hover:shadow-xl"
                        onClick={() => fetchTemplateDetail(t.id)}
                      >
                        <div className="bg-point-blue absolute top-0 bottom-0 left-0 w-1 transition-all group-hover:w-1.5" />
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 pr-6 pl-2">
                            <div className="mb-0 flex flex-col items-start gap-1.5">
                              <span className="bg-point-blue text-pure-white max-w-full truncate rounded-md px-2.5 py-0.5 text-[11px] font-black tracking-wider whitespace-nowrap uppercase shadow-sm">
                                {t.targetRole}
                              </span>
                              <h4 className="text-midnight-ink w-full truncate text-xl leading-tight font-black break-keep">
                                {t.title}
                              </h4>
                            </div>
                            <span className="text-silver-mist ml-1 text-[11px] font-bold whitespace-nowrap">
                              {t.updatedAt || t.createdAt
                                ? new Date(t.updatedAt || t.createdAt).toLocaleDateString()
                                : '날짜 정보 없음'}
                            </span>
                          </div>
                          <button
                            onClick={(e: MouseEvent) => {
                              e.stopPropagation();
                              setConfirmModal({ type: 'DELETE_TEMPLATE', data: t.id });
                            }}
                            className="text-silver-mist hover:text-error shrink-0 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="relative mb-5 flex flex-wrap items-start gap-1 pl-2">
                          {Array.isArray(t.topics) && t.topics.length > 0 ? (
                            <>
                              {t.topics.slice(0, 4).map((topic, i) => (
                                <span
                                  key={i}
                                  className="bg-point-blue/10 text-point-blue rounded-md px-2 py-0.5 text-[10px] font-black whitespace-nowrap"
                                >
                                  {topic.name} ({topic.questions?.length || 0})
                                </span>
                              ))}
                              {t.topics.length > 4 && (
                                <span className="bg-point-blue/5 text-point-blue rounded-md px-2 py-0.5 text-[10px] font-black whitespace-nowrap italic">
                                  외 {t.topics.length - 4}건
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-silver-mist text-[10px] font-bold italic opacity-60">
                              등록된 주제가 없습니다.
                            </span>
                          )}
                        </div>

                        <div className="mt-auto flex shrink-0 items-center justify-end border-t border-slate-50 pt-3 pl-2">
                          <div className="group/link relative flex items-center gap-1">
                            <span className="text-point-blue text-[11px] font-black whitespace-nowrap transition-transform group-hover/link:translate-x-1">
                              상세 보기
                            </span>
                            <ArrowRight
                              size={12}
                              className="text-point-blue transition-transform group-hover/link:translate-x-1"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-8">
                    <SearchX size={48} className="text-silver-mist mb-4 opacity-30" />
                    <h3 className="text-midnight-ink mb-2 text-xl font-black whitespace-nowrap">
                      검색 결과가 없습니다
                    </h3>
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
                  icon={editingId ? <Settings2 size={22} /> : <PenTool size={22} />}
                  sectionRef={formRef}
                  actions={
                    <Button
                      variant="outline"
                      size="md"
                      className="flex shrink-0 items-center gap-2 rounded-xl px-5 font-black whitespace-nowrap"
                      onClick={handleReturnToList}
                    >
                      <ChevronLeft size={18} />
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
                          value={targetRole}
                          error={!!errors.targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                        />
                        <AnimatePresence>
                          {targetRole === 'other' && (
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
                        <motion.div
                          className="relative flex-1"
                          animate={errors.topicEmpty ? 'error' : ''}
                          variants={shakeVariants}
                        >
                          <Input
                            label="새 주제 추가"
                            placeholder="예: 프로젝트 경험, 지원 동기"
                            value={topicNameInput}
                            onChange={handleTopicInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                            error={errors.topicEmpty ? ' ' : undefined}
                          />
                        </motion.div>
                        <Button
                          variant="outline"
                          className="flex h-11 shrink-0 items-center gap-2 rounded-xl px-6 font-black whitespace-nowrap"
                          onClick={handleAddTopic}
                        >
                          <Plus size={18} />
                          주제 추가
                        </Button>
                      </div>

                      <Reorder.Group
                        axis="y"
                        values={currentTopics}
                        onReorder={setCurrentTopics}
                        className="grid shrink-0 grid-cols-1 gap-6"
                      >
                        {currentTopics.map((topic, topicIdx) => (
                          <CategoryItem
                            key={topic.name}
                            topic={topic}
                            topicIdx={topicIdx}
                            questionInput={questionInputs[topicIdx] || ''}
                            setQuestionInput={(val: string) =>
                              setQuestionInputs((prev) => ({ ...prev, [topicIdx]: val }))
                            }
                            onAddQuestion={() => handleAddQuestion(topicIdx)}
                            onRemoveTopic={() => {
                              if (currentTopics.length <= 1) {
                                showToast('⚠️ 최소 한 개의 주제는 유지되어야 합니다.');
                              } else {
                                setConfirmModal({ type: 'DELETE_TOPIC', data: topicIdx });
                              }
                            }}
                            onReorderQuestions={(newQuestions: Question[]) => {
                              const updated = [...currentTopics];
                              updated[topicIdx].questions = newQuestions;
                              setCurrentTopics(updated);
                            }}
                            onRemoveQuestion={(qIdx: number) =>
                              setConfirmModal({ type: 'DELETE_QUESTION', data: { topicIdx, qIdx } })
                            }
                            inputError={!!errors[`questionEmpty-${topicIdx}`]}
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
          <div className="bg-midnight-ink/60 fixed inset-0 z-7000 flex items-start justify-center backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-pure-white relative mt-10 flex max-h-[calc(100vh-80px)] w-full max-w-4xl flex-col overflow-hidden rounded-4xl px-7 pt-6 pb-7 shadow-2xl"
            >
              <div className="mb-5 flex shrink-0 items-start justify-between">
                <div>
                  <span className="bg-point-blue text-pure-white rounded-lg px-3 py-1 text-sm font-black whitespace-nowrap uppercase">
                    {selectedViewTemplate.targetRole}
                  </span>
                  <h3 className="text-midnight-ink mt-2 truncate text-2xl leading-tight font-black break-keep">
                    {selectedViewTemplate.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 rounded-xl px-4 font-black"
                    onClick={() => {
                      const t = selectedViewTemplate;
                      setSelectedViewTemplate(null);
                      handleOpenForm(t);
                    }}
                  >
                    <Edit3 size={16} /> 수정하기
                  </Button>
                  <button
                    onClick={() => setSelectedViewTemplate(null)}
                    className="text-silver-mist hover:text-midnight-ink transition-colors"
                  >
                    <X size={28} />
                  </button>
                </div>
              </div>

              <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-3">
                {(selectedViewTemplate.topics || []).map((topic, tIdx) => (
                  <div key={tIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-point-blue h-3.5 w-1 rounded-full" />
                      <span className="text-midnight-ink text-lg font-black tracking-tight whitespace-nowrap uppercase">
                        {topic.name}
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {(topic.questions || []).map((q, qIdx) => (
                        <div
                          key={q.id}
                          className="border-soft-pebble/30 bg-cloud-dancer/10 rounded-2xl border p-5 shadow-sm"
                        >
                          <p className="text-midnight-ink text-[15px] leading-relaxed font-bold break-keep">
                            <span className="text-point-blue/30 mr-3 font-black whitespace-nowrap">
                              Q{qIdx + 1}
                            </span>
                            {q.content}
                          </p>
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
                  닫기
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
              <div className="text-error mb-4 flex justify-center">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-midnight-ink mb-1.5 text-xl font-black whitespace-nowrap">
                {confirmModal?.type === 'EXIT' || blocker.state === 'blocked'
                  ? '작성을 중단할까요?'
                  : '정말 삭제할까요?'}
              </h3>
              <p className="text-silver-mist text-base font-bold break-keep">
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
                      case 'DELETE_TOPIC':
                        executeDeleteTopic(confirmModal.data as number);
                        break;
                      case 'DELETE_QUESTION': {
                        const d = confirmModal.data as { topicIdx: number; qIdx: number };
                        executeDeleteQuestion(d.topicIdx, d.qIdx);
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
  topic,
  questionInput,
  setQuestionInput,
  onAddQuestion,
  onRemoveTopic,
  onReorderQuestions,
  onRemoveQuestion,
  inputError,
}: CategoryItemProps) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      key={topic.name}
      value={topic}
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
            <GripVertical size={20} />
          </div>
          <div className="bg-point-blue h-4 w-1 shrink-0 rounded-full" />
          <span className="text-midnight-ink truncate text-lg font-black whitespace-nowrap">
            {topic.name}
          </span>
        </div>
        <button
          onClick={onRemoveTopic}
          className="bg-error text-pure-white hover:bg-pure-white hover:text-error hover:border-error flex shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-black whitespace-nowrap transition-all"
        >
          <Trash2 size={12} />
          주제 삭제
        </button>
      </motion.div>

      <motion.div
        layout="position"
        className="mb-6 flex shrink-0 gap-2"
        animate={inputError ? 'error' : ''}
        variants={shakeVariants}
      >
        <input
          className={`bg-pure-white focus:border-point-blue flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all outline-none ${inputError ? 'border-error shadow-error/10' : 'border-soft-pebble/50'}`}
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
          values={topic.questions || []}
          onReorder={onReorderQuestions}
          className="space-y-3"
        >
          <AnimatePresence initial={false}>
            {(topic.questions || []).map((q: Question, qIdx: number) => (
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
          <GripVertical size={16} />
        </div>
        <span className="text-point-blue/30 mx-2 shrink-0 text-sm font-black whitespace-nowrap">
          Q{qIdx + 1}
        </span>
        <p className="text-midnight-ink truncate pr-3 text-sm leading-normal font-bold break-keep">
          {q.content}
        </p>
      </div>
      <button
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-silver-mist hover:text-error shrink-0 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </Reorder.Item>
  );
};

export default InterviewTemplatePage;
