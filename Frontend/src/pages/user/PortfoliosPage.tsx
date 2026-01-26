import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button/Button';
import { portfolioApi } from '../../api/portfolioApi';
import type {
  SavedPortfolio,
  AnalysisData,
  AnalysisResponse,
  Project,
} from '../../types/portfolio';

type AnalysisStep = 'upload' | 'analyzing' | 'result';

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
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
  });

  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([]);
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

  const mapAnalysisData = (response: AnalysisResponse): AnalysisData => {
    const projects = response.data?.projects || [];
    const allTech = projects.flatMap((p) => p.tech || []);
    return {
      projects,
      strengths: projects.map((p) => p.solution),
      techStacks: Array.from(new Set(allTech)),
    };
  };

  const loadPortfolios = useCallback(async (isMounted: boolean) => {
    try {
      const data = await portfolioApi.fetchMyPortfolios();
      if (isMounted) {
        const portfolioList = Array.isArray(data) ? data : [];
        setSavedPortfolios(
          portfolioList.map((p) => ({
            id: p.id,
            name: p.originalFilename,
            hasAnalysis: false,
            isLocal: false,
          })),
        );
      }
    } catch {
      if (isMounted) setSavedPortfolios([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      await loadPortfolios(isMounted);
    };
    initialize();
    return () => {
      isMounted = false;
    };
  }, [loadPortfolios]);

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const processFile = async (uploadedFile: File) => {
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

    try {
      const result = await portfolioApi.uploadPortfolio(uploadedFile);
      const newEntry: SavedPortfolio = {
        id: result.id,
        name: result.originalFilename,
        hasAnalysis: false,
        isLocal: true,
      };

      setSavedPortfolios((prev) => [newEntry, ...(prev || [])]);
      setSelectedPortfolioId(result.id);
      setIsListOpen(false);
      setShowTooltip(false);

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setModal({
        isOpen: true,
        title: '업로드 실패',
        message: '파일 업로드 중 오류가 발생했습니다.',
        type: 'alert',
      });
    }
  };

  const handleOpenFile = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    try {
      const { url } = await portfolioApi.getPresignedUrl(id);
      window.open(url, '_blank');
    } catch {
      setModal({
        isOpen: true,
        title: '파일 열기 실패',
        message: '파일을 불러올 수 없습니다.',
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
      onConfirm: async () => {
        try {
          await portfolioApi.deletePortfolio(id);
          setSavedPortfolios((prev) => prev.filter((p) => String(p.id) !== String(id)));
          if (String(selectedPortfolioId) === String(id)) {
            setSelectedPortfolioId(null);
          }
          closeModal();
        } catch {
          setModal({
            isOpen: true,
            title: '삭제 실패',
            message: '삭제 처리 중 오류가 발생했습니다.',
            type: 'alert',
          });
        }
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

  const handleViewResults = async () => {
    if (!selectedPortfolioId) return;
    try {
      const result = await portfolioApi.getAnalysisResult(selectedPortfolioId);
      setAnalysisData(mapAnalysisData(result));
      setStep('result');
    } catch {
      setModal({
        isOpen: true,
        title: '조회 실패',
        message: '분석 결과를 불러올 수 없습니다.',
        type: 'alert',
      });
    }
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
      await portfolioApi.requestAnalysis(selectedPortfolioId);
      const result = await portfolioApi.getAnalysisResult(selectedPortfolioId);

      setAnalysisData(mapAnalysisData(result));
      clearInterval(progressInterval);
      setProgress(100);
      setActiveStage(2);

      setTimeout(() => {
        setSavedPortfolios((prev) =>
          prev.map((p) =>
            String(p.id) === String(selectedPortfolioId) ? { ...p, hasAnalysis: true } : p,
          ),
        );
        setStep('result');
      }, 800);
    } catch {
      clearInterval(progressInterval);
      setModal({
        isOpen: true,
        title: '분석 오류',
        message: '분석 중 오류가 발생했습니다.',
        type: 'alert',
      });
      setStep('upload');
    }
  };

  const selectedPortfolio = savedPortfolios.find(
    (p) => String(p.id) === String(selectedPortfolioId),
  );

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-26 pb-32">
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
                className="bg-pure-white relative w-full max-w-md overflow-hidden rounded-[40px] p-10 text-center shadow-2xl"
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

        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProject(null)}
                className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="bg-pure-white relative mt-26 flex max-h-[75vh] w-full max-w-5xl flex-col rounded-[40px] shadow-2xl"
              >
                <div className="flex shrink-0 items-center justify-between p-12 pb-6">
                  <div>
                    <span className="text-point-blue text-[10px] font-black tracking-widest uppercase opacity-60">
                      Project Details
                    </span>
                    <h3 className="text-midnight-ink mt-1 text-4xl font-black tracking-tighter">
                      {selectedProject.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-slate-gray hover:bg-cloud-dancer flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="custom-scrollbar space-y-10 overflow-y-auto p-12 pt-0">
                  <section>
                    <h4 className="text-midnight-ink mb-4 flex items-center gap-2 text-lg font-black tracking-tight">
                      <div className="bg-point-blue h-2 w-2 rounded-full" /> PROBLEM
                    </h4>
                    <div className="bg-cloud-dancer/50 border-silver-mist/30 rounded-3xl border p-8">
                      <p className="text-midnight-ink text-lg leading-relaxed font-bold break-keep">
                        {selectedProject.problem}
                      </p>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-midnight-ink mb-4 flex items-center gap-2 text-lg font-black tracking-tight">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" /> SOLUTION
                    </h4>
                    <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-8">
                      <p className="text-midnight-ink text-lg leading-relaxed font-bold break-keep">
                        {selectedProject.solution}
                      </p>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-midnight-ink mb-4 text-lg font-black tracking-tight">
                      TECH STACK
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedProject.tech.map((t) => (
                        <span
                          key={t}
                          className="bg-pure-white border-silver-mist text-slate-gray rounded-2xl border-2 px-6 py-3 text-sm font-black shadow-sm"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>
                <div className="border-silver-mist/20 shrink-0 border-t p-12 pt-6">
                  <Button
                    variant="blue"
                    size="xl"
                    className="shadow-point-blue/20 w-full rounded-[20px] font-black shadow-xl"
                    onClick={() => setSelectedProject(null)}
                  >
                    닫기
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <header className="border-point-blue mb-12 border-l-4 pl-6">
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
        </header>

        <main className="relative">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="border-silver-mist bg-pure-white rounded-[40px] border p-8 shadow-xl shadow-gray-200/50"
              >
                <div className="space-y-6 text-center">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <button
                        onClick={() => setIsListOpen(!isListOpen)}
                        className={`border-silver-mist hover:bg-cloud-dancer/30 bg-pure-white flex w-full items-center justify-between rounded-2xl border px-8 py-4 transition-all ${selectedPortfolioId ? 'border-point-blue ring-point-blue ring-1 ring-offset-0' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedPortfolioId ? 'bg-point-blue text-pure-white' : 'bg-silver-mist text-slate-gray'}`}
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
                            className="border-silver-mist bg-pure-white absolute z-20 mt-3 max-h-64 w-full overflow-y-auto rounded-3xl border p-2 shadow-2xl"
                          >
                            {savedPortfolios?.length > 0 ? (
                              savedPortfolios.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedPortfolioId(p.id);
                                    setIsListOpen(false);
                                  }}
                                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-6 py-4 text-left transition-colors ${String(selectedPortfolioId) === String(p.id) ? 'bg-point-blue/5 text-point-blue' : 'hover:bg-cloud-dancer text-midnight-ink/70'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => handleOpenFile(e, p.id)}
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
                                    {p.isLocal && (
                                      <span className="bg-point-blue/10 text-point-blue rounded-md px-2 py-1 text-[10px] font-black whitespace-nowrap uppercase">
                                        New
                                      </span>
                                    )}
                                    {p.hasAnalysis && (
                                      <span className="ml-1 shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-[13px] font-black tracking-tight whitespace-nowrap text-emerald-600">
                                        분석 완료
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
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
                      className={`group relative cursor-pointer rounded-4xl border-2 border-dashed py-10 transition-all duration-300 ${isDragging ? 'border-point-blue bg-point-blue/5 scale-[1.01] shadow-inner' : 'border-silver-mist hover:border-point-blue/40 hover:bg-point-blue/5'}`}
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
                          className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 ${isDragging ? 'bg-point-blue text-pure-white' : 'bg-silver-mist text-slate-gray group-hover:bg-point-blue group-hover:text-pure-white'}`}
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
                  <div className="flex flex-col items-center gap-6 pt-2">
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
                            className="bg-midnight-ink text-pure-white pointer-events-none absolute bottom-full left-1/2 mb-4 w-max rounded-xl px-6 py-3 text-sm font-black shadow-2xl"
                          >
                            포트폴리오를 선택하거나 업로드해주세요!
                            <div className="bg-midnight-ink absolute top-full left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="min-h-16 w-full">
                        <AnimatePresence mode="wait">
                          {selectedPortfolioId ? (
                            <motion.div
                              key="action-buttons"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="w-full"
                            >
                              {selectedPortfolio?.hasAnalysis ? (
                                <div className="flex w-full gap-4">
                                  <Button
                                    variant="blue"
                                    size="xl"
                                    className="shadow-point-blue/20 flex-2 rounded-[20px] py-4! text-xl! font-black shadow-xl"
                                    onClick={handleViewResults}
                                  >
                                    결과 바로보기
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xl"
                                    className="flex-1 rounded-[20px] py-4! text-xl! font-black"
                                    onClick={handleAnalysis}
                                  >
                                    다시 분석하기
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="blue"
                                  size="xl"
                                  className="shadow-point-blue/20 w-full rounded-[20px] py-4! text-2xl! font-black shadow-xl"
                                  onClick={handleAnalysis}
                                >
                                  분석 시작하기
                                </Button>
                              )}
                            </motion.div>
                          ) : (
                            <div className="w-full">
                              <Button
                                variant="blue"
                                size="xl"
                                disabled
                                className="bg-silver-mist text-slate-gray w-full cursor-not-allowed rounded-[20px] py-4! text-2xl! font-black"
                              >
                                파일을 선택해주세요
                              </Button>
                            </div>
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
                className="border-silver-mist bg-pure-white rounded-[40px] border p-8 shadow-xl shadow-gray-200/50"
              >
                <div className="space-y-8 py-4 text-center">
                  <div className="relative mx-auto h-40 w-40">
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
                      <span className="text-point-blue text-4xl font-black tracking-tighter whitespace-nowrap tabular-nums">
                        {progress}%
                      </span>
                      <span className="text-slate-gray mt-1 text-[10px] font-black tracking-widest uppercase opacity-50">
                        Analyzing
                      </span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="min-h-16 space-y-1">
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
                    <div className="flex items-center justify-center gap-8">
                      {stages.map((stage) => {
                        const isActive =
                          activeStage === stage.id &&
                          progress < (stages[stage.id + 1]?.threshold ?? 100);
                        return (
                          <div key={stage.id} className="relative flex flex-col items-center gap-2">
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
                className="space-y-6"
              >
                <div className="border-cloud-dancer flex items-end justify-between border-b-2 pb-4">
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
                <div className="flex flex-col gap-6">
                  <section className="border-silver-mist bg-pure-white w-full rounded-4xl border p-10 shadow-sm">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="bg-point-blue h-6 w-1.5 rounded-full" />
                      <h3 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap">
                        분석된 프로젝트
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {analysisData.projects?.map((proj, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedProject(proj)}
                          className="group hover:border-point-blue/30 hover:bg-point-blue/5 border-silver-mist/50 cursor-pointer rounded-2xl border bg-gray-50/50 p-8 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <span className="text-point-blue text-sm font-black opacity-40 transition-opacity group-hover:opacity-100">
                                0{idx + 1}
                              </span>
                              <h4 className="text-midnight-ink group-hover:text-point-blue text-xl font-black transition-colors">
                                {proj.name}
                              </h4>
                            </div>
                            <div className="text-point-blue -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <p className="text-slate-gray py-10 text-center opacity-40">
                          분석된 프로젝트가 없습니다.
                        </p>
                      )}
                    </div>
                  </section>
                  <section className="border-silver-mist bg-pure-white w-full rounded-4xl border p-10 shadow-sm">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="bg-point-blue h-6 w-1.5 rounded-full" />
                      <h3 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap">
                        보유 기술 스택
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {analysisData.techStacks.length > 0 ? (
                        analysisData.techStacks.map((tech) => (
                          <span
                            key={tech}
                            className="border-silver-mist text-slate-gray bg-pure-white rounded-2xl border px-6 py-3 text-sm font-black shadow-sm transition-transform hover:-translate-y-1"
                          >
                            {tech}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-gray py-10 text-center opacity-40">
                          기술 스택 정보가 없습니다.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
                <div className="flex flex-row gap-4 pt-4">
                  <Button
                    variant="blue"
                    size="xl"
                    className="shadow-point-blue/20 flex-2 rounded-[20px] py-4! text-xl! font-black shadow-xl"
                    onClick={() => navigate('/recommend/companies')}
                  >
                    맞춤 공고 확인하기
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="flex-1 rounded-[20px] py-4! text-xl! font-black"
                    onClick={() => {
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
