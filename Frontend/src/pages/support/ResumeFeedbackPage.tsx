import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  PenTool,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Layout,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import { portfolioApi } from '../../api/portfolioApi';

// --- Interfaces (제공해주신 데이터 구조 반영) ---
interface PortfolioAnalysisResponse {
  projects: {
    name: string;
    problem: string;
    solution: string;
    tech: string[];
    feedback: {
      missing: string[];
      issues: string[];
      questions: string[];
      rewritten: {
        problem: string;
        solution: string;
      };
    };
  }[];
}

const ResumeFeedbackPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisData, setAnalysisData] = useState<PortfolioAnalysisResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | number | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로딩 메시지 리스트
  const loadingMessages = [
    '포트폴리오 파일에서 텍스트를 정밀하게 추출하고 있습니다...',
    'AI가 프로젝트의 맥락과 기술 스택을 분석 중입니다...',
    '기존 채용 시장의 데이터와 비교하여 개선점을 찾는 중입니다...',
    '면접관의 시선에서 예상 질문 리스트를 생성하고 있습니다...',
    '최종 분석 결과를 정리하여 처방전을 구성 중입니다...',
  ];

  // 로딩 단계 애니메이션 효과
  useEffect(() => {
    // 변수를 선언할 때 undefined로 초기화해두면 안전합니다.
    let interval: ReturnType<typeof setInterval> | undefined; 

    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 3000);
    } else {
      setLoadingStep(0);
    }

    // interval이 존재할 때만 정리(clean-up)
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // --- 비즈니스 로직 함수들 ---

  const processFile = async (uploadedFile: File) => {
    if (uploadedFile.type !== 'application/pdf') {
      setUploadError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    try {
      setIsLoading(true);
      setUploadError('');
      const response = await portfolioApi.uploadPortfolio(uploadedFile);
      // API 응답 구조에 따라 response.id 혹은 response.data.id 등 확인 필요
      setSelectedPortfolioId(response.id);
      setUploadedFileName(response.originalFilename);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setUploadError('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 아까 빼먹었던 그 함수입니다!
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPortfolioId) return;
    try {
      setIsLoading(true);
      const data = await portfolioApi.requestAnalysisV2(selectedPortfolioId);
      // API 응답 데이터(data.projects 등) 세팅
      setAnalysisData(data);
      console.log(data);
      setCurrentStep(0);
    } catch (error) {
      setUploadError('분석 요청 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI 내부 컴포넌트 ---

  const LoadingState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col items-center justify-center p-12 text-center"
    >
      <div className="relative mb-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="relative z-10"
        >
          <Loader2 size={100} className="text-point-blue opacity-10" strokeWidth={1} />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 z-20 flex items-center justify-center"
        >
          <Sparkles size={40} className="text-point-blue" />
        </motion.div>
      </div>
      <h3 className="text-midnight-ink mb-3 text-2xl font-black tracking-tighter uppercase">
        AI Analyzing...
      </h3>
      <AnimatePresence mode="wait">
        <motion.p
          key={loadingStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-slate-gray text-lg font-bold italic opacity-60"
        >
          {loadingMessages[loadingStep]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );

  const ProjectCard = ({ project }: { project: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="space-y-3">
        <h3 className="text-midnight-ink text-2xl leading-tight font-black">{project.name}</h3>
        <div className="flex flex-wrap gap-1.5">
          {project.tech?.map((t: string) => (
            <span
              key={t}
              className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-slate-500 uppercase"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-error/5 border-error/10 rounded-2xl border p-5">
          <h4 className="text-error mb-3 flex items-center gap-1.5 text-xs font-black tracking-widest uppercase">
            <AlertCircle size={14} /> Critical Missing
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.feedback.missing.map((m: string) => (
              <span
                key={m}
                className="border-error/20 text-error rounded-lg border bg-white px-3 py-1 text-[11px] font-black uppercase"
              >
                {m}
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-1.5">
            {project.feedback.issues.map((issue: string, i: number) => (
              <li key={i} className="text-error/70 flex gap-2 text-[12px] font-bold">
                <span>•</span> <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-midnight-ink rounded-2xl p-5 text-white/90 shadow-xl">
          <h4 className="text-point-blue mb-4 flex items-center gap-1.5 text-xs font-black tracking-widest uppercase">
            <MessageSquare size={14} /> Interview Prep
          </h4>
          <div className="space-y-3">
            {project.feedback.questions.slice(0, 3).map((q: string, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-[12px] leading-snug font-medium"
              >
                <span className="text-point-blue mr-2 font-black italic">Q.</span> {q}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-midnight-ink text-sm font-black tracking-widest uppercase opacity-40">
          AI Rewrite Suggestion
        </h4>
        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50">
            <div className="border-r border-slate-100 p-3 text-center text-[11px] font-black text-slate-400 uppercase">
              Original
            </div>
            <div className="text-point-blue p-3 text-center text-[11px] font-black uppercase">
              AI Improved ✨
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100 bg-white">
            <div className="space-y-4 p-5 italic opacity-30">
              <p className="text-[13px] leading-relaxed">{project.feedback.rewritten.problem}</p>
            </div>
            <div className="bg-point-blue/[0.02] space-y-4 p-5">
              <p className="text-midnight-ink decoration-point-blue/20 text-[14px] leading-relaxed font-bold underline underline-offset-4">
                {project.feedback.rewritten.solution}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="bg-pure-white min-h-screen pt-32 pb-32 select-none">
      <div className="mx-auto w-6xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
            Portfolio Editing
          </h1>
          <p className="text-slate-gray mt-2 text-lg font-bold italic opacity-40">
            AI-powered comprehensive solution
          </p>
        </header>

        <div className="flex h-[750px] items-stretch gap-8">
          {/* Left: Input */}
          <section className="bg-pure-white flex w-80 shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg">
            <div className="mb-6 flex items-center gap-2">
              <div className="bg-point-blue h-5 w-1.5 rounded-full" />
              <PenTool size={20} className="text-midnight-ink" />
              <h2 className="text-midnight-ink text-xl font-black tracking-tight uppercase">
                Input
              </h2>
            </div>

            <div className="flex flex-1 flex-col gap-6 overflow-hidden">
              <div
                className={`flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${isDragging ? 'border-point-blue bg-point-blue/5' : 'border-gray-100 bg-slate-50'}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <FileText
                  size={40}
                  className={`mb-4 transition-colors ${uploadedFileName ? 'text-point-blue' : 'text-slate-300'}`}
                />

                {/* 텍스트 넘침 방지 (truncate) */}
                <div className="w-full overflow-hidden px-2">
                  <p
                    className="text-midnight-ink mb-4 truncate text-sm font-black"
                    title={uploadedFileName}
                  >
                    {uploadedFileName || '포트폴리오 PDF 업로드'}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  파일 선택
                </Button>
                {uploadError && (
                  <p className="text-error mt-3 text-xs leading-tight font-bold">{uploadError}</p>
                )}
              </div>

              <Button
                variant="blue"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-black shadow-md"
                onClick={handleAnalyze}
                disabled={isLoading || !selectedPortfolioId}
              >
                <Sparkles size={20} />
                {isLoading ? '분석 중...' : '분석 시작하기'}
              </Button>
            </div>
          </section>

          {/* Right: Interactive Result/Wizard */}
          <section className="bg-pure-white relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 p-7 shadow-xl">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <LoadingState key="loading" />
              ) : analysisData ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col"
                >
                  <div className="custom-scrollbar mb-8 flex gap-2 overflow-x-auto pb-2">
                    {analysisData.projects.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-widest whitespace-nowrap uppercase transition-all ${currentStep === i ? 'bg-midnight-ink text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        Project 0{i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentStep(analysisData.projects.length)}
                      className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-widest whitespace-nowrap uppercase transition-all ${currentStep === analysisData.projects.length ? 'bg-point-blue text-white shadow-md' : 'bg-point-blue/10 text-point-blue'}`}
                    >
                      Summary
                    </button>
                  </div>

                  <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
                    {currentStep < analysisData.projects.length ? (
                      <ProjectCard project={analysisData.projects[currentStep]} />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                        <div className="bg-point-blue/10 mb-8 flex h-24 w-24 items-center justify-center rounded-full">
                          <CheckCircle2 size={48} className="text-point-blue" />
                        </div>
                        <h3 className="text-midnight-ink mb-3 text-3xl font-black tracking-tighter uppercase">
                          Mission Success
                        </h3>
                        <p className="text-slate-gray mb-10 text-lg font-bold italic opacity-60">
                          포트폴리오의 품질이 한 단계 업그레이드되었습니다.
                        </p>
                        <Button
                          variant="blue"
                          className="rounded-2xl px-12 py-5 text-lg font-black"
                          onClick={() => {
                            setAnalysisData(null);
                            setUploadedFileName('');
                          }}
                        >
                          분석 종료 및 다시하기
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 border-slate-200 font-black"
                      disabled={currentStep === 0}
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                    >
                      <ChevronLeft size={18} /> Prev
                    </Button>
                    <div className="text-[10px] font-black tracking-[0.4em] text-slate-300 uppercase">
                      Step {currentStep + 1} / {analysisData.projects.length + 1}
                    </div>
                    {currentStep < analysisData.projects.length ? (
                      <Button
                        variant="blue"
                        className="flex items-center gap-2 px-10 font-black shadow-sm"
                        onClick={() => setCurrentStep((prev) => prev + 1)}
                      >
                        Next <ChevronRight size={18} />
                      </Button>
                    ) : (
                      <div className="w-[110px]" />
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center opacity-20">
                  <Layout size={80} strokeWidth={1} className="text-midnight-ink mb-6" />
                  <p className="text-xl font-black tracking-tight uppercase italic">
                    Ready to analyze
                  </p>
                  <p className="mt-2 text-sm font-bold">파일을 업로드하면 AI 마법이 시작됩니다.</p>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResumeFeedbackPage;
