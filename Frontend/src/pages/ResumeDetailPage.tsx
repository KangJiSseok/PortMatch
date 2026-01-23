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
  titleSize?: string;
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
  titleSize = 'text-lg',
}: SectionCardProps) => (
  <div
    ref={sectionRef}
    className={`bg-pure-white border-soft-pebble relative rounded-2xl border shadow-md ${className}`}
  >
    <div className="bg-cloud-dancer flex items-center justify-between rounded-t-[15px] px-6 py-4">
      <h3
        className={`text-midnight-ink ${titleSize} font-black tracking-tight whitespace-nowrap uppercase`}
      >
        {title}
      </h3>
      <div className="flex gap-3">{actions}</div>
    </div>
    <div className="p-10">{children}</div>
  </div>
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
    `w-full bg-white border-2 ${errorFields.includes(fieldId || '') ? 'border-error ring-4 ring-error/10 animate-pulse' : 'border-point-blue/20'} focus:border-point-blue rounded-xl px-4 py-3 outline-none transition-all font-bold text-midnight-ink text-base shadow-sm`;
  const labelClass =
    'text-point-blue ml-1 text-xs font-black uppercase tracking-wider mb-1 block whitespace-nowrap';
  const selectClass =
    'bg-white border-2 border-point-blue/20 rounded-xl px-2 py-2 text-base font-bold outline-none focus:border-point-blue cursor-pointer shadow-sm transition-all hover:border-point-blue/40';
  const actionButtonClass =
    'font-black shadow-md px-5 py-2 rounded-xl transition-all hover:shadow-lg active:scale-95 text-lg whitespace-nowrap overflow-hidden flex items-center justify-center';

  return (
    <div
      className={`bg-pure-white text-midnight-ink min-h-screen min-w-5xl pt-24 pb-12 transition-colors duration-500 ${isEditing ? 'bg-cloud-dancer/20' : ''}`}
    >
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            className="bg-point-blue fixed right-0 bottom-0 left-0 z-200 min-w-5xl py-4 text-center shadow-[0_-5px_20px_rgba(0,0,0,0.15)]"
          >
            <span className="text-pure-white text-sm font-black tracking-widest whitespace-nowrap">
              ⚠️ 현재 이력서 수정 모드입니다. 수정을 마치면 하단의 저장 버튼을 눌러주세요.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`${toastMessage.startsWith('✅') ? 'bg-point-blue' : 'bg-error'} fixed bottom-24 left-1/2 z-1000 flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-black whitespace-nowrap text-white shadow-2xl`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto w-5xl px-6">
        <div className="relative mb-10 w-full">
          <Button
            variant="outline"
            className="bg-cloud-dancer flex w-full items-center justify-between rounded-xl px-6 py-4 font-black shadow-md transition-transform active:scale-[0.99]"
            onClick={() => setShowResumeList(!showResumeList)}
          >
            <span className="mr-4 truncate text-xl">📄 {resume.title}</span>
            <span className="shrink-0 text-xl">▾</span>
          </Button>
          <AnimatePresence>
            {showResumeList && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowResumeList(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-pure-white border-soft-pebble absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border shadow-2xl"
                >
                  {Object.values(allResumes).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        navigate(`/resume/${r.id}`);
                        setShowResumeList(false);
                      }}
                      className="hover:bg-cloud-dancer cursor-pointer truncate border-b border-gray-50 px-6 py-5 text-xl font-bold transition-colors last:border-0"
                    >
                      {r.title}
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <main className="space-y-8">
          <section
            ref={infoRef}
            className={`bg-pure-white border-soft-pebble rounded-3xl border p-10 shadow-md transition-all ${isEditing ? 'border-point-blue/50 ring-point-blue/10 ring-8' : ''}`}
          >
            <div className="flex flex-row items-start gap-10">
              <div className="shrink-0">
                <div className="border-cloud-dancer bg-cloud-dancer relative flex h-56 w-44 items-center justify-center overflow-hidden rounded-[30px] border-4 shadow-inner">
                  {resume.profileImage ? (
                    <img
                      src={resume.profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#CBD5E0"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => profileImgRef.current?.click()}
                      className="bg-midnight-ink/40 hover:bg-midnight-ink/60 absolute inset-0 flex items-center justify-center text-lg font-bold whitespace-nowrap text-white transition-opacity"
                    >
                      사진 변경
                    </button>
                  )}
                </div>

                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-point-blue/20 mt-4 w-44 rounded-xl border bg-white p-3 shadow-sm"
                  >
                    <h4 className="text-point-blue mb-1 text-sm font-black whitespace-nowrap">
                      📷 사진 규격 안내
                    </h4>
                    <ul className="text-slate-gray space-y-0.5 text-xs leading-tight font-bold whitespace-nowrap">
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
              <div className="w-full min-w-0 flex-1 space-y-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelClass}>이력서 제목</label>
                      <input
                        className={`${inputClass('title')} text-2xl`}
                        value={resume.title || ''}
                        maxLength={MAX_LENGTHS.TITLE}
                        placeholder="예) 프론트엔드 개발자 이력서"
                        onChange={(e) => updateCurrentResume({ title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>성함</label>
                      <input
                        className={`${inputClass('name')} text-2xl`}
                        value={resume.name || ''}
                        maxLength={MAX_LENGTHS.NAME}
                        placeholder="이름을 입력하세요"
                        onChange={(e) => updateCurrentResume({ name: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0 space-y-3 overflow-hidden">
                    <h2 className="truncate text-3xl font-black whitespace-nowrap opacity-40">
                      {resume.title}
                    </h2>
                    <h1 className="text-point-blue truncate text-3xl font-black whitespace-nowrap">
                      {resume.name}
                    </h1>
                  </div>
                )}
                <div
                  className={`grid grid-cols-1 gap-4 border-t pt-4 transition-colors ${isEditing ? 'border-point-blue/20' : 'border-soft-pebble'}`}
                >
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>연락처</label>
                          <input
                            className={inputClass()}
                            value={resume.contact || ''}
                            maxLength={15}
                            placeholder="010-0000-0000"
                            onChange={(e) =>
                              updateCurrentResume({ contact: formatPhoneNumber(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClass}>이메일</label>
                          <input
                            className={inputClass()}
                            value={resume.email || ''}
                            maxLength={MAX_LENGTHS.EMAIL}
                            placeholder="example@mail.com"
                            onChange={(e) => updateCurrentResume({ email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>주소</label>
                        <input
                          className={inputClass()}
                          value={resume.address || ''}
                          maxLength={MAX_LENGTHS.ADDRESS}
                          placeholder="도로명 주소를 입력하세요"
                          onChange={(e) => updateCurrentResume({ address: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-gray space-y-2 text-lg font-bold">
                      <div className="whitespace-nowrap">📞 {resume.contact}</div>
                      <div className="flex gap-2 whitespace-nowrap">
                        <span className="shrink-0">✉️</span>
                        <span className="flex-1 truncate">{resume.email}</span>
                      </div>
                      <div className="flex gap-2 whitespace-nowrap">
                        <span className="shrink-0">📍</span>
                        <span className="flex-1 truncate">{resume.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {(['experience', 'education'] as const).map((type) => (
            <SectionCard
              key={type}
              sectionRef={type === 'experience' ? expRef : eduRef}
              title={type.toUpperCase()}
              actions={
                isEditing && (
                  <Button
                    variant="blue"
                    className={actionButtonClass}
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
                    + 추가
                  </Button>
                )
              }
            >
              <div className="space-y-6">
                {resume[type]?.map((item, i) => (
                  <div
                    key={i}
                    className={`relative flex flex-col justify-center rounded-2xl border-l-[6px] p-8 shadow-sm transition-all ${isEditing ? 'border-point-blue bg-point-blue/5' : 'border-soft-pebble bg-cloud-dancer/10'}`}
                  >
                    {isEditing ? (
                      <div className="flex w-full items-start gap-6">
                        <div className="grid flex-1 grid-cols-12 gap-4">
                          <div className="col-span-4">
                            <label className={labelClass}>
                              {type === 'experience' ? '회사명' : '학교명'}
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
                          </div>
                          <div className="col-span-3">
                            <label className={labelClass}>
                              {type === 'experience' ? '직무' : '전공/상태'}
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
                          </div>
                          <div className="col-span-5">
                            <label className={labelClass}>기간 설정</label>
                            <div className="flex h-12.5 items-center gap-1 whitespace-nowrap">
                              <select
                                className={selectClass}
                                value={item.period?.split(' - ')[0]?.split('.')[0]}
                                onChange={(e) =>
                                  handlePeriodChange(i, type, 'startYear', e.target.value)
                                }
                              >
                                {years.map((y) => (
                                  <option key={y}>{y}</option>
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
                                  <option key={m}>{m}</option>
                                ))}
                              </select>
                              <span className="font-black">-</span>
                              <select
                                className={selectClass}
                                value={item.period?.split(' - ')[1]?.split('.')[0]}
                                onChange={(e) =>
                                  handlePeriodChange(i, type, 'endYear', e.target.value)
                                }
                              >
                                {years.map((y) => (
                                  <option key={y}>{y}</option>
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
                                  <option key={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="w-12 pt-6">
                          <Button
                            variant="close"
                            size="lg"
                            onClick={() => setDeleteConfirm({ type, index: i })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-8">
                          <p className="w-56 truncate text-xl font-black">
                            {type === 'experience'
                              ? (item as Experience).company
                              : (item as Education).school}
                          </p>
                          <div className="bg-soft-pebble h-6 w-px" />
                          <p className="flex-1 truncate text-lg font-bold">
                            {type === 'experience'
                              ? (item as Experience).role
                              : (item as Education).major}
                          </p>
                        </div>
                        <span className="border-point-blue/20 text-point-blue ml-8 shrink-0 rounded-full border bg-white px-6 py-2 text-lg font-black shadow-md">
                          {item.period}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}

          <SectionCard
            title="PORTFOLIO"
            titleSize="text-base"
            actions={
              isEditing && (
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className={`${actionButtonClass} bg-pure-white border-2 ${portfolios.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (portfolios.length > 0) setShowPortfolioList(!showPortfolioList);
                    }}
                  >
                    포트폴리오 선택
                  </Button>
                  <Button
                    variant="blue"
                    className={actionButtonClass}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    파일 업로드
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file && file.type === 'application/pdf') {
                        const newP = { id: Date.now(), name: file.name };
                        setPortfolios((prev) => [newP, ...prev]);
                        updateCurrentResume({ selectedPortfolioId: newP.id });
                      }
                    }}
                  />
                </div>
              )
            }
          >
            <div className="relative">
              <div
                onClick={() =>
                  isEditing && portfolios.length > 0 && setShowPortfolioList(!showPortfolioList)
                }
                className={`flex items-center justify-between rounded-2xl border-2 px-8 py-4 transition-all ${isEditing ? 'border-point-blue hover:bg-cloud-dancer/20 cursor-pointer bg-white shadow-md' : 'bg-cloud-dancer/30 border-soft-pebble shadow-inner'}`}
              >
                <div className="flex min-w-0 items-center gap-6">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${resume.selectedPortfolioId ? 'bg-point-blue text-white' : 'bg-silver-mist text-slate-gray'} shadow-sm`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span
                    className={`truncate text-lg font-black ${resume.selectedPortfolioId ? 'text-point-blue' : 'text-slate-gray'}`}
                  >
                    {currentPortfolio?.name || '등록된 포트폴리오가 없습니다.'}
                  </span>
                </div>
              </div>
              {isEditing && (
                <p className="text-slate-gray text-s mt-3 px-2 font-bold whitespace-nowrap">
                  • PDF 형식의 파일만 업로드 가능합니다.
                </p>
              )}
              <AnimatePresence>
                {showPortfolioList && isEditing && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowPortfolioList(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-point-blue absolute top-full left-0 z-100 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border-2 bg-white p-2 shadow-2xl"
                    >
                      {portfolios.map((p) => (
                        <div
                          key={p.id}
                          className="hover:bg-cloud-dancer flex cursor-pointer items-center justify-between rounded-xl px-6 py-4"
                          onClick={() => {
                            updateCurrentResume({ selectedPortfolioId: p.id });
                            setShowPortfolioList(false);
                          }}
                        >
                          <span className="truncate text-xl font-bold">{p.name}</span>
                          <Button
                            variant="close"
                            size="sm"
                            className="bg-error/10 ml-4"
                            onClick={(e: React.MouseEvent) => {
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
          </SectionCard>

          <SectionCard
            title="SELF INTRODUCTION"
            sectionRef={selfIntroRef}
            titleSize="text-base"
            actions={
              isEditing && (
                <div className="flex gap-4">
                  {!innerEditingIntro ? (
                    <>
                      <Button
                        variant="outline"
                        className={`${actionButtonClass} bg-pure-white border-2 ${selfIntros.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (selfIntros.length > 0) setShowSelfIntroList(!showSelfIntroList);
                        }}
                      >
                        자기소개 선택
                      </Button>
                      <Button
                        variant="blue"
                        className={`${actionButtonClass} min-w-30`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setShowSelfIntroList(false);
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
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className={`${actionButtonClass} bg-pure-white border-2`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setInnerEditingIntro(false);
                          const saved = localStorage.getItem('selfIntros');
                          const original = saved ? JSON.parse(saved) : INITIAL_SELF_INTROS;
                          setSelfIntros(original);
                          const exists = original.some(
                            (s: SelfIntro) => s.id === resume.selectedSelfIntroId,
                          );
                          if (!exists)
                            updateCurrentResume({ selectedSelfIntroId: original[0]?.id || null });
                        }}
                      >
                        취소
                      </Button>
                      <Button
                        variant="blue"
                        className={`${actionButtonClass} min-w-30`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
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
                    </>
                  )}
                </div>
              )
            }
          >
            <div className="relative space-y-6">
              {(!resume.selectedSelfIntroId || selfIntros.length === 0) && !innerEditingIntro ? (
                <div className="border-soft-pebble bg-cloud-dancer/10 flex min-h-87.5 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center">
                  <div className="mb-4 text-5xl opacity-30">📄</div>
                  <p className="text-slate-gray text-xl font-bold">등록된 자기소개서가 없습니다.</p>
                  {isEditing && (
                    <p className="text-slate-gray mt-2 text-sm opacity-70">
                      '내용 수정' 버튼을 눌러 새로운 자기소개서를 작성해보세요.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div
                      onClick={() =>
                        isEditing &&
                        !innerEditingIntro &&
                        selfIntros.length > 0 &&
                        setShowSelfIntroList(!showSelfIntroList)
                      }
                      className={`text-point-blue flex items-center justify-between rounded-xl border-2 px-10 py-5 text-lg font-black shadow-md transition-all ${isEditing && !innerEditingIntro ? 'border-point-blue hover:bg-cloud-dancer/20 cursor-pointer bg-white' : 'bg-pure-white border-soft-pebble cursor-default shadow-sm'}`}
                    >
                      {isEditing && innerEditingIntro ? (
                        <div className="flex w-full items-center gap-3">
                          <span className="bg-point-blue h-2 w-2 animate-pulse rounded-full" />
                          <input
                            className="w-full bg-transparent outline-none"
                            value={currentSelfIntro?.title || ''}
                            placeholder="제목을 입력하세요"
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
                        </div>
                      ) : (
                        <span className="truncate">
                          {currentSelfIntro?.title || '자기소개를 선택해주세요.'}
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {showSelfIntroList && isEditing && !innerEditingIntro && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowSelfIntroList(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="border-point-blue absolute top-full left-0 z-100 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border-2 bg-white p-2 shadow-2xl"
                          >
                            {selfIntros.map((s) => (
                              <div
                                key={s.id}
                                className="hover:bg-cloud-dancer flex cursor-pointer items-center justify-between rounded-xl px-6 py-4"
                                onClick={() => {
                                  updateCurrentResume({ selectedSelfIntroId: s.id });
                                  setShowSelfIntroList(false);
                                }}
                              >
                                <span className="truncate text-xl font-bold">{s.title}</span>
                                <Button
                                  variant="close"
                                  size="sm"
                                  className="bg-error/10 ml-4"
                                  onClick={(e: React.MouseEvent) => {
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
                    className={`relative min-h-87.5 rounded-3xl border-2 p-10 shadow-inner transition-all ${innerEditingIntro && isEditing ? 'border-point-blue ring-point-blue/10 bg-white ring-8' : 'bg-cloud-dancer/30 border-soft-pebble'}`}
                  >
                    {innerEditingIntro && (
                      <div className="bg-point-blue absolute top-4 right-6 flex items-center gap-2 rounded-full px-4 py-1.5 shadow-md">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        <span className="text-xs font-black tracking-widest text-white uppercase">
                          Editing Content
                        </span>
                      </div>
                    )}
                    {innerEditingIntro && isEditing && resume.selectedSelfIntroId ? (
                      <textarea
                        className="h-full min-h-75 w-full resize-none bg-transparent text-xl leading-relaxed font-medium outline-none"
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
                      <p className="text-xl leading-relaxed font-medium break-all whitespace-pre-wrap opacity-90">
                        {currentSelfIntro?.content || '자기소개를 선택해주세요.'}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          <div className="flex justify-center gap-6 pt-12 pb-24">
            <Button
              variant="blue"
              size="xl"
              className="shrink-0 px-20 py-5 font-black shadow-xl transition-transform hover:scale-105 active:scale-95"
              onClick={isEditing ? validateAndSave : toggleEditMode}
            >
              {isEditing ? '저장 및 완료하기' : '이력서 수정하기'}
            </Button>
            {isEditing && (
              <Button
                variant="outline"
                size="xl"
                className="shrink-0 px-20 py-5 font-black shadow-md transition-transform active:scale-95"
                onClick={handleCancelEdit}
              >
                취소
              </Button>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-300 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-[40px] bg-white p-10 text-center shadow-2xl"
            >
              <div className="bg-error/10 text-error mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-black">정말 삭제할까요?</h3>
              <p className="text-slate-gray font-bold">삭제된 데이터는 복구할 수 없습니다.</p>
              <div className="mt-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(null)}
                >
                  취소
                </Button>
                <Button variant="red" size="lg" className="flex-1" onClick={confirmDeleteAction}>
                  삭제하기
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-300 flex min-w-5xl items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => blocker.reset?.()}
              className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white p-10 text-center shadow-2xl"
            >
              <div className="bg-error/10 text-error mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              <h3 className="text-midnight-ink mb-2 text-2xl font-black tracking-tight whitespace-nowrap">
                수정 사항을 취소할까요?
              </h3>
              <p className="text-slate-gray text-lg font-bold">
                페이지를 벗어나면 저장되지 않은 <br /> 변경 사항이 모두 사라집니다.
              </p>
              <div className="mt-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={() => blocker.reset?.()}
                >
                  계속 수정하기
                </Button>
                <Button
                  variant="red"
                  size="lg"
                  className="flex-1 rounded-2xl shadow-lg"
                  onClick={() => blocker.proceed?.()}
                >
                  나가기
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
