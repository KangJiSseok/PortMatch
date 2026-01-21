import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

interface Project {
  name: string;
  desc: string;
  link: string;
}

interface ResumeData {
  id: string;
  title: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  profileImage: string | null;
  intro: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  techStack: string[];
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

const INITIAL_RESUMES: Record<string, ResumeData> = {
  frontend: {
    id: 'frontend',
    title: '프론트엔드 이력서',
    name: '김싸피',
    contact: '010-1234-5678',
    email: 'kim@ssafy.com',
    address: '서울특별시 강남구 테헤란로 123',
    profileImage: null,
    intro: '사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다.',
    education: [
      { school: '한국대학교', major: '컴퓨터공학과', status: '졸업', period: '2018.03 - 2023.02' },
    ],
    experience: [{ company: 'A 스타트업', role: '인턴', period: '2023.01 - 2023.06' }],
    projects: [
      { name: '커뮤니티 플랫폼', desc: 'React 기반 UI 구현', link: 'github.com/kim/project' },
    ],
    techStack: ['React', 'TypeScript', 'Tailwind'],
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
    intro: '안정적인 인프라와 효율적인 DB 설계가 강점인 백엔드 개발자입니다.',
    education: [
      { school: '한국대학교', major: '컴퓨터공학과', status: '졸업', period: '2018.03 - 2023.02' },
    ],
    experience: [{ company: 'B 솔루션', role: '백엔드 개발자', period: '2022.05 - 2023.12' }],
    projects: [
      {
        name: '결제 모듈 최적화',
        desc: 'MSA 기반 결제 시스템 구축',
        link: 'github.com/kim/payment',
      },
    ],
    techStack: ['Spring Boot', 'Java', 'MySQL'],
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
      <h3 className={`text-midnight-ink ${titleSize} font-black tracking-tight uppercase`}>
        {title}
      </h3>
      <div className="flex gap-3">{actions}</div>
    </div>
    <div className="p-6 md:p-10">{children}</div>
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

  const [allResumes, setAllResumes] = useState<Record<string, ResumeData>>(INITIAL_RESUMES);

  const targetId = resumeId || 'frontend';
  const resume = allResumes[targetId] || allResumes['frontend'];

  const [isEditing, setIsEditing] = useState(false);
  const [showResumeList, setShowResumeList] = useState(false);
  const [showPortfolioList, setShowPortfolioList] = useState(false);
  const [showSelfIntroList, setShowSelfIntroList] = useState(false);
  const [innerEditingIntro, setInnerEditingIntro] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPhotoGuide, setShowPhotoGuide] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>(INITIAL_PORTFOLIOS);
  const [selfIntros, setSelfIntros] = useState<SelfIntro[]>(INITIAL_SELF_INTROS);
  const [errorFields, setErrorFields] = useState<string[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'experience' | 'education';
    index: number;
  } | null>(null);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsEditing(true);
  };

  const validateAndSave = () => {
    const errors: string[] = [];

    if (innerEditingIntro) {
      showToast("⚠️ 상단의 '내용 저장' 버튼을 먼저 눌러주세요!");
      scrollToSection(selfIntroRef);
      return;
    }

    if (!resume.title.trim()) errors.push('title');
    if (!resume.name.trim()) errors.push('name');

    resume.experience.forEach((exp, i) => {
      if (!exp.company.trim()) errors.push(`exp_company_${i}`);
      if (!exp.role.trim()) errors.push(`exp_role_${i}`);
    });

    resume.education.forEach((edu, i) => {
      if (!edu.school.trim()) errors.push(`edu_school_${i}`);
      if (!edu.major.trim()) errors.push(`edu_major_${i}`);
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

    setIsEditing(false);
  };

  const handlePeriodChange = (
    index: number,
    type: 'experience' | 'education',
    field: 'startYear' | 'startMonth' | 'endYear' | 'endMonth',
    value: string,
  ) => {
    const items = resume[type];
    const item = items[index];

    const parts = item.period.split(' - ');
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
      alert('시작일은 종료일보다 빨라야 합니다.');
      return;
    }

    const updatedPeriod = `${updated.startYear}.${updated.startMonth} - ${updated.endYear}.${updated.endMonth}`;

    if (type === 'experience') {
      const newData = [...resume.experience];
      newData[index] = { ...newData[index], period: updatedPeriod };
      updateCurrentResume({ experience: newData });
    } else {
      const newData = [...resume.education];
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

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, index } = deleteConfirm;
    if (type === 'experience') {
      const newData = [...resume.experience];
      newData.splice(index, 1);
      updateCurrentResume({ experience: newData });
    } else {
      const newData = [...resume.education];
      newData.splice(index, 1);
      updateCurrentResume({ education: newData });
    }
    setDeleteConfirm(null);
  };

  const currentPortfolio = portfolios.find((p) => p.id === resume.selectedPortfolioId);
  const currentSelfIntro = selfIntros.find((s) => s.id === resume.selectedSelfIntroId);

  const inputClass = (fieldId?: string) =>
    `w-full bg-white border-2 ${errorFields.includes(fieldId || '') ? 'border-error ring-4 ring-error/10 animate-pulse' : 'border-point-blue/20'} focus:border-point-blue rounded-xl px-4 py-3 outline-none transition-all font-bold text-midnight-ink text-base shadow-sm`;
  const labelClass = 'text-point-blue ml-1 text-xs font-black uppercase tracking-wider mb-1 block';
  const selectClass =
    'bg-white border-2 border-point-blue/20 rounded-xl px-2 py-2 text-base font-bold outline-none focus:border-point-blue cursor-pointer shadow-sm transition-all hover:border-point-blue/40';
  const actionButtonClass =
    'font-black shadow-md px-5 py-2 rounded-xl transition-all hover:shadow-lg active:scale-95 text-lg whitespace-nowrap overflow-hidden flex items-center justify-center';

  return (
    <div
      className={`bg-pure-white text-midnight-ink min-h-screen pt-24 pb-12 transition-colors duration-500 ${isEditing ? 'bg-cloud-dancer/20' : ''}`}
    >
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            className="bg-point-blue fixed right-0 bottom-0 left-0 z-200 py-4 text-center shadow-[0_-5px_20px_rgba(0,0,0,0.15)]"
          >
            <span className="text-pure-white text-sm font-black tracking-widest">
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
            className="bg-error fixed bottom-24 left-1/2 z-1000 flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-black whitespace-nowrap text-white shadow-2xl"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-5xl px-6">
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
            <div className="flex flex-col items-start gap-10 md:flex-row">
              <div className="group relative shrink-0">
                <div
                  className="border-cloud-dancer bg-cloud-dancer flex h-56 w-44 cursor-pointer items-center justify-center overflow-hidden rounded-[30px] border-4 shadow-inner"
                  onMouseEnter={() => isEditing && setShowPhotoGuide(true)}
                  onMouseLeave={() => setShowPhotoGuide(false)}
                >
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
                </div>
                <AnimatePresence>
                  {showPhotoGuide && isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="border-point-blue/30 absolute top-full left-0 z-10 mt-3 w-64 rounded-2xl border-2 bg-white p-4 shadow-xl"
                    >
                      <h4 className="text-point-blue mb-2 font-black">📷 증명사진 규격 안내</h4>
                      <ul className="text-slate-gray space-y-1 text-sm font-bold">
                        <li>• 권장 사이즈: 35 x 45 mm</li>
                        <li>• 파일 형식: JPG, PNG</li>
                        <li>• 배경: 단색 권장</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isEditing && (
                  <button
                    onClick={() => profileImgRef.current?.click()}
                    className="bg-midnight-ink/40 absolute inset-0 flex items-center justify-center rounded-[30px] text-lg font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    사진 변경
                  </button>
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
                        value={resume.title}
                        placeholder="예) 프론트엔드 개발자 이력서"
                        onChange={(e) => updateCurrentResume({ title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>성함</label>
                      <input
                        className={`${inputClass('name')} text-2xl`}
                        value={resume.name}
                        placeholder="이름을 입력하세요"
                        onChange={(e) => updateCurrentResume({ name: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h2 className="truncate text-3xl font-black opacity-40">{resume.title}</h2>
                    <h1 className="text-point-blue text-3xl font-black">{resume.name}</h1>
                  </div>
                )}
                <div
                  className={`grid grid-cols-1 gap-4 border-t pt-8 transition-colors ${isEditing ? 'border-point-blue/20' : 'border-soft-pebble'}`}
                >
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className={labelClass}>연락처</label>
                          <input
                            className={inputClass()}
                            value={resume.contact}
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
                            value={resume.email}
                            placeholder="example@mail.com"
                            onChange={(e) => updateCurrentResume({ email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>주소</label>
                        <input
                          className={inputClass()}
                          value={resume.address}
                          placeholder="도로명 주소를 입력하세요"
                          onChange={(e) => updateCurrentResume({ address: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-gray space-y-2 text-lg font-bold">
                      <div>📞 {resume.contact}</div>
                      <div>✉️ {resume.email}</div>
                      <div>📍 {resume.address}</div>
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
                            ...resume.experience,
                            { company: '', role: '', period: '2024.01 - 2024.01' },
                          ],
                        });
                      } else {
                        updateCurrentResume({
                          education: [
                            ...resume.education,
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
                {resume[type].map((item, i) => {
                  const parts = item.period.split(' - ');
                  const start = parts[0]?.split('.') || ['', ''];
                  const end = parts[1]?.split('.') || ['', ''];
                  const p = {
                    startYear: start[0],
                    startMonth: start[1],
                    endYear: end[0],
                    endMonth: end[1],
                  };
                  const isExp = type === 'experience';
                  return (
                    <div
                      key={i}
                      className={`relative flex flex-col justify-center rounded-2xl border-l-[6px] p-8 shadow-sm transition-all ${isEditing ? 'border-point-blue bg-point-blue/5' : 'border-soft-pebble bg-cloud-dancer/10'}`}
                    >
                      {isEditing ? (
                        <div className="flex w-full items-start gap-6 overflow-hidden">
                          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
                            <div className="min-w-0 lg:col-span-4">
                              <label className={labelClass}>{isExp ? '회사명' : '학교명'}</label>
                              <input
                                className={inputClass(
                                  isExp ? `exp_company_${i}` : `edu_school_${i}`,
                                )}
                                value={
                                  isExp ? (item as Experience).company : (item as Education).school
                                }
                                placeholder={isExp ? '회사명을 입력하세요' : '학교명을 입력하세요'}
                                onChange={(e) => {
                                  if (isExp) {
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
                            <div className="min-w-0 lg:col-span-3">
                              <label className={labelClass}>{isExp ? '직무' : '전공/상태'}</label>
                              <input
                                className={inputClass(isExp ? `exp_role_${i}` : `edu_major_${i}`)}
                                value={
                                  isExp ? (item as Experience).role : (item as Education).major
                                }
                                placeholder={isExp ? '담당 직무' : '전공 및 졸업 상태'}
                                onChange={(e) => {
                                  if (isExp) {
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
                            <div className="shrink-0 lg:col-span-5">
                              <label className={labelClass}>기간 설정</label>
                              <div className="flex h-12.5 items-center gap-1 whitespace-nowrap">
                                <select
                                  className={selectClass}
                                  value={p.startYear}
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
                                  value={p.startMonth}
                                  onChange={(e) =>
                                    handlePeriodChange(i, type, 'startMonth', e.target.value)
                                  }
                                >
                                  {months.map((m) => (
                                    <option key={m}>{m}</option>
                                  ))}
                                </select>
                                <span className="text-midnight-ink font-black">-</span>
                                <select
                                  className={selectClass}
                                  value={p.endYear}
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
                                  value={p.endMonth}
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
                          <div className="w-12 shrink-0 pt-6">
                            <button
                              onClick={() => setDeleteConfirm({ type, index: i })}
                              className="bg-error/10 text-error hover:bg-error flex h-12 w-12 items-center justify-center rounded-xl font-black shadow-sm transition-all hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 flex-1 items-center gap-8">
                            <p className="text-midnight-ink w-56 truncate text-xl font-black">
                              {isExp ? (item as Experience).company : (item as Education).school}
                            </p>
                            <div className="bg-soft-pebble h-6 w-px shrink-0" />
                            <p className="text-slate-gray flex-1 truncate text-lg font-bold">
                              {isExp ? (item as Experience).role : (item as Education).major}
                            </p>
                          </div>
                          <span className="text-point-blue border-point-blue/20 ml-8 shrink-0 rounded-full border bg-white px-6 py-2 text-lg font-black shadow-md">
                            {item.period}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                    className={`${actionButtonClass} bg-pure-white border-2`}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setShowPortfolioList(!showPortfolioList);
                    }}
                  >
                    목록 선택
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
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          showToast('⚠️ PDF 형식의 파일만 업로드 가능합니다.');
                          e.target.value = '';
                          return;
                        }
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
                onClick={() => isEditing && setShowPortfolioList(!showPortfolioList)}
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
                <p className="text-slate-gray text-s mt-3 px-2 font-bold">
                  • PDF 형식의 파일만 업로드 가능합니다.
                </p>
              )}
              <AnimatePresence>
                {showPortfolioList && isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-point-blue absolute top-full left-0 z-100 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border-2 bg-white p-2 shadow-2xl"
                  >
                    {portfolios.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          updateCurrentResume({ selectedPortfolioId: p.id });
                          setShowPortfolioList(false);
                        }}
                        className="hover:bg-cloud-dancer cursor-pointer truncate rounded-xl px-6 py-4 text-xl font-bold transition-colors"
                      >
                        {p.name}
                      </div>
                    ))}
                  </motion.div>
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
                  <Button
                    variant="outline"
                    className={`${actionButtonClass} bg-pure-white border-2`}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setShowSelfIntroList(!showSelfIntroList);
                    }}
                  >
                    자기소개 선택
                  </Button>
                  <Button
                    variant="blue"
                    className={actionButtonClass}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setInnerEditingIntro(!innerEditingIntro);
                    }}
                  >
                    {innerEditingIntro ? '내용 저장' : '내용 수정'}
                  </Button>
                </div>
              )
            }
          >
            <div className="relative space-y-6">
              <div className="relative">
                <div
                  onClick={() => isEditing && setShowSelfIntroList(!showSelfIntroList)}
                  className={`text-point-blue flex items-center justify-between rounded-xl border-2 px-10 py-5 text-lg font-black shadow-md transition-all ${isEditing ? 'border-point-blue hover:bg-cloud-dancer/20 cursor-pointer bg-white' : 'bg-pure-white border-soft-pebble shadow-sm'}`}
                >
                  {isEditing && innerEditingIntro ? (
                    <input
                      className="w-full truncate bg-transparent outline-none"
                      value={currentSelfIntro?.title || ''}
                      placeholder="자기소개서 제목을 입력하세요"
                      onClick={(e) => e.stopPropagation()}
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
                    <span className="mr-4 truncate">
                      {currentSelfIntro?.title || '자기소개서를 선택해주세요.'}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {showSelfIntroList && isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-point-blue absolute top-full left-0 z-100 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border-2 bg-white p-2 shadow-2xl"
                    >
                      {selfIntros.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            updateCurrentResume({ selectedSelfIntroId: s.id });
                            setShowSelfIntroList(false);
                          }}
                          className="hover:bg-cloud-dancer cursor-pointer truncate rounded-xl px-6 py-4 text-xl font-bold transition-colors"
                        >
                          {s.title}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div
                className={`min-h-87.5 rounded-3xl border-2 p-10 shadow-inner transition-all ${isEditing ? 'border-point-blue/50 bg-white' : 'bg-cloud-dancer/30 border-soft-pebble'}`}
              >
                {innerEditingIntro && isEditing && resume.selectedSelfIntroId ? (
                  <textarea
                    className="h-full min-h-75 w-full resize-none bg-transparent text-xl leading-relaxed font-medium outline-none"
                    placeholder="내용을 상세히 입력해 주세요."
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
                  <p className="text-xl leading-relaxed font-medium whitespace-pre-wrap opacity-90">
                    {currentSelfIntro?.content || '자기소개를 선택해주세요.'}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-center pt-12 pb-24">
            <Button
              variant="blue"
              size="lg"
              className="px-20 py-5 text-2xl font-black whitespace-nowrap shadow-xl transition-transform hover:scale-105 active:scale-95"
              onClick={isEditing ? validateAndSave : toggleEditMode}
            >
              {isEditing ? '저장 및 완료하기' : '이력서 수정하기'}
            </Button>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-300 flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="bg-midnight-ink/40 absolute inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-pure-white border-soft-pebble relative w-full max-w-sm overflow-hidden rounded-2xl border p-8 shadow-2xl"
            >
              <div className="bg-error/10 text-error mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>

              <h3 className="text-midnight-ink mb-3 text-center text-2xl font-black tracking-tight">
                정말 삭제할까요?
              </h3>
              <p className="text-slate-gray mb-8 text-center text-base leading-relaxed font-bold">
                삭제된 데이터는 복구할 수 없습니다.
                <br />
                다시 한번 확인해주세요.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl py-3.5"
                  onClick={() => setDeleteConfirm(null)}
                >
                  취소
                </Button>
                <Button
                  variant="blue"
                  className="bg-error hover:bg-error/80 flex-1 rounded-xl border-none py-3.5 text-white hover:text-white"
                  onClick={confirmDelete}
                >
                  삭제하기
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
