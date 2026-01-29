import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, Search, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
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

const STAGES = [
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
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeStageId = [...STAGES].reverse().find((s) => progress >= s.threshold)?.id ?? 0;

  const mapAnalysisData = (response: AnalysisResponse): AnalysisData => {
    const projects = response.projects || [];
    const allTech = projects.flatMap((p) => p.tech || []);
    return {
      projects,
      strengths: projects.map((p) => p.solution),
      techStacks: Array.from(new Set(allTech)),
    };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolios = async () => {
      try {
        const portfolioList = await portfolioApi.fetchMyPortfolios();
        if (!isMounted) return;

        const initialPortfolios: SavedPortfolio[] = portfolioList.map((p) => ({
          id: p.id,
          name: p.originalFilename,
          status: false,
          isLocal: false,
        }));
        setSavedPortfolios(initialPortfolios);

        const statusChecks = await Promise.all(
          portfolioList.map(async (p) => {
            try {
              const result = await portfolioApi.getAnalysisResult(p.id);
              return { id: p.id, hasAnalysis: !!result };
            } catch {
              return { id: p.id, hasAnalysis: false };
            }
          }),
        );

        if (!isMounted) return;

        setSavedPortfolios((prev) =>
          prev.map((item) => {
            const check = statusChecks.find((c) => c.id === item.id);
            return check ? { ...item, status: check.hasAnalysis } : item;
          }),
        );
      } catch (err) {
        if (isMounted) {
          setSavedPortfolios([]);
          console.error(err);
        }
      }
    };

    fetchPortfolios();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const response = await portfolioApi.uploadPortfolio(uploadedFile);
      const newEntry: SavedPortfolio = {
        id: response.id,
        name: response.originalFilename,
        status: false,
        isLocal: true,
      };
      setSavedPortfolios((prev) => [newEntry, ...(prev || [])]);
      setSelectedPortfolioId(response.id);
      setIsListOpen(false);
      setShowTooltip(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setModal({ isOpen: true, title: '업로드 실패', message: errorMessage, type: 'alert' });
    }
  };

  const handleOpenFile = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    try {
      const { url } = await portfolioApi.getPresignedUrl(id);
      window.open(url, '_blank');
    } catch (err) {
      setModal({
        isOpen: true,
        title: '파일 열기 실패',
        message: '파일을 불러올 수 없습니다.',
        type: 'alert',
      });
      console.error(err);
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
          if (String(selectedPortfolioId) === String(id)) setSelectedPortfolioId(null);
          closeModal();
        } catch (err) {
          setModal({
            isOpen: true,
            title: '삭제 실패',
            message: '삭제 처리 중 오류가 발생했습니다.',
            type: 'alert',
          });
          console.error(err);
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
      if (!result) {
        setModal({
          isOpen: true,
          title: '조회 결과 없음',
          message: '아직 분석 결과가 생성되지 않았습니다.',
          type: 'alert',
        });
        return;
      }
      setAnalysisData(mapAnalysisData(result));
      setStep('result');
    } catch (err) {
      setModal({
        isOpen: true,
        title: '조회 실패',
        message: '분석 결과를 불러올 수 없습니다.',
        type: 'alert',
      });
      console.error(err);
    }
  };

  const handleAnalysis = async () => {
    if (!selectedPortfolioId) return;
    setStep('analyzing');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        const remaining = 100 - prev;
        const increment = Math.max(0.12, remaining * 0.015);
        return prev + increment;
      });
    }, 40);

    try {
      await portfolioApi.requestAnalysis(selectedPortfolioId);
      const pollResult = async (retries = 15): Promise<AnalysisResponse> => {
        const res = await portfolioApi.getAnalysisResult(selectedPortfolioId);
        if (res) return res;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return pollResult(retries - 1);
        }
        throw new Error('Timeout');
      };

      const result = await pollResult();
      clearInterval(progressInterval);
      setProgress(100);
      setAnalysisData(mapAnalysisData(result));

      setTimeout(() => {
        setSavedPortfolios((prev) =>
          prev.map((p) =>
            String(p.id) === String(selectedPortfolioId)
              ? { ...p, status: true, isLocal: false }
              : p,
          ),
        );
        setStep('result');
      }, 1000);
    } catch (err) {
      clearInterval(progressInterval);
      setModal({
        isOpen: true,
        title: '분석 오류',
        message: '분석 처리 중 오류가 발생했거나 시간이 초과되었습니다.',
        type: 'alert',
      });
      setStep('upload');
      console.error(err);
    }
  };

  const selectedPortfolio = savedPortfolios.find(
    (p) => String(p.id) === String(selectedPortfolioId),
  );

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <AnimatePresence>
          {modal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-28">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-pure-white relative w-full max-w-100 overflow-hidden rounded-4xl p-10 text-center shadow-2xl"
              >
                <div className="bg-point-blue/10 text-point-blue mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                  {modal.type === 'confirm' ? (
                    <CheckCircle2 size={32} strokeWidth={3} />
                  ) : (
                    <AlertCircle size={32} strokeWidth={3} />
                  )}
                </div>
                <h3 className="text-midnight-ink mb-2 text-2xl font-black tracking-tight">
                  {modal.title}
                </h3>
                <p className="text-slate-gray mb-10 text-base font-bold opacity-60">
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
            <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-28">
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
                className="bg-pure-white relative flex max-h-[80vh] w-160 flex-col overflow-hidden rounded-4xl shadow-2xl"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-point-blue h-10 w-1.5 rounded-full" />
                    <h3 className="text-midnight-ink text-2xl font-black tracking-tighter">
                      {selectedProject.name}
                    </h3>
                  </div>
                </div>
                <div className="custom-scrollbar space-y-8 overflow-y-auto p-10">
                  <section>
                    <h4 className="text-midnight-ink mb-4 text-xs font-black tracking-widest uppercase opacity-40">
                      Problem & Context
                    </h4>
                    <div className="bg-cloud-dancer/40 rounded-3xl p-7">
                      <p className="text-midnight-ink text-lg leading-relaxed font-bold break-keep opacity-90">
                        {selectedProject.problem}
                      </p>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-midnight-ink mb-4 text-xs font-black tracking-widest uppercase opacity-40">
                      Key Solution
                    </h4>
                    <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-7">
                      <p className="text-midnight-ink text-lg leading-relaxed font-bold break-keep">
                        {selectedProject.solution}
                      </p>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-midnight-ink mb-5 text-xs font-black tracking-widest uppercase opacity-40">
                      Stack Used
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedProject.tech.map((t) => (
                        <div
                          key={t}
                          className="bg-pure-white border-silver-mist flex items-center gap-2 rounded-xl border px-4 py-2.5 shadow-sm"
                        >
                          <div className="bg-point-blue h-1 w-1 rounded-full" />
                          <span className="text-midnight-ink text-xs font-black">{t}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                <div className="border-t border-gray-100 p-8">
                  <Button
                    variant="dark"
                    size="lg"
                    className="w-full rounded-2xl font-black"
                    onClick={() => setSelectedProject(null)}
                  >
                    확인
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <div className="flex flex-col gap-1">
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
                className="border-silver-mist bg-pure-white rounded-4xl border p-8 shadow-xl shadow-gray-200/50"
              >
                <div className="space-y-6 text-center">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <button
                        onClick={() => setIsListOpen(!isListOpen)}
                        className={`border-silver-mist hover:bg-cloud-dancer/30 bg-pure-white flex w-full items-center justify-between rounded-2xl border px-8 py-4 transition-all ${selectedPortfolioId ? 'border-point-blue ring-point-blue ring-1' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedPortfolioId ? 'bg-point-blue text-pure-white' : 'bg-silver-mist text-slate-gray'}`}
                          >
                            <FileText size={16} strokeWidth={3} />
                          </div>
                          <span
                            className={`text-xl font-black tracking-tight whitespace-nowrap ${selectedPortfolioId ? 'text-point-blue' : 'text-midnight-ink'}`}
                          >
                            {selectedPortfolio?.name || '저장된 포트폴리오 선택'}
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: isListOpen ? 180 : 0 }}
                          className={selectedPortfolioId ? 'text-point-blue' : 'text-slate-gray'}
                        >
                          <ChevronDown size={24} strokeWidth={3} />
                        </motion.div>
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
                                      <Search size={18} strokeWidth={2.5} />
                                    </button>
                                    <span className="text-lg font-bold whitespace-nowrap">
                                      {p.name}
                                    </span>
                                    {p.isLocal && (
                                      <span className="bg-point-blue/10 text-point-blue rounded-md px-2 py-1 text-xs font-black whitespace-nowrap uppercase">
                                        New
                                      </span>
                                    )}
                                    {p.status && (
                                      <span className="ml-1 shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-black tracking-tight whitespace-nowrap text-emerald-600">
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
                              <div className="text-slate-gray py-10 text-center font-bold whitespace-nowrap opacity-40">
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
                      className={`group relative cursor-pointer rounded-3xl border-2 border-dashed py-10 transition-all duration-300 ${isDragging ? 'border-point-blue bg-point-blue/5 scale-105 shadow-inner' : 'border-silver-mist hover:border-point-blue/40 hover:bg-point-blue/5'}`}
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
                          <Upload size={32} strokeWidth={3} />
                        </motion.div>
                        <div className="space-y-1">
                          <h3 className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap">
                            {isDragging ? '여기에 놓으세요!' : '새 포트폴리오 업로드'}
                          </h3>
                          <p className="text-slate-gray text-sm font-bold tracking-widest whitespace-nowrap uppercase opacity-40">
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
                              {selectedPortfolio?.status ? (
                                <div className="flex w-full gap-4">
                                  <Button
                                    variant="blue"
                                    size="xl"
                                    className="shadow-point-blue/20 flex-2 rounded-2xl py-4! text-xl! font-black shadow-xl"
                                    onClick={handleViewResults}
                                  >
                                    결과 바로보기
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xl"
                                    className="flex-1 rounded-2xl py-4! text-xl! font-black"
                                    onClick={handleAnalysis}
                                  >
                                    다시 분석하기
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="blue"
                                  size="xl"
                                  className="shadow-point-blue/20 w-full rounded-2xl py-4! text-2xl! font-black shadow-xl"
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
                                className="bg-silver-mist text-slate-gray w-full cursor-not-allowed rounded-2xl py-4! text-2xl! font-black"
                                disabled
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-silver-mist bg-pure-white rounded-4xl border p-12 shadow-xl shadow-gray-200/50"
              >
                <div className="flex flex-col items-center space-y-12 py-4 text-center">
                  <div className="relative h-48 w-48">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      className="border-point-blue/20 absolute inset-0 rounded-full border-t-4 border-b-4"
                    />
                    <svg
                      className="absolute inset-0 h-full w-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        className="text-cloud-dancer stroke-current"
                        strokeWidth="6"
                        cx="50"
                        cy="50"
                        r="44"
                        fill="transparent"
                      />
                      <motion.circle
                        className="text-point-blue stroke-current"
                        strokeWidth="6"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="44"
                        fill="transparent"
                        strokeDasharray="276"
                        animate={{ strokeDashoffset: 276 - (276 * progress) / 100 }}
                        transition={{ duration: 0.1, ease: 'linear' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-point-blue text-5xl font-black tracking-tighter tabular-nums">
                        {Math.floor(progress)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full space-y-10">
                    <div className="min-h-24">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeStageId}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="space-y-2"
                        >
                          <h3 className="text-midnight-ink text-3xl font-black tracking-tight">
                            {STAGES[activeStageId].label}
                          </h3>
                          <p className="text-slate-gray text-lg font-bold opacity-60">
                            {STAGES[activeStageId].description}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-center gap-14">
                      {STAGES.map((stage) => {
                        const isReached = progress >= stage.threshold;
                        const isCurrentPart = activeStageId === stage.id;
                        return (
                          <div key={stage.id} className="relative flex flex-col items-center gap-4">
                            <div className="relative h-6 w-6">
                              <AnimatePresence>
                                {isCurrentPart && (
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 2.4, opacity: [0, 0.4, 0] }}
                                    transition={{
                                      duration: 1.8,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                    }}
                                    className="bg-point-blue absolute inset-0 rounded-full"
                                  />
                                )}
                              </AnimatePresence>
                              <div
                                className={`relative h-6 w-6 rounded-full transition-all duration-1000 ease-in-out ${isReached ? 'bg-point-blue scale-110 shadow-lg' : 'bg-silver-mist'}`}
                              />
                            </div>
                            <span
                              className={`text-sm font-black transition-colors duration-700 ${isReached ? 'text-point-blue' : 'text-slate-gray opacity-30'}`}
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
                <div className="border-midnight-ink -mt-4 flex items-end justify-between border-b-4 pb-6">
                  <h2 className="text-midnight-ink text-5xl font-black tracking-tighter">
                    진단 리포트
                  </h2>
                  <div className="text-right">
                    <p className="text-slate-gray text-sm font-bold opacity-40">TARGET FILE</p>
                    <p className="text-midnight-ink max-w-xs truncate text-lg font-black">
                      {selectedPortfolio?.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="border-silver-mist bg-cloud-dancer/30 flex flex-1 items-center justify-between rounded-3xl border px-8 py-5 shadow-sm">
                    <p className="text-slate-gray text-sm font-black uppercase opacity-50">
                      Total Projects
                    </p>
                    <p className="text-midnight-ink text-3xl font-black">
                      {analysisData.projects?.length || 0}
                    </p>
                  </div>
                  <div className="border-silver-mist bg-cloud-dancer/30 flex flex-1 items-center justify-between rounded-3xl border px-8 py-5 shadow-sm">
                    <p className="text-slate-gray text-sm font-black uppercase opacity-50">
                      Key Tech Stacks
                    </p>
                    <p className="text-midnight-ink text-3xl font-black">
                      {analysisData.techStacks.length}
                    </p>
                  </div>
                </div>
                <div className="space-y-12">
                  <section>
                    <div className="mb-8 flex items-center gap-3">
                      <div className="bg-point-blue h-6 w-1.5 rounded-full" />
                      <h3 className="text-midnight-ink text-2xl font-black tracking-tight">
                        상세 프로젝트 분석
                      </h3>
                    </div>
                    <div className="grid gap-6">
                      {analysisData.projects?.map((proj, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedProject(proj)}
                          className="group border-silver-mist bg-pure-white flex w-full cursor-pointer items-center justify-between rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50"
                        >
                          <div className="flex items-center gap-7">
                            <span className="bg-pure-white text-point-blue border-silver-mist group-hover:bg-point-blue flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-xl font-black tabular-nums transition-colors group-hover:text-white">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-midnight-ink group-hover:text-point-blue truncate text-2xl font-black tracking-tight transition-colors">
                                {proj.name}
                              </h4>
                              <div className="mt-2 flex gap-2.5">
                                {proj.tech.slice(0, 4).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-full bg-emerald-50 px-4 py-1 text-sm font-black tracking-tight text-emerald-600"
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {proj.tech.length > 4 && (
                                  <span className="text-slate-gray py-1 text-xs font-bold opacity-40">
                                    외 {proj.tech.length - 4}개
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section>
                    <div className="mb-8 flex items-center gap-3">
                      <div className="bg-point-blue h-6 w-1.5 rounded-full" />
                      <h3 className="text-midnight-ink text-2xl font-black tracking-tight">
                        기술 스택 인벤토리
                      </h3>
                    </div>
                    <div className="border-silver-mist bg-pure-white rounded-4xl border p-10 shadow-sm">
                      <div className="flex flex-wrap gap-3.5">
                        {analysisData.techStacks.map((tech) => (
                          <div
                            key={tech}
                            className="border-silver-mist bg-cloud-dancer/20 hover:border-point-blue/40 hover:bg-point-blue/5 flex items-center gap-3 rounded-2xl border px-6 py-4.5 shadow-sm transition-all hover:-translate-y-1"
                          >
                            <div className="bg-point-blue h-2 w-2 rounded-full" />
                            <span className="text-midnight-ink text-base font-black tracking-tight">
                              {tech}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
                <div className="flex gap-5 pt-10">
                  <Button
                    variant="blue"
                    size="xl"
                    className="shadow-point-blue/20 flex-2 rounded-2xl py-6! text-xl! font-black shadow-xl"
                    onClick={() => navigate('/recommend/companies')}
                  >
                    이 역량으로 맞춤 공고 확인하기
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="flex-1 rounded-2xl py-6! text-xl! font-black"
                    onClick={() => {
                      setSelectedPortfolioId(null);
                      setStep('upload');
                      setAnalysisData(null);
                      setProgress(0);
                    }}
                  >
                    다시 분석하기
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
