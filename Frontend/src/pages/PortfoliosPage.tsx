import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button/Button';

type AnalysisStep = 'upload' | 'analyzing' | 'result';

interface AnalysisData {
  strengths: string[];
  techStacks: string[];
}

interface SavedPortfolio {
  id: string | number;
  name: string;
  isLocal?: boolean;
  fileObject?: File;
  hasAnalysis?: boolean;
}

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  onConfirm?: () => void;
}

function PortfoliosPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
  });

  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([
    { id: 1, name: '2024_프론트엔드_이력서_최종.pdf', hasAnalysis: true },
    { id: 2, name: '경력기술서_백엔드_v2.docx', hasAnalysis: false },
    { id: 3, name: '개인프로젝트_포트폴리오.pdf', hasAnalysis: true },
  ]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | number | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    {
      id: 0,
      label: '데이터 스캐닝',
      threshold: 0,
      description: '포트폴리오 텍스트 및 구조 분석 중...',
    },
    {
      id: 1,
      label: '기술 역량 추출',
      threshold: 35,
      description: '주요 기술 스택 및 프로젝트 성과 분류 중...',
    },
    {
      id: 2,
      label: '매칭 알고리즘 가동',
      threshold: 70,
      description: '최적의 커리어 경로 및 공고 매칭 중...',
    },
  ];

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const processFile = (uploadedFile: File) => {
    if (uploadedFile.type !== 'application/pdf') {
      setModal({
        isOpen: true,
        title: '파일 형식 오류',
        message: 'PDF 파일만 업로드할 수 있습니다.',
        type: 'alert',
      });
      return;
    }

    if (savedPortfolios.some((p) => p.name === uploadedFile.name)) {
      setModal({
        isOpen: true,
        title: '중복 파일 확인',
        message: '이미 동일한 이름의 파일이 존재합니다.',
        type: 'alert',
      });
      return;
    }

    const newId = `local-${Date.now()}`;
    const newEntry: SavedPortfolio = {
      id: newId,
      name: uploadedFile.name,
      isLocal: true,
      fileObject: uploadedFile,
      hasAnalysis: false,
    };

    setSavedPortfolios((prev) => [newEntry, ...prev]);
    setSelectedPortfolioId(newId);
    setFile(uploadedFile);
    setIsListOpen(false);
    setShowTooltip(false);
  };

  const handleOpenFile = (e: React.MouseEvent, p: SavedPortfolio) => {
    e.stopPropagation();
    if (p.fileObject) {
      const fileUrl = URL.createObjectURL(p.fileObject);
      window.open(fileUrl, '_blank');
    } else {
      setModal({
        isOpen: true,
        title: '미리보기 불가',
        message: '더미 데이터는 실제 파일을 열 수 없습니다. 새로 업로드한 파일로 테스트해주세요.',
        type: 'alert',
      });
    }
  };

  const handleDeletePortfolio = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setModal({
      isOpen: true,
      title: '포트폴리오 삭제',
      message: '해당 포트폴리오를 목록에서 삭제하시겠습니까?',
      type: 'confirm',
      onConfirm: () => {
        setSavedPortfolios((prev) => prev.filter((p) => p.id !== id));
        if (selectedPortfolioId === id) {
          setSelectedPortfolioId(null);
          setFile(null);
        }
        closeModal();
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleViewResults = () => {
    setAnalysisData({
      strengths: [
        '고성능 엔터프라이즈 시스템 아키텍처 설계 및 최적화 능력을 보유하고 있습니다.',
        'React Core 라이프사이클에 최적화된 고도화 렌더링 성능 개선 경험이 풍부합니다.',
        '복잡한 비즈니스 로직 설계 및 코드 가독성 유지 능력이 매우 우수합니다.',
      ],
      techStacks: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Recoil', 'GraphQL', 'AWS'],
    });
    setStep('result');
  };

  const handleAnalysis = async () => {
    if (!selectedPortfolioId) return;
    setStep('analyzing');
    setProgress(0);
    setActiveStage(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const nextProgress = prev + 1;
        const currentStage = [...stages].reverse().find((s) => nextProgress >= s.threshold);
        if (currentStage) setActiveStage(currentStage.id);
        return nextProgress;
      });
    }, 100);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setAnalysisData({
        strengths: [
          '고성능 엔터프라이즈 시스템 아키텍처 설계 및 최적화 능력을 보유하고 있습니다.',
          'React Core 라이프사이클에 최적화된 고도화 렌더링 성능 개선 경험이 풍부합니다.',
          '복잡한 비즈니스 로직 설계 및 코드 가독성 유지 능력이 매우 우수합니다.',
        ],
        techStacks: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Recoil', 'GraphQL', 'AWS'],
      });

      clearInterval(progressInterval);
      setProgress(100);
      setActiveStage(2);

      setTimeout(() => {
        setSavedPortfolios((prev) =>
          prev.map((p) => (p.id === selectedPortfolioId ? { ...p, hasAnalysis: true } : p)),
        );
        setStep('result');
      }, 800);
    } catch (error) {
      console.error(error);
      setModal({
        isOpen: true,
        title: '분석 오류',
        message: '분석 중 오류가 발생했습니다. 다시 시도해주세요.',
        type: 'alert',
      });
      setStep('upload');
      clearInterval(progressInterval);
    }
  };

  const selectedPortfolio = savedPortfolios.find((p) => p.id === selectedPortfolioId);

  return (
    <div className="min-h-screen min-w-5xl bg-gray-50 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <AnimatePresence>
          {modal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white p-10 text-center shadow-2xl"
              >
                <div className="bg-point-blue/10 text-point-blue mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                  {modal.type === 'confirm' ? (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  ) : (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                </div>
                <h3 className="text-midnight-ink mb-2 text-2xl font-black tracking-tight whitespace-nowrap">
                  {modal.title}
                </h3>
                <p className="text-slate-gray mb-10 leading-relaxed font-bold whitespace-pre-wrap opacity-60">
                  {modal.message}
                </p>
                <div className="flex gap-4">
                  {modal.type === 'confirm' ? (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 rounded-2xl"
                        onClick={closeModal}
                      >
                        취소
                      </Button>
                      <Button
                        variant={modal.title.includes('삭제') ? 'red' : 'blue'}
                        size="lg"
                        className="flex-1 rounded-2xl shadow-lg"
                        onClick={modal.onConfirm}
                      >
                        확인
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="blue"
                      size="lg"
                      className="w-full rounded-2xl shadow-lg"
                      onClick={closeModal}
                    >
                      닫기
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <header className="border-point-blue mb-12 flex items-start justify-between border-l-4 pl-6">
          <div className="flex flex-col gap-1">
            <span className="text-point-blue text-xs font-black tracking-[0.2em] whitespace-nowrap uppercase">
              Career Analysis
            </span>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
            >
              Portfolio Analysis
            </motion.h1>
            <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
              데이터로 증명하는 당신의 커리어 가치
            </p>
          </div>
          <Button
            variant="outline"
            size="md"
            className="border-soft-pebble text-soft-pebble hover:border-midnight-ink hover:text-midnight-ink shrink-0 rounded-xl"
            onClick={() => navigate(-1)}
          >
            ← 뒤로가기
          </Button>
        </header>

        <main className="relative">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="border-silver-mist rounded-[40px] border bg-white p-12 shadow-xl shadow-gray-200/50"
              >
                <div className="space-y-8 text-center">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <button
                        onClick={() => setIsListOpen(!isListOpen)}
                        className={`border-silver-mist hover:bg-cloud-dancer/30 flex w-full items-center justify-between rounded-2xl border bg-white px-8 py-6 transition-all ${selectedPortfolioId ? 'border-point-blue ring-point-blue ring-1 ring-offset-0' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedPortfolioId ? 'bg-point-blue text-white' : 'bg-silver-mist text-slate-gray'}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <span
                            className={`text-xl font-black tracking-tight whitespace-nowrap ${selectedPortfolioId ? 'text-point-blue' : 'text-midnight-ink'}`}
                          >
                            {selectedPortfolio?.name || '저장된 포트폴리오 선택'}
                          </span>
                        </div>
                        <motion.svg
                          animate={{ rotate: isListOpen ? 180 : 0 }}
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={selectedPortfolioId ? 'text-point-blue' : 'text-slate-gray'}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </motion.svg>
                      </button>
                      <AnimatePresence>
                        {isListOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="border-silver-mist absolute z-20 mt-3 max-h-64 w-full overflow-y-auto rounded-3xl border bg-white p-2 shadow-2xl"
                          >
                            {savedPortfolios.length > 0 ? (
                              savedPortfolios.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedPortfolioId(p.id);
                                    setIsListOpen(false);
                                  }}
                                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-6 py-4 text-left transition-colors ${selectedPortfolioId === p.id ? 'bg-point-blue/5 text-point-blue' : 'hover:bg-cloud-dancer text-midnight-ink/70'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => handleOpenFile(e, p)}
                                      className="hover:text-point-blue shrink-0 p-1 transition-colors"
                                    >
                                      <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                      </svg>
                                    </button>
                                    <span className="text-lg font-bold whitespace-nowrap">
                                      {p.name}
                                    </span>
                                    {p.hasAnalysis && (
                                      <span className="ml-1 shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-[13px] font-black tracking-tight whitespace-nowrap text-emerald-600">
                                        분석 완료
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    {p.isLocal && (
                                      <span className="bg-point-blue/10 rounded-md px-2 py-1 text-[10px] font-black whitespace-nowrap uppercase">
                                        New
                                      </span>
                                    )}
                                    <Button
                                      variant="close"
                                      size="sm"
                                      className="rounded-lg"
                                      onClick={(e) => handleDeletePortfolio(e, p.id)}
                                    />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-gray py-10 font-bold whitespace-nowrap opacity-40">
                                목록이 비어있습니다.
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`group relative cursor-pointer rounded-4xl border-2 border-dashed py-16 transition-all duration-300 ${isDragging ? 'border-point-blue bg-point-blue/5 scale-[1.01] shadow-inner' : 'border-silver-mist hover:border-point-blue/40 hover:bg-point-blue/5'}`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf"
                      />
                      <div className="pointer-events-none flex flex-col items-center gap-4">
                        <motion.div
                          animate={isDragging ? { y: [0, -10, 0] } : {}}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 ${isDragging ? 'bg-point-blue text-white' : 'bg-silver-mist text-slate-gray group-hover:bg-point-blue group-hover:text-white'}`}
                        >
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </motion.div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black tracking-tight whitespace-nowrap">
                            {isDragging ? '여기에 놓으세요!' : '새 포트폴리오 업로드'}
                          </h3>
                          <p className="text-slate-gray text-[14px] font-bold tracking-widest whitespace-nowrap uppercase opacity-40">
                            PDF 파일을 드래그하거나 클릭하여 추가하세요
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-6 pt-4">
                    <div
                      className="relative flex w-full justify-center"
                      onMouseEnter={() => !selectedPortfolioId && setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <AnimatePresence>
                        {showTooltip && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, x: '-50%' }}
                            animate={{ opacity: 1, y: -10, x: '-50%' }}
                            exit={{ opacity: 0, y: 10, x: '-50%' }}
                            className="bg-midnight-ink pointer-events-none absolute bottom-full left-1/2 mb-4 w-max rounded-xl px-6 py-3 text-sm font-black text-white shadow-2xl"
                          >
                            포트폴리오를 선택하거나 업로드해주세요!
                            <div className="bg-midnight-ink absolute top-full left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="min-h-18 w-full">
                        <AnimatePresence mode="wait">
                          {selectedPortfolio?.hasAnalysis ? (
                            <motion.div
                              key="has-analysis-buttons"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex w-full gap-4"
                            >
                              <Button
                                variant="blue"
                                size="xl"
                                className="shadow-point-blue/20 flex-2 rounded-[20px] py-6! text-xl! font-black shadow-xl"
                                onClick={handleViewResults}
                              >
                                결과 바로보기
                              </Button>
                              <Button
                                variant="outline"
                                size="xl"
                                className="flex-1 rounded-[20px] py-6! text-xl! font-black"
                                onClick={handleAnalysis}
                              >
                                다시 분석하기
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="no-analysis-button"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="w-full"
                            >
                              <Button
                                variant="blue"
                                size="xl"
                                disabled={!selectedPortfolioId}
                                className="disabled:bg-silver-mist disabled:text-slate-gray shadow-point-blue/20 w-full rounded-[20px] py-6! text-2xl! font-black shadow-xl disabled:cursor-not-allowed"
                                onClick={handleAnalysis}
                              >
                                분석 시작하기
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-silver-mist rounded-[40px] border bg-white p-12 shadow-xl shadow-gray-200/50"
              >
                <div className="space-y-12 py-10 text-center">
                  <div className="relative mx-auto h-52 w-52">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                      className="border-point-blue/20 absolute inset-0 rounded-full border-t-2 border-b-2"
                    />
                    <svg
                      className="absolute inset-0 h-full w-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        className="text-cloud-dancer stroke-current"
                        strokeWidth="4"
                        cx="50"
                        cy="50"
                        r="46"
                        fill="transparent"
                      />
                      <motion.circle
                        className="text-point-blue stroke-current"
                        strokeWidth="4"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="46"
                        fill="transparent"
                        strokeDasharray="289"
                        animate={{ strokeDashoffset: 289 - (289 * progress) / 100 }}
                        transition={{ duration: 0.3 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-point-blue text-5xl font-black tracking-tighter whitespace-nowrap tabular-nums">
                        {progress}%
                      </span>
                      <span className="text-slate-gray mt-1 text-[10px] font-black tracking-widest whitespace-nowrap uppercase opacity-50">
                        Analyzing
                      </span>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="min-h-20 space-y-2">
                      <motion.h3
                        key={activeStage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap"
                      >
                        {stages[activeStage].label}
                      </motion.h3>
                      <motion.p
                        key={`desc-${activeStage}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        className="text-slate-gray font-medium whitespace-nowrap"
                      >
                        {stages[activeStage].description}
                      </motion.p>
                    </div>
                    <div className="flex items-center justify-center gap-12">
                      {stages.map((stage) => {
                        const isActive =
                          activeStage === stage.id &&
                          progress < (stages[stage.id + 1]?.threshold ?? 100);
                        return (
                          <div key={stage.id} className="relative flex flex-col items-center gap-3">
                            <div className="relative">
                              {isActive && (
                                <motion.div
                                  layoutId="active-ping"
                                  className="bg-point-blue absolute inset-0 rounded-full"
                                  animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                              )}
                              <div
                                className={`relative h-4 w-4 rounded-full transition-all duration-500 ${progress >= stage.threshold ? 'bg-point-blue scale-125 shadow-[0_0_10px_rgba(81,81,231,0.6)]' : 'bg-silver-mist'}`}
                              />
                            </div>
                            <span
                              className={`text-xs font-black whitespace-nowrap transition-colors duration-500 ${progress >= stage.threshold ? 'text-point-blue' : 'text-slate-gray opacity-30'}`}
                            >
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'result' && analysisData && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="border-cloud-dancer flex items-end justify-between border-b-2 pb-6">
                  <div>
                    <p className="text-point-blue mb-1 text-xs font-black tracking-[0.2em] whitespace-nowrap uppercase">
                      Analysis Complete
                    </p>
                    <h2 className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap">
                      분석 리포트
                    </h2>
                  </div>
                  <div className="bg-cloud-dancer text-slate-gray max-w-70 truncate rounded-xl px-4 py-2 text-sm font-black whitespace-nowrap">
                    {selectedPortfolio?.name}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <section className="border-silver-mist col-span-2 rounded-4xl border bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="bg-point-blue h-6 w-1.5 rounded-full" />
                      <h3 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap">
                        핵심 역량
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {analysisData.strengths.map((text, idx) => (
                        <div
                          key={idx}
                          className="hover:bg-point-blue/5 hover:border-point-blue/10 rounded-2xl border border-transparent bg-gray-50 p-5 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-point-blue mt-0.5 shrink-0 text-sm font-black">
                              0{idx + 1}
                            </span>
                            <p className="text-midnight-ink text-[16px] leading-relaxed font-bold break-keep">
                              {text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="border-silver-mist rounded-4xl border bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="bg-point-blue h-6 w-1.5 rounded-full" />
                      <h3 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap">
                        기술 스택
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {analysisData.techStacks.map((tech) => (
                        <span
                          key={tech}
                          className="border-silver-mist text-slate-gray rounded-xl border bg-white px-4 py-2 text-sm font-black whitespace-nowrap shadow-sm transition-transform hover:-translate-y-1"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="flex flex-row gap-4 pt-8">
                  <Button
                    variant="blue"
                    size="xl"
                    className="shadow-point-blue/20 flex-2 rounded-[20px] py-6! text-xl! font-black shadow-xl"
                    onClick={() => navigate('/recommend/companies')}
                  >
                    맞춤 공고 확인하기
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="flex-1 rounded-[20px] py-6! text-xl! font-black"
                    onClick={() => {
                      setFile(null);
                      setSelectedPortfolioId(null);
                      setStep('upload');
                      setAnalysisData(null);
                      setProgress(0);
                    }}
                  >
                    다시 분석
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default PortfoliosPage;
