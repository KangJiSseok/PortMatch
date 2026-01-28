import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="bg-pure-white flex min-h-screen justify-center overflow-x-auto select-none">
      <div className="w-350 min-w-350 px-6 pt-24 pb-16">
        <header className="border-point-blue mt-4 mb-10 ml-6 flex items-end justify-between border-l-4 pl-6">
          <div className="min-w-0 flex-1">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
            >
              Resume Analysis
            </motion.h1>
            <div className="flex flex-col items-start">
              <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
                AI가 당신의 이력서를 정밀 분석하여 합격 가능성을 높여드립니다.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 items-start gap-10">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-pure-white flex flex-col rounded-[40px] border border-gray-100 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <h2 className="text-midnight-ink text-2xl font-black tracking-tight uppercase">
                Input Details
              </h2>
            </div>

            <div className="flex flex-col gap-8">
              <Input
                label="희망 직무"
                placeholder="예: 프론트엔드 개발자"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <div className="flex flex-col gap-3">
                <label className="text-midnight-ink ml-1 text-sm font-black">이력서 내용</label>
                <textarea
                  className="bg-cloud-dancer/20 border-soft-pebble/30 focus:border-point-blue min-h-100 w-full rounded-3xl border p-6 text-lg font-bold transition-all outline-none"
                  placeholder="분석할 이력서 내용을 붙여넣으세요..."
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                />
              </div>
              <Button
                variant="blue"
                size="lg"
                className="rounded-2xl py-5 text-xl font-black shadow-xl"
                onClick={handleAnalyze}
                disabled={isLoading}
              >
                {isLoading ? '분석 중...' : 'AI 첨삭 시작하기'}
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-pure-white flex min-h-200 flex-col rounded-[40px] border border-gray-100 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <h2 className="text-midnight-ink text-2xl font-black tracking-tight uppercase">
                Analysis Result
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-10"
                >
                  <div>
                    <h4 className="text-point-blue mb-4 text-lg font-black tracking-widest uppercase">
                      Strengths
                    </h4>
                    <div className="flex flex-col gap-3">
                      {result.strengths.map((s, i) => (
                        <div
                          key={i}
                          className="bg-point-blue/5 text-midnight-ink border-point-blue rounded-2xl border-l-4 p-5 font-bold"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-error mb-4 text-lg font-black tracking-widest uppercase">
                      Needs Improvement
                    </h4>
                    <div className="flex flex-col gap-3">
                      {result.weaknesses.map((w, i) => (
                        <div
                          key={i}
                          className="bg-error/5 text-midnight-ink border-error rounded-2xl border-l-4 p-5 font-bold"
                        >
                          {w}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center opacity-20">
                  <span className="mb-4 text-6xl">📄</span>
                  <p className="text-xl font-bold italic">분석 결과가 여기에 표시됩니다.</p>
                </div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default ResumeFeedbackPage;
