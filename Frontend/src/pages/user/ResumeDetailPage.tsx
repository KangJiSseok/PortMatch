import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  ChevronDown,
  User,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Upload,
  Camera,
  MessageSquare,
  Bookmark,
} from 'lucide-react';
import Button from '../../components/Button/Button';

interface UserData {
  userId: number;
  name: string;
  email: string;
  role: string;
}

interface Portfolio {
  id: string | number;
  name: string;
}

interface SelfIntro {
  id: string;
  title: string;
  content: string;
}

interface Education {
  school: string;
  major: string;
  status: string;
  period: string;
}

interface Experience {
  company: string;
  role: string;
  period: string;
}

interface ResumeData {
  id: string;
  userId: string | number;
  title: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  profileImage: string | null;
  education: Education[];
  experience: Experience[];
  selectedPortfolioId: string | number | null;
  selectedSelfIntroId: string | null;
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

const MAX_LENGTHS = {
  TITLE: 50,
  NAME: 20,
  EMAIL: 100,
  ADDRESS: 200,
  COMPANY: 50,
  ROLE: 50,
  SCHOOL: 50,
  MAJOR: 50,
  CONTACT: 13,
};

const SectionCard = ({
  title,
  children,
  actions,
  className = '',
  sectionRef,
}: SectionCardProps) => (
  <section
    ref={sectionRef}
    className={`bg-pure-white rounded-4xl border border-slate-100 p-10 shadow-xl shadow-slate-200/50 ${className}`}
  >
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1.5 rounded-full bg-blue-600" />
        <h2 className="text-2xl font-black tracking-tight whitespace-nowrap text-slate-800 uppercase">
          {title}
        </h2>
      </div>
      <div className="flex gap-3">{actions}</div>
    </div>
    <div className="relative">{children}</div>
  </section>
);

function ResumeDetailPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const json = await response.json();
          if (json.status && json.data) {
            setUser(json.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    fetchUser();
  }, []);

  const startNewChat = (id: string, name: string) => console.log(`${name}님과 채팅방 생성`, id);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImgRef = useRef<HTMLInputElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<HTMLDivElement>(null);
  const eduRef = useRef<HTMLDivElement>(null);
  const selfIntroRef = useRef<HTMLDivElement>(null);

  const [allResumes, setAllResumes] = useState<Record<string, ResumeData>>(() => {
    const saved = localStorage.getItem('resumes');
    return saved ? JSON.parse(saved) : {};
  });

  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    const saved = localStorage.getItem('portfolios');
    return saved ? JSON.parse(saved) : [];
  });

  const [selfIntros, setSelfIntros] = useState<SelfIntro[]>(() => {
    const saved = localStorage.getItem('selfIntros');
    return saved ? JSON.parse(saved) : [];
  });

  const [resumeSnapshot, setResumeSnapshot] = useState<Record<string, ResumeData> | null>(null);

  const allResumeKeys = Object.keys(allResumes);
  const isEmpty = allResumeKeys.length === 0;

  useEffect(() => {
    if (allResumeKeys.length > 0) {
      if (!resumeId || resumeId === 'me' || !allResumes[resumeId]) {
        navigate(`/resumes/${allResumeKeys[0]}`, { replace: true });
      }
    }
  }, [resumeId, allResumeKeys, allResumes, navigate]);

  const targetId = resumeId || allResumeKeys[0];
  const resume = allResumes[targetId];

  const [isEditing, setIsEditing] = useState(false);
  const [showResumeList, setShowResumeList] = useState(false);
  const [showPortfolioList, setShowPortfolioList] = useState(false);
  const [showSelfIntroList, setShowSelfIntroList] = useState(false);
  const [innerEditingIntro, setInnerEditingIntro] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'spark' | 'warn';
  } | null>(null);
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'experience' | 'education' | 'portfolio' | 'selfIntro' | 'resume';
    id?: string | number;
    index?: number;
  } | null>(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isEditing && currentLocation.pathname !== nextLocation.pathname,
  );

  const authContext = useMemo(() => {
    if (!user || !resume) return { isOwner: false, isCompany: false };
    const isOwner = String(user.userId) === String(resume.userId);
    const isCompany = user.role === 'COMPANY' && !isOwner;
    return { isOwner, isCompany };
  }, [user, resume]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  const years = useMemo(() => Array.from({ length: 30 }, (_, i) => (2026 - i).toString()), []);
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')),
    [],
  );

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const updateCurrentResume = (updates: Partial<ResumeData>) => {
    setAllResumes((prev) => ({
      ...prev,
      [targetId]: { ...prev[targetId], ...updates },
    }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'spark' | 'warn' = 'success') =>
    setToast({ message, type });

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const yOffset = -180;
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleCreateResume = () => {
    if (isEditing) return;
    setResumeSnapshot({ ...allResumes });
    const baseTitle = '새로운 이력서';
    let finalTitle = baseTitle;
    let counter = 1;
    const existingTitles = Object.values(allResumes).map((r) => r.title);
    while (existingTitles.includes(finalTitle)) {
      finalTitle = `${baseTitle} ${counter}`;
      counter++;
    }
    const newId = `resume-${Date.now()}`;
    const newResume: ResumeData = {
      id: newId,
      userId: user?.userId || 'unknown',
      title: finalTitle,
      name: user?.name || '',
      contact: '',
      email: user?.email || '',
      address: '',
      profileImage: null,
      education: [],
      experience: [],
      selectedPortfolioId: null,
      selectedSelfIntroId: selfIntros[0]?.id || null,
    };
    setAllResumes((prev) => ({ ...prev, [newId]: newResume }));
    navigate(`/resumes/${newId}`, { replace: true });
    setTimeout(() => {
      setIsEditing(true);
      showToast(`${finalTitle} 작성을 시작합니다.`);
    }, 0);
  };

  const toggleEditMode = () => {
    setResumeSnapshot({ ...allResumes });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (resumeSnapshot) {
      setAllResumes(resumeSnapshot);
      const snapshotKeys = Object.keys(resumeSnapshot);
      if (snapshotKeys.length > 0) {
        if (!resumeSnapshot[targetId]) {
          navigate(`/resumes/${snapshotKeys[0]}`, { replace: true });
        }
      } else {
        navigate('/resumes', { replace: true });
      }
    }
    const savedP = localStorage.getItem('portfolios');
    const savedS = localStorage.getItem('selfIntros');
    if (savedP) setPortfolios(JSON.parse(savedP));
    if (savedS) setSelfIntros(JSON.parse(savedS));
    setResumeSnapshot(null);
    setIsEditing(false);
    setInnerEditingIntro(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateAndSave = () => {
    const errors: string[] = [];
    if (innerEditingIntro) {
      showToast("상단의 '내용 저장' 버튼을 먼저 눌러주세요!", 'warn');
      scrollToSection(selfIntroRef);
      return;
    }
    if (!resume.title?.trim()) errors.push('title');
    if (!resume.name?.trim()) errors.push('name');
    if (!resume.email?.trim()) errors.push('email');

    (resume.experience || []).forEach((exp, i) => {
      if (!exp.company?.trim()) errors.push(`exp_company_${i}`);
      if (!exp.role?.trim()) errors.push(`exp_role_${i}`);
    });
    (resume.education || []).forEach((edu, i) => {
      if (!edu.school?.trim()) errors.push(`edu_school_${i}`);
      if (!edu.major?.trim()) errors.push(`edu_major_${i}`);
    });

    if (errors.length > 0) {
      setErrorFields(errors);
      if (errors.includes('title') || errors.includes('name') || errors.includes('email')) {
        showToast('이력서 제목, 성함, 이메일을 모두 입력해주세요!', 'warn');
        scrollToSection(infoRef);
      } else if (errors.some((e) => e.startsWith('exp'))) {
        showToast('경력 사항의 필수 항목을 모두 입력해주세요!', 'warn');
        scrollToSection(expRef);
      } else if (errors.some((e) => e.startsWith('edu'))) {
        showToast('학력 사항의 필수 항목을 모두 입력해주세요!', 'warn');
        scrollToSection(eduRef);
      }
      setTimeout(() => setErrorFields([]), 2500);
      return;
    }

    const titles = selfIntros.map((s) => s.title.trim());
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      showToast('자기소개 목록에 중복된 제목이 있습니다.', 'warn');
      scrollToSection(selfIntroRef);
      return;
    }

    localStorage.setItem('resumes', JSON.stringify(allResumes));
    localStorage.setItem('portfolios', JSON.stringify(portfolios));
    localStorage.setItem('selfIntros', JSON.stringify(selfIntros));
    setResumeSnapshot(null);
    setIsEditing(false);
    showToast('모든 정보가 안전하게 저장되었습니다!', 'success');
  };

  const handleInterviewRequest = () => {
    if (
      window.confirm(`${resume.name}님께 면접을 요청하시겠습니까?\n확인 시 채팅방으로 연결됩니다.`)
    ) {
      startNewChat(resume.id, resume.name);
      showToast('면접 요청을 보냈습니다.', 'success');
    }
  };

  const handleScrap = () => {
    showToast('관심 이력서로 스크랩되었습니다.', 'spark');
  };

  const handlePeriodChange = (
    index: number,
    type: 'experience' | 'education',
    field: 'startYear' | 'startMonth' | 'endYear' | 'endMonth',
    value: string,
  ) => {
    const items = resume[type] || [];
    const item = items[index];
    if (!item) return;
    const parts = item.period?.split(' - ') || ['', ''];
    const start = parts[0]?.split('.') || ['', ''];
    const end = parts[1]?.split('.') || ['', ''];
    const current = {
      startYear: start[0],
      startMonth: start[1],
      endYear: end[0],
      endMonth: end[1],
    };
    const updated = { ...current, [field]: value };
    const startDate = parseInt(`${updated.startYear}${updated.startMonth}`);
    const endDate = parseInt(`${updated.endYear}${updated.endMonth}`);
    if (startDate > endDate) {
      showToast('시작일은 종료일보다 빨라야 합니다.', 'warn');
      return;
    }
    const updatedPeriod = `${updated.startYear}.${updated.startMonth} - ${updated.endYear}.${updated.endMonth}`;
    if (type === 'experience') {
      const newData = [...(resume.experience || [])];
      newData[index] = { ...newData[index], period: updatedPeriod };
      updateCurrentResume({ experience: newData });
    } else {
      const newData = [...(resume.education || [])];
      newData[index] = { ...newData[index], period: updatedPeriod };
      updateCurrentResume({ education: newData });
    }
  };

  const handlePortfolioUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('PDF 형식의 파일만 업로드 가능합니다.', 'warn');
      return;
    }
    const isDuplicate = portfolios.some((p) => p.name === file.name);
    if (isDuplicate) {
      showToast('이미 등록된 파일 이름입니다.', 'warn');
      return;
    }
    const newP = { id: Date.now(), name: file.name };
    setPortfolios((prev) => [newP, ...prev]);
    updateCurrentResume({ selectedPortfolioId: newP.id });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isEditing) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isEditing) {
      const file = e.dataTransfer.files[0];
      if (file) handlePortfolioUpload(file);
    }
  };

  const formatPhoneNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    if (num.length <= 3) return num;
    if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`;
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateCurrentResume({ profileImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const confirmDeleteAction = () => {
    if (!deleteConfirm) return;
    const { type, index, id } = deleteConfirm;
    if (type === 'resume' && id !== undefined) {
      const newAllResumes = { ...allResumes };
      delete newAllResumes[String(id)];
      const remainingIds = Object.keys(newAllResumes);
      setIsEditing(false);
      setAllResumes(newAllResumes);
      localStorage.setItem('resumes', JSON.stringify(newAllResumes));
      if (remainingIds.length > 0) {
        navigate(`/resumes/${remainingIds[0]}`, { replace: true });
      } else {
        navigate('/resumes', { replace: true });
      }
    } else {
      if (type === 'experience' && index !== undefined) {
        const newData = [...(resume.experience || [])];
        newData.splice(index, 1);
        updateCurrentResume({ experience: newData });
      } else if (type === 'education' && index !== undefined) {
        const newData = [...(resume.education || [])];
        newData.splice(index, 1);
        updateCurrentResume({ education: newData });
      } else if (type === 'portfolio' && id !== undefined) {
        const filtered = portfolios.filter((p) => p.id !== id);
        setPortfolios(filtered);
        localStorage.setItem('portfolios', JSON.stringify(filtered));
        if (resume.selectedPortfolioId === id) updateCurrentResume({ selectedPortfolioId: null });
      } else if (type === 'selfIntro' && id !== undefined) {
        const filtered = selfIntros.filter((s) => s.id !== id);
        setSelfIntros(filtered);
        localStorage.setItem('selfIntros', JSON.stringify(filtered));
        if (resume.selectedSelfIntroId === id) {
          updateCurrentResume({ selectedSelfIntroId: filtered[0]?.id || null });
          setInnerEditingIntro(false);
        }
      }
    }
    setDeleteConfirm(null);
  };

  const currentPortfolio = portfolios.find((p) => p.id === resume?.selectedPortfolioId);
  const currentSelfIntro = selfIntros.find((s) => s.id === resume?.selectedSelfIntroId);

  const inputClass = (fieldId?: string) =>
    `w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${errorFields.includes(fieldId || '')
      ? 'border-red-500 bg-red-50/30 ring-4 ring-red-500/5'
      : 'focus:bg-pure-white border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5'
    }`;
  const labelClass =
    'mb-2.5 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase';
  const selectClass =
    'rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm';

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast-msg"
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`${toast.type === 'success' || toast.type === 'spark'
              ? 'bg-blue-600'
              : toast.type === 'warn'
                ? 'bg-amber-500'
                : 'bg-red-500'
              } fixed bottom-24 left-1/2 z-2000 flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-black whitespace-nowrap text-white shadow-2xl`}
          >
            {toast.type === 'success' && <CheckCircle2 size={24} />}
            {toast.type === 'spark' && <Sparkles size={24} />}
            {toast.type === 'warn' && <AlertTriangle size={24} />}
            {toast.type === 'error' && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white">
                <span className="text-sm">!</span>
              </div>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mx-auto w-5xl px-6">
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center pt-20 text-center"
          >
            <div className="mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-slate-50 text-slate-200 shadow-inner">
              <FileText size={80} strokeWidth={1.5} />
            </div>
            <h1 className="mb-4 text-4xl font-black text-slate-900">작성된 이력서가 없습니다</h1>
            <p className="mb-10 text-xl font-bold text-slate-400">
              첫 번째 이력서를 작성하고 당신의 커리어를 관리해보세요!
            </p>
            <Button
              variant="blue"
              size="xl"
              className="min-w-64 rounded-3xl px-12 py-6 font-black shadow-2xl shadow-blue-600/30"
              onClick={handleCreateResume}
            >
              <Plus size={24} className="mr-2" />
              이력서 새로 만들기
            </Button>
          </motion.div>
        ) : (
          <>
            <header className="mb-12 flex items-start justify-between border-l-4 border-blue-600 pl-6">
              <div className="mr-12 min-w-0 flex-1">
                <div className="relative inline-block w-full">
                  <button
                    onClick={() => setShowResumeList(!showResumeList)}
                    className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-70"
                  >
                    <h1 className="truncate text-4xl font-black tracking-tighter text-slate-900 uppercase">
                      {resume?.title || 'My Resume'}
                    </h1>
                    <ChevronDown
                      className={`shrink-0 text-blue-600 transition-transform ${showResumeList ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {showResumeList && (
                      <div key="resume-list-wrapper">
                        <motion.div
                          key="resume-list-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setShowResumeList(false)}
                        />
                        <motion.div
                          key="resume-list-dropdown"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-full left-0 z-50 mt-4 max-w-full min-w-75 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
                        >
                          <div className="flex flex-col">
                            {Object.values(allResumes).map((r) => (
                              <div
                                key={r.id}
                                className={`flex cursor-pointer items-center justify-between border-b border-slate-50 px-6 py-4 transition-colors last:border-0 hover:bg-slate-50 ${r.id === targetId ? 'bg-blue-50/30' : ''}`}
                                onClick={() => {
                                  if (isEditing) {
                                    showToast(
                                      '수정 중에는 다른 이력서로 이동할 수 없습니다.',
                                      'warn',
                                    );
                                    return;
                                  }
                                  navigate(`/resumes/${r.id}`, { replace: true });
                                  setShowResumeList(false);
                                }}
                              >
                                <span
                                  className={`truncate pr-4 text-lg font-bold ${r.id === targetId ? 'text-blue-600' : 'text-slate-800'}`}
                                >
                                  {r.title}
                                </span>
                                <Button
                                  variant="close"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({ type: 'resume', id: r.id });
                                  }}
                                />
                              </div>
                            ))}
                            {!isEditing && (
                              <div
                                className="flex cursor-pointer items-center justify-center gap-2 bg-slate-50 px-6 py-4 text-sm font-black text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                                onClick={() => {
                                  handleCreateResume();
                                  setShowResumeList(false);
                                }}
                              >
                                <Plus size={16} /> 새 이력서 추가
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="mt-2 text-lg font-bold whitespace-nowrap text-slate-400 italic">
                  당신의 특별한 커리어 스토리를 완성하세요
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Button isBack variant="outline" size="md" className="rounded-xl" />
              </div>
            </header>
            <main className="space-y-8">
              <section
                ref={infoRef}
                className={`bg-pure-white rounded-4xl border p-10 shadow-xl transition-all ${isEditing
                  ? 'border-blue-600/30 ring-4 ring-blue-600/5'
                  : 'border-slate-100 shadow-slate-200/50'
                  }`}
              >
                <div className="mb-8 flex items-center gap-3">
                  <div className="h-6 w-1.5 rounded-full bg-blue-600" />
                  <h2 className="text-2xl font-black tracking-tight whitespace-nowrap text-slate-800 uppercase">
                    기본 정보
                  </h2>
                </div>
                <div className="flex flex-wrap gap-12 lg:flex-nowrap">
                  <div className="mx-auto shrink-0 lg:mx-0">
                    <div className="relative h-60 w-48 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-inner">
                      {resume?.profileImage ? (
                        <img
                          src={resume.profileImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-200">
                          <User size={64} strokeWidth={1.5} />
                        </div>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => profileImgRef.current?.click()}
                          className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 text-sm font-black text-white opacity-0 transition-opacity hover:opacity-100"
                        >
                          <Camera size={24} className="mb-2" />
                          사진 변경
                        </button>
                      )}
                    </div>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 w-48 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                      >
                        <h4 className="mb-1 flex items-center text-xs font-black text-blue-600">
                          <Camera size={12} className="mr-1" /> 사진 규격 안내
                        </h4>
                        <ul className="space-y-0.5 text-[10px] leading-tight font-bold text-slate-400">
                          <li>• 권장: 35 x 45 mm</li>
                          <li>• 형식: JPG, PNG</li>
                          <li>• 배경: 단색 권장</li>
                        </ul>
                      </motion.div>
                    )}
                    <input
                      type="file"
                      ref={profileImgRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                    />
                  </div>
                  <div className="w-full min-w-0 flex-1">
                    {!isEditing ? (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-slate-900 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                              Name
                            </span>
                            <h1 className="text-5xl leading-tight font-black tracking-tight break-all text-slate-900">
                              {resume?.name || '성함을 입력하세요'}
                            </h1>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                              Resume Title
                            </span>
                            <p className="text-2xl font-bold break-all text-blue-600">
                              {resume?.title}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                              <Phone size={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                                Contact
                              </p>
                              <p className="text-lg font-bold break-all text-slate-700">
                                {resume?.contact || '미입력'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                              <Mail size={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                                Email
                              </p>
                              <p className="text-lg font-bold break-all text-slate-700">
                                {resume?.email || '미입력'}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-1 flex items-center gap-4 rounded-2xl bg-slate-50 p-5 md:col-span-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                              <MapPin size={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                                Address
                              </p>
                              <p className="text-lg font-bold break-all text-slate-700">
                                {resume?.address || '미입력'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="relative">
                            <label className={labelClass}>
                              이력서 제목 <span className="text-red-500">*</span>
                            </label>
                            <input
                              className={inputClass('title')}
                              value={resume?.title || ''}
                              maxLength={MAX_LENGTHS.TITLE}
                              placeholder="예) 프론트엔드 개발자 이력서"
                              onChange={(e) => updateCurrentResume({ title: e.target.value })}
                            />
                            <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                              {(resume?.title || '').length}/{MAX_LENGTHS.TITLE}
                            </span>
                          </div>
                          <div className="relative">
                            <label className={labelClass}>
                              성함 <span className="text-red-500">*</span>
                            </label>
                            <input
                              className={inputClass('name')}
                              value={resume?.name || ''}
                              maxLength={MAX_LENGTHS.NAME}
                              placeholder="이름을 입력하세요"
                              onChange={(e) => updateCurrentResume({ name: e.target.value })}
                            />
                            <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                              {(resume?.name || '').length}/{MAX_LENGTHS.NAME}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="relative">
                            <label className={labelClass}>연락처</label>
                            <input
                              className={inputClass()}
                              value={resume?.contact || ''}
                              maxLength={MAX_LENGTHS.CONTACT}
                              placeholder="010-0000-0000"
                              onChange={(e) =>
                                updateCurrentResume({ contact: formatPhoneNumber(e.target.value) })
                              }
                            />
                          </div>
                          <div className="relative">
                            <label className={labelClass}>
                              이메일 <span className="text-red-500">*</span>
                            </label>
                            <input
                              className={inputClass('email')}
                              value={resume?.email || ''}
                              maxLength={MAX_LENGTHS.EMAIL}
                              placeholder="example@mail.com"
                              onChange={(e) => updateCurrentResume({ email: e.target.value })}
                            />
                            <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                              {(resume?.email || '').length}/{MAX_LENGTHS.EMAIL}
                            </span>
                          </div>
                          <div className="relative col-span-1 md:col-span-2">
                            <label className={labelClass}>주소</label>
                            <input
                              className={inputClass()}
                              value={resume?.address || ''}
                              maxLength={MAX_LENGTHS.ADDRESS}
                              placeholder="주소를 입력하세요"
                              onChange={(e) => updateCurrentResume({ address: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              {(['experience', 'education'] as const).map((type) => (
                <SectionCard
                  key={type}
                  sectionRef={type === 'experience' ? expRef : eduRef}
                  title={type === 'experience' ? '경력 사항' : '학력 사항'}
                  actions={
                    isEditing && (
                      <Button
                        variant="blue"
                        size="md"
                        className="min-w-20 rounded-xl font-black"
                        onClick={() => {
                          if (type === 'experience') {
                            const newData: Experience[] = [
                              ...(resume.experience || []),
                              { company: '', role: '', period: '2024.01 - 2024.01' },
                            ];
                            updateCurrentResume({ experience: newData });
                          } else {
                            const newData: Education[] = [
                              ...(resume.education || []),
                              { school: '', major: '', status: '', period: '2024.01 - 2024.01' },
                            ];
                            updateCurrentResume({ education: newData });
                          }
                        }}
                      >
                        <Plus size={16} className="mr-1" /> 추가
                      </Button>
                    )
                  }
                >
                  <div className="space-y-4">
                    {resume?.[type] && resume[type].length > 0 ? (
                      resume[type].map((item, i) => (
                        <div
                          key={i}
                          className={`group relative rounded-2xl border transition-all ${isEditing ? 'border-blue-100 bg-slate-50/50 p-6 pt-10' : 'border-slate-50 bg-white p-6 shadow-sm hover:border-blue-100 hover:shadow-md'}`}
                        >
                          {isEditing && (
                            <div className="absolute top-4 right-4 z-10">
                              <Button
                                variant="close"
                                size="sm"
                                onClick={() => setDeleteConfirm({ type, index: i })}
                              />
                            </div>
                          )}
                          {!isEditing ? (
                            <div className="flex w-full flex-wrap items-center">
                              <div className="flex min-w-0 flex-1 items-center pr-6">
                                <span className="mr-3 shrink-0 rounded bg-slate-100 px-2 py-1 text-sm font-black tracking-tighter text-slate-400 uppercase">
                                  소속
                                </span>
                                <span className="truncate text-xl font-black break-all text-slate-900">
                                  {type === 'experience'
                                    ? (item as Experience).company
                                    : (item as Education).school}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 items-center px-6">
                                <span className="mr-3 shrink-0 rounded bg-slate-100 px-2 py-1 text-sm font-black tracking-tighter text-slate-400 uppercase">
                                  {type === 'experience' ? '역할' : '전공'}
                                </span>
                                <span className="truncate text-lg font-bold break-all text-slate-600">
                                  {type === 'experience'
                                    ? (item as Experience).role
                                    : (item as Education).major}
                                </span>
                              </div>
                              <div className="flex items-center pl-6">
                                <span className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-base font-black whitespace-nowrap text-blue-600">
                                  {item.period}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
                              <div className="relative col-span-1 md:col-span-4">
                                <label className={labelClass}>
                                  {type === 'experience' ? '회사명' : '학교명'}{' '}
                                  <span className="ml-1 text-red-500">*</span>
                                </label>
                                <input
                                  className={inputClass(
                                    type === 'experience' ? `exp_company_${i}` : `edu_school_${i}`,
                                  )}
                                  value={
                                    type === 'experience'
                                      ? (item as Experience).company
                                      : (item as Education).school
                                  }
                                  onChange={(e) => {
                                    if (type === 'experience') {
                                      const newData = [...resume.experience];
                                      newData[i] = { ...newData[i], company: e.target.value };
                                      updateCurrentResume({ experience: newData });
                                    } else {
                                      const newData = [...resume.education];
                                      newData[i] = { ...newData[i], school: e.target.value };
                                      updateCurrentResume({ education: newData });
                                    }
                                  }}
                                />
                              </div>
                              <div className="relative col-span-1 md:col-span-3">
                                <label className={labelClass}>
                                  {type === 'experience' ? '직무' : '전공/상태'}{' '}
                                  <span className="ml-1 text-red-500">*</span>
                                </label>
                                <input
                                  className={inputClass(
                                    type === 'experience' ? `exp_role_${i}` : `edu_major_${i}`,
                                  )}
                                  value={
                                    type === 'experience'
                                      ? (item as Experience).role
                                      : (item as Education).major
                                  }
                                  onChange={(e) => {
                                    if (type === 'experience') {
                                      const newData = [...resume.experience];
                                      newData[i] = { ...newData[i], role: e.target.value };
                                      updateCurrentResume({ experience: newData });
                                    } else {
                                      const newData = [...resume.education];
                                      newData[i] = { ...newData[i], major: e.target.value };
                                      updateCurrentResume({ education: newData });
                                    }
                                  }}
                                />
                              </div>
                              <div className="col-span-1 md:col-span-5">
                                <label className={labelClass}>기간</label>
                                <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap">
                                  <select
                                    className={selectClass}
                                    value={item.period?.split(' - ')[0]?.split('.')[0]}
                                    onChange={(e) =>
                                      handlePeriodChange(i, type, 'startYear', e.target.value)
                                    }
                                  >
                                    {years.map((y) => (
                                      <option key={y} value={y}>
                                        {y}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    className={selectClass}
                                    value={item.period?.split(' - ')[0]?.split('.')[1]}
                                    onChange={(e) =>
                                      handlePeriodChange(i, type, 'startMonth', e.target.value)
                                    }
                                  >
                                    {months.map((m) => (
                                      <option key={m} value={m}>
                                        {m}
                                      </option>
                                    ))}
                                  </select>
                                  <span className="font-black text-slate-300">-</span>
                                  <select
                                    className={selectClass}
                                    value={item.period?.split(' - ')[1]?.split('.')[0]}
                                    onChange={(e) =>
                                      handlePeriodChange(i, type, 'endYear', e.target.value)
                                    }
                                  >
                                    {years.map((y) => (
                                      <option key={y} value={y}>
                                        {y}
                                      </option>
                                    ))}
                                  </select>
                                  <select
                                    className={selectClass}
                                    value={item.period?.split(' - ')[1]?.split('.')[1]}
                                    onChange={(e) =>
                                      handlePeriodChange(i, type, 'endMonth', e.target.value)
                                    }
                                  >
                                    {months.map((m) => (
                                      <option key={m} value={m}>
                                        {m}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-slate-100 py-12 text-center text-lg font-bold text-slate-400">
                        등록된 내역이 없습니다.
                      </div>
                    )}
                  </div>
                </SectionCard>
              ))}
              <SectionCard title="포트폴리오">
                <div className="space-y-6">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-wrap items-center gap-4 p-1 transition-all sm:flex-nowrap ${isDragging ? 'ring-dashed rounded-2xl bg-blue-50 ring-2 ring-blue-600' : ''}`}
                  >
                    <div className="relative w-full min-w-0 flex-1">
                      <div
                        onClick={() =>
                          isEditing &&
                          portfolios.length > 0 &&
                          setShowPortfolioList(!showPortfolioList)
                        }
                        className={`flex items-center justify-between overflow-hidden rounded-2xl border px-6 py-4 transition-all ${isEditing ? 'cursor-pointer border-blue-600 bg-white shadow-sm ring-4 ring-blue-600/5' : 'border-slate-100 bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText
                            size={20}
                            className={currentPortfolio ? 'text-blue-600' : 'text-slate-300'}
                          />
                          <span
                            className={`truncate text-lg font-bold ${currentPortfolio ? 'text-blue-600' : 'text-slate-400'}`}
                          >
                            {currentPortfolio?.name || '등록된 포트폴리오가 없습니다.'}
                          </span>
                        </div>
                        {isEditing && (
                          <ChevronDown
                            size={20}
                            className={`text-blue-600 transition-transform ${showPortfolioList ? 'rotate-180' : ''}`}
                          />
                        )}
                      </div>
                      <AnimatePresence>
                        {showPortfolioList && isEditing && (
                          <>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-60"
                              onClick={() => setShowPortfolioList(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="absolute top-full left-0 z-70 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
                            >
                              {portfolios.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
                                  onClick={() => {
                                    updateCurrentResume({ selectedPortfolioId: p.id });
                                    setShowPortfolioList(false);
                                  }}
                                >
                                  <span className="mr-4 truncate font-bold text-slate-700">
                                    {p.name}
                                  </span>
                                  <Button
                                    variant="close"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm({ type: 'portfolio', id: p.id });
                                    }}
                                  />
                                </div>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="min-w-35 rounded-2xl border-2 font-black whitespace-nowrap"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={18} className="mr-2" /> 파일 업로드
                      </Button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePortfolioUpload(file);
                      }}
                    />
                  </div>
                </div>
              </SectionCard>
              <SectionCard
                title="자기소개"
                sectionRef={selfIntroRef}
                actions={
                  isEditing && (
                    <div className="flex items-center gap-2">
                      {!innerEditingIntro ? (
                        <>
                          <Button
                            variant="blue"
                            size="md"
                            className="min-w-20 rounded-xl font-black"
                            onClick={() => {
                              const newIntro: SelfIntro = {
                                id: `si-${Date.now()}`,
                                title: '',
                                content: '',
                              };
                              setSelfIntros([...selfIntros, newIntro]);
                              updateCurrentResume({ selectedSelfIntroId: newIntro.id });
                              setInnerEditingIntro(true);
                            }}
                          >
                            <Plus size={16} className="mr-1" /> 추가
                          </Button>
                          <Button
                            variant="blue"
                            size="md"
                            className="min-w-22.5 rounded-xl font-black"
                            onClick={() => {
                              if (!currentSelfIntro) {
                                showToast('수정할 자기소개를 선택하거나 새로 추가해주세요.', 'warn');
                                return;
                              }
                              setInnerEditingIntro(true);
                            }}
                          >
                            내용 수정
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="md"
                            className="min-w-17.5 rounded-xl bg-white font-black"
                            onClick={() => {
                              setInnerEditingIntro(false);
                              const saved = localStorage.getItem('selfIntros');
                              if (saved) setSelfIntros(JSON.parse(saved));
                            }}
                          >
                            취소
                          </Button>
                          <Button
                            variant="blue"
                            size="md"
                            className="min-w-22.5 rounded-xl font-black"
                            onClick={() => {
                              const current = selfIntros.find(
                                (s) => s.id === resume?.selectedSelfIntroId,
                              );
                              if (!current?.title?.trim() || !current?.content?.trim()) {
                                showToast('제목과 내용을 모두 입력해주세요!', 'warn');
                                return;
                              }
                              const isDuplicate = selfIntros.some(
                                (s) => s.id !== current.id && s.title.trim() === current.title.trim(),
                              );
                              if (isDuplicate) {
                                showToast('이미 존재하는 자기소개 제목입니다.', 'warn');
                                return;
                              }
                              localStorage.setItem('selfIntros', JSON.stringify(selfIntros));
                              setInnerEditingIntro(false);
                              showToast('자기소개 내용이 저장되었습니다.', 'success');
                            }}
                          >
                            내용 저장
                          </Button>
                        </>
                      )}
                    </div>
                  )
                }
              >
                <div className="space-y-6">
                  <div className="relative">
                    <div
                      onClick={() =>
                        isEditing &&
                        !innerEditingIntro &&
                        selfIntros.length > 0 &&
                        setShowSelfIntroList(!showSelfIntroList)
                      }
                      className={`flex items-center justify-between overflow-hidden rounded-2xl border px-6 py-4 transition-all ${isEditing && !innerEditingIntro ? 'cursor-pointer border-blue-600 bg-white shadow-sm ring-4 ring-blue-600/5' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <div className="mr-4 flex min-w-0 flex-1 items-center gap-2">
                        <FileText
                          size={20}
                          className={currentSelfIntro ? 'text-blue-600' : 'text-slate-300'}
                        />
                        {innerEditingIntro ? (
                          <input
                            className="w-full bg-transparent text-xl font-black text-blue-600 outline-none"
                            value={currentSelfIntro?.title || ''}
                            maxLength={MAX_LENGTHS.TITLE}
                            placeholder="자기소개 제목을 입력하세요"
                            autoFocus
                            onChange={(e) =>
                              setSelfIntros(
                                selfIntros.map((s) =>
                                  s.id === resume?.selectedSelfIntroId
                                    ? { ...s, title: e.target.value }
                                    : s,
                                ),
                              )
                            }
                          />
                        ) : (
                          <span
                            className={`truncate text-xl font-black ${currentSelfIntro ? 'text-blue-600' : 'text-slate-400'}`}
                          >
                            {currentSelfIntro?.title || '등록된 자기소개가 없습니다.'}
                          </span>
                        )}
                      </div>
                      {isEditing && !innerEditingIntro && (
                        <ChevronDown
                          size={20}
                          className={`text-blue-600 transition-transform ${showSelfIntroList ? 'rotate-180' : ''}`}
                        />
                      )}
                    </div>
                    <AnimatePresence>
                      {showSelfIntroList && isEditing && !innerEditingIntro && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-60"
                            onClick={() => setShowSelfIntroList(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-full left-0 z-70 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
                          >
                            {selfIntros.map((s) => (
                              <div
                                key={s.id}
                                className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
                                onClick={() => {
                                  updateCurrentResume({ selectedSelfIntroId: s.id });
                                  setShowSelfIntroList(false);
                                }}
                              >
                                <span className="mr-4 truncate font-bold text-slate-700">
                                  {s.title || '(제목 없음)'}
                                </span>
                                <Button
                                  variant="close"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({ type: 'selfIntro', id: s.id });
                                  }}
                                />
                              </div>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <div
                    className={`relative overflow-hidden rounded-2xl border p-8 transition-all ${innerEditingIntro ? 'border-blue-600 bg-white ring-4 ring-blue-600/5' : 'border-slate-50 bg-slate-50/30 shadow-inner'}`}
                  >
                    {innerEditingIntro ? (
                      <textarea
                        className="min-h-75 w-full resize-none bg-transparent text-lg leading-relaxed font-bold outline-none"
                        placeholder="내용을 입력하세요."
                        value={currentSelfIntro?.content || ''}
                        onChange={(e) =>
                          setSelfIntros(
                            selfIntros.map((s) =>
                              s.id === resume?.selectedSelfIntroId
                                ? { ...s, content: e.target.value }
                                : s,
                            ),
                          )
                        }
                      />
                    ) : (
                      <p className="min-h-25 text-lg leading-relaxed font-bold break-all whitespace-pre-wrap text-slate-700">
                        {currentSelfIntro?.content || '등록된 자기소개가 없습니다.'}
                      </p>
                    )}
                  </div>
                </div>
              </SectionCard>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-18">
                {!isEditing ? (
                  <>
                    {authContext.isOwner && (
                      <Button
                        variant="blue"
                        size="xl"
                        className="w-full min-w-70 rounded-[20px] px-10 py-5 font-black shadow-lg shadow-blue-600/20 sm:w-auto"
                        onClick={toggleEditMode}
                      >
                        이력서 수정하기
                      </Button>
                    )}
                    {authContext.isCompany && (
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="xl"
                          className="flex min-w-40 items-center justify-center gap-2 rounded-[20px] px-10 py-5 font-black"
                          onClick={handleScrap}
                        >
                          <Bookmark size={20} />
                          스크랩하기
                        </Button>
                        <Button
                          variant="blue"
                          size="xl"
                          className="flex min-w-70 items-center justify-center gap-2 rounded-[20px] px-10 py-5 font-black shadow-lg shadow-blue-600/20"
                          onClick={handleInterviewRequest}
                        >
                          <MessageSquare size={20} />
                          면접 요청하기
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="xl"
                      className="w-full min-w-50 rounded-[20px] px-10 py-5 font-black sm:w-auto"
                      onClick={handleCancelEdit}
                    >
                      취소
                    </Button>
                    <Button
                      variant="blue"
                      size="xl"
                      className="w-full min-w-70 rounded-[20px] px-10 py-5 font-black shadow-lg shadow-blue-600/20 sm:w-auto"
                      onClick={validateAndSave}
                    >
                      저장 및 완료
                    </Button>
                  </>
                )}
              </div>
            </main>
          </>
        )}
      </div>
      <AnimatePresence>
        {(deleteConfirm || (blocker.state === 'blocked' && isEditing)) && (
          <div className="fixed inset-0 z-3000 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setDeleteConfirm(null);
                blocker.reset?.();
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-[40px] bg-white p-10 text-center shadow-2xl"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle size={40} />
              </div>
              <h3 className="mb-2 text-2xl font-black text-slate-900">
                {deleteConfirm ? '정말 삭제할까요?' : '수정 사항을 취소할까요?'}
              </h3>
              <p className="text-lg font-bold text-slate-500">
                {deleteConfirm
                  ? '삭제된 데이터는 복구할 수 없습니다.'
                  : '페이지를 벗어나면 변경 사항이 사라집니다.'}
              </p>
              <div className="mt-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={() => {
                    setDeleteConfirm(null);
                    blocker.reset?.();
                  }}
                >
                  {deleteConfirm ? '취소' : '계속 수정'}
                </Button>
                <Button
                  variant="red"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={() => {
                    if (deleteConfirm) confirmDeleteAction();
                    else blocker.proceed?.();
                  }}
                >
                  {deleteConfirm ? '삭제하기' : '나가기'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ResumeDetailPage;