import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button/Button';

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

const INITIAL_RESUMES: Record<string, ResumeData> = {
  frontend: {
    id: 'frontend',
    title: '프론트엔드 이력서',
    name: '김싸피',
    contact: '010-1234-5678',
    email: 'kim@ssafy.com',
    address: '서울특별시 강남구 테헤란로 123',
    profileImage: null,
    education: [
      { school: '한국대학교', major: '컴퓨터공학과', status: '졸업', period: '2018.03 - 2023.02' },
    ],
    experience: [{ company: 'A 스타트업', role: '인턴', period: '2023.01 - 2023.06' }],
    selectedPortfolioId: 1,
    selectedSelfIntroId: 'si-1',
  },
  backend: {
    id: 'backend',
    title: '백엔드 이력서',
    name: '김싸피',
    contact: '010-1234-5678',
    email: 'kim@ssafy.com',
    address: '경기도 성남시 분당구 판교역로 456',
    profileImage: null,
    education: [
      { school: '한국대학교', major: '컴퓨터공학과', status: '졸업', period: '2018.03 - 2023.02' },
    ],
    experience: [{ company: 'B 솔루션', role: '백엔드 개발자', period: '2022.05 - 2023.12' }],
    selectedPortfolioId: 2,
    selectedSelfIntroId: 'si-2',
  },
};

const INITIAL_PORTFOLIOS: Portfolio[] = [
  { id: 1, name: '2024_프론트엔드_이력서_최종.pdf' },
  { id: 2, name: '경력기술서_백엔드_v2.pdf' },
  { id: 3, name: '개인프로젝트_상세_포트폴리오.pdf' },
];

const INITIAL_SELF_INTROS: SelfIntro[] = [
  {
    id: 'si-1',
    title: '성장하는 개발자',
    content: '끊임없이 학습하며 동료들과 함께 성장하는 것을 즐깁니다.',
  },
  {
    id: 'si-2',
    title: '문제 해결 중심',
    content: '복잡한 비즈니스 로직을 단순화하고 효율적인 코드를 작성하는 데 강점이 있습니다.',
  },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImgRef = useRef<HTMLInputElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<HTMLDivElement>(null);
  const eduRef = useRef<HTMLDivElement>(null);
  const selfIntroRef = useRef<HTMLDivElement>(null);

  const [allResumes, setAllResumes] = useState<Record<string, ResumeData>>(() => {
    const saved = localStorage.getItem('resumes');
    return saved ? JSON.parse(saved) : INITIAL_RESUMES;
  });

  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    const saved = localStorage.getItem('portfolios');
    return saved ? JSON.parse(saved) : INITIAL_PORTFOLIOS;
  });

  const [selfIntros, setSelfIntros] = useState<SelfIntro[]>(() => {
    const saved = localStorage.getItem('selfIntros');
    return saved ? JSON.parse(saved) : INITIAL_SELF_INTROS;
  });

  const [resumeSnapshot, setResumeSnapshot] = useState<Record<string, ResumeData> | null>(null);

  const targetId = resumeId || 'frontend';
  const resume = allResumes[targetId] || allResumes['frontend'] || INITIAL_RESUMES['frontend'];

  const [isEditing, setIsEditing] = useState(false);
  const [showResumeList, setShowResumeList] = useState(false);
  const [showPortfolioList, setShowPortfolioList] = useState(false);
  const [showSelfIntroList, setShowSelfIntroList] = useState(false);
  const [innerEditingIntro, setInnerEditingIntro] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'experience' | 'education' | 'portfolio' | 'selfIntro';
    id?: string | number;
    index?: number;
  } | null>(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isEditing && currentLocation.pathname !== nextLocation.pathname,
  );

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
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const updateCurrentResume = (updates: Partial<ResumeData>) => {
    setAllResumes((prev) => ({
      ...prev,
      [targetId]: { ...prev[targetId], ...updates },
    }));
  };

  const showToast = (msg: string) => setToastMessage(msg);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const yOffset = -180;
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const toggleEditMode = () => {
    setResumeSnapshot(allResumes);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (resumeSnapshot) {
      setAllResumes(resumeSnapshot);
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
      showToast("⚠️ 상단의 '내용 저장' 버튼을 먼저 눌러주세요!");
      scrollToSection(selfIntroRef);
      return;
    }
    if (!resume.title?.trim()) errors.push('title');
    if (!resume.name?.trim()) errors.push('name');

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
      if (errors.includes('title') || errors.includes('name')) {
        showToast('⚠️ 이력서 제목과 성함을 입력해주세요!');
        scrollToSection(infoRef);
      } else if (errors.some((e) => e.startsWith('exp'))) {
        showToast('⚠️ 경력 사항의 필수 항목을 모두 입력해주세요!');
        scrollToSection(expRef);
      } else if (errors.some((e) => e.startsWith('edu'))) {
        showToast('⚠️ 학력 사항의 필수 항목을 모두 입력해주세요!');
        scrollToSection(eduRef);
      }
      setTimeout(() => setErrorFields([]), 2500);
      return;
    }

    localStorage.setItem('resumes', JSON.stringify(allResumes));
    localStorage.setItem('portfolios', JSON.stringify(portfolios));
    localStorage.setItem('selfIntros', JSON.stringify(selfIntros));
    setResumeSnapshot(null);
    setIsEditing(false);
    showToast('✅ 모든 정보가 안전하게 저장되었습니다!');
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
      showToast('⚠️ 시작일은 종료일보다 빨라야 합니다.');
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
      showToast('⚠️ PDF 형식의 파일만 업로드 가능합니다.');
      return;
    }
    const isDuplicate = portfolios.some((p) => p.name === file.name);
    if (isDuplicate) {
      showToast('⚠️ 이미 등록된 파일 이름입니다.');
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

  const handleDragLeave = () => {
    setIsDragging(false);
  };

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
    setDeleteConfirm(null);
  };

  const currentPortfolio = portfolios.find((p) => p.id === resume.selectedPortfolioId);
  const currentSelfIntro = selfIntros.find((s) => s.id === resume.selectedSelfIntroId);

  const inputClass = (fieldId?: string) =>
    `w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
      errorFields.includes(fieldId || '')
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
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`${
              toastMessage.startsWith('✅') ? 'bg-blue-600' : 'bg-red-500'
            } fixed bottom-24 left-1/2 z-[2000] flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-black whitespace-nowrap text-white shadow-2xl`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-5xl px-6">
        <header className="mb-12 border-l-4 border-blue-600 pl-6">
          <div className="relative inline-block w-full max-w-full">
            <button
              onClick={() => setShowResumeList(!showResumeList)}
              className="flex items-center gap-3 text-left text-4xl font-black tracking-tighter text-slate-900 uppercase transition-opacity hover:opacity-70"
            >
              <span className="inline-block max-w-[800px] truncate">
                {resume.title || 'My Resume'}
              </span>
              <span className="shrink-0 text-2xl text-blue-600">▾</span>
            </button>
            <AnimatePresence>
              {showResumeList && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowResumeList(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 z-50 mt-4 max-w-full min-w-[300px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
                  >
                    {Object.values(allResumes).map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          navigate(`/resume/${r.id}`);
                          setShowResumeList(false);
                        }}
                        className="cursor-pointer truncate border-b border-slate-50 px-6 py-4 text-lg font-bold text-slate-800 transition-colors last:border-0 hover:bg-slate-50"
                      >
                        {r.title}
                      </div>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-2 text-lg font-bold whitespace-nowrap text-slate-400 italic">
            당신만의 특별한 커리어 스토리를 완성하세요
          </p>
        </header>

        <main className="space-y-8">
          <section
            ref={infoRef}
            className={`bg-pure-white rounded-4xl border p-10 shadow-xl transition-all ${
              isEditing
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
                  {resume.profileImage ? (
                    <img
                      src={resume.profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-200">
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => profileImgRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-sm font-black text-white opacity-0 transition-opacity hover:opacity-100"
                    >
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
                    <h4 className="mb-1 text-xs font-black text-blue-600">📷 사진 규격 안내</h4>
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
                          {resume.name}
                        </h1>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                          Resume Title
                        </span>
                        <p className="text-2xl font-bold break-all text-blue-600">{resume.title}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                          📞
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                            Contact
                          </p>
                          <p className="text-lg font-bold break-all text-slate-700">
                            {resume.contact || '미입력'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                          ✉️
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                            Email
                          </p>
                          <p className="text-lg font-bold break-all text-slate-700">
                            {resume.email || '미입력'}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-1 flex items-center gap-4 rounded-2xl bg-slate-50 p-5 md:col-span-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                          📍
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                            Address
                          </p>
                          <p className="text-lg font-bold break-all text-slate-700">
                            {resume.address || '미입력'}
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
                          value={resume.title || ''}
                          maxLength={MAX_LENGTHS.TITLE}
                          placeholder="예) 프론트엔드 개발자 이력서"
                          onChange={(e) => updateCurrentResume({ title: e.target.value })}
                        />
                        <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                          {(resume.title || '').length}/{MAX_LENGTHS.TITLE}
                        </span>
                      </div>
                      <div className="relative">
                        <label className={labelClass}>
                          성함 <span className="text-red-500">*</span>
                        </label>
                        <input
                          className={inputClass('name')}
                          value={resume.name || ''}
                          maxLength={MAX_LENGTHS.NAME}
                          placeholder="이름을 입력하세요"
                          onChange={(e) => updateCurrentResume({ name: e.target.value })}
                        />
                        <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                          {(resume.name || '').length}/{MAX_LENGTHS.NAME}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="relative">
                        <label className={labelClass}>연락처</label>
                        <input
                          className={inputClass()}
                          value={resume.contact || ''}
                          maxLength={MAX_LENGTHS.CONTACT}
                          placeholder="010-0000-0000"
                          onChange={(e) =>
                            updateCurrentResume({ contact: formatPhoneNumber(e.target.value) })
                          }
                        />
                        <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                          {(resume.contact || '').length}/{MAX_LENGTHS.CONTACT}
                        </span>
                      </div>
                      <div className="relative">
                        <label className={labelClass}>이메일</label>
                        <input
                          className={inputClass()}
                          value={resume.email || ''}
                          maxLength={MAX_LENGTHS.EMAIL}
                          placeholder="example@mail.com"
                          onChange={(e) => updateCurrentResume({ email: e.target.value })}
                        />
                        <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                          {(resume.email || '').length}/{MAX_LENGTHS.EMAIL}
                        </span>
                      </div>
                      <div className="relative col-span-1 md:col-span-2">
                        <label className={labelClass}>주소</label>
                        <input
                          className={inputClass()}
                          value={resume.address || ''}
                          maxLength={MAX_LENGTHS.ADDRESS}
                          placeholder="주소를 입력하세요"
                          onChange={(e) => updateCurrentResume({ address: e.target.value })}
                        />
                        <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                          {(resume.address || '').length}/{MAX_LENGTHS.ADDRESS}
                        </span>
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
                    className="min-w-[80px] rounded-xl font-black"
                    onClick={() => {
                      if (type === 'experience') {
                        updateCurrentResume({
                          experience: [
                            ...(resume.experience || []),
                            { company: '', role: '', period: '2024.01 - 2024.01' },
                          ],
                        });
                      } else {
                        updateCurrentResume({
                          education: [
                            ...(resume.education || []),
                            { school: '', major: '', status: '', period: '2024.01 - 2024.01' },
                          ],
                        });
                      }
                    }}
                  >
                    추가
                  </Button>
                )
              }
            >
              <div className="space-y-4">
                {resume[type] && resume[type].length > 0 ? (
                  resume[type].map((item, i) => (
                    <div
                      key={i}
                      className={`group relative rounded-2xl border transition-all ${
                        isEditing
                          ? 'border-blue-100 bg-slate-50/50 p-6 pt-10'
                          : 'border-slate-50 bg-white p-6 shadow-sm hover:border-blue-100 hover:shadow-md'
                      }`}
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
                          <div className="hidden h-8 w-px bg-slate-200 md:block" />
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
                          <div className="hidden h-8 w-px bg-slate-200 md:block" />
                          <div className="flex items-center pl-6">
                            <span className="mr-3 shrink-0 rounded bg-slate-100 px-2 py-1 text-sm font-black tracking-tighter text-slate-400 uppercase">
                              기간
                            </span>
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
                              maxLength={
                                type === 'experience' ? MAX_LENGTHS.COMPANY : MAX_LENGTHS.SCHOOL
                              }
                              placeholder={
                                type === 'experience'
                                  ? '회사명을 입력하세요'
                                  : '학교명을 입력하세요'
                              }
                              onChange={(e) => {
                                if (type === 'experience') {
                                  const newData = [...(resume.experience || [])];
                                  newData[i] = { ...newData[i], company: e.target.value };
                                  updateCurrentResume({ experience: newData });
                                } else {
                                  const newData = [...(resume.education || [])];
                                  newData[i] = { ...newData[i], school: e.target.value };
                                  updateCurrentResume({ education: newData });
                                }
                              }}
                            />
                            <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                              {
                                (type === 'experience'
                                  ? (item as Experience).company
                                  : (item as Education).school
                                ).length
                              }
                              /{type === 'experience' ? MAX_LENGTHS.COMPANY : MAX_LENGTHS.SCHOOL}
                            </span>
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
                              maxLength={
                                type === 'experience' ? MAX_LENGTHS.ROLE : MAX_LENGTHS.MAJOR
                              }
                              placeholder={
                                type === 'experience' ? '직무를 입력하세요' : '전공을 입력하세요'
                              }
                              onChange={(e) => {
                                if (type === 'experience') {
                                  const newData = [...(resume.experience || [])];
                                  newData[i] = { ...newData[i], role: e.target.value };
                                  updateCurrentResume({ experience: newData });
                                } else {
                                  const newData = [...(resume.education || [])];
                                  newData[i] = { ...newData[i], major: e.target.value };
                                  updateCurrentResume({ education: newData });
                                }
                              }}
                            />
                            <span className="absolute right-4 bottom-2 text-[10px] font-black text-slate-300">
                              {
                                (type === 'experience'
                                  ? (item as Experience).role
                                  : (item as Education).major
                                ).length
                              }
                              /{type === 'experience' ? MAX_LENGTHS.ROLE : MAX_LENGTHS.MAJOR}
                            </span>
                          </div>
                          <div className="col-span-1 md:col-span-5">
                            <label className={labelClass}>기간</label>
                            <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:gap-2">
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
                      isEditing && portfolios.length > 0 && setShowPortfolioList(!showPortfolioList)
                    }
                    className={`flex items-center justify-between overflow-hidden rounded-2xl border px-6 py-4 transition-all ${
                      isEditing
                        ? 'cursor-pointer border-blue-600 bg-white shadow-sm ring-4 ring-blue-600/5'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <span
                      className={`truncate text-lg font-bold ${currentPortfolio ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                      {currentPortfolio?.name || '등록된 포트폴리오가 없습니다.'}
                    </span>
                    {isEditing && <span className="ml-2 shrink-0 text-blue-600">▾</span>}
                  </div>
                  <AnimatePresence>
                    {showPortfolioList && isEditing && (
                      <>
                        <div
                          className="fixed inset-0 z-[60]"
                          onClick={() => setShowPortfolioList(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-full left-0 z-[70] mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
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
                    파일 업로드
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

              {isEditing && (
                <div className="space-y-3">
                  <p className="px-2 text-sm font-bold text-slate-500 italic">
                    * PDF 형식의 파일만 업로드 가능합니다.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="자기소개"
            sectionRef={selfIntroRef}
            actions={
              isEditing && (
                <div className="flex items-center gap-2">
                  {!innerEditingIntro ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="blue"
                        size="md"
                        className="min-w-[80px] rounded-xl font-black"
                        onClick={() => {
                          const newIntro = { id: `si-${Date.now()}`, title: '', content: '' };
                          setSelfIntros((prev) => [...prev, newIntro]);
                          updateCurrentResume({ selectedSelfIntroId: newIntro.id });
                          setInnerEditingIntro(true);
                        }}
                      >
                        추가
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        className="min-w-27.5 rounded-xl bg-white font-black whitespace-nowrap"
                        onClick={() => {
                          if (selfIntros.length > 0) setShowSelfIntroList(!showSelfIntroList);
                        }}
                      >
                        자기소개 선택
                      </Button>
                      <Button
                        variant="blue"
                        size="md"
                        className="min-w-22.5 rounded-xl font-black whitespace-nowrap"
                        onClick={() => {
                          if (selfIntros.length === 0 || !resume.selectedSelfIntroId) {
                            const newIntro = { id: `si-${Date.now()}`, title: '', content: '' };
                            setSelfIntros((prev) => [...prev, newIntro]);
                            updateCurrentResume({ selectedSelfIntroId: newIntro.id });
                          }
                          setInnerEditingIntro(true);
                        }}
                      >
                        내용 수정
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="md"
                        className="min-w-17.5 rounded-xl bg-white font-black whitespace-nowrap"
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
                        className="min-w-22.5 rounded-xl font-black whitespace-nowrap"
                        onClick={() => {
                          const current = selfIntros.find(
                            (s) => s.id === resume.selectedSelfIntroId,
                          );
                          if (!current?.title?.trim() || !current?.content?.trim()) {
                            showToast('⚠️ 제목과 내용을 모두 입력해주세요!');
                            return;
                          }
                          localStorage.setItem('selfIntros', JSON.stringify(selfIntros));
                          setInnerEditingIntro(false);
                          showToast('✅ 자기소개 내용이 저장되었습니다.');
                        }}
                      >
                        내용 저장
                      </Button>
                    </div>
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
                  className={`flex items-center justify-between overflow-hidden rounded-2xl border px-6 py-4 transition-all ${
                    isEditing && !innerEditingIntro
                      ? 'cursor-pointer border-blue-600 bg-white shadow-sm ring-4 ring-blue-600/5'
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="mr-4 flex min-w-0 flex-1 items-center">
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
                              s.id === resume.selectedSelfIntroId
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
                        {currentSelfIntro?.title || '자기소개를 선택하거나 새로 작성하세요.'}
                      </span>
                    )}
                  </div>
                  {isEditing && !innerEditingIntro && (
                    <span className="ml-2 shrink-0 text-blue-600">▾</span>
                  )}
                  {innerEditingIntro && (
                    <span className="text-[10px] font-black whitespace-nowrap text-blue-300">
                      {(currentSelfIntro?.title || '').length}/{MAX_LENGTHS.TITLE}
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {showSelfIntroList && !innerEditingIntro && isEditing && (
                    <>
                      <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setShowSelfIntroList(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-full left-0 z-[110] mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
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
                    className="min-h-[300px] w-full resize-none bg-transparent text-lg leading-relaxed font-bold outline-none"
                    placeholder="내용을 입력하세요."
                    value={currentSelfIntro?.content || ''}
                    onChange={(e) =>
                      setSelfIntros(
                        selfIntros.map((s) =>
                          s.id === resume.selectedSelfIntroId
                            ? { ...s, content: e.target.value }
                            : s,
                        ),
                      )
                    }
                  />
                ) : (
                  <p className="min-h-[100px] text-lg leading-relaxed font-bold break-all whitespace-pre-wrap text-slate-700">
                    {currentSelfIntro?.content || '자기소개를 선택해주세요.'}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-12">
            {!isEditing ? (
              <Button
                variant="blue"
                size="xl"
                className="w-full min-w-[280px] rounded-[20px] px-10 py-5 font-black shadow-lg shadow-blue-600/20 sm:w-auto"
                onClick={toggleEditMode}
              >
                이력서 수정하기
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full min-w-[200px] rounded-[20px] px-10 py-5 font-black sm:w-auto"
                  onClick={handleCancelEdit}
                >
                  취소
                </Button>
                <Button
                  variant="blue"
                  size="xl"
                  className="w-full min-w-[280px] rounded-[20px] px-10 py-5 font-black shadow-lg shadow-blue-600/20 sm:w-auto"
                  onClick={validateAndSave}
                >
                  저장 및 완료
                </Button>
              </>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {(deleteConfirm || blocker.state === 'blocked') && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
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
