import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, ListChecks } from 'lucide-react';
import Button from '../../components/Button/Button';

interface GeneratedQuestion {
  id: string;
  category: string;
  question: string;
  intent: string;
}

const InterviewQuestionGeneratorPage = () => {
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
      const data = await response.json();
      setQuestions(data);
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
            Interview Generator
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            채용 공고를 분석하여 해당 직무에 최적화된 면접 질문 리스트를 생성합니다.
          </p>
        </header>

        <div className="flex h-132 items-stretch gap-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pure-white flex w-96 shrink-0 flex-col rounded-3xl border border-gray-100 p-8 shadow-lg"
          >
            <div className="mb-6 flex items-center gap-2">
              <div className="bg-point-blue h-5 w-1.5 rounded-full" />
              <FileText size={20} className="text-midnight-ink" />
              <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
                Job JD / Requirement
              </h2>
            </div>

            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-midnight-ink ml-1 text-xs font-black whitespace-nowrap opacity-60">
                  채용 공고 및 주요 자격 요건
                </label>
                <textarea
                  className="bg-cloud-dancer/20 border-soft-pebble/30 focus:border-point-blue w-full flex-1 resize-none rounded-2xl border p-5 text-base font-bold transition-all outline-none"
                  placeholder="직무 설명(JD)이나 필수 역량, 우대 사항 등을 입력하세요..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button
                variant="blue"
                size="md"
                className="flex items-center justify-center gap-2 rounded-xl py-4 text-lg font-black whitespace-nowrap shadow-md"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                <Sparkles size={20} />
                {isLoading ? '질문 생성 중...' : 'AI 추천 질문 생성'}
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pure-white flex flex-1 flex-col rounded-3xl border border-gray-100 p-8 shadow-lg"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-point-blue h-5 w-1.5 rounded-full" />
                <ListChecks size={20} className="text-midnight-ink" />
                <h2 className="text-midnight-ink text-xl font-black tracking-tight whitespace-nowrap uppercase">
                  Recommendation
                </h2>
              </div>
              {questions.length > 0 && (
                <span className="text-point-blue text-xs font-black whitespace-nowrap uppercase">
                  Result: {questions.length} Items
                </span>
              )}
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
              <AnimatePresence mode="wait">
                {questions.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {questions.map((q, idx) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-pure-white group relative flex flex-col rounded-2xl border border-slate-100 p-5 shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="bg-point-blue/10 text-point-blue rounded-md px-2 py-0.5 text-[10px] font-black whitespace-nowrap uppercase">
                            {q.category}
                          </span>
                        </div>
                        <h3 className="text-midnight-ink mb-3 text-lg leading-snug font-black">
                          {q.question}
                        </h3>
                        <div className="bg-cloud-dancer/40 rounded-xl p-3">
                          <p className="text-slate-gray text-[11px] leading-relaxed font-bold">
                            <span className="text-point-blue mr-1 font-black whitespace-nowrap uppercase">
                              Evaluation Intent:
                            </span>{' '}
                            {q.intent}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center opacity-20">
                    <Sparkles size={64} className="text-midnight-ink mb-4" />
                    <p className="text-center text-lg leading-relaxed font-bold whitespace-nowrap italic">
                      공고 정보를 입력하면
                      <br />
                      AI가 추천 질문을 뽑아냅니다.
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

export default InterviewQuestionGeneratorPage;
