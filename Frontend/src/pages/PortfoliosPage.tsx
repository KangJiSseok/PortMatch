import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
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
    { id: 1, name: '2024_프론트엔드_이력서_최종.pdf' },
    { id: 2, name: '경력기술서_백엔드_v2.docx' },
    { id: 3, name: '개인프로젝트_포트폴리오.pdf' },
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

  const handleAnalysis = async () => {
    if (!selectedPortfolioId) return;
    setStep('analyzing');
    setProgress(0);
    setActiveStage(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const nextProgress = prev + 1;
        const currentStage = [...stages].reverse().find((s) => nextProgress >= s.threshold);
        if (currentStage) setActiveStage(currentStage.id);
        return nextProgress;
      });
    }, 100);
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setAnalysisData({
        strengths: [
          '고성능 엔터프라이즈 시스템 아키텍처 설계 및 최적화',
          'React Core 라이프사이클에 최적화된 고도화 렌더링 성능 개선',
          '비즈니스 로직 설계 및 코드 가독성 우수',
        ],
        techStacks: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Recoil', 'GraphQL', 'AWS'],
      });
      clearInterval(progressInterval);
      setProgress(100);
      setActiveStage(2);
      setTimeout(() => setStep('result'), 800);
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

  return (
    <div className="bg-pure-white text-midnight-ink min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-6">
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
                <h3 className="text-midnight-ink mb-2 text-2xl font-black tracking-tight">
                  {modal.title}
                </h3>
                <p className="text-slate-gray mb-10 leading-relaxed font-bold opacity-60">
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
                        variant="blue"
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

        <header className="border-point-blue mb-10 border-l-4 pl-6 text-left">
          <h1 className="mb-2 text-4xl leading-none font-black tracking-tighter uppercase">
            Portfolio Analysis
          </h1>
          <p className="text-slate-gray text-lg font-bold italic opacity-40">
            데이터로 증명하는 당신의 커리어 가치
          </p>
        </header>

        <main className="border-silver-mist relative overflow-hidden rounded-[40px] border bg-white shadow-xl">
          <div className="flex min-h-125 flex-col justify-center bg-white p-12">
            <AnimatePresence mode="wait">
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-8 text-center"
                >
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
                            className={`text-xl font-black tracking-tight ${selectedPortfolioId ? 'text-point-blue' : 'text-midnight-ink'}`}
                          >
                            {selectedPortfolioId
                              ? savedPortfolios.find((p) => p.id === selectedPortfolioId)?.name
                              : '저장된 포트폴리오 선택'}
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
                                    setFile(p.fileObject || null);
                                    setIsListOpen(false);
                                    setShowTooltip(false);
                                  }}
                                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-6 py-4 text-left transition-colors ${selectedPortfolioId === p.id ? 'bg-point-blue/5 text-point-blue' : 'hover:bg-cloud-dancer text-midnight-ink/70'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => handleOpenFile(e, p)}
                                      className="hover:text-point-blue p-1 transition-colors"
                                      title="문서 보기"
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
                                    <span className="text-lg font-bold">{p.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {p.isLocal && (
                                      <span className="bg-point-blue/10 rounded-md px-2 py-1 text-[10px] font-black uppercase">
                                        New
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => handleDeletePortfolio(e, p.id)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                    >
                                      <svg
                                        width="18"
                                        height="18"
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
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-gray py-10 font-bold opacity-40">
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
                      className={`group relative cursor-pointer rounded-4xl border-2 border-dashed py-12 transition-all duration-300 ${isDragging ? 'border-point-blue bg-point-blue/5 scale-[1.01] shadow-inner' : 'border-soft-pebble hover:border-point-blue/40 hover:bg-cloud-dancer/20'}`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                      />
                      <div className="pointer-events-none flex flex-col items-center gap-4">
                        <motion.div
                          animate={isDragging ? { y: [0, -10, 0] } : {}}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 ${isDragging ? 'bg-point-blue text-white' : 'bg-silver-mist text-slate-gray group-hover:bg-point-blue group-hover:text-white'}`}
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
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </motion.div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black tracking-tight">
                            {isDragging ? '여기에 놓으세요!' : '새 포트폴리오 업로드'}
                          </h3>
                          <p className="text-slate-gray text-[14px] font-bold tracking-widest uppercase opacity-40">
                            파일을 드래그하거나 클릭하여 추가하세요
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
                      <Button
                        variant="blue"
                        size="xl"
                        disabled={!selectedPortfolioId}
                        className="disabled:bg-silver-mist disabled:text-slate-gray w-full rounded-2xl py-6! text-2xl! font-black shadow-xl transition-all disabled:cursor-not-allowed"
                        onClick={handleAnalysis}
                      >
                        분석 시작하기
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 분석 중, 결과 화면 생략 (기존과 동일) */}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PortfoliosPage;
