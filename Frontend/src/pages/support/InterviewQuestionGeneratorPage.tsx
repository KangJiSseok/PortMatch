import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="bg-pure-white flex min-h-screen justify-center overflow-x-auto select-none">
      <div className="w-350 min-w-350 px-6 pt-24 pb-16">
        <header className="border-point-blue mt-4 mb-10 ml-6 flex items-end justify-between border-l-4 pl-6">
          <div className="min-w-0 flex-1">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
            >
              Interview Generator
            </motion.h1>
            <div className="flex flex-col items-start">
              <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
                채용 공고를 분석하여 해당 직무에 최적화된 면접 질문 리스트를 생성합니다.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-[1.2fr_1.8fr] items-start gap-10">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-pure-white flex h-[720px] flex-col rounded-[40px] border border-gray-100 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <h2 className="text-midnight-ink text-2xl font-black tracking-tight uppercase">
                Job JD / Requirement
              </h2>
            </div>

            <div className="flex flex-1 flex-col gap-6">
              <div className="flex flex-1 flex-col gap-3">
                <label className="text-midnight-ink ml-1 text-sm font-black">
                  채용 공고 및 주요 자격 요건
                </label>
                <textarea
                  className="bg-cloud-dancer/20 border-soft-pebble/30 focus:border-point-blue w-full flex-1 resize-none rounded-3xl border p-6 text-lg font-bold transition-all outline-none"
                  placeholder="직무 설명(JD)이나 필수 역량, 우대 사항 등을 입력하세요..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button
                variant="blue"
                size="lg"
                className="rounded-2xl py-5 text-xl font-black shadow-xl"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? '질문 생성 중...' : 'AI 추천 질문 생성'}
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-pure-white flex h-[720px] flex-col rounded-[40px] border border-gray-100 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-point-blue h-6 w-1.5 rounded-full" />
                <h2 className="text-midnight-ink text-2xl font-black tracking-tight uppercase">
                  Recommendation
                </h2>
              </div>
              {questions.length > 0 && (
                <span className="text-point-blue text-sm font-black uppercase">
                  Result: {questions.length} Items
                </span>
              )}
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
              <AnimatePresence mode="wait">
                {questions.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {questions.map((q, idx) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-pure-white group relative flex flex-col rounded-[30px] border border-slate-100 p-6 shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <span className="bg-point-blue/10 text-point-blue rounded-lg px-2.5 py-1 text-[11px] font-black uppercase">
                            {q.category}
                          </span>
                        </div>
                        <h3 className="text-midnight-ink mb-4 text-xl leading-snug font-black">
                          {q.question}
                        </h3>
                        <div className="bg-cloud-dancer/40 rounded-2xl p-4">
                          <p className="text-slate-gray text-xs leading-relaxed font-bold">
                            <span className="text-point-blue mr-1 uppercase">
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
                    <span className="mb-6 text-6xl">🎯</span>
                    <p className="text-center text-xl font-bold italic">
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
