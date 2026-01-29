import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  PenTool,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';

interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

const ResumeFeedbackPage = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!jobTitle || !resumeContent) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/resume-analyze', {
        method: 'POST',
        body: JSON.stringify({ jobTitle, resumeContent }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32 select-none">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Resume Analysis
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            AI가 당신의 이력서를 정밀 분석하여 합격 가능성을 높여드립니다.
          </p>
        </header>

        <div className="flex h-132 items-stretch gap-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-88 shrink-0 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="mb-6 flex items-center gap-2">
              <div className="bg-point-blue h-5 w-1.5 rounded-full" />
              <PenTool size={20} className="text-midnight-ink" />
              <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
                입력 정보
              </h2>
            </div>

            <div className="flex flex-1 flex-col gap-6">
              <div className="shrink-0">
                <Input
                  label="희망 직무"
                  placeholder="예: 프론트엔드 개발자"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <label className="text-midnight-ink ml-1 text-xs font-black whitespace-nowrap opacity-60">
                  이력서 내용
                </label>
                <textarea
                  className="bg-cloud-dancer/20 border-soft-pebble/30 focus:border-point-blue w-full flex-1 resize-none rounded-2xl border p-5 text-base font-bold transition-all outline-none"
                  placeholder="분석할 이력서 내용을 붙여넣으세요..."
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                />
              </div>
              <Button
                variant="blue"
                size="md"
                className="flex items-center justify-center gap-2 rounded-xl py-4 text-lg font-black whitespace-nowrap shadow-md"
                onClick={handleAnalyze}
                disabled={isLoading}
              >
                <Sparkles size={20} />
                {isLoading ? '분석 중...' : 'AI 첨삭 시작하기'}
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pure-white flex flex-1 flex-col rounded-3xl border border-gray-100 p-7 shadow-lg"
          >
            <div className="mb-6 flex items-center gap-2">
              <div className="bg-point-blue h-5 w-1.5 rounded-full" />
              <ClipboardCheck size={20} className="text-midnight-ink" />
              <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
                분석 결과
              </h2>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-8"
                  >
                    <div>
                      <h4 className="text-point-blue mb-4 flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                        <CheckCircle2 size={16} />
                        핵심 강점
                      </h4>
                      <div className="flex flex-col gap-3">
                        {result.strengths.map((s, i) => (
                          <div
                            key={i}
                            className="bg-point-blue/5 text-midnight-ink border-point-blue/20 rounded-2xl border-l-4 p-5 text-[15px] leading-relaxed font-semibold break-keep whitespace-pre-wrap shadow-sm"
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-error mb-4 flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                        <AlertCircle size={16} />
                        보완이 필요한 점
                      </h4>
                      <div className="flex flex-col gap-3">
                        {result.weaknesses.map((w, i) => (
                          <div
                            key={i}
                            className="bg-error/5 text-midnight-ink border-error/20 rounded-2xl border-l-4 p-5 text-[15px] leading-relaxed font-semibold break-keep whitespace-pre-wrap shadow-sm"
                          >
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center opacity-20">
                    <FileText size={64} className="text-midnight-ink mb-4" />
                    <p className="text-center text-lg leading-relaxed font-bold whitespace-nowrap italic">
                      분석 결과가 여기에 표시됩니다.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default ResumeFeedbackPage;
