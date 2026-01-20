import { useState, useRef } from 'react';
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

interface ResumeData {
  id: string;
  title: string;
  name: string;
  contact: string;
  email: string;
  intro: string;
  education: { school: string; major: string; status: string; period: string }[];
  experience: { company: string; role: string; period: string }[];
  projects: { name: string; desc: string; link: string }[];
  techStack: string[];
  selectedPortfolioId: string | number | null;
  selectedSelfIntroId: string | null;
}

const INITIAL_PORTFOLIOS: Portfolio[] = [
  { id: 1, name: '2024_프론트엔드_이력서_최종.pdf' },
  { id: 2, name: '경력기술서_백엔드_v2.docx' },
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

const DUMMY_RESUMES: Record<string, ResumeData> = {
  frontend: {
    id: 'frontend',
    title: '프론트엔드 이력서',
    name: '김싸피',
    contact: '010-1234-5678',
    email: 'kim@ssafy.com',
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

const SectionCard = ({
  title,
  children,
  actions,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-pure-white border-soft-pebble relative rounded-4xl border shadow-sm ${className}`}
  >
    <div className="bg-cloud-dancer flex items-center justify-between rounded-t-[31px] px-8 py-5">
      <h3 className="text-midnight-ink text-lg font-black tracking-tight uppercase">{title}</h3>
      <div className="flex gap-2">{actions}</div>
    </div>
    <div className="p-8">{children}</div>
  </div>
);

function ResumeDetailPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetId = resumeId || 'frontend';

  const [resume, setResume] = useState<ResumeData>(
    DUMMY_RESUMES[targetId] || DUMMY_RESUMES['frontend'],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showResumeList, setShowResumeList] = useState(false);
  const [showPortfolioList, setShowPortfolioList] = useState(false);
  const [showSelfIntroList, setShowSelfIntroList] = useState(false);
  const [innerEditingIntro, setInnerEditingIntro] = useState(false);

  const [portfolios, setPortfolios] = useState<Portfolio[]>(INITIAL_PORTFOLIOS);
  const [selfIntros, setSelfIntros] = useState<SelfIntro[]>(INITIAL_SELF_INTROS);

  const formatPhoneNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    if (num.length <= 3) return num;
    if (num.length <= 7) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 7)}-${num.slice(7, 11)}`;
  };

  const formatPeriod = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    if (num.length <= 4) return num;
    if (num.length <= 6) return `${num.slice(0, 4)}.${num.slice(4)}`;
    if (num.length <= 10) return `${num.slice(0, 4)}.${num.slice(4, 6)} - ${num.slice(6)}`;
    return `${num.slice(0, 4)}.${num.slice(4, 6)} - ${num.slice(6, 10)}.${num.slice(10, 12)}`;
  };

  const toggleEditMode = () => {
    if (!isEditing) window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsEditing(!isEditing);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPortfolio = { id: Date.now(), name: file.name };
      setPortfolios((prev) => [newPortfolio, ...prev]);
      setResume((prev) => ({ ...prev, selectedPortfolioId: newPortfolio.id }));
    }
  };

  const currentPortfolio = portfolios.find((p) => p.id === resume.selectedPortfolioId);
  const currentSelfIntro = selfIntros.find((s) => s.id === resume.selectedSelfIntroId);

  const inputClass =
    'w-full bg-white border-2 border-point-blue/20 focus:border-point-blue rounded-xl px-4 py-3 outline-none transition-all font-bold text-midnight-ink';

  return (
    <div
      className={`bg-pure-white text-midnight-ink min-h-screen pt-32 pb-20 transition-colors duration-500 ${isEditing ? 'bg-cloud-dancer/20' : ''}`}
      key={targetId}
    >
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="bg-point-blue fixed right-0 bottom-0 left-0 z-200 py-4 text-center shadow-[0_-10px_30px_rgba(0,0,0,0.1)]"
          >
            <span className="text-pure-white text-base font-black tracking-widest">
              ⚠️ 현재 이력서 수정 모드입니다. 수정을 마치면 하단의 저장 버튼을 눌러주세요.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-5xl px-8">
        <div className="relative mb-12 w-full">
          <Button
            variant="outline"
            className="bg-cloud-dancer flex w-full justify-between rounded-2xl px-8 py-5 font-black"
            onClick={() => setShowResumeList(!showResumeList)}
          >
            <span className="text-2xl">📄 {resume.title}</span>
            <span className="text-2xl">▾</span>
          </Button>
          <AnimatePresence>
            {showResumeList && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowResumeList(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-pure-white border-soft-pebble absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-2xl"
                >
                  {Object.values(DUMMY_RESUMES).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        navigate(`/resume/${r.id}`);
                        setShowResumeList(false);
                      }}
                      className="hover:bg-cloud-dancer cursor-pointer border-b border-gray-50 px-8 py-5 text-xl font-bold last:border-0"
                    >
                      {r.title}
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <main className="space-y-10">
          <section
            className={`bg-pure-white border-soft-pebble rounded-4xl border p-12 shadow-sm transition-all ${isEditing ? 'border-point-blue/50 ring-point-blue/5 ring-4' : ''}`}
          >
            <div className="space-y-6">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <label className="text-point-blue ml-1 text-xs font-black uppercase">
                      이력서 제목
                    </label>
                    <input
                      className={`${inputClass} py-4 text-4xl`}
                      value={resume.title}
                      onChange={(e) => setResume({ ...resume, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-point-blue ml-1 text-xs font-black uppercase">
                      이름
                    </label>
                    <input
                      className={`${inputClass} py-4 text-3xl`}
                      value={resume.name}
                      onChange={(e) => setResume({ ...resume, name: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-6xl leading-tight font-black tracking-tighter opacity-40">
                    {resume.title}
                  </h2>
                  <h1 className="text-point-blue text-4xl font-black tracking-tighter">
                    {resume.name}
                  </h1>
                </div>
              )}
              <div
                className={`text-slate-gray flex gap-8 border-t pt-8 text-xl font-bold transition-colors ${isEditing ? 'border-point-blue/20' : 'border-soft-pebble'}`}
              >
                {isEditing ? (
                  <div className="grid w-full grid-cols-2 gap-6">
                    <input
                      className={inputClass}
                      value={resume.contact}
                      onChange={(e) =>
                        setResume({ ...resume, contact: formatPhoneNumber(e.target.value) })
                      }
                      placeholder="연락처"
                    />
                    <input
                      className={inputClass}
                      value={resume.email}
                      onChange={(e) => setResume({ ...resume, email: e.target.value })}
                      placeholder="이메일"
                    />
                  </div>
                ) : (
                  <>
                    <span className="flex items-center gap-3">📞 {resume.contact}</span>
                    <span className="flex items-center gap-3">✉️ {resume.email}</span>
                  </>
                )}
              </div>
            </div>
          </section>

          <SectionCard
            title="Experience"
            actions={
              isEditing && (
                <Button
                  variant="blue"
                  size="lg"
                  className="px-6"
                  onClick={() =>
                    setResume({
                      ...resume,
                      experience: [...resume.experience, { company: '', role: '', period: '' }],
                    })
                  }
                >
                  + 추가
                </Button>
              )
            }
          >
            <div className="space-y-8">
              {resume.experience.map((exp, i) => (
                <div
                  key={i}
                  className={`relative flex min-h-40 flex-col justify-center rounded-r-3xl border-l-8 py-8 pl-10 transition-all ${isEditing ? 'border-point-blue bg-point-blue/5' : 'border-soft-pebble bg-cloud-dancer/10'}`}
                >
                  {isEditing ? (
                    <div className="grid grid-cols-1 items-center gap-6 pr-12 md:grid-cols-3">
                      <input
                        className={inputClass}
                        value={exp.company}
                        placeholder="회사명"
                        onChange={(e) => {
                          const n = [...resume.experience];
                          n[i].company = e.target.value;
                          setResume({ ...resume, experience: n });
                        }}
                      />
                      <input
                        className={inputClass}
                        value={exp.role}
                        placeholder="직무"
                        onChange={(e) => {
                          const n = [...resume.experience];
                          n[i].role = e.target.value;
                          setResume({ ...resume, experience: n });
                        }}
                      />
                      <input
                        className={inputClass}
                        value={exp.period}
                        placeholder="숫자만 입력"
                        onChange={(e) => {
                          const n = [...resume.experience];
                          n[i].period = formatPeriod(e.target.value);
                          setResume({ ...resume, experience: n });
                        }}
                      />
                      <button
                        onClick={() => {
                          const n = [...resume.experience];
                          n.splice(i, 1);
                          setResume({ ...resume, experience: n });
                        }}
                        className="text-error absolute top-1/2 right-4 -translate-y-1/2 text-2xl font-black"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pr-6">
                      <div className="space-y-2">
                        <p className="text-midnight-ink text-4xl font-black">{exp.company}</p>
                        <p className="text-slate-gray text-2xl font-bold">{exp.role}</p>
                      </div>
                      <span className="text-point-blue border-point-blue/20 rounded-full border-2 bg-white px-8 py-3 text-xl font-black shadow-sm">
                        {exp.period}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Education"
            actions={
              isEditing && (
                <Button
                  variant="blue"
                  size="lg"
                  className="px-6"
                  onClick={() =>
                    setResume({
                      ...resume,
                      education: [
                        ...resume.education,
                        { school: '', major: '', status: '', period: '' },
                      ],
                    })
                  }
                >
                  + 추가
                </Button>
              )
            }
          >
            <div className="space-y-8">
              {resume.education.map((edu, i) => (
                <div
                  key={i}
                  className={`relative flex min-h-40 flex-col justify-center rounded-r-3xl border-l-8 py-8 pl-10 transition-all ${isEditing ? 'border-point-blue bg-point-blue/5' : 'border-soft-pebble bg-cloud-dancer/10'}`}
                >
                  {isEditing ? (
                    <div className="grid grid-cols-1 items-center gap-6 pr-12 md:grid-cols-3">
                      <input
                        className={inputClass}
                        value={edu.school}
                        placeholder="학교명"
                        onChange={(e) => {
                          const n = [...resume.education];
                          n[i].school = e.target.value;
                          setResume({ ...resume, education: n });
                        }}
                      />
                      <input
                        className={inputClass}
                        value={edu.major}
                        placeholder="전공/상태"
                        onChange={(e) => {
                          const n = [...resume.education];
                          n[i].major = e.target.value;
                          setResume({ ...resume, education: n });
                        }}
                      />
                      <input
                        className={inputClass}
                        value={edu.period}
                        placeholder="숫자만 입력"
                        onChange={(e) => {
                          const n = [...resume.education];
                          n[i].period = formatPeriod(e.target.value);
                          setResume({ ...resume, education: n });
                        }}
                      />
                      <button
                        onClick={() => {
                          const n = [...resume.education];
                          n.splice(i, 1);
                          setResume({ ...resume, education: n });
                        }}
                        className="text-error absolute top-1/2 right-4 -translate-y-1/2 text-2xl font-black"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pr-6">
                      <div className="space-y-2">
                        <p className="text-midnight-ink text-4xl font-black">{edu.school}</p>
                        <p className="text-slate-gray text-2xl font-bold">{edu.major}</p>
                      </div>
                      <span className="text-point-blue border-point-blue/20 rounded-full border-2 bg-white px-8 py-3 text-xl font-black shadow-sm">
                        {edu.period}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Portfolio"
            className="z-50"
            actions={
              isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-pure-white border-2 font-black shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPortfolioList(!showPortfolioList);
                    }}
                  >
                    목록 선택
                  </Button>
                  <Button
                    variant="blue"
                    size="lg"
                    className="font-black shadow-md"
                    onClick={(e) => {
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
                    onChange={handleFileUpload}
                  />
                </div>
              )
            }
          >
            <div className="relative">
              <div
                onClick={() => isEditing && setShowPortfolioList(!showPortfolioList)}
                className={`flex items-center justify-between rounded-2xl border-2 p-10 transition-all ${isEditing ? 'border-point-blue hover:bg-cloud-dancer/20 cursor-pointer bg-white shadow-md' : 'bg-cloud-dancer/30 border-soft-pebble shadow-inner'}`}
              >
                <div className="flex items-center gap-6">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${resume.selectedPortfolioId ? 'bg-point-blue text-white' : 'bg-silver-mist text-slate-gray'}`}
                  >
                    <svg
                      width="28"
                      height="28"
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
                    className={`text-3xl font-black ${resume.selectedPortfolioId ? 'text-point-blue' : 'text-slate-gray'}`}
                  >
                    {currentPortfolio?.name || '등록된 포트폴리오가 없습니다.'}
                  </span>
                </div>
              </div>
              <AnimatePresence>
                {showPortfolioList && isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-point-blue absolute z-100 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border-2 bg-white p-2 shadow-2xl"
                  >
                    {portfolios.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setResume({ ...resume, selectedPortfolioId: p.id });
                          setShowPortfolioList(false);
                        }}
                        className="hover:bg-cloud-dancer cursor-pointer rounded-xl px-6 py-4 text-xl font-bold transition-colors"
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
            title="Self Introduction"
            className="z-40"
            actions={
              isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-pure-white border-2 font-black shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSelfIntroList(!showSelfIntroList);
                    }}
                  >
                    자기소개 선택
                  </Button>
                  <Button
                    variant="blue"
                    size="lg"
                    className="font-black shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInnerEditingIntro(!innerEditingIntro);
                    }}
                  >
                    {innerEditingIntro ? '수정 완료' : '내용 수정'}
                  </Button>
                </div>
              )
            }
          >
            <div className="relative space-y-8">
              <div
                onClick={() => isEditing && setShowSelfIntroList(!showSelfIntroList)}
                className={`text-point-blue flex items-center justify-between rounded-xl border-2 px-10 py-6 text-2xl font-black shadow-sm transition-all ${isEditing ? 'border-point-blue hover:bg-cloud-dancer/20 cursor-pointer bg-white' : 'bg-pure-white border-soft-pebble'}`}
              >
                {isEditing && innerEditingIntro ? (
                  <input
                    className="w-full bg-transparent outline-none"
                    value={currentSelfIntro?.title || ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setSelfIntros(
                        selfIntros.map((s) =>
                          s.id === resume.selectedSelfIntroId ? { ...s, title: e.target.value } : s,
                        ),
                      )
                    }
                  />
                ) : (
                  currentSelfIntro?.title || '자기소개서를 선택해주세요.'
                )}
              </div>
              <AnimatePresence>
                {showSelfIntroList && isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-point-blue absolute z-100 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border-2 bg-white p-2 shadow-2xl"
                  >
                    {selfIntros.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setResume({ ...resume, selectedSelfIntroId: s.id });
                          setShowSelfIntroList(false);
                        }}
                        className="hover:bg-cloud-dancer cursor-pointer rounded-xl px-6 py-4 text-xl font-bold transition-colors"
                      >
                        {s.title}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div
                className={`min-h-100 rounded-4xl border-2 p-12 shadow-inner transition-all ${isEditing ? 'border-point-blue/50 bg-white' : 'bg-cloud-dancer/30 border-soft-pebble'}`}
              >
                {innerEditingIntro && isEditing && resume.selectedSelfIntroId ? (
                  <textarea
                    className="h-full min-h-87.5 w-full resize-none bg-transparent text-xl leading-loose font-medium outline-none"
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
                  <p className="text-2xl leading-loose font-medium whitespace-pre-wrap opacity-90">
                    {currentSelfIntro?.content || '자기소개를 선택해주세요.'}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-center pt-10 pb-24">
            <Button
              variant={isEditing ? 'blue' : 'dark'}
              size="lg"
              className="px-20 py-5 text-xl font-black shadow-xl transition-transform hover:scale-105"
              onClick={toggleEditMode}
            >
              {isEditing ? '저장 및 완료하기' : '이력서 수정하기'}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ResumeDetailPage;
