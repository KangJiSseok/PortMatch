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

function PortfoliosPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [file, setFile] = useState<File | null>(null);
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

  const handleAnalysis = async () => {
    if (!file) return;

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
        if (currentStage) {
          setActiveStage(currentStage.id);
        }
        return nextProgress;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await axios.post('/api/portfolios', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const portfolioId = uploadRes.data.portfolioId;

      const resultRes = await axios.get(`/api/portfolios/${portfolioId}/analysis`);

      setAnalysisData({
        strengths: resultRes.data.strengths || [],
        techStacks: resultRes.data.techStacks || [],
      });

      clearInterval(progressInterval);
      setProgress(100);
      setActiveStage(2);

      setTimeout(() => {
        setStep('result');
      }, 800);
    } catch (error) {
      console.error(error);
      alert('분석 중 오류가 발생했습니다.');
      setStep('upload');
      clearInterval(progressInterval);
    }
  };

  const runTestSimulation = (speed = 20, increment = 5) => {
    setStep('analyzing');
    setProgress(0);
    setActiveStage(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + increment;
        const currentStage = [...stages].reverse().find((s) => nextProgress >= s.threshold);
        if (currentStage) setActiveStage(currentStage.id);

        if (nextProgress >= 100) {
          clearInterval(interval);
          setAnalysisData({
            strengths: [
              '고성능 엔터프라이즈 시스템 아키텍처 설계 및 최적화',
              'React Core 라이프사이클에 최적화된 고도화 렌더링 성능 개선',
              '비즈니스 로직 설계 및 코드 가독성 우수',
            ],
            techStacks: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Recoil', 'GraphQL', 'AWS'],
          });
          setTimeout(() => setStep('result'), 800);
          return 100;
        }
        return nextProgress;
      });
    }, speed);
  };

  return (
    <div className="bg-pure-white text-midnight-ink min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-6">
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
                  className="space-y-10 text-center"
                >
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-soft-pebble hover:border-point-blue/40 hover:bg-cloud-dancer/20 relative cursor-pointer rounded-4xl border-2 border-dashed p-16 transition-all duration-300"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files && setFile(e.target.files[0])}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                    />
                    <div className="space-y-6">
                      <div className="bg-silver-mist group-hover:bg-point-blue mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:text-white">
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
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black tracking-tight">
                          {file ? file.name : '포트폴리오 업로드'}
                        </h3>
                        <p className="text-slate-gray text-sm font-bold tracking-widest uppercase opacity-40">
                          PDF, DOC, DOCX
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <Button
                      variant="blue"
                      size="xl"
                      disabled={!file}
                      className="rounded-2xl py-6! text-2xl! font-black transition-all"
                      onClick={handleAnalysis}
                    >
                      분석 시작하기
                    </Button>
                    <button
                      type="button"
                      className="border-b border-red-100 pb-1 text-[10px] font-black tracking-widest text-red-400 uppercase transition-colors hover:text-red-600"
                      onClick={() => runTestSimulation()}
                    >
                      [DEV] 즉시 분석 테스트
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12 py-10 text-center"
                >
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
                        className="text-soft-pebble stroke-current"
                        strokeWidth="4"
                        cx="50"
                        cy="50"
                        r="46"
                        fill="transparent"
                      />
                      <motion.circle
                        className="text-point-blue stroke-current shadow-[0_0_15px_rgba(81,81,231,0.4)]"
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
                      <span className="text-point-blue text-5xl font-black tracking-tighter tabular-nums">
                        {progress}%
                      </span>
                      <span className="text-slate-gray mt-1 text-[10px] font-black tracking-widest uppercase opacity-50">
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
                        className="text-midnight-ink text-2xl font-black tracking-tight"
                      >
                        {stages[activeStage].label}
                      </motion.h3>
                      <motion.p
                        key={`desc-${activeStage}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        className="text-slate-gray font-medium"
                      >
                        {stages[activeStage].description}
                      </motion.p>
                    </div>

                    <div className="flex items-center justify-center gap-12">
                      {stages.map((stage) => {
                        const isCompleted = progress >= (stages[stage.id + 1]?.threshold ?? 100);
                        const isActive = activeStage === stage.id && !isCompleted;

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
                                className={`relative h-4 w-4 rounded-full transition-all duration-500 ${
                                  progress >= stage.threshold
                                    ? 'bg-point-blue scale-125 shadow-[0_0_10px_rgba(81,81,231,0.6)]'
                                    : 'bg-soft-pebble'
                                }`}
                              />
                            </div>
                            <span
                              className={`text-xs font-black transition-colors duration-500 ${
                                progress >= stage.threshold ? 'text-point-blue' : 'text-soft-pebble'
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'result' && analysisData && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                  <div className="border-point-blue border-b-4 pb-6 text-left">
                    <p className="text-slate-gray mb-1 text-sm font-black tracking-widest uppercase opacity-40">
                      Match Complete
                    </p>
                    <h2 className="text-4xl leading-none font-black tracking-tighter uppercase">
                      분석 결과 리포트
                    </h2>
                  </div>

                  <div className="flex flex-col gap-8">
                    <div className="bg-cloud-dancer border-silver-mist space-y-8 rounded-4xl border p-10 text-left shadow-sm">
                      <h4 className="border-point-blue text-midnight-ink border-l-6 pl-6 text-3xl font-black tracking-tighter">
                        핵심 역량 키워드
                      </h4>
                      <div className="space-y-5">
                        {analysisData.strengths.map((text) => (
                          <div key={text} className="flex items-start gap-4">
                            <div className="bg-point-blue mt-2 h-2 w-2 shrink-0 rounded-full" />
                            <span className="text-midnight-ink text-xl leading-snug font-bold opacity-80">
                              {text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-cloud-dancer border-silver-mist space-y-8 rounded-4xl border p-10 text-left shadow-sm">
                      <h4 className="border-point-blue text-midnight-ink border-l-6 pl-6 text-3xl font-black tracking-tighter">
                        추천 기술 스택
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {analysisData.techStacks.map((tech) => (
                          <span
                            key={tech}
                            className="bg-pure-white text-midnight-ink border-silver-mist rounded-xl border px-6 py-2.5 text-lg font-black tracking-tighter opacity-80"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="blue"
                      size="xl"
                      className="flex-1 rounded-2xl py-6! text-2xl! font-black shadow-xl transition-all"
                      onClick={() => navigate('/main')}
                    >
                      맞춤 공고 확인하기
                    </Button>
                    <Button
                      variant="dark"
                      size="xl"
                      className="flex-1 rounded-2xl border py-6! text-2xl! font-black transition-all"
                      onClick={() => {
                        setFile(null);
                        setStep('upload');
                        setAnalysisData(null);
                      }}
                    >
                      다시 분석
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PortfoliosPage;
